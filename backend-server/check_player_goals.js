/**
 * check_player_goals.js
 * 检查科尔威尔的进球和助攻数据统计问题
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const ClubAnalyzer = require('./crawlerClub3_new');

// 配置参数
const TEAM_ID = 24; // 切尔西
const PLAYER_NUMBER = 6; // 科尔威尔的球衣号码

// 从网页直接提取球员事件（进球、助攻等）
async function extractPlayerEventsFromMatch(matchId) {
  try {
    const url = `http://bf.titan007.com/detail/${matchId}cn.htm`;
    
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
        'Referer': 'http://bf.titan007.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'max-age=0'
      }
    });
    
    const html = iconv.decode(response.data, 'utf-8'); 
    const $ = cheerio.load(html);

    // 检查是否主队或客队
    const homeTeamId = parseInt($('.home a').attr('href').match(/\/(\d+)\.html/)?.[1] || '0', 10);
    const status = homeTeamId === TEAM_ID ? 'home' : 'guest';
    
    // 获取科尔威尔的元素（首发和替补都检查）
    let kolwillElement = null;
    
    // 检查首发球员
    $(`#matchBox2 .plays .${status} .playBox .play`).each((index, element) => {
      const nameElement = $(element).find('.name a').first();
      const numberElement = $(element).find('span i').first();
      
      // 检查是否是科尔威尔
      if (nameElement.length > 0 && numberElement.length > 0) {
        const name = nameElement.text().trim();
        const number = parseInt(numberElement.text().trim() || '0', 10);
        
        if (number === PLAYER_NUMBER || name.includes('科尔威尔') || name.includes('Colwill')) {
          kolwillElement = element;
          console.log(`找到科尔威尔(首发): ${name}, 号码: ${number}`);
        }
      }
    });
    
    // 检查替补球员
    if (!kolwillElement) {
      $(`#matchBox2 .backupPlay .${status} .play`).each((index, element) => {
        const nameElement = $(element).find('.name a').first();
        const numberElement = $(element).find('.name i').first();
        
        // 检查是否是科尔威尔
        if (nameElement.length > 0 && numberElement.length > 0) {
          const name = nameElement.text().trim();
          const number = parseInt(numberElement.text().trim() || '0', 10);
          
          if (number === PLAYER_NUMBER || name.includes('科尔威尔') || name.includes('Colwill')) {
            kolwillElement = element;
            console.log(`找到科尔威尔(替补): ${name}, 号码: ${number}`);
          }
        }
      });
    }
    
    // 科尔威尔不在本场比赛中
    if (!kolwillElement) {
      console.log(`科尔威尔未参与比赛 ${matchId}`);
      return { goals: 0, assists: 0, participated: false };
    }
    
    // 提取科尔威尔的事件数据（进球、助攻等）
    const events = {
      goals: 0,
      assists: 0,
      participated: true
    };
    
    // 详细解析事件图标
    console.log(`开始解析科尔威尔事件数据...`);
    $(kolwillElement).find('.eventicon img, #playerTech_\\d+ img').each((i, img) => {
      const title = $(img).attr('title') || '';
      const alt = $(img).attr('alt') || '';
      const src = $(img).attr('src') || '';
      
      // 输出所有事件图片的详细信息
      console.log(`事件图片 ${i+1}:`);
      console.log(`  title: ${title}`);
      console.log(`  alt: ${alt}`);
      console.log(`  src: ${src}`);
      
      // 根据图片src或title/alt判断事件类型
      if (src.includes('1.png') || title.includes('入球') || alt.includes('入球')) {
        events.goals++;
        console.log(`  检测到进球事件`);
      } else if (src.includes('12.png') || title.includes('助攻') || alt.includes('助攻')) {
        events.assists++;
        console.log(`  检测到助攻事件`);
      }
    });
    
    console.log(`科尔威尔在比赛 ${matchId} 中: 进球 ${events.goals}, 助攻 ${events.assists}`);
    return events;
    
  } catch (error) {
    console.error(`获取比赛 ${matchId} 数据失败: ${error.message}`);
    return { goals: 0, assists: 0, participated: false, error: true };
  }
}

// 主函数：检查科尔威尔在所有比赛中的进球和助攻数据
async function checkPlayerGoalsAndAssists() {
  console.log('开始检查科尔威尔的进球和助攻数据...');
  
  try {
    // 初始化数据
    const analyzer = new ClubAnalyzer({
      leagueId: 's36',
      serial: TEAM_ID,
      isNation: false,
      roundSerial: 38
    });
    
    // 读取联赛数据
    const leagueData = await analyzer.readLeagueData();
    
    // 确定要分析的比赛
    const matchesToAnalyze = analyzer.determineMatchesToAnalyze(leagueData);
    console.log(`找到 ${matchesToAnalyze.length} 场比赛需要分析`);
    
    // 统计总数
    let totalGoals = 0;
    let totalAssists = 0;
    const matchesWithGoals = [];
    const matchesWithAssists = [];
    
    // 检查所有比赛
    for (let i = 0; i < matchesToAnalyze.length; i++) {
      const matchId = matchesToAnalyze[i];
      console.log(`\n检查比赛 ${i + 1}/${matchesToAnalyze.length}: ${matchId}`);
      
      // 直接从网页提取科尔威尔的事件数据
      const events = await extractPlayerEventsFromMatch(matchId);
      
      if (events.participated) {
        totalGoals += events.goals;
        totalAssists += events.assists;
        
        if (events.goals > 0) {
          matchesWithGoals.push({ matchId, goals: events.goals });
        }
        
        if (events.assists > 0) {
          matchesWithAssists.push({ matchId, assists: events.assists });
        }
      }
      
      // 添加延迟避免过于频繁的请求
      if (i < matchesToAnalyze.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 输出最终统计结果
    console.log('\n=== 科尔威尔进球和助攻数据统计 ===');
    console.log(`总进球数: ${totalGoals}`);
    console.log(`总助攻数: ${totalAssists}`);
    
    if (matchesWithGoals.length > 0) {
      console.log('\n有进球的比赛:');
      matchesWithGoals.forEach(match => {
        console.log(`  比赛ID: ${match.matchId}, 进球数: ${match.goals}`);
      });
    }
    
    if (matchesWithAssists.length > 0) {
      console.log('\n有助攻的比赛:');
      matchesWithAssists.forEach(match => {
        console.log(`  比赛ID: ${match.matchId}, 助攻数: ${match.assists}`);
      });
    }
    
    // 保存结果
    const results = {
      player: {
        name: '科尔威尔',
        number: PLAYER_NUMBER
      },
      statistics: {
        totalGoals,
        totalAssists,
        matchesWithGoals,
        matchesWithAssists
      }
    };
    
    const outputPath = path.resolve(__dirname, 'kolwill_goals_stats.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n结果已保存至 ${outputPath}`);
    
    // 返回结果
    return results;
    
  } catch (error) {
    console.error('检查过程中发生错误:', error);
    throw error;
  }
}

// 执行检查
checkPlayerGoalsAndAssists()
  .then(results => {
    console.log('\n检查完成!');
  })
  .catch(error => {
    console.error('检查失败:', error);
    process.exit(1);
  }); 