# 路由模块说明

本项目采用模块化的路由结构，将不同功能的API路由分离到不同的模块中，使代码结构更加清晰。

## 路由结构

```
routes/
├── index.js             # 路由入口文件，汇总所有模块路由
├── calculate/           # 计算模块路由
│   └── index.js         # 计算相关API
├── crawler/             # 爬虫模块路由
│   └── index.js         # 数据爬取相关API
└── analysis/            # 分析模块路由
    └── index.js         # 数据分析相关API
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

## 如何添加新路由

1. 在相应模块目录下编辑或创建路由文件
2. 在路由文件中定义新的路由处理函数
3. 确保路由文件被正确导出并在上级路由中注册

示例：

```javascript
// 在analysis模块中添加新路由
const express = require('express');
const router = express.Router();

// 添加新路由
router.post('/new-analysis', async (req, res) => {
  try {
    // 实现功能逻辑
    res.status(200).json({ message: '新分析功能成功', data: {} });
  } catch (error) {
    res.status(500).json({ message: '新分析功能失败', error: error.message });
  }
});

module.exports = router;
``` 