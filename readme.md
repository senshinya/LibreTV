# LibreTV - 免费在线视频搜索与观看平台

## 📺 项目简介

LibreTV是一个轻量级、免费的在线视频搜索与观看平台，提供来自多个视频源的内容搜索与播放服务。无需注册，即开即用，支持多种设备访问。项目结合了前端技术和后端代理功能，可部署在支持服务端功能的各类网站托管服务上。

本项目基于 https://github.com/bestK/tv

演示站：(请自行部署，不再提供演示站)

<img src="https://testingcf.jsdelivr.net/gh/bestZwei/imgs@master/picgo/image-20250406231222216.png" alt="image-20250406231222216" style="zoom:67%;" />

**感谢 [NodeSupport](https://www.nodeseek.com/post-305185-1) 友情赞助**

## ✨ 主要特性

- 🔍 多源视频搜索功能，覆盖电影、电视剧等内容
- 📱 响应式设计，完美支持电脑、平板和手机
- 🌐 聚合多个视频源，自动提取播放链接
- 🔄 支持自定义API接口，灵活扩展
- 💾 本地存储搜索历史，提升使用体验
- 🚫 内置视频代理功能，解决跨域问题
- 🛡️ 内置广告过滤功能，提供更干净的观影体验
- 🎬 自定义视频播放器，支持HLS流媒体格式
- 🔒 可选密码保护，增强访问控制
- ⌨️ 键盘快捷键支持，提高观影体验

## ⌨️ 键盘快捷键

LibreTV播放器支持以下键盘快捷键：

- **Alt + 左箭头**：播放上一集
- **Alt + 右箭头**：播放下一集
- **空格键**：暂停/播放
- **左/右箭头**：快退/快进5秒
- **上/下箭头**：调整音量
- **F**：全屏/退出全屏

### CMS采集站源兼容性

本项目支持标准的苹果CMS V10 API格式。自定义API需遵循以下格式：
- 搜索接口: `https://example.com/api.php/provide/vod/?ac=videolist&wd=关键词`
- 详情接口: `https://example.com/api.php/provide/vod/?ac=detail&ids=视频ID`

**重要提示**: 像 `https://360zy.com/api.php/provide/vod` 这样的CMS源需要按照以下格式添加：
1. 在设置面板中选择"自定义接口"
2. 接口地址只填写到域名部分: `https://360zy.com`（不要包含`/api.php/provide/vod`部分）
3. 项目会自动补全正确的路径格式

如果CMS接口非标准格式，可能需要修改项目中的`config.js`文件中的`API_CONFIG.search.path`和`API_CONFIG.detail.path`配置。

## 🛠️ 技术栈

- HTML5 + CSS3 + JavaScript (ES6+)
- Tailwind CSS (通过CDN引入)
- HLS.js 用于HLS流处理和广告过滤
- DPlayer 视频播放器核心
- Cloudflare/Vercel/Netlify Serverless Functions
- 服务端HLS代理和处理技术
- 前端API请求拦截技术
- localStorage本地存储

## 🚀 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLibreSpark%2FLibreTV)

## 🚀 部署指南

### Cloudflare Pages部署

1. Fork或克隆本仓库到你的GitHub账户
2. 登录Cloudflare Dashboard，进入Pages服务
3. 点击"创建项目"，连接GitHub仓库
4. 使用以下设置：
   - 构建命令：留空（无需构建）
   - 输出目录：留空（默认为根目录）
   - 部署命令：留空
5. 点击"保存并部署"

### Vercel/Netlify部署

类似Cloudflare Pages，只需连接仓库并部署即可，无需特殊配置。

### 本地测试

项目现在包含后端代理功能，需要支持服务器端功能的环境：

```bash
# 使用 Node.js 启动（推荐）
# 先安装依赖
npm install
# 启动开发服务器
npm run dev

# 如果仍想使用简单的静态服务器测试前端部分
# 注意：视频代理功能将不可用，会导致视频无法播放
python -m http.server 8080
# 或
npx http-server -p 8080
```

> ⚠️ 注意：使用简单静态服务器时，视频代理功能将不可用，视频播放功能会受到影响。完整功能测试请使用 Vercel CLI 或正确配置的开发服务器。

### Docker 部署

```bash
docker pull bestzwei/libretv:latest
docker run -d --name libretv -p 8899:80 bestzwei/libretv:latest
```

访问 http://localhost:8899 查看效果。

### Docker Compose 部署

你也可以通过 Docker Compose 部署本项目。新建一个名为 `docker-compose.yaml` 的文件，内容如下：

```yaml
version: '3'
services:
  libretv:
    image: bestzwei/libretv:latest
    container_name: libretv
    ports:
      - "8899:80"
    restart: unless-stopped
```

## 🔧 自定义配置

### 密码保护功能

LibreTV 现在支持密码保护功能，可以通过环境变量设置访问密码。当设置了 `PASSWORD` 环境变量后，用户首次访问网站时需要输入密码才能继续使用。

- 如果 `PASSWORD` 环境变量为空或未设置，将不启用密码保护。
- 密码验证状态会保存在浏览器本地存储中，有效期默认为三个月。

不同部署平台设置密码的方法：

#### Cloudflare Pages

1. 进入 Cloudflare Dashboard > Pages > 你的项目
2. 点击"设置" > "环境变量"
3. 添加新的变量:
   - 变量名: `PASSWORD`
   - 值: 你想设置的密码
4. 选择应用于"生产环境"或同时包括"预览环境"
5. 保存并重新部署项目

#### Vercel

1. 进入 Vercel Dashboard > 你的项目
2. 点击"设置" > "环境变量"
3. 添加新的环境变量:
   - 名称: `PASSWORD`
   - 值: 你想设置的密码
4. 选择作用范围(生产/预览/开发环境)
5. 点击"保存"并重新部署项目

#### Docker/Docker Compose

使用 Docker 运行时，可以通过环境变量传递密码:

```bash
# 使用 Docker 命令
docker run -d --name libretv -p 8899:80 -e PASSWORD=your_password_here bestzwei/libretv:latest
```

使用 Docker Compose，在 `docker-compose.yml` 文件中设置:

```yaml
version: '3'
services:
  libretv:
    image: bestzwei/libretv:latest
    container_name: libretv
    ports:
      - "8899:80"
    environment:
      - PASSWORD=your_password_here  # 留空则不启用密码保护
    restart: unless-stopped
```

#### 本地测试环境

对于本地测试，你可以在启动服务器之前设置环境变量:

```bash
# Linux/MacOS
export PASSWORD=your_password_here
python -m http.server 8080

# Windows
set PASSWORD=your_password_here
python -m http.server 8080
```

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=LibreSpark/LibreTV&type=Date)](https://www.star-history.com/#LibreSpark/LibreTV&Date)

## ⚠️ 免责声明

LibreTV 仅作为视频搜索工具，不存储、上传或分发任何视频内容。所有视频均来自第三方API接口提供的搜索结果。如有侵权内容，请联系相应的内容提供方。

## 🔄 更新日志

- 1.0.0 (2025-04-06): 初始版本发布
- 1.0.1 (2025-04-07): 添加广告过滤功能，优化播放器性能
- 1.0.2 (2025-04-08): 分离了播放页面，优化视频源API兼容性
- 1.0.3 (2025-04-13): 性能优化、UI优化、更新设置功能
- 1.1.0 (2025-04-17): 添加服务端代理功能，支持HLS流处理和解析，支持环境变量设置访问密码
