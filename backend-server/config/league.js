const { dateFormat } = require('../utils/utils')

// 模块二：分析比赛的基础信息
// 日职联 START --------------------------------
// 联赛代码
const leagueCode = '34'
// 赛季
const season = '2022-2023'
// 轮次
const round = 23
// 主队
const host = '罗马'
// 客队
const away = '维罗纳'
// 联赛
const league = 'SerieA'
// 主队阵型
const hostFormations = ['3421']
// 客队阵型
const awayFormations = ['3421']
// 亚盘拉力
const yapan = away
// 大小拉力
const daxiao = '小'
// 模块一：不常变动的数据
const BASE_URL = 'http://zq.titan007.com/jsData/'
const qiutanHeaders = {
  'Referer': `http://zq.titan007.com/cn/${season.indexOf('-') > -1 ? 'League/' + leagueCode : 'SubLeague/' + leagueCode}.html`,
  'Host': 'zq.titan007.com'
}
const EqiutanHeaders = {
  'Referer': `https://zq.titan007.com/cn/League/36.html`,
  'Host': 'bf.titan007.com'
}
const EdetailHeaders = {
  'Referer': 'https://zq.titan007.com/cn/League/36.html',
  'Host': 'bf.titan007.com'
}
// ${BASE_URL}timeDistri/${season}/td${leagueCode}.js?flesh=${Math.random()}
// 本期暂时不抓取
// 爬虫页面 943 313
const start_urls = [
  `${BASE_URL}matchResult/${season}/s${leagueCode}.js?version=${dateFormat(new Date().getTime(), 'YYYYMMDDHH')}`,
  `${BASE_URL}letGoal/${season}/l${leagueCode}.js?flesh=${Math.random()}`,
  `${BASE_URL}bigSmall/${season}/bs${leagueCode}.js?flesh=${Math.random()}`,
  'https://zq.titan007.com/analysis/2223012cn.htm',
  'https://www.okooo.com/soccer/match/1176595/history/'
]

module.exports = {
  qiutanHeaders,
  EdetailHeaders,
  EqiutanHeaders,
  start_urls,
  host,
  away,
  league,
  hostFormations,
  awayFormations,
  round,
  yapan,
  daxiao,
  season
}