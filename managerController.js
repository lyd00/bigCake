const store = require('./store')
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
module.exports = {
    dbCycle
}