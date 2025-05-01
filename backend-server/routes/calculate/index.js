const express = require('express');
const router = express.Router();
const {
  calculateStandings,
  calculateAsianHandicap,
  calculateOverUnder,
  calculateNBAStandings,
  calculateNBAAsianHandicap,
  calculateNBAOverUnder,
} = require('../../calculate/calculate/index.js');

// 足球积分榜计算
router.post('/standings', async (req, res) => {
  const { leagueId, startRound, endRound } = req.body;
  try {
    const standings = await calculateStandings(leagueId || 36, startRound, endRound, 0);
    res.status(200).json({ message: '积分榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: '积分榜生成失败', error: error.message })
  }
});

// 足球亚盘计算
router.post('/asian-handicap', async (req, res) => {
  const { leagueId, startRound, endRound } = req.body;
  try {
    const standings = await calculateAsianHandicap(leagueId || 36, startRound, endRound, 0);
    res.status(200).json({ message: '亚让盘路榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: '亚让盘路榜生成失败', error: error.message })
  }
});

// 足球大小盘计算
router.post('/over-under', async (req, res) => {
  const { leagueId, startRound, endRound } = req.body;
  try {
    const standings = await calculateOverUnder(leagueId || 36, startRound, endRound, 0);
    res.status(200).json({ message: '大小盘路榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: '大小盘路榜生成失败', error: error.message })
  }
});

// NBA积分榜计算
router.post('/nba-standings', async (req, res) => {
  const { startDate, endDate } = req.body;
  try {
    const standings = await calculateNBAStandings(startDate, endDate);
    res.status(200).json({ message: 'NBA积分榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: 'NBA积分榜生成失败', error: error.message })
  }
});

// NBA亚盘计算
router.post('/nba-asian-handicap', async (req, res) => {
  const { startDate, endDate } = req.body;
  try {
    const standings = await calculateNBAAsianHandicap(startDate, endDate);
    res.status(200).json({ message: 'NBA亚让盘路榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: 'NBA亚让盘路榜生成失败', error: error.message });
  }
});

// NBA大小盘计算
router.post('/nba-over-under', async (req, res) => {
  const { startDate, endDate } = req.body;
  try {
    const standings = await calculateNBAOverUnder(startDate, endDate);
    res.status(200).json({ message: 'NBA大小盘路榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: 'NBA大小盘路榜生成失败', error: error.message });
  }
});

module.exports = router; 