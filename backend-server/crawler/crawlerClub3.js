const cheerio = require('cheerio')
const fs = require('fs')
const { service } = require('../utils/utils')
const { detailHeaders } = require('../config/league')
const { formation, regularLineUp } = require('../Controller/parse/formation')
const { getPlayerInfo } = require('../Controller/parse/player')
const { pickupGoalAndAssist } = require('../Controller/parse/data')
const { delay } = require('../Controller/delay')
const staticData = require('../config/wudaconfig')
const path = require('path')

let rounds = fs.readFileSync(path.resolve(__dirname, `../match_center/${staticData.leagueSerial}.js`), 'utf8')
var jh = []
eval(rounds)

global.serial = Number(staticData.teamSerial)
const matchArr = []
let team = {}
const players = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../player_center/${global.serial}.json`), 'utf8'))
// 是否国家队分析
global.isNation = false
// 196 hengbin
// 先获取编号
// 我要遍历196号的所有
if (!global.isNation) {
  for (let i = 1; i < Number(staticData.roundSerial); i++) {
    // if (i === 26) continue
    for (let j = 0; j < jh['R_'+i].length; j++) {
      // 找到编号196的球队的match编号
      if (jh['R_'+i][j][4] === global.serial) {
        let obj = { status: 'home', matchSerial: jh['R_'+i][j][0], round: i }
        matchArr.push(obj)
      }
      if (jh['R_'+i][j][5] === global.serial) {
        let obj = { status: 'guest', matchSerial: jh['R_'+i][j][0], round: i }
        matchArr.push(obj)
      }
    }
  }
} else {
  // 20220909更新，这是国家队的，国家队就把这个for循环打开，适应欧国联
  for (let j = 0; j < jh['G25366A'].length; j++) {
    // 找到编号196的球队的match编号
    // 小组赛不一定
    if (jh['G25366A'][j][4] === global.serial && jh['G25366A'][j][6] !== '') {
      let obj = { status: 'home', matchSerial: jh['G25366A'][j][0], round: matchArr.length + 1 }
      matchArr.push(obj)
    } else if (jh['G25366A'][j][5] === global.serial && jh['G25366A'][j][6] !== '') {
      let obj = { status: 'guest', matchSerial: jh['G25366A'][j][0], round: matchArr.length + 1 }
      matchArr.push(obj)
    }
  }
}
// console.log(matchArr)
// 然后，一个个发请求
for (let i = 0; i < matchArr.length; i++) {
  delay(() => {
    service({
      method: 'GET',
      url: `http://bf.titan007.com/detail/${matchArr[i].matchSerial}cn.htm`,
      headers: detailHeaders
    }).then(res => {
      // console.log(res.data)
      const $1 = cheerio.load(res.data)
      // 阵型
      let lineupNumber = ''
      // if 条件，区分新版旧版界面
      if ($1('.content .title .homeN').html()) {
        lineupNumber = $1(`.content .title .${matchArr[i].status}N`).html().replace(/(<a.*?>[\s\S]*?<\/a>)/gi, '').trim()
      } else {
        lineupNumber = $1(`#matchBox2>.teamNames .${matchArr[i].status}`).html().replace(/(<a.*?>[\s\S]*?<\/a>)/gi, '').trim()
      }
      console.log(lineupNumber)
      console.log(matchArr[i].round)
      let positionArr = formation(lineupNumber)
      if (matchArr[i].status === 'guest') {
        positionArr.reverse()
      }
      let displayLineup = ''
      // 首发阵容
      $1(`#matchBox2 .plays .${matchArr[i].status} .playBox .play`).each(function(n, i){
        let newFlag = false
        if ($1('.content .title .homeN').html()) {
          newFlag = true
        } else {
          newFlag = false
        }
        const [goal, assist, subcaps, subs] = pickupGoalAndAssist($1, i, false, newFlag)
        let numberAndName = ''
        try {
          if (newFlag) {
            numberAndName = $1(i).children().children().first().text() + $1(i).children().children('.name').children().text()
          } else {
            numberAndName = $1(i).children().children('.name').children().text()
          }
          displayLineup = displayLineup + getPlayerInfo(numberAndName, team, positionArr[n], goal, assist, subcaps, subs, false, global.isNation)
        } catch {
          displayLineup = displayLineup + getPlayerInfo($1(i).children('.name').children().text(), team, 'NO', goal, assist, subcaps, subs, false, global.isNation)
        }
      })
      console.log(displayLineup)
      let displaySubs = '替补：'
      // 替补阵容
      $1(`#matchBox2 .backupPlay .${matchArr[i].status} .play`).each(function(n, i) {
        const [goal, assist, subcaps, subs] = pickupGoalAndAssist($1, i, true)
        displaySubs = displaySubs + getPlayerInfo($1(i).children().children('.name').children().text(), team, positionArr[n], goal, assist, subcaps, subs, true, global.isNation)
      })
      console.log(displaySubs)
      
    })
  }, 1)
}


setTimeout(() => {
  const newPlayers = regularLineUp(team, players, global.isNation)
  fs.writeFileSync(path.resolve(__dirname, `../player_center/${global.serial}.json`), JSON.stringify(newPlayers), 'utf8')
}, 4000)