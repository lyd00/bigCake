const { client, constant } = require('@vite/vitejs');
const { method } = constant;
const { initClientWithIpc } = client;
let clientInstance = null;
initClientWithIpc({
    path: '~/.gvite/testdata/gvite.ipc',
    delimiter: '\n',
    timeout: 2000
}).then(c => {
    console.log('connect success', c);
    clientInstance = c;
}, e => {
    console.error('connect error')
}).catch(e=>{
    console.error('errorrrrrr',e)
});

const store = require('./store');

// [TODO]
async function receiveTotalEarnings() {
    return await clientInstance.request(method.ledger.getAccountByAccAddr, 'vite_67a797f249753fa07cd76b07530e7a1f96d070a8ade463ebe5');
}

// [TODO]
async function createSendTx(earningsAddr, amount) {
    // send money
    return await clientInstance.request(method.wallet.createTxWithPassphrase, {
        selfAddr: 'vite_67a797f249753fa07cd76b07530e7a1f96d070a8ade463ebe5',
        toAddr: earningsAddr,
        tokenTypeId: 'tti_5649544520544f4b454e6e40', // VITE
        passphrase: '756761',
        amount: amount
    });
}

async function settle(allocation) {
    let settleInfo = {
        fundMemberEarnings: {}
    }

    let totalEarnings = await receiveTotalEarnings()
    settleInfo.totalEarnings = totalEarnings

    Object.keys(allocation.fundMembersVote).forEach(function (name) {
        let fundMember = allocation.fundMembersVote[name]
        fundMember.name = name

        let earnings = totalEarnings * fundMember.voteRatio;

        settleInfo.fundMemberEarnings[fundMember.name] = {
            addrList: fundMember.addressList,
            earningsAddr: fundMember.earningsAddr,
            earnings: earnings
        }
    })

    let job = {
        info: settleInfo,
        commit: async (cycle) => {
            let keys = Object.keys(settleInfo.fundMemberEarnings)
            for (i = 0; i < keys.length; i++) {
                let fundMember = settleInfo.fundMemberEarnings[keys[i]]
                if (fundMember.earningsAddr) {
                    // send money
                    const hasPaid = await store.hasPaid({ cycle, toAddress: fundMember.earningsAddr });
                    if (hasPaid) {
                        throw new Error('hasPaid!!!')
                    }
                    try {
                        const res = await createSendTx(fundMember.earningsAddr, fundMember.earnings);
                        await store.recordPayInfo({ cycle, toAddress: fundMember.earningsAddr, amount: fundMember.earnings });
                    } catch (e) {
                        console.error(e);
                    }
                    printSettleInfo(fundMember, i)
                }
            }
        }
    }


    return job
}

function printSettleInfo(fundMember, index) {
    console.log(`${index}.${fundMember.name}`)
    console.log(`地址列表: ${fundMember.addressList}`)
    console.log(`收益地址: ${fundMember.earningsAddr}`)
    console.log(`收益: ${fundMember.earnings}`)
}

module.exports = settle