/**
 * check_specific_matches.js
 * 专门检查第18轮和第27轮比赛中科尔威尔的进球和助攻数据
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

// 配置参数
const TEAM_ID = 24; // 切尔西
const PLAYER_NUMBER = 6; // 科尔威尔的球衣号码
const PLAYER_NAME = '科尔威尔';

// 指定要检查的比赛ID
const MATCHES_TO_CHECK = {
  '2591071': '第18轮比赛', // 第18轮
  '2591165': '第27轮比赛'  // 第27轮
};

/**
 * 深入分析比赛页面HTML获取详细信息
 */
async function analyzeMatchDetail(matchId, description) {
  console.log(`\n========= 分析${description} (ID: ${matchId}) =========`);
  
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
    
    // 获取比赛基本信息
    const homeTeamName = $('.home a').text().trim();
    const awayTeamName = $('.guest a').text().trim();
    const homeTeamId = parseInt($('.home a').attr('href').match(/\/(\d+)\.html/)?.[1] || '0', 10);
    const awayTeamId = parseInt($('.guest a').attr('href').match(/\/(\d+)\.html/)?.[1] || '0', 10);
    const score = $('.vs').text().trim();
    const status = homeTeamId === TEAM_ID ? 'home' : 'guest';
    
    console.log(`比赛: ${homeTeamName} ${score} ${awayTeamName}`);
    console.log(`切尔西是: ${status === 'home' ? '主队' : '客队'}`);
    
    // 1. 检查比赛事件表 - 查找所有进球和助攻
    console.log(`\n1. 分析比赛事件表`);
    
    // 检查HTML中的游戏事件部分
    const gameEvents = [];
    
    $('.gameEvents .goal, .gameEvents .eventItem').each((i, element) => {
      const eventHtml = $(element).html();
      const eventText = $(element).text().trim();
      
      if (eventText.includes('科尔威尔') || eventText.includes('Colwill')) {
        console.log(`找到科尔威尔相关事件: ${eventText}`);
        console.log(`事件HTML: ${eventHtml}`);
        
        // 提取详细信息
        const time = $(element).find('.time').text().trim();
        const homePlayer = $(element).find('.left .name a').text().trim();
        const awayPlayer = $(element).find('.right .name a').text().trim();
        const homeAssist = $(element).find('.left .assist').text().trim();
        const awayAssist = $(element).find('.right .assist').text().trim();
        
        gameEvents.push({
          type: $(element).hasClass('goal') ? '进球' : '事件',
          time,
          homePlayer,
          awayPlayer,
          homeAssist,
          awayAssist,
          hasKolwill: eventText.includes('科尔威尔') || eventText.includes('Colwill')
        });
      }
    });
    
    // 2. 查找所有进球和助攻事件
    console.log(`\n2. 查找所有进球和助攻事件...`);
    
    $('.goalTable tr').each((i, element) => {
      const trText = $(element).text().trim();
      
      if (i > 0 && trText) { // 跳过表头
        const cols = $(element).find('td');
        
        if (cols.length >= 3) {
          const time = $(cols[0]).text().trim();
          const scoreChange = $(cols[1]).text().trim();
          const scorer = $(cols[2]).text().trim();
          
          console.log(`进球事件: ${time} ${scoreChange} ${scorer}`);
          
          if (scorer.includes('科尔威尔') || scorer.includes('Colwill')) {
            console.log(`科尔威尔进球 (${time})`);
          }
          
          // 检查是否有助攻信息
          if (scorer.includes('助攻')) {
            const parts = scorer.split('助攻');
            const goalScorer = parts[0].trim();
            const assistant = parts[1].replace('：', '').trim();
            
            console.log(`进球者: ${goalScorer}, 助攻者: ${assistant}`);
            
            if (assistant.includes('科尔威尔') || assistant.includes('Colwill')) {
              console.log(`科尔威尔助攻 (${time})`);
            }
          }
        }
      }
    });
    
    // 3. 检查HTML中的比赛事件部分
    console.log(`\n3. 检查HTML中的比赛事件部分...`);
    
    $('#matchTable tbody tr').each((i, element) => {
      const eventText = $(element).text().trim();
      
      if (eventText.includes('科尔威尔') || eventText.includes('Colwill')) {
        console.log(`事件 ${i+1}: ${eventText}`);
        
        // 检查事件类型
        const eventType = $(element).find('td:first-child').text().trim();
        const eventDetail = $(element).find('td:nth-child(2)').text().trim();
        
        console.log(`  类型: ${eventType}`);
        console.log(`  详情: ${eventDetail}`);
        
        // 检查是否是进球或助攻
        if (eventType.includes('进球') || eventDetail.includes('进球')) {
          console.log(`  可能是进球事件`);
        }
        
        if (eventType.includes('助攻') || eventDetail.includes('助攻')) {
          console.log(`  可能是助攻事件`);
        }
      }
    });
    
    // 4. 查找进球图标
    console.log(`\n4. 查找所有进球图标...`);
    
    $('img[src*="1.png"], img[title*="入球"], img[alt*="入球"]').each((i, element) => {
      const parent = $(element).parent();
      const parentHtml = parent.html();
      const parentText = parent.text().trim();
      
      console.log(`进球图标 ${i+1}:`);
      console.log(`  src: ${$(element).attr('src')}`);
      console.log(`  title: ${$(element).attr('title')}`);
      console.log(`  alt: ${$(element).attr('alt')}`);
      console.log(`  父元素: ${parentHtml}`);
      console.log(`  父元素文本: ${parentText}`);
      
      // 查找科尔威尔是否在周围文本中
      if (parentText.includes('科尔威尔') || parentText.includes('Colwill')) {
        console.log(`  科尔威尔相关进球!`);
      }
    });
    
    // 5. 查找助攻图标
    console.log(`\n5. 查找所有助攻图标...`);
    
    $('img[src*="12.png"], img[title*="助攻"], img[alt*="助攻"]').each((i, element) => {
      const parent = $(element).parent();
      const parentHtml = parent.html();
      const parentText = parent.text().trim();
      
      console.log(`助攻图标 ${i+1}:`);
      console.log(`  src: ${$(element).attr('src')}`);
      console.log(`  title: ${$(element).attr('title')}`);
      console.log(`  alt: ${$(element).attr('alt')}`);
      console.log(`  父元素: ${parentHtml}`);
      console.log(`  父元素文本: ${parentText}`);
      
      // 查找科尔威尔是否在周围文本中
      if (parentText.includes('科尔威尔') || parentText.includes('Colwill')) {
        console.log(`  科尔威尔相关助攻!`);
      }
    });
    
    // 6. 检查首发和替补球员
    console.log(`\n6. 检查首发和替补球员...`);
    
    // 在首发中查找科尔威尔
    let kolwillFoundInStarters = false;
    $(`#matchBox2 .plays .${status} .play`).each((i, element) => {
      const playerName = $(element).find('.name a').text().trim();
      const playerNumber = parseInt($(element).find('span i').text().trim() || '0', 10);
      
      if (playerNumber === PLAYER_NUMBER || playerName.includes('科尔威尔') || playerName.includes('Colwill')) {
        kolwillFoundInStarters = true;
        console.log(`科尔威尔在首发阵容中: ${playerName}, 号码: ${playerNumber}`);
        
        // 查找进球和助攻图标
        console.log(`  检查科尔威尔的事件图标:`);
        $(element).find('img').each((j, img) => {
          console.log(`  图标 ${j+1}:`);
          console.log(`    src: ${$(img).attr('src')}`);
          console.log(`    title: ${$(img).attr('title')}`);
          console.log(`    alt: ${$(img).attr('alt')}`);
          
          // 检查是否为进球或助攻图标
          const src = $(img).attr('src') || '';
          const title = $(img).attr('title') || '';
          const alt = $(img).attr('alt') || '';
          
          if (src.includes('1.png') || title.includes('入球') || alt.includes('入球')) {
            console.log(`    这是进球图标!`);
          }
          
          if (src.includes('12.png') || title.includes('助攻') || alt.includes('助攻')) {
            console.log(`    这是助攻图标!`);
          }
        });
      }
    });
    
    // 在替补中查找科尔威尔
    if (!kolwillFoundInStarters) {
      $(`#matchBox2 .backupPlay .${status} .play`).each((i, element) => {
        const playerName = $(element).find('.name a').text().trim();
        const playerNumber = parseInt($(element).find('.name i').text().trim() || '0', 10);
        
        if (playerNumber === PLAYER_NUMBER || playerName.includes('科尔威尔') || playerName.includes('Colwill')) {
          console.log(`科尔威尔在替补阵容中: ${playerName}, 号码: ${playerNumber}`);
          
          // 查找进球和助攻图标
          console.log(`  检查科尔威尔的事件图标:`);
          $(element).find('img').each((j, img) => {
            console.log(`  图标 ${j+1}:`);
            console.log(`    src: ${$(img).attr('src')}`);
            console.log(`    title: ${$(img).attr('title')}`);
            console.log(`    alt: ${$(img).attr('alt')}`);
            
            // 检查是否为进球或助攻图标
            const src = $(img).attr('src') || '';
            const title = $(img).attr('title') || '';
            const alt = $(img).attr('alt') || '';
            
            if (src.includes('1.png') || title.includes('入球') || alt.includes('入球')) {
              console.log(`    这是进球图标!`);
            }
            
            if (src.includes('12.png') || title.includes('助攻') || alt.includes('助攻')) {
              console.log(`    这是助攻图标!`);
            }
          });
        }
      });
    }
    
    // 7. 检查完整的球员统计表
    console.log(`\n7. 检查球员统计表...`);
    
    $('.vs_table tbody tr').each((i, element) => {
      const playerName = $(element).find('td:first-child').text().trim();
      
      if (playerName.includes('科尔威尔') || playerName.includes('Colwill')) {
        console.log(`科尔威尔统计数据: ${playerName}`);
        
        // 收集所有统计列
        const stats = [];
        $(element).find('td').each((j, td) => {
          stats.push($(td).text().trim());
        });
        
        console.log(`  完整统计: ${stats.join(' | ')}`);
      }
    });
    
    // 保存完整HTML以供进一步分析
    const outputDir = path.resolve(__dirname, 'match_html_special');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filePath = path.join(outputDir, `match_${matchId}.html`);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`\nHTML已保存至 ${filePath} 以供进一步分析`);
    
    // 提取比赛中的进球和助攻事件
    const kolwillGoals = gameEvents.filter(event => 
      event.type === '进球' && 
      ((status === 'home' && event.homePlayer.includes('科尔威尔')) || 
       (status === 'away' && event.awayPlayer.includes('科尔威尔')))
    ).length;
    
    const kolwillAssists = gameEvents.filter(event => 
      event.type === '进球' && 
      ((status === 'home' && event.homeAssist.includes('科尔威尔')) || 
       (status === 'away' && event.awayAssist.includes('科尔威尔')))
    ).length;
    
    // 手动检查全部HTML中的进球和助攻文本
    const htmlLower = html.toLowerCase();
    const kolwillLower = '科尔威尔'.toLowerCase();
    const colwillLower = 'colwill'.toLowerCase();
    
    // 检查进球
    const goalTexts = [];
    let goalIndex = htmlLower.indexOf('进球');
    while (goalIndex !== -1) {
      const startContext = Math.max(0, goalIndex - 50);
      const endContext = Math.min(htmlLower.length, goalIndex + 50);
      const context = html.substring(startContext, endContext);
      
      if (context.toLowerCase().includes(kolwillLower) || context.toLowerCase().includes(colwillLower)) {
        goalTexts.push(context);
      }
      
      goalIndex = htmlLower.indexOf('进球', goalIndex + 1);
    }
    
    // 检查助攻
    const assistTexts = [];
    let assistIndex = htmlLower.indexOf('助攻');
    while (assistIndex !== -1) {
      const startContext = Math.max(0, assistIndex - 50);
      const endContext = Math.min(htmlLower.length, assistIndex + 50);
      const context = html.substring(startContext, endContext);
      
      if (context.toLowerCase().includes(kolwillLower) || context.toLowerCase().includes(colwillLower)) {
        assistTexts.push(context);
      }
      
      assistIndex = htmlLower.indexOf('助攻', assistIndex + 1);
    }
    
    console.log(`\n科尔威尔相关进球文本 (${goalTexts.length}):`);
    goalTexts.forEach((text, i) => console.log(`${i+1}: ${text}`));
    
    console.log(`\n科尔威尔相关助攻文本 (${assistTexts.length}):`);
    assistTexts.forEach((text, i) => console.log(`${i+1}: ${text}`));
    
    return {
      matchId,
      description,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      score,
      kolwillGoals,
      kolwillAssists,
      gameEvents,
      goalTexts,
      assistTexts
    };
    
  } catch (error) {
    console.error(`分析比赛 ${matchId} 失败: ${error.message}`);
    return {
      matchId,
      description,
      error: true,
      errorMessage: error.message
    };
  }
}

/**
 * 运行主函数
 */
async function main() {
  console.log('开始分析特定比赛中的科尔威尔进球和助攻数据...');
  
  const results = [];
  
  // 分析指定的比赛
  for (const [matchId, description] of Object.entries(MATCHES_TO_CHECK)) {
    const result = await analyzeMatchDetail(matchId, description);
    results.push(result);
    
    // 添加延迟以避免对服务器造成压力
    if (Object.keys(MATCHES_TO_CHECK).length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 保存分析结果
  const outputPath = path.resolve(__dirname, 'kolwill_special_matches.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n分析结果已保存至 ${outputPath}`);
  
  console.log('\n分析完成!');
}

// 执行主函数
main().catch(error => {
  console.error('分析失败:', error);
  process.exit(1);
}); 