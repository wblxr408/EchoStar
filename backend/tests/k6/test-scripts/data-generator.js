/**
 * 测试数据生成器
 */

// 北京市中心坐标范围
const BEIJING_BOUNDS = {
  latMin: 39.8,
  latMax: 40.1,
  lngMin: 116.2,
  lngMax: 116.6,
};

// 情感标签
const EMOTION_TAGS = ['开心', '难过', '治愈', '打卡', null];

// 故事内容模板
const STORY_TEMPLATES = [
  '今天天气真好，心情愉快！',
  '路过这里，想起了以前的事情...',
  '终于打卡了这个地方！',
  '和朋友们一起来的，很开心！',
  '一个人静静地待着，享受宁静。',
  '这里的变化真大啊。',
  '回忆涌上心头。',
  '希望能经常来这里。',
  '今天发生了一些有趣的事。',
  '记录生活中的小确幸。',
  '阳光明媚，适合出门。',
  '雨天的故事也很有味道。',
  '夜晚的风景也很美。',
  '发现了一个好地方！',
  '值得纪念的一天。',
];

// 评论内容模板
const COMMENT_TEMPLATES = [
  '写得真好！',
  '同感！',
  '我也来过这里。',
  '照片很漂亮！',
  '下次我也要去看看。',
  '加油！',
  '支持你！',
  '很有意思的分享。',
  '学习了！',
  '期待更多内容。',
  '这个地方在哪？',
  '太棒了！',
  '羡慕你！',
  '有时间我也要去。',
  '收藏了！',
];

// 举报原因模板
const REPORT_REASONS = [
  '内容不当',
  '涉嫌抄袭',
  '虚假信息',
  '恶意内容',
  '其他问题',
];

/**
 * 生成随机整数
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机浮点数
 */
export function randomFloat(min, max, decimals = 6) {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
}

/**
 * 从数组中随机选择一个元素
 */
export function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

/**
 * 生成随机邮箱
 */
export function generateEmail(index, prefix = 'testuser') {
  const domains = ['test.com', 'example.com', 'dummy.org'];
  return `${prefix}${index}@${randomChoice(domains)}`;
}

/**
 * 生成管理员邮箱
 */
export function generateAdminEmail(index) {
  return generateEmail(index, 'admin');
}

/**
 * 生成用户名
 */
export function generateUsername(index, prefix = 'user') {
  return `${prefix}_${index}_${randomInt(1000, 9999)}`;
}

/**
 * 生成管理员用户名
 */
export function generateAdminUsername(index) {
  return generateUsername(index, 'admin');
}

/**
 * 生成密码
 */
export function generatePassword(index) {
  return `Test@${index}Password`;
}

/**
 * 生成北京地区随机坐标
 */
export function generateBeijingLocation() {
  return {
    type: 'Point',
    coordinates: [
      randomFloat(BEIJING_BOUNDS.lngMin, BEIJING_BOUNDS.lngMax),
      randomFloat(BEIJING_BOUNDS.latMin, BEIJING_BOUNDS.latMax),
    ],
  };
}

/**
 * 生成随机经纬度（用于查询）
 */
export function generateRandomLatLng() {
  return {
    lat: randomFloat(BEIJING_BOUNDS.latMin, BEIJING_BOUNDS.latMax),
    lng: randomFloat(BEIJING_BOUNDS.lngMin, BEIJING_BOUNDS.lngMax),
  };
}

/**
 * 生成故事内容
 */
export function generateStoryContent() {
  const template = randomChoice(STORY_TEMPLATES);
  const suffix = randomInt(1, 100) > 50 ? ` #${randomChoice(['生活', '旅行', '美食', '心情', '日常'])}` : '';
  return template + suffix;
}

/**
 * 生成情感标签
 */
export function generateEmotionTag() {
  return randomChoice(EMOTION_TAGS);
}

/**
 * 生成评论内容
 */
export function generateCommentContent() {
  return randomChoice(COMMENT_TEMPLATES);
}

/**
 * 生成举报原因
 */
export function generateReportReason() {
  return randomChoice(REPORT_REASONS);
}

/**
 * 生成用户注册数据
 */
export function generateUserData(index, isAdmin = false) {
  const prefix = isAdmin ? 'admin' : 'testuser';
  return {
    email: isAdmin ? generateAdminEmail(index) : generateEmail(index),
    password: generatePassword(index),
    username: isAdmin ? generateAdminUsername(index) : generateUsername(index),
  };
}

/**
 * 生成故事数据
 */
export function generateStoryData(userId) {
  const location = generateBeijingLocation();
  return {
    content: generateStoryContent(),
    images: [],
    location: location,
    emotionTag: generateEmotionTag(),
    isTimeCapsule: false,
    visibility: 'public',
    visibilityStartTime: null,
    visibilityEndTime: null,
  };
}

/**
 * 生成评论数据
 */
export function generateCommentData(storyId) {
  return {
    storyId: storyId,
    content: generateCommentContent(),
  };
}

/**
 * 生成点赞数据
 */
export function generateLikeData(storyId) {
  return {
    storyId: storyId,
  };
}

/**
 * 生成收藏数据
 */
export function generateFavoriteData(storyId) {
  return {
    storyId: storyId,
  };
}

/**
 * 生成举报数据
 */
export function generateReportData(targetType, targetId) {
  return {
    targetType: targetType,
    targetId: targetId,
    reason: generateReportReason(),
  };
}

/**
 * 生成地图边界参数
 */
export function generateMapBounds() {
  const center = generateRandomLatLng();
  const offset = 0.05;
  return {
    northEast: JSON.stringify({
      lat: center.lat + offset,
      lng: center.lng + offset,
    }),
    southWest: JSON.stringify({
      lat: center.lat - offset,
      lng: center.lng - offset,
    }),
  };
}

/**
 * 生成批量用户数据
 */
export function generateBatchUsers(startIndex, count, isAdmin = false) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(generateUserData(startIndex + i, isAdmin));
  }
  return users;
}

/**
 * 生成批量故事数据
 */
export function generateBatchStories(storyIds, userIds) {
  const stories = [];
  for (let i = 0; i < storyIds.length; i++) {
    stories.push({
      id: storyIds[i],
      userId: randomChoice(userIds),
      ...generateStoryData(),
    });
  }
  return stories;
}
