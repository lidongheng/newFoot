# Backend Server

这是一个基于Express.js的后端服务器项目。

## 安装依赖

```bash
# 使用pnpm
pnpm install

# 或使用npm
npm install
```

## 启动服务器

### 开发模式（带热更新）

```bash
# 使用pnpm
pnpm dev

# 或使用npm
npm run dev
```

使用开发模式启动服务器后，每当你修改代码，服务器会自动重启，无需手动停止和启动。

### 生产模式

```bash
# 使用pnpm
pnpm start

# 或使用npm
npm start
```

## 项目结构

```
backend-server/
├── index.js           # 主入口文件
├── package.json       # 项目配置
├── nodemon.json       # nodemon配置（热更新）
├── public/            # 静态资源
│   └── images/        # 图片资源
├── routes/            # 路由模块
│   ├── index.js       # 路由入口
│   ├── calculate/     # 计算模块路由
│   ├── crawler/       # 爬虫模块路由
│   └── analysis/      # 分析模块路由
└── calculate/         # 计算模块实现
```

## API路径说明

所有API均以`/api`为前缀，各模块的路由路径如下：

### 计算模块 `/api/calculate`

- `/api/calculate/standings` - 足球积分榜计算
- `/api/calculate/asian-handicap` - 足球亚盘计算
- `/api/calculate/over-under` - 足球大小盘计算
- `/api/calculate/nba-standings` - NBA积分榜计算
- `/api/calculate/nba-asian-handicap` - NBA亚盘计算
- `/api/calculate/nba-over-under` - NBA大小盘计算

### 爬虫模块 `/api/crawler`

- `/api/crawler/football-matches` - 爬取足球比赛数据
- `/api/crawler/nba-matches` - 爬取NBA比赛数据
- `/api/crawler/odds` - 爬取赔率数据

### 分析模块 `/api/analysis`

- `/api/analysis/football-analysis` - 足球比赛数据分析
- `/api/analysis/nba-analysis` - NBA比赛数据分析
- `/api/analysis/odds-trend` - 赔率趋势分析

## 热更新说明

本项目使用nodemon实现热更新功能，当你修改任何.js文件时，服务器会自动重启。项目已配置`nodemon.json`文件：

```json
{
  "watch": ["index.js", "calculate/"],
  "ext": "js,json",
  "ignore": ["node_modules/"],
  "delay": "500",
  "verbose": true,
  "env": {
    "NODE_ENV": "development"
  },
  "colours": true,
  "execMap": {
    "js": "node"
  }
}
```

这会让nodemon监视index.js和calculate目录中的所有文件变化，并在文件保存后延迟500毫秒重启服务器。 