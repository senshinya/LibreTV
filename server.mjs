import path from 'path';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

const password = process.env.PASSWORD || '';

// 启用 CORS
app.use(cors());

app.get(['/', '/index.html', '/player.html'], async (req, res) => {
  try {
    let content;
    switch (req.path) {
      case '/':
      case '/index.html':
        content = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        break;
      case '/player.html':
        content = fs.readFileSync(path.join(__dirname, 'player.html'), 'utf8');
        break;
    }
    if (password !== '') {
      const sha256 = await sha256Hash(password);
      content = content.replace('{{PASSWORD}}', sha256);
    }
    res.send(content)
  } catch (error) {
    console.error(error)
    res.status(500).send('读取静态页面失败')
  }
})

app.get('/proxy/:encodedUrl', async (req, res) => {
  try {
    // 获取 URL 编码的参数
    const encodedUrl = req.params.encodedUrl;

    // 对 URL 进行解码
    const targetUrl = decodeURIComponent(encodedUrl);

    // 安全验证：检查是否为合法 URL
    const isValidUrl = (urlString) => {
      try {
        const parsed = new URL(urlString);
        const allowedProtocols = ['http:', 'https:'];
        const blockedHostnames = ['localhost', '127.0.0.1'];

        return allowedProtocols.includes(parsed.protocol) &&
          !blockedHostnames.includes(parsed.hostname);
      } catch {
        return false;
      }
    };

    // 安全验证
    if (!isValidUrl(targetUrl)) {
      return res.status(400).send('Invalid URL');
    }

    // 发起请求
    const response = await axios({
      method: 'get',
      url: targetUrl,
      responseType: 'stream',
      timeout: 5000
    });

    // 转发响应头（过滤敏感头）
    const headers = { ...response.headers };
    delete headers['content-security-policy'];
    delete headers['cookie'];
    res.set(headers);

    // 管道传输响应流
    response.data.pipe(res);
  } catch (error) {
    if (error.response) {
      error.response.data.pipe(res)
    } else {
      res.status(500).send(error.message)
    }
  }
});

// 静态文件路径
app.use(express.static('./'));

// 计算 SHA-256 哈希值
export async function sha256Hash(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  if (password !== '') {
    console.log('登录密码为：', password);
  }
});

