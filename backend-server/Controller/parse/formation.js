const { bubbleSort } = require('../../utils/utils')
const fs = require('fs')
const path = require('path')

/**
 * @func formation
 * @desc 根据阵型返回11个位置
 * @param {lineupNumber}  
 * @return {} 
 */
function formation (lineupNumber) {
  if (lineupNumber === '4-2-1-3') {
    positionArr = ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'CAM', 'LW', 'ST', 'RW']
  } else if (lineupNumber === '4-2-3-1') {
    positionArr = ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'LM', 'CAM', 'RM', 'ST']
  } else if (lineupNumber === '3-4-2-1') {
    positionArr = ['GK', 'LCB', 'CB', 'RCB', 'LB', 'CDM', 'CDM', 'RB', 'LM', 'RM', 'ST']
  } else if (lineupNumber === '4-3-3') {
    positionArr = ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CDM', 'RM', 'LW', 'ST', 'RW']
  } else if (lineupNumber === '3-5-2') {
    positionArr = ['GK', 'LCB', 'CB', 'RCB', 'LB', 'CM', 'CDM', 'CM', 'RB', 'ST', 'ST']
  } else if (lineupNumber === '3-4-3') {
    positionArr = ['GK', 'LCB', 'CB', 'RCB', 'LB', 'CDM', 'CDM', 'RB', 'LW', 'ST', 'RW']
  } else if (lineupNumber === '4-4-2') {
    positionArr = ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CDM', 'CDM', 'RM', 'ST', 'ST']
  } else if (lineupNumber === '3-3-2-2') {
    positionArr = ['GK', 'LCB', 'CB', 'RCB', 'CDM', 'CDM', 'CDM', 'LM', 'RM', 'ST', 'ST']
  } else if (lineupNumber === '5-4-1') {
    positionArr = ['GK', 'LB', 'LCB', 'CB', 'RCB', 'RB', 'LM', 'CDM', 'CDM', 'RM', 'ST']
  } else if (lineupNumber === '4-1-3-2') {
    positionArr = ['GK', 'LB', 'LCB', 'CB', 'RCB', 'CDM', 'LM', 'CAM', 'RM', 'ST', 'ST']
  } else if (lineupNumber === '4-1-2-3') {
    positionArr = ['GK', 'LB', 'LCB', 'CB', 'RCB', 'CDM', 'LM', 'RM', 'LW', 'ST', 'RW']
  } else if (lineupNumber === '4-5-1') {
    positionArr = ['GK', 'LB', 'LCB', 'CB', 'RCB', 'LM', 'CM', 'CDM', 'CM', 'RM', 'ST']
  } else if (lineupNumber === '3-4-1-2') {
    positionArr = ['GK', 'LCB', 'CB', 'RCB', 'LB', 'CDM', 'CDM', 'RB', 'CAM', 'ST', 'ST']
  } else if (lineupNumber === '5-3-2') {
    positionArr = ['GK', 'LB', 'LCB', 'CB', 'RCB', 'RB', 'LM', 'CDM', 'RM', 'ST', 'ST']
  } else if (lineupNumber === '4-4-1-1') {
    positionArr = ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CDM', 'CDM', 'RM', 'CF', 'ST']
  } else if (lineupNumber === '4-1-4-1') {
    positionArr = ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LM', 'CAM', 'CAM', 'RM', 'ST']
  } else if (lineupNumber === '3-1-4-2') {
    positionArr = ['GK', 'LCB', 'CB', 'RCB', 'CDM', 'LM', 'CAM', 'CAM', 'RM', 'ST', 'ST']
  } else if (lineupNumber === '4-3-1-2') {
    positionArr = ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CDM', 'RM', 'CAM', 'ST', 'ST']
  } else if (lineupNumber === '3-5-1-1') {
    positionArr = ['GK', 'LCB', 'CB', 'RCB', 'LB', 'CM', 'CDM', 'CM', 'RB', 'CF', 'ST']
  } else if (lineupNumber === '4-3-2-1') {
    positionArr = ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CDM', 'RM', 'LW', 'RW', 'ST']
  } else if (lineupNumber === '3-2-4-1') {
    positionArr = ['GK', 'LCB', 'CB', 'RCB', 'CDM', 'CDM', 'LM', 'CM', 'CM', 'RM', 'ST']
  } else if (lineupNumber === '3-3-1-3') {
    positionArr = ['GK', 'LCB', 'CB', 'RCB', 'LM', 'CDM', 'RM', 'CAM', 'LW', 'ST', 'RW']
  } else {
    positionArr = ['NO', 'NO', 'NO', 'NO', 'NO', 'NO', 'NO', 'NO', 'NO', 'NO', 'NO']
  }
  return positionArr
}

function regularLineUp (team, players, isNation) {
  // for (let key in team) {
    //   let str = team[key].number + '-' + team[key].qname + ' ' + team[key].caps + '场' + team[key].lineups + '首发,'
    //   if (team[key].goal != 0) str = str + team[key].goal + '球'
    //   if (team[key].assist != 0) str = str + team[key].assist + '助,'
    //   str = str + JSON.stringify(team[key].regularPosition)
    //   console.log(str)
    // }
    // 最后，是常用阵型算法，最多出场数的GK和前10个最常首发的人
    // 找到门将
    let gkLineup = []
    for (let key in team) {
      if (team[key].regularPosition.hasOwnProperty('GK')) {
        if ((gkLineup.length > 0 && gkLineup[0].lineups < team[key].regularPosition['GK'].lineups) || gkLineup.length === 0) {
          gkLineup = []
          // 如果是分析球员的，加上GK的位置
          team[key].position = 'GK'
          gkLineup.push(team[key])
        }
      }
    }
    // 找到首发数字最多10个人(联赛适用，但是国家队不适用)
    let otherLineup = []
    const best = []
    for (let key in team) {
      // 1.一个一个遍历
      // 2.排除regularPosition没有GK的和没位置的
      if (team[key].regularPosition.hasOwnProperty('GK') || JSON.stringify(team[key].regularPosition) === '{}') continue
      // 3.一个一个加入数组中
      best.push(team[key])
    }
    // 4.从小到大排序
    let best2 = bubbleSort(best, 'lineups')
    best2.reverse()
    best2.forEach(item => {
      if (isNation) console.log(item.qname+' '+item.caps+'场'+item.lineups+'首发, '+item.goal+'球'+item.assist+'助, '+ JSON.stringify(item.regularPosition))
      else console.log(item.number+'-'+item.qname+' '+item.caps+'场'+item.lineups+'首发, '+item.goal+'球'+item.assist+'助, '+ JSON.stringify(item.regularPosition))
    })
    // 要保存best2这个数组
    fs.writeFileSync(path.resolve(__dirname, `../../player_center/${global.serial}-new.json`), JSON.stringify(best2), 'utf8')
    const df = []
    const mf = []
    const fw = []
    for (let j = 0; j < best2.length; j++) {
      let position = '', count = 0
      for (let k in best2[j].regularPosition) {
        let tempPosition = k
        let tempCount = best2[j].regularPosition[k]
        if ((tempCount > count) || (position === '' && count === 0)) {
          position = tempPosition
          count = tempCount
        }
      }
      best2[j].position = position
      if (j >= 10) continue
      if (position.indexOf('B') > -1) {
        df.push(best2[j])
      } else if (position.indexOf('M') > -1) {
        mf.push(best2[j])
      } else {
        fw.push(best2[j])
      }
    }
    console.log('常用阵型:', df.length, mf.length, fw.length)
    let tempStr = ''
    if (isNation) tempStr = tempStr + gkLineup[0].qname + '/'
    else tempStr = tempStr + gkLineup[0].number + '-' + gkLineup[0].qname + '/'
    for (let l = 0; l < df.length; l++) {
      if (isNation) tempStr = tempStr + df[l].qname + ','
      else tempStr = tempStr + df[l].number + '-' + df[l].qname + ','
    }
    tempStr = tempStr.substring(0, tempStr.length - 1) + '/'
    for (let l = 0; l < mf.length; l++) {
      if (isNation) tempStr = tempStr + mf[l].qname + ','
      else tempStr = tempStr + mf[l].number + '-' + mf[l].qname + ','
    }
    tempStr = tempStr.substring(0, tempStr.length - 1) + '/'
    for (let l = 0; l < fw.length; l++) {
      if (isNation) tempStr = tempStr + fw[l].qname + ','
      else tempStr = tempStr + fw[l].number + '-' + fw[l].qname + ','
    }
    tempStr = tempStr.substring(0, tempStr.length - 1)
    console.log(tempStr)
    // 将best2数组里的球员和json文件里的球员合并，创造一个新json
    best2 = gkLineup.concat(best2)
    for (let m = 0; m < best2.length; m++) {
      for (let n = 0; n < players.length; n++) {
        if (players[n].number == best2[m].number) {
          players[n].position = best2[m].position
          players[n].regularPosition = best2[m].regularPosition
          players[n].caps = best2[m].caps
          players[n].lineups = best2[m].lineups
          players[n].subs = best2[m].subs
          players[n].goal = best2[m].goal
          players[n].assist = best2[m].assist
          if (best2[m].position.indexOf('B') > -1) {
            players[n].staff = 'DF'
          } else if (best2[m].position.indexOf('M') > -1) {
            players[n].staff = 'MF'
          } else if (best2[m].position.indexOf('GK') > -1) {
            players[n].staff = 'GK'
          } else {
            players[n].staff = 'FW'
          }
          break
        }
      }
    }
    // 遍历一次，洗数据
    players = players.map(item => {
      if (Array.isArray(item.position) && item.position[0] === '') {
        item.position = ''
      }
      if (!item.regularPosition) {
        item.regularPosition = {}
      }
      item.isForeign = 0
      return item
    })
    return players
}

function regularPlayerNameList (team, players, isNation) {
  // console.log('1.', team)
  // console.log('2.', players)
  // 将每场比赛统计的球员数据（team）和json文件里的球员（players）合并，创造一个新json
  // 找出打的最多的位置，赋给Positioon属性
  let count = -1
  let position = ''
  for (let key in team) {
    // 找到最多的
    if (JSON.stringify(team[key].regularPosition) === '{}') {
      team[key].position = ''
    }
    for (let k in team[key].regularPosition) {
      if (team[key].regularPosition[k] > count) {
        count = team[key].regularPosition[k]
        position = k
      }
    }
    team[key].position = position
    count = -1
    position = ''
  }
  // console.log(team)
  // console.log(players)
  for (let n = 0; n < players.length; n++) {
    let singlePersonInTeam = team[String(players[n].number)]
    if (singlePersonInTeam === undefined) continue
    players[n].qname = singlePersonInTeam.qname
    players[n].position = singlePersonInTeam.position
    players[n].regularPosition = singlePersonInTeam.regularPosition
    players[n].caps = singlePersonInTeam.caps
    players[n].lineups = singlePersonInTeam.lineups
    players[n].subs = singlePersonInTeam.subs
    players[n].goal = singlePersonInTeam.goal
    players[n].assist = singlePersonInTeam.assist
    if (singlePersonInTeam.position.indexOf('B') > -1) {
      players[n].staff = 'DF'
    } else if (singlePersonInTeam.position.indexOf('M') > -1) {
      players[n].staff = 'MF'
    } else if (singlePersonInTeam.position.indexOf('GK') > -1) {
      players[n].staff = 'GK'
    } else {
      players[n].staff = 'FW'
    }
  }
  // 遍历一次，洗数据
  players = players.map(item => {
    if (Array.isArray(item.position) && item.position[0] === '') {
      item.position = ''
    }
    if (!item.regularPosition) {
      item.regularPosition = {}
    }
    item.isForeign = 0
    return item
  })
  return players
}

module.exports = {
  formation,
  regularLineUp,
  regularPlayerNameList
}