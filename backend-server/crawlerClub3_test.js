/**
 * crawlerClub3_test.js
 * 测试爬取球员球衣号码
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 从example2.html文件加载HTML进行解析测试
const html = fs.readFileSync(path.resolve(__dirname, 'example2.html'), 'utf8');
const $ = cheerio.load(html);

// 测试函数 - 解析首发球员
function testParseStarterPlayers() {
  console.log('测试解析首发球员：');
  
  const status = 'home'; // 测试主队
  const players = [];
  
  // 检查DOM结构
  console.log(`首发球员数量: ${$(`#matchBox2 .plays .${status} .playBox .play`).length}`);
  
  // 使用旧方法解析首发球员
  $(`#matchBox2 .plays .${status} .playBox .play`).each((index, element) => {
    const isNewFormat = $('.content .title .homeN').html() ? true : false;
    console.log(`isNewFormat: ${isNewFormat}`);
    
    // 旧方法获取球员号码和姓名
    let oldNumberAndName = '';
    try {
      if (isNewFormat) {
        const number = $(element).find('.headicon .num').text().trim();
        const name = $(element).find('.name a').text().trim();
        oldNumberAndName = `${number} ${name}`;
      } else {
        oldNumberAndName = $(element).find('.name a').text().trim();
      }
    } catch (err) {
      oldNumberAndName = $(element).find('.name a').text().trim();
    }
    
    console.log(`旧方法解析: ${oldNumberAndName}`);
    console.log(`旧方法提取号码: ${parseInt(oldNumberAndName.match(/^\d+/) || ['0'], 10)}`);
    
    // 新方法获取球员号码和姓名
    let playerNumber = 0;
    let playerName = '';
    
    // 查找带有号码的span元素（使用i标签）
    const numberElement = $(element).find('span i').first();
    if (numberElement.length > 0) {
      playerNumber = parseInt(numberElement.text().trim() || '0', 10);
    }
    
    // 查找带有姓名的a标签
    const nameElement = $(element).find('.name a').first();
    if (nameElement.length > 0) {
      playerName = nameElement.text().trim();
    }
    
    console.log(`新方法解析: 号码=${playerNumber}, 姓名=${playerName}`);
    
    players.push({
      index,
      oldNumberAndName,
      oldNumber: parseInt(oldNumberAndName.match(/^\d+/) || ['0'], 10),
      newNumber: playerNumber,
      name: playerName
    });
  });
  
  return players;
}

// 测试函数 - 解析替补球员
function testParseSubstitutePlayers() {
  console.log('\n测试解析替补球员：');
  
  const status = 'home'; // 测试主队
  const substitutes = [];
  
  // 检查DOM结构
  console.log(`替补球员数量: ${$(`#matchBox2 .backupPlay .${status} .play`).length}`);
  
  // 使用旧方法解析替补球员
  $(`#matchBox2 .backupPlay .${status} .play`).each((index, element) => {
    // 旧方法获取球员号码和姓名
    const oldNumber = parseInt($(element).find('.name i').text().trim() || '0', 10);
    const oldName = $(element).find('.name a').text().trim();
    
    console.log(`旧方法解析: 号码=${oldNumber}, 姓名=${oldName}`);
    
    // 新方法获取球员号码和姓名
    let playerNumber = 0;
    let playerName = '';
    
    // 查找带有号码的i标签
    const numberElement = $(element).find('.name i').first();
    if (numberElement.length > 0) {
      playerNumber = parseInt(numberElement.text().trim() || '0', 10);
    }
    
    // 查找带有姓名的a标签
    const nameElement = $(element).find('.name a').first();
    if (nameElement.length > 0) {
      playerName = nameElement.text().trim();
    }
    
    console.log(`新方法解析: 号码=${playerNumber}, 姓名=${playerName}`);
    
    substitutes.push({
      index,
      oldNumber,
      oldName,
      newNumber: playerNumber,
      name: playerName
    });
  });
  
  return substitutes;
}

// 运行测试
console.log("=== 开始测试球员解析 ===");
const starters = testParseStarterPlayers();
const substitutes = testParseSubstitutePlayers();

console.log("\n=== 测试结果摘要 ===");
console.log(`首发球员: ${starters.length}`);
console.log(`替补球员: ${substitutes.length}`);

// 检查号码是否正确解析
const numberIssues = starters.filter(p => p.oldNumber !== p.newNumber);
if (numberIssues.length > 0) {
  console.log("\n首发球员号码解析问题:");
  numberIssues.forEach(p => {
    console.log(`  球员: ${p.name}, 旧号码: ${p.oldNumber}, 新号码: ${p.newNumber}`);
  });
}

// 测试完成
console.log("\n测试完成！"); 