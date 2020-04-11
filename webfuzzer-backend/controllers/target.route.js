var targetRoute = (router, expressApp, targetMethods) => {
    router.post('/', targetMethods.createFuzzRequest);
    router.get('/', targetMethods.retrieveRequestInfo);
    router.get('/list', targetMethods.getRequestList)

    return router;
}

const _targetRoute = targetRoute;
export { _targetRoute as targetRoute };