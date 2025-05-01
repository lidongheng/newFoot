/**
 * fix_matches_count_test.js
 * 模拟分析过程中可能丢失一场比赛的情况并修复
 */

const fs = require('fs');
const path = require('path');
const ClubAnalyzer = require('./crawlerClub3_new');

// 测试配置
const config = {
  leagueId: 's36', // 英超
  serial: 24,      // 切尔西
  isNation: false,
  roundSerial: 38  // 当前轮次
};

// 模拟比赛数据
const mockMatches = {
  // 科尔威尔的3场非首发比赛
  '2591037': {
    id: '2591037',
    status: 'guest',
    formation: '4231',
    players: [
      {
        name: '科尔威尔',
        number: 6,
        position: 'Substitute',
        isStarter: false,
        goals: 0,
        assists: 0,
        substitutedIn: true,
        substitutedOut: false
      }
    ]
  },
  '2591110': {
    id: '2591110',
    status: 'home',
    formation: '4231',
    players: [
      // 不包含科尔威尔
    ]
  },
  '2591199': {
    id: '2591199',
    status: 'guest',
    formation: '4231',
    players: [
      {
        name: '科尔威尔',
        number: 6,
        position: 'Substitute',
        isStarter: false,
        goals: 0,
        assists: 0,
        substitutedIn: true,
        substitutedOut: false
      }
    ]
  },
  // 添加一场首发比赛
  '2591001': {
    id: '2591001',
    status: 'home',
    formation: '4231',
    players: [
      {
        name: '列维·科尔威尔',
        number: 6,
        position: 'CB',
        isStarter: true,
        goals: 0,
        assists: 0,
        substitutedIn: false,
        substitutedOut: false
      }
    ]
  }
};

/**
 * 创建修复版本的 processMatchPlayerData 方法
 * 仅用于测试和说明
 */
function processMatchPlayerDataFixed(playersData, matchData) {
  const { players, formation } = matchData;
  
  // 更新球员数据
  for (const player of players) {
    const { name, number, position, isStarter, goals, assists, substitutedIn, substitutedOut } = player;
    
    // 创建球员唯一标识符 - 使用球衣号码作为唯一标识符
    const playerKey = `${number}`;
    
    // 如果球员还未被记录，则初始化其数据
    if (!playersData[playerKey]) {
      playersData[playerKey] = {
        name,
        number,
        matches: 0,
        starts: 0,
        positions: {},
        goals: 0,
        assists: 0,
        minutesPlayed: 0,
        substitutedIn: 0,
        substitutedOut: 0,
        alternativeNames: []
      };
    }
    
    // 更新球员数据
    const playerData = playersData[playerKey];
    
    // 如果当前名称与记录的不同，且还未记录在alternativeNames中，则添加到备选名称列表
    if (playerData.name !== name && !playerData.alternativeNames.includes(name)) {
      playerData.alternativeNames.push(name);
    }
    
    // 增加比赛计数
    playerData.matches++;
    
    // 记录首发
    if (isStarter) {
      playerData.starts++;
    }
    
    // 更新位置统计
    if (position !== 'Unknown' && position !== 'Substitute') {
      playerData.positions[position] = (playerData.positions[position] || 0) + 1;
    }
    
    // 更新进球和助攻
    playerData.goals += goals;
    playerData.assists += assists;
    
    // 更新换人信息
    if (substitutedIn) {
      playerData.substitutedIn++;
    }
    
    if (substitutedOut) {
      playerData.substitutedOut++;
    }
    
    // 简单估算比赛时间
    let minutesPlayed = 0;
    if (isStarter) {
      minutesPlayed = substitutedOut ? 70 : 90;
    } else if (substitutedIn) {
      minutesPlayed = 20;
    }
    
    playerData.minutesPlayed += minutesPlayed;
  }
  
  return playersData;
}

/**
 * 测试正常的计数方法
 */
function testNormalCount() {
  console.log('测试正常计数方法:');
  const playersData = {};
  
  // 处理所有模拟比赛
  for (const matchId in mockMatches) {
    const matchData = mockMatches[matchId];
    
    // 手动实现 processMatchPlayerData 逻辑
    const { players, formation } = matchData;
    
    for (const player of players) {
      const { name, number, position, isStarter } = player;
      
      if (!number) continue; // 跳过没有号码的球员
      
      // 创建球员唯一标识符
      const playerKey = `${number}`;
      
      // 初始化球员数据
      if (!playersData[playerKey]) {
        playersData[playerKey] = {
          name,
          number,
          matches: 0,
          starts: 0,
          alternativeNames: []
        };
      }
      
      // 更新球员数据
      const playerData = playersData[playerKey];
      
      // 记录名称变体
      if (playerData.name !== name && !playerData.alternativeNames.includes(name)) {
        playerData.alternativeNames.push(name);
      }
      
      // 增加比赛和首发计数
      playerData.matches++;
      console.log(`  比赛 ${matchId}: 球员 #${number} matches ${playerData.matches}`);
      
      if (isStarter) {
        playerData.starts++;
        console.log(`  比赛 ${matchId}: 球员 #${number} starts ${playerData.starts}`);
      }
    }
  }
  
  // 打印结果
  console.log('\n结果:');
  for (const key in playersData) {
    const player = playersData[key];
    console.log(`球员 #${player.number} (${player.name}): 比赛 ${player.matches}, 首发 ${player.starts}`);
  }
  
  return playersData;
}

/**
 * 测试使用修复版本的 processMatchPlayerData 方法
 */
function testFixedCount() {
  console.log('\n测试修复后的计数方法:');
  const playersData = {};
  
  // 处理所有模拟比赛
  for (const matchId in mockMatches) {
    const matchData = mockMatches[matchId];
    processMatchPlayerDataFixed(playersData, matchData);
  }
  
  // 打印结果
  console.log('\n结果:');
  for (const key in playersData) {
    const player = playersData[key];
    console.log(`球员 #${player.number} (${player.name}): 比赛 ${player.matches}, 首发 ${player.starts}`);
  }
  
  return playersData;
}

/**
 * 测试使用修改后的ClubAnalyzer类方法
 */
async function testClubAnalyzer() {
  console.log('\n测试 ClubAnalyzer 类:');
  
  // 创建分析器实例
  const analyzer = new ClubAnalyzer(config);
  
  // 创建自定义分析器方法（仅用于测试）
  analyzer.analyzeTestMatches = function(mockMatches) {
    // 初始化数据
    this.playersData = {};
    this.formationStats = {};
    
    // 处理所有模拟比赛
    for (const matchId in mockMatches) {
      console.log(`处理比赛: ${matchId}`);
      const matchData = mockMatches[matchId];
      this.processMatchPlayerData(matchData);
    }
    
    // 生成报告
    return this.generateTeamReport();
  };
  
  // 运行测试分析
  const report = analyzer.analyzeTestMatches(mockMatches);
  
  // 检查结果
  console.log('\n分析结果:');
  if (report.players['6']) {
    const player = report.players['6'];
    console.log(`球员 #${player.number} (${player.name}): 比赛 ${player.matches}, 首发 ${player.starts}`);
    if (player.alternativeNames.length > 0) {
      console.log(`备选名称: ${player.alternativeNames.join(', ')}`);
    }
  } else {
    console.log('未找到6号球员');
  }
  
  return report;
}

/**
 * 运行测试
 */
async function runTest() {
  try {
    console.log('=== 开始测试比赛计数问题 ===\n');
    
    // 测试正常计数
    const normalResult = testNormalCount();
    
    // 测试修复后的计数
    const fixedResult = testFixedCount();
    
    // 测试使用ClubAnalyzer类
    const analyzerResult = await testClubAnalyzer();
    
    // 保存测试结果
    const outputPath = path.resolve(__dirname, 'fix_count_test_results.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      normal: normalResult,
      fixed: fixedResult,
      analyzer: analyzerResult
    }, null, 2), 'utf8');
    
    console.log(`\n测试结果已保存至 ${outputPath}`);
    
    // 对比结果
    console.log('\n=== 结果对比 ===');
    if (normalResult['6'] && fixedResult['6']) {
      console.log(`正常方法: 球员 #6 比赛 ${normalResult['6'].matches}, 首发 ${normalResult['6'].starts}`);
      console.log(`修复方法: 球员 #6 比赛 ${fixedResult['6'].matches}, 首发 ${fixedResult['6'].starts}`);
    }
    
    // 提出可能的解决方案
    console.log('\n=== 可能的问题和解决方案 ===');
    console.log('1. 检查比赛数据获取过程是否有丢失');
    console.log('2. 确认处理数据时的循环是否完整执行');
    console.log('3. 确保重复比赛不会被重复统计');
    console.log('4. 查看真实数据源中丢失的比赛详情');
    
    console.log('\n测试完成!');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
runTest(); 