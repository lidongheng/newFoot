/**
 * crawlerClub3_My.js
 * 分析球队数据，获取球员出场数、首发数、位置统计、进球数、助攻数等数据
 * 并分析球队最常用阵型和首发阵容
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')
const iconv = require('iconv-lite')

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
      const filePath = path.resolve(__dirname, `match_center/${this.leagueId}.js`)
      const fileContent = fs.readFileSync(filePath, 'utf8')

      // 创建一个安全的执行环境
      const context = {
        jh: {},
        arrTeam: []
      }

      // 使用Function构造函数代替eval，更安全且可控
      const executeScript = new Function('jh', 'arrTeam', fileContent);
      executeScript(context.jh, context.arrTeam);// 使用eval执行代码
      
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

      const filePath = path.resolve(__dirname, `${this.serial}.json`);
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
   * @param {string} matchId 比赛编号
   * @returns {Promise<Object>} 解析后的比赛数据
   */
}

