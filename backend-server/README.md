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

- `index.js` - 主要的应用入口文件
- `calculate/` - 计算相关的模块

## 热更新说明

本项目使用nodemon实现热更新功能，当你修改任何.js文件时，服务器会自动重启。如需自定义nodemon配置，可以在项目根目录创建`nodemon.json`文件：

```json
{
  "watch": ["index.js", "calculate/"],
  "ext": "js,json",
  "ignore": ["node_modules/"],
  "delay": "1000"
}
```

这会让nodemon监视index.js和calculate目录中的所有文件变化，并在文件保存后延迟1秒重启服务器。 