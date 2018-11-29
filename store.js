const sqlite3 = require('sqlite3');
const Promise = require('bluebird');
const path = require('path')
const os = require('os')

// open the database

const CYCLE_TABLE_NAME = "cycleinfo"
const PAY_TABLE_NAME = "payinfo"
const DB_FILE = 'bigCake.sqlite'

function toPrimise (func, ...args) {
    return new Promise((resolve, reject) => {
        func(...args, (err, ...params) => {
            if (err){
                reject(err)
            }
            resolve(...params)
        })
    })
}

class Store {
    constructor () {
        this.db = new sqlite3.Database(path.join(os.homedir(), DB_FILE), (err) => {
            if (err) {
                throw err
            }
        })
    }
 
    async execSql (action, ...args) {
        return toPrimise(this.db[action].bind(this.db), ...args)
    }

    async initTable () {
        const SQL = `CREATE TABLE IF NOT EXISTS ${CYCLE_TABLE_NAME} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cycle INTEGER,
            allocation STRING,
            settleInfo STRING
        )`
        const SQL2 = `CREATE TABLE IF NOT EXISTS ${PAY_TABLE_NAME} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cycle INTEGER,
            blockHash STRING,
            toAddress STRING,
            sendTime INTEGER
        )`

        await this.execSql("run", SQL)
        await this.execSql("run", SQL2)
    }

    async insertCycleInfo (cycle, allocation, settleInfo) {
        const SQL = `INSERT INTO ${CYCLE_TABLE_NAME} (cycle, allocation, settleInfo) VALUES (?, ?, ?)`
        return await this.execSql('run', SQL, [cycle, JSON.stringify(allocation), JSON.stringify(settleInfo)])
    }

    
    async queryCycleInfoList (fromCycle, toCycle) {
        const SQL = `SELECT cycle, allocation, settleInfo FROM ${CYCLE_TABLE_NAME} WHERE cycle > ? AND cycle <= ?`
        let result = await this.execSql('get', SQL, [fromCycle, toCycle])        
        if (result) {
            if (result.allocation) {
                result.allocation = JSON.parse(result.allocation)
            }
            if (result.settleInfo) {
                result.settleInfo = JSON.parse(result.settleInfo)
            }
        }
        return result
    }
    
    async cycleIsSettled(cycle) {
        const SQL = `SELECT * FROM ${CYCLE_TABLE_NAME} WHERE cycle = ?`
        let result = await this.execSql('get', SQL, [cycle])
        return !result
    }
}

module.exports = new Store()