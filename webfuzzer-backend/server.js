require('./processExitHandler');

import {
    targetController,
    targetRoute,
    burpController,
    burpRoute,
    fuzzController,
    fuzzRoute,
    reconController,
    reconRoute
} from './controllers';

import {
    targetService,
    burpService,
    fuzzService,
    reconService
} from './services';

import { response } from './components/common/index';
import { color } from './components/constant/index';
import { convertQuestionMark } from './components/common/index';
// const cluster = require('cluster');
// const numCPUs = require('os').cpus().length;
const globalConfig = require("./globalConfig");
const cors = require('cors');
const mySqlConnection = require('./services/db');
const express = require('express'),
    app = express(),
    port = process.env.PORT || globalConfig.SERVICE_PORT || 13337,
    bodyParser = require('body-parser');
// app.use((req, res, next) => {
//     let rawBody = '';

//     req.on('data', function(chunk) {
//         rawBody += chunk;
//         if (rawBody.length > 1e6) request.connection.destroy();
//     });

//     req.on('end', function() {
//         req.body = convertQuestionMark(rawBody);
//         next();
//     });
// })
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json({
    // type: 'application/*+json',
    extended: true
}));
app.use(cors({
    origin: "*"
}));
// handle SyntaxError while parsing body from burp request
// TODO: fix this routing and modify Burp extender later
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError) {
        // console.log('SyntaxError');
        // TODO: fix this for correctly routing
        // console.log(req.url);
        // if (req.url !== '/fuzz/quick') burpMethods.receiveTargetFromBurp(req, res, error.body);
        // else fuzzMethods.fuzzWithoutDatabase(req, res, error.body);
        // burpMethods.receiveTargetFromBurp(req, res, error.body);
        fuzzMethods.fuzzWithoutDatabase(req, res, error.body);
    } else if (error instanceof Error) {
        console.log('Error at body-parser:', error);
    }
    else {
        next();
    }
});

// Data services config
// -----------------------------------------------------------------------------
const targetSer = new targetService(mySqlConnection);
const burpSer = new burpService(mySqlConnection);
const fuzzSer = new fuzzService(mySqlConnection);
const reconSer = new reconService(mySqlConnection);

// APIs config
// -----------------------------------------------------------------------------
var burpMethods = new burpController(burpSer, response);
app.use('/', burpRoute(express.Router(), app, burpMethods));

var targetMethods = new targetController(targetSer, response);
app.use('/target', targetRoute(express.Router(), app, targetMethods));

var fuzzMethods = new fuzzController(fuzzSer, response);
app.use('/fuzz', fuzzRoute(express.Router(), app, fuzzMethods));

var reconMethods = new reconController(reconSer, response);
app.use('/recon', reconRoute(express.Router(), app, reconMethods));

// Global variables manipulation
// -----------------------------------------------------------------------------
let requestQueue = [], isFuzzing = false;
let maxThread = globalConfig.maxThread;
let defaultFuzzConfig = globalConfig.defaultFuzzConfig;
let defaultVulnTypes = globalConfig.defaultVulnTypes;
let fuzzStrategy = globalConfig.fuzzStrategy;
let autoCreateFuzzRequest = globalConfig.autoCreateFuzzRequest;
let autoFuzz = globalConfig.autoFuzz;
let autoExecuteQueuedRequest = globalConfig.autoExecuteQueuedRequest;
let db = globalConfig.db;
let csv = globalConfig.csv;
export {
    requestQueue,
    isFuzzing,
    maxThread,
    defaultFuzzConfig,
    defaultVulnTypes,
    fuzzStrategy,
    autoCreateFuzzRequest,
    autoFuzz,
    autoExecuteQueuedRequest,
    db,
    csv
}

// Start server
// TODO: switch to HTTP/2 server if possible
// -----------------------------------------------------------------------------
app.listen(port, '0.0.0.0', () => {
    console.log(`webfuzzer is listening on ${color.FgRed}0.0.0.0:${port}${color.Reset}`);
});

// if (cluster.isMaster) {                                                                                                      
//     // Fork workers.
//     for (var i = 0; i < numCPUs; i++) {
//         cluster.fork();
//     }

//     cluster.on('exit', (worker, code, signal) => {
//         console.log(`worker ${worker.id} died`);
//         cluster.fork();
//     });
// } else {
//     // Workers can share any TCP connection
//     app.listen(port, '0.0.0.0', () => {
//         console.log(`webfuzzer is listening on ${color.FgRed}0.0.0.0:${port}${color.Reset}, worker id ${color.FgGreen}${cluster.worker.id}${color.Reset}`);
//     });
// }



// let server = http2.createSecureServer(globalConfig.serverOption, app);

// server.on('error', error => console.log(error));
// server.on('connect', conn => console.log('connect', conn));
// server.on('socketError', error => console.log('socketError', error));
// server.on('frameError', error => console.log('frameError', error));
// server.on('remoteSettings', settings => console.log('remote settings', settings));

// server.on('stream', (stream, headers) => {
//   console.log('stream', headers)
//   stream.respond({
//     'content-type': 'application/html',
//     ':status': 200
//   })
//   console.log(stream.session)
//   stream.end(JSON.stringify({
//     alpnProtocol: stream.session.socket.alpnProtocol,
//     httpVersion: "2"
//   }))
// });

// function onRequest(req, res) {
//     // Detects if it is a HTTPS request or HTTP/2
//     const { socket: { alpnProtocol } } = req.httpVersion === '2.0' ?
//       req.stream.session : req;
//     res.writeHead(200, { 'content-type': 'application/json' });
//     res.end(JSON.stringify({
//       alpnProtocol,
//       httpVersion: req.httpVersion
//     }));
//   }

// server.listen(port, () => console.log(`webfuzzer is listening on port ${port}`));
