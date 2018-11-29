const store = require('./store')
const allocate = require('./allocate')
const config = require('./config')
const moment = require('moment')

async function dbCycle(ctx, next) {
    let fromCycle = parseInt(ctx.query.fromCycle, 10)
    let toCycle = parseInt(ctx.query.toCycle, 10)

    let result = await store.queryCycleInfoList(fromCycle, toCycle)
    ctx.body = {
        code: 0,
        msg: "",
        data: result
    }
}
async function rtCycle(ctx) {
    try {
        let allocation = await allocate.calcAllocation(ctx.query.date, config.superNodeName)
        ctx.body = {
            code: 0,
            msg: "",
            data: allocation
        }
    } catch(err) {
        ctx.body = {
            code: 1,
            msg: err.toString()
        }
    }


}
module.exports = {
    dbCycle,
    rtCycle
}