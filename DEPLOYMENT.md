# 🚀 部署指南

本指南介绍如何将音乐学习助手部署到各种平台。

## 前置要求

- Node.js 18+
- pnpm 10+
- Git账户（可选，用于自动部署）

## 本地构建

### 1. 开发模式
```bash
cd music-app
pnpm install
pnpm dev
```
访问 http://localhost:5173/

### 2. 生产构建
```bash
pnpm build
```
输出目录: `dist/`

### 3. 预览生产包
```bash
pnpm preview
```

## 云平台部署

### 方案1: Netlify (推荐)

#### 快速部署 (1-2分钟)
```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 部署
cd music-app
netlify deploy --prod
```

#### Git自动部署
1. 推送代码到GitHub/GitLab
2. 连接Netlify应用到仓库
3. 选择以下设置:
   - Build command: `pnpm install && pnpm build`
   - Publish directory: `dist`
4. 保存并自动部署

#### Netlify配置 (已包含)
- 文件: `netlify.toml`
- 自动配置构建和缓存
- 支持SPA重定向

### 方案2: Vercel

#### CLI部署
```bash
# 安装Vercel CLI
npm install -g vercel

# 部署
cd music-app
vercel --prod
```

#### Git自动部署
1. 在 https://vercel.com 注册账户
2. Import项目
3. 自动检测Vite配置
4. 点击Deploy

#### Vercel配置 (已包含)
- 文件: `vercel.json`
- 自动识别构建设置

### 方案3: GitHub Pages

#### 手动部署
```bash
# 构建项目
pnpm build

# 部署dist目录到gh-pages分支
git add dist
git commit -m "Deploy"
git subtree push --prefix dist origin gh-pages
```

#### GitHub Actions (自动)
配置文件: `.github/workflows/deploy.yml`

设置步骤:
1. 推送代码到GitHub
2. 在仓库设置中启用GitHub Pages
3. 选择"Deploy from a branch"
4. 选择"gh-pages"分支

### 方案4: Docker容器

创建Dockerfile:
```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

# 运行阶段
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

构建和运行:
```bash
docker build -t music-app .
docker run -p 3000:3000 music-app
```

### 方案5: 传统服务器 (VPS/自有服务器)

#### Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # HTTPS重定向（可选）
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/music-app/dist;
    index index.html;

    # SPA路由配置
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 缓存配置
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

#### 部署步骤
```bash
# 1. 在服务器上克隆项目
cd /var/www
git clone https://github.com/your-repo/music-app.git

# 2. 构建
cd music-app
pnpm install
pnpm build

# 3. 配置Nginx
sudo ln -s /var/www/music-app/dist /usr/share/nginx/html/music-app

# 4. 重启Nginx
sudo systemctl restart nginx
```

### 方案6: AWS S3 + CloudFront

#### 部署步骤
```bash
# 1. 配置AWS CLI凭证
aws configure

# 2. 创建S3存储桶
aws s3 mb s3://music-app-bucket

# 3. 上传构建文件
pnpm build
aws s3 sync dist/ s3://music-app-bucket

# 4. 设置CloudFront分布
# （通过AWS控制台）
```

## 环境变量配置

### 生产环境变量
创建 `.env.production`:
```env
VITE_API_URL=https://your-api.com
VITE_OCR_LANGUAGE=eng
VITE_PITCH_MIN_FREQ=50
VITE_PITCH_MAX_FREQ=2000
```

### 构建时注入
```bash
# 通过命令行
VITE_APP_VERSION=1.0.0 pnpm build
```

## 性能优化

### 1. 启用Gzip压缩
Netlify/Vercel自动启用

### 2. 图片优化
```bash
# 使用WebP格式（如需要）
# 已在dist中优化
```

### 3. CDN缓存
- 静态文件: 1年缓存
- HTML: 1小时缓存
- API响应: 根据需要配置

### 4. 代码分割
Vite自动进行：
- 核心库单独打包
- 路由懒加载（如需要）

## 监测和日志

### Netlify分析
- 自动收集性能数据
- 访问 https://app.netlify.com

### Vercel Analytics
- 实时性能监控
- 自动错误追踪

### 自定义日志 (传统服务器)
```bash
# 检查Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## SSL/HTTPS配置

### Netlify/Vercel
自动配置，无需额外设置

### 传统服务器
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 域名配置

### 配置DNS
```
A记录 -> IP地址 (用于传统服务器)
CNAME -> netlify-domain (用于Netlify)
CNAME -> vercel.com (用于Vercel)
```

### 配置www子域名
```
www CNAME -> your-domain.com
```

## 故障排除

### 部署失败
1. 检查构建日志
2. 验证环境变量
3. 确保依赖版本兼容
4. 检查代码中是否有console.error

### 白屏问题
1. 检查浏览器控制台错误
2. 清除缓存 (Ctrl+Shift+Delete)
3. 验证index.html路由配置
4. 检查API端点

### 性能问题
1. 检查包大小 (pnpm build --report)
2. 启用HTTP/2推送
3. 优化图片资源
4. 使用CDN加速

### 音频功能不工作
1. 检查HTTPS配置 (音频API需要HTTPS)
2. 验证麦克风权限
3. 检查浏览器兼容性

## 持续集成/持续部署 (CI/CD)

### GitHub Actions (已配置)
文件: `.github/workflows/deploy.yml`

触发条件:
- 推送到main分支
- Pull Request到main分支

自动操作:
- 安装依赖
- 运行ESLint
- 生产构建
- 部署到Vercel

### 自定义CI/CD
```yaml
# 以GitLab CI为例
stages:
  - build
  - deploy

build:
  script:
    - pnpm install
    - pnpm build

deploy:
  script:
    - pnpm install
    - pnpm build
    - netlify deploy --prod
```

## 备份和恢复

### 代码备份
```bash
git push origin main
```

### 部署回滚
- Netlify: 从部署历史恢复
- Vercel: 选择之前的部署版本
- GitHub Pages: 重新推送旧版本代码

## 监控和告警

### Uptime监控
推荐工具:
- UptimeRobot (免费)
- StatusCake
- Pingdom

### 错误追踪
推荐工具:
- Sentry
- Rollbar
- LogRocket

### 性能监控
推荐工具:
- Google Analytics
- Plausible
- Fathom Analytics

---

## 快速参考表

| 平台 | 成本 | 易用性 | 性能 | 推荐指数 |
|------|------|--------|------|---------|
| Netlify | 免费/付费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Vercel | 免费/付费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| GitHub Pages | 免费 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Docker | 根据托管 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 传统VPS | 付费 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| AWS S3 | 付费 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

**推荐**: 首次部署使用Netlify或Vercel，享受免费和自动化优势。
