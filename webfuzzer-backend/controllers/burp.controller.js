import { isEmptyObject, escapeTarget, convertQuestionMark } from '../components/common/index';
const request = require('request-promise-native');
const globalConfig = require("../globalConfig");
let burpService, response;

export default class burpController {
    constructor(injectedBurpService, injectedResponseHandler) {
        burpService = injectedBurpService;
        response = injectedResponseHandler;
    }

    async receiveTargetFromBurp(req, res, baseReq) {
        try {
            console.log('[burpController] receiveTargetFromBurp...');
            let result;
            if (isEmptyObject(req.body))
                result = await burpService.receiveTargetFromBurp(JSON.parse(escapeTarget(baseReq)).python);
            else {
                let convertedBaseReq = convertQuestionMark(JSON.stringify(req.body.python));
                result = await burpService.receiveTargetFromBurp(JSON.parse(escapeTarget(convertedBaseReq)));
            }
            return response(res, result);
        }
        catch (ex) {
            console.log("============> burpController => receiveTargetFromBurp => exception: ", ex);
            // console.log('Forwarding to quick fuzz...');
            // let newBody = isEmptyObject(req.body) ? baseReq : req.body;
            // const options = {
            //     method: 'post',
            //     url: `http://0.0.0.0:${globalConfig.SERVICE_PORT}/fuzz/quick`,
            //     body: newBody,
            //     json: true
            // }
            // try {
            //     request(options);
            // } catch (ex) {
            //     console.log('Error while processing request in burp controller:', ex);
            // }
            return response(res, null, ex);
        }
    }

    async getAllEndpoint(req, res) {
        try {
            let result = await burpService.getAllEndpoint(req.query.limit, req.query.offset);
            return response(res, result);
        } catch (ex) {
            console.log("============> burpController => getAllEndpoint => exception: ", ex);
            return response(res, null, ex);
        }
    }
}
