'use strict'

import { grepMatch, commonFuzz, openRedirect } from './index';
import { buildRequest } from '../request/index';
const config = require('../../globalConfig');
const { parentPort, workerData } = require('worker_threads');

const { funcName, resp, normalResp } = workerData;

parentPort.on('message', (msg) => {
  let parsedResp = JSON.parse(resp);
  let parsedNormalResp = JSON.parse(resp);
  let ret = null;   
  switch (funcName) {
    case 'grepMatch':
      ret = grepMatch(parsedResp, config); // TODO: choose exactly which config
      break;
    case 'commonFuzz':
      ret = commonFuzz(parsedResp, parsedNormalResp, config); // TODO: choose exactly which config
      break;
    case 'openRedirect':
      ret = openRedirect(parsedResp, config); // TODO: choose exactly which config
      break;
  }
  parentPort.postMessage(ret);
})
