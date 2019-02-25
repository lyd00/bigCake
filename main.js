// const job = require('./job');
const managerServer = require("./managerServer");
const store = require('./store');
const autoPay =require('./autoPay');

async function main () {
    await store.initTable()
    await autoPay.init()
    autoPay.start()
    // job.startJob()
    managerServer.startServer()
}

main()