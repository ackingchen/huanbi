# 焕壁 · React 数字壁画修复

## 本地运行
需要 Node.js 22.12+。

```powershell
npm ci
Copy-Item .env.example .env
# 编辑 .env 填入你的密钥；不要把密钥写进 src 或发到前端。
npm run dev
```
访问 http://localhost:5173 。开发命令同时启动 React 和后端。
不配置密钥也能浏览界面、上传和预览；生成按钮会明确返回未配置错误。

## 放入展示图片
运行所需图片、字体和音频位于 `public/`。主要展品信息位于 `src/exhibits.js`，千壁藏珍的图片清单位于 `src/treasures.json`，画廊配置位于 `src/gallery.js`。素材来源链接随展品数据保留，音效与字体的许可说明见 `public/audio/CREDITS.md` 和 `public/fonts/MaShanZheng-OFL.txt`。

## 背景音乐与病害图鉴

全站背景音乐为用户提供的《10月11日》，自动尝试播放并单曲循环；浏览器若拦截有声自动播放，首次点击页面即可开始。右下角可暂停或恢复，前后台切换保持播放进度。

病害图鉴使用 AI 绘制的六张分类卡片和一张观察图，支持六类局部放大。这些图片是教学示意，不是实物病害标注。

## 图片生成
后端 `server/index.mjs` 调用 OpenAI-compatible `images.edit`，预设提示词位于 `server/prompt.mjs`。默认保留用户指定的 `gpt-image-2`，可通过 `OPENAI_IMAGE_MODEL` 和 `OPENAI_BASE_URL` 配置实际服务商。官方模型文档访问受限，真实模型可用性、权限和返回格式需要用自己的接口验证；没有自动切换到其他模型。
当前期待 `data[0].b64_json` 返回图片。强度是提示词中的程度指引，不是模型的独立数值参数；生成结果是视觉推演而非考古真实性证明。前后对比采用同一画布 contain 显示，模型若改变构图须人工复核。
应用不把上传文件写入磁盘，图片会发给配置的图片服务处理。第三方保留政策以服务商为准。

## 构建 / 检查
```powershell
npm run build
npm start
```
构建后访问 http://127.0.0.1:8787 。此版本用于本地展示；公开上线前应加入账号鉴权、用户配额与部署层访问控制，避免公开接口消耗密钥额度。

## 组件与动效
React + Vite，Radix Dialog/Slot、CVA、clsx/tailwind-merge 的 shadcn 组件组织方式；`src/components` 为可修改源码。展示弹窗支持焦点管理和 Escape；按钮支持键盘焦点。宣纸纹理、朱砂印章、轨迹呼吸、加载动效、卡片悬浮及入场动效均支持 reduced-motion。

## 可视化管理后台
访问 http://127.0.0.1:8787/admin ，首次进入设置 10–128 位管理员密码。没有默认密码。之后使用密码登录，可配置中转站基础地址、Key、模型、尺寸、质量和补充提示词。
- 基础地址通常是 `https://你的中转站/v1`，程序会追加 `/images/edits`，不要填完整编辑接口路径。
- Key 输入框留空表示保留；勾选清除可删除 Key。响应不会返回 Key。保存立即生效，仅影响新请求。
- 数据持久化于 `data/settings.json`，该目录已加入 Git 忽略。密钥为后端明文配置，密码使用加盐 scrypt 哈希；请保护整个 data 目录，不要分享或公开。
- 浏览器使用 HttpOnly、SameSite Cookie，会话有效期 8 小时，重启需重新登录。后台限制本机域名访问，并校验请求来源。
- 实际服务是否支持指定模型需用自己的 Key 验证。没有自动付费出图测试按钮。
- 管理员忘记密码时，停止服务，备份 settings.json 并仅删除 passwordHash/passwordSalt 字段，再启动服务重新设置密码；保留其它字段可保留接口配置。

## 仓库内容
仓库仅包含应用源码、运行素材、依赖锁文件和启动说明。本地配置、密钥、测试脚本、截图、构建产物、演示压缩包及开发记录不纳入版本控制。`.env.example` 仅提供空密钥配置模板。
