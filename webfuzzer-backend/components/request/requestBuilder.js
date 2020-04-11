const request = require('request-promise-native');

// TODO: reduce the size of request bunch (around 50 request per once)
export const buildRequest = async (baseReq) => {
    return new Promise(async (resolve, reject) => {
        try {
            let req = JSON.parse(baseReq.req);

            // TODO: add cookies to request options
            const options = {
                method: req.method,
                url: encodeURI(req.url), // TODO: check this later, is it necessary to encode URL before sending?
                headers: req.headers,
                form: req.data, // TODO: fix this to fit all content-type (https://github.com/request/request#forms)
                gzip: true,
                resolveWithFullResponse: true,
                time: true,
                simple: false,
                followAllRedirects: true
                // json: true
                // transform: filterResponse // TODO: transform HTTP responses to fit the model
            }

            request(options).then((resp) => {
                resp.payload = baseReq.payload;
                resp.vulnId = baseReq.vulnId;
                return resolve(filterResponse(resp, baseReq.vulnId));
            }).catch((err) => {
                console.log('Error while processing request:', err);
            });
        } catch (ex) {
            console.log(baseReq);
            // console.log("============> requestBuilder => buildRequest => exception: ", ex);
            return reject(ex);
        }
    })
}

const filterResponse = (resp, vulnId) => {
    let ret = {};
    ret.payload = resp.payload;
    ret.vulnId = resp.vulnId;
    ret.body = resp.body;
    ret.statusCode = resp.statusCode;
    ret.elapsedTime = resp.elapsedTime;
    try {
        ret.contentLength = ret.body.length;
    } catch (ex) {
        ret.contentLength = 0
    };
    ret.headers = resp.headers;
    ret.redirect = vulnId === '4' ? resp.request._redirect : null;

    return ret;
}
