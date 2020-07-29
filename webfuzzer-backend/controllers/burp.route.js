var burpRoute = (router, expressApp, burpMethods) => {
    router.post('/', burpMethods.receiveTargetFromBurp);
    router.get('/', burpMethods.getAllEndpoint);
    return router;
}

const _burpRoute = burpRoute;
export { _burpRoute as burpRoute };