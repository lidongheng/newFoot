function outputPlayer (players) {
  // 标准化返回
  const standardPlayers = []
  players.forEach(item => {
    const obj = {}
    obj.name = item.name
    obj.club = item.club
    obj.nation = item.nation
    obj.stats = 0
    obj.position = [""]
    obj.staff = item.attrDes
    obj.attr = item.attrDes
    obj.attrDes = item.attrDes
    obj.caps = 0
    obj.lineups = 0
    obj.goal = 0
    obj.assist = 0
    obj.age = item.age
    obj.number = item.number
    obj.height = item.height
    obj.subs = 0
    obj.ename = item.ename
    standardPlayers.push(obj)
  })
  return standardPlayers
}

module.exports = {
  outputPlayer
}