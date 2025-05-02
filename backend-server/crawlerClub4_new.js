const fs = require('fs');
const path = require('path');
const config = require('./config/wudaconfig');

/**
 * 分析球员数据
 * 统计当球员没有首发时球队的胜平负场数和输盘率
 */
class PlayerAnalyzer {
  constructor() {
    this.playerCenterDir = path.join(__dirname, 'player_center');
    this.config = config;
  }

  /**
   * 获取要分析的文件
   * @returns {Array} 文件列表
   */
  getPlayerFiles() {
    try {
      const { teamSerial } = this.config;
      const targetFilename = `${teamSerial}-new.json`;
      const filePath = path.join(this.playerCenterDir, targetFilename);
      
      if (fs.existsSync(filePath)) {
        console.log(`根据配置找到目标文件: ${targetFilename}`);
        return [targetFilename];
      } else {
        console.log(`目标文件不存在: ${targetFilename}`);
        return [];
      }
    } catch (error) {
      console.error('获取文件列表失败:', error);
      return [];
    }
  }

  /**
   * 分析单个球队数据
   * @param {string} filePath 文件路径
   */
  analyzeTeam(filePath) {
    try {
      console.log(`分析文件: ${filePath}`);
      
      // 读取文件数据
      const rawData = fs.readFileSync(filePath, 'utf8');
      
      // 尝试解析JSON
      let teamData;
      try {
        teamData = JSON.parse(rawData);
        console.log(`成功解析JSON`);
      } catch (error) {
        console.error(`JSON解析失败:`, error);
        return;
      }
      
      console.log(`\n===== ${teamData.teamChineseName || '未知球队'} (ID: ${teamData.teamId}) =====`);
      
      // 获取球队所有比赛记录
      const allMatches = new Map();
      
      // 收集所有比赛记录
      if (teamData.recommendedLineup && Array.isArray(teamData.recommendedLineup)) {
        for (const player of teamData.recommendedLineup) {
          if (player && player.matches && Array.isArray(player.matches)) {
            for (const match of player.matches) {
              if (match && match.round && !allMatches.has(match.round)) {
                allMatches.set(match.round, match);
              }
            }
          }
        }
      }
      
      console.log(`找到 ${allMatches.size} 场比赛记录`);
      
      // 处理每个球员数据
      const playersStats = [];
      
      if (teamData.recommendedLineup && Array.isArray(teamData.recommendedLineup)) {
        for (const player of teamData.recommendedLineup) {
          // 只处理有首发记录的球员
          if (player && player.lineups > 0) {
            const stats = {
              name: player.name || '未知',
              number: player.number || '',
              caps: player.caps || 0,
              lineups: player.lineups || 0,
              notStartingMatches: 0,
              notStartingWins: 0,
              notStartingDraws: 0,
              notStartingLosses: 0,
              notStartingWinPlates: 0,
              notStartingLosePlates: 0,
              notStartingDrawPlates: 0
            };
            
            // 获取球员首发的轮次
            const playerStartingRounds = new Set();
            
            if (player.matches && Array.isArray(player.matches)) {
              for (const match of player.matches) {
                if (match && match.round && match.lineups === 1) {
                  playerStartingRounds.add(match.round);
                }
              }
            }
            
            // 分析球员未首发的比赛
            for (const [round, match] of allMatches) {
              if (!playerStartingRounds.has(round)) {
                stats.notStartingMatches++;
                
                // 分析比赛结果
                if (match.score) {
                  try {
                    const [homeGoals, awayGoals] = match.score.split('-').map(Number);
                    
                    if (!isNaN(homeGoals) && !isNaN(awayGoals)) {
                      if (homeGoals > awayGoals) {
                        stats.notStartingWins++;
                      } else if (homeGoals === awayGoals) {
                        stats.notStartingDraws++;
                      } else {
                        stats.notStartingLosses++;
                      }
                    }
                  } catch (error) {
                    // 比分解析错误，跳过
                  }
                }
                
                // 分析盘口结果
                if (match.handicapResult) {
                  if (match.handicapResult === 'win') {
                    stats.notStartingWinPlates++;
                  } else if (match.handicapResult === 'draw') {
                    stats.notStartingDrawPlates++;
                  } else if (match.handicapResult === 'lose') {
                    stats.notStartingLosePlates++;
                  }
                }
              }
            }
            
            playersStats.push(stats);
          }
        }
      }
      
      console.log(`找到 ${playersStats.length} 名有首发记录的球员`);
      
      // 按首发数和出场数排序
      playersStats.sort((a, b) => {
        if (a.lineups !== b.lineups) {
          return b.lineups - a.lineups; // 首发数从大到小
        }
        return b.caps - a.caps; // 首发数相同则按出场数从大到小
      });
      
      // 输出结果  
      for (const stats of playersStats) {
        // 计算有效盘口数（有盘口结果的比赛）
        const validHandicapMatches = stats.notStartingWinPlates + stats.notStartingDrawPlates + stats.notStartingLosePlates;
        
        // 计算输盘率 = 1 - (赢盘率 + 走盘率)
        let losePlateRate = 0;
        if (validHandicapMatches > 0) {
          const winDrawRate = (stats.notStartingWinPlates + stats.notStartingDrawPlates) / validHandicapMatches;
          losePlateRate = Math.round((1 - winDrawRate) * 100);
        }
        
        // 输出球员不首发时的统计数据，按照示例格式
        const outputLine = `${stats.number}-${stats.name}，${stats.caps}场${stats.lineups}首发，` + 
                         `没有首发时球队${stats.notStartingWins}胜${stats.notStartingDraws}平${stats.notStartingLosses}负，` + 
                         `输盘率${losePlateRate}%`;
        
        console.log(outputLine);
      }
      
    } catch (error) {
      console.error(`分析球队数据失败:`, error);
    }
  }

  /**
   * 分析指定球队数据
   */
  analyzeTargetTeam() {
    const files = this.getPlayerFiles();
    
    if (files.length === 0) {
      console.log('没有找到球员数据文件');
      return;
    }
    
    console.log(`找到 ${files.length} 个球队数据文件，开始分析...`);
    
    for (const file of files) {
      const filePath = path.join(this.playerCenterDir, file);
      this.analyzeTeam(filePath);
    }
    
    console.log('\n分析完成');
  }
}

// 运行分析器
try {
  console.log('开始运行分析器');
  const analyzer = new PlayerAnalyzer();
  analyzer.analyzeTargetTeam();
  console.log('分析器运行完成');
} catch (error) {
  console.error('主程序异常:', error);
} 