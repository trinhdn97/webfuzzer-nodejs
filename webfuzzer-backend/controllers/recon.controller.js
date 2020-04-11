let reconService, response;

export default class reconController {
    constructor(injectedReconService, injectedResponseHandler) {
        reconService = injectedReconService;
        response = injectedResponseHandler;
    }

    async handleZipResult(req, res) {
        try {
            let result = await reconService.handleZipResult(req.body.result);
            return response(res, result);
        } catch (ex) {
            console.log("============> reconController => handleZipResult => exception: ", ex);
            return response(res, null, ex);
        }
    }
}