const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const {
  calculateStandings,
  calculateAsianHandicap,
  calculateOverUnder,
  calculateNBAStandings,
  calculateNBAAsianHandicap,
  calculateNBAOverUnder,
} = require('./calculate/calculate/index.js');

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 配置static指向的路径
app.use('/static', express.static(path.resolve('./', 'public', 'images')));

const logger = (req, res, next) => {
  console.log(new Date() + ' - ' + req.method + ' - ' + 'Request to ' + req.path);
  next();
};

app.use(logger);

app.get('/', (req, res, next) => {
  res.send('mock api server is working...');
});

app.get('*', function (req, res){
  res.status(404).json({ success: false, message: `path ${req.path} not found`});
});

app.post('/api/calculate-standings', async (req, res) => {
  const { leagueId, startRound, endRound } = req.body;
  try {
    const standings = await calculateStandings(leagueId || 36, startRound, endRound, 0);
    res.status(200).json({ message: '积分榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: '积分榜生成失败', error: error.message })
  }
});

app.post('/api/calculate-asian-handicap', async (req, res) => {
  const { leagueId, startRound, endRound } = req.body;
  try {
    const standings = await calculateAsianHandicap(leagueId || 36, startRound, endRound, 0);
    res.status(200).json({ message: '亚让盘路榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: '亚让盘路榜生成失败', error: error.message })
  }
});

app.post('/api/calculate-over-under', async (req, res) => {
  const { leagueId, startRound, endRound } = req.body;
  try {
    const standings = await calculateOverUnder(leagueId || 36, startRound, endRound, 0);
    res.status(200).json({ message: '大小盘路榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: '大小盘路榜生成失败', error: error.message })
  }
});

app.post('/api/calculate-nba-standings', async (req, res) => {
  const { startDate, endDate } = req.body;
  try {
    const standings = await calculateNBAStandings(startDate, endDate);
    res.status(200).json({ message: 'NBA积分榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: 'NBA积分榜生成失败', error: error.message })
  }
});

app.post('/api/calculate-nba-asian-handicap', async (req, res) => {
  const { startDate, endDate } = req.body;
  try {
    const standings = await calculateNBAAsianHandicap(startDate, endDate);
    res.status(200).json({ message: 'NBA亚让盘路榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: 'NBA亚让盘路榜生成失败', error: error.message });
  }
});

app.post('/api/calculate-nba-over-under', async (req, res) => {
  const { startDate, endDate } = req.body;
  try {
    const standings = await calculateNBAOverUnder(startDate, endDate);
    res.status(200).json({ message: 'NBA大小盘路榜生成成功', data: standings });
  } catch (error) {
    res.status(500).json({ message: 'NBA大小盘路榜生成失败', error: error.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Express Server started ... listen at ${process.env.PORT || 5000}`);
});