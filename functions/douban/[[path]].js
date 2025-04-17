const urlMap = {
  // 豆瓣
  'movie_showing': 'douban/list/movie_showing',
  'movie_real_time_hotest': 'douban/list/movie_real_time_hotest',
  'tv_real_time_hotest': 'douban/list/tv_real_time_hotest',
  'movie_weekly_best': 'douban/list/movie_weekly_best',
  'tv_chinese_best_weekly': 'douban/list/tv_chinese_best_weekly',
  'tv_global_best_weekly': 'douban/list/tv_global_best_weekly',
  'tv_domestic': 'douban/list/EC74443FY',
  'tv_american': 'douban/list/ECFA5DI7Q',
  'tv_japanese': 'douban/list/ECNA46YBA',
  'tv_korean': 'douban/list/ECBE5CBEI',
  'tv_animation': 'douban/list/tv_animation',
  'recommended_tv': 'douban/recommended/tv',
  'recommended_movie': 'douban/recommended/movie',
};

function getMappedPath(path) {
  // 移除开头的斜杠
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;

  // 检查是否有直接映射
  if (urlMap[normalizedPath]) {
    return urlMap[normalizedPath];
  }

  // 没有找到映射
  return null;
}

export async function onRequest(context) {
  const { request, env, next, waitUntil } = context; // next 和 waitUntil 可能需要
  const url = request.url;

  // 创建标准化的响应
  function createResponse(body, status = 200, headers = {}) {
    const responseHeaders = new Headers(headers);
    // 关键：添加 CORS 跨域头，允许前端 JS 访问代理后的响应
    responseHeaders.set("Access-Control-Allow-Origin", "*"); // 允许任何来源访问
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS"); // 允许的方法
    responseHeaders.set("Access-Control-Allow-Headers", "*"); // 允许所有请求头

    // 处理 CORS 预检请求 (OPTIONS) - 放在这里确保所有响应都处理
     if (request.method === "OPTIONS") {
         // 使用下面的 onOptions 函数可以更规范，但在这里处理也可以
         return new Response(null, {
             status: 204, // No Content
             headers: responseHeaders // 包含上面设置的 CORS 头
         });
     }

    return new Response(body, { status, headers: responseHeaders });
  }
  
  try {
    const path = url.replace(/^\/douban\//, '');
    if (!path) {
      // 如果没有提供路径，返回可用映射列表
      return createResponse(JSON.stringify({
        message: 'Welcome to RSSHub JSON API',
        availablePaths: urlMap,
        usage: 'Use /{path} to fetch mapped RSSHub content'
      }), 200);
    }

    // 获取映射的RSSHub路径
    const rsshubPath = getMappedPath(path);

    // 如果没有找到映射，检查是否允许直接传递路径
    const allowDirectPath = process.env.ALLOW_DIRECT_PATH === 'true';

    if (!rsshubPath && !allowDirectPath) {
      return createResponse(JSON.stringify({
        error: 'Path not found in URL mapping',
        availablePaths: urlMap
      }), 404);
    }

    // 构建RSSHub URL
    // 定义可用的RSSHub基础URL数组
    const rsshubBaseUrls = [
      'https://rsshub.ktachibana.party',
      'https://rsshub.rssforever.com',
      'https://rss.tailhare.com',
      'https://rsshub.nerr.xyz',
      'https://rss.orcx.xyz',
      'https://rsshub.s8.theoutpostsof.space',
      'https://rss.xxu.do',
      'https://rsshub.125809.xyz',
      'https://rss.delcarpan.top'
    ];
    // 从数组中随机选择一个URL
    const rsshubBaseUrl = rsshubBaseUrls[Math.floor(Math.random() * rsshubBaseUrls.length)];

    // 使用映射的路径或原始路径（如果允许）
    const finalPath = rsshubPath || path;
    const rsshubUrl = `${rsshubBaseUrl}/${finalPath}`;

    console.log(`Fetching RSS from: ${rsshubUrl}`);

    // 获取RSS内容
    const response = await fetch(rsshubUrl);

    if (!response.ok) {
      return createResponse(JSON.stringify({
        error: `Failed to fetch RSS: ${response.statusText}`,
        status: response.status,
        url: rsshubUrl
      }), response.status);
    }

    // 获取RSS文本内容
    const rssContent = await response.text();

    // 转换为JSON
    const jsonData = convertRssToJson(rssContent);

    // 添加元数据
    jsonData._meta = {
      source: rsshubUrl,
      mappedFrom: path,
      mappedTo: finalPath,
      fetchedAt: new Date().toISOString()
    };

    headers = {
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    }

    // 返回JSON响应
    return createResponse(jsonData, 200, headers);
  } catch (error) {
    console.error('Error processing request:', error);
    return createResponse(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), 500);
  }
}

function convertRssToJson(rssContent) {
  // 使用JSDOM创建一个虚拟DOM环境
  const dom = new JSDOM(rssContent, { contentType: 'text/xml' });
  const xmlDoc = dom.window.document;
  
  // 获取频道信息
  const channel = xmlDoc.querySelector("channel");
  const title = channel.querySelector("title")?.textContent.trim() || '';
  const link = channel.querySelector("link")?.textContent.trim() || '';
  const description = channel.querySelector("description")?.textContent.trim() || '';
  const language = channel.querySelector("language")?.textContent.trim() || null;
  const lastBuildDate = channel.querySelector("lastBuildDate")?.textContent.trim() || null;
  
  // 获取所有条目
  const itemElements = channel.querySelectorAll("item");
  const items = Array.from(itemElements).map(item => {
    // 提取标题
    const itemTitle = item.querySelector("title")?.textContent.trim() || '';
    
    // 提取链接
    const itemLink = item.querySelector("link")?.textContent.trim() || '';
    
    // 解析描述内容
    const descriptionHTML = item.querySelector("description")?.textContent.trim() || '';
    const descriptionDom = new JSDOM(descriptionHTML, { contentType: 'text/html' });
    const descriptionDoc = descriptionDom.window.document;
    const paragraphs = descriptionDoc.querySelectorAll("p");
    
    // 提取评分（如果有）
    let rating = null;
    if (paragraphs.length > 1 && !isNaN(parseFloat(paragraphs[1]?.textContent))) {
      rating = paragraphs[1].textContent.trim();
    }
    
    // 提取描述（通常是第二个或第三个段落）
    let description = "";
    for (let i = 0; i < paragraphs.length; i++) {
      const text = paragraphs[i]?.textContent.trim();
      if (text && text !== itemTitle && !(!isNaN(parseFloat(text)) && text.length < 5)) {
        description = text;
        break;
      }
    }
    
    // 提取海报URL
    const imgElement = descriptionDoc.querySelector("img");
    const posterUrl = imgElement ? imgElement.getAttribute("src") : null;
    
    return {
      title: itemTitle,
      description,
      posterUrl,
      link: itemLink,
      rating
    };
  });
  
  // 构建最终的JSON对象
  return {
    title,
    link,
    description,
    language,
    lastBuildDate,
    items
  };
}