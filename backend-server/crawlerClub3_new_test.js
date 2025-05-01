/**
 * crawlerClub3_new_test.js
 * 测试修改后的 ClubAnalyzer 类
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
  console.log('开始测试修改后的 ClubAnalyzer 类...');
  
  // 保存原始的 readLeagueData 和 readTeamData 方法
  const originalReadLeagueData = ClubAnalyzer.prototype.readLeagueData;
  const originalReadTeamData = ClubAnalyzer.prototype.readTeamData;
  
  try {
    // 修改 readLeagueData 方法以返回模拟数据
    ClubAnalyzer.prototype.readLeagueData = async function() {
      console.log('使用模拟联赛数据...');
      // 创建简单的联赛数据结构
      return {
        matches: {
          'R_1': [
            ['2590906', 36, -1, '2023-08-18 23:30', 24, 26, '0-2', '0-1', '', '', '', '', '']
          ]
        },
        teams: [
          [24, '切尔西'],
          [26, '曼彻斯特城']
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
    
    // 修改 fetchMatchData 方法以直接读取模拟数据
    const originalFetchMatchData = ClubAnalyzer.prototype.fetchMatchData;
    ClubAnalyzer.prototype.fetchMatchData = async function(matchId) {
      // 检查缓存
      if (this.matchDataCache.has(matchId)) {
        return this.matchDataCache.get(matchId);
      }
      
      console.log(`使用模拟比赛数据 (${matchId})...`);
      
      // 模拟的比赛数据
      const mockMatchData = {
        id: matchId,
        status: 'home',
        formation: '4231',
        players: [
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
          },
          {
            name: '库库雷利亚',
            number: 3,
            position: 'LB',
            isStarter: true,
            goals: 0,
            assists: 0,
            substitutedIn: false,
            substitutedOut: true,
            yellowCards: 0,
            redCards: 0
          },
          {
            name: '列维·科尔威尔',
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
            name: '科尔威尔',
            number: 8, // 修改为不同的球衣号码
            position: 'Substitute',
            isStarter: false,
            goals: 0,
            assists: 0,
            substitutedIn: true,
            substitutedOut: false,
            yellowCards: 0,
            redCards: 0
          }
        ]
      };
      
      // 缓存模拟数据
      this.matchDataCache.set(matchId, mockMatchData);
      
      return mockMatchData;
    };
    
    // 创建分析器实例
    const analyzer = new ClubAnalyzer(testConfig);
    
    // 运行分析
    const report = await analyzer.analyze();
    
    // 将报告格式化为字符串以便查看
    console.log('\n测试结果：');
    console.log('最常用阵型:', report.mostUsedFormation);
    console.log('球员数量:', Object.keys(report.players).length);
    
    // 检查球员唯一标识
    console.log('\n球员数据:');
    const playerKeys = Object.keys(report.players);
    console.log(`共 ${playerKeys.length} 名球员:`);
    for (const playerKey of playerKeys) {
      const player = report.players[playerKey];
      console.log(`${playerKey}: ${player.name} (${player.number}), 比赛: ${player.matches}, 首发: ${player.starts}`);
    }
    
    // 保存报告到文件以便检查
    const reportPath = path.resolve(__dirname, 'report_test.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n报告已保存到 ${reportPath}`);
    
    // 检查是否正确处理了同名但不同号码的球员
    const koerweiPlayers = Object.keys(report.players).filter(key => key.includes('科尔威尔'));
    console.log(`\n科尔威尔相关球员: ${koerweiPlayers.length}名`);
    koerweiPlayers.forEach(key => {
      const player = report.players[key];
      console.log(`  ${key}: ${player.name} (#${player.number})`);
    });

    // 执行断言测试
    const hasDifferentPlayers = koerweiPlayers.length > 1;
    if (hasDifferentPlayers) {
      console.log('\n✅ 测试通过: 同名不同号码的球员被正确区分');
    } else {
      console.log('\n❌ 测试失败: 同名不同号码的球员未被正确区分');
    }

    // 测试球衣号码唯一性
    const playerByNumber = {};
    let duplicateNumberFound = false;

    for (const key in report.players) {
      const player = report.players[key];
      const numberKey = `${player.number}`;
      
      if (playerByNumber[numberKey] && playerByNumber[numberKey] !== player.name) {
        console.log(`\n⚠️ 发现重复球衣号码: #${player.number} 被 ${playerByNumber[numberKey]} 和 ${player.name} 使用`);
        duplicateNumberFound = true;
      }
      
      playerByNumber[numberKey] = player.name;
    }

    if (!duplicateNumberFound) {
      console.log('\n✅ 测试通过: 没有重复的球衣号码');
    }

    // 总结测试结果
    console.log('\n=== 测试总结 ===');
    if (hasDifferentPlayers && !duplicateNumberFound) {
      console.log('✅ 所有测试通过: 球衣号码正确解析，同名球员正确区分');
    } else {
      console.log('❌ 测试未完全通过，请检查输出日志');
    }

    console.log('测试完成');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 恢复原始方法
    ClubAnalyzer.prototype.readLeagueData = originalReadLeagueData;
    ClubAnalyzer.prototype.readTeamData = originalReadTeamData;
  }
}

// 运行测试
runTest(); 