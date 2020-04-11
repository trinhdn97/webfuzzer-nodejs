var fuzzRoute = (router, expressApp, fuzzMethods) => {
    router.get('/', fuzzMethods.executeFuzzRequest);
    router.get('/toggle', fuzzMethods.toggleRequestQueueingStatus);
    router.post('/quick', fuzzMethods.fuzzWithoutDatabase);
    return router;
}

const _fuzzRoute = fuzzRoute;
export { _fuzzRoute as fuzzRoute };