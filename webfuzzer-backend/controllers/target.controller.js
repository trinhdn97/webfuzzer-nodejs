import { defaultFuzzConfig, fuzzStrategy } from '../server';

let targetService, response;

export default class targetController {
    constructor(injectedTargetService, injectedResponseHandler) {
        targetService = injectedTargetService;
        response = injectedResponseHandler;
    }

    async createFuzzRequest(req, res) {
        try {
            console.log('[targetController] createFuzzRequest... targetId:', req.body.targetId, ', ', req.body.vulnTypes);

            // use default config if corresponding configs aren't included in POST body
            let config = req.body.config ? JSON.parse(req.body.config) : {};
            if (req.body.vulnTypes) {
                let vulnTypes = JSON.parse(req.body.vulnTypes).vulnTypes
                for (var vulnId in vulnTypes)
                    if (!config[vulnTypes[vulnId]])
                        config[vulnTypes[vulnId]] = defaultFuzzConfig[vulnTypes[vulnId]];
            }
            
            let result = await targetService.createFuzzRequest(
                req.body.targetId,
                req.body.vulnTypes ? req.body.vulnTypes : null,
                req.body.strategy ? req.body.strategy : fuzzStrategy,
                req.body.vulnTypes ? JSON.stringify(config) : null
            );
            console.log('[targetController] request created, id:', result.requestId);
            return response(res, result);
        } catch (ex) {
            console.log("============> targetController => createFuzzRequest => exception: ", ex);
            return response(res, null, ex);
        }
    }

    async retrieveRequestInfo(req, res) {
        try {
            const requestId = req.query.requestId;
            console.log('[targetController] retrieveRequestInfo... requestId:', requestId);
            let result = await targetService.retrieveRequestInfo(requestId);
            return response(res, result);
        } catch (ex) {
            console.log("============> targetController => retrieveRequestInfo => exception: ", ex);
            return response(res, null, ex);
        }
    }

    async getRequestList(req, res) {
        try {
            console.log('[targetController] getRequestList...');
            let result = await targetService.getRequestList(req.query.type);
            return response(res, result);
        } catch (ex) {
            console.log("============> targetController => getRequestList => exception: ", ex);
            return response(res, null, ex);
        }
    }
}
