/**
 * @func pickupGoalAndAssist
 * @desc 提取爬虫数据中的goal和Assist
 * @param {$1：cheerio对象，i：index，subsflag：是否替补}  
 * @return {} 
 */
function pickupGoalAndAssist ($1, i, subsflag, newFlag) {
  let goal = 0, assist = 0, subcaps = 0, subs = 0
  let goalArr,penaltyArr,assistArr,subcapsArr
  if (newFlag) {
    goalArr = $1(i).children().last().html().match(/1\.png/gi)
    penaltyArr = $1(i).children().last().html().match(/7\.png/gi)
    assistArr = $1(i).children().last().html().match(/12\.png/gi)
    subcapsArr = $1(i).children().last().html().match(/4\.png/gi)
  } else {
    goalArr = $1(i).children().children().first().html().match(/1\.png/gi)
    penaltyArr = $1(i).children().children().first().html().match(/7\.png/gi)
    assistArr = $1(i).children().children().first().html().match(/12\.png/gi)
    subcapsArr = $1(i).children().children().first().html().match(/4\.png/gi)
  }
  subs = (subsflag && !subcaps) ? 1 : 0
  if (goalArr) goal = goal + goalArr.length
  if (penaltyArr) goal = goal + penaltyArr.length
  if (assistArr) assist = assist + assistArr.length
  if (subcapsArr) subcaps = subcaps + subcapsArr.length
  return [goal, assist, subcaps, subs]
}

module.exports = {
  pickupGoalAndAssist
}