const mySql = require('mysql')
var globalConfig = require("../globalConfig");

// -------------------------------------------------------------------------------------------------------------

function initConnection() {
    var config = globalConfig.mysqlConfig;
    // console.log(`init connection with config: ${config.user} host: ${config.host} | database name: ${config.database}`);
    return mySql.createConnection(config);
}

function query(queryString, value, callback = () => { }) {
    return new Promise((resolve, reject) => {
        let connection = initConnection();
        connection.connect();
        // console.log(queryString)
        connection.query(queryString, value, function (error, results, fields) {
            // console.log('+ mySql: ', this.sql);
            // console.log('+ error: ', error);
            // console.log('+ results: ', results);
            connection.end();
            callback(createDataResponseObject(error, results));
            resolve(createDataResponseObject(error, results));
        });
    });
}

//using for query with transaction
function execute(executeCallback) {
    let connection = initConnection();
    connection.connect();
    console.log(`Connection has just init: status: ${connection.state}`);
    executeCallback(connection);
    console.log(`End execute: status: ${connection.state}`);
}

function createDataResponseObject(error, results) {
    return {
        error: error,
        results: results === undefined ? null : results === null ? null : results
    }
}

function escape(str) {
    return mySql.escape(str);
}

// -------------------------------------------------------------------------------------------------------------

class Transaction {
    constructor() {
        this.connection = initConnection();
        // this.connection.connect();
    }

    begin() {
        return new Promise((resolve, reject) => this.connection.beginTransaction(async function (error) {
            if (error) return reject(error);
            return resolve(true);
        }));
    }

    execute(queryString, valueArray) {
        const self = this;
        return new Promise((resolve, reject) => this.connection.query(queryString, valueArray, async function (error, results, fields) {
            if (error) {
                await self.rollback();
                return reject(error);
            }
            return resolve(results);
        }));
    }

    rollback() {
        const self = this;
        return new Promise((resolve, reject) => this.connection.rollback(async function () {
            self.connection.end();
            return resolve(true);
        }));
    }

    commit() {
        const self = this;
        return new Promise((resolve, reject) => this.connection.commit(async function (error) {
            if (error) {
                await self.rollback();
                return reject(error);
            }
            self.connection.end();
            return resolve(true);
        }));
    }

}

// -------------------------------------------------------------------------------------------------------------

module.exports = {
    query,
    execute,
    createDataResponseObject,
    escape,
    Transaction,
}
