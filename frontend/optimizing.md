优化创意
一、交互体验与视觉优化

1. 时光胶囊/深夜树洞 — 解锁前专属图标与主题动画

未解锁状态下不再空白或灰显，呈现与双主题适配的专属图标与轻量动画。

【日间主题 — 暖金羊皮纸风格】
- 图标采用金色渐变描边（#fff9ef → #f3d59b → #d79a43，与Logo同源），
  内部填充半透明暖金底色 rgba(250,239,217,0.3)，呼应首页日间层
- 呼吸动画：opacity 0.7→1 + scale(0.98→1.02)，3s ease-in-out 循环，
  模拟金色微光脉动，仅触发合成器层属性

【夜间主题 — 深空冰蓝风格】
- 图标采用冰蓝色描边（#8fb4ff，与发布页暗色面板accent同源），
  内部填充半透明深蓝底色 rgba(20,27,48,0.4)
- 呼吸动画叠加微弱辉光 text-shadow: 0 0 12px rgba(143,180,255,0.6)，
  模拟星点闪烁，与首页夜间层的 star-emoji twinkle 动画同频

【技术实现】
- 使用 useTheme composable 检测当前主题，动态切换 CSS 变量
- 动画仅操作 transform + opacity，避免 layout 重排
- @media (prefers-reduced-motion: reduce) 下关闭所有动画
- 解锁状态变更通过 aria-live="polite" 广播；装饰图标 aria-hidden="true"
- 倒计时定时器使用 shallowRef 管理，onUnmounted 中清理
- 禁止 transition: all，显式声明 transition-property

2. 地图标点样式 — 情绪色彩与主题深度融合

对简易标点进行全面视觉升级，使标记点在日间/夜间主题下均精致且辨识度高，
与项目情绪色彩体系（$emotion-happy/sad/neutral/excited/peaceful）统一。

【标记点双层设计】
- 外圈：情绪色发光底座，使用 filter: drop-shadow + 半透明情绪色背景
  日间：box-shadow 情绪色 20% 透明度
  夜间：box-shadow 情绪色 40% 透明度 + 更强辉光，与深空背景形成对比
- 内核：实心情绪色块 + 对应 emoji（与 EMOTION_CONFIG 中的 emoji 字段一致）
（这个指的是原来故事在地图上的显示的小圆圈中带有表情的样式要修改）


【交互反馈链】
- hover: transform: scale(1.15) + 阴影扩散，0.2s ease
- active: scale(0.95) 按压反馈
- focus-visible: 2px solid #667eea outline（主色），offset 2px
- 日间 hover 阴影色 rgba(0,0,0,0.25)，夜间 rgba(143,180,255,0.3) 冰蓝辉光

【情绪色统一】
- 统一采用 AMap.vue 中 emotionColors / emotionColorsDark 映射：
  happy:#ffd93d / #ffd93d, sad:#6bceff / #6bceff,
  neutral:#c8d6e5 / #b8c5cc, excited:#ff6b9d / #ff6b9d,
  peaceful:#a8e6cf / #9ae6d9
- 解决 emotion.js 中颜色值不一致的问题，以 SCSS variables.scss 为准

【性能】
- 大量标记点（>50）时使用 content-visibility: auto
- 动画仅操作 transform/opacity/box-shadow（box-shadow 在合成器层）

3. 同一点位多故事展示与滚动查看

修复同一点位仅显示单个故事的Bug，点击聚合点后弹出故事列表浮层。
（指极小范围内相同的点会折叠，但是只会显示最顶层的故事，这个需要改，直接修改为点击点聚合的星星，展示列表，切记区分日间和夜间主题）

【浮层主题适配】
- 日间：毛玻璃白底 backdrop-filter: blur(16px) + rgba(255,255,255,0.85)，
  圆角 $radius-lg(16px)，阴影 $shadow-lg
- 夜间：毛玻璃深蓝底 backdrop-filter: blur(16px) + rgba(26,26,46,0.9)，
  冰蓝色边框 1px solid rgba(143,180,255,0.2)
- 列表项使用 StoryCard 组件（已含情绪色左边框 + 主题适配）

【排序与滚动】
- 顶部排序切换：「按时间」/「按热度」，按钮样式沿用 .btn-primary 渐变
  （#667eea → #5568d3），选中态加 accent 色（#f093fb）底边指示
- 时间格式化使用 Intl.DateTimeFormat('zh-CN') 避免硬编码
- 列表区域 overscroll-behavior: contain 防止滚动穿透
- 故事标题 line-clamp-2 截断，容器 min-width: 0 确保 truncation 生效

【交互】
- 支持 ESC 键关闭、点击遮罩关闭
- 浮层 role="dialog" + aria-label="该地点的故事列表"
- 空状态展示"暂无故事…"占位（日间暖金文字、夜间冰蓝文字）
- 单点故事数 >20 启用 content-visibility: auto 虚拟化

4. 故事图片点击放大查看

新增全局 ImageLightbox 组件，点击故事图片打开大图预览。

【Lightbox 主题适配】
- 遮罩层：
  日间：rgba(0,0,0,0.88) 半透明黑
  夜间：rgba(2,4,11,0.95) 深空色（与首页夜间背景 #02040b 同源）
- 关闭按钮：日间白底灰字，夜间深蓝底冰蓝字
- 底部图片计数器：日间半透明白底，夜间半透明深蓝底，均使用毛玻璃

【动画规范】
- 打开/关闭仅使用 opacity + transform(scale)，0.25s ease-out
- 动画可被用户操作中断
- prefers-reduced-motion 下关闭动画
- 禁止 transition: all

【图片加载优化】
- <img> 设置显式 width/height 防 CLS
- 非首屏图片 loading="lazy"
- 当前预览大图 fetchpriority="high"
- object-fit: contain + max-width:90vw / max-height:85vh

【交互与无障碍】
- 键盘左右箭头切换图片，ESC 关闭
- 焦点陷阱（Focus Trap），容器 role="dialog" + aria-modal="true"
- 图片描述性 alt 文本
- 导航按钮 aria-label
- 可选：预览索引同步到 URL query param（?image=2）支持深链接
二、VIP 会员体系与商业化铺垫
VIP 用户服务与邀请码激活机制
· 提供VIP 专属高级皮肤，用于地图界面、图标或情绪标签外观。
· 管理员可生成一次性邀请码，用户输入后即可激活VIP 身份，为后续付费转
化预留运营入口。
VIP 自定义情绪标签
在现有固定情绪选项基础上，VIP 用户可从预设图标库中选择一个图标，并
自拟4 字以内情绪文字，类似QQ 状态自定义，增强个性化表达。
三、"我的足迹"动态轨迹动画
个人故事时间轴轨迹动画
将原有"我的发布"列表升级为沉浸式"我的足迹"动画模式（原有列表管理功
能保留）：
· 按发布时间顺序，依次在地图上动态展示用户所发故事点位。
· 两点之间以一条逐渐延伸的轨迹线连接，地图自动跟随并缩放至适合视角，
确保起点与终点完整呈现。
· 连完一条线后立即擦除，再绘制下一条，避免线条过多造成视觉混乱。
· 动画期间隐藏其他用户的故事点，保持画面聚焦个人叙事。
· 支持倍速播放与一键跳过动画，中途可暂停查看某一故事详情，退出后继续
播放。
· 动画结束后用户可自由缩放、拖动地图；默认不保留全量连线，以防画面过
乱，但提供手动开启全部连线选项。
四、发布与内容管理增强
全匿名发布模式
发布故事时可选择完全匿名，隐藏头像与用户名，保护用户隐私，适用于更
敏感或私密的情绪表达场景。
评论开关功能
用户发布故事时可选择关闭评论，仅允许他人查看、点赞与收藏，给予作者
更多内容管理自主权。
五、安全与审核机制升级
引入AI 辅助审核
在现有举报处理与人工精选基础上，新增AI 预审能力，对用户上传的图文内容
进行智能过滤与风险提示，降低违规内容上架概率，提升后台审核效率与社区
安全性。