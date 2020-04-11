import { readPayloadFile, escapeString } from '../common/index';
const RegexParser = require("regex-parser");
const fuzz = require('fuzzball');

// TODO: fix this to fit more vulnTypes
export const grepMatch = (resp, config) => {
    try {
        const keywordMatch = () => {
            let retList = [];
            let grepObj = resp.body;
            if (config['match'] != '') {
                for (var i in config['match']) {
                    if (grepObj.indexOf(config['match'][i]) >= 0) retList.push(config['match'][i]);
                }
            }
            if (config['matchFile'] != '') {
                // TODO: read match strings from file
                let matchList = [], tmpList;
                for (var idx in config['matchFile']) {
                    tmpList = readPayloadFile(config['matchFile'][idx]);
                    matchList = matchList.concat(tmpList);
                }
                for (var i in matchList) {
                    if (grepObj.indexOf(matchList[i]) >= 0) retList.push(matchList[i]);
                }
            }
            if (config['regex'] != '') {
                for (var i in config['regex']) {
                    let matchList = grepObj.match(config['regex'][i]);
                    if (matchList && matchList.length > 0) {
                        retList.push(matchList.toString());
                    }
                }
            }

            if (retList.length === 0) return { matchResult: false, matchList: [] };
            else return { matchResult: true, matchList: retList }; // TODO: match more string/matchFile/regex in config
        }
        let ret = keywordMatch();
        ret.timebasedResult = timebased(resp, config);
        return ret;
    } catch (ex) {
        console.log("============> components => fuzzer => grepMatch => grepMatch => exception: ", ex);
        // console.log(resp);
        return false;
    }
}

export const timebased = (resp, config) => {
    try {
        if (config['time'] != '') return resp.elapsedTime > config['time'] * 1000;

        return false;
    } catch (ex) {
        console.log("============> components => fuzzer => grepMatch => timebased => exception: ", ex);
        return false;
    }
}

// TODO: debug common fuzz
export const commonFuzz = (resp, normalResp, config) => {
    try {
        let lengthRatio = (Math.abs(normalResp.contentLength - resp.contentLength)) * 1.0 / normalResp.contentLength;
        // let textRatio = (fuzz.ratio(resp.body, normalResp.body) + fuzz.token_set_ratio(resp.body, normalResp.body)) / 2.0;
        let textRatio = fuzz.ratio(resp.body, normalResp.body);
        let matchRegex = false, regexList = [];
        if (config['regex'] != '') {
            for (var i in config['regex']) {
                let matchList = resp.body.match(config['regex'][i]);
                if (matchList && matchList.length > 0) {
                    matchRegex = true;
                    regexList.push(matchList.toString());
                }
            }
        }
        let result = { lengthRatio: lengthRatio > 0.2, statusCode: normalResp.statusCode !== resp.statusCode, textRatio: false, matchRegex, time: resp.elapsedTime > config['time'] * 1000 };

        return { result, lengthRatio, textRatio, regexList };
    } catch (ex) {
        console.log("============> components => fuzzer => grepMatch => commonFuzz => exception: ", ex);
        return false;
    }
}

export const openRedirect = (resp, config) => {
    try {
        // TODO: implement open redirect fuzzer

    } catch (ex) {
        console.log("============> components => fuzzer => grepMatch => openRedirect => exception: ", ex);
        return false;
    }
}

export const payloadMutator = (basePayload) => {
    try {

    } catch (ex) {
        console.log("============> components => fuzzer => grepMatch => payloadMutator => exception: ", ex);
        return false;
    }
}
export const test = () => {
    
}