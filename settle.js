import { client, constant } from '@vite/vitejs';
const { method } = constant;
const { initClientWithIPC } = client;
const clientInstance = new initClientWithIPC({
    path: '~/.gvite/testdata/gvite.ipc',
    delimiter = '\n',
    timeout = 2000
});

// [TODO]
async function receiveTotalEarnings() {
    return await clientInstance.request(method.ledger.getAccountByAccAddr, 'selfAddr');
}

// [TODO]
async function createSendTx(earningsAddr, amount) {
    // send money
    return await clientInstance.request(method.wallet.createTxWithPassphrase, {
        selfAddr: '',
        toAddr: earningsAddr,
        tokenTypeId: 'tti_5649544520544f4b454e6e40', // VITE
        passphrase: '',
        amount: amount
    });
}

function settle(dayDate, superNodeName) {
    allocate.calcAllocation(dayDate, superNodeName).then(function (allocation) {
        let totalEarnings = receiveTotalEarnings()

        allocation.fundMembersVote.forEach(function (fundMember) {
            let earnings = totalEarnings * fundMember.voteRatio;

            createSendTx(fundMember.earningsAddr, earnings)
        })
    })
}

module.exports = {
    settle: settle
}