async function settle (allocation) {    
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
            addrList: fundMember.address,
            earningsAddr: fundMember.earningsAddr,
            earnings: earnings
        }
    })

    let job = {
        info: settleInfo,
        commit: async () => {
            let keys = Object.keys(settleInfo.fundMemberEarnings)
            for(i = 0; i < keys.length; i++) {
                let fundMember = settleInfo.fundMemberEarnings[keys[i]]
                if (fundMember.earningsAddr) {
                    // send money
                    await createSendTx(fundMember.earningsAddr, fundMember.earnings)
                    printSettleInfo(fundMember, i)
                }
            }
        }
    }


    return job
}

function printSettleInfo (fundMember, index) {
    console.log(`${index}.${fundMember.name}`)
    console.log(`地址列表: ${fundMember.address}`)
    console.log(`收益地址: ${fundMember.earningsAddr}`)
    console.log(`收益: ${fundMember.earnings}`)
}

module.exports = settle