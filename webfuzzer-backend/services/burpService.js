import { escapeTarget, unescapeTarget, response, cleanUrl, escapeString } from '../components/common/index';
import { autoFuzz, autoCreateFuzzRequest } from '../server'; 
const crypto = require('crypto');
let hash = crypto.createHash('sha256');
const request = require('request-promise-native');
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
                let endpointId, baseRequest = unescapeTarget(JSON.stringify(escapedTarget, null, 2));
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
                    url: 'http://0.0.0.0:13337/target/',
                    body: { targetId: endpointId },
                    json: true
                }
    
                try {
                    request(options);
                } catch (ex) {
                    console.log('Error while processing request in burp service:', ex);
                }

                return resolve({ endpointId: endpointId });
            } catch (ex) {
                if (tx) await tx.rollback();
                console.log("============> burpService => receiveTargetFromBurp => exception: ", ex);
                return reject(ex);
            }
        });
    }
}
