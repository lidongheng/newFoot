/**
 * crawlerClub3_enhanced_test.js
 * 增强版测试 - 检查是否有比赛被重复计算或遗漏
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

/**
 * 检查球员统计数据和比赛记录是否一致
 */
async function checkMatchesConsistency() {
  console.log('开始检查球员统计数据和比赛记录的一致性...');
  
  try {
    // 1. 读取联赛数据
    const analyzer = new ClubAnalyzer(config);
    const leagueData = await analyzer.readLeagueData();
    
    // 2. 手动统计科尔威尔参与的比赛
    const matches = {};
    let totalCountedMatches = 0;
    
    // 收集所有本队比赛
    for (const roundKey in leagueData.matches) {
      const roundNumber = parseInt(roundKey.replace('R_', ''), 10);
      
      if (config.roundSerial && roundNumber >= config.roundSerial) {
        continue; // 跳过未开始的轮次
      }
      
      const roundMatches = leagueData.matches[roundKey];
      
      if (Array.isArray(roundMatches)) {
        for (const match of roundMatches) {
          // 检查比赛是否已完成且包含切尔西
          if (match[2] === -1 && (match[4] === config.serial || match[5] === config.serial)) {
            const matchId = match[0];
            const homeTeam = match[4];
            const awayTeam = match[5];
            const score = match[6];
            const date = match[3];
            
            matches[matchId] = {
              roundNumber,
              homeTeam,
              awayTeam,
              score,
              date,
              processed: false, // 标记是否已处理
              playerFound: false // 标记是否找到科尔威尔
            };
            
            totalCountedMatches++;
          }
        }
      }
    }
    
    console.log(`找到 ${totalCountedMatches} 场切尔西比赛`);
    
    // 3. 创建增强版分析器，记录每场比赛的处理情况
    const enhancedAnalyzer = new ClubAnalyzer(config);
    
    // 保存原始方法
    const originalProcessMatchPlayerData = enhancedAnalyzer.processMatchPlayerData;
    
    // 添加计数器
    enhancedAnalyzer.processedMatches = new Set();
    enhancedAnalyzer.playerMatches = {
      starter: new Set(),
      substitute: new Set(),
      notPlayed: new Set()
    };
    
    // 重写处理方法
    enhancedAnalyzer.processMatchPlayerData = function(matchData) {
      const matchId = matchData.id;
      this.processedMatches.add(matchId);
      
      if (matches[matchId]) {
        matches[matchId].processed = true;
      }
      
      // 查找科尔威尔
      const kolwillFound = matchData.players.some(p => 
        p.number === 6 && (p.name.includes('科尔威尔') || p.name.includes('Colwill'))
      );
      
      const kolwillStarter = matchData.players.some(p => 
        p.number === 6 && p.isStarter && (p.name.includes('科尔威尔') || p.name.includes('Colwill'))
      );
      
      const kolwillSubstitute = matchData.players.some(p => 
        p.number === 6 && !p.isStarter && (p.name.includes('科尔威尔') || p.name.includes('Colwill'))
      );
      
      if (kolwillFound) {
        if (matches[matchId]) {
          matches[matchId].playerFound = true;
        }
        
        if (kolwillStarter) {
          this.playerMatches.starter.add(matchId);
        } else if (kolwillSubstitute) {
          this.playerMatches.substitute.add(matchId);
        }
      } else if (matches[matchId]) {
        this.playerMatches.notPlayed.add(matchId);
      }
      
      // 调用原始方法
      return originalProcessMatchPlayerData.call(this, matchData);
    };
    
    // 4. 执行分析
    // 保存原始方法
    const originalAnalyze = enhancedAnalyzer.analyze;
    
    // 重写分析方法以避免实际保存结果
    enhancedAnalyzer.analyze = async function() {
      try {
        // 1. 读取联赛数据
        const leagueData = await this.readLeagueData();
        
        // 2. 确定要分析的比赛
        const matchesToAnalyze = this.determineMatchesToAnalyze(leagueData);
        console.log(`找到 ${matchesToAnalyze.length} 场比赛需要分析`);
        
        if (matchesToAnalyze.length === 0) {
          throw new Error('没有找到符合条件的比赛');
        }
        
        // 3. 获取球队现有数据
        try {
          await this.readTeamData();
        } catch (error) {
          console.warn('无法读取现有球队数据，将创建新数据');
          this.teamData = {};
        }
        
        // 4. 分析每场比赛
        this.playersData = {}; // 重置球员数据
        this.formationStats = {}; // 重置阵型统计
        
        for (let i = 0; i < matchesToAnalyze.length; i++) {
          const matchId = matchesToAnalyze[i];
          console.log(`分析比赛 ${i + 1}/${matchesToAnalyze.length}: ${matchId}`);
          
          try {
            const matchData = await this.fetchMatchData(matchId);
            this.processMatchPlayerData(matchData);
          } catch (error) {
            console.error(`分析比赛 ${matchId} 失败: ${error.message}`);
            // 继续分析下一场比赛
          }
          
          // 添加延迟以避免请求过于频繁
          if (i < matchesToAnalyze.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 缩短延迟用于测试
          }
        }
        
        // 5. 生成分析报告
        return this.generateTeamReport();
      } catch (error) {
        console.error('分析过程中发生错误:', error);
        throw error;
      }
    };
    
    // 执行分析
    const report = await enhancedAnalyzer.analyze();
    
    // 5. 检查结果
    console.log('\n=== 科尔威尔比赛数据分析 ===');
    console.log(`总共处理的比赛: ${enhancedAnalyzer.processedMatches.size}`);
    console.log(`科尔威尔首发场次: ${enhancedAnalyzer.playerMatches.starter.size}`);
    console.log(`科尔威尔替补场次: ${enhancedAnalyzer.playerMatches.substitute.size}`);
    console.log(`科尔威尔未上场比赛: ${enhancedAnalyzer.playerMatches.notPlayed.size}`);
    
    // 检查报告中的科尔威尔数据
    if (report.players['6']) {
      const player = report.players['6'];
      console.log(`\n报告中科尔威尔数据:`);
      console.log(`  名称: ${player.name}`);
      console.log(`  比赛场次: ${player.matches}`);
      console.log(`  首发场次: ${player.starts}`);
      console.log(`  替补上场: ${player.substitutedIn}`);
      console.log(`  被换下: ${player.substitutedOut}`);
    } else {
      console.log('\n报告中未找到科尔威尔数据');
    }
    
    // 检查是否有未处理的比赛
    const unprocessedMatches = Object.entries(matches)
      .filter(([id, match]) => !match.processed)
      .map(([id, match]) => ({ id, ...match }));
    
    if (unprocessedMatches.length > 0) {
      console.log(`\n发现 ${unprocessedMatches.length} 场比赛未被处理:`);
      unprocessedMatches.forEach(match => {
        console.log(`  比赛ID: ${match.id}, 轮次: ${match.roundNumber}, 比分: ${match.score}, 日期: ${match.date}`);
      });
    } else {
      console.log('\n所有比赛均被正确处理');
    }
    
    // 检查科尔威尔没有参与的比赛
    const playerNotFoundMatches = Object.entries(matches)
      .filter(([id, match]) => match.processed && !match.playerFound)
      .map(([id, match]) => ({ id, ...match }));
    
    if (playerNotFoundMatches.length > 0) {
      console.log(`\n发现 ${playerNotFoundMatches.length} 场科尔威尔未参与的比赛:`);
      playerNotFoundMatches.forEach(match => {
        console.log(`  比赛ID: ${match.id}, 轮次: ${match.roundNumber}, 比分: ${match.score}, 日期: ${match.date}`);
      });
    }
    
    // 保存比赛处理详情
    const matchesDetailsPath = path.resolve(__dirname, 'kolwill_matches_details.json');
    fs.writeFileSync(matchesDetailsPath, JSON.stringify({
      totalMatches: totalCountedMatches,
      processedMatches: enhancedAnalyzer.processedMatches.size,
      starterMatches: Array.from(enhancedAnalyzer.playerMatches.starter),
      substituteMatches: Array.from(enhancedAnalyzer.playerMatches.substitute),
      notPlayedMatches: Array.from(enhancedAnalyzer.playerMatches.notPlayed),
      matchesDetails: matches,
      unprocessedMatches,
      playerNotFoundMatches,
      playerStats: report.players['6']
    }, null, 2), 'utf8');
    
    console.log(`\n详细分析结果已保存至 ${matchesDetailsPath}`);
    
    // 分析可能的问题
    console.log('\n=== 数据问题分析 ===');
    
    const totalPlayerMatches = enhancedAnalyzer.playerMatches.starter.size + 
                              enhancedAnalyzer.playerMatches.substitute.size;
    
    if (report.players['6'] && report.players['6'].matches !== totalPlayerMatches) {
      console.log(`1. 球员匹配问题: 报告显示 ${report.players['6'].matches} 场比赛，但实际找到 ${totalPlayerMatches} 场`);
    }
    
    if (report.players['6'] && report.players['6'].starts !== enhancedAnalyzer.playerMatches.starter.size) {
      console.log(`2. 首发统计问题: 报告显示 ${report.players['6'].starts} 场首发，但实际找到 ${enhancedAnalyzer.playerMatches.starter.size} 场`);
    }
    
    if (enhancedAnalyzer.processedMatches.size !== totalCountedMatches) {
      console.log(`3. 比赛处理不完整: 应处理 ${totalCountedMatches} 场比赛，实际处理了 ${enhancedAnalyzer.processedMatches.size} 场`);
    }
    
    // 提供可能的解决方案
    console.log('\n=== 可能的解决方案 ===');
    console.log('1. 检查数据源中是否有重复的比赛ID');
    console.log('2. 确保每场比赛只处理一次');
    console.log('3. 检查球员识别逻辑，确保能正确识别所有名称变体');
    console.log('4. 考虑手动添加丢失的比赛数据');
    
    return {
      report,
      matches,
      enhancedAnalyzer
    };
    
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  }
}

// 运行检查
checkMatchesConsistency()
  .then(() => {
    console.log('\n测试完成!');
  })
  .catch(error => {
    console.error('\n测试过程中发生错误:', error);
  }); 