import { escapeTarget, unescapeTarget } from '../components/common/index';
import { requestStatus } from '../components/constant/index';
import { autoFuzz } from '../server';
var moment = require('moment');
var moment = require('moment-timezone');
const request = require('request-promise-native');
const globalConfig = require("../globalConfig");

let mySqlConnection;

export default class targetService {
    constructor(injectedMySqlConnection) {
        mySqlConnection = injectedMySqlConnection;
    }

    /**
     * Save fuzzing request to database
     * 
     * @param {string} targetId     (JSON formatted) base request
     * @param {string} vulnTypes    (JSON formatted) types of vulnerabilities need to fuzz for
     * @param {string} strategy     fuzzing strategy, default is 'sniper'
     * @param {string} config       (JSON formatted) vulnerabilities detection configs 
     */
    async createFuzzRequest(targetId, vulnTypes, strategy, config) {
        return new Promise(async (resolve, reject) => {
            console.log('[targetService] createFuzzRequest...');
            try {
                let parsedVulnTypes = JSON.parse(vulnTypes), parsedConfig = JSON.parse(config);

                // insert new request
                const newRequest = {
                    IdEndpoint: targetId,
                    Timestamp: moment(Date.now()).tz("Asia/Ho_Chi_Minh").format('YYYY-MM-DD HH:mm:ss'),
                    VulnTypes: Array.isArray(parsedVulnTypes.vulnTypes) && parsedVulnTypes.vulnTypes.length > 0 ? JSON.stringify(parsedVulnTypes) : null,
                    Strategy: strategy,
                    Config: parsedConfig ? JSON.stringify(parsedConfig) : null,
                    Status: requestStatus.submitted,
                    Note: null
                };
                let newRequestInsertion = await mySqlConnection.query(`INSERT INTO Request SET ?`, newRequest);

                if (!autoFuzz) return resolve({ requestId: newRequestInsertion.results.insertId });
                let nextRequestId = await mySqlConnection.query(`SELECT Id FROM Request WHERE Status = ? LIMIT 1;`, [requestStatus.processing]);
                if (nextRequestId.results.length === 0) {
                    const options = {
                        method: 'get',
                        url: `http://localhost:${globalConfig.SERVICE_PORT}/fuzz/?requestId=${newRequestInsertion.results.insertId}`
                    }

                    try {
                        request(options);
                    } catch (ex) {
                        console.log('Error while processing request in target service:', ex);
                    }
                }

                return resolve({ requestId: newRequestInsertion.results.insertId });
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    /**
     * Get info of a fuzz request including endpoint, request, result data
     * 
     * @param {int} requestId       id of request
     */
    async retrieveRequestInfo(requestId) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('[targetService] retrieveRequestInfo...');
                let selectResult = await mySqlConnection.query(`
                    SELECT 
                        Request.Id AS IdRequest,
                        Endpoint.Id AS IdEndpoint,
                        Request.IdResult AS IdResult,
                        Request.Timestamp AS RequestTimestamp,
                        Request.VulnTypes AS VulnTypes,
                        Request.Strategy AS Strategy,
                        Request.Config AS Config,
                        Request.Status AS Status,
                        Endpoint.BaseRequest AS BaseRequest,
                        Result.Result AS Result,
                        Result.Timestamp AS ResultTimestamp
                    FROM Request
                    INNER JOIN Endpoint
                    ON Endpoint.Id = Request.IdEndpoint
                    LEFT JOIN Result
                    ON Result.Id = Request.IdResult
                    WHERE Request.Id = ? LIMIT 1;`, requestId);
                if (selectResult.results[0].BaseRequest) {
                    selectResult.results[0].BaseRequest = JSON.parse(escapeTarget(selectResult.results[0].BaseRequest));
                }
                if (selectResult.results[0].Result) {
                    selectResult.results[0].Result = JSON.parse(escapeTarget(selectResult.results[0].Result));
                    selectResult.results[0].Vulnerable = true;
                }
                else selectResult.results[0].Vulnerable = false;
                if (selectResult.results[0].VulnTypes) {
                    selectResult.results[0].VulnTypes = JSON.parse(escapeTarget(selectResult.results[0].VulnTypes));
                }
                if (selectResult.results[0].Config) {
                    selectResult.results[0].Config = JSON.parse(escapeTarget(selectResult.results[0].Config));
                }
                return resolve({ requestInfo: selectResult.results[0] });
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    /**
     * Get info of all (vulnerable) requests
     * 
     * @param {string} type     might be `all` or `vuln` base on users' need
     */
    async getRequestList(type, limit, offset) {
        return new Promise(async (resolve, reject) => {
            console.log('[targetService] getRequestList...', type, 'limit:', limit, 'offset:', offset);
            if (!type) type = 'all';
            try {
                let query = `
                SELECT 
                    Request.Id AS IdRequest,
                    Endpoint.Id AS IdEndpoint,
                    Endpoint.Url AS Url,
                    Request.IdResult AS IdResult,
                    Request.Timestamp AS RequestTimestamp,
                    Request.Status AS Status,
                    Result.Result AS Result,
                    Result.Timestamp AS ResultTimestamp
                FROM Request
                INNER JOIN Endpoint
                ON Endpoint.Id = Request.IdEndpoint
                LEFT JOIN Result
                ON Result.Id = Request.IdResult
                ${type == 'vuln' ? 'WHERE Result.Result IS NOT NULL' : ''}
                GROUP BY IdRequest 
                ORDER BY IdRequest DESC
                LIMIT ? OFFSET ?;`
                let selectResult = await mySqlConnection.query(query, [limit ? parseInt(limit) : 10, offset ? parseInt(offset) : 0]);
                query = `
                SELECT 
                    Count(Request.Id) as total
                FROM Request
                INNER JOIN Endpoint
                ON Endpoint.Id = Request.IdEndpoint
                LEFT JOIN Result
                ON Result.Id = Request.IdResult
                ${type == 'vuln' ? 'WHERE Result.Result IS NOT NULL' : ''};`
                let total = await mySqlConnection.query(query);
                selectResult.results = selectResult.results.map(ele => {
                    let ret = Object.assign({}, ele);
                    if (ret.Result)
                        ret.Vulnerable = true;
                    else ret.Vulnerable = false;
                    delete ret.Result;
                    return ret;
                })
                return resolve({ requestInfo: selectResult.results, total: total.results[0].total });
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    async getVulnTypes() {
        return new Promise(async (resolve, reject) => {
            console.log('[targetService] getVulnTypes...');
            try {
                let vulnTypesList = Object.assign({}, globalConfig.defaultFuzzConfig);
                Object.keys(vulnTypesList).forEach((key, idx) => {
                    delete vulnTypesList[key].regex;
                });
                return resolve(vulnTypesList);
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    async searchUrl(url, limit, offset) {
        return new Promise(async (resolve, reject) => {
            console.log('[targetService] searchUrl...', url, 'limit:', limit, 'offset:', offset);
            try {
                let query = `
                SELECT 
                    Request.Id AS IdRequest,
                    Endpoint.Id AS IdEndpoint,
                    Endpoint.Url AS Url,
                    Request.IdResult AS IdResult,
                    Request.Timestamp AS RequestTimestamp,
                    Request.Status AS Status,
                    Result.Result AS Result,
                    Result.Timestamp AS ResultTimestamp
                FROM Request
                INNER JOIN Endpoint
                ON Endpoint.Id = Request.IdEndpoint
                LEFT JOIN Result
                ON Result.Id = Request.IdResult
                WHERE Url LIKE '%${url}%'
                GROUP BY IdRequest 
                ORDER BY IdRequest DESC 
                LIMIT ? OFFSET ?;`
                let selectResult = await mySqlConnection.query(query, [limit ? parseInt(limit) : 10, offset ? parseInt(offset) : 0]);
                query = `
                SELECT 
                    Count(Request.Id) as total
                FROM Request
                INNER JOIN Endpoint
                ON Endpoint.Id = Request.IdEndpoint
                WHERE Endpoint.Url LIKE '%${url}%';`
                let total = await mySqlConnection.query(query);
                selectResult.results = selectResult.results.map(ele => {
                    let ret = Object.assign({}, ele);
                    if (ret.Result)
                        ret.Vulnerable = true;
                    else ret.Vulnerable = false;
                    delete ret.Result;
                    return ret;
                })
                return resolve({ requestInfo: selectResult.results, total: total.results[0].total });
            } catch (ex) {
                return reject(ex);
            }
        });
    }
}
