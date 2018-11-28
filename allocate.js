
const fetch = require('node-fetch')

const PLEDGE_AMOUNT = 50 * 10000
const AMOUNT_VOTE_RATION = 1152
const MEMBER_NAME_UNKNOWM = "Unknown"

let genesisTimestamp = new Date(1541650394000);

function dateToCycle(dayDate) {
    let d = new Date(dayDate + " 12:13:14");
    let cycle = (d.getTime() - genesisTimestamp.getTime()) / (86400000);
    return cycle;
}

function queryVotes(superNodeName, cycle) {
    let fromCycle = cycle - 1;
    return fetch(`http://150.109.60.74:8080/vote/node/query?nodeName=${superNodeName}&fromCycle=${fromCycle}&toCycle=${cycle}`)
        .then(function (res) {
            return res.json()
        }).then(function (resJson) {
            if (resJson === null || resJson.code > 0) {
                throw new Error(`queryVotes出现错误, response is ${resJson}`)
            } 
            
            return resJson.data            
        })
}

function readFoundationMembers () {
    return [{
        "name":  "陈思",
        "addrs": [
            "vite_ef3c95e83d0d1cbf694108a61b632591678cd656a264d32354"
        ],
        "earningsAddr": "vite_ef3c95e83d0d1cbf694108a61b632591678cd656a264d32354",
        "pledgeAmount": 12.5 * 10000
    }, {
        "name": "王莛岳", 
        "addrs": [
            "vite_4c17335b318dd8caf4b380205a94dae80c1b675ebb7245200f",
            "vite_e15b6fcb52d8f3b4aa80a8b67f1d6f907b1ea7cf8b5ba98e5c",
            "vite_2fddb1f3bea3c3de04ec65ba26940b62f7a42f6280639139dd",
            "vite_1384252652eac061df7333de3a74e6ff4d4afc7e57ccbdda9e",
            "vite_20491cde8edb5f11b8fc0acfeae1fa943ff3efa069726a6a41"
        ],
        "earningsAddr": "vite_4c17335b318dd8caf4b380205a94dae80c1b675ebb7245200f",
        "pledgeAmount": 12.5 * 10000
    }, {
        "name": "袁章", 
        "addrs": [
            "vite_61404d3b6361f979208c8a5c442ceb87c1f072446f58118f68"
        ],
        "earningsAddr": "vite_ef3c95e83d0d1cbf694108a61b632591678cd656a264d32354",
        "pledgeAmount": 12.5 * 10000
    }, {
        "name": "李焱达",
        "addrs": [
            "vite_0149e4e16364002ab7681f15be6e2c7372f5986eed824ac8e6"
        ],
        "earningsAddr": "vite_ef3c95e83d0d1cbf694108a61b632591678cd656a264d32354",
        "pledgeAmount": 12.5 * 10000
    }]
}

function findMember(clubMembers, address) {
    for (i = 0; i < clubMembers.length; i++) {
        member = clubMembers[i]
        if (member.addrs.indexOf(address) >= 0) {
            return member
        }
    }
}

function calcAllocation(dayDate, superNodeName) {
    let cycle = dateToCycle(dayDate);
    


    return queryVotes(superNodeName, cycle).then(function (votes) {
        if (votes.cycleVotes.length <= 0 || 
            votes.addressVotes.length <= 0) {
            throw new Error(`奖励数据为空，日期${dayDate}无奖励`)
        }
    
        let originTotalVote = parseFloat(votes.cycleVotes[0].totalVote, 10)
        let pledgeVote = PLEDGE_AMOUNT * AMOUNT_VOTE_RATION    
        let totalVote = originTotalVote + pledgeVote

        let fundMembers = readFoundationMembers()
        let fundMembersVote = {}
        votes.addressVotes.forEach(addressVote => {
            let addr = addressVote.address
            let member = findMember(fundMembers, addr)
            let memberName
            if (!member) {
                console.error(`出现基金会成员之外的地址: ${addr}`)
                memberName = MEMBER_NAME_UNKNOWM
            } else {
                memberName = member.name
            }
            if (!fundMembersVote[memberName]) {
                fundMembersVote[memberName] = {
                    addressList: [],
                    
                    pledgeVote: 0,
                    pledgeVoteRatio: 0,
                    
                    realVote: 0,
                    realVoteRatio: 0,

                    voteTotal: 0,
                    voteRatio: 0,       
                }
                if (memberName !== MEMBER_NAME_UNKNOWM) {
                    let personalPledgeVote = member.pledgeAmount * AMOUNT_VOTE_RATION

                    fundMembersVote[memberName].pledgeVote = personalPledgeVote 
                    fundMembersVote[memberName].pledgeVoteRatio = personalPledgeVote / totalVote 

                    fundMembersVote[memberName].voteTotal = fundMembersVote[memberName].pledgeVote
                    fundMembersVote[memberName].voteRatio = fundMembersVote[memberName].pledgeVoteRatio
                }
            } 
    
            fundMembersVote[memberName].realVote += parseFloat(addressVote.voteTotal, 10)
            fundMembersVote[memberName].realVoteRatio = fundMembersVote[memberName].realVote / totalVote

            fundMembersVote[memberName].voteTotal = fundMembersVote[memberName].realVote + fundMembersVote[memberName].pledgeVote
            fundMembersVote[memberName].voteRatio = fundMembersVote[memberName].voteTotal / totalVote


            if (fundMembersVote[memberName].addressList.indexOf(addr) < 0) {
                fundMembersVote[memberName].addressList.push(addr) 
            }
        });
    
        console.log("")
        printTotalVote(totalVote, originTotalVote, pledgeVote)
        console.log("")
        printFundMembersVote(fundMembersVote)
        
        return {
            totalVote: totalVote,
            originTotalVote: originTotalVote,
            pledgeVote: pledgeVote,
            fundMembersVote: fundMembersVote
        }
    });
}

function printTotalVote(totalVote, originTotalVote, pledgeVote) {
    console.log(`总票量是${totalVote} (${originTotalVote} + ${pledgeVote}(抵押换算的票量) )`)
}

function printFundMembersVote(fundMembersVote) {
    console.log(`各成员投票占比:`)
    Object.keys(fundMembersVote).forEach(function (name, index) {
        let vote = fundMembersVote[name]
        console.log(`${index}.${name}`)
        console.log(`地址列表: ${vote.addressList}`)
        
        console.log(`抵押票量: ${vote.pledgeVote}`)
        console.log(`抵押票量占比: ${vote.pledgeVoteRatio}`)

        console.log(`投票量: ${vote.realVote}`)
        console.log(`投票量占比: ${vote.realVoteRatio}`)

        console.log(`总票量: ${vote.voteTotal}`)
        console.log(`总票量占比: ${vote.voteRatio}`)
        console.log("")
    })
}

calcAllocation("2018-11-28", "Chinese node")

module.exports = {
    findMember: findMember
}