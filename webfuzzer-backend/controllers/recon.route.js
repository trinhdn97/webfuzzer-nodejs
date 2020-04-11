let parseFormdata = require('../middleware/parse-formdata.middleware');

var reconRoute = (router, expressApp, reconMethods) => {
    router.post('/', parseFormdata, reconMethods.handleZipResult);
    return router;
}

const _reconRoute = reconRoute;
export { _reconRoute as reconRoute };