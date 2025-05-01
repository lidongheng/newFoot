/**
 * merge_players_test.js
 * 测试球员合并功能 - 检查同球衣号码不同名称的球员是否被正确合并
 */

const fs = require('fs');
const path = require('path');
const ClubAnalyzer = require('./crawlerClub3_new');

// 测试配置
const testConfig = {
  leagueId: 's36', // 英超
  serial: 24,      // 切尔西
  isNation: false,
  roundSerial: 38  // 当前轮次
};

async function runTest() {
  console.log('开始测试球员合并功能...');
  
  // 保存原始的 readLeagueData 和 readTeamData 方法
  const originalReadLeagueData = ClubAnalyzer.prototype.readLeagueData;
  const originalReadTeamData = ClubAnalyzer.prototype.readTeamData;
  const originalFetchMatchData = ClubAnalyzer.prototype.fetchMatchData;
  
  try {
    // 修改 readLeagueData 方法以返回模拟数据
    ClubAnalyzer.prototype.readLeagueData = async function() {
      console.log('使用模拟联赛数据...');
      // 创建简单的联赛数据结构
      return {
        matches: {
          'R_1': [
            ['1001', 36, -1, '2023-08-18 23:30', 24, 26, '0-2', '0-1', '', '', '', '', '']
          ],
          'R_2': [
            ['1002', 36, -1, '2023-08-25 23:30', 24, 25, '1-0', '0-0', '', '', '', '', '']
          ]
        },
        teams: [
          [24, '切尔西'],
          [26, '曼彻斯特城'],
          [25, '阿森纳']
        ]
      };
    };
    
    // 修改 readTeamData 方法以返回模拟数据
    ClubAnalyzer.prototype.readTeamData = async function() {
      console.log('使用模拟球队数据...');
      // 创建简单的球队数据结构
      return {
        id: this.serial,
        name: '切尔西',
        // 其他球队数据...
      };
    };
    
    // 模拟第一场比赛数据（科尔威尔）
    const mockMatch1 = {
      id: '1001',
      status: 'home',
      formation: '4231',
      players: [
        {
          name: '科尔威尔',
          number: 6,
          position: 'CB',
          isStarter: true,
          goals: 0,
          assists: 0,
          substitutedIn: false,
          substitutedOut: false,
          yellowCards: 0,
          redCards: 0
        },
        {
          name: '桑切斯',
          number: 1,
          position: 'GK',
          isStarter: true,
          goals: 0,
          assists: 0,
          substitutedIn: false,
          substitutedOut: false,
          yellowCards: 0,
          redCards: 0
        }
      ]
    };
    
    // 模拟第二场比赛数据（列维·科尔威尔）
    const mockMatch2 = {
      id: '1002',
      status: 'home',
      formation: '4231',
      players: [
        {
          name: '列维·科尔威尔',
          number: 6,
          position: 'CB',
          isStarter: true,
          goals: 1,
          assists: 0,
          substitutedIn: false,
          substitutedOut: false,
          yellowCards: 1,
          redCards: 0
        },
        {
          name: '桑切斯',
          number: 1,
          position: 'GK',
          isStarter: true,
          goals: 0,
          assists: 0,
          substitutedIn: false,
          substitutedOut: false,
          yellowCards: 0,
          redCards: 0
        }
      ]
    };
    
    // 修改 fetchMatchData 方法以返回模拟数据
    ClubAnalyzer.prototype.fetchMatchData = async function(matchId) {
      // 检查缓存
      if (this.matchDataCache.has(matchId)) {
        return this.matchDataCache.get(matchId);
      }
      
      console.log(`获取模拟比赛数据 (${matchId})...`);
      
      // 根据比赛ID返回不同的模拟数据
      let matchData;
      if (matchId === '1001') {
        matchData = mockMatch1;
      } else if (matchId === '1002') {
        matchData = mockMatch2;
      } else {
        throw new Error(`未知的比赛ID: ${matchId}`);
      }
      
      // 缓存模拟数据
      this.matchDataCache.set(matchId, matchData);
      
      return matchData;
    };
    
    // 创建分析器实例
    const analyzer = new ClubAnalyzer(testConfig);
    
    // 运行分析
    const report = await analyzer.analyze();
    
    // 检查结果
    console.log('\n=== 测试结果 ===');
    
    // 检查球员数量
    const playerCount = Object.keys(report.players).length;
    console.log(`球员总数: ${playerCount}`);
    
    // 检查球员6的数据
    const player6 = report.players['6'];
    if (player6) {
      console.log(`\n球员 #6 数据:`);
      console.log(`  名称: ${player6.name}`);
      console.log(`  比赛场次: ${player6.matches} (预期: 2)`);
      console.log(`  进球: ${player6.goals} (预期: 1)`);
      console.log(`  备选名称: ${player6.alternativeNames.join(', ')}`);
      
      // 检验测试
      const isTestPassed = player6.matches === 2 && 
                          player6.alternativeNames.length > 0 && 
                          (player6.alternativeNames.includes('科尔威尔') || player6.alternativeNames.includes('列维·科尔威尔'));
      
      if (isTestPassed) {
        console.log('\n✅ 测试通过: 同球衣号码不同名称的球员已被正确合并');
      } else {
        console.log('\n❌ 测试失败: 同球衣号码不同名称的球员未被正确合并');
      }
    } else {
      console.log('\n❌ 测试失败: 未找到球员 #6');
    }
    
    // 保存报告到文件以便检查
    const reportPath = path.resolve(__dirname, 'merge_test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n报告已保存到 ${reportPath}`);
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 恢复原始方法
    ClubAnalyzer.prototype.readLeagueData = originalReadLeagueData;
    ClubAnalyzer.prototype.readTeamData = originalReadTeamData;
    ClubAnalyzer.prototype.fetchMatchData = originalFetchMatchData;
  }
}

// 运行测试
runTest(); 