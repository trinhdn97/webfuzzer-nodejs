import { escapeTarget, unescapeTarget } from '../components/common/index';
import { requestStatus } from '../components/constant/index';
import { autoFuzz } from '../server';
var moment = require('moment');
var moment = require('moment-timezone');
const request = require('request-promise-native');

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
                    VulnTypes: parsedVulnTypes !== null ? JSON.stringify(parsedVulnTypes, null, 2) : null,
                    Strategy: strategy,
                    Config: parsedConfig !== null ? JSON.stringify(parsedConfig, null, 2) : null,
                    Status: requestStatus.submitted,
                    Note: null
                };
                let newRequestInsertion = await mySqlConnection.query(`INSERT INTO Request SET ?`, newRequest);

                if (!autoFuzz) return resolve({ requestId: newRequestInsertion.insertId });
                let nextRequestId = await mySqlConnection.query(`SELECT Id FROM Request WHERE Status = ? LIMIT 1;`, [requestStatus.processing]);
                if (nextRequestId.results.length === 0) {
                    const options = {
                        method: 'get',
                        url: `http://localhost:13337/fuzz/?requestId=${newRequestInsertion.results.insertId}`
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
                    WHERE Request.Id = ?;`, requestId);

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
    async getRequestList(type) {
        return new Promise(async (resolve, reject) => {
            console.log('[targetService] getRequestList...', type);
            try {
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
                    GROUP BY IdRequest;`, []);

                return resolve({ requestInfo: type === 'all' ? selectResult.results : selectResult.results.filter(ele => ele.Result !== null)});
            } catch (ex) {
                return reject(ex);
            }
        });
    }
}
