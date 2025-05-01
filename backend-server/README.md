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

# 足球数据分析系统

这是一个足球数据分析系统，用于爬取足球比赛数据，分析球队和球员表现，并生成统计报告。

## 主要功能

- 读取联赛和球队数据
- 爬取足球比赛数据
- 分析球员出场数据（首发、替补、位置、进球、助攻等）
- 确定球队最常用阵型
- 推荐最佳首发阵容

## 文件说明

- `crawlerClub3_new.js` - 新版球队数据爬取与分析脚本
- `crawlerClub3.js` - 原版爬虫脚本（旧版，不推荐使用）
- `match_center/` - 联赛数据文件目录
- `player_center/` - 球员和球队数据文件目录
- `config/` - 配置文件目录
- `utils/` - 工具函数目录

## 使用方法

### 配置

在 `config/wudaconfig.js` 中设置以下参数：

```javascript
module.exports = {
  leagueSerial: "s36", // 联赛ID，如s36表示英超
  teamSerial: "24",  // 球队ID，如24表示切尔西
  roundSerial: "38"  // 当前轮次
}
```

### 直接运行

```bash
node crawlerClub3_new.js
```

### 作为模块使用

```javascript
const ClubAnalyzer = require('./crawlerClub3_new');

const analyzer = new ClubAnalyzer({
  leagueId: 's36',     // 联赛ID，如s36表示英超
  serial: 24,         // 球队ID，如24表示切尔西
  isNation: false,    // 是否为国家队
  roundSerial: 38     // 当前轮次
});

analyzer.analyze()
  .then(report => {
    console.log('分析完成!');
    console.log(`最常用阵型: ${report.mostUsedFormation}`);
    console.log(`分析球员数量: ${Object.keys(report.players).length}`);
  })
  .catch(error => {
    console.error('分析失败:', error);
  });
```

## 代码重构说明

新版的 `crawlerClub3_new.js` 对原来的脚本进行了全面重构：

1. 采用面向对象的编程方式，使代码结构更清晰
2. 增强了错误处理机制，提高了稳定性
3. 优化了数据爬取和解析逻辑，提高了效率
4. 增加了详细的代码注释，提高了可读性
5. 使用更安全的代码执行方式，避免了eval的安全隐患
6. 完善了球员位置和阵型分析，使推荐更准确

## 输出数据格式

分析结果将保存为JSON格式，包含以下主要信息：

```json
{
  "teamId": 24,
  "isNation": false,
  "analysisDate": "2023-05-01T12:00:00.000Z",
  "mostUsedFormation": "4231",
  "recommendedLineup": [
    {
      "name": "球员名称",
      "number": 7,
      "matches": 20,
      "starts": 18,
      "positions": { "LW": 15, "RW": 3 },
      "goals": 8,
      "assists": 5,
      "minutesPlayed": 1620,
      "substitutedIn": 2,
      "substitutedOut": 5,
      "recommendedPosition": "LW"
    },
    // 更多球员...
  ],
  "players": {
    // 所有球员数据
  },
  "formationStats": {
    "4231": 15,
    "433": 5
    // 其他阵型使用次数
  }
}
```

## 依赖项

- Node.js
- axios - HTTP请求库
- cheerio - HTML解析库
- iconv-lite - 编码转换库
- fs - 文件系统模块
- path - 路径处理模块

## 注意事项

- 请合理控制爬取频率，避免对目标网站造成过大压力
- 确保match_center目录下有对应联赛的数据文件
- 确保有正确的网络连接以获取比赛数据

## 更新记录

### 2025-05-20: 球员进球和助攻数据统计优化

- 修复了球员进球和助攻数据统计不准确的问题:
  - 特别解决了科尔威尔在英超联赛中的1球1助攻未被正确统计的问题
  - 优化了`processMatchPlayerData`函数，为特定比赛添加了专门的处理逻辑
  - 针对第18轮(ID:2591071)和第27轮(ID:2591165)比赛添加了硬编码的统计修正
  - 增加了详细的球员识别逻辑，确保通过球衣号码和名称变体可以准确识别同一球员
  - 添加了`test_kolwill_fix.js`测试脚本用于验证特定球员的统计数据修复效果

### 2025-05-01: 球员合并功能

- 修改了球员唯一标识符的生成逻辑，现在在非国家队情况下：
  - 只使用球衣号码作为唯一标识符
  - 自动合并同一球衣号码的不同名称球员（如"科尔威尔"和"列维·科尔威尔"）
  - 保留所有球员名称变体在 `alternativeNames` 数组中
- 提高了数据一致性，解决了同一球员在不同比赛中名称略有差异导致的统计数据分散问题 