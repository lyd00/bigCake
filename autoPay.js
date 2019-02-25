const allocate = require('./allocate');
const store = require('./store');
const IPC = require("@vite/vitejs/dist/es5/provider/IPC").default;
const { client } = require("@vite/vitejs");
const CronJob = require('cron').CronJob;
const { superNodeName, tokenId, sbpAddr, passWord } = require('./config');

console.log(`init ipc connect......`)
const ipcClient = new client(new IPC("~/.gvite/testdata/gvite.ipc"));

exports.init = async function init() {
    console.log(`unlock wallet......`)
    return await ipcClient.request("wallet_unlock", sbpAddr, passWord);
    console.log(`unlock wallet success`)
}


exports.start = function start() {
    console.log(`start job......`)
    new CronJob('0 0 22 * * ? *', function () {
        async function task() {
            let payError = []
            try {
                const payMap = await allocate.calcAllocation(new Date(), superNodeName);
            } catch (e) {
                payError.push(e);
                store.recordPayStatus(JSON.stringify(e))
                return;
            }
            const payList = Object.keys(payMap.fundMembersVote).map(
                key => ({
                    address: payMap.fundMembersVote[key].address,
                    amount: payMap.fundMembersVote[key].award
                }))
            for (let payInfo in payList) {
                try {
                    await pay(payInfo.address, payInfo.amount);
                } catch (e) {
                    payError.push(e)
                }
                await sleep(2000);
            }
            payError.length && store.recordPayStatus(JSON.stringify(payError))
        }
        task.then(res => store.recordPayStatus("SUCCESS")).catch(e => {
            store.recordPayStatus(JSON.stringify(e))
        })
    }, null, false, 'Asia/Shanghai');
}


async function pay(address, amount) {
    return console.log('testforpay');
    return await ipcClient.request("", {
        selfAddr: sbpAddr,
        toAddr: address,
        tokenTypeId: tokenId,
        passphrase: passWord,
        amount
    })
}

async function sleep(t) {
    return new Promise((res, rej) => {
        window.setTimeout(res(null), t)
    })
}