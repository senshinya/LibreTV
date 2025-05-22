# LibreTV - 免费在线视频搜索与观看平台

<div align="center">
  <img src="image/logo.png" alt="LibreTV Logo" width="120">
  <br>
  <p><strong>自由观影，畅享精彩</strong></p>
</div>

## 📺 项目简介

LibreTV 是一个轻量级、免费的在线视频搜索与观看平台，提供来自多个视频源的内容搜索与播放服务。无需注册，即开即用，支持多种设备访问。项目结合了前端技术和后端代理功能，可部署在支持服务端功能的各类网站托管服务上。

本项目基于 [bestK/tv](https://github.com/bestK/tv) 进行重构与增强。

<details>
  <summary>点击查看项目截图</summary>
  <img src="https://github.com/user-attachments/assets/df485345-e83b-4564-adf7-0680be92d3c7" alt="项目截图" style="max-width:600px">
</details>

## 🥇 感谢赞助

- **[YXVM](https://yxvm.com)**  
- **[VTEXS](https://vtexs.com)**

## 🚀 快速部署

选择以下任一平台，点击一键部署按钮，即可快速创建自己的 LibreTV 实例：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLibreSpark%2FLibreTV) [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/LibreSpark/LibreTV) 

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/LibreSpark/LibreTV) 

## ⚠️ 请勿使用 Pull Bot 自动同步

Pull Bot 会反复触发无效的 PR 和垃圾邮件，严重干扰项目维护。作者可能会直接拉黑所有 Pull Bot 自动发起的同步请求的仓库所有者。

**推荐做法：**

建议在 fork 的仓库中启用本仓库自带的 GitHub Actions 自动同步功能（见 `.github/workflows/sync.yml`）。 

如需手动同步主仓库更新，也可以使用 GitHub 官方的 [Sync fork](https://docs.github.com/cn/github/collaborating-with-issues-and-pull-requests/syncing-a-fork) 功能。


## 📋 详细部署指南

### Cloudflare Pages

1. Fork 或克隆本仓库到您的 GitHub 账户
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 Pages 服务
3. 点击"创建项目"，连接您的 GitHub 仓库
4. 使用以下设置：
   - 构建命令：留空（无需构建）
   - 输出目录：留空（默认为根目录）
5. 点击"保存并部署"
6. 可选：在"设置" > "环境变量"中配置密码保护

### Vercel

1. Fork 或克隆本仓库到您的 GitHub/GitLab 账户
2. 登录 [Vercel](https://vercel.com/)，点击"New Project"
3. 导入您的仓库，使用默认设置
4. 点击"Deploy"
5. 可选：在"Settings" > "Environment Variables"中配置密码保护


### Docker

使用 Docker 运行 LibreTV：

```bash
docker run -d \
  --name libretv \
  -p 8899:80 \
  -e PASSWORD=your_password_here \
  bestzwei/libretv:latest
```

访问 `http://localhost:8899` 即可使用。

### Docker Compose

 `docker-compose.yml` 文件：

```yaml
version: '3'
services:
  libretv:
    image: bestzwei/libretv:latest
    container_name: libretv
    ports:
      - "8899:80"
    environment:
      - PASSWORD=111111
    restart: unless-stopped
```

### 本地开发环境

项目包含后端代理功能，需要支持服务器端功能的环境：

```bash
# 首先，通过复制示例来设置 .env 文件（可选）
cp .env.example .env

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:8080` 即可使用（端口可在.env文件中通过PORT变量修改）。

> ⚠️ 注意：使用简单静态服务器（如 `python -m http.server` 或 `npx http-server`）时，视频代理功能将不可用，视频无法正常播放。完整功能测试请使用 Node.js 开发服务器。

## 🔧 自定义配置

### 密码保护

要为您的 LibreTV 实例添加密码保护，可以在部署平台上设置环境变量：

**环境变量名**: `PASSWORD` 
**值**: 您想设置的密码

各平台设置方法：

- **Cloudflare Pages**: Dashboard > 您的项目 > 设置 > 环境变量
- **Vercel**: Dashboard > 您的项目 > Settings > Environment Variables
- **Netlify**: Dashboard > 您的项目 > Site settings > Build & deploy > Environment
- **Docker**: 使用 `-e PASSWORD=your_password` 参数
- **本地开发**: SET PASSWORD=your_password

### API兼容性

LibreTV 支持标准的苹果 CMS V10 API 格式。添加自定义 API 时需遵循以下格式：
- 搜索接口: `https://example.com/api.php/provide/vod/?ac=videolist&wd=关键词`
- 详情接口: `https://example.com/api.php/provide/vod/?ac=detail&ids=视频ID`

**添加 CMS 源**:
1. 在设置面板中选择"自定义接口"
2. 接口地址: `https://example.com/api.php/provide/vod`

## ⌨️ 键盘快捷键

播放器支持以下键盘快捷键：

- **空格键**: 播放/暂停
- **左右箭头**: 快退/快进
- **上下箭头**: 音量增加/减小
- **M 键**: 静音/取消静音
- **F 键**: 全屏/退出全屏
- **Esc 键**: 退出全屏

## 🛠️ 技术栈

- HTML5 + CSS3 + JavaScript (ES6+)
- Tailwind CSS
- HLS.js 用于 HLS 流处理
- DPlayer 视频播放器核心
- Cloudflare/Vercel/Netlify Serverless Functions
- 服务端 HLS 代理和处理技术
- localStorage 本地存储

## ⚠️ 免责声明

LibreTV 仅作为视频搜索工具，不存储、上传或分发任何视频内容。所有视频均来自第三方 API 接口提供的搜索结果。如有侵权内容，请联系相应的内容提供方。

本项目开发者不对使用本项目产生的任何后果负责。使用本项目时，您必须遵守当地的法律法规。

## 💝 支持项目

如果您想支持本项目，可以考虑进行捐款：

[![捐赠](https://img.shields.io/badge/捐赠-UNICEF-1a85ff?style=for-the-badge&logo=unicef)](https://www.unicef.org/zh)
