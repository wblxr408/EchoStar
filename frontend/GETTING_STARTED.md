# EchoStar 前端快速开始指南

## 项目简介

EchoStar 是一个基于 LBS(位置服务)的情绪地图社交应用。用户可以在地图上发布带有情绪标签的故事,创建时光胶囊,与其他用户分享自己的情绪印记。

## 已完成的功能

### 核心页面
- ✅ **首页** - 欢迎页面,登录入口
- ✅ **地图页** - 核心功能页,集成高德地图
- ✅ **发布页** - 发布故事和时光胶囊
- ✅ **管理后台** - 管理员功能页面(基础)

### 组件库
- ✅ **AMap** - 高德地图封装组件
- ✅ **StoryCard** - 故事卡片展示
- ✅ **TimeCapsule** - 时光胶囊组件
- ✅ **EmotionSelector** - 情绪选择器
- ✅ **ImageUploader** - 图片上传组件
- ✅ **LoginModal** - 登录/注册模态框

### 状态管理
- ✅ **userStore** - 用户状态管理
- ✅ **mapStore** - 地图状态管理
- ✅ **storyStore** - 故事状态管理

### API 层
- ✅ **authApi** - 认证接口(支持 Mock)
- ✅ **mapApi** - 地图接口(支持 Mock)
- ✅ **storyApi** - 故事接口(支持 Mock)

### 工具函数
- ✅ **时间处理** - 相对时间格式化、倒计时
- ✅ **图片处理** - 压缩、验证、预览
- ✅ **Mock 数据** - 开发测试数据

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

编辑 `.env.development` 文件:

```env
# API 基础地址
VITE_API_BASE_URL=http://localhost:3000/api

# 高德地图 API Key (参见 AMAP_SETUP.md 获取)
VITE_AMAP_KEY=your_amap_key_here

# 是否启用 Mock 数据
VITE_USE_MOCK=true
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问应用

浏览器打开: http://localhost:5173

## 使用流程

### 登录体验

1. 打开首页,点击「开始探索」按钮
2. 在登录模态框中输入:
   - 邮箱: `test@test.com`
   - 密码: `123456`
3. 点击登录按钮
4. 登录成功后自动跳转到地图页

### 地图功能

1. **浏览故事**
   - 地图上显示彩色标记,不同颜色代表不同情绪
   - 点击标记可查看故事详情
   - 右侧侧边栏显示附近故事列表

2. **随机漫步**
   - 点击左下角「🎲」按钮
   - 随机跳转到一个故事位置
   - 显示该故事的详情弹窗

3. **发布故事**
   - 点击右下角「+」按钮
   - 填写故事内容(最多 500 字)
   - 选择情绪标签(开心/难过/平静/兴奋/祥和)
   - 可选上传图片(最多 9 张)
   - 可选设置为时光胶囊,指定解锁时间
   - 点击「发布」完成

### 情绪说明

- 😊 **开心** (黄色) - 快乐、愉悦的心情
- 😢 **难过** (蓝色) - 悲伤、失落的情绪
- 😐 **平静** (灰色) - 平和、淡定的状态
- 🤩 **兴奋** (粉色) - 激动、期待的心情
- 😌 **祥和** (绿色) - 安详、满足的感觉

### 时光胶囊

时光胶囊是一种特殊的发布方式:
- 发布时设定一个解锁时间
- 在解锁时间之前,故事显示为锁定状态(🔒)
- 解锁后,所有人可以看到故事内容
- 进度条显示距离解锁的剩余时间

## 项目结构

```
src/
├── api/                # API 接口
│   ├── index.js       # Axios 配置
│   ├── auth.js        # 认证 API
│   ├── map.js         # 地图 API
│   ├── story.js       # 故事 API
│   └── mockProxy.js    # Mock 数据代理
├── components/         # 公共组件
│   ├── AMap.vue       # 高德地图
│   ├── StoryCard.vue  # 故事卡片
│   ├── TimeCapsule.vue # 时光胶囊
│   ├── EmotionSelector.vue # 情绪选择器
│   └── ImageUploader.vue   # 图片上传
├── stores/            # Pinia 状态管理
│   ├── user.js        # 用户状态
│   ├── map.js         # 地图状态
│   └── story.js       # 故事状态
├── utils/             # 工具函数
│   ├── time.js        # 时间处理
│   ├── image.js       # 图片处理
│   └── mockData.js    # Mock 数据
├── views/             # 页面组件
│   ├── Home/          # 首页
│   ├── Map/           # 地图页
│   ├── Publish/       # 发布页
│   └── Admin/         # 管理后台
├── router/            # 路由配置
├── styles/            # 全局样式
│   ├── variables.scss # CSS 变量
│   └── global.scss    # 全局样式
├── types/             # 类型声明
│   └── amap.d.ts      # 高德地图类型
├── App.vue            # 根组件
└── main.js            # 入口文件
```

## 开发注意事项

### Mock 数据模式

当前启用 Mock 数据模式(`VITE_USE_MOCK=true`):
- 所有 API 请求返回模拟数据
- 数据存储在内存中,刷新后重置
- 适合前端开发和 UI 调试

### 连接真实后端

当后端 API 准备好后:
1. 设置 `.env.development` 中的 `VITE_USE_MOCK=false`
2. 确保后端服务在 `http://localhost:3000` 运行
3. 重启开发服务器

### 高德地图配置

如需使用真实地图:
1. 按照[`AMAP_SETUP.md`](./AMAP_SETUP.md)获取 API Key
2. 配置 `.env.development` 中的 `VITE_AMAP_KEY`
3. 重启开发服务器

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP 客户端**: Axios
- **样式**: SCSS
- **地图**: 高德地图 JS API

## 下一步计划

### 优先级 P0
- [ ] 真实图片上传到 OSS
- [ ] 完善地图搜索功能
- [ ] 添加用户个人主页

### 优先级 P1
- [ ] 故事点赞和评论
- [ ] 消息通知系统
- [ ] 地图筛选和排序

### 优先级 P2
- [ ] 性能优化
- [ ] 单元测试
- [ ] PWA 支持

## 常见问题

### Q: 登录后页面空白?
A: 检查浏览器控制台是否有错误,确认 Mock 数据模式是否开启。

### Q: 地图不显示?
A: 确保已配置高德地图 API Key,或等待地图 API 加载完成。

### Q: 发布故事后看不到?
A: Mock 数据模式下,故事存储在内存中,刷新页面会重置。

### Q: 如何切换到真实后端?
A: 设置 `VITE_USE_MOCK=false` 并确保后端服务运行。

## 技术支持

如遇到问题,请查看:
1. 浏览器控制台错误信息
2. 项目文档: [`PROJECT_TEMPLATE.md`](./PROJECT_TEMPLATE.md)
3. 高德地图配置: [`AMAP_SETUP.md`](./AMAP_SETUP.md)

---

**祝使用愉快! 🎉**
