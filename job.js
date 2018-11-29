const allocate = require('./allocate')
const config = require('./config')
const store = require('./store')
const settle = require('./settle')
const TASK_INTERVAL = 60 * 60 * 1000 // one hour




let timer
let status
const STATUS_START = 1
const STATUS_STOP = 2
const STATUS_RUNNING = 2


async function check (cycle) {
    return await store.cycleIsSettled(cycle)
}

async function runTask () {
    let cycle = allocate.dateToCycle(new Date())
    let needRun = await check(cycle)
    if (!needRun) {
        return
    }

    let allocation = await allocate.calcAllocationByCycle(cycle, config.superNodeName)
    let settleJob = await settle(allocation)

    await store.insertCycleInfo(cycle, allocation, settleJob.info)
    await settleJob.commit()
}

function startJob () {    
    if (status  >= STATUS_START) {
        return console.error("不要重复开启定时任务")
    }
    status = STATUS_START

    let run = async () => {
        status = STATUS_RUNNING
        await runTask()

        status = STATUS_START
        timer = setTimeout(run, TASK_INTERVAL)
    }
    run()
}

function stopJob () {
    if (status == STATUS_STOP){
         console.error("没有定时任务需要关闭")
         return false
    }
    if (status == STATUS_RUNNING) {
        console.error("定时任务正在运行中，暂时无法关闭，稍后重试")        
        return false
    }


    status = STATUS_STOP

    clearTimeout(timer)
    timer = null
    return true
}

module.exports = {
    startJob,
    stopJob
}