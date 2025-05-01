/**
 * fix_matches_count.js
 * 修复球员比赛计数问题
 */

const fs = require('fs');
const path = require('path');

// 配置参数
const TEAM_ID = 24; // 切尔西
const PLAYER_NUMBER = 6; // 科尔威尔的球衣号码

// 读取已有的球员数据
function readPlayerData() {
  try {
    const filePath = path.resolve(__dirname, `player_center/${TEAM_ID}.json`);
    console.log(`读取文件: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`读取球员数据失败: ${error.message}`);
    return null;
  }
}

// 读取新的分析数据
function readNewPlayerData() {
  try {
    const filePath = path.resolve(__dirname, `player_center/${TEAM_ID}-new.json`);
    console.log(`读取文件: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`读取新球员数据失败: ${error.message}`);
    return null;
  }
}

// 修复数据并保存
function fixPlayerData() {
  // 读取原始数据
  const originalData = readPlayerData();
  const newData = readNewPlayerData();
  
  if (!originalData || !newData) {
    console.error('无法继续：缺少必要的数据文件');
    return;
  }
  
  console.log('\n=== 原始数据 ===');
  
  // 查找科尔威尔的数据
  let originalPlayerId = null;
  for (const playerId in originalData.players) {
    const player = originalData.players[playerId];
    if (player.number === PLAYER_NUMBER) {
      originalPlayerId = playerId;
      console.log(`找到科尔威尔原始数据: ${playerId}`);
      console.log(`  名称: ${player.name}`);
      console.log(`  比赛场次: ${player.matches}`);
      console.log(`  首发场次: ${player.starts}`);
      break;
    }
  }
  
  console.log('\n=== 新分析数据 ===');
  
  // 查找科尔威尔的新数据
  const newPlayerId = `${PLAYER_NUMBER}`;
  const newPlayer = newData.players[newPlayerId];
  
  if (newPlayer) {
    console.log(`找到科尔威尔新数据: ${newPlayerId}`);
    console.log(`  名称: ${newPlayer.name}`);
    console.log(`  比赛场次: ${newPlayer.matches}`);
    console.log(`  首发场次: ${newPlayer.starts}`);
    
    // 展示备选名称
    if (newPlayer.alternativeNames && newPlayer.alternativeNames.length > 0) {
      console.log(`  备选名称: ${newPlayer.alternativeNames.join(', ')}`);
    }
  } else {
    console.error('未找到科尔威尔新数据');
    return;
  }
  
  // 询问用户如何处理
  console.log('\n=== 数据修复选项 ===');
  console.log('1. 创建修复版数据');
  
  // 创建修复版数据
  const fixedData = JSON.parse(JSON.stringify(newData));
  
  // 修正科尔威尔的数据
  if (fixedData.players[newPlayerId]) {
    // 设置正确的matches和starts值（根据需求调整）
    fixedData.players[newPlayerId].matches = 32; // 根据用户提供的数据
    fixedData.players[newPlayerId].starts = 30;  // 根据用户提供的数据
    
    // 更新推荐阵容中的对应球员数据
    const lineupPlayerIndex = fixedData.recommendedLineup.findIndex(p => p.number === PLAYER_NUMBER);
    if (lineupPlayerIndex !== -1) {
      fixedData.recommendedLineup[lineupPlayerIndex].matches = 32;
      fixedData.recommendedLineup[lineupPlayerIndex].starts = 30;
    }
  }
  
  // 保存修复后的数据
  const outputPath = path.resolve(__dirname, `player_center/${TEAM_ID}-fixed.json`);
  fs.writeFileSync(outputPath, JSON.stringify(fixedData, null, 2), 'utf8');
  
  console.log(`\n修复后的数据已保存至 ${outputPath}`);
  console.log('\n修复摘要:');
  console.log(`  原始数据: 比赛 ${originalData.players[originalPlayerId]?.matches || '未知'}, 首发 ${originalData.players[originalPlayerId]?.starts || '未知'}`);
  console.log(`  新分析数据: 比赛 ${newPlayer.matches}, 首发 ${newPlayer.starts}`);
  console.log(`  修复后数据: 比赛 32, 首发 30`);
}

// 执行修复
fixPlayerData(); 