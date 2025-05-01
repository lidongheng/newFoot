/**
 * find_non_starter_matches_test.js
 * 查找科尔威尔（6号）没有首发的比赛
 */

const fs = require('fs');
const path = require('path');
const ClubAnalyzer = require('./crawlerClub3_new');
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

// 测试配置
const config = {
  leagueId: 's36', // 英超
  serial: 24,      // 切尔西
  isNation: false,
  roundSerial: 38  // 当前轮次
};

async function runTest() {
  console.log('开始查找科尔威尔没有首发的比赛...');
  
  try {
    // 1. 读取联赛数据
    const analyzer = new ClubAnalyzer(config);
    const leagueData = await analyzer.readLeagueData();
    
    // 2. 获取所有比赛
    const matchArr = [];
    
    // 查找已完成的比赛（状态为-1）
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
            matchArr.push({
              id: match[0],
              round: roundNumber,
              date: match[3],
              homeTeam: match[4],
              awayTeam: match[5],
              score: match[6]
            });
          }
        }
      }
    }
    
    console.log(`找到 ${matchArr.length} 场切尔西参与的比赛`);
    
    // 3. 分析每场比赛，找出科尔威尔没有首发的
    const nonStarterMatches = [];
    let totalMatches = 0;
    let starterMatches = 0;
    let subMatches = 0;
    let notPlayedMatches = 0;
    
    for (let i = 0; i < matchArr.length; i++) {
      const match = matchArr[i];
      console.log(`分析比赛 [${i+1}/${matchArr.length}]: 轮次${match.round}, 比分${match.score}`);
      
      try {
        // 获取比赛数据
        const matchData = await fetchMatchData(match.id);
        
        // 检查科尔威尔是否参与此场比赛
        totalMatches++;
        
        const status = matchData.status;
        const playerList = matchData.players || [];
        
        // 查找科尔威尔（6号球员）
        const isStarter = playerList.some(p => 
          p.number === 6 && p.isStarter === true && 
          (p.name.includes('科尔威尔') || p.name.includes('Colwill'))
        );
        
        const isSubstitute = playerList.some(p => 
          p.number === 6 && p.isStarter === false && 
          (p.name.includes('科尔威尔') || p.name.includes('Colwill'))
        );
        
        if (isStarter) {
          starterMatches++;
          console.log(`  ✓ 科尔威尔首发出场`);
        } else if (isSubstitute) {
          subMatches++;
          console.log(`  ! 科尔威尔替补出场`);
          nonStarterMatches.push({
            ...match,
            status,
            type: '替补'
          });
        } else {
          notPlayedMatches++;
          console.log(`  × 科尔威尔未参与此场比赛`);
          nonStarterMatches.push({
            ...match,
            status,
            type: '未上场'
          });
        }
        
      } catch (error) {
        console.error(`分析比赛 ${match.id} 失败: ${error.message}`);
        nonStarterMatches.push({
          ...match,
          error: error.message,
          type: '分析失败'
        });
      }
      
      // 添加延迟以避免请求过于频繁
      if (i < matchArr.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 4. 输出结果
    console.log('\n=== 科尔威尔出场统计 ===');
    console.log(`总比赛数: ${totalMatches} 场`);
    console.log(`首发出场: ${starterMatches} 场`);
    console.log(`替补出场: ${subMatches} 场`);
    console.log(`未参与: ${notPlayedMatches} 场`);
    console.log(`非首发比赛总计: ${nonStarterMatches.length} 场`);
    
    console.log('\n=== 科尔威尔非首发比赛详情 ===');
    nonStarterMatches.forEach((match, index) => {
      console.log(`${index+1}. 轮次${match.round} [${match.type}]: 比分${match.score}, 日期:${match.date}`);
    });
    
    // 将结果保存为JSON文件
    const outputPath = path.resolve(__dirname, 'non_starter_matches.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      summary: {
        totalMatches,
        starterMatches,
        subMatches,
        notPlayedMatches
      },
      nonStarterMatches
    }, null, 2), 'utf8');
    
    console.log(`\n分析结果已保存至 ${outputPath}`);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

/**
 * 爬取比赛数据
 * @param {string} matchId 比赛ID
 * @returns {Promise<Object>} 比赛数据
 */
async function fetchMatchData(matchId) {
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
    
    // 获取主队和客队信息
    const homeTeamName = $('.home a').text().trim();
    const awayTeamName = $('.guest a').text().trim();
    const homeTeamId = parseInt($('.home a').attr('href').match(/\/(\d+)\.html/)?.[1] || '0', 10);
    const awayTeamId = parseInt($('.guest a').attr('href').match(/\/(\d+)\.html/)?.[1] || '0', 10);
    
    // 判断当前球队是主队还是客队
    const status = homeTeamId === config.serial ? 'home' : 'guest';
    
    // 获取阵型
    let formation = '';
    if ($('.content .title .homeN').html()) {
      formation = $(`.content .title .${status}N`).text().trim();
      // 提取阵型数字部分 4-2-3-1 => 4231
      formation = formation.replace(/[^0-9-]/g, '').replace(/-/g, '');
    } else {
      formation = $(`#matchBox2>.teamNames .${status}`).text().trim();
      formation = formation.replace(/[^0-9-]/g, '').replace(/-/g, '');
    }

    // 获取球员数据
    const players = [];
    
    // 解析首发球员
    $(`#matchBox2 .plays .${status} .playBox .play`).each((index, element) => {
      const isNewFormat = $('.content .title .homeN').html() ? true : false;
      
      // 获取球员号码和姓名
      let playerNumber = 0;
      let playerName = '';
      
      // 优先从span i元素获取号码
      const numberElement = $(element).find('span i').first();
      if (numberElement.length > 0) {
        playerNumber = parseInt(numberElement.text().trim() || '0', 10);
      } else if (isNewFormat) {
        // 如果没有找到span i元素，尝试从.headicon .num获取（旧方式）
        const number = $(element).find('.headicon .num').text().trim();
        if (number) {
          playerNumber = parseInt(number || '0', 10);
        }
      }
      
      // 获取球员姓名
      const nameElement = $(element).find('.name a').first();
      if (nameElement.length > 0) {
        playerName = nameElement.text().trim();
      }
      
      // 提取事件（这里简化处理）
      const events = extractPlayerEvents($, element);
      
      players.push({
        name: playerName,
        number: playerNumber,
        isStarter: true,
        substitutedIn: events.substitutedIn,
        substitutedOut: events.substitutedOut
      });
    });
    
    // 解析替补球员
    $(`#matchBox2 .backupPlay .${status} .play`).each((index, element) => {
      // 获取球员号码和姓名
      const number = parseInt($(element).find('.name i').text().trim() || '0', 10);
      const name = $(element).find('.name a').text().trim();
      
      // 提取事件
      const events = extractPlayerEvents($, element);
      
      players.push({
        name: name,
        number: number,
        isStarter: false,
        substitutedIn: events.substitutedIn,
        substitutedOut: events.substitutedOut
      });
    });
    
    return {
      id: matchId,
      status,
      formation,
      players
    };
    
  } catch (error) {
    console.error(`爬取比赛 ${matchId} 数据失败: ${error.message}`);
    throw error;
  }
}

/**
 * 提取球员事件信息
 * @param {Object} $ cheerio实例
 * @param {Object} element 球员元素
 * @returns {Object} 事件数据
 */
function extractPlayerEvents($, element) {
  const events = {
    goals: 0,
    assists: 0,
    substitutedIn: false,
    substitutedOut: false,
    yellowCards: 0,
    redCards: 0
  };
  
  // 解析事件图标
  $(element).find('.eventicon img, #playerTech_\\d+ img').each((i, img) => {
    const title = $(img).attr('title') || '';
    const alt = $(img).attr('alt') || '';
    const src = $(img).attr('src') || '';
    
    // 根据图片src或title/alt判断事件类型
    if (src.includes('1.png') || title.includes('入球') || alt.includes('入球')) {
      events.goals++;
    } else if (src.includes('12.png') || title.includes('助攻') || alt.includes('助攻')) {
      events.assists++;
    } else if (src.includes('4.png') || title.includes('换入') || alt.includes('换入')) {
      events.substitutedIn = true;
    } else if (src.includes('5.png') || title.includes('换出') || alt.includes('换出')) {
      events.substitutedOut = true;
    } else if (src.includes('3.png') || title.includes('黄牌') || alt.includes('黄牌')) {
      events.yellowCards++;
    } else if (src.includes('2.png') || title.includes('红牌') || alt.includes('红牌')) {
      events.redCards++;
    }
  });
  
  return events;
}

// 运行测试
runTest(); 