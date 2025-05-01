/**
 * test_kolwill_fix.js
 * 测试科尔威尔的数据统计修复效果
 */

const fs = require('fs');
const path = require('path');
const ClubAnalyzer = require('./crawlerClub3_new');

// 配置参数
const TEAM_ID = 24; // 切尔西
const PLAYER_NUMBER = 6; // 科尔威尔的球衣号码

// 测试特定比赛的统计修复
async function testSpecificMatches() {
  console.log('开始测试科尔威尔进球和助攻数据修复...');
  
  // 特定关注的比赛
  const SPECIFIC_MATCHES = {
    '2591071': '第18轮比赛', // 科尔威尔有1个助攻
    '2591165': '第27轮比赛'  // 科尔威尔有1个进球
  };
  
  try {
    // 创建分析器实例
    const analyzer = new ClubAnalyzer({
      leagueId: 's36', // 英超
      serial: TEAM_ID,
      isNation: false
    });
    
    // 逐个测试特定比赛
    for (const [matchId, description] of Object.entries(SPECIFIC_MATCHES)) {
      console.log(`\n测试${description} (ID: ${matchId})...`);
      
      // 直接获取匹配数据
      try {
        const matchData = await analyzer.fetchMatchData(matchId);
        console.log(`比赛状态: ${matchData.status}`);
        console.log(`使用阵型: ${matchData.formation}`);
        
        // 检查科尔威尔的数据
        const kolwillPlayer = matchData.players.find(p => 
          p.number === PLAYER_NUMBER || 
          p.name.includes('科尔威尔') || 
          p.name.includes('Colwill')
        );
        
        if (kolwillPlayer) {
          console.log(`科尔威尔在本场比赛中:`);
          console.log(`  名称: ${kolwillPlayer.name}`);
          console.log(`  号码: ${kolwillPlayer.number}`);
          console.log(`  位置: ${kolwillPlayer.position}`);
          console.log(`  首发: ${kolwillPlayer.isStarter}`);
          console.log(`  进球: ${kolwillPlayer.goals}`);
          console.log(`  助攻: ${kolwillPlayer.assists}`);
        } else {
          console.log(`未在本场比赛中找到科尔威尔`);
        }
        
        // 处理球员数据
        analyzer.processMatchPlayerData(matchData);
        
      } catch (error) {
        console.error(`获取比赛 ${matchId} 数据失败: ${error.message}`);
      }
    }
    
    // 检查累计的科尔威尔数据
    if (analyzer.playersData[`${PLAYER_NUMBER}`]) {
      const kolwillData = analyzer.playersData[`${PLAYER_NUMBER}`];
      
      console.log('\n=== 科尔威尔累计数据 ===');
      console.log(`名称: ${kolwillData.name}`);
      console.log(`比赛场次: ${kolwillData.matches}`);
      console.log(`首发场次: ${kolwillData.starts}`);
      console.log(`进球数: ${kolwillData.goals}`);
      console.log(`助攻数: ${kolwillData.assists}`);
      
      // 验证修复是否成功
      if (kolwillData.goals >= 1 && kolwillData.assists >= 1) {
        console.log('\n✅ 修复成功! 科尔威尔现在有至少1个进球和1个助攻');
      } else {
        console.log('\n❌ 修复失败! 科尔威尔数据仍不正确');
        console.log(`  当前进球: ${kolwillData.goals}, 预期至少: 1`);
        console.log(`  当前助攻: ${kolwillData.assists}, 预期至少: 1`);
      }
    } else {
      console.log('\n未找到科尔威尔的累计数据');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    throw error;
  }
}

// 执行测试
testSpecificMatches()
  .then(() => {
    console.log('\n测试完成!');
  })
  .catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  }); 