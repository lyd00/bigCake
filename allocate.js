
const fetch = require('node-fetch')
const config = require('./config')
const moment = require('moment')

const PLEDGE_AMOUNT = 50 * 10000
const AMOUNT_VOTE_RATION = 1152

let genesisTimestamp = new Date(1541650394000);

function dateToCycle(dayDate) {
    let d = dayDate; 
    if (!(d instanceof Date)) {
        d = new Date(dayDate + " 12:13:14");
    }
    
    let cycle = parseInt((d.getTime() - genesisTimestamp.getTime()) / (86400000), 10);
    return cycle;
}

function cycleToDate(cycle) {
    let timestamp = genesisTimestamp.getTime() + cycle * 86400000
    return new moment(timestamp)
}

function queryAward(superNodeName, cycle) {
    let url = `http://150.109.62.152:8080/reward/node/cycle/query?nodeName=${encodeURIComponent(superNodeName)}&cycle=${cycle}`
    return fetch(url)
        .then(function (res) {
            return res.json()
        }).then(function (resJson) {
            if (resJson === null || resJson.code > 0) {
                throw new Error(`queryVotes出现错误, response is ${resJson}`)
            } 
            
            return resJson.data            
        })
}

function queryVotes(superNodeName, cycle) {
    let url = `http://150.109.60.74:8080/vote/node/query?nodeName=${encodeURIComponent(superNodeName)}&fromCycle=${cycle}&toCycle=${cycle}`
    return fetch(url)
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
    return config.foundationMembers
}

function findMember(clubMembers, address) {
    for (i = 0; i < clubMembers.length; i++) {
        member = clubMembers[i]
        if (member.earningsAddr===address) {
            return member
        }
    }
}

async function calcAllocationByCycle(cycle, superNodeName) {
    votes = await queryVotes(superNodeName, cycle) 
    award = await queryAward(superNodeName, cycle)

    
    if (!votes || !award || votes.cycleVotes.length <= 0 || 
        votes.addressVotes.length <= 0) {
        throw new Error(`奖励数据为空，${cycle}轮无奖励`)
    }
    award.totalAward = parseFloat(award.totalAward, 10)
    award.blockAward = parseFloat(award.blockAward, 10)
    award.voteAward = parseFloat(award.voteAward, 10)

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
            memberName = addr
        } else {
            memberName = member.name
        }
        if (!fundMembersVote[memberName]) {
            fundMembersVote[memberName] = {
                address: addr,
                
                pledgeVote: 0,
                pledgeVoteRatio: 0,
                
                realVote: 0,
                realVoteRatio: 0,

                voteTotal: 0,
                voteRatio: 0,       

            
            }
            if (memberName !== addr) {
                let personalPledgeVote = member.pledgeAmount * AMOUNT_VOTE_RATION

                fundMembersVote[memberName].earningsAddr = addressVote.earningsAddr
                fundMembersVote[memberName].pledgeVote = personalPledgeVote 
                fundMembersVote[memberName].pledgeVoteRatio = fundMembersVote[memberName].pledgeVote / totalVote 
            }
        } 

        fundMembersVote[memberName].realVote += parseFloat(addressVote.voteTotal, 10)
        fundMembersVote[memberName].voteTotal = fundMembersVote[memberName].realVote + fundMembersVote[memberName].pledgeVote

        fundMembersVote[memberName].realVoteRatio = fundMembersVote[memberName].realVote / totalVote
        fundMembersVote[memberName].voteRatio = fundMembersVote[memberName].voteTotal / totalVote

        fundMembersVote[memberName].award = award.totalAward * fundMembersVote[memberName].voteRatio
    });

    console.log("")
    printTotalVote(totalVote, originTotalVote, pledgeVote)
    console.log("")
    printFundMembersVote(fundMembersVote)
    
    return {
        date: `${cycleToDate(cycle - 1).format("YYYY-MM-DD 12:13:14")} - ${cycleToDate(cycle).format("YYYY-MM-DD 12:13:14")}`,
        cycle: cycle,

        totalAward: award.totalAward,
        blockAward: award.blockAward,
        voteAward: award.voteAward,

        totalVote: totalVote,
        originTotalVote: originTotalVote,
        pledgeVote: pledgeVote,

        fundMembersVote: fundMembersVote
    }
    
}
async function calcAllocation(dayDate, superNodeName) {
    let cycle = dateToCycle(dayDate);
    return calcAllocationByCycle(cycle, superNodeName)
}

function printTotalVote(totalVote, originTotalVote, pledgeVote) {
    console.log(`总票量是${totalVote} (${originTotalVote} + ${pledgeVote}(抵押换算的票量) )`)
}

function printFundMembersVote(fundMembersVote) {
    console.log(`各成员投票占比:`)
    Object.keys(fundMembersVote).forEach(function (name, index) {
        let vote = fundMembersVote[name]
        console.log(`${index}.${name}`)
        console.log(`地址列表: ${vote.address}`)
        
        console.log(`抵押票量: ${vote.pledgeVote}`)
        console.log(`抵押票量占比: ${vote.pledgeVoteRatio}`)

        console.log(`投票量: ${vote.realVote}`)
        console.log(`投票量占比: ${vote.realVoteRatio}`)

        console.log(`总票量: ${vote.voteTotal}`)
        console.log(`总票量占比: ${vote.voteRatio}`)
        console.log("")
    })
}

module.exports = {
    findMember: findMember,
    calcAllocation: calcAllocation,
    calcAllocationByCycle: calcAllocationByCycle,
    dateToCycle: dateToCycle
}