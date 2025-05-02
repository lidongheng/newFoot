/**
 * crawlerClub3_new.js
 * 分析球队数据，获取球员出场数、首发数、位置统计、进球数、助攻数等数据
 * 并分析球队最常用阵型和首发阵容
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

class ClubAnalyzer {
  /**
   * 初始化分析器
   * @param {Object} options 配置选项
   * @param {string} options.leagueId 联赛ID（如s36表示英超）
   * @param {number} options.serial 球队序号（如24表示切尔西）
   * @param {boolean} options.isNation 是否国家队分析
   * @param {number} options.roundSerial 准备开打的轮次
   */
  constructor(options = {}) {
    this.leagueId = options.leagueId || '36'; // 默认英超
    this.serial = options.serial || null;
    this.isNation = options.isNation || false;
    this.roundSerial = options.roundSerial || null;
    this.matchArr = []; // 比赛编号数据
    this.teamData = null; // 球队数据
    this.playersData = {}; // 球员数据
    this.formationStats = {}; // 阵型统计
    this.matchDataCache = new Map(); // 缓存已爬取的比赛数据
    this.teamChineseName = ''; // 球队中文名称
    // 亚盘数据统计
    this.asianHandicapStats = {
      total: 0,
      win: 0,
      lose: 0,
      draw: 0,
      matches: [] // 每场比赛的亚盘详情
    };
    // 大小球数据统计
    this.totalGoalsStats = {
      total: 0,
      over: 0,
      under: 0,
      draw: 0,
      matches: [] // 每场比赛的大小球详情
    };
  }

  /**
   * 读取联赛数据文件
   * @returns {Promise<Object>} 解析后的联赛数据
   */
  async readLeagueData() {
    try {
      // 根据是否为国家队决定使用哪个文件
      const filePrefix = this.isNation ? 'c' : 's';
      // 确保leagueId前缀正确
      const leagueIdWithoutPrefix = this.leagueId.replace(/^[sc]/, '');
      const filePath = path.resolve(__dirname, `match_center/${filePrefix}${leagueIdWithoutPrefix}.js`);
      
      console.log(`读取联赛数据文件: ${filePath}`);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.error(`联赛数据文件不存在: ${filePath}`);
        // 尝试列出match_center目录中的文件
        try {
          const matchCenterDir = path.resolve(__dirname, 'match_center');
          if (fs.existsSync(matchCenterDir)) {
            const files = fs.readdirSync(matchCenterDir);
            console.log(`match_center目录中的文件: ${files.join(', ')}`);
          }
        } catch (e) {
          console.error(`无法读取match_center目录: ${e.message}`);
        }
        throw new Error(`联赛数据文件不存在: ${filePath}`);
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // 创建一个安全的执行环境
      const context = {
        jh: {},
        arrTeam: []
      };
      
      // 使用Function构造函数代替eval，更安全且可控
      const executeScript = new Function('jh', 'arrTeam', fileContent);
      executeScript(context.jh, context.arrTeam);
      
      console.log(`成功读取联赛数据文件，共有 ${Object.keys(context.jh).length} 个分组/轮次`);
      console.log(`成功读取球队数据，共有 ${context.arrTeam.length} 支球队`);
      
      // 输出前几个球队数据，帮助调试
      if (context.arrTeam.length > 0) {
        console.log('球队数据示例:');
        context.arrTeam.slice(0, Math.min(5, context.arrTeam.length)).forEach(team => {
          console.log(`  ID: ${team[0]}, 名称: ${team[1]}`);
        });
      }
      
      return {
        matches: context.jh,
        teams: context.arrTeam
      };
    } catch (error) {
      console.error(`无法读取联赛数据文件: ${error.message}`);
      throw error;
    }
  }

  /**
   * 读取球队数据文件
   * @returns {Promise<Object>} 解析后的球队数据
   */
  async readTeamData() {
    try {
      if (!this.serial) {
        console.warn('球队序号未设置，使用空数组作为球队数据');
        this.teamData = [];
        return this.teamData;
      }
      
      const filePath = path.resolve(__dirname, `./player_center/${this.serial}.json`);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.warn(`球队数据文件不存在: ${filePath}，使用空数组作为球队数据`);
        this.teamData = [];
        return this.teamData;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      try {
        this.teamData = JSON.parse(fileContent);
        console.log(`成功读取球队数据，共有 ${this.teamData.length} 名球员`);
      } catch (parseError) {
        console.error(`球队数据文件JSON解析失败: ${parseError.message}，使用空数组作为球队数据`);
        this.teamData = [];
      }
      
      return this.teamData;
    } catch (error) {
      console.warn(`无法读取球队数据文件: ${error.message}，使用空数组作为球队数据`);
      this.teamData = [];
      return this.teamData;
    }
  }

  /**
   * 确定要分析的比赛
   * @param {Object} leagueData 联赛数据
   * @returns {Array} 要分析的比赛编号数组
   */
  determineMatchesToAnalyze(leagueData) {
    const matchArr = [];
    
    if (!this.isNation) {
      // 俱乐部比赛分析逻辑 - 查找已完成的比赛（状态为-1）
      for (const roundKey in leagueData.matches) {
        // 确保只分析已经比赛结束的轮次
        const roundNumber = parseInt(roundKey.replace('R_', ''), 10);
        
        if (this.roundSerial && roundNumber >= this.roundSerial) {
          continue; // 跳过未开始的轮次
        }
        
        const roundMatches = leagueData.matches[roundKey];
        
        if (Array.isArray(roundMatches)) {
          for (const match of roundMatches) {
            // 检查比赛是否已完成且包含我们要分析的球队
            if (match[2] === -1 && (match[4] === this.serial || match[5] === this.serial)) {
              // 添加亚盘数据
              let handicap = match[10] || 0; // 下标为10表示亚盘盘口
              let score = match[6] || '0-0'; // 下标为6表示比分
              // 添加大小球盘口数据
              let totalLine = match[12] || '0'; // 下标为12表示大小球盘口
              
              matchArr.push({
                status: match[4] === this.serial ? 'home' : 'guest',
                matchSerial: match[0],
                round: roundNumber,
                handicap: handicap, // 正数表示主队让球，负数表示客队让球
                score: score, // 比分，格式为"主队进球-客队进球"
                totalLine: totalLine // 大小球盘口
              });
              
              // 计算亚盘结果
              this.calculateAsianHandicap(match[4] === this.serial ? 'home' : 'guest', handicap, score);
              // 计算大小球结果
              this.calculateTotalGoals(match[4] === this.serial ? 'home' : 'guest', totalLine, score);
            }
          }
        }
      }
    } else {
      // 国家队比赛分析逻辑
      console.log("开始分析国家队比赛数据...");
      
      // 遍历所有比赛分组
      for (const groupKey in leagueData.matches) {
        console.log(`检查分组 ${groupKey} 的比赛数据`);
        const groupMatches = leagueData.matches[groupKey];
        
        if (Array.isArray(groupMatches)) {
          for (let i = 0; i < groupMatches.length; i++) {
            const match = groupMatches[i];
            // 检查比赛是否已完成且包含我们要分析的球队，且有比分
            if (match[2] === -1 && (match[4] === this.serial || match[5] === this.serial) && match[6] !== '') {
              // 添加亚盘数据
              let handicap = match[10] || 0; // 下标为10表示亚盘盘口
              let score = match[6] || '0-0'; // 下标为6表示比分
              // 添加大小球盘口数据
              let totalLine = match[12] || '0'; // 下标为12表示大小球盘口
              
              matchArr.push({
                status: match[4] === this.serial ? 'home' : 'guest',
                matchSerial: match[0],
                round: matchArr.length + 1,  // 使用自增序号作为轮次
                handicap: handicap, // 正数表示主队让球，负数表示客队让球
                score: score, // 比分，格式为"主队进球-客队进球"
                totalLine: totalLine // 大小球盘口
              });
              
              // 计算亚盘结果
              this.calculateAsianHandicap(match[4] === this.serial ? 'home' : 'guest', handicap, score);
              // 计算大小球结果
              this.calculateTotalGoals(match[4] === this.serial ? 'home' : 'guest', totalLine, score);
              
              console.log(`找到匹配的比赛: ${match[0]}, 主客场: ${match[4] === this.serial ? 'home' : 'guest'}, 比分: ${match[6]}, 亚盘盘口: ${handicap}, 大小球盘口: ${totalLine}`);
            }
          }
        }
      }
    }
    
    this.matchArr = matchArr;
    console.log(`共找到 ${matchArr.length} 场需要分析的比赛`);
    return matchArr;
  }
  
  /**
   * 计算亚盘盘口结果
   * @param {string} status 当前球队是主队还是客队 ('home' 或 'guest')
   * @param {number} handicap 亚盘盘口值 (正值表示主队让球，负值表示客队让球)
   * @param {string} score 比分，格式为"主队进球-客队进球"
   */
  calculateAsianHandicap(status, handicap, score) {
    // 默认为0-0，防止空值
    if (!score) score = '0-0';
    
    // 解析比分
    const scoreArray = score.split('-');
    const homeGoals = parseInt(scoreArray[0], 10) || 0;
    const awayGoals = parseInt(scoreArray[1], 10) || 0;
    
    // 计算盘口结果（主队进球-客队进球-主队让球）
    const result = homeGoals - awayGoals - handicap;
    
    let handicapResult;
    if (result > 0) {
      handicapResult = 'home_win'; // 主队赢盘
    } else if (result < 0) {
      handicapResult = 'away_win'; // 客队赢盘
    } else {
      handicapResult = 'draw'; // 走盘
    }
    
    // 确定当前分析的球队是赢盘还是输盘
    let teamResult;
    if (handicapResult === 'draw') {
      teamResult = 'draw'; // 走盘
    } else if ((status === 'home' && handicapResult === 'home_win') ||
               (status === 'guest' && handicapResult === 'away_win')) {
      teamResult = 'win'; // 当前分析的球队赢盘
    } else {
      teamResult = 'lose'; // 当前分析的球队输盘
    }
    
    // 更新亚盘统计数据
    this.asianHandicapStats.total++;
    this.asianHandicapStats[teamResult]++;
    
    // 保存比赛亚盘详情
    this.asianHandicapStats.matches.push({
      score: score,
      handicap: handicap,
      status: status,
      handicapResult: handicapResult,
      teamResult: teamResult
    });
  }

  /**
   * 爬取比赛数据
   * @param {Object} matchInfo 比赛信息对象，包含matchSerial和status
   * @returns {Promise<Object>} 比赛数据
   */
  async fetchMatchData(matchInfo) {
    const matchId = matchInfo.matchSerial;
    const status = matchInfo.status;
    
    // 检查缓存中是否已有该比赛数据
    if (this.matchDataCache.has(matchId)) {
      return this.matchDataCache.get(matchId);
    }
    
    const MAX_RETRIES = 3; // 最多重试3次，加上初始请求总共是4次尝试
    let retries = 0;
    let lastError = null;
    
    while (retries <= MAX_RETRIES) {
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
        
        // 如果请求成功，处理数据并返回
        const html = iconv.decode(response.data, 'utf-8'); 
        const $ = cheerio.load(html);
        
        // 获取主队和客队信息
        const homeTeamName = $('.home a').text().trim();
        const awayTeamName = $('.guest a').text().trim();
        const homeTeamId = parseInt($('.home a').attr('href').match(/\/(\d+)\.html/)?.[1] || '0', 10);
        const awayTeamId = parseInt($('.guest a').attr('href').match(/\/(\d+)\.html/)?.[1] || '0', 10);
        
        // 判断当前球队是主队还是客队 (使用传入的status)
        
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
        const positions = this.calculatePositions(formation, status === 'guest');
        
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
          
          // 获取进球、助攻和换人信息
          const events = this.extractPlayerEvents($, element, 'plays');
          
          players.push({
            name: playerName,
            number: playerNumber,
            position: positions[index] || 'Unknown',
            isStarter: true,
            goals: events.goals,
            assists: events.assists,
            substitutedIn: events.substitutedIn,
            substitutedOut: events.substitutedOut,
            yellowCards: events.yellowCards,
            redCards: events.redCards,
            caps: events.caps,
            lineups: events.lineups,
          });
        });
        
        // 解析替补球员
        $(`#matchBox2 .backupPlay .${status} .play`).each((index, element) => {
          // 获取球员号码和姓名
          const number = parseInt($(element).find('.name i').text().trim() || '0', 10);
          const name = $(element).find('.name a').text().trim();
          
          // 获取进球、助攻和换人信息
          const events = this.extractPlayerEvents($, element, 'backupPlay');
          
          players.push({
            name: name,
            number: number,
            position: 'Substitute',
            isStarter: false,
            goals: events.goals,
            assists: events.assists,
            substitutedIn: events.substitutedIn,
            substitutedOut: events.substitutedOut,
            yellowCards: events.yellowCards,
            redCards: events.redCards,
            caps: events.caps,
            lineups: events.lineups,
          });
        });
        
        // 构建比赛数据对象
        const matchData = {
          id: matchId,
          status,
          formation,
          players,
          round: matchInfo.round,
          // 添加亚盘数据和比分数据
          handicap: matchInfo.handicap || 0,
          score: matchInfo.score || '0-0',
          // 添加大小球数据
          totalLine: matchInfo.totalLine || '0'
        };
        
        // 将数据保存到缓存
        this.matchDataCache.set(matchId, matchData);
        
        return matchData;
      } catch (error) {
        lastError = error;
        console.error(`爬取比赛数据失败 (尝试 ${retries + 1}/${MAX_RETRIES + 1}): ${error.message}`);
        retries++;
        
        // 在重试前等待一段时间(增加重试等待时间)
        if (retries <= MAX_RETRIES) {
          const delayTime = 1000 * Math.pow(2, retries - 1); // 指数退避: 1秒, 2秒, 4秒
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }
      }
    }
    
    throw lastError; // 如果所有重试都失败，抛出最后一个错误
  }
  
  /**
   * 提取球员事件信息（进球、助攻、换人等）
   * @param {Object} $ cheerio实例
   * @param {Object} element 球员元素
   * @param {string} playerType 球员类型（'plays'表示首发球员，'backupPlay'表示替补球员）
   * @returns {Object} 事件数据
   */
  extractPlayerEvents($, element, playerType = 'plays') {
    const events = {
      goals: 0,
      assists: 0,
      substitutedIn: false,
      substitutedOut: false,
      yellowCards: 0,
      redCards: 0,
      caps: playerType === 'plays' ? 1 : 0,
      lineups: playerType === 'plays' ? 1 : 0
    };
    
    // 根据球员类型选择不同的选择器
    let selector;
    if (playerType === 'plays') {
      // 首发球员使用playerTech_开头的div ID
      selector = 'div[id^="playerTech_"] img';
    } else if (playerType === 'backupPlay') {
      // 替补球员使用eventicon类
      selector = '.eventicon img';
    }
    
    // 查找事件图标
    $(element).find(selector).each((i, img) => {
      const title = $(img).attr('title') || '';
      const alt = $(img).attr('alt') || '';
      const src = $(img).attr('src') || '';
      
      // 根据图片src、title或alt判断事件类型
      if (['1.png', '7.png', '8.png'].includes(src.split('/').pop())) {
        events.goals++;
      } else if (src.split('/').pop() === '12.png') {
        events.assists++;
      } else if (src.split('/').pop() === '4.png') {
        events.substitutedIn = true;
        if (playerType === 'backupPlay') {
          events.caps++;
        }
      } else if (src.split('/').pop() === '5.png') {
        events.substitutedOut = true;
      } else if (src.split('/').pop() === '3.png') {
        events.yellowCards++;
      } else if (src.split('/').pop() === '2.png') {
        events.redCards++;
      }
    });
    
    return events;
  }
  
  /**
   * 根据阵型计算球员位置
   * @param {string} formation 阵型 (例如: '4231')
   * @param {boolean} isReversed 是否需要反转位置顺序（客队需要）
   * @returns {Array<string>} 位置数组
   */
  calculatePositions(formation, isReversed = false) {
    // 定义位置映射
    const positions = [];
    
    // 添加门将位置
    positions.push('GK');
    
    // 拆分阵型数字
    const formationArray = formation.split('').map(Number);
    
    // 定义位置代码
    const positionCodes = ['CB', 'LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF', 'AMF', 'LWF', 'RWF', 'CF'];
    
    // 分配位置
    let positionIndex = 0;
    
    // 后卫
    const defenders = formationArray[0] || 4;
    for (let i = 0; i < defenders; i++) {
      if (defenders === 3) {
        positions.push('CB');
      } else if (defenders === 4) {
        if (i === 0) positions.push('LB');
        else if (i === defenders - 1) positions.push('RB');
        else positions.push('CB');
      } else if (defenders === 5) {
        if (i === 0) positions.push('LWB');
        else if (i === defenders - 1) positions.push('RWB');
        else positions.push('CB');
      }
    }
    
    // 中场
    let midfielders = 0;
    for (let i = 1; i < formationArray.length - 1; i++) {
      const count = formationArray[i] || 0;
      midfielders += count;
      
      for (let j = 0; j < count; j++) {
        const isWide = count >= 3 && (j === 0 || j === count - 1);
        
        if (i === 1) { // 防守型中场
          positions.push(isWide ? (j === 0 ? 'LDM' : 'RDM') : 'CDM');
        } else if (i === formationArray.length - 2) { // 进攻型中场
          positions.push(isWide ? (j === 0 ? 'LAM' : 'RAM') : 'CAM');
        } else { // 中央中场
          positions.push(isWide ? (j === 0 ? 'LCM' : 'RCM') : 'CM');
        }
      }
    }
    
    // 前锋
    const forwards = formationArray[formationArray.length - 1] || 0;
    for (let i = 0; i < forwards; i++) {
      if (forwards === 1) {
        positions.push('ST');
      } else if (forwards === 2) {
        positions.push('ST');
      } else if (forwards === 3) {
        if (i === 0) positions.push('LW');
        else if (i === forwards - 1) positions.push('RW');
        else positions.push('ST');
      }
    }
    
    return isReversed ? positions.reverse() : positions;
  }

  /**
   * 处理比赛球员数据
   * @param {Object} matchData 比赛数据
   */
  processMatchPlayerData(matchData) {
    if (!this.teamData) {
      console.error('球队数据未初始化');
      return;
    }

    // 更新阵型使用统计
    this.formationStats[matchData.formation] = (this.formationStats[matchData.formation] || 0) + 1;

    // 初始国家名称为空字符串
    let nationName = '';
    
    // 尝试从球队数据中获取国家名称（如果是国家队）
    if (this.isNation && Array.isArray(this.teamData) && this.teamData.length > 0) {
      for (const player of this.teamData) {
        if (player.nation && typeof player.nation === 'string' && player.nation.trim() !== '') {
          nationName = player.nation;
          break;
        }
      }
    }
    
    // 从matchArr中查找当前比赛的亚盘数据
    const matchInfo = this.matchArr.find(m => m.matchSerial === matchData.id);
    const handicapData = matchInfo ? {
      handicap: matchInfo.handicap,
      score: matchInfo.score,
      status: matchInfo.status
    } : null;
    
    // 获取亚盘结果，如果有
    let handicapResult = null;
    if (handicapData) {
      const matchHandicapInfo = this.asianHandicapStats.matches.find(m => 
        m.score === handicapData.score && 
        m.handicap === handicapData.handicap && 
        m.status === handicapData.status
      );
      handicapResult = matchHandicapInfo ? matchHandicapInfo.teamResult : null;
    }
    
    // 从matchArr中查找当前比赛的大小球数据
    const totalLineData = matchInfo ? {
      totalLine: matchInfo.totalLine,
      score: matchInfo.score,
      status: matchInfo.status
    } : null;
    
    // 获取大小球结果，如果有
    let totalGoalsResult = null;
    if (totalLineData) {
      const matchTotalGoalsInfo = this.totalGoalsStats.matches.find(m => 
        m.score === totalLineData.score && 
        m.totalLine === totalLineData.totalLine && 
        m.status === totalLineData.status
      );
      totalGoalsResult = matchTotalGoalsInfo ? matchTotalGoalsInfo.result : null;
    }

    for (const player of matchData.players) {
      // 依据是否为国家队使用不同的球员匹配方式
      let teamPlayer;
      
      if (this.isNation) {
        // 国家队比赛：通过球员名字匹配
        teamPlayer = Array.isArray(this.teamData) ? 
          this.teamData.find(p => p.name === player.name) : null;
        
        // 如果找不到匹配的国家队球员，创建一个默认对象
        if (!teamPlayer) {
          console.warn(`找不到匹配的球员: ${player.name} (#${player.number}), 创建默认对象`);
          
          // 根据位置确定球员类型
          const posType = player.position === 'GK' ? 'GK' : 
                  (player.position === 'Substitute' ? 'FW' : 
                  (player.position.includes('B') ? 'DF' : 
                  (player.position.includes('M') ? 'MF' : 'FW')));
          
          teamPlayer = {
            name: player.name,
            number: player.number,
            nation: nationName || '',  // 使用前面获取的国家名称，如果没有则为空
            caps: 0,
            lineups: 0,
            matches: [],
            positions: {},
            goals: 0,
            assists: 0,
            minutesPlayed: 0,
            substitutedIn: 0,
            substitutedOut: 0,
            alternativeNames: [], // 添加一个数组来记录球员的所有名称变体
            age: 0, // 添加年龄字段
            socialStatus: 0, // 添加身价字段
            height: 0 // 添加身高字段
          };
          
          // 添加到球队数据中以便未来匹配
          if (Array.isArray(this.teamData)) {
            this.teamData.push(teamPlayer);
            console.log(`已添加球员 ${teamPlayer.name} (#${teamPlayer.number}) 到球队数据`);
          }
        }
      } else {
        // 俱乐部比赛：通过球员号码匹配
        teamPlayer = this.teamData.find(p => p.number === player.number);
        
        if (!teamPlayer) {
          console.warn(`找不到匹配的球员: ${player.name} (#${player.number})`);
          continue;
        }
      }

      const { name, number, position, isStarter, goals, assists, substitutedIn, substitutedOut, yellowCards, redCards, caps, lineups } = player;
      
      // 创建球员唯一标识符 - 如果不是国家队，仅使用球衣号码作为唯一标识符
      const playerKey = this.isNation ? teamPlayer.name : `${teamPlayer.number}`;

      // 在联赛分析中，如果球员还未被记录，则初始化其数据
      if (!this.playersData[playerKey]) {
        this.playersData[playerKey] = {
          name, // 初始使用第一次遇到的名称
          number,
          caps: 0,
          lineups: 0,
          matches: [],
          positions: {},
          goals: 0,
          assists: 0,
          minutesPlayed: 0,
          substitutedIn: 0,
          substitutedOut: 0,
          alternativeNames: [], // 添加一个数组来记录球员的所有名称变体
          age: 0, // 添加年龄字段
          socialStatus: 0, // 添加身价字段
          nation: '', // 添加国家字段
          height: 0 // 添加身高字段
        };
      }

      // 更新球员数据
      const playerData = this.playersData[playerKey];
      
      // 如果当前名称与记录的不同，且还未记录在alternativeNames中，则添加到备选名称列表
      if (!this.isNation && playerData.name !== name && !playerData.alternativeNames.includes(name)) {
        playerData.alternativeNames.push(name);
      }
      
      // 更新位置统计
      if (position !== 'Unknown' && position !== 'Substitute') {
        playerData.positions[position] = (playerData.positions[position] || 0) + 1;
      }
      
      // 正常累加进球、助攻、出场次数、首发次数
      playerData.goals += goals || 0;
      playerData.assists += assists || 0;
      playerData.caps += caps || 0;
      playerData.lineups += lineups || 0;
      
      if (substitutedIn) {
        playerData.substitutedIn++;
      }
      
      if (substitutedOut) {
        playerData.substitutedOut++;
      }
      
      // 简单估算比赛时间（完整比赛为90分钟）
      let minutesPlayed = 0;
      if (isStarter) {
        minutesPlayed = substitutedOut ? 70 : 90; // 估算：首发且被换下约70分钟，否则全场90分钟
      } else if (substitutedIn) {
        minutesPlayed = 20; // 估算：替补上场约20分钟
      }
      
      playerData.minutesPlayed += minutesPlayed;
      
      // 记录比赛信息，添加亚盘数据
      this.playersData[playerKey].matches.push({
        id: matchData.id,
        round: matchData.round,
        position: player.position,
        caps: player.caps,
        lineups: player.lineups,
        goals: player.goals,
        assists: player.assists,
        handicap: handicapData ? handicapData.handicap : null,
        score: handicapData ? handicapData.score : null,
        handicapResult: handicapResult,
        // 添加大小球数据
        totalLine: totalLineData ? totalLineData.totalLine : null,
        totalGoalsResult: totalGoalsResult
      });
    }
  }
  
  /**
   * 获取最常用的阵型
   * @returns {string} 最常用的阵型
   */
  getMostUsedFormation() {
    let mostUsedFormation = '';
    let maxUsage = 0;
    
    for (const [formation, count] of Object.entries(this.formationStats)) {
      if (count > maxUsage) {
        maxUsage = count;
        mostUsedFormation = formation;
      }
    }
    
    return mostUsedFormation || '442'; // 默认为4-4-2
  }
  
  /**
   * 根据阵型确定最佳首发阵容
   * @param {string} formation 阵型
   * @returns {Array} 首发阵容球员列表
   */
  determineStartingLineup(formation) {
    if (!formation) {
      console.warn('未指定阵型，无法确定首发阵容');
      return [];
    }
    
    const positions = this.getPositionsForFormation(formation);
    const lineup = [];
    const assignedPlayers = new Set(); // 用于跟踪已分配的球员

    // 为每个球员确定其最佳位置（出场次数最多的位置）
    const players = Object.values(this.playersData).map(player => {
      let bestPosition = null;
      let maxAppearances = 0;

      // 遍历球员的所有位置记录，找出出场次数最多的位置
      for (const [position, appearances] of Object.entries(player.positions)) {
        if (appearances > maxAppearances) {
          maxAppearances = appearances;
          bestPosition = position;
        }
      }

      return {
        ...player,
        bestPosition,
        bestPositionAppearances: maxAppearances
      };
    });

    // 按首发次数排序
    const sortedPlayers = players.sort((a, b) => b.lineups - a.lineups);

    // 为每个位置挑选最合适的球员
    for (const position of positions) {
      // 首先查找最适合该位置的球员（最佳位置就是该位置的）
      let bestMatch = sortedPlayers.find(p => 
        !assignedPlayers.has(p.name) && 
        p.bestPosition === position
      );

      // 如果没有找到完全匹配的，则尝试找出场过该位置的球员
      if (!bestMatch) {
        bestMatch = sortedPlayers.find(p => 
          !assignedPlayers.has(p.name) && 
          (p.positions[position] || 0) > 0
        );
      }

      // 如果仍未找到，则寻找适合相似位置的球员
      if (!bestMatch) {
        bestMatch = sortedPlayers.find(p => 
          !assignedPlayers.has(p.name) && 
          this.isCompatiblePosition(position, p.positions)
        );
      }

      if (bestMatch) {
        assignedPlayers.add(bestMatch.name);
        lineup.push({
          ...bestMatch,
          recommendedPosition: position
        });
      }
    }
    
    return lineup;
  }
  
  /**
   * 判断球员是否适合特定位置
   * @param {string} targetPosition 目标位置
   * @param {Object} playerPositions 球员出场位置统计
   * @returns {boolean} 是否适合
   */
  isCompatiblePosition(targetPosition, playerPositions) {
    // 球员有在该位置出场过，则直接返回true
    if (playerPositions[targetPosition] && playerPositions[targetPosition] > 0) {
      return true;
    }
    
    // 位置相似性匹配规则
    const positionGroups = {
      'GK': ['GK'],
      'CB': ['CB', 'LCB', 'RCB'],
      'LB': ['LB', 'LWB'],
      'RB': ['RB', 'RWB'],
      'CDM': ['CDM', 'CM', 'LDM', 'RDM'],
      'CM': ['CM', 'CDM', 'CAM', 'LCM', 'RCM'],
      'CAM': ['CAM', 'CM', 'CF', 'LAM', 'RAM'],
      'LM': ['LM', 'LW', 'LWB', 'LAM'],
      'RM': ['RM', 'RW', 'RWB', 'RAM'],
      'ST': ['ST', 'CF', 'LW', 'RW'],
      'CF': ['CF', 'ST', 'CAM'],
      'LW': ['LW', 'LM', 'ST', 'CF'],
      'RW': ['RW', 'RM', 'ST', 'CF'],
      'LWB': ['LWB', 'LB', 'LM'],
      'RWB': ['RWB', 'RB', 'RM'],
      'LCB': ['LCB', 'CB', 'LB'],
      'RCB': ['RCB', 'CB', 'RB'],
      'LDM': ['LDM', 'CDM', 'LCM'],
      'RDM': ['RDM', 'CDM', 'RCM'],
      'LCM': ['LCM', 'CM', 'LDM', 'LAM'],
      'RCM': ['RCM', 'CM', 'RDM', 'RAM'],
      'LAM': ['LAM', 'CAM', 'LCM', 'LW'],
      'RAM': ['RAM', 'CAM', 'RCM', 'RW']
    };
    
    // 获取匹配该位置的相似位置
    const compatiblePositions = positionGroups[targetPosition] || [];
    
    // 检查球员是否在相似位置出场过
    for (const position of compatiblePositions) {
      if (playerPositions[position] && playerPositions[position] > 0) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 获取阵型对应的位置列表
   * @param {string} formation 阵型
   * @returns {Array} 位置列表
   */
  getPositionsForFormation(formation) {
    // 阵型到位置的映射
    const formationMappings = {
      '4213': ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'CAM', 'LW', 'ST', 'RW'],
      '4231': ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'LM', 'CAM', 'RM', 'ST'],
      '3421': ['GK', 'LCB', 'CB', 'RCB', 'LB', 'CDM', 'CDM', 'RB', 'LM', 'RM', 'ST'],
      '433': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CDM', 'RM', 'LW', 'ST', 'RW'],
      '352': ['GK', 'LCB', 'CB', 'RCB', 'LB', 'CM', 'CDM', 'CM', 'RB', 'ST', 'ST'],
      '343': ['GK', 'LCB', 'CB', 'RCB', 'LB', 'CDM', 'CDM', 'RB', 'LW', 'ST', 'RW'],
      '442': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CDM', 'CDM', 'RM', 'ST', 'ST'],
      '3322': ['GK', 'LCB', 'CB', 'RCB', 'CDM', 'CDM', 'CDM', 'LM', 'RM', 'ST', 'ST'],
      '541': ['GK', 'LB', 'LCB', 'CB', 'RCB', 'RB', 'LM', 'CDM', 'CDM', 'RM', 'ST'],
      '4132': ['GK', 'LB', 'LCB', 'CB', 'RCB', 'CDM', 'LM', 'CAM', 'RM', 'ST', 'ST'],
      '4123': ['GK', 'LB', 'LCB', 'CB', 'RCB', 'CDM', 'LM', 'RM', 'LW', 'ST', 'RW'],
      '451': ['GK', 'LB', 'LCB', 'CB', 'RCB', 'LM', 'CM', 'CDM', 'CM', 'RM', 'ST'],
      '3412': ['GK', 'LCB', 'CB', 'RCB', 'LB', 'CDM', 'CDM', 'RB', 'CAM', 'ST', 'ST'],
      '532': ['GK', 'LB', 'LCB', 'CB', 'RCB', 'RB', 'LM', 'CDM', 'RM', 'ST', 'ST'],
      '4411': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CDM', 'CDM', 'RM', 'CF', 'ST'],
      '4141': ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LM', 'CAM', 'CAM', 'RM', 'ST'],
      '3142': ['GK', 'LCB', 'CB', 'RCB', 'CDM', 'LM', 'CAM', 'CAM', 'RM', 'ST', 'ST'],
      '4312': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CDM', 'RM', 'CAM', 'ST', 'ST'],
      '3511': ['GK', 'LCB', 'CB', 'RCB', 'LB', 'CM', 'CDM', 'CM', 'RB', 'CF', 'ST'],
      '4321': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CDM', 'RM', 'LW', 'RW', 'ST'],
      '3241': ['GK', 'LCB', 'CB', 'RCB', 'CDM', 'CDM', 'LM', 'CM', 'CM', 'RM', 'ST'],
      '3313': ['GK', 'LCB', 'CB', 'RCB', 'LM', 'CDM', 'RM', 'CAM', 'LW', 'ST', 'RW']
    };
    
    // 将阵型名称标准化处理，去除除数字外的所有字符
    const normalizedFormation = formation.replace(/[^0-9]/g, '');
    
    // 返回对应的位置列表，如果没有匹配项则返回默认的4-4-2阵型位置
    return formationMappings[normalizedFormation] || formationMappings['442'];
  }
  
  /**
   * 生成球队分析报告
   * @returns {Object} 球队报告
   */
  generateTeamReport() {
    const mostUsedFormation = this.getMostUsedFormation();
    const recommendedLineup = this.determineStartingLineup(mostUsedFormation);

    // 将球员数据转换为数组以便于排序和处理
    const playersArray = Object.values(this.playersData).map(player => ({
      ...player,
      // 添加球员标识符，以便在 isNation=false 时仅使用球衣号码作为唯一标识
      id: this.isNation ? player.name : `${player.number}`
    }));
    
    // 计算亚盘胜率
    const handicapWinRate = this.asianHandicapStats.total > 0 
      ? (this.asianHandicapStats.win / this.asianHandicapStats.total * 100).toFixed(2) 
      : 0;
    
    // 计算大球率
    const overRate = this.totalGoalsStats.total > 0 
      ? (this.totalGoalsStats.over / this.totalGoalsStats.total * 100).toFixed(2) 
      : 0;
    
    // 从记录的数据中创建球队报告
    return {
      teamId: this.serial,
      teamChineseName: this.teamChineseName, // 添加球队中文名称
      isNation: this.isNation,
      analysisDate: new Date(),
      mostUsedFormation,
      recommendedLineup,
      players: this.playersData,
      formationStats: this.formationStats,
      // 添加亚盘数据到报告中
      asianHandicap: {
        total: this.asianHandicapStats.total,
        win: this.asianHandicapStats.win,
        lose: this.asianHandicapStats.lose,
        draw: this.asianHandicapStats.draw,
        winRate: handicapWinRate,
        matches: this.asianHandicapStats.matches
      },
      // 添加大小球数据到报告中
      totalGoals: {
        total: this.totalGoalsStats.total,
        over: this.totalGoalsStats.over,
        under: this.totalGoalsStats.under,
        draw: this.totalGoalsStats.draw,
        overRate: overRate,
        matches: this.totalGoalsStats.matches
      }
    };
  }
  
  /**
   * 开始分析过程
   * @returns {Promise<Object>} 分析结果对象
   */
  async analyze() {
    try {
      console.log(`开始分析${this.isNation ? '国家队' : '俱乐部'}比赛数据...`);
      console.log(`球队序号: ${this.serial}`);
      
      // 1. 读取联赛数据
      const leagueData = await this.readLeagueData();
      console.log(`成功读取${this.isNation ? '国际赛事' : '联赛'}数据`);
      
      // 1.1 获取球队中文名称
      if (leagueData.teams) {
        this.getTeamChineseName(leagueData.teams);
      }
      
      // 1.2 如果仍未获取到球队中文名称，尝试使用额外方法
      if (!this.teamChineseName) {
        await this.tryLoadTeamChineseName();
      }
      
      // 1.3 如果仍未获取到中文名称，尝试为一些常见的球队手动设置
      if (!this.teamChineseName) {
        this.setDefaultTeamChineseName();
      }
      
      // 2. 读取球队数据
      this.teamData = await this.readTeamData();
      
      // 输出球队数据信息
      if (Array.isArray(this.teamData) && this.teamData.length > 0) {
        console.log(`成功读取球队数据，共有 ${this.teamData.length} 名球员`);
      } else {
        console.log(`未找到球队数据，将在分析过程中创建`);
      }
      
      // 3. 确定要分析的比赛
      const matchesToAnalyze = this.determineMatchesToAnalyze(leagueData);
      console.log(`找到 ${matchesToAnalyze.length} 场比赛需要分析`);
      
      if (matchesToAnalyze.length === 0) {
        console.warn('没有找到符合条件的比赛，分析终止');
        return {
          error: '没有找到符合条件的比赛'
        };
      }
      
      // 4. 分析每场比赛
      for (let i = 0; i < matchesToAnalyze.length; i++) {
        const matchInfo = matchesToAnalyze[i];
        console.log(`分析比赛 ${i + 1}/${matchesToAnalyze.length}: ${matchInfo.matchSerial}`);
        
        try {
          const matchData = await this.fetchMatchData(matchInfo);
          this.processMatchPlayerData(matchData);
        } catch (error) {
          console.error(`分析比赛 ${matchInfo.matchSerial} 失败: ${error.message}`);
          // 继续分析下一场比赛
        }
      }
      
      // 5. 尝试加载球员的额外信息（年龄、身价等）
      try {
        await this.loadPlayerAgeAndValueData();
      } catch (error) {
        console.warn(`加载球员额外数据失败: ${error.message}`);
      }

      // 6. 生成分析报告
      const report = this.generateTeamReport();

      // 7. 保存分析结果
      const outputPath = path.resolve(__dirname, `player_center/${this.serial}-new.json`);
      this.saveResults(report, outputPath);

      return report;
    } catch (error) {
      console.error(`分析过程出错: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 保存分析结果
   * @param {Object} data 要保存的数据
   * @param {string} outputPath 输出路径
   */
  saveResults(data, outputPath) {
    try {
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`分析结果已保存至 ${outputPath}`);
    } catch (error) {
      console.error(`保存分析结果失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 从球队JSON文件中加载球员的年龄和身价数据
   * @returns {Promise<void>}
   */
  async loadPlayerAgeAndValueData() {
    try {
      const filePath = path.resolve(__dirname, `./player_center/${this.serial}.json`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`球队JSON文件不存在: ${filePath}`);
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const playersList = JSON.parse(fileContent);
      
      // 为每个已记录的球员更新年龄和身价信息
      for (const playerInfo of playersList) {
        // 尝试通过球衣号码找到对应的球员
        const playerKey = this.isNation ? playerInfo.name : `${playerInfo.number}`;
        const existingPlayer = this.playersData[playerKey];
        
        if (existingPlayer) {
          // 更新年龄
          if (playerInfo.age) {
            existingPlayer.age = parseInt(playerInfo.age, 10) || 0;
          }
          
          // 更新身价 (将字符串解析为数值)
          if (playerInfo.socialStatus) {
            existingPlayer.socialStatus = parseInt(playerInfo.socialStatus, 10) || 0;
          }
          
          // 更新国家信息
          if (playerInfo.nation) {
            existingPlayer.nation = playerInfo.nation;
          }
          
          // 更新身高信息
          if (playerInfo.height) {
            existingPlayer.height = parseInt(playerInfo.height, 10) || 0;
          }
        } else {
          // 如果当前球员列表中没有该球员，尝试通过名称匹配
          const matchByName = Object.values(this.playersData).find(p => 
            p.name === playerInfo.name || 
            (p.alternativeNames && p.alternativeNames.includes(playerInfo.name))
          );
          
          if (matchByName) {
            // 更新年龄和身价
            if (playerInfo.age) {
              matchByName.age = parseInt(playerInfo.age, 10) || 0;
            }
            
            if (playerInfo.socialStatus) {
              matchByName.socialStatus = parseInt(playerInfo.socialStatus, 10) || 0;
            }
            
            // 更新国家信息
            if (playerInfo.nation) {
              matchByName.nation = playerInfo.nation;
            }
            
            // 更新身高信息
            if (playerInfo.height) {
              matchByName.height = parseInt(playerInfo.height, 10) || 0;
            }
          }
          // 如果找不到匹配的球员，就跳过
        }
      }
      
      console.log(`成功从JSON文件获取球员信息`);
    } catch (error) {
      console.error(`加载球员年龄和身价数据失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 计算大小球盘口结果
   * @param {string} status 当前球队是主队还是客队 ('home' 或 'guest')
   * @param {string} totalLine 大小球盘口值 (如 "3" 或 "3/3.5")
   * @param {string} score 比分，格式为"主队进球-客队进球"
   */
  calculateTotalGoals(status, totalLine, score) {
    // 默认为0-0，防止空值
    if (!score) score = '0-0';
    
    // 解析比分
    const scoreArray = score.split('-');
    const homeGoals = parseInt(scoreArray[0], 10) || 0;
    const awayGoals = parseInt(scoreArray[1], 10) || 0;
    const totalGoals = homeGoals + awayGoals;
    
    // 解析大小球盘口
    let totalLineValue = 0;
    if (totalLine) {
      // 处理类似 "3/3.5" 这样的盘口
      if (totalLine.includes('/')) {
        const [lower, upper] = totalLine.split('/');
        totalLineValue = (parseFloat(lower) + parseFloat(upper)) / 2;
      } else {
        totalLineValue = parseFloat(totalLine);
      }
    }
    
    // 计算盘口结果（总进球数-盘口值）
    const result = totalGoals - totalLineValue;
    
    let totalGoalsResult;
    if (result > 0) {
      totalGoalsResult = 'over'; // 大球
    } else if (result < 0) {
      totalGoalsResult = 'under'; // 小球
    } else {
      totalGoalsResult = 'draw'; // 走盘
    }
    
    // 更新大小球统计数据
    this.totalGoalsStats.total++;
    this.totalGoalsStats[totalGoalsResult]++;
    
    // 保存比赛大小球详情
    this.totalGoalsStats.matches.push({
      score: score,
      totalLine: totalLine,
      totalLineValue: totalLineValue,
      status: status,
      totalGoals: totalGoals,
      result: totalGoalsResult
    });
    
    return totalGoalsResult;
  }

  /**
   * 从联赛数据中获取球队中文名称
   * @param {Array} teams 球队数据数组
   */
  getTeamChineseName(teams) {
    if (!Array.isArray(teams) || !this.serial) {
      return '';
    }
    
    // 在球队数组中查找匹配的球队序号，确保进行类型转换比较
    const team = teams.find(team => String(team[0]) === String(this.serial));
    if (team && team[1]) {
      this.teamChineseName = team[1];
      console.log(`球队中文名称: ${this.teamChineseName}`);
      return team[1];
    }
    
    // 如果没找到匹配项，尝试输出一些调试信息
    console.warn(`找不到序号为 ${this.serial} 的球队中文名称`);
    console.log(`可用的球队序号: ${teams.map(t => t[0]).join(', ')}`);
    return '';
  }

  /**
   * 尝试加载球队中文名称，通过尝试多个可能的文件
   * 由于文件命名可能存在差异，我们尝试几种常见的格式
   */
  async tryLoadTeamChineseName() {
    // 如果已经有球队中文名称，则直接返回
    if (this.teamChineseName) {
      return this.teamChineseName;
    }
    
    // 没有球队序号则无法加载
    if (!this.serial) {
      return '';
    }
    
    console.log('尝试加载球队中文名称...');
    
    // 尝试的文件路径格式
    const formats = this.isNation ? 
      ['c${id}', 'c${id}', 'cnation${id}'] : 
      ['s${id}', 's${id}.js', 'sleague${id}', 'sleague${id}.js', '${id}', '${id}.js'];
    
    // 尝试的ID格式
    const idFormats = [
      this.leagueId,
      this.leagueId.replace(/^[sc]/, ''),
      this.leagueId.replace(/^sleague/, '').replace(/^s/, '')
    ];
    
    // 尝试所有可能的组合
    for (const format of formats) {
      for (const id of idFormats) {
        try {
          // 构建可能的文件路径
          const fileName = format.replace('${id}', id);
          const filePath = path.resolve(__dirname, `match_center/${fileName}`);
          
          console.log(`尝试读取文件: ${filePath}`);
          
          if (!fs.existsSync(filePath)) {
            // 如果文件不存在，尝试添加.js后缀
            if (!filePath.endsWith('.js') && fs.existsSync(`${filePath}.js`)) {
              const fileWithExt = `${filePath}.js`;
              console.log(`找到文件: ${fileWithExt}`);
              
              const fileContent = fs.readFileSync(fileWithExt, 'utf8');
              const context = { jh: {}, arrTeam: [] };
              const executeScript = new Function('jh', 'arrTeam', fileContent);
              executeScript(context.jh, context.arrTeam);
              
              // 在球队数组中查找匹配的球队序号
              const team = context.arrTeam.find(team => String(team[0]) === String(this.serial));
              if (team && team[1]) {
                this.teamChineseName = team[1];
                console.log(`从文件 ${fileWithExt} 找到球队中文名称: ${this.teamChineseName}`);
                return this.teamChineseName;
              }
            }
            continue;
          }
          
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const context = { jh: {}, arrTeam: [] };
          const executeScript = new Function('jh', 'arrTeam', fileContent);
          executeScript(context.jh, context.arrTeam);
          
          // 在球队数组中查找匹配的球队序号
          const team = context.arrTeam.find(team => String(team[0]) === String(this.serial));
          if (team && team[1]) {
            this.teamChineseName = team[1];
            console.log(`从文件 ${filePath} 找到球队中文名称: ${this.teamChineseName}`);
            return this.teamChineseName;
          }
        } catch (error) {
          // 忽略错误，尝试下一个文件
          console.log(`读取文件失败: ${error.message}`);
        }
      }
    }
    
    console.warn(`尝试所有可能的文件后仍找不到球队中文名称`);
    return '';
  }

  /**
   * 为常见的球队手动设置中文名称
   * 当无法从文件中获取时使用
   */
  setDefaultTeamChineseName() {
    // 常见英超球队的中文名称映射
    const premierLeagueTeams = {
      '1': '阿森纳',
      '2': '阿斯顿维拉',
      '3': '伯恩茅斯',
      '4': '布伦特福德',
      '5': '布莱顿',
      '6': '伯恩利',
      '7': '切尔西',
      '8': '水晶宫',
      '9': '埃弗顿',
      '10': '富勒姆',
      '11': '利物浦',
      '12': '卢顿',
      '13': '曼城',
      '14': '曼联',
      '15': '纽卡斯尔联',
      '16': '诺丁汉森林',
      '17': '谢菲尔德联',
      '18': '南安普顿',
      '19': '热刺',
      '20': '西汉姆联',
      '21': '狼队',
      '22': '伯明翰',
      '23': '布莱克本',
      '24': '切尔西',
      '25': '雷丁',
      '26': '普雷斯顿',
      '27': '女王公园巡游者',
      '28': '谢菲尔德联',
      '29': '斯托克城',
      '30': '桑德兰',
      '31': '斯旺西',
      '32': '沃特福德',
      '33': '西布朗',
      '34': '维冈竞技',
      '35': '伯恩茅斯',
      '36': '布莱顿',
      '37': '布伦特福德',
      '38': '卡迪夫城',
      '39': '考文垂',
      '40': '德比郡'
    };

    // 如果是英超球队
    if (this.leagueId === '36' || this.leagueId === 's36') {
      if (premierLeagueTeams[this.serial]) {
        this.teamChineseName = premierLeagueTeams[this.serial];
        console.log(`使用默认中文名称: ${this.teamChineseName}`);
        return;
      }
    }

    // 如果未能匹配到，使用"球队"加序号作为名称
    this.teamChineseName = `球队${this.serial}`;
    console.log(`未找到匹配，使用默认名称: ${this.teamChineseName}`);
  }

  /**
   * 主入口点方法
   * @param {Object} options 分析选项
   * @param {string} options.leagueId 联赛ID
   * @param {number} options.serial 球队序号
   * @param {boolean} options.isNation 是否国家队
   * @param {number} options.roundSerial 轮次
   * @returns {Promise<Object>} 分析结果
   */
  static main(options = {}) {
    console.log('开始分析球队数据...');
    console.log(`分析模式: ${options.isNation ? '国家队' : '俱乐部'}`);
    console.log(`球队序号: ${options.serial}`);
    console.log(`联赛/赛事ID: ${options.leagueId}`);
    
    const analyzer = new ClubAnalyzer(options);
    
    return analyzer.analyze()
      .then(report => {
        console.log('分析完成!');
        console.log(`球队: ${report.teamChineseName || report.teamId} (序号:${report.teamId})`);
        console.log(`最常用阵型: ${report.mostUsedFormation}`);
        console.log(`分析球员数量: ${Object.keys(report.players).length}`);
        
        // 输出亚盘数据统计结果
        if (report.asianHandicap && report.asianHandicap.total > 0) {
          console.log('\n亚盘数据统计:');
          console.log(`总场次: ${report.asianHandicap.total}`);
          console.log(`赢盘: ${report.asianHandicap.win} (${report.asianHandicap.winRate}%)`);
          console.log(`输盘: ${report.asianHandicap.lose}`);
          console.log(`走盘: ${report.asianHandicap.draw}`);
          
          // 输出每场比赛的亚盘详情
          console.log('\n亚盘详细记录:');
          report.asianHandicap.matches.forEach((match, index) => {
            const statusText = match.status === 'home' ? '主场' : '客场';
            const handicapText = match.handicap > 0 
              ? `主队让${match.handicap}球` 
              : match.handicap < 0 
                ? `主队受${Math.abs(match.handicap)}球` 
                : '平手盘';
            const resultText = match.teamResult === 'win' 
              ? '赢盘' 
              : match.teamResult === 'lose' 
                ? '输盘' 
                : '走盘';
            
            console.log(`${index + 1}. ${statusText} 比分:${match.score} 盘口:${handicapText} 结果:${resultText}`);
          });
        } else {
          console.log('\n未找到亚盘数据记录');
        }
        
        // 输出大小球数据统计结果
        if (report.totalGoals && report.totalGoals.total > 0) {
          console.log('\n大小球数据统计:');
          console.log(`总场次: ${report.totalGoals.total}`);
          console.log(`大球: ${report.totalGoals.over} (${report.totalGoals.overRate}%)`);
          console.log(`小球: ${report.totalGoals.under}`);
          console.log(`走盘: ${report.totalGoals.draw}`);
          
          // 输出每场比赛的大小球详情
          console.log('\n大小球详细记录:');
          report.totalGoals.matches.forEach((match, index) => {
            const statusText = match.status === 'home' ? '主场' : '客场';
            const totalLineText = match.totalLine; 
            const totalGoalsText = match.totalGoals;
            const resultText = match.result === 'over' 
              ? '大球' 
              : match.result === 'under' 
                ? '小球' 
                : '走盘';
            
            console.log(`${index + 1}. ${statusText} 比分:${match.score} 总进球:${totalGoalsText} 盘口:${totalLineText} 结果:${resultText}`);
          });
        } else {
          console.log('\n未找到大小球数据记录');
        }
        
        // 输出所有上场过的球员信息，按首发数和出场数排序
        console.log('\n所有上场球员信息:');
        const allPlayers = Object.values(report.players)
          .filter(p => p.caps > 0) // 只包含上场过的球员
          .sort((a, b) => {
            // 首先按首发数降序排序
            if (b.lineups !== a.lineups) {
              return b.lineups - a.lineups;
            }
            // 首发数相同则按出场数降序排序
            return b.caps - a.caps;
          });
        
        allPlayers.forEach(player => {
          // 过滤掉Unknown和Substitute位置
          const positionsObj = Object.entries(player.positions)
            .filter(([pos]) => pos !== 'Unknown' && pos !== 'Substitute')
            .sort((a, b) => b[1] - a[1]) // 按位置出场次数由大到小排序
            .reduce((obj, [pos, count]) => {
              obj[pos] = count;
              return obj;
            }, {});
          
          // 格式化输出球员信息，添加国家、年龄和身价
          const nationInfo = player.nation || '--';
          const ageInfo = player.age ? `${player.age}` : '--';
          const heightInfo = player.height ? `${player.height}cm` : '--';
          const valueInfo = player.socialStatus ? `${player.socialStatus}万欧元` : '--';
          
          console.log(`${player.number}-${player.name} ${player.caps}场${player.lineups}首发 ${JSON.stringify(positionsObj)} ${nationInfo} ${ageInfo} ${heightInfo} ${valueInfo}`);
        });
        console.log(''); // 添加空行分隔
        
        // 输出推荐首发阵容
        const lineup = report.recommendedLineup;
        if (lineup && lineup.length > 0) {
          // 将球员按位置分组
          const gk = lineup.filter(p => p.recommendedPosition === 'GK').map(p => `${p.number}-${p.name}`);
          const defenders = lineup.filter(p => ['LB', 'CB', 'RB', 'LWB', 'RWB'].includes(p.recommendedPosition)).map(p => `${p.number}-${p.name}`);
          const midfielders = lineup.filter(p => ['CDM', 'CM', 'LM', 'RM', 'CAM', 'LDM', 'RDM', 'LCM', 'RCM', 'LAM', 'RAM'].includes(p.recommendedPosition)).map(p => `${p.number}-${p.name}`);
          const forwards = lineup.filter(p => ['CF', 'LW', 'RW', 'ST'].includes(p.recommendedPosition)).map(p => `${p.number}-${p.name}`);
          
          // 格式化输出
          const formattedLineup = [
            gk.join('，'),
            defenders.join('，'),
            midfielders.join('，'),
            forwards.join('，')
          ].join('/');
          
          console.log(`推荐首发阵容: ${formattedLineup}`);
        } else {
          console.log('无法生成推荐首发阵容，数据不足');
        }
      })
      .catch(error => {
        console.error('分析失败:', error.message);
        process.exit(1);
      });
  }
}

// 导出分析器类
module.exports = ClubAnalyzer;

// 如果直接运行此文件，则执行分析
if (require.main === module) {
  // 读取配置文件
  try {
    const staticData = require('./config/wudaconfig');
    const options = {
      leagueId: staticData.leagueSerial || '36', // 默认英超
      serial: Number(staticData.teamSerial) || 24, // 默认切尔西
      isNation: staticData.isNation || false, // 默认非国家队
      roundSerial: Number(staticData.roundSerial) || null // 准备开打的轮次
    }
    // 开始分析
    console.log(`开始分析${staticData.isNation ? '国家队' : '俱乐部'}比赛数据...`);
    ClubAnalyzer.main(options);
  } catch (error) {
    console.error('配置文件读取失败:', error.message);
    process.exit(1);
  }
} 