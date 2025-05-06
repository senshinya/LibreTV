-- 解码URL函数
local function decode_uri(uri)
    ngx.log(ngx.DEBUG, "decode_uri 输入: ", uri)
    local decoded = ngx.unescape_uri(uri)
    ngx.log(ngx.DEBUG, "decode_uri 输出: ", decoded)
    return decoded
end

-- 直接从请求URI获取完整URL
local request_uri = ngx.var.request_uri
ngx.log(ngx.DEBUG, "完整请求URI: ", request_uri)

-- 提取/proxy/后面的部分
local _, _, target_path = string.find(request_uri, "^/proxy/(.*)")
ngx.log(ngx.DEBUG, "提取的目标路径: ", target_path or "nil")

if not target_path or target_path == "" then
    ngx.log(ngx.ERR, "未提供目标URL，返回400")
    ngx.status = 400
    ngx.say("错误: 未提供目标URL")
    return ngx.exit(400)
end

-- 解码URL
local target_url = decode_uri(target_path)
ngx.log(ngx.DEBUG, "解码后的目标URL: ", target_url)

if not target_url or target_url == "" then
    ngx.log(ngx.ERR, "无法解析目标URL，返回400")
    ngx.status = 400
    ngx.say("错误: 无法解析目标URL")
    return ngx.exit(400)
end

-- 记录日志
ngx.log(ngx.STDERR, "代理请求: ", target_url)

-- 设置目标URL变量供Nginx使用
ngx.var.target_url = target_url

ngx.log(ngx.DEBUG, "已设置 ngx.var.target_url: ", ngx.var.target_url)

-- 继续执行Nginx配置的其余部分
return