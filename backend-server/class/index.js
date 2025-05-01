const { dateFormat, bubbleSort2, getWeekDay } = require('../utils/utils')
const fs = require('fs')
const path = require('path')
const news = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'record.json'), 'utf8'))
class Player {
  constructor (data, clubName) {
    this.name = data.name
    this.stats = data.stats
    this.position = data.position
    this.regularPosition = data.regularPosition
    this.caps = data.caps
    this.lineups = data.lineups
    this.club = clubName
    this.nation = data?.nation || undefined
    this.staff = data.staff
    this.age = data?.age
    this.number = data?.number
    this.description = data?.description
    this.height = data?.height || undefined
    this.goal = data?.goal || undefined
    this.assist = data?.assist || undefined
    this.isForeign = data.isForeign
  }
}

class Club {
  constructor (data) {
    // 俱乐部名：浦和红钻
    this.clubName = data.clubName
    // 联盟：日职联
    this.league = data.league
    // 档次：第一档次
    this.grade = data.grade
    // 球员组成
    this.players = []
    for (let i = 0; i < data.players.length; i++) {
      const player = new Player(data.players[i], data.clubName)
      this.players.push(player)
    }
    // 教练
    this.coach = data.coach
    // 常用阵型
    this.formations = data.formations
    // 关键球员
    this.keyPlayers = data.keyPlayers ? {
      goal: data.keyPlayers.goal,
      assist: data.keyPlayers.assist,
      caps: data.keyPlayers.caps,
      pass: data.keyPlayers.pass,
      keyPass: data.keyPlayers.keyPass,
      intercept: data.keyPlayers.intercept,
      steals: data.keyPlayers.steals,
      clearance: data.keyPlayers.clearance
    } : undefined
    // 球探网序号
    this.serial = data.serial
    // 一些盘口数据
    this.totalScore = data.totalScore,
    this.homeScore = data.homeScore,
    this.guestScore = data.guestScore,
    this.totalPanlu = data.totalPanlu,
    this.homePanlu = data.homePanlu,
    this.guestPanlu = data.guestPanlu,
    this.totalBs = data.totalBs,
    this.homeBs = data.homeBs,
    this.guestBs = data.guestBs,
    this.prevenientMatch = data.prevenientMatch
  }
  addPlayer (data) {
    new Player(data)
  }
  getATeamPlayers () {
    this.players.push()
  }
}

class League {
  static JLeagueGrade = [
    ['川崎前锋', '鹿岛鹿角', '横滨水手'],
    ['浦和红钻', '广岛三箭', '大阪樱花', 'FC东京', '柏太阳神', '名古屋鲸八'],
    ['神户胜利船', '大阪钢巴', '札幌冈萨多', '清水鼓动','清水心跳', '福冈黄蜂'],
    ['湘南海洋', '湘南比马', '鸟栖沙岩', '磐田喜悦', '磐田山叶', '京都不死鸟']
  ]
  static EliteserienGrade = [
    ['博多格林特', '莫尔德', '维京'],
    ['罗森博格', '利勒斯特罗姆', '瓦勒伦加'],
    ['奥德格伦兰', '斯托姆加斯特', '奥勒松'],
    ['海于格松', '谢夫', '特罗姆瑟', '基斯迪辛特', '萨普斯堡', '桑德菲杰', '汉坎']
  ]
  static KLeagueGrade = [
    ['蔚山现代', '全北现代'],
    ['浦项制铁', '济州联队', '大邱FC', '金泉尚武'],
    ['FC首尔', '水原三星', '仁川联队'],
    ['江原FC', '城南足球俱乐部', '水原城']
  ]
  static EuropeLeagueGrade = [
    ['法国', '英格兰', '葡萄牙', '西班牙', '比利时', '荷兰'],
    ['丹麦', '瑞士', '克罗地亚', '威尔士', '波兰'],
    ['匈牙利', '捷克', '奥地利']
  ]
  static PremierLeagueGrade = [
    ['曼彻斯特城'],
    ['阿森纳', '利物浦', '曼彻斯特联', '托特纳姆热刺', '纽卡斯尔联', '切尔西'],
    ['布莱顿', '西汉姆联', '富勒姆', '水晶宫'],
    ['布伦特福德', '阿斯顿维拉', '莱切斯特城'],
    ['利兹联', '埃弗顿', '狼队', '南安普敦', '伯恩茅斯', '诺丁汉森林']    
  ]
  static SerieAGrade = [
    ['AC米兰', '国际米兰', '那不勒斯'],
    ['亚特兰大', '罗马', '拉齐奥', '佛罗伦萨', '尤文图斯'],
    ['乌迪内斯', '都灵', '森索罗', '恩波利'],
    ['莱切', '桑普多利亚', '蒙扎', '博洛尼亚', '克雷莫纳', '萨勒尼塔纳', '斯佩齐亚', '维罗纳']
  ]
  static Ligue2Grade = [
    ['勒阿弗尔', '波尔多', '索肖', '梅斯'],
    ['圣埃蒂安', '亚眠', '格勒诺布尔', '巴黎足球会', '卡昂', '克维伊', '瓦朗谢纳', '巴斯蒂亚', '甘冈', '波城', '安尼茨'],
    ['拉瓦勒', '罗德兹', '第戎', '尼奥特', '尼姆']
  ]
  static LaLigaGrade = [
    ['皇家马德里', '巴塞罗那', '马德里竞技'],
    ['皇家贝蒂斯', '毕尔巴鄂竞技', '皇家社会', '比利亚雷亚尔'],
    ['塞维利亚', '奥萨苏纳', '赫塔菲', '加迪斯', '西班牙人', '巴列卡诺', '瓦伦西亚', '赫罗纳', '马洛卡', '塞尔塔'],
    ['阿尔梅里亚', '埃尔切', '瓦拉多利德']
  ]
  static AustraliaGrade = [
    ['墨尔本城'],
    ['墨尔本胜利', '中部海岸海员', '西悉尼流浪者', '悉尼FC'],
    ['西部联', '麦克阿瑟FC', '布里斯班狮吼', '阿德莱德联', '惠灵顿凤凰'],
    ['珀斯光荣', '纽卡斯尔喷气机']
  ]
  static leagueChineseToEnglish (league) {
    if (league === '日职联') {
      return 'JLeague'
    } else if (league === '韩K联') {
      return 'KLeague'
    } else if (league === '挪超') {
      return 'Eliteserien'
    } else if (league === '欧国联') {
      return 'EuropeLeague'
    } else if (league === '英超') {
      return 'PremierLeague'
    } else if (league === '意甲') {
      return 'SerieA'
    } else if (league === '法乙') {
      return 'Ligue2'
    } else if (league === '西甲') {
      return 'LaLiga'
    } else if (league === '澳洲甲') {
      return 'Australia'
    } else {
      return league
    }
  }

  static leagueEnglishToChinese (league) {
    if (league === 'JLeague') {
      return '日职联'
    } else if (league === 'KLeague') {
      return '韩K联'
    } else if (league === 'Eliteserien') {
      return '挪超'
    } else if (league === 'EuropeLeague') {
      return '欧国联'
    } else if (league === 'PremierLeague') {
      return '英超'
    } else if (league === 'SerieA') {
      return '意甲'
    } else if (league === 'Ligue2') {
      return '法乙'
    } else if (league === 'LaLiga') {
      return '西甲'
    } else if (league === 'Australia') {
      return '澳洲甲'
    } else {
      return league
    }
  }

  // 获取球队所在联赛的档次
  static getGrade (league, name) {
    if (!League.include(league)) return null
    for (let i = 0; i < League[league + 'Grade'].length; i++) {
      for (let j = 0; j < League[league + 'Grade'][i].length; j++) {
        // 改进优化算法
        if (League[league + 'Grade'][i][j] === name) {
          return i + 1
        } else {
          let n = League[league + 'Grade'][i][j].length
          let count = 0
          for (let k = n; k > 0; k--) {
            if (League[league + 'Grade'][i][j][k] !== name[k]) break
            else {
              if (League[league + 'Grade'][i][j][k - 1] !== name[k - 1]) break
              count = count + 1
              if (count === (n - 1)) return i + 1
            }
          }
        }
      }
    }
  }

  // 获取某个联赛同档次的所有球队
  static getSameGradeTeams (league, team) {
    const grade = League.getGrade(league, team)
    return League[league + 'Grade'][grade - 1]
  }

  static getOdd (league, hostTeam, awayTeam) {
    if (!League.include(league)) return ''
    const hostGrade = League.getGrade(league, hostTeam)
    const awayGrade = League.getGrade(league, awayTeam)
    if (league === 'JLeague') {
      if (hostGrade === awayGrade) return '-0.25'
      else if (hostGrade - awayGrade === -1) return '-0.5'
      else if (hostGrade - awayGrade === -2) return '-0.75'
      else if (hostGrade - awayGrade === -3) return '-1'
      else if (hostGrade - awayGrade === 1) return '+0'
      else if (hostGrade - awayGrade === 2) return '+0.5'
      else if (hostGrade - awayGrade === 3) return '+0.75'
      else return ''
    } else if (league === 'KLeague') {
      if (hostGrade === awayGrade) return '-0.25'
      else if (hostGrade === 1 && awayGrade === 2) return '-0.25'
      else if (hostGrade === 1 && awayGrade === 3) return '-0.5'
      else if (hostGrade === 1 && awayGrade === 4) return '-0.75'
      else if (hostGrade === 2 && awayGrade === 1) return '+0'
      else if (hostGrade === awayGrade) return '-0.25'
      else if (hostGrade === 2 && awayGrade === 3) return '-0.25'
      else if (hostGrade === 2 && awayGrade === 4) return '-0.5'
      else if (hostGrade === 3 && awayGrade === 1) return '+0.25'
      else if (hostGrade === 3 && awayGrade === 2) return '+0'
      else if (hostGrade === 3 && awayGrade === 4) return '-0.25'
      else if (hostGrade === 4 && awayGrade === 1) return '+0.75'
      else if (hostGrade === 4 && awayGrade === 2) return '+0.25'
      else if (hostGrade === 4 && awayGrade === 3) return '+0'
      else return ''
    } else if (league === 'Eliteserien') {
      if (hostGrade === awayGrade) return '-0.25'
      else if (hostGrade === 1 && awayGrade === 2) return '-0.5'
      else if (hostGrade === 1 && awayGrade === 3) return '-1'
      else if (hostGrade === 1 && awayGrade === 4) return '-1.25'
      else if (hostGrade === 2 && awayGrade === 1) return '+0'
      else if (hostGrade === 2 && awayGrade === 3) return '-0.5'
      else if (hostGrade === 2 && awayGrade === 4) return '-0.75'
      else if (hostGrade === 3 && awayGrade === 1) return '+0.5'
      else if (hostGrade === 3 && awayGrade === 2) return '+0'
      else if (hostGrade === 3 && awayGrade === 4) return '-0.5'
      else if (hostGrade === 4 && awayGrade === 1) return '+0.75'
      else if (hostGrade === 4 && awayGrade === 2) return '+0.25'
      else if (hostGrade === 4 && awayGrade === 3) return '+0'
      else return ''
    } else if (league === 'EuropeLeague') {
      if (hostGrade === 1 && awayGrade === 2) return '-0.75'
      if (hostGrade === 3 && awayGrade === 1) return '+1'
      if (hostGrade === 2 && awayGrade === 1) return '+0.25'
      if (hostGrade === 1 && awayGrade === 3) return '-1.5'
      if (hostGrade === 2 && awayGrade === 2) return '-0.25'
      if (hostGrade === 2 && awayGrade === 3) return '-0.5'
      else return ''
    } else if (league === 'PremierLeague') {
      if (hostGrade === awayGrade && hostGrade < 5) return '-0.25'
      else if (hostGrade === 1 && awayGrade === 2) return '-1'
      else if (hostGrade === 1 && awayGrade === 3) return '-2'
      else if (hostGrade === 1 && awayGrade === 4) return '-2.5'
      else if (hostGrade === 1 && awayGrade === 5) return '-2.75'
      else if (hostGrade === 2 && awayGrade === 1) return '+0.5'
      else if (hostGrade === 2 && awayGrade === 3) return '-1'
      else if (hostGrade === 2 && awayGrade === 4) return '-1.25'
      else if (hostGrade === 2 && awayGrade === 5) return '-1.5'
      else if (hostGrade === 3 && awayGrade === 1) return '+1.25'
      else if (hostGrade === 3 && awayGrade === 2) return '+0.5'
      else if (hostGrade === 3 && awayGrade === 4) return '-0.25'
      else if (hostGrade === 3 && awayGrade === 5) return '-0.75'
      else if (hostGrade === 4 && awayGrade === 1) return '+1.5'
      else if (hostGrade === 4 && awayGrade === 2) return '+0.75'
      else if (hostGrade === 4 && awayGrade === 3) return '+0.25'
      else if (hostGrade === 4 && awayGrade === 5) return '-0.5'
      else if (hostGrade === 5 && awayGrade === 1) return '+2'
      else if (hostGrade === 5 && awayGrade === 2) return '+1.25'
      else if (hostGrade === 5 && awayGrade === 3) return '+0.5'
      else if (hostGrade === 5 && awayGrade === 4) return '+0.25'
      else if (hostGrade === 5 && awayGrade === 5) return '-0'
      else return ''
    } else if (league === 'SerieA') {
      if (hostGrade === 1 && awayGrade === 1) return '-0.25'
      else if (hostGrade === 1 && awayGrade === 2) return '-0.5'
      else if (hostGrade === 1 && awayGrade === 3) return '-1.25'
      else if (hostGrade === 1 && awayGrade === 4) return '-1.75'
      else if (hostGrade === 2 && awayGrade === 1) return '+0'
      else if (hostGrade === awayGrade) return '-0'
      else if (hostGrade === 2 && awayGrade === 3) return '-0.5'
      else if (hostGrade === 2 && awayGrade === 4) return '-0.75'
      else if (hostGrade === 3 && awayGrade === 1) return '+0.5'
      else if (hostGrade === 3 && awayGrade === 2) return '+0.25'
      else if (hostGrade === 3 && awayGrade === 4) return '-0.25'
      else if (hostGrade === 4 && awayGrade === 1) return '+1.25'
      else if (hostGrade === 4 && awayGrade === 2) return '+0.75'
      else if (hostGrade === 4 && awayGrade === 3) return '+0.25'
      else return ''
    } else if (league === 'Ligue2') {
      if (hostGrade === awayGrade) return '-0.25'
      else if (hostGrade === 1 && awayGrade === 2) return '-0.5'
      else if (hostGrade === 1 && awayGrade === 3) return '-0.75'
      else if (hostGrade === 2 && awayGrade === 1) return '+0'
      else if (hostGrade === 2 && awayGrade === 3) return '-0.5'
      else if (hostGrade === 3 && awayGrade === 1) return '+0.25'
      else if (hostGrade === 3 && awayGrade === 2) return '+0'
    } else if (league === 'LaLiga') {
      if (hostGrade === 3 && awayGrade === 2) return '+0'
      else if (hostGrade === 4 && awayGrade === 3) return '+0'
      else if (hostGrade === awayGrade) return '-0.25'
      else {
        return ''
      }
    } else if (league === 'Australia') {
      if (hostGrade === awayGrade) return '-0.25'
      else if (hostGrade === 1 && awayGrade === 2) return '-0.75'
      else if (hostGrade === 1 && awayGrade === 3) return '-1'
      else if (hostGrade === 1 && awayGrade === 4) return '-1.25'
      else if (hostGrade === 2 && awayGrade === 1) return '+0.25'
      else if (hostGrade === 2 && awayGrade === 3) return '-0.5'
      else if (hostGrade === 2 && awayGrade === 4) return '-0.75'
      else if (hostGrade === 3 && awayGrade === 1) return '+0.5'
      else if (hostGrade === 3 && awayGrade === 2) return '-0'
      else if (hostGrade === 3 && awayGrade === 4) return '-0.5'
      else if (hostGrade === 4 && awayGrade === 1) return '+0.5'
      else if (hostGrade === 4 && awayGrade === 2) return '+0.25'
      else if (hostGrade === 4 && awayGrade === 3) return '+0'
    } else {
      return ''
    }
  }
  static include (league) {
    const arr = ['JLeague', 'Eliteserien', 'KLeague', 'EuropeLeague', 'PremierLeague', 'SerieA', 'Ligue2', 'LaLiga', 'Australia']
    return arr.join(',').indexOf(league) > -1
  }
}

class Match {
  constructor (data) {
    this.hostTeam = data.hostTeam
    this.awayTeam = data.awayTeam
    this.hostTeamInfo = new Club(data.hostTeamInfo)
    this.awayTeamInfo = new Club(data.awayTeamInfo)
    this.historyMatchs = data.historyMatchs
    this.recentSixMatchs = {
      hostTeam: data.recentSixMatchsOfHostTeam || undefined,
      awayTeam: data.recentSixMatchsOfAwayTeam || undefined
    }
    this.scoredBoard = {
      hostTeam: {
        total: undefined,
        host: undefined,
        away: undefined
      },
      awayTeam: {
        total: undefined,
        host: undefined,
        away: undefined
      }
    }
    this.hostTeamFutureMatchs = data.hostTeamFutureMatchs
    this.awayTeamFutureMatchs = data.awayTeamFutureMatchs
    this.hostTeamWarpath = undefined
    this.awayTeamWarpath = undefined
    this.hostTeamStatus = undefined
    this.awayTeamStatus = undefined
    this.futureMatchs = {
      hostTeam: [],
      awayTeam: []
    }
    this.weather = data.weather
    this.matchTime = data.matchTime
    this.league = data.league
    this.round = data.round
    this.season = data.season
    this.euroOdd = data.euroOdd
    this.asiaOdd = data.asiaOdd
    this.asiaDaxiao = data.asiaDaxiao
    this.oddPulling = data.oddPulling
    this.daxiaoPulling = data.daxiaoPulling
    this.news = undefined
  }

  sortPlayers (status) {
    // 先把前锋、中场、后卫挑出来，再分别遍历，并且要按照出场数排
    let players = Array.from(new Array(4), () => new Array())
    // 分拣
    this[status+'TeamInfo'].players.forEach(player => {
      if (player.staff.toUpperCase() === 'FW') {
        players[0].push(player)
      } else if (player.staff.toUpperCase() === 'DF') {
        players[2].push(player)
      } else if (player.staff.toUpperCase() === 'GK') {
        players[3].push(player)
      } else {
        players[1].push(player)
      }
    })
    // 排序 -- 判断是否外援和出场数
    players = players.map(item => {
      return bubbleSort2(item, 'caps', true)
    })
    return players
  }

  // 找到第二位置是某位置的
  findGivenSecondPosition (status, position) {
    // 先把前锋、中场、后卫挑出来，再分别遍历，并且要按照出场数排
    let players = []
    // 分拣
    this[status+'TeamInfo'].players.forEach(player => {
      if (Object.keys(player.regularPosition).length > 1 && Object.keys(player.regularPosition).indexOf(position) > -1) {
        players.push(player)
      }
    })
    // 排序
    players = players.map(item => {
      return bubbleSort2(item, 'caps', false)
    })
    return players
  }
  chooseOne (status, players, index, position, except) {
    let choosedPlayer = ''
    for (let i = 0; i < players[index].length; i++) {
      if (players[index][i].position === position &&
        players[index][i].health !== 0 &&
        except.join(',').indexOf(players[index][i].name) === -1) {
        choosedPlayer = choosedPlayer + players[index][i].name
        break
      }
    }
    if (choosedPlayer === '') {
      let tempPlayers = this.findGivenSecondPosition(status, position)
      for (let i = 0; i < tempPlayers.length; i++) {
        if (tempPlayers[i].health !== 0 && 
          except.join(',').indexOf(tempPlayers[i].name) === -1) {
          choosedPlayer = choosedPlayer + tempPlayers[i].name
          break
        }
      }
    }
    return choosedPlayer
  }
  chooseTwo (status, players, index, position, except, num) {
    let choosedPlayer = ''
    let count = 0
    for (let i = 0; i < players[index].length; i++) {
      if (players[index][i].position === position &&
        players[index][i].health !== 0 &&
        except.join(',').indexOf(players[index][i].name) === -1) {
        count += 1
        choosedPlayer = choosedPlayer + players[index][i].name + ', '
      }
      if (count === num) {
        choosedPlayer = choosedPlayer.substring(0, choosedPlayer.length - 2)
        break
      }
    }
    return choosedPlayer
  }
  chooseLineupPlayer (status, players, position, num, except = []) {
    let index
    if (position.charAt(position.length - 1) === 'B') {
      index = 2
    } else if (position.charAt(position.length - 1) === 'M') {
      index = 1
    } else if (position === 'GK') {
      index = 3
    } else {
      index = 0
    }
    let choosedPlayer = ''
    if (num === 1) {
      choosedPlayer = this.chooseOne(status, players, index, position, except)
    } else if (num === 2) {
      choosedPlayer = this.chooseTwo(status, players, index, position, except, num)
    } else {
      choosedPlayer = this.chooseTwo(status, players, index, position, except, num)
    }
    return choosedPlayer
  }

  chooseOneSub (players, index, position1, position2, except) {
    let choosedPlayer = ''
    if (!position1) {
      for (let i = 0; i < players[index].length; i++) {
        if (players[index][i].health !== 0 &&
          except.indexOf(players[index][i].name) === -1) {
          choosedPlayer = choosedPlayer + players[index][i].name
          break
        }
      }
    } else {
      if (position1.charAt(0) === '!') {
        for (let i = 0; i < players[index].length; i++) {
          if (players[index][i].position !== position1.substring(1, position1.length) &&
            players[index][i].health !== 0 &&
            except.indexOf(players[index][i].name) === -1) {
            choosedPlayer = choosedPlayer + players[index][i].name + ', '
            break
          }
        }
      } else if (position2) {
        for (let i = 0; i < players[index].length; i++) {
          if ((players[index][i].position === position1 || players[index][i].position === position2) &&
            players[index][i].health !== 0 &&
            except.indexOf(players[index][i].name) === -1) {
            choosedPlayer = choosedPlayer + players[index][i].name + ', '
            break
          }
        }
      } else {
        for (let i = 0; i < players[index].length; i++) {
          if (players[index][i].position === position1 &&
            players[index][i].health !== 0 &&
            except.indexOf(players[index][i].name) === -1) {
            choosedPlayer = choosedPlayer + players[index][i].name + ', '
            break
          }
        }
      }
    }
    return choosedPlayer
  }

  chooseTwoSub (players, index, position1, position2, except) {
    let choosedPlayer = ''
    if (!position1) {
      let count = 0
      for (let i = 0; i < players[index].length; i++) {
        if (players[index][i].health !== 0 &&
          except.indexOf(players[index][i].name) === -1) {
          count += 1
          choosedPlayer = choosedPlayer + players[index][i].name + ', '
        }
        if (count === 2) break
      }
    } else {
      if (position1.charAt(0) === '!') {
        let count = 0
        for (let i = 0; i < players[index].length; i++) {
          if (players[index][i].position !== position1.substring(1, position1.length) &&
            players[index][i].health !== 0 &&
            except.indexOf(players[index][i].name) === -1) {
            count += 1
            choosedPlayer = choosedPlayer + players[index][i].name + ', '
          }
          if (count === 2) break
        }
      }
    }
    return choosedPlayer
  }

  transformOdd (odd, level) {
    let str1 = '', str2 = ''
    if (odd.substring(1, odd.length) === '0') {
      str1 = '平手'
    } else if (odd.substring(1, odd.length) === '0.25') {
      str1 = '平手/半球'
    } else if (odd.substring(1, odd.length) === '0.5') {
      str1 = '半球'
    } else if (odd.substring(1, odd.length) === '0.75') {
      str1 = '半球/一球'
    } else if (odd.substring(1, odd.length) === '1') {
      str1 = '一球'
    } else if (odd.substring(1, odd.length) === '1.25') {
      str1 = '一球/球半'
    } else if (odd.substring(1, odd.length) === '1.5') {
      str1 = '球半'
    } else if (odd.substring(1, odd.length) === '1.75') {
      str1 = '球半/两球'
    } else if (odd.substring(1, odd.length) === '2') {
      str1 = '两球'
    } else if (odd.substring(1, odd.length) === '2.25') {
      str1 = '两球/两球半'
    } else if (odd.substring(1, odd.length) === '2.5') {
      str1 = '两球半'
    } else if (odd.substring(1, odd.length) === '2.75') {
      str1 = '两球半/三球'
    } else if (odd.substring(1, odd.length) === '3') {
      str1 = '三球'
    } else if (odd === '') {
      str1 = ''
    } else {
      str1 = '超级深盘'
    }
    if (level < 0.8) {
      str2 = '超低水'
    } else if (level >= 0.8 && level < 0.85) {
      str2 = '低水'
    } else if (level >= 0.85 && level < 0.9) {
      str2 = '中低水'
    } else if (level >= 0.9 && level < 0.95) {
      str2 = '中水'
    } else if (level >= 0.95 && level < 1) {
      str2 = '中高水'
    } else if (level >= 1 && level < 1.05) {
      str2 = '高水'
    } else if (level >= 1.05 && level < 1.13) {
      str2 = '超高水'
    } else {
      str2 = '极高水'
    }
    return [str1, str2]
  }

  euroOddanalysis (win, tie, lost, pull, trend, start, end) {
    if (pull === '') pull = true
    let flag2 = false
    if (win > lost) {
      // flag2 表示赔率经过主客颠倒
      flag2 = true
      let temp = win
      win = lost
      lost = temp
      pull = !pull
      temp = start
      start = end
      end = temp
    }
    // pull true(host) false(away)
    if (win >= 2.35 && win <= 2.85) {
      // 0
      return !pull
    } else if (win >= 2.12 && win < 2.35) {
      // 0.25
      if (start - end > 0) return true
      if (trend) return true
      return !pull
    } else if (win >= 1.8 && win < 2.12) {
      // 0.5
      if (pull && trend) return false
      if (win >= 1.90 && tie <= 3.20) return false
      if (tie >= 3.75 && pull) return false
      return !pull
    } else if (win >= 1.61 && win < 1.8) {
      // 0.75
      if (tie >= 4 && tie <= 5 && lost >= 4 && lost <= 5) return false
      if (tie < 3.5) {
        if (lost >= 4.5) return true
        else return false
      } else {
        if (lost > 5 && !flag2) return true
        else if (tie >= 3.5 && (lost - tie) > 0.5 && flag2) return true
        else if (!flag2 && tie >= 3.25 && (lost - tie) >= 1) return true
        else return false
      }
    } else if (win >= 1.50 && win < 1.61) {
      // 1
      if (win > 1.55) return pull ? false : true
      else return trend ? true : false
    } else if (win >= 1.40 && win < 1.50) {
      // 1.25
      if (win == 1.44) return pull ? false : true
      if (2 * tie <= lost) return true
      else return false
    } else if (win >= 1.30 && win < 1.40) {
      // 1.5
      if (win <= 1.35) {
        if (tie >= 5) {
          if (lost > 10) return true
          else return false
        } else {
          return false
        }
      } else {
        if (2 * tie < lost) return true
        else return false
      }
    } else if (win >= 1.21 && win < 1.30) {
      // 1.75

    } else if (win >= 1.15 && win < 1.21) {
      // 2
      if (2 * tie < lost) return true
      else return false
    } else {
      if (2.5 * tie < lost) return true
      else return false
    }
  }

  chooseSubstitute (players, lineup, except = '') {
    let choosedPlayer = ''
    if (lineup === '4231' || lineup === '442' || lineup === '4141') {
      // 选1个门将
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 3, 'GK', '', except)
      // 选1个边卫
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 2, 'LB', 'RB', except)
      // 选1个中卫
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 2, 'CB', '', except)
      // 选1个后腰
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 1, 'CDM', '', except)
      // 选2个除后腰外的中场
      choosedPlayer = choosedPlayer + this.chooseTwoSub(players, 1, '!CDM', '', except)
      // 选1个前锋
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 1, '', '', except)
    } else if (lineup === '433' || lineup === '343' || lineup === '3421') {
      // 选1个门将
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 3, 'GK', '', except)
      // 选1个边卫
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 2, 'LB', 'RB', except)
      // 选1个中卫
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 2, 'CB', '', except)
      // 选1个后腰
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 1, 'CDM', '', except)
      // 选1个除后腰外的中场
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 1, '!CDM', '', except)
      // 选2个前锋
      choosedPlayer = choosedPlayer + this.chooseTwoSub(players, 0, '', '', except)
    } else if (lineup === '352') {
      // 选1个门将
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 3, 'GK', '', except)
      // 选1个边卫
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 2, 'LB', 'RB', except)
      // 选1个中卫
      choosedPlayer = choosedPlayer + this.chooseOneSub(players, 2, 'CB', '', except)
      // 选2个中场
      choosedPlayer = choosedPlayer + this.chooseTwoSub(players, 1, '', '', except)
      // 选2个前锋
      choosedPlayer = choosedPlayer + this.chooseTwoSub(players, 0, '', '', except)
    }
    return choosedPlayer
  }

  getTeamPlayersInfo (status) {
    const players = this.sortPlayers(status)
    let str = ''
    // 遍历
    for (let i = 0; i < players.length; i++) {
      if (i === 0) str = str + '前锋：' + '\n'
      if (i === 1) str = str + '中场：' + '\n'
      if (i === 2) str = str + '后卫：' + '\n'
      if (i === 3) str = str + '门将：' + '\n'
      for (let j = 0; j < players[i].length; j++) {
        str = str + `${players[i][j].number || '?'}号 ${players[i][j].name}（${players[i][j].position}, ${players[i][j].stats}, ${players[i][j].caps}场${players[i][j].lineups}首发, ${players[i][j].goal ?players[i][j].goal + '球' : ''}${players[i][j].assist ?players[i][j].assist+'助':''}）${players[i][j].age ?'年龄: '+players[i][j].age:''} ${players[i][j].height ?'身高: '+players[i][j].height:''} ${players[i][j].description || ''}` + '\n'
      }
    }
    return str
  }

  getTeamFutureMatchInfo (status) {
    let str = `\n\n特别关注：${this[status + 'Team']}未来赛程\n\n`
    if (!this.matchTime) str = str + '你还没有填写比赛时间，暂时无法计算未来比赛'
    this[status + 'TeamFutureMatchs'].forEach(match => {
      match.period = Math.floor((new Date(match.matchTime).getTime() - new Date(this.matchTime).getTime()) / 1000 / 3600)
      this.futureMatchs[status + 'Team'].push(match)
      str = str + `${dateFormat(match.matchTime, 'YYYY-MM-DD HH:mm:ss')} ${getWeekDay(dateFormat(match.matchTime, 'YYYY-MM-DD HH:mm:ss'))} ${League.leagueEnglishToChinese(match.league)} ${match.match} ${match.period}时\n`
    })
    return str
  }
  forecastLineup (status, except = []) {
    let forecastLineup = ''
    const players = this.sortPlayers(status)
    let lineup = this[status + 'TeamInfo'].formations[0]
    if (lineup === '4231') {
      let gk = this.chooseLineupPlayer(status, players, 'GK', 1, except)
      let rb = this.chooseLineupPlayer(status, players, 'RB', 1, except)
      let cb = this.chooseLineupPlayer(status, players, 'CB', 2, except)
      let lb = this.chooseLineupPlayer(status, players, 'LB', 1, except)
      let cdm = this.chooseLineupPlayer(status, players, 'CDM', 2, except)
      let rm = this.chooseLineupPlayer(status, players, 'RM', 1, except)
      let cam = this.chooseLineupPlayer(status, players, 'CAM', 1, except)
      let lm = this.chooseLineupPlayer(status, players, 'LM', 1, except)
      let st = this.chooseLineupPlayer(status, players, 'ST', 1, except)
      forecastLineup = `${gk}/${rb}, ${cb}, ${lb}/${cdm}/${rm}, ${cam}, ${lm}/${st}`
      let sub = this.chooseSubstitute(players, lineup, forecastLineup)
      forecastLineup = forecastLineup + '\n替补：' + sub
      return forecastLineup
    } else if (lineup === '433') {
      let gk = this.chooseLineupPlayer(status, players, 'GK', 1, except)
      let rb = this.chooseLineupPlayer(status, players, 'RB', 1, except)
      let cb = this.chooseLineupPlayer(status, players, 'CB', 2, except)
      let lb = this.chooseLineupPlayer(status, players, 'LB', 1, except)
      let cdm = this.chooseLineupPlayer(status, players, 'CDM', 1, except)
      let rm = this.chooseLineupPlayer(status, players, 'RM', 1, except)
      let lm = this.chooseLineupPlayer(status, players, 'LM', 1, except)
      let rw = this.chooseLineupPlayer(status, players, 'RW', 1, except)
      let st = this.chooseLineupPlayer(status, players, 'ST', 1, except)
      let lw = this.chooseLineupPlayer(status, players, 'LW', 1, except)
      forecastLineup = `${gk}/${rb}, ${cb}, ${lb}/${cdm}, ${rm}, ${lm}/${rw}, ${st}, ${lw}`
      let sub = this.chooseSubstitute(players, lineup, forecastLineup)
      forecastLineup = forecastLineup + '\n替补：' + sub
      return forecastLineup
    } else if (lineup === '343') {
      let gk = this.chooseLineupPlayer(status, players, 'GK', 1, except)
      let rcb = this.chooseLineupPlayer(status, players, 'RCB', 1, except)
      let cb = this.chooseLineupPlayer(status, players, 'CB', 1, except)
      let lcb = this.chooseLineupPlayer(status, players, 'LCB', 1, except)
      let rb = this.chooseLineupPlayer(status, players, 'RB', 1, except)
      let lb = this.chooseLineupPlayer(status, players, 'LB', 1, except)
      let cdm = this.chooseLineupPlayer(status, players, 'CDM', 2, except)
      let rw = this.chooseLineupPlayer(status, players, 'RW', 1, except)
      let st = this.chooseLineupPlayer(status, players, 'ST', 1, except)
      let lw = this.chooseLineupPlayer(status, players, 'LW', 1, except)
      forecastLineup = `${gk}/${rcb}, ${cb}, ${lcb}/${rb}, ${cdm}, ${lb}/${rw}, ${st}, ${lw}`
      let sub = this.chooseSubstitute(players, lineup, forecastLineup)
      forecastLineup = forecastLineup + '\n替补：' + sub
      return forecastLineup
    } else if (lineup === '442') {
      let gk = this.chooseLineupPlayer(status, players, 'GK', 1, except)
      let rb = this.chooseLineupPlayer(status, players, 'RB', 1, except)
      let cb = this.chooseLineupPlayer(status, players, 'CB', 2, except)
      let lb = this.chooseLineupPlayer(status, players, 'LB', 1, except)
      let cdm = this.chooseLineupPlayer(status, players, 'CDM', 2, except)
      let rm = this.chooseLineupPlayer(status, players, 'RM', 1, except)
      let st = this.chooseLineupPlayer(status, players, 'ST', 2, except)
      let lm = this.chooseLineupPlayer(status, players, 'LM', 1, except)
      forecastLineup = `${gk}/${rb}, ${cb}, ${lb}/${rm}, ${cdm}, ${lm}/${st}`
      let sub = this.chooseSubstitute(players, lineup, forecastLineup)
      forecastLineup = forecastLineup + '\n替补：' + sub
      return forecastLineup
    } else if (lineup === '4141') {
      let gk = this.chooseLineupPlayer(status, players, 'GK', 1, except)
      let rb = this.chooseLineupPlayer(status, players, 'RB', 1, except)
      let cb = this.chooseLineupPlayer(status, players, 'CB', 2, except)
      let lb = this.chooseLineupPlayer(status, players, 'LB', 1, except)
      let cdm = this.chooseLineupPlayer(status, players, 'CDM', 1, except)
      let rm = this.chooseLineupPlayer(status, players, 'RM', 1, except)
      let cam = this.chooseLineupPlayer(status, players, 'CAM', 2, except)
      let st = this.chooseLineupPlayer(status, players, 'ST', 1, except)
      let lm = this.chooseLineupPlayer(status, players, 'LM', 1, except)
      forecastLineup = `${gk}/${rb}, ${cb}, ${lb}/${cdm}, ${rm}, ${cam}, ${lm}/${st}`
      let sub = this.chooseSubstitute(players, lineup, forecastLineup)
      forecastLineup = forecastLineup + '\n替补：' + sub
      return forecastLineup
    } else if (lineup === '352') {
      let gk = this.chooseLineupPlayer(status, players, 'GK', 1, except)
      let rcb = this.chooseLineupPlayer(status, players, 'RCB', 1, except)
      let cb = this.chooseLineupPlayer(status, players, 'CB', 1, except)
      let lcb = this.chooseLineupPlayer(status, players, 'LCB', 1, except)
      let rb = this.chooseLineupPlayer(status, players, 'RB', 1, except)
      let lb = this.chooseLineupPlayer(status, players, 'LB', 1, except)
      let cdm = this.chooseLineupPlayer(status, players, 'CDM', 3, except)
      let st = this.chooseLineupPlayer(status, players, 'ST', 2, except)
      forecastLineup = `${gk}/${rcb}, ${cb}, ${lcb}/${rb}, ${cdm}, ${lb}/${st}`
      let sub = this.chooseSubstitute(players, lineup, forecastLineup)
      forecastLineup = forecastLineup + '\n替补：' + sub
      return forecastLineup
    } else if (lineup === '3421') {
      let gk = this.chooseLineupPlayer(status, players, 'GK', 1, except)
      let rcb = this.chooseLineupPlayer(status, players, 'RCB', 1, except)
      let cb = this.chooseLineupPlayer(status, players, 'CB', 1, except)
      let lcb = this.chooseLineupPlayer(status, players, 'LCB', 1, except)
      let rb = this.chooseLineupPlayer(status, players, 'RB', 1, except)
      let lb = this.chooseLineupPlayer(status, players, 'LB', 1, except)
      let cdm = this.chooseLineupPlayer(status, players, 'CDM', 2, except)
      let cam = this.chooseLineupPlayer(status, players, 'CAM', 2, except)
      let st = this.chooseLineupPlayer(status, players, 'ST', 1, except)
      forecastLineup = `${gk}/${rcb}, ${cb}, ${lcb}/${rb}, ${cdm}, ${lb}/${cam}/${st}`
      let sub = this.chooseSubstitute(players, lineup, forecastLineup)
      forecastLineup = forecastLineup + '\n替补：' + sub
      return forecastLineup
    }
  }

  statisticsMatch (attribute, status) {
    // 分析什么？对手有多强，赛程有多紧，赢盘率有多高
    const statistics = { host: 0, away: 0, win: 0, tie: 0, lost:0, winOdd: 0, tieOdd: 0, lostOdd: 0, period: [], grade: [] }
    this[attribute].forEach(item => {
      if (attribute.indexOf('recent') > -1) {
        statistics.period.push(Math.floor((new Date(this.matchTime).getTime() - new Date(item.matchTime).getTime()) / 1000 / 3600 / 24))
      }
      // 先看看自己是主场还是客场
      let a
      if (item.hostTeam === this[status + 'Team']) {
        // 主场
        statistics.host += 1
        a = 0
        if (attribute.indexOf('recent') > -1) {
          // 获取对手的档次,把档次封装进去
          statistics.grade.push(League.getGrade(item.league, item.awayTeam))
        }
      } else {
        statistics.away += 1
        a = 1
        if (attribute.indexOf('recent') > -1) {
          // 获取对手的档次,把档次封装进去
          statistics.grade.push(League.getGrade(item.league, item.hostTeam))
        }
      }
      // 再看胜平负
      const score = item.score.split(':')
      if (a === 0 && score[0] > score[1] || a === 1 && score[1] > score[0]) {
        statistics.win += 1
        // 在这里算odd。算法：进球数* 100,加自己的让球数
        if (a === 0) {
          if ((score[0] * 100 + item.odd * 100) - score[1] * 100 > 0) {
            statistics.winOdd += 1
          } else if ((score[0] * 100 + item.odd * 100) - score[1] * 100 === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.lostOdd += 1
          } 
        } else {
          if ((score[0] * 100 + item.odd * 100) - score[1] * 100 > 0) {
            statistics.lostOdd += 1
          } else if ((score[0] * 100 + item.odd * 100) - score[1] * 100 === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.winOdd += 1
          } 
        }
      } else if (score[0] === score[1]) {
        statistics.tie += 1
        if (a === 0) {
          if (Number(item.odd) > 0) {
            statistics.winOdd += 1
          } else if (Number(item.odd) === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.lostOdd += 1
          }
        } else {
          if (Number(item.odd) > 0) {
            statistics.lostOdd += 1
          } else if (Number(item.odd) === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.winOdd += 1
          }
        }
      } else {
        statistics.lost += 1
        // 在这里算odd。算法：进球数* 100,加自己的让球数
        if (a === 0) {
          if ((score[0] * 100 + item.odd * 100) - score[1] * 100 > 0) {
            statistics.lostOdd += 1
          } else if ((score[0] * 100 + item.odd * 100) - score[1] * 100 === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.winOdd += 1
          } 
        } else {
          if ((score[0] * 100 + item.odd * 100) - score[1] * 100 > 0) {
            statistics.lostOdd += 1
          } else if ((score[0] * 100 + item.odd * 100) - score[1] * 100 === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.winOdd += 1
          } 
        }
      }
    })
    return statistics
  }

  analysisRecentSixMatchs (status, reverse = false) {
    // 分析什么？对手有多强，赛程有多紧，赢盘率有多高
    // 2022.06.29 新增 你先要呈现出来
    // 查自己的档次
    const myGrade = League.getGrade(this[status + 'TeamInfo'].league, this[status + 'Team'])
    let matchList = []
    const statistics = { host: 0, away: 0, win: 0, tie: 0, lost:0, winOdd: 0, tieOdd: 0, lostOdd: 0, period: [], grade: [] }
    this.recentSixMatchs[status + 'Team'].forEach(item => {
      let matchStr = `${item.matchTime} ${getWeekDay(dateFormat(item.matchTime, 'YYYY-MM-DD HH:mm:ss'))} ${League.leagueEnglishToChinese(item.league)} ${item.hostTeam} ${item.score} ${item.awayTeam} ${item.odd}`
      matchList.push(matchStr)
      statistics.period.push(Math.floor((new Date(this.matchTime).getTime() - new Date(item.matchTime).getTime()) / 1000 / 3600 / 24))
      // 先看看自己是主场还是客场
      let a
      if (item.hostTeam === this[status + 'Team']) {
        // 主场
        statistics.host += 1
        a = 0
        // 获取对手的档次,把档次封装进去
        statistics.grade.push(League.getGrade(item.league, item.awayTeam))
      } else {
        statistics.away += 1
        a = 1
        // 获取对手的档次,把档次封装进去
        statistics.grade.push(League.getGrade(item.league, item.hostTeam))
      }
      // 再看胜平负
      const score = item.score.split(':')
      if (a === 0 && score[0] > score[1] || a === 1 && score[1] > score[0]) {
        statistics.win += 1
        // 在这里算odd。算法：进球数* 100,加自己的让球数
        if (a === 0) {
          if ((score[0] * 100 + item.odd * 100) - score[1] * 100 > 0) {
            statistics.winOdd += 1
          } else if ((score[0] * 100 + item.odd * 100) - score[1] * 100 === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.lostOdd += 1
          } 
        } else {
          if ((score[0] * 100 + item.odd * 100) - score[1] * 100 > 0) {
            statistics.lostOdd += 1
          } else if ((score[0] * 100 + item.odd * 100) - score[1] * 100 === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.winOdd += 1
          } 
        }
      } else if (score[0] === score[1]) {
        statistics.tie += 1
        if (a === 0) {
          if (Number(item.odd) > 0) {
            statistics.winOdd += 1
          } else if (Number(item.odd) === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.lostOdd += 1
          }
        } else {
          if (Number(item.odd) > 0) {
            statistics.lostOdd += 1
          } else if (Number(item.odd) === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.winOdd += 1
          }
        }
      } else {
        statistics.lost += 1
        // 在这里算odd。算法：进球数* 100,加自己的让球数
        if (a === 0) {
          if ((score[0] * 100 + item.odd * 100) - score[1] * 100 > 0) {
            statistics.lostOdd += 1
          } else if ((score[0] * 100 + item.odd * 100) - score[1] * 100 === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.winOdd += 1
          } 
        } else {
          if ((score[0] * 100 + item.odd * 100) - score[1] * 100 > 0) {
            statistics.lostOdd += 1
          } else if ((score[0] * 100 + item.odd * 100) - score[1] * 100 === 0) {
            statistics.tieOdd += 1
          } else {
            statistics.winOdd += 1
          } 
        }
      }
    })
    // 根据统计信息分析
    let str = '\n\n'+ this[status + 'Team'] + '近期赛程：\n\n'
    if (reverse) matchList = matchList.reverse()
    matchList.forEach(item => {
      str = str + item + '\n'
    })
    str = str + '\n'
    return `${str}${this[status + 'Team']}近期赛程: ${statistics.win}胜${statistics.tie}平${statistics.lost}负, 
       ${statistics.winOdd}赢${statistics.tieOdd}走${statistics.lostOdd}输, 6场比赛分别至今${statistics.period[0]}天, 
       ${statistics.period[1]}天,${statistics.period[2]}天,${statistics.period[3]}天,${statistics.period[4]}天,
       ${statistics.period[5]}天, 对手档次分别处于第${statistics.grade[0]}档次,第${statistics.grade[1]}档次,第${statistics.grade[2]}档次,
       第${statistics.grade[3]}档次,第${statistics.grade[4]}档次,第${statistics.grade[5]}档次,\n\n`
  }

  analysisHistoryMatchs () {
    if (this.historyMatchs.length === 0) return '\n\n暂无历史交锋数据\n'
    let index = 0
    // 先把断层的去掉
    for (let i = 0; i < this.historyMatchs.length - 1; i++) {
      if (this.historyMatchs[i].matchTime.substring(0, 4) - this.historyMatchs[i + 1].matchTime.substring(0, 4) >= 4) {
        index = i + 1
        break
      }
    }
    if (index !== 0) this.historyMatchs.splice(index, this.historyMatchs.length - index)
    let n = this.historyMatchs.length
    // 然后我们要把分析的函数抽离出来
    const statistics = this.statisticsMatch('historyMatchs', 'host')
    let str = '\n\n历史交锋\n\n'
    this.historyMatchs.forEach(item => {
      str = str + `${dateFormat(item.matchTime, 'YYYY-MM-DD HH:mm:ss')} ${getWeekDay(dateFormat(item.matchTime, 'YYYY-MM-DD HH:mm:ss'))} ${League.leagueEnglishToChinese(item.league)} ${item.hostTeam} ${item.score} ${item.awayTeam} ${item.odd}\n`
    })
    str = str + '\n'
    str = str +'最近' + n + '次交锋, 主队' + statistics.win + '胜' + statistics.tie + '平' + statistics.lost + '负, ' + 
      statistics.winOdd + '赢' + statistics.tieOdd + '平' + statistics.lostOdd + '输, 最近一次交锋：' + this.historyMatchs[0].matchTime + 
      ' ' + this.historyMatchs[0].hostTeam + this.historyMatchs[0].score + this.historyMatchs[0].awayTeam + ' ' + this.historyMatchs[0].odd
    return str
  }

  analysisOdd () {
    let str = '盘口分析：' + this.hostTeam + 'vs' + this.awayTeam + '\n\n' + '本场比赛亚盘以主'
    // 看亚盘盘口的第一个数字，+就是受让，-就是让
    let miaoshu = this.transformOdd(this.asiaOdd['初盘'][1], this.asiaOdd['初盘'][0])
    if (this.asiaOdd['初盘'][1].charAt(0) === '-') str = str + '让 ' 
    else str = str + '受让 '
    str = str + miaoshu[0] + ' ' + miaoshu[1] + '开盘，主队' + this.hostTeam + '属于第' + League.getGrade(this.league, this.hostTeam) +
      '档次球队，客队' + this.awayTeam + '属于第' + League.getGrade(this.league, this.awayTeam) + '档次球队，根据实力应以'
    if (League.getOdd(this.league, this.hostTeam, this.awayTeam) !== '') {
      miaoshu = League.getOdd(this.league, this.hostTeam, this.awayTeam)
    } else {
      miaoshu = ''
    }
    if (miaoshu !== '' && miaoshu.charAt(0) === '-') {
      str = str + '主让 ' + this.transformOdd(miaoshu, miaoshu[1])[0]
    } else if (miaoshu !== '' && miaoshu.charAt(0) === '+') {
      str = str + '主受让 ' + this.transformOdd(miaoshu, miaoshu[1])[0]
    } else {
      str = str + '(未知) '
    }
    str = str + '开盘, 初盘偏'
    if (miaoshu !== '' && (this.asiaOdd['初盘'][1] - miaoshu) > 0) str = str + '浅，有利客队' + this.awayTeam
    else if (miaoshu !== '' && (this.asiaOdd['初盘'][1] - miaoshu) < 0) str = str + '深，有利主队' + this.hostTeam
    else if (miaoshu !== '' && (this.asiaOdd['初盘'][1] - miaoshu === 0)) str = str + '适合'
    else str = str + '(未知)'
    str = str + '。后市主队'
    // 先用终盘减去初盘
    if (this.asiaOdd['终盘'][1] - this.asiaOdd['初盘'][1] === 0) {
      str = str + '未变盘'
      if (this.asiaOdd['终盘'][0] - this.asiaOdd['初盘'][0] === 0) {
        str = str + '也未升水'
      } else if (this.asiaOdd['终盘'][0] - this.asiaOdd['初盘'][0] > 0) {
        miaoshu = this.transformOdd('', this.asiaOdd['终盘'][0])
        str = str + '升至' + this.asiaOdd['终盘'][0] + miaoshu[1]
      } else {
        miaoshu = this.transformOdd('', this.asiaOdd['终盘'][0])
        str = str + '降至' + this.asiaOdd['终盘'][0] + miaoshu[1]
      }
      str = str + ',变化不明显' + '。'
    } else if (this.asiaOdd['终盘'][1] - this.asiaOdd['初盘'][1] > 0) {
      str = str + '退盘至' + this.asiaOdd['终盘'][1]
      if (this.asiaOdd['终盘'][0] - this.asiaOdd['初盘'][0] === 0) {
        miaoshu = this.transformOdd('', this.asiaOdd['终盘'][0])
        str = str + miaoshu[1]
      } else if (this.asiaOdd['终盘'][0] - this.asiaOdd['初盘'][0] > 0) {
        miaoshu = this.transformOdd('', this.asiaOdd['终盘'][0])
        str = str + miaoshu[1]
      } else {
        miaoshu = this.transformOdd('', this.asiaOdd['终盘'][0])
        str = str + miaoshu[1]
      }
      if (this.oddPulling === this.awayTeam && this.transformOdd('', this.asiaOdd['终盘'][0])[1].indexOf('低') > -1) {
        str = str + ',退盘保护上盘打出,有利于主队' + this.hostTeam + '。'
      } else {
        str = str + ',有利于客队' + this.awayTeam + '。'
      }
    } else {
      str = str + '升盘至' + this.asiaOdd['终盘'][1]
      if (this.asiaOdd['终盘'][0] - this.asiaOdd['初盘'][0] === 0) {
        miaoshu = this.transformOdd('', this.asiaOdd['终盘'][0])
        str = str + miaoshu[1]
      } else if (this.asiaOdd['终盘'][0] - this.asiaOdd['初盘'][0] > 0) {
        miaoshu = this.transformOdd('', this.asiaOdd['终盘'][0])
        str = str + miaoshu[1]
      } else {
        miaoshu = this.transformOdd('', this.asiaOdd['终盘'][0])
        str = str + miaoshu[1]
      }
      if (this.oddPulling === this.hostTeam && this.transformOdd('', this.asiaOdd['终盘'][0])[1].indexOf('高') > -1) {
        str = str + ',有造热主队之嫌,有利于客队' + this.awayTeam + '。'
      } else {
        str = str + ',有利于主队' + this.hostTeam + '。'
      }
    }

    // yapan -------------END-------------------------

    str = str + '欧赔方面,'
    Object.keys(this.euroOdd).forEach(company => {
      str = str + company + '以' + this.euroOdd[company][0] + ' ' + this.euroOdd[company][1] + ' ' + this.euroOdd[company][2] + '开盘,后市'
      if (this.euroOdd[company][3] - this.euroOdd[company][0] > 0) {
        str = str + '升至'
        str = str + this.euroOdd[company][3] + ' ' + this.euroOdd[company][4] + ' ' + this.euroOdd[company][5] + ','
        str = str + '对客队' + this.awayTeam + '有利'
      } else if (this.euroOdd[company][3] - this.euroOdd[company][0] < 0) {
        str = str + '降至'
        str = str + this.euroOdd[company][3] + ' ' + this.euroOdd[company][4] + ' ' + this.euroOdd[company][5] + ','
        str = str + '对主队' + this.hostTeam + '有利;'
      } else {
        str = str + '未变盘,需要观察.'
      }
    })
    const company = Object.keys(this.euroOdd)
    if (company.join(',').indexOf('立博') > -1 || company.join(',').indexOf('韦德') > -1) {
      str = str + '进一步分析其他欧赔公司的态度:'
    }
    for (let i = 0; i < company.length; i++) {
      if (company[i] === '澳门' || company[i] === '香港马会') continue 
      let pull = this.oddPulling ? this.hostTeam === this.oddPulling : ''
      let trend = Math.min(this.euroOdd[company[i]][3], this.euroOdd[company[i]][5]) - Math.min(this.euroOdd[company[i]][0], this.euroOdd[company[i]][2]) > 0.1
      let res = this.euroOddanalysis(this.euroOdd[company[i]][3], this.euroOdd[company[i]][4], this.euroOdd[company[i]][5], pull, trend, this.asiaOdd['初盘'][1], this.asiaOdd['终盘'][1])
      str = str + this.euroOdd[company[i]] + ' - '
      if (res) {
        // 首先判断是正路了，然后看哪边是上盘，-号代表主队上盘，
        if (this.asiaOdd['终盘'][1].charAt(0) === '-') str = str + '正路' + this.hostTeam + '赢盘'
        else str = str + '正路' + this.awayTeam + '赢盘.'
      } else {
        if (this.asiaOdd['终盘'][1].charAt(0) === '-') str = str + '冷门' + this.awayTeam + '赢盘'
        else str = str + '冷门' + this.hostTeam + '赢盘.'
      }
    }
    let result = ''
    let tempStr = str
    let hostCount = tempStr.split(this.hostTeam).length - 1
    let awayCount = tempStr.split(this.awayTeam).length - 1
    if (hostCount - awayCount > 0) {
      result = this.hostTeam
    } else {
      result = this.awayTeam
    }
    if (this.oddPulling === '') {
      str = str + '拉力方面,两队拉力平均'
    } else {
      str = str + '拉力方面,' + this.oddPulling + '有着更强的拉力.'
    }
    str = str + '综上所述，本场比赛更看好' + result

    // yapan END ---------------------------
    // daxiao START ------------------------
    str = str + '大小球方面，初盘以' + this.asiaDaxiao['初盘'][1] + '球,大球' + this.transformOdd('', this.asiaDaxiao['初盘'][0])[1] + '开盘，临场'
    if (this.asiaDaxiao['终盘'][1] - this.asiaDaxiao['初盘'][1] > 0) {
      str = str + '升盘至' + this.asiaDaxiao['终盘'][1] + '球' + this.transformOdd('', this.asiaDaxiao['初盘'][0])[1]
      if (this.asiaDaxiao['终盘'][0] >= 0.95 && this.daxiaoPulling === '大') {
        str = str + '有造热大球盘之嫌，本场更看好小球。'
      } else if (this.asiaDaxiao['终盘'][0] < 0.95 && this.daxiaoPulling !== '大') {
        str = str + '如果持续降水，且大球盘热度不高，本场更看好大球'
      } else {
        str = str + '有阻大球之意。建议放弃，或滚球等大球。'
      }
    } else if (this.asiaDaxiao['终盘'][1] - this.asiaDaxiao['初盘'][1] === 0) {
      if (this.asiaDaxiao['终盘'][0] < this.asiaDaxiao['初盘'][0]) {
        str = str + '降水至'+ this.asiaDaxiao['终盘'][1] + '球大球' + this.transformOdd('', this.asiaDaxiao['终盘'][0])[1] + 
          ',本场更看好大球'
      } else if (this.asiaDaxiao['终盘'][0] > this.asiaDaxiao['初盘'][0]) {
        str = str + '升水至'+ this.asiaDaxiao['终盘'][1] + '球大球' + this.transformOdd('', this.asiaDaxiao['终盘'][0])[1] + 
          ',本场更看好小球'
      } else {
        str = str + '无变动，建议放弃。'
      }
    } else {
      str = str + '降盘至' + this.asiaDaxiao['终盘'][1] + '球' + this.transformOdd('', this.asiaDaxiao['初盘'][0])[1]
      if (this.asiaDaxiao['终盘'][2] >= 0.95 && this.daxiaoPulling === '小') {
        str = str + '有造热小球盘之嫌，本场更看好大球。'
      } else if (this.asiaDaxiao['终盘'][2] < 0.95 && this.daxiaoPulling !== '小') {
        str = str + '如果小球持续降水，且小球热度不高，本场更看好小球'
      } else {
        str = str + '有阻小球之意。建议观望。'
      }
    }
    str = str + '【大小球分析仅供参考，作为第二选择，实际以双方球队打法以及场面开放程度为准】'

    str = str + '\n\n温馨提示：1、如果你的球队有核心伤停，请不要买。因为我们要的是稳胆。2、要进行20%-80%的调查问卷。3、要看积分榜、主场积分榜、客场积分榜，确定进球、失球、主场、客场数据。4、要浏览一次分析结果。5、要计算各个结果的期望值。6、要看这周是不是一周双赛，下周是不是一周双赛，这两周的对手，下两周的对手。7、如果你买的球队是热门方，记得在盈利的时候，选择65-70分钟或者75-80分钟时候跳车。'
    return str
  }

  displayPanlu () {
    let str = '\n\n重点关注：盘口排名\n\n'
    str = str +  '名 赛 队 上 平 下 赢 走 输 净 赢% 走% 输%\n'
    str = str + this.hostTeamInfo.totalPanlu.panRanking + '   ' + this.hostTeam + '   ' + this.hostTeamInfo.totalPanlu.totalpanNumber + '   ' + this.hostTeamInfo.totalPanlu.shangpanNumber +
      '   ' + this.hostTeamInfo.totalPanlu.pingpanNumber + '   ' + this.hostTeamInfo.totalPanlu.xiapanNumber + '   ' + this.hostTeamInfo.totalPanlu.yingpanNumber +
      '   ' + this.hostTeamInfo.totalPanlu.zoupanNumber + '   ' + this.hostTeamInfo.totalPanlu.shupanNumber + '   ' + this.hostTeamInfo.totalPanlu.jingpanNumber +
      '   ' + this.hostTeamInfo.totalPanlu.yingpanPercent + '%   ' + this.hostTeamInfo.totalPanlu.zoupanPercent + '%   ' + this.hostTeamInfo.totalPanlu.shupanPercent + '%\n'
      str = str + this.awayTeamInfo.totalPanlu.panRanking + '   ' + this.awayTeam + '   '  + this.awayTeamInfo.totalPanlu.totalpanNumber + '   ' + this.awayTeamInfo.totalPanlu.shangpanNumber +
      '   ' + this.awayTeamInfo.totalPanlu.pingpanNumber + '   ' + this.awayTeamInfo.totalPanlu.xiapanNumber + '   ' + this.awayTeamInfo.totalPanlu.yingpanNumber +
      '   ' + this.awayTeamInfo.totalPanlu.zoupanNumber + '   ' + this.awayTeamInfo.totalPanlu.shupanNumber + '   ' + this.awayTeamInfo.totalPanlu.jingpanNumber +
      '   ' + this.awayTeamInfo.totalPanlu.yingpanPercent + '%   ' + this.awayTeamInfo.totalPanlu.zoupanPercent + '%   ' + this.awayTeamInfo.totalPanlu.shupanPercent + '%\n'
    return str
  }

  displayDaxiao () {
    let str = '\n\n重点关注：盘口排名\n\n'
    str = str + '名 赛 队 大 走 小 大球% 走% 小球%\n'
    str = str + this.hostTeamInfo.totalBs.panRanking + '   ' + this.hostTeam + '   ' + this.hostTeamInfo.totalBs.totalpanNumber + '   ' + this.hostTeamInfo.totalBs.bigpanNumber +
      '   ' + this.hostTeamInfo.totalBs.pingpanNumber + '   ' + this.hostTeamInfo.totalBs.smallpanNumber + '   ' + this.hostTeamInfo.totalBs.bigpanPercent + '%   ' + this.hostTeamInfo.totalBs.zoupanPercent + '%   ' + this.hostTeamInfo.totalBs.smallpanPercent + '%\n'
      str = str + this.awayTeamInfo.totalBs.panRanking + '   ' + this.awayTeam + '   '  + this.awayTeamInfo.totalBs.totalpanNumber + '   ' + this.awayTeamInfo.totalBs.bigpanNumber +
      '   ' + this.awayTeamInfo.totalBs.pingpanNumber + '   ' + this.awayTeamInfo.totalBs.smallpanNumber + '   ' + this.awayTeamInfo.totalBs.bigpanPercent + '%   ' + this.awayTeamInfo.totalBs.zoupanPercent + '%   ' + this.awayTeamInfo.totalBs.smallpanPercent + '%\n'
    return str
  }

  displayPrevenintMatch (status) {
    let str = '\n' + status + '本赛季与同档次球队较量\n'
    if (!this[status + 'TeamInfo'].prevenientMatch) return str + '\n暂无信息，请检查是否加入了analysis页或是暂无同档次球队对阵\n\n'
    this[status + 'TeamInfo'].prevenientMatch.forEach(item => {
      str = str + item.matchTime + ' 第' + item.round + '轮 ' + item.hostTeam + ' ' +
        item.score + ' ' + item.awayTeam + ' ' + item.odd + ' ' + item.oddResult + '\n'
    })
    return str
  }

  displayNews () {
    // 新闻分news、motivation、summary三部分
    // 先展示主队的，再展示客队的
    // 算法：该联赛本赛季本轮次
    try {
      let str = ''
      const roundJson = news.league[this.league][this.season][this.round]
      const lastRoundJson = news.league[this.league][this.season][(this.round - 1) + '']
      if (roundJson.hasOwnProperty(this.hostTeam)) {
        if (roundJson[this.hostTeam]?.news) {
          str = str + '主队新闻：' + roundJson[this.hostTeam].news + '\n'
        }
        if (roundJson[this.hostTeam]?.motivation) {
          str = str + '主队战意：' + roundJson[this.hostTeam].motivation + '\n'
        }
      }
      if (lastRoundJson.hasOwnProperty(this.hostTeam)) {
        if (lastRoundJson[this.hostTeam]?.summary) {
          str = str + '主队上轮总结：' + lastRoundJson[this.hostTeam].summary + '\n\n'
        } else str = str + '\n'
      } else str = str + '\n'
      if (roundJson.hasOwnProperty(this.awayTeam)) {
        if (roundJson[this.awayTeam]?.news) {
          str = str + '客队新闻：' + roundJson[this.awayTeam].news + '\n'
        }
        if (roundJson[this.awayTeam]?.motivation) {
          str = str + '客队战意：' + roundJson[this.awayTeam].motivation + '\n'
        }
      }
      if (lastRoundJson.hasOwnProperty(this.awayTeam)) {
        if (lastRoundJson[this.awayTeam]?.summary) {
          str = str + '客队上轮总结：' + lastRoundJson[this.awayTeam].summary + '\n\n'
        } else str = str + '\n'
      } else str = str + '\n'
      return str
    } catch (error) {
      console.log(error)
      return '程序报错，暂无新闻'
    }
  }
}

module.exports = {
  League,
  Player,
  Club,
  Match
}