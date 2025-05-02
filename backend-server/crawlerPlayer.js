const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

const { dateFormat, Queue, service, deepClone } = require('./utils/utils')
const { League } = require('./class')
const staticData = require('./config/wudaconfig')

const {
  qiutanHeaders
} = require('./config/league')
const serial = staticData.teamSerial
service({
  methods: 'GET',
  url: `http://zq.titan007.com/jsData/teamInfo/teamDetail/tdl${serial}.js?version=${dateFormat(new Date().getTime(), 'YYYYMMDDHH')}`,
  headers: qiutanHeaders
}).then(res => {
  eval(res.data)
  // rearguard 后卫 vanguard 前锋 goalkeeper 门将 midfielder 中场
  const players = parsePlayer(rearguard, vanguard, goalkeeper, midfielder, lineupDetail)
  fs.writeFileSync(path.resolve(__dirname, `./player_center/${serial}.json`), JSON.stringify(players), 'utf8')
})

function parsePlayer (rearguard, vanguard, goalkeeper, midfielder, lineupDetail) {
  const players = []
  let mapObj = {}
  goalkeeper.forEach(item => {
    const obj = {}
    obj.number = Number(item[1])
    obj.name = item[2]
    obj.attrDes = "GK"
    players.push(obj)
  })
  rearguard.forEach(item => {
    const obj = {}
    obj.number = Number(item[1])
    obj.name = item[2]
    obj.attrDes = "DF"
    players.push(obj)
  })
  midfielder.forEach(item => {
    const obj = {}
    obj.number = Number(item[1])
    obj.name = item[2]
    obj.attrDes = "MF"
    players.push(obj)
  })
  vanguard.forEach(item => {
    const obj = {}
    obj.number = Number(item[1])
    obj.name = item[2]
    obj.attrDes = "FW"
    players.push(obj)
  })
  players.forEach((item, index) => {
    mapObj[item.name] = index
  })
  for (let i = 0; i < lineupDetail.length; i++) {
    if (lineupDetail[i][8] === '主教练') continue
    // 找号码
    const number = Number(lineupDetail[i][1].trim())
    // 找名字
    const name = lineupDetail[i][2].trim()
    // 找年龄
    const age = new Date().getFullYear() - lineupDetail[i][5].trim().split('-')[0]
    // 找身高
    const height = Number(lineupDetail[i][6].trim())
    // 找国籍
    const nation = lineupDetail[i][9].trim()
    // 找位置 8
    const position = lineupDetail[i][8].trim()
    // 找身价 11
    const socialStatus = lineupDetail[i][11].trim()
    // 根据名字找Players数组下标
    if (mapObj.hasOwnProperty(name)) {
      const idx = mapObj[name]
      if (players[idx].number === number) {
        players[idx].age = age
        players[idx].height = height
        players[idx].nation = nation
        players[idx].position = position
        players[idx].socialStatus = socialStatus

      }
    }
  }
  // 输出
  players.forEach(item => {
    // name 名字
    // nation 国家
    // attrDes 前锋or中场or后卫or门将
    // number 球衣号
    // age 年龄
    // height 身高
    // position 位置
    // socialStatus 身价
    console.log(item.name, item.nation, item.attrDes, item.number, item.age, item.height, item.position, item.socialStatus+'万英镑')
  })
  // 更改输出形式
  let gk = '门将：'
  let df = '后卫：'
  let mf = '中场：'
  let fw = '前锋：'
  players.forEach(item => {
    // 布鲁诺·费尔南德斯（25岁，188cm，前腰，8000万），
    let str = `${item.name}（${item.age}岁，${item.height == 0 ? '' : item.height + 'cm，'}${item.position}，${item.socialStatus}万），`
    // let str = `${item.number}-${item.name}（${item.age}岁，${item.height == 0 ? '' : item.height + 'cm，'}${item.position}，${item.socialStatus}万），`
    if (item.attrDes === 'GK') {
      gk = gk + str
    } else if (item.attrDes === 'FW') {
      fw = fw + str
    } else if (item.attrDes === 'MF') {
      mf = mf + str
    } else {
      df = df + str
    }
  })
  console.log(gk+'\r\n'+df+'\r\n'+mf+'\r\n'+fw)
  // 标准化返回
  const standardPlayers = []
  players.forEach(item => {
    const obj = {}
    obj.name = item.name
    obj.nation = item.nation
    obj.stats = 0
    obj.position = [""]
    obj.staff = item.attrDes
    obj.attr = item.attrDes
    obj.attrDes = item.attrDes
    obj.caps = 0
    obj.lineups = 0
    obj.age = item.age
    obj.number = item.number
    obj.height = item.height
    obj.qiutanPosition = item.position
    obj.socialStatus = item.socialStatus
    standardPlayers.push(obj)
  })
  return standardPlayers
}