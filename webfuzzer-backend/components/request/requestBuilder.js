const request = require('request-promise-native');
import { encodeUrl, verbose } from '../../server';

// TODO: reduce the size of request bunch (around 50 request per once)
export const buildRequest = async (baseReq) => {
    return new Promise(async (resolve, reject) => {
        try {
            let req = JSON.parse(baseReq.req);

            // TODO: add cookies to request options
            let options = {
                method: req.method,
                url: encodeUrl ? encodeURI(req.url) : req.url,
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
            if (baseReq.vulnId === '2') options.timeout = baseReq.timeout;
            if (verbose) {
                console.log('baseReq after include payload:', baseReq);
                console.log('options:', options);
            }

            request(options).then((resp) => {
                resp.payload = baseReq.payload;
                resp.vulnId = baseReq.vulnId;
                return resolve(filterResponse(resp, baseReq.vulnId));
            }).catch((err) => {
                // console.log('Error while processing request:', err);
                if ((err.message === 'Error: ETIMEDOUT' || err.message === 'Error: ESOCKETTIMEDOUT'))
                    return resolve({
                        payload: baseReq.payload,
                        vulnId: baseReq.vulnId,
                        body: '',
                        statusCode: 500,
                        elapsedTime: baseReq.timeout,
                        contentLength: 0
                    });
                else return resolve({
                    payload: baseReq.payload,
                    vulnId: baseReq.vulnId,
                    body: '',
                    statusCode: 500,
                    elapsedTime: 0,
                    contentLength: 0
                });
            });
        } catch (ex) {
            console.log(baseReq);
            console.log("============> requestBuilder => buildRequest => exception: ", ex);
            return reject(false);
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
