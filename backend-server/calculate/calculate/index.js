const fs = require('fs');
const path = require('path');

function calculateStandings(leagueId = 36, startRound = 1, endRound, latestRound = 0) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof leagueId !== 'number' || leagueId <= 0) {
        throw new Error('endRound 参数无效');
      }

      // 数据引入
      const data = fs.readFileSync(path.resolve(__dirname, `../match/s${leagueId}.js`), 'utf8');
      var jh = [];
      var arrTeam = [];
      eval(data);

      // 如果未传入 endRound，找到第一个 status 为 0 的轮次
      if (!endRound) {
        endRound = Object.keys(jh).find(key => {
          const roundMatches = jh[key];
          return roundMatches && roundMatches.some(match => match[2] === 0);
        });
        if (endRound) {
          endRound = parseInt(endRound.replace('R_', ''), 10);
        } else {
          throw new Error('无法确定 endRound，请检查数据是否正确');
        }
      }

      // 确定计算范围
      const adjustedStartRound = latestRound > 0 ? Math.max(1, endRound - latestRound + 1) : startRound;

      // 初始化 全场
      let teamStats = arrTeam.map(team => ({
        teamId: team[0],
        teamName: team[1],
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalsDifference: 0,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      }));
      // 初始化 上半场
      let firstHalfTeamStats = arrTeam.map(team => ({
        teamId: team[0],
        teamName: team[1],
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalsDifference: 0,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      }));
      // 初始化 下半场
      let secondHalfTeamStats = arrTeam.map(team => ({
        teamId: team[0],
        teamName: team[1],
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalsDifference: 0,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      }));
      // 处理循环数据
      for (let round = adjustedStartRound; round <= endRound; round++) {
        const roundKey = `R_${round}`
        const roundMatches = jh[roundKey];
        if (roundMatches) {
          roundMatches.forEach(match => {
            const status = match[2];
            const homeTeamId = match[4];
            const awayTeamId = match[5];
            const score = match[6];
            const firstHalfScore = match[7];
  
            if (status === -1 && score) {
              const [homeGoals, awayGoals] = score.split('-').map(Number);
              const [firstHalfHomeGoals, firstHalfAwayGoals] = firstHalfScore.split('-').map(Number);
              const secondHalfHomeGoals = homeGoals - firstHalfHomeGoals;
              const secondHalfAwayGoals = awayGoals - firstHalfAwayGoals;
  
              const homeTeam = teamStats.find(team => team.teamId === homeTeamId);
              const awayTeam = teamStats.find(team => team.teamId === awayTeamId);
              const firstHalfHomeTeam = firstHalfTeamStats.find(team => team.teamId === homeTeamId);
              const firstHalfAwayTeam = firstHalfTeamStats.find(team => team.teamId === awayTeamId);
              const secondHalfHomeTeam = secondHalfTeamStats.find(team => team.teamId === homeTeamId);
              const secondHalfAwayTeam = secondHalfTeamStats.find(team => team.teamId === awayTeamId);
  
              homeTeam.matchesPlayed++;
              awayTeam.matchesPlayed++;
              firstHalfHomeTeam.matchesPlayed++;
              firstHalfAwayTeam.matchesPlayed++;
              secondHalfHomeTeam.matchesPlayed++;
              secondHalfAwayTeam.matchesPlayed++;
  
              homeTeam.goalsFor += homeGoals;
              homeTeam.goalsAgainst += awayGoals;
              firstHalfHomeTeam.goalsFor += firstHalfHomeGoals;
              firstHalfHomeTeam.goalsAgainst += firstHalfAwayGoals;
              secondHalfHomeTeam.goalsFor += secondHalfHomeGoals;
              secondHalfHomeTeam.goalsAgainst += secondHalfAwayGoals;
              
  
              awayTeam.goalsFor += awayGoals;
              awayTeam.goalsAgainst += homeGoals;
              firstHalfAwayTeam.goalsFor += firstHalfAwayGoals;
              firstHalfAwayTeam.goalsAgainst += firstHalfHomeGoals;
              secondHalfAwayTeam.goalsFor += secondHalfAwayGoals;
              secondHalfAwayTeam.goalsAgainst += secondHalfHomeGoals;
  
              homeTeam.goalsDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
              awayTeam.goalsDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;
              firstHalfHomeTeam.goalsDifference = firstHalfHomeTeam.goalsFor - firstHalfHomeTeam.goalsAgainst;
              firstHalfAwayTeam.goalsDifference = firstHalfAwayTeam.goalsFor - firstHalfAwayTeam.goalsAgainst;
              secondHalfHomeTeam.goalsDifference = secondHalfHomeTeam.goalsFor - secondHalfHomeTeam.goalsAgainst;
              secondHalfAwayTeam.goalsDifference = secondHalfAwayTeam.goalsFor - secondHalfAwayTeam.goalsAgainst;
  
              if (homeGoals > awayGoals) {
                homeTeam.points += 3;
                homeTeam.wins++;
                awayTeam.losses++;
              } else if (homeGoals < awayGoals) {
                awayTeam.points += 3;
                awayTeam.wins++;
                homeTeam.losses++;
              } else {
                homeTeam.points += 1;
                awayTeam.points += 1;
                homeTeam.draws++;
                awayTeam.draws++;
              }
              if (firstHalfHomeGoals > firstHalfAwayGoals) {
                firstHalfHomeTeam.points += 3;
                firstHalfHomeTeam.wins++;
                firstHalfAwayTeam.losses++;
              } else if (firstHalfHomeGoals < firstHalfAwayGoals) {
                firstHalfAwayTeam.points += 3;
                firstHalfAwayTeam.wins++;
                firstHalfHomeTeam.losses++;
              } else {
                firstHalfHomeTeam.points += 1;
                firstHalfAwayTeam.points += 1;
                firstHalfHomeTeam.draws++;
                firstHalfAwayTeam.draws++;
              }
              if (secondHalfHomeGoals > secondHalfAwayGoals) {
                secondHalfHomeTeam.points += 3;
                secondHalfHomeTeam.wins++;
                secondHalfAwayTeam.losses++;
              } else if (secondHalfHomeGoals < secondHalfAwayGoals) {
                secondHalfAwayTeam.points += 3;
                secondHalfAwayTeam.wins++;
                secondHalfHomeTeam.losses++;
              } else {
                secondHalfHomeTeam.points += 1;
                secondHalfAwayTeam.points += 1;
                secondHalfHomeTeam.draws++;
                secondHalfAwayTeam.draws++;
              }
            }
          });
        }
      }

      teamStats.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        } else {
          return b.goalsDifference - a.goalsDifference;
        }
      });
      firstHalfTeamStats.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        } else {
          return b.goalsDifference - a.goalsDifference;
        }
      });
      secondHalfTeamStats.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        } else {
          return b.goalsDifference - a.goalsDifference;
        }
      });

      teamStats = teamStats.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));
      firstHalfTeamStats = firstHalfTeamStats.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));
      secondHalfTeamStats = secondHalfTeamStats.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));

      // const outputFilePath = './epl_standings.json';
      // fs.writeFileSync(outputFilePath, JSON.stringify(teamStats, null, 2), 'utf-8');
      resolve({ teamStats, firstHalfTeamStats, secondHalfTeamStats });
    } catch (error) {
      reject(error);    
    }
  });
}

/**
 * 计算亚让盘路榜
 * @param {number} leagueId 联赛序号，必填
 * @param {number} startRound 开始轮次，默认为 1
 * @param {number} endRound 结束轮次，必填
 * @returns {Promise<object>} Promise 对象，解析为生成的亚让盘路榜数据。
 */
 function calculateAsianHandicap(leagueId, startRound = 1, endRound, latestRound = 0) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof leagueId !== 'number' || leagueId <= 0) {
        throw new Error('leagueId 参数无效');
      }

      // 读取文件内容并解析为 JavaScript 数据
      const data = fs.readFileSync(path.resolve(__dirname, `../match/s${leagueId}.js`), 'utf8');
      var jh = [];
      var arrTeam = [];
      eval(data);

      // 如果未传入 endRound，找到第一个 status 为 0 的轮次
      if (!endRound) {
        endRound = Object.keys(jh).find(key => {
          const roundMatches = jh[key];
          return roundMatches && roundMatches.some(match => match[2] === 0);
        });
        if (endRound) {
          endRound = parseInt(endRound.replace('R_', ''), 10);
        } else {
          throw new Error('无法确定 endRound，请检查数据是否正确');
        }
      }

      // 确定计算范围
      const adjustedStartRound = latestRound > 0 ? Math.max(1, endRound - latestRound + 1) : startRound;

      // 验证 arrTeam 和 jh 是否已正确加载
      if (!arrTeam || !Array.isArray(arrTeam)) {
        throw new Error('arrTeam 数据未正确加载或格式不正确');
      }
      if (!jh || typeof jh !== 'object') {
        throw new Error('jh 数据未正确加载或格式不正确');
      }

      // 初始化亚让盘路榜数据
      let teamStats = arrTeam.map(team => ({
        teamId: team[0],
        teamName: team[1],
        matchesPlayed: 0,
        upperPlates: 0, // 上盘数
        flatPlates: 0,  // 平盘数
        lowerPlates: 0, // 下盘数
        winPlates: 0,   // 赢盘数
        drawPlates: 0,  // 走盘数
        losePlates: 0,  // 输盘数
        netPlates: 0,   // 净胜盘口数
        winRate: 0,     // 赢盘率
        drawRate: 0,    // 走盘率
        loseRate: 0     // 输盘率
      }));

      // 处理指定范围的比赛数据
      for (let round = adjustedStartRound; round <= endRound; round++) {
        const roundKey = `R_${round}`;
        const roundMatches = jh[roundKey];

        if (roundMatches) {
          roundMatches.forEach(match => {
            if (match[1] !== leagueId || match[2] !== -1) return; // 排除非本联赛或未结束的比赛

            const homeTeamId = match[4];
            const awayTeamId = match[5];
            const score = match[6];
            const handicap = parseFloat(match[10]);

            if (!score || isNaN(handicap)) return; // 跳过无效数据

            const [homeGoals, awayGoals] = score.split('-').map(Number);
            const result = homeGoals - awayGoals - handicap;

            const homeTeam = teamStats.find(team => team.teamId === homeTeamId);
            const awayTeam = teamStats.find(team => team.teamId === awayTeamId);

            homeTeam.matchesPlayed++;
            awayTeam.matchesPlayed++;

            // 确定盘口类型
            if (handicap > 0) {
              homeTeam.upperPlates++;
              awayTeam.lowerPlates++;
            } else if (handicap < 0) {
              homeTeam.lowerPlates++;
              awayTeam.upperPlates++;
            } else {
              homeTeam.flatPlates++;
              awayTeam.flatPlates++;
            }

            // 确定赢盘、走盘、输盘
            if (result > 0) {
              homeTeam.winPlates++;
              awayTeam.losePlates++;
              homeTeam.netPlates++;
              awayTeam.netPlates--;
            } else if (result === 0) {
              homeTeam.drawPlates++;
              awayTeam.drawPlates++;
            } else {
              homeTeam.losePlates++;
              awayTeam.winPlates++;
              homeTeam.netPlates--;
              awayTeam.netPlates++;
            }
          });
        }
      }

      // 计算比率和排序
      teamStats.forEach(team => {
        const totalPlates = team.winPlates + team.drawPlates + team.losePlates;
        if (totalPlates > 0) {
          team.winRate = parseFloat(((team.winPlates / totalPlates) * 100).toFixed(2));
          team.drawRate = parseFloat(((team.drawPlates / totalPlates) * 100).toFixed(2));
          team.loseRate = parseFloat(((team.losePlates / totalPlates) * 100).toFixed(2));
        }
      });

      teamStats.sort((a, b) => b.netPlates - a.netPlates); // 按净胜盘口数降序排序
      teamStats = teamStats.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));
      resolve(teamStats);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 计算大小盘路榜
 * @param {number} leagueId 联赛序号，必填
 * @param {number} startRound 开始轮次，默认为 1
 * @param {number} endRound 结束轮次，必填
 * @returns {Promise<object>} Promise 对象，解析为生成的大小盘路榜数据。
 */
 function calculateOverUnder(leagueId, startRound = 1, endRound, latestRound = 0) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof leagueId !== 'number' || leagueId <= 0) {
        throw new Error('leagueId 参数无效');
      }

      // 读取文件内容并解析为 JavaScript 数据
      const data = fs.readFileSync(path.resolve(__dirname, `../match/s${leagueId}.js`), 'utf8');
      var jh = [];
      var arrTeam = [];
      eval(data);

      // 如果未传入 endRound，找到第一个 status 为 0 的轮次
      if (!endRound) {
        endRound = Object.keys(jh).find(key => {
          const roundMatches = jh[key];
          return roundMatches && roundMatches.some(match => match[2] === 0);
        });
        if (endRound) {
          endRound = parseInt(endRound.replace('R_', ''), 10);
        } else {
          throw new Error('无法确定 endRound，请检查数据是否正确');
        }
      }

      // 确定计算范围
      const adjustedStartRound = latestRound > 0 ? Math.max(1, endRound - latestRound + 1) : startRound;

      // 验证 arrTeam 和 jh 是否已正确加载
      if (!arrTeam || !Array.isArray(arrTeam)) {
        throw new Error('arrTeam 数据未正确加载或格式不正确');
      }
      if (!jh || typeof jh !== 'object') {
        throw new Error('jh 数据未正确加载或格式不正确');
      }

      // 初始化大小盘路榜数据
      let teamStats = arrTeam.map(team => ({
        teamId: team[0],
        teamName: team[1],
        matchesPlayed: 0,
        overPlates: 0, // 大球数
        flatPlates: 0, // 走盘数
        underPlates: 0, // 小球数
        overRate: 0,   // 大球率
        flatRate: 0,   // 走盘率
        underRate: 0,   // 小球率
      }));

      // 处理指定范围的比赛数据
      for (let round = adjustedStartRound; round <= endRound; round++) {
        const roundKey = `R_${round}`;
        const roundMatches = jh[roundKey];

        if (roundMatches) {
          roundMatches.forEach(match => {
            if (match[1] !== leagueId || match[2] !== -1) return; // 排除非本联赛或未结束的比赛

            const homeTeamId = match[4];
            const awayTeamId = match[5];
            const score = match[6];
            let overUnder = match[12];

            if (!score || !overUnder) return; // 跳过无效数据

            // 处理大小盘格式为 "3/3.5"
            if (typeof overUnder === 'string' && overUnder.includes('/')) {
              const [low, high] = overUnder.split('/').map(Number);
              overUnder = (low + high) / 2;
            } else {
              overUnder = parseFloat(overUnder);
            }

            if (isNaN(overUnder)) return; // 跳过无效数据

            const [homeGoals, awayGoals] = score.split('-').map(Number);
            const result = homeGoals + awayGoals - overUnder;

            const homeTeam = teamStats.find(team => team.teamId === homeTeamId);
            const awayTeam = teamStats.find(team => team.teamId === awayTeamId);

            homeTeam.matchesPlayed++;
            awayTeam.matchesPlayed++;

            // 确定大球、走盘、小球
            if (result > 0) {
              homeTeam.overPlates++;
              awayTeam.overPlates++;
            } else if (result === 0) {
              homeTeam.flatPlates++;
              awayTeam.flatPlates++;
            } else {
              homeTeam.underPlates++;
              awayTeam.underPlates++;
            }
          });
        }
      }

      // 计算比率和排序
      teamStats.forEach(team => {
        const totalPlates = team.overPlates + team.flatPlates + team.underPlates;
        if (totalPlates > 0) {
          team.overRate = parseFloat(((team.overPlates / totalPlates) * 100).toFixed(2));
          team.flatRate = parseFloat(((team.flatPlates / totalPlates) * 100).toFixed(2));
          team.underRate = parseFloat(((team.underPlates / totalPlates) * 100).toFixed(2));
        }
      });

      teamStats.sort((a, b) => b.overRate - a.overRate); // 按大球率降序排序
      teamStats = teamStats.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));
      resolve(teamStats);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 计算NBA联赛积分榜
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 * @returns {Promise<Object>} 返回积分榜数据
 */
 function calculateNBAStandings(startDate, endDate) {
  return new Promise((resolve, reject) => {
    try {
      // 读取2024年10月到2025年1月的数据文件
      const fileNames = [
        'l1_1_2024_10.js', // 读取2024年10月的数据
        'l1_1_2024_11.js', // 读取2024年11月的数据
        'l1_1_2024_12.js', // 读取2024年12月的数据
        'l1_1_2025_1.js'   // 读取2025年1月的数据
      ];
      // 读取比赛数据
      const allData = [];
      let arrTeams = [];
      fileNames.forEach(fileName => {
        const fileData = fs.readFileSync(path.resolve(__dirname, `../match/${fileName}`), 'utf-8');
        var arrTeam = [];
        var arrData = [];
        eval(fileData);
        allData.push(...arrData);
        arrTeams = JSON.parse(JSON.stringify(arrTeam));
        arrData = [];
        arrTeam = [];
      });

      const westernTeams = [1, 24, 20, 28, 23, 19, 17, 22, 29, 27, 26, 18, 21, 11, 25];
      // 脏数据：937和970
      const invalidTeams = [937, 970];
      // 初始化球队数据 全场
      let teamStats = arrTeams.filter(team => !invalidTeams.includes(team[0])) // 过滤脏数据
        .map(team => ({
          teamId: team[0],
          teamName: team[1],
          wins: 0,
          losses: 0,
          conference: westernTeams.includes(team[0]) ? 'West' : 'East' // 判断是否为西部球队
        }));
      
      // 初始化球队数据 上半场
      let firstHalfTeamStats = arrTeams.filter(team => !invalidTeams.includes(team[0])) // 过滤脏数据
        .map(team => ({
          teamId: team[0],
          teamName: team[1],
          wins: 0,
          losses: 0,
          conference: westernTeams.includes(team[0]) ? 'West' : 'East' // 判断是否为西部球队
        }));
      
      // 初始化球队数据 下半场
      let secondHalfTeamStats = arrTeams.filter(team => !invalidTeams.includes(team[0])) // 过滤脏数据
        .map(team => ({
          teamId: team[0],
          teamName: team[1],
          wins: 0,
          losses: 0,
          conference: westernTeams.includes(team[0]) ? 'West' : 'East' // 判断是否为西部球队
        }));
      
      // 获取当前时间
      const currentTime = new Date();

      // 处理比赛数据
      allData.forEach(match => {
        const matchTime = new Date(match[2]); // 比赛时间
        const homeTeamId = match[3];
        const awayTeamId = match[4];
        const homeScore = match[5];
        const awayScore = match[6];
        const firstHalfHomeScore = match[7];
        const firstHalfAwayScore = match[8];
        const secondHalfHomeScore = homeScore - firstHalfHomeScore;
        const secondHalfAwayScore = awayScore - firstHalfAwayScore;

        // 当前时间加 11 小时
        const currentTimePlus11 = new Date(currentTime.getTime() + 11 * 60 * 60 * 1000);

        if (startDate && endDate) {
          const startTime = new Date(startDate).getTime();
          const endTime = new Date(endDate).getTime();
          // 筛选特定时间比赛
          if (matchTime > endTime || matchTime < startTime) {
            return; // 跳过
          }
        }

        // 只有当比赛时间小于当前时间加 11 小时时，才认为比赛已经结束
        if (matchTime >= currentTimePlus11) {
          return; // 跳过未开始的比赛
        }

        // 确保主队和客队得分是有效数字
        if (isNaN(homeScore) || isNaN(awayScore)) {
          return; // 跳过无效得分的比赛
        }

        const homeTeam = teamStats.find(team => team.teamId === homeTeamId);
        const awayTeam = teamStats.find(team => team.teamId === awayTeamId);
        const firstHalfHomeTeam = firstHalfTeamStats.find(team => team.teamId === homeTeamId);
        const firstHalfAwayTeam = firstHalfTeamStats.find(team => team.teamId === awayTeamId);
        const secondHalfHomeTeam = secondHalfTeamStats.find(team => team.teamId === homeTeamId);
        const secondHalfAwayTeam = secondHalfTeamStats.find(team => team.teamId === awayTeamId);

        // 根据得分判断谁赢得比赛
        if (homeScore > awayScore) {
          homeTeam.wins += 1;
          awayTeam.losses += 1;
        } else if (homeScore < awayScore) {
          awayTeam.wins += 1;
          homeTeam.losses += 1;
        } else {
          homeTeam.losses += 1;
          awayTeam.losses += 1;
        }
        if (firstHalfHomeScore > firstHalfAwayScore) {
          firstHalfHomeTeam.wins += 1;
          firstHalfAwayTeam.losses += 1;
        } else if (firstHalfHomeScore < firstHalfAwayScore) {
          firstHalfAwayTeam.wins += 1;
          firstHalfHomeTeam.losses += 1;
        } else {
          firstHalfHomeTeam.losses += 1;
          firstHalfAwayTeam.losses += 1;
        }
        if (secondHalfHomeScore > secondHalfAwayScore) {
          secondHalfHomeTeam.wins += 1;
          secondHalfAwayTeam.losses += 1;
        } else if (secondHalfHomeScore < secondHalfAwayScore) {
          secondHalfAwayTeam.wins += 1;
          secondHalfHomeTeam.losses += 1;
        } else {
          secondHalfHomeTeam.losses += 1;
          secondHalfAwayTeam.losses += 1;
        }
      });

      // 排序和返回数据
      teamStats.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return 0; // 若胜场数相同，保持顺序不变（可以根据其他条件再排序）
      });

      // 排序和返回数据
      firstHalfTeamStats.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return 0; // 若胜场数相同，保持顺序不变（可以根据其他条件再排序）
      });

      firstHalfTeamStats = firstHalfTeamStats.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));

      // 排序和返回数据
      secondHalfTeamStats.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return 0; // 若胜场数相同，保持顺序不变（可以根据其他条件再排序）
      });

      secondHalfTeamStats = secondHalfTeamStats.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));

      const eastStandings = teamStats.filter(team => team.conference === 'East')
        .map((team, index) => ({
          rank: index + 1,
          ...team,
        }));
      const westStandings = teamStats.filter(team => team.conference === 'West')
        .map((team, index) => ({
          rank: index + 1,
          ...team,
        }));
      
      resolve({ eastStandings, westStandings, firstHalfTeamStats, secondHalfTeamStats });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 计算NBA联赛亚让盘路榜
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 * @returns {Promise<Object>} 返回亚让盘路榜数据
 */
 function calculateNBAAsianHandicap(startDate, endDate) {
  return new Promise((resolve, reject) => {
    try {
      // 读取2024年10月到2025年1月的数据文件
      const fileNames = [
        'l1_1_2024_10.js', // 读取2024年10月的数据
        'l1_1_2024_11.js', // 读取2024年11月的数据
        'l1_1_2024_12.js', // 读取2024年12月的数据
        'l1_1_2025_1.js'   // 读取2025年1月的数据
      ];
      // 读取比赛数据
      const allData = [];
      let arrTeams = [];
      fileNames.forEach(fileName => {
        const fileData = fs.readFileSync(path.resolve(__dirname, `../match/${fileName}`), 'utf-8');
        var arrTeam = [];
        var arrData = [];
        eval(fileData);
        allData.push(...arrData);
        arrTeams = JSON.parse(JSON.stringify(arrTeam));
        arrData = [];
        arrTeam = [];
      });

      // 脏数据：937和970
      const invalidTeams = [937, 970];

      // 初始化球队亚盘统计数据
      let teamStats = arrTeams.filter(team => !invalidTeams.includes(team[0])) // 过滤脏数据
        .map(team => ({
          teamId: team[0],
          teamName: team[1],
          matchesPlayed: 0,
          upperPlates: 0,     // 上盘数
          flatPlates: 0,   // 走盘数
          lowerPlates: 0,   // 下盘数
          winPlates: 0, // 赢盘数
          drawPlates: 0, // 走盘数
          losePlates: 0, // 输盘数
          upRate: 0,       // 上盘率
          flatRate: 0,     // 走盘率
          downRate: 0,     // 下盘率
          netPlates: 0     // 净胜盘数
        }));

      // 处理每场比赛数据
      allData.forEach(match => {
        const matchTime = new Date(match[2]); // 比赛时间
        const homeTeamId = match[3];
        const awayTeamId = match[4];
        const homeScore = match[5];
        const awayScore = match[6];
        const asianHandicap = match[10];

        // 确保主队和客队得分是有效数字
        if (isNaN(homeScore) || isNaN(awayScore)) {
          return; // 跳过无效得分的比赛
        }

        // 确保亚盘盘口是有效数字
        if (isNaN(asianHandicap)) return;

        if (startDate && endDate) {
          const startTime = new Date(startDate).getTime();
          const endTime = new Date(endDate).getTime();
          // 筛选特定时间比赛
          if (matchTime > endTime || matchTime < startTime) {
            return; // 跳过
          }
        }

        // 计算调整后的比分
        let result = homeScore - awayScore - asianHandicap; // 主队减去客队得分减去亚盘盘口

        const homeTeam = teamStats.find(team => team.teamId === homeTeamId);
        const awayTeam = teamStats.find(team => team.teamId === awayTeamId);

        homeTeam.matchesPlayed++;
        awayTeam.matchesPlayed++;

        // 确定盘口类型
        if (asianHandicap > 0) {
          homeTeam.upperPlates++;
          awayTeam.lowerPlates++;
        } else if (asianHandicap < 0) {
          homeTeam.lowerPlates++;
          awayTeam.upperPlates++;
        } else {
          homeTeam.flatPlates++;
          awayTeam.flatPlates++;
        }

        // 确定赢盘、走盘、输盘
        if (result > 0) {
          homeTeam.winPlates++;
          awayTeam.losePlates++;
          homeTeam.netPlates++;
          awayTeam.netPlates--;
        } else if (result === 0) {
          homeTeam.drawPlates++;
          awayTeam.drawPlates++;
        } else {
          homeTeam.losePlates++;
          awayTeam.winPlates++;
          homeTeam.netPlates--;
          awayTeam.netPlates++;
        }
      });

      // 计算比率和排序
      teamStats.forEach(team => {
        const totalPlates = team.winPlates + team.drawPlates + team.losePlates;
        if (totalPlates > 0) {
          team.winRate = parseFloat(((team.winPlates / totalPlates) * 100).toFixed(2));
          team.drawRate = parseFloat(((team.drawPlates / totalPlates) * 100).toFixed(2));
          team.loseRate = parseFloat(((team.losePlates / totalPlates) * 100).toFixed(2));
        }
      });

      teamStats.sort((a, b) => b.netPlates - a.netPlates); // 按净胜盘口数降序排序
      teamStats = teamStats.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));

      resolve(teamStats);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 计算NBA联赛大小盘路榜
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 * @returns {Promise<Object>} 返回大小盘路榜数据
 */
 function calculateNBAOverUnder(startDate, endDate) {
  return new Promise((resolve, reject) => {
    try {
      // 读取2024年10月到2025年1月的数据文件
      const fileNames = [
        'l1_1_2024_10.js', // 读取2024年10月的数据
        'l1_1_2024_11.js', // 读取2024年11月的数据
        'l1_1_2024_12.js', // 读取2024年12月的数据
        'l1_1_2025_1.js'   // 读取2025年1月的数据
      ];
      // 读取比赛数据
      const allData = [];
      let arrTeams = [];
      fileNames.forEach(fileName => {
        const fileData = fs.readFileSync(path.resolve(__dirname, `../match/${fileName}`), 'utf-8');
        var arrTeam = [];
        var arrData = [];
        eval(fileData);
        allData.push(...arrData);
        arrTeams = JSON.parse(JSON.stringify(arrTeam));
        arrData = [];
        arrTeam = [];
      });

      // 脏数据：937和970
      const invalidTeams = [937, 970];

      // 初始化球队大小盘统计数据
      let teamStats = arrTeams.filter(team => !invalidTeams.includes(team[0]))  // 过滤脏数据
        .map(team => ({
          teamId: team[0],
          teamName: team[1],
          matchesPlayed: 0,
          overPlates: 0,     // 大球数
          flatPlates: 0,     // 走盘数
          underPlates: 0,    // 小球数
          overRate: 0,       // 大球率
          flatRate: 0,       // 走盘率
          underRate: 0,      // 小球率
          netPlates: 0       // 净胜盘数
        }));

      // 处理每场比赛数据
      allData.forEach(match => {
        const matchTime = new Date(match[2]); // 比赛时间
        const homeTeamId = match[3];
        const awayTeamId = match[4];
        const homeScore = match[5];
        const awayScore = match[6];
        const sizeHandicap = match[11];  // 大小盘口

        // 确保主队和客队得分是有效数字
        if (isNaN(homeScore) || isNaN(awayScore)) {
          return; // 跳过无效得分的比赛
        }

        // 确保大小盘口是有效数字
        if (isNaN(sizeHandicap)) return;

        if (startDate && endDate) {
          const startTime = new Date(startDate).getTime();
          const endTime = new Date(endDate).getTime();
          // 筛选特定时间比赛
          if (matchTime > endTime || matchTime < startTime) {
            return; // 跳过
          }
        }

        // 计算比赛总得分
        const totalScore = homeScore + awayScore;

        // 判断大球、小球、走盘
        if (totalScore > sizeHandicap) {  // 大球
          teamStats.find(team => team.teamId === homeTeamId).overPlates += 1;
          teamStats.find(team => team.teamId === awayTeamId).overPlates += 1;
          teamStats.find(team => team.teamId === homeTeamId).netPlates += 1;
        } else if (totalScore === sizeHandicap) {  // 走盘
          teamStats.find(team => team.teamId === homeTeamId).flatPlates += 1;
          teamStats.find(team => team.teamId === awayTeamId).flatPlates += 1;
        } else {  // 小球
          teamStats.find(team => team.teamId === homeTeamId).underPlates += 1;
          teamStats.find(team => team.teamId === awayTeamId).underPlates += 1;
          teamStats.find(team => team.teamId === awayTeamId).netPlates += 1;
        }
      });

      // 计算每支球队的盘路比率
      teamStats.forEach(team => {
        const totalPlates = team.overPlates + team.flatPlates + team.underPlates;
        if (totalPlates > 0) {
          team.overRate = parseFloat(((team.overPlates / totalPlates) * 100).toFixed(2));
          team.flatRate = parseFloat(((team.flatPlates / totalPlates) * 100).toFixed(2));
          team.underRate = parseFloat(((team.underPlates / totalPlates) * 100).toFixed(2));
        }
      });

      // 按大球率排序
      teamStats.sort((a, b) => b.overRate - a.overRate);

      // 排名
      teamStats = teamStats.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));

      resolve(teamStats);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  calculateStandings,
  calculateAsianHandicap,
  calculateOverUnder,
  calculateNBAStandings,
  calculateNBAAsianHandicap,
  calculateNBAOverUnder,
}