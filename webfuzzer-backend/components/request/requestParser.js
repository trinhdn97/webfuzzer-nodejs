import { readPayloadFile, escapeString, unescapeString } from '../common/index';
let patternRegex = /\\xa7.*?\\xa7/g;
let payloadRegex = /\\xa7.*?\\xa7/;

// TODO: split retList into multiple parts if possible
export const appendPayloadToRequest = (baseReq, payloadFile, vulnId, OOB = null, strategy = 'sniper') => {
    let retList = [], patternList, req;
    let payloadList = readPayloadFile(payloadFile);
    
    for (var payloadIdx in payloadList) {
        let newPayload = escapeString(payloadList[payloadIdx]);
        // TODO: update OOB payloads later
        if (newPayload.indexOf('<OOB>') >= 0) 
            newPayload = newPayload.replace('<OOB>', OOB);
        payloadList[payloadIdx] = newPayload;
    }

    if (strategy ===  'sniper') {
        patternList = getPatternFromRequest(baseReq);
        for (var reqIdx in patternList) {
            // normal request, payload property is the index of payload replacement position in base request
            if (vulnId === "6") retList.push({
                vulnId: 'normalReq',
                payload: reqIdx,
                req: patternList[reqIdx].replace(payloadRegex, '').replace(/\\xa7/g, '')
            });
            for (var payloadIdx in payloadList) {
                req = patternList[reqIdx].replace(payloadRegex, payloadList[payloadIdx]).replace(/\\xa7/g, '');
                // normalReq is the ID of corresponding normal request
                retList.push({
                    normalReq: reqIdx,
                    vulnId: vulnId,
                    payload: unescapeString(payloadList[payloadIdx]),
                    req
                });
            }
        }
            
        return retList;
    }
}

const getPatternFromRequest = (req) => {
    try {
        let retList = [], match, currReq = req;
        let count = req.match(patternRegex).length;
        
        if (count === 1) retList.push(req, '');
        else {
            retList.push(req);
            while (match = patternRegex.exec(currReq)) {
                currReq = currReq.replace(match[0], match[0].replace(/\\xa7/g, ''));
                retList.push(currReq);
            }
        }
        return retList.splice(0, retList.length-1);
    } catch (ex) {
        console.log("============> components => request => requestParser => getPatternFromRequest => exception: ", ex);
        return [];
    }
}

// let strReq = `a§bcdefgh§ijkla§bcdefgh§ijkla§bcdefgh§ijkla§bcdefgh§ijkla§bcdefgh§ijkla§bcdefgh§ijkla§bcdefgh§ijkla§bcdefgh§ijkl`;
// console.log(strReq);
// appendPayloadToRequest(strReq, 'lfi/lfi-full.txt', 1);
