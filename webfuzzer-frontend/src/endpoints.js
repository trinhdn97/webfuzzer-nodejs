const endpoints = {
    getAllEndpoinst: (limit = 5, offset = 0) => `/?limit=${limit}&offset=${offset}`,
    getListVulnes: '/target/configs',
    createFuzzRequest: '/target',
    getTargetList: (type, limit = 10, offset = 0) => `/target/list?type=${type}&limit=${limit}&offset=${offset}`,
    getTargerDetail: (requestId) => `/target?requestId=${requestId}`,
    getConfigs: '/target/configs',
    executeFuzzRequest: (id) => `/fuzz?requestId=${id}`,
    searchTarget: (url, limit = 10, offset = 0) => `/target/search?url=${url}&limit=${limit}&offset=${offset}`
}
export default endpoints