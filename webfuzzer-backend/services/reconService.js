let mySqlConnection;

export default class reconService {
    constructor(injectedMySqlConnection) {
        mySqlConnection = injectedMySqlConnection;
    }

    async handleZipResult(file) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(file.file.name);
                console.log(file.data.length);
                return resolve('done');
            } catch (ex) {
                console.log("============> reconService => handleZipResult => exception: ", ex);
                return response(res, null, ex);
            }
        })
    }
}