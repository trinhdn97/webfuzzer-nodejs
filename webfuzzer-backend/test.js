/*
Time log:

http://testphp.vulnweb.com:80/showimage.php?file=�./pictures/1.jpg�"
Laptop: Dell Inspiron 3558
CPU: Intel Core i3
RAM: 8GB DDR3
271 payloads LFI
476 payloads Time-based SQLI
Before multithread:
    LFI: 140238.807ms

    LFI: 139359.183ms
    SQLI: 244965.077ms

    LFI: 139109.694ms
    SQLI: 244794.669ms

    LFI: 143537.465ms
    SQLI: 247695.544ms

After multithread:
    LFI: 
    SQLI: 

    LFI: 
    SQLI: 
*/

const { Worker, isMainThread, parentPort } = require('worker_threads');
const _filename = 'components/common/fuzzer/thread';

if (isMainThread) {
  const worker = new Worker(__filename);
  worker.once('message', (message) => {
    console.log(message);  // Prints 'Hello, world!'.
  });
  worker.postMessage('Hello, world!');
} else {
  // When a message from the parent thread is received, send it back:
  parentPort.once('message', (message) => {
    parentPort.postMessage(message);
  });
}