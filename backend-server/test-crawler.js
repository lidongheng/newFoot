/**
 * 测试脚本 - 测试爬虫功能
 */

const ClubAnalyzer = require('./crawlerClub3_new');
const fs = require('fs');
const path = require('path');

// 测试配置
const testConfig = {
  leagueId: 's36', // 英超
  serial: 24,   // 切尔西
  isNation: false,
  roundSerial: 38
};

// 创建测试目录
const testDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
}

async function runTest() {
  console.log('开始测试爬虫功能...');
  
  try {
    // 创建分析器实例
    const analyzer = new ClubAnalyzer(testConfig);
    
    // 测试读取联赛数据
    console.log('\n1. 测试读取联赛数据');
    try {
      const leagueData = await analyzer.readLeagueData();
      console.log(`✓ 成功读取联赛数据：找到 ${Object.keys(leagueData.matches).length} 轮比赛信息`);
    } catch (error) {
      console.error(`✗ 读取联赛数据失败: ${error.message}`);
      return;
    }
    
    // 测试分析单场比赛
    console.log('\n2. 测试分析单场比赛数据');
    const testMatchId = '2591231'; // 使用example.html中的比赛ID
    
    try {
      const matchData = await analyzer.fetchMatchData(testMatchId);
      console.log(`✓ 成功获取比赛 ${testMatchId} 数据`);
      console.log(`  - 阵型: ${matchData.formation}`);
      console.log(`  - 球员数量: ${matchData.players.length}`);
      
      // 保存测试结果到文件
      fs.writeFileSync(
        path.join(testDir, 'match-data.json'), 
        JSON.stringify(matchData, null, 2), 
        'utf8'
      );
      console.log(`  - 比赛数据已保存至 test-output/match-data.json`);
    } catch (error) {
      console.error(`✗ 获取比赛数据失败: ${error.message}`);
    }
    
    // 测试处理球员数据
    console.log('\n3. 测试处理球员数据');
    try {
      const mockMatchData = {
        id: testMatchId,
        status: 'home',
        formation: '4231',
        players: [
          {
            name: '测试球员1',
            number: 10,
            position: 'ST',
            isStarter: true,
            goals: 1,
            assists: 0,
            substitutedIn: false,
            substitutedOut: true
          },
          {
            name: '测试球员2',
            number: 7,
            position: 'LW',
            isStarter: true,
            goals: 0,
            assists: 1,
            substitutedIn: false,
            substitutedOut: false
          }
        ]
      };
      
      analyzer.processMatchPlayerData(mockMatchData);
      console.log(`✓ 成功处理球员数据`);
      
      // 获取最常用阵型
      const formation = analyzer.getMostUsedFormation();
      console.log(`  - 最常用阵型: ${formation}`);
      
      // 推荐首发阵容
      const lineup = analyzer.determineStartingLineup(formation);
      console.log(`  - 推荐阵容包含 ${lineup.length} 名球员`);
      
      // 保存测试结果到文件
      const report = analyzer.generateTeamReport();
      fs.writeFileSync(
        path.join(testDir, 'analysis-report.json'), 
        JSON.stringify(report, null, 2), 
        'utf8'
      );
      console.log(`  - 分析报告已保存至 test-output/analysis-report.json`);
    } catch (error) {
      console.error(`✗ 处理球员数据失败: ${error.message}`);
    }
    
    console.log('\n测试完成！');
  } catch (error) {
    console.error(`测试过程中发生错误: ${error.message}`);
  }
}

runTest(); 