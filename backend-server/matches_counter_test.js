/**
 * matches_counter_test.js
 * 测试比赛数据的计数方式，找出球员数据的matches和starts可能少一场的原因
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

// 设置项目根目录
const PROJECT_ROOT = __dirname;

// 模拟数据
const mockData = {
  // 模拟三场比赛
  matches: [
    {
      id: '1001',
      players: [
        { name: '科尔威尔', number: 6, isStarter: true, substitutedOut: false }
      ]
    },
    {
      id: '1002',
      players: [
        { name: '列维·科尔威尔', number: 6, isStarter: true, substitutedOut: true }
      ]
    },
    {
      id: '1003',
      players: [
        { name: '科尔威尔', number: 6, isStarter: false, substitutedIn: true }
      ]
    }
  ]
};

// 计数方法测试 - 标准版本
function countMatchesStandard() {
  const playersData = {};
  
  console.log('标准版本计数:');
  
  // 处理每场比赛
  for (const match of mockData.matches) {
    console.log(`\n处理比赛: ${match.id}`);
    
    // 处理每个球员
    for (const player of match.players) {
      const { name, number, isStarter } = player;
      
      // 使用球衣号码作为唯一标识
      const playerKey = `${number}`;
      
      // 初始化球员数据（如果不存在）
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
      console.log(`  球员 #${number} (${name}): matches ${playerData.matches-1} -> ${playerData.matches}`);
      
      if (isStarter) {
        playerData.starts++;
        console.log(`  球员 #${number} (${name}): starts ${playerData.starts-1} -> ${playerData.starts}`);
      }
    }
  }
  
  // 返回结果
  return playersData;
}

// 测试自增操作符位置的影响
function countMatchesPostIncrement() {
  const playersData = {};
  
  console.log('\n后置自增版本计数 (val++):');
  
  for (const match of mockData.matches) {
    console.log(`\n处理比赛: ${match.id}`);
    
    for (const player of match.players) {
      const { name, number, isStarter } = player;
      const playerKey = `${number}`;
      
      if (!playersData[playerKey]) {
        playersData[playerKey] = {
          name,
          number,
          matches: 0,
          starts: 0,
          alternativeNames: []
        };
      }
      
      const playerData = playersData[playerKey];
      
      if (playerData.name !== name && !playerData.alternativeNames.includes(name)) {
        playerData.alternativeNames.push(name);
      }
      
      // 使用后置自增
      const beforeMatches = playerData.matches++;
      console.log(`  球员 #${number} (${name}): matches ${beforeMatches} -> ${playerData.matches}`);
      
      if (isStarter) {
        const beforeStarts = playerData.starts++;
        console.log(`  球员 #${number} (${name}): starts ${beforeStarts} -> ${playerData.starts}`);
      }
    }
  }
  
  return playersData;
}

// 测试前置自增操作符
function countMatchesPreIncrement() {
  const playersData = {};
  
  console.log('\n前置自增版本计数 (++val):');
  
  for (const match of mockData.matches) {
    console.log(`\n处理比赛: ${match.id}`);
    
    for (const player of match.players) {
      const { name, number, isStarter } = player;
      const playerKey = `${number}`;
      
      if (!playersData[playerKey]) {
        playersData[playerKey] = {
          name,
          number,
          matches: 0,
          starts: 0,
          alternativeNames: []
        };
      }
      
      const playerData = playersData[playerKey];
      
      if (playerData.name !== name && !playerData.alternativeNames.includes(name)) {
        playerData.alternativeNames.push(name);
      }
      
      // 使用前置自增
      const beforeMatches = playerData.matches;
      ++playerData.matches;
      console.log(`  球员 #${number} (${name}): matches ${beforeMatches} -> ${playerData.matches}`);
      
      if (isStarter) {
        const beforeStarts = playerData.starts;
        ++playerData.starts;
        console.log(`  球员 #${number} (${name}): starts ${beforeStarts} -> ${playerData.starts}`);
      }
    }
  }
  
  return playersData;
}

// 运行测试
function runTest() {
  console.log('开始测试比赛数据计数方式...\n');
  
  // 运行不同版本的计数方法
  const standardResult = countMatchesStandard();
  const postIncrementResult = countMatchesPostIncrement();
  const preIncrementResult = countMatchesPreIncrement();
  
  // 比较结果
  console.log('\n=== 测试结果比较 ===');
  
  console.log('\n标准版本:');
  for (const key in standardResult) {
    const player = standardResult[key];
    console.log(`球员 #${player.number} (${player.name}): 比赛 ${player.matches}, 首发 ${player.starts}`);
  }
  
  console.log('\n后置自增版本:');
  for (const key in postIncrementResult) {
    const player = postIncrementResult[key];
    console.log(`球员 #${player.number} (${player.name}): 比赛 ${player.matches}, 首发 ${player.starts}`);
  }
  
  console.log('\n前置自增版本:');
  for (const key in preIncrementResult) {
    const player = preIncrementResult[key];
    console.log(`球员 #${player.number} (${player.name}): 比赛 ${player.matches}, 首发 ${player.starts}`);
  }
  
  // 保存测试结果
  const outputPath = path.resolve(PROJECT_ROOT, 'counter_test_results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    standard: standardResult,
    postIncrement: postIncrementResult,
    preIncrement: preIncrementResult
  }, null, 2), 'utf8');
  
  console.log(`\n测试结果已保存至 ${outputPath}`);
}

// 运行测试
runTest(); 