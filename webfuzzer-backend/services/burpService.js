import { escapeTarget, unescapeTarget, response, cleanUrl, escapeString } from '../components/common/index';
import { autoFuzz, autoCreateFuzzRequest, verbose } from '../server'; 
const crypto = require('crypto');
let hash = crypto.createHash('sha256');
const request = require('request-promise-native');
const globalConfig = require("../globalConfig");
let mySqlConnection;

export default class burpService {
    constructor(injectedMySqlConnection) {
        mySqlConnection = injectedMySqlConnection;
    }

    /**
     * Save fuzzing target from Burp extender to database
     * 
     * @param {string} escapedTarget      (JSON formatted) base request sent from Burp extender
     */
    async receiveTargetFromBurp(escapedTarget) {
        return new Promise(async (resolve, reject) => {
            console.log('[burpService] receiveTargetFromBurp...');
            let tx;
            try {
                tx = new mySqlConnection.Transaction();
                await tx.begin();

                // get Id of an existed endpoint or insert new endpoint
                let endpointId, baseRequest = unescapeTarget(JSON.stringify(escapedTarget));
                if (verbose) {
                    console.log('baseRequest:', baseRequest);
                }
                hash.update(baseRequest);
                let hashRet = hash.digest('hex');
                hash = crypto.createHash('sha256');
                let existedEndpoint = await tx.execute(`SELECT Id FROM Endpoint WHERE Hash = ?`, hashRet);
                if (existedEndpoint.length === 0) {
                    const newEndpoint = {
                        Url: cleanUrl(escapedTarget.url),
                        BaseRequest: baseRequest,
                        Hash: hashRet
                    };
                    let newEndpointInsertion = await tx.execute(`INSERT INTO Endpoint SET ?`, newEndpoint);
                    endpointId = newEndpointInsertion.insertId;
                }
                else endpointId = existedEndpoint[0].Id;
                await tx.commit();

                if (!autoCreateFuzzRequest) return resolve({ endpointId: endpointId });
                const options = {
                    method: 'post',
                    url: `http://0.0.0.0:${globalConfig.SERVICE_PORT}/target/`,
                    body: { targetId: endpointId },
                    json: true
                }
    
                try {
                    request(options);
                } catch (ex) {
                    console.log('Error while processing request in burp service:', ex);
                }
                console.log('New endpointId:', endpointId);
                return resolve({ endpointId: endpointId });
            } catch (ex) {
                if (tx) await tx.rollback();
                console.log("============> burpService => receiveTargetFromBurp => exception: ", ex);
                return reject(ex);
            }
        });
    };

    async getAllEndpoint(limit, offset) {
        return new Promise(async (resolve, reject) => {
            console.log('[burpService] getAllEndpoint... limit:', limit, 'offset:', offset);
            try {
                let endpointList = await mySqlConnection.query(`
                    SELECT *
                    FROM Endpoint
                    ORDER BY Id DESC
                    LIMIT ? OFFSET ?;`, [limit ? parseInt(limit) : 10, offset ? parseInt(offset) : 0]);
                if (endpointList.error) return reject(endpointList.error);
                endpointList.results = endpointList.results.map(ele => {
                    return {
                        ...ele,
                        BaseRequest: JSON.parse(escapeTarget(ele.BaseRequest))
                    }
                })
                let total = await mySqlConnection.query(`SELECT Count(Endpoint.Id) as total FROM Endpoint;`);
                return resolve({ endpointList: endpointList.results, total: total.results[0].total });
            } catch (ex) {
                console.log("============> burpService => getAllEndpoint => exception: ", ex);
                return reject(ex);
            }
        });
    }
}
