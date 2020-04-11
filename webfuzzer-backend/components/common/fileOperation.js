const fs = require('fs');
const path = require('path');
const newline = /\r\n|\r|\n/g;
const StreamZip = require('node-stream-zip');

export const readPayloadFile = (file) => {
    let filePath = path.join(__dirname, '../../payloads/' + file);

    return fs.readFileSync(filePath, 'utf8').toString().split(newline);
}

export const writeHTMLFile = (data) => {
    let filePath = path.join(__dirname, '../../' + 'HTMLResponse.html');
    fs.writeFileSync(filePath, data);
    // fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export const appendFile = (data) => {
    let filePath = path.join(__dirname, '../../' + 'HTMLResponse.html');
    fs.appendFileSync(filePath, data);
    // fs.appendFileSync(filePath, JSON.stringify(data, null, 2));
}

// export const writeLogFile = (file, request, payload) => {
//     let filePath = 
//     if (fs.existsSync())
// }

export const unzip = async (file) => {
    return new Promise(async (resolve, reject) => {
        let zip = new StreamZip({
            file: file,
            storeEntries: true
        });

        // Handle errors
        zip.on('error', err => { 
            console.log(err);
            reject(err);
        });

        zip.on('ready', () => {
            console.log('Entries read: ' + zip.entriesCount);
            for (const entry of Object.values(zip.entries())) {
                const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
                console.log(`Entry ${entry.name}: ${desc}`);
            }

            fs.mkdirSync('extracted');
            zip.extract(null, './extracted', (err, count) => {
                console.log(err ? 'Extract error' : `Extracted ${count} entries`);
                zip.close();
                resolve(zip.entries());
            });
        });
    })
}

// console.log(unzip('./airpay.com.my.zip').then(console.log));