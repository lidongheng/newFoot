const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 配置static指向的路径
app.use('/static', express.static(path.resolve('./', 'public', 'images')));

// 请求日志中间件
const logger = (req, res, next) => {
  console.log(new Date() + ' - ' + req.method + ' - ' + 'Request to ' + req.path);
  next();
};

app.use(logger);

// 根路由
app.get('/', (req, res) => {
  res.send('mock api server is working...');
});

// 注册API路由
app.use('/api', routes);

// 404处理
app.get('*', function (req, res){
  res.status(404).json({ success: false, message: `path ${req.path} not found`});
});

// 启动服务器
app.listen(process.env.PORT || 5000, () => {
  console.log(`Express Server started ... listen at ${process.env.PORT || 5000}`);
});