# 部署指南

## GitHub Pages 部署

### 自动部署（推荐）

项目已配置GitHub Actions自动部署，推送到main分支后会自动部署到GitHub Pages。

1. **启用GitHub Pages**
   - 进入仓库Settings页面
   - 找到Pages设置
   - Source选择"GitHub Actions"

2. **推送代码**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **访问网站**
   - 部署完成后，访问 `https://[username].github.io/[repository-name]`

### 手动部署

如果不使用GitHub Actions，也可以手动配置：

1. **启用GitHub Pages**
   - 进入仓库Settings页面
   - 找到Pages设置
   - Source选择"Deploy from a branch"
   - Branch选择"main"，文件夹选择"/ (root)"

2. **确保文件结构正确**
   ```
   ├── index.html
   ├── css/
   ├── js/
   ├── data/
   ├── Sound/
   └── _config.yml
   ```

## 其他部署选项

### Netlify 部署

1. 连接GitHub仓库到Netlify
2. 构建设置：
   - Build command: 留空
   - Publish directory: `/`
3. 部署设置：
   - 确保音频文件MIME类型正确配置

### Vercel 部署

1. 导入GitHub仓库到Vercel
2. 框架预设选择"Other"
3. 构建和输出设置保持默认

### 自托管部署

1. **Web服务器要求**
   - 支持静态文件服务
   - 正确配置音频文件MIME类型

2. **Nginx配置示例**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/cantonese-website;
       index index.html;

       # 音频文件MIME类型
       location ~* \.(opus|mp3|wav|ogg)$ {
           add_header Cache-Control "public, max-age=31536000";
           add_header Access-Control-Allow-Origin "*";
       }

       # 静态文件缓存
       location ~* \.(css|js|json)$ {
           add_header Cache-Control "public, max-age=86400";
       }
   }
   ```

3. **Apache配置示例**
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       DocumentRoot /path/to/cantonese-website
       
       # 音频文件MIME类型
       <FilesMatch "\.(opus|mp3|wav|ogg)$">
           Header set Cache-Control "public, max-age=31536000"
           Header set Access-Control-Allow-Origin "*"
       </FilesMatch>
   </VirtualHost>
   ```

## 部署检查清单

### 部署前检查
- [ ] 所有音频文件都在Sound目录中
- [ ] data/courses.json格式正确
- [ ] 测试页面在本地正常工作
- [ ] 检查浏览器控制台无错误

### 部署后验证
- [ ] 网站可以正常访问
- [ ] 课程列表正确显示
- [ ] 音频文件可以正常播放
- [ ] 响应式设计在移动设备上正常
- [ ] HTTPS下音频播放正常

## 常见部署问题

### 音频文件无法加载
**问题**：音频文件404错误
**解决**：
1. 检查文件路径大小写是否正确
2. 确认音频文件已正确上传
3. 检查服务器MIME类型配置

### CORS错误
**问题**：跨域资源共享错误
**解决**：
1. 使用HTTP服务器而非file://协议
2. 配置服务器允许音频文件跨域访问

### 页面空白
**问题**：部署后页面显示空白
**解决**：
1. 检查浏览器控制台错误信息
2. 确认所有资源文件路径正确
3. 检查JavaScript是否正常加载

### GitHub Pages特定问题

#### Jekyll处理问题
**解决**：项目已包含`.nojekyll`文件禁用Jekyll处理

#### 大文件限制
**问题**：音频文件过大无法上传
**解决**：
1. 压缩音频文件
2. 使用Git LFS存储大文件
3. 考虑使用外部CDN存储音频

#### 自定义域名
如需使用自定义域名：
1. 在仓库根目录创建CNAME文件
2. 文件内容为你的域名（如：example.com）
3. 在域名DNS设置中添加CNAME记录指向GitHub Pages

## 性能优化建议

### 音频文件优化
- 使用Opus格式减小文件大小
- 设置合适的比特率（64-128kbps）
- 启用音频文件缓存

### 加载速度优化
- 启用Gzip压缩
- 设置静态资源缓存
- 使用CDN加速（可选）

### 监控和分析
- 使用Google Analytics跟踪使用情况
- 监控音频文件加载性能
- 收集用户反馈优化体验