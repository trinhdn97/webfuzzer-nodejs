var targetRoute = (router, expressApp, targetMethods) => {
    router.post('/', targetMethods.createFuzzRequest);
    router.get('/', targetMethods.retrieveRequestInfo);
    router.get('/list', targetMethods.getRequestList);
    router.get('/configs', targetMethods.getVulnTypes);
    router.get('/search', targetMethods.searchUrl);

    return router;
}

const _targetRoute = targetRoute;
export { _targetRoute as targetRoute };