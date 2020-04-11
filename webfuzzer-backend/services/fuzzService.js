import { appendPayloadToRequest, buildRequest } from '../components/request/index';
import { grepMatch, timebased, commonFuzz, openRedirect } from '../components/fuzzer/index';
import { requestStatus, color } from '../components/constant/index';
import { appendFile, convertQuestionMark, unescapeTarget, getBanner } from '../components/common/index';
import { defaultFuzzConfig, defaultVulnTypes, autoExecuteQueuedRequest } from '../server';
import { requestQueue, isFuzzing } from '../server';
const request = require('request-promise-native');
var moment = require('moment');
var moment = require('moment-timezone');
let now = require("performance-now"), start, end;

let mySqlConnection;

export default class fuzzService {
    constructor(injectedMySqlConnection) {
        mySqlConnection = injectedMySqlConnection;
    }

    /**
     * Execute a fuzz request (then execute another queued request)
     * 
     * @param {*} requestId 
     */
    async executeFuzzRequest(requestId) {
        return new Promise(async (resolve, reject) => {
            console.log('[fuzzService] executeFuzzRequest... fuzzing request id:', requestId);
            let tx;
            try {
                tx = new mySqlConnection.Transaction();
                await tx.begin();

                let requestInfo = await tx.execute(`
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
                requestInfo = requestInfo[0];
                requestInfo.Config = defaultFuzzConfig;
                if (requestInfo.VulnTypes === null) requestInfo.VulnTypes = JSON.stringify(defaultVulnTypes);
                if (requestInfo.Status !== requestStatus.submitted && requestInfo.Status !== requestStatus.queued) {
                    if (tx) await tx.rollback();
                    let rejectText = requestInfo.Status === requestStatus.processing ? 'Fuzz request is being executed!' : 'Fuzz request has already been executed!';
                    return reject(rejectText);
                }
                // TODO: check this comments
                // let changeRequestStatusResult = await tx.execute(`
                //     UPDATE Request SET Status = ? WHERE Id = ?;`, [requestStatus.processing, requestId]);
                makeRequestList(requestInfo);

                await tx.commit();
                return resolve('Fuzz request is being executed!');
            } catch (ex) {
                if (tx) await tx.rollback();
                console.log("============> fuzzService => executeFuzzRequest => exception: ", ex);
                return reject(ex);
            }
        });
    }

    /**
     * Quick fuzz a target from Burp
     * 
     * @param {string} escapedTarget      (JSON formatted) base request sent from Burp extender
     */
    async fuzzWithoutDatabase(escapedTarget) {
        return new Promise(async (resolve, reject) => {
            try {
                resolve('Quick fuzzing!');
                console.log('[fuzzService] fuzzWithoutDatabase...');
                let displayText = getBanner();
                if (escapedTarget) requestQueue.push(escapedTarget);

                // TODO (urgent): fix this terminal input pls
                const getTerminalInput = async () => {
                    let rl = require('readline').createInterface({
                        input: process.stdin,
                        output: process.stdout,
                        terminal: false
                    })
                    rl.setPrompt(displayText);
                    rl.prompt();

                    return new Promise((resolve, reject) => {
                        rl.on('line', (userInput) => {
                            resolve(userInput.split(','));
                            rl.close();
                        });
                    });
                }

                if (!isFuzzing && requestQueue.length > 0) {
                    isFuzzing = true;
                    let vulnTypes = [...new Set(await getTerminalInput())];
                    await quickFuzz(requestQueue[0], vulnTypes);
                    requestQueue.splice(0, 1);
                    isFuzzing = false;
                    console.log(`${color.FgGreen}Done fuzzing for ${vulnTypes.map(ele => defaultFuzzConfig[ele].label)}! Good luck${color.Reset}`);
                    if (requestQueue.length > 0) this.fuzzWithoutDatabase(null);
                }
            } catch (ex) {
                console.log("============> fuzzService => fuzzWithoutDatabase => exception: ", ex);
                return reject(ex);
            }
        });
    }

    async toggleRequestQueueingStatus(requestId) {
        return new Promise(async (resolve, reject) => {
            let tx;
            try {
                tx = new mySqlConnection.Transaction();
                await tx.begin();

                let currRequestStatus = await tx.execute(`SELECT Status FROM Request WHERE Id = ?;`, requestId), changeRequestStatusResult;
                currRequestStatus = currRequestStatus.results[0].Status;
                if (currRequestStatus === requestStatus.submitted)
                    changeRequestStatusResult = await tx.execute(`UPDATE Request SET Status = ? WHERE Id = ?;`, [requestStatus.queued, requestId]);
                else if (currRequestStatus === requestStatus.queued)
                    changeRequestStatusResult = await tx.execute(`UPDATE Request SET Status = ? WHERE Id = ?;`, [requestStatus.submitted, requestId]);

                await tx.commit();
            }
            catch (ex) {
                if (tx) await tx.rollback();
                console.log("============> fuzzService => toggleRequestQueueingStatus => exception: ", ex);
                return reject(ex);
            }
        });
    }
}

/**
 * Update [passed] and [skeptical] payload to database
 * 
 * // TODO: update database records once
 * 
 * @param {int}     requestId 
 * @param {int}     vulnType 
 * @param {string}  payload 
 */
const updateFuzzingLog = async (requestId, vulnType, payload, payloadIdxInBaseRequest, timebasedResult, matchList, skeptical = null) => {
    if (!requestId) return;
    let tx;
    try {
        tx = new mySqlConnection.Transaction();
        await tx.begin();

        let currResult = await tx.execute(`
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
        currResult = currResult[0];
        currResult.Result = JSON.parse(currResult.Result);
        let timestamp = moment(Date.now()).tz("Asia/Ho_Chi_Minh").format('YYYY-MM-DD HH:mm:ss');
        let fuzzResult = currResult.Result;
        if (currResult.IdResult == null) {
            let fuzzResult = {};
            fuzzResult[vulnType] = [{ payload, payloadIdx: payloadIdxInBaseRequest, timebased: timebasedResult, matchList }];
            const newResult = {
                Timestamp: timestamp,
                Result: JSON.stringify(fuzzResult, null, 2)
            };
            let insertedResult = await tx.execute(`INSERT INTO Result SET ?`, newResult);
            insertedResult = insertedResult.insertId;
            let updateRequestResult = await tx.execute(`
                UPDATE Request SET IdResult = ? WHERE Id = ?;`, [insertedResult, requestId]);
        }
        else {
            if (!fuzzResult || !Object.prototype.hasOwnProperty.call(fuzzResult, vulnType)) {
                if (fuzzResult) fuzzResult[vulnType] = [];
                else fuzzResult = {};
                fuzzResult[vulnType] = [{ payload, payloadIdx: payloadIdxInBaseRequest, timebased: timebasedResult, matchList }];
                const newResult = {
                    Timestamp: timestamp,
                    Result: JSON.stringify(fuzzResult, null, 2)
                };
                let updateRequestResult = await tx.execute(`
                    UPDATE Result SET ? WHERE Id = ?;`, [newResult, currResult.IdResult]);
            }
            else {
                let payloadList = currResult.Result[vulnType];
                payloadList.push({ payload, payloadIdx: payloadIdxInBaseRequest, timebased: timebasedResult, matchList });
                const newResult = {
                    Timestamp: timestamp,
                    Result: JSON.stringify(fuzzResult, null, 2)
                };
                let updateRequestResult = await tx.execute(`
                    UPDATE Result SET ? WHERE Id = ?;`, [newResult, currResult.IdResult]);
            }
        }

        await tx.commit();
    }
    catch (ex) {
        if (tx) await tx.rollback();
        console.log("============> fuzzService => updateFuzzingLog => exception: ", ex);
        return null;
    }
}

const makeRequestList = async (requestInfo) => {
    let tx;
    try {
        let config = requestInfo.Config;
        let vulnTypes = JSON.parse(requestInfo.VulnTypes).vulnTypes;
        let reqList, tx;
        for (var vulnId in vulnTypes) {
            // console.time("Fuzzing");
            // start = now();
            console.log(`${color.FgMagenta}Start fuzzing for ${config[vulnTypes[vulnId]].label}...${color.Reset}`);
            console.log(`  ${color.FgMagenta}Status\t Code\tLength\tTime\tPayload${color.Reset}`);
            reqList = appendPayloadToRequest(convertQuestionMark(requestInfo.BaseRequest), config[vulnTypes[vulnId]].payloadFile, vulnTypes[vulnId]);
            // console.log(reqList[0]);
            await sendRequestList(requestInfo.IdRequest, { config: { [vulnTypes[vulnId]]: config[vulnTypes[vulnId]] }, reqList });
            console.log(`${color.FgMagenta}Done fuzzing for ${config[vulnTypes[vulnId]].label}!${color.Reset}`);
            // end = now();
            // console.log('performance-now:', (start-end).toFixed(3));
            // console.timeEnd("Fuzzing");
        }

        if (!requestInfo.IdRequest) return;
        let currResult = await mySqlConnection.query(`
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
            WHERE Request.Id = ?;`, requestInfo.IdRequest);
        currResult = currResult.results[0];
        currResult.Result = JSON.parse(currResult.Result);
        let unique;
        for (var i in currResult.Result) {
            unique = [...new Set(currResult.Result[i].map(ele => JSON.stringify(ele)))].map(ele => JSON.parse(ele));
            currResult.Result[i] = unique;
        }
        let timestamp = moment(Date.now()).tz("Asia/Ho_Chi_Minh").format('YYYY-MM-DD HH:mm:ss');

        tx = new mySqlConnection.Transaction();
        await tx.begin();

        let updateLogResult = await tx.execute(`UPDATE Request SET Status = ? WHERE Id = ?;`, [requestStatus.completed, requestInfo.IdRequest]);
        const newResult = {
            Result: JSON.stringify(currResult.Result, null, 2),
            Timestamp: timestamp
        }
        let filterDuplicatePayloadsResult = await tx.execute(`UPDATE Result SET ? WHERE Id = ?;`, [newResult, currResult.IdResult]);
        await tx.commit();

        console.log(color.FgYellow, 'Done fuzzing request ID', color.FgGreen, requestInfo.IdRequest, color.FgYellow, 'Result ID is', color.FgGreen, currResult.IdResult, color.Reset);

        // execute next queued fuzz requests
        if (!autoExecuteQueuedRequest) return;
        let nextRequestId = await mySqlConnection.query(`SELECT Id FROM Request WHERE Status = ? OR Status = ? LIMIT 1;`, [requestStatus.submitted, requestStatus.queued]);
        if (nextRequestId.results.length === 0) return;
        const options = {
            method: 'get',
            url: `http://localhost:13337/fuzz/?requestId=${nextRequestId.results[0].Id}`
        }
        try {
            request(options);
        } catch (ex) {
            console.log('Error while processing request in fuzz service:', ex);
        }
        return;
    }
    catch (ex) {
        if (tx) await tx.rollback();
        console.log("============> fuzzService => makeRequestList => exception: ", ex);
        return null;
    }
}

// TODO: optimize for keep-alive request lists
// TODO: detect WAFs filter
// TODO (urgent): add passed payload to a list, update database once
const sendRequestList = async (requestId, fuzzObj) => {
    let result = [];
    const failedResult = (resp) => {
        console.log(color.FgCyan, '[failed]\t', `${color.FgCyan}${resp.statusCode}\t${resp.contentLength}\t${resp.elapsedTime}\t${resp.payload}\t`, color.Reset);
    }
    let resp;
    for (var reqIdx in fuzzObj.reqList) {
        try {
            resp = await buildRequest(fuzzObj.reqList[reqIdx]);
            // TODO: finish fuzz module
            if (resp.vulnId !== 'normalReq') {
                let { matchResult, matchList, timebasedResult } = grepMatch(resp, fuzzObj.config[resp.vulnId]);
                if (resp.vulnId !== '6' && resp.vulnId !== '4') {
                    if (!matchResult && !timebasedResult) {
                        failedResult(resp);
                        continue;
                    }
                    if (matchResult)
                        console.log(color.FgGreen, '[passed]\t', `${color.FgYellow}${resp.statusCode}\t${resp.contentLength}\t${timebasedResult ? color.FgRed : ''}${resp.elapsedTime}\t${color.FgYellow}${resp.payload}\t${color.FgRed}${matchList.toString()}`, color.Reset);
                    else console.log(color.FgGreen, '[passed]\t', `${color.FgYellow}${resp.statusCode}\t${resp.contentLength}\t${timebasedResult ? color.FgRed : ''}${resp.elapsedTime}\t${color.FgYellow}${resp.payload}\t`, color.Reset);
                    // { payload, payloadIdx: payloadIdxInBaseRequest, timebased: timebasedResult, matchList }

                    await updateFuzzingLog(requestId, resp.vulnId, resp.payload, fuzzObj.reqList[reqIdx].normalReq, timebasedResult, matchList);
                }
                else if (resp.vulnId === '6') {
                    let normalResp = fuzzObj.reqList.find(ele => ele.vulnId === 'normalReq' && ele.payload === fuzzObj.reqList[reqIdx].normalReq);
                    // console.log(color.FgMagenta, 'normal resp found. payload index:', color.FgGreen, normalResp.payload, color.Reset);
                    let { result, lengthRatio, textRatio, regexList } = commonFuzz(resp, normalResp, fuzzObj.config[resp.vulnId]);
                    if (result.lengthRatio || result.statusCode || result.textRatio || result.matchRegex || result.time) {
                        // TODO (urgent): update common fuzzing log
                        console.log(color.FgGreen, '[passed]\t', `${result.statusCode ? color.FgRed : color.FgYellow}${resp.statusCode}\t${result.lengthRatio ? color.FgRed : color.FgYellow}${resp.contentLength}\t${result.time ? color.FgRed : color.FgYellow}${resp.elapsedTime}\t${color.FgYellow}${resp.payload}\t${result.matchRegex? color.FgRed + regexList.toString(): ''}\t${result.lengthRatio ? color.FgRed : color.FgYellow}(length ratio: ${lengthRatio.toFixed(3)})\t${result.textRatio ? color.FgRed + `(text ratio: ${textRatio})` : ''}`, color.Reset);

                        // console.log(color.FgGreen, '[passed]\t', `${result.statusCode ? color.FgRed : color.FgYellow}${resp.statusCode}\t${result.lengthRatio ? color.FgRed : color.FgYellow}${resp.contentLength} (length ratio: ${lengthRatio.toFixed(3)})\t`, `${result.textRatio ? color.FgRed + `(text ratio: ${textRatio})\t` : ''}${result.time ? color.FgRed : color.FgYellow}${resp.elapsedTime}\t${color.FgYellow}${resp.payload}\t${result.matchRegex? color.FgRed + regexList.toString(): ''}`, color.Reset);

                    }
                    else failedResult(resp);
                }
                else if (resp.vulnId === '4') {
                    // TODO: implement open redirect fuzzer

                }
            }
            else {
                fuzzObj.reqList[reqIdx] = resp;
                console.log(color.FgGreen, '[passed]\t', `${color.FgYellow}${resp.statusCode}\t${resp.contentLength}\t${resp.elapsedTime}\t${color.FgYellow}${resp.payload}\t`, color.Reset);
            }
        } catch (ex) {
            console.log("============> fuzzService => sendRequestList => exception: ", ex);
            // TODO: mark those error payload for later use
            console.log(fuzzObj.reqList[reqIdx]);
            continue;
        }
    }
    // TODO (urgent): insert database here
    
}

// TODO: force re-processing a request if hang out


/*********************************************************************/

const quickFuzz = async (baseReq, vulnTypes) => {
    console.log(`${color.FgGreen}Start fuzzing for ${vulnTypes.map(ele => defaultFuzzConfig[ele].label)}...${color.Reset}`);
    let requestInfo = {
        IdRequest: null,
        BaseRequest: unescapeTarget(JSON.stringify(baseReq)),
        Config: defaultFuzzConfig,
        VulnTypes: JSON.stringify({ vulnTypes })
    }
    await makeRequestList(requestInfo);
}
