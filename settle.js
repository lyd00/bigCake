var allocate = require('./allocate')
function receiveTotalEarnings() {
    return 0 
}

function createSendTx (earningsAddr, amount) {

}

function settle (dayDate, superNodeName) {
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