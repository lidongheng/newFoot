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
    this.leagueId = options.leagueId || 's36'; // 默认英超
    this.serial = options.serial || null;
    this.isNation = options.isNation || false;
    this.roundSerial = options.roundSerial || null;
    this.matchArr = []; // 比赛编号数据
    this.teamData = null; // 球队数据
    this.playersData = {}; // 球员数据
    this.formationStats = {}; // 阵型统计
    this.matchDataCache = new Map(); // 缓存已爬取的比赛数据
  }

  /**
   * 读取联赛数据文件
   * @returns {Promise<Object>} 解析后的联赛数据
   */
  async readLeagueData() {
    try {
      const filePath = path.resolve(__dirname, `match_center/${this.leagueId}.js`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // 创建一个安全的执行环境
      const context = {
        jh: {},
        arrTeam: []
      };
      
      // 使用Function构造函数代替eval，更安全且可控
      const executeScript = new Function('jh', 'arrTeam', fileContent);
      executeScript(context.jh, context.arrTeam);
      
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
        throw new Error('球队序号未设置');
      }
      
      const filePath = path.resolve(__dirname, `./player_center/${this.serial}.json`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      this.teamData = JSON.parse(fileContent);
      
      return this.teamData;
    } catch (error) {
      console.error(`无法读取球队数据文件: ${error.message}`);
      throw error;
    }
  }

  /**
   * 确定要分析的比赛
   * @param {Object} leagueData 联赛数据
   * @returns {Array} 要分析的比赛编号数组
   */
  determineMatchesToAnalyze(leagueData) {
    const matchArr = [];
    
    // 查找已完成的比赛（状态为-1）
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
            matchArr.push(match[0]); // 添加比赛编号
          }
        }
      }
    }
    
    this.matchArr = matchArr;
    return matchArr;
  }

  /**
   * 爬取比赛数据
   * @param {string} matchId 比赛ID
   * @returns {Promise<Object>} 比赛数据
   */
  async fetchMatchData(matchId) {
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
        
        // 判断当前球队是主队还是客队
        const status = homeTeamId === this.serial ? 'home' : 'guest';
        
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
            matches: events.matches,
            starts: events.starts
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
            matches: events.matches,
            starts: events.starts
          });
        });
        
        // 构建比赛数据对象
        const matchData = {
          id: matchId,
          status,
          formation,
          players
        };
        
        // 缓存解析后的数据
        this.matchDataCache.set(matchId, matchData);
        
        // 请求成功，返回数据
        return matchData;
        
      } catch (error) {
        lastError = error;
        
        // 判断是否还有重试机会
        if (retries < MAX_RETRIES) {
          retries++;
          console.warn(`爬取比赛 ${matchId} 数据失败 (尝试 ${retries}/${MAX_RETRIES}): ${error.message}`);
          // 等待一段时间再重试，每次重试等待时间递增
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        } else {
          // 所有重试尝试都失败
          console.error(`爬取比赛 ${matchId} 数据失败，已尝试 ${retries+1} 次: ${error.message}`);
          throw new Error(`爬取比赛 ${matchId} 数据失败，已尝试 ${retries+1} 次: ${error.message}`);
        }
      }
    }
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
      matches: playerType === 'plays' ? 1 : 0,
      starts: playerType === 'plays' ? 1 : 0
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
          events.matches++;
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
   * 处理比赛中的球员数据
   * @param {Object} matchData 比赛数据
   */
  processMatchPlayerData(matchData) {
    const { players, formation, id: matchId } = matchData;
    
    // 更新阵型使用统计
    this.formationStats[formation] = (this.formationStats[formation] || 0) + 1;
    
    // 更新球员数据
    for (const player of players) {
      const { name, number, position, isStarter, goals, assists, substitutedIn, substitutedOut, matches, starts } = player;
      
      // 创建球员唯一标识符 - 如果不是国家队，仅使用球衣号码作为唯一标识符
      const playerKey = this.isNation ? name : `${number}`;
      
      // 如果球员还未被记录，则初始化其数据
      if (!this.playersData[playerKey]) {
        this.playersData[playerKey] = {
          name, // 初始使用第一次遇到的名称
          number,
          matches: 0,
          starts: 0,
          positions: {},
          goals: 0,
          assists: 0,
          minutesPlayed: 0,
          substitutedIn: 0,
          substitutedOut: 0,
          alternativeNames: [] // 添加一个数组来记录球员的所有名称变体
        };
      }
      
      // 更新球员数据
      const playerData = this.playersData[playerKey];
      
      // 如果当前名称与记录的不同，且还未记录在alternativeNames中，则添加到备选名称列表
      if (playerData.name !== name && !playerData.alternativeNames.includes(name)) {
        playerData.alternativeNames.push(name);
      }
      
      // 更新位置统计
      if (position !== 'Unknown' && position !== 'Substitute') {
        playerData.positions[position] = (playerData.positions[position] || 0) + 1;
      }
      
      // 正常累加进球、助攻、出场次数、首发次数
      playerData.goals += goals || 0;
      playerData.assists += assists || 0;
      playerData.matches += matches || 0;
      playerData.starts += starts || 0;
      
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
    }
  }
  
  /**
   * 获取球队最常用的阵型
   * @returns {string} 最常用阵型
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
   * 推荐最佳首发阵容
   * @param {string} formation 目标阵型
   * @returns {Array} 推荐的首发球员列表
   */
  determineStartingLineup(formation) {
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
    const sortedPlayers = players.sort((a, b) => b.starts - a.starts);

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
   * 检查球员是否适合某个位置
   * @param {string} targetPosition 目标位置
   * @param {Object} playerPositions 球员位置记录
   * @returns {boolean} 是否适合
   */
  isCompatiblePosition(targetPosition, playerPositions) {
    // 相似位置映射
    const similarPositions = {
      'GK': ['GK'],
      'LB': ['LB', 'LWB', 'CB'],
      'CB': ['CB', 'LB', 'RB'],
      'RB': ['RB', 'RWB', 'CB'],
      'LWB': ['LWB', 'LB', 'LM'],
      'RWB': ['RWB', 'RB', 'RM'],
      'CDM': ['CDM', 'CM', 'LDM', 'RDM'],
      'LDM': ['LDM', 'CDM', 'LCM'],
      'RDM': ['RDM', 'CDM', 'RCM'],
      'CM': ['CM', 'CDM', 'CAM', 'LCM', 'RCM'],
      'LCM': ['LCM', 'CM', 'LM'],
      'RCM': ['RCM', 'CM', 'RM'],
      'CAM': ['CAM', 'CM', 'LAM', 'RAM'],
      'LAM': ['LAM', 'CAM', 'LM'],
      'RAM': ['RAM', 'CAM', 'RM'],
      'LM': ['LM', 'LCM', 'LW'],
      'RM': ['RM', 'RCM', 'RW'],
      'LW': ['LW', 'LM', 'ST'],
      'RW': ['RW', 'RM', 'ST'],
      'ST': ['ST', 'LW', 'RW', 'CAM']
    };
    
    // 检查球员是否在相似位置有出场记录
    const compatiblePositions = similarPositions[targetPosition] || [targetPosition];
    
    return compatiblePositions.some(pos => playerPositions[pos] > 0);
  }
  
  /**
   * 获取指定阵型的位置列表
   * @param {string} formation 阵型 (如 "4231")
   * @returns {Array} 位置列表
   */
  getPositionsForFormation(formation) {
    return this.calculatePositions(formation);
  }
  
  /**
   * 生成球队分析报告
   * @returns {Object} 分析报告
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
    
    // 从记录的数据中创建球队报告
    return {
      teamId: this.serial,
      isNation: this.isNation,
      analysisDate: new Date(),
      mostUsedFormation,
      recommendedLineup,
      players: this.playersData,
      formationStats: this.formationStats
    };
  }
  
  /**
   * 执行球队分析
   * @returns {Promise<Object>} 分析结果
   */
  async analyze() {
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
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // 5. 生成分析报告
      const report = this.generateTeamReport();
      
      // 6. 保存分析结果
      const outputPath = path.resolve(__dirname, `player_center/${this.serial}-new.json`);
      this.saveResults(report, outputPath);
      
      return report;
    } catch (error) {
      console.error('分析过程中发生错误:', error);
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
}

// 导出模块
module.exports = ClubAnalyzer;

// 如果直接运行此文件，则执行示例分析
if (require.main === module) {
  // 读取配置文件
  try {
    const staticData = require('./config/wudaconfig');
    
    // 创建分析器实例
    const analyzer = new ClubAnalyzer({
      leagueId: staticData.leagueSerial || 's36', // 默认英超
      serial: Number(staticData.teamSerial) || 24, // 默认切尔西
      isNation: false, // 默认非国家队
      roundSerial: Number(staticData.roundSerial) || null // 准备开打的轮次
    });
    
    // 执行分析
    analyzer.analyze()
      .then(report => {
        console.log('分析完成!');
        console.log(`最常用阵型: ${report.mostUsedFormation}`);
        console.log(`分析球员数量: ${Object.keys(report.players).length}`);
        
        // 输出推荐首发阵容
        const lineup = report.recommendedLineup;
        if (lineup && lineup.length > 0) {
          // 将球员按位置分组
          const gk = lineup.filter(p => p.recommendedPosition === 'GK').map(p => `${p.number}-${p.name}`);
          const defenders = lineup.filter(p => ['LB', 'CB', 'RB', 'LWB', 'RWB'].includes(p.recommendedPosition)).map(p => `${p.number}-${p.name}`);
          const midfielders = lineup.filter(p => ['CDM', 'CM', 'LM', 'RM', 'CAM', 'LDM', 'RDM', 'LCM', 'RCM', 'LAM', 'RAM'].includes(p.recommendedPosition)).map(p => `${p.number}-${p.name}`);
          const forwards = lineup.filter(p => ['LW', 'RW', 'ST'].includes(p.recommendedPosition)).map(p => `${p.number}-${p.name}`);
          
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
        console.error('分析失败:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('无法读取配置:', error);
    process.exit(1);
  }
} 