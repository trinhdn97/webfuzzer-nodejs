import { isEmptyObject, escapeTarget, convertQuestionMark } from '../components/common/index';
let fuzzService, response;

export default class fuzzController {
    constructor(injectedFuzzService, injectedResponseHandler) {
        fuzzService = injectedFuzzService;
        response = injectedResponseHandler;
    }

    async executeFuzzRequest(req, res) {
        try {
            const requestId = req.query.requestId;
            console.log('[fuzzController] executeFuzzRequest... requestId:', requestId);

            let result = await fuzzService.executeFuzzRequest(requestId);
            return response(res, result);
        } catch (ex) {
            console.log("============> fuzzController => executeFuzzRequest => exception: ", ex);
            return response(res, null, ex);
        }
    }

    async fuzzWithoutDatabase(req, res, baseReq) {
        try {
            console.log('[fuzzController] fuzzWithoutDatabase...');
            // console.log(baseReq);
            let result;
            if (isEmptyObject(req.body))
                result = await fuzzService.fuzzWithoutDatabase(JSON.parse(escapeTarget(baseReq)).python);
            else {
                let convertedBaseReq = convertQuestionMark(JSON.stringify(req.body.python));
                result = await fuzzService.fuzzWithoutDatabase(JSON.parse(escapeTarget(convertedBaseReq)));
            }
            return response(res, result);
        } catch (ex) {
            console.log("============> fuzzController => fuzzWithoutDatabase => exception: ", ex);
            return response(res, null, ex);
        }
    }

    async toggleRequestQueueingStatus(req, res) {
        try {
            const requestId = req.query.requestId;
            console.log('[fuzzController] toggleRequestQueueingStatus... requestId:', requestId);
            let result = await fuzzService.toggleRequestQueueingStatus(requestId);
            return response(res, result);
        } catch (ex) {
            console.log("============> fuzzController => toggleRequestQueueingStatus => exception: ", ex);
            return response(res, null, ex);
        }
    }
}
