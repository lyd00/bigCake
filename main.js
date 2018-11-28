const job = require('./job');
const managerServer = require("./managerServer");
const store = require('./store')

async function main () {
    await store.initTable()
    
    job.startJob()
    managerServer.startServer()
}

main()