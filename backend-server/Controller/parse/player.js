/*
* @Description: parsePlayer
* @Author: Lidongheng
* @Date: 2022-09-09
* @LastEditTime: 2022-09-09
* @LastEditors: Please set LastEditors
*/

/**
 * @func parsePlayer
 * @desc 
 * @param {
 *   rearguard: DFArray,
 *   vanguard: FWArray,
 *   goalkeeper: GKArray,
 *   midfielder: MFArray,
 *   lineupDetail: 大名单数组
 * }  
 * @return {} 
 */

function parsePlayer (rearguard, vanguard, goalkeeper, midfielder, lineupDetail) {
  // 创建个数组存放players
  const players = []
  // 创建个对象存放players
  let mapObj = {}
  // 遍历players关键信息，放进数组中
  goalkeeper.forEach(item => {
    const obj = {}
    obj.number = Number(item[1])
    obj.name = item[2]
    obj.ename = item[4]
    obj.attrDes = "GK"
    players.push(obj)
  })
  rearguard.forEach(item => {
    const obj = {}
    obj.number = Number(item[1])
    obj.name = item[2]
    obj.ename = item[4]
    obj.attrDes = "DF"
    players.push(obj)
  })
  midfielder.forEach(item => {
    const obj = {}
    obj.number = Number(item[1])
    obj.name = item[2]
    obj.ename = item[4]
    obj.attrDes = "MF"
    players.push(obj)
  })
  vanguard.forEach(item => {
    const obj = {}
    obj.number = Number(item[1])
    obj.name = item[2]
    obj.ename = item[4]
    obj.attrDes = "FW"
    players.push(obj)
  })
  // 创建球员名和数组下标的映射，目的是对爬虫js文件的数据做合并
  players.forEach((item, index) => {
    mapObj[item.name] = index
  })
  for (let i = 0; i < lineupDetail.length; i++) {
    if (lineupDetail[i][8] === '主教练') continue
    // 找网页
    const serial = lineupDetail[i][0]
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
    // 找英文名
    const ename = lineupDetail[i][4].trim()
    // 根据名字找Players数组下标
    if (mapObj.hasOwnProperty(name)) {
      const idx = mapObj[name]
      if (players[idx].number === number) {
        players[idx].serial = serial
        players[idx].age = age
        players[idx].height = height
        players[idx].nation = nation
        players[idx].ename = ename
      }
    }
  }
  // 输出
  players.forEach(item => {
    console.log(item.serial, item.name, item.nation, item.attrDes, item.number, item.age, item.height, item.ename)
  })
  return players
}

/**
 * @func 获取player信息
 * @desc 
 * @param {
 *   str：截取的字符串，有号码，有名字
 *   team：主程序的team对象
 *   position：位置
 *   goal、assist：
 *   subcaps：板凳出场数
 *   subs：板凳数
 *   subsflag：现在是parse首发还是parse替补
 *   isNation：是否国家队分析
 *   players：球队对象
 *   
 * }  
 * @return {} 
 */
function getPlayerInfo (str, team, position, goal, assist, subcaps, subs, subsflag, isNation) {
  let number = str.match(/[\d]+/gi)[0]
  let qname = str.split(number).pop().trim()
  // 如果是国家队，就用名字代替球衣号
  // if (isNation) number = qname
  if (!team.hasOwnProperty(number)) {
    team[number] = {}
    team[number].qname = qname
    team[number].number = number
    if (subcaps === 1) {
      team[number].caps = 1
      team[number].lineups = 0
      team[number].subs = 0
    } else if (subs === 1) {
      team[number].caps = 0
      team[number].lineups = 0
      team[number].subs = 1
    } else {
      team[number].caps = 1
      team[number].lineups = 1
      team[number].subs = 0
    }
    team[number].regularPosition = {}
    team[number].goal = goal
    team[number].assist = assist
    if (!subsflag) {
      if (!team[number].regularPosition.hasOwnProperty(position)) {
        team[number].regularPosition[position] = 1
      } else {
        team[number].regularPosition[position] += 1
      }
    }
  } else {
    if (subcaps === 1) {
      team[number].caps += 1
    } else if (subs === 1) {
      team[number].subs += 1
    } else {
      team[number].caps += 1
      team[number].lineups += 1
    }
    if (!subsflag) {
      if (!team[number].regularPosition.hasOwnProperty(position)) {
        team[number].regularPosition[position] = 1
      } else {
        team[number].regularPosition[position] += 1
      }
    }
    team[number].goal += goal
    team[number].assist += assist
  }
  if (isNation) return qname + ','
  else return number + '-' + qname + ','
}

module.exports = {
  parsePlayer,
  getPlayerInfo
}