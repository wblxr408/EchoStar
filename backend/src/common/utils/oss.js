import crypto from 'crypto';
import config from '../../config/index.js';

/**
 * 生成 OSS 上传凭证（供前端直传使用）
 * 使用签名 Policy 方式
 * @param {string} [dir='uploads/'] - 上传目录
 * @returns {Object} 包含上传所需的签名信息
 */
export function generateOSSToken(dir = 'uploads/') {
  const expiration = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

  const policy = {
    expiration: expiration.toISOString(),
    conditions: [
      ['content-length-range', 0, 10 * 1024 * 1024], // 限制文件大小为 10MB
      ['starts-with', '$key', dir] // 限制上传路径
    ]
  };

  const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64');

  const signature = crypto
    .createHmac('sha1', config.oss.accessKeySecret)
    .update(policyBase64)
    .digest('base64');

  // 处理 region 格式，ali-oss SDK 需要带 oss- 前缀的 region
  let region = config.oss.region || 'oss-cn-shanghai';
  if (!region.startsWith('oss-')) {
    region = 'oss-' + region;
  }

  return {
    // 兼容前端 ali-oss SDK 格式
    accessKeyId: config.oss.accessKeyId,
    accessKeySecret: config.oss.accessKeySecret,
    bucket: config.oss.bucket,
    region: region,
    host: config.oss.host,
    policy: policyBase64,
    signature,
    expire: expiration.getTime(),
    dir,
    // 用于前端直接上传的完整配置
    OSSAccessKeyId: config.oss.accessKeyId,
    success_action_status: '200'
  };
}

/**
 * 生成故事图片上传凭证
 * @returns {Object} 上传凭证
 */
export function generateStoryUploadToken() {
  return generateOSSToken('stories/');
}

/**
 * 生成头像上传凭证
 * @returns {Object} 上传凭证
 */
export function generateAvatarUploadToken() {
  return generateOSSToken('avatars/');
}

/**
 * 生成随机文件名
 * @param {String} originalName - 原始文件名
 * @returns {String} 新文件名
 */
export function generateFileName(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = originalName.split('.').pop();
  return `${timestamp}-${random}.${ext}`;
}

/**
 * 获取 OSS 文件完整 URL
 * @param {String} key - 文件路径
 * @returns {String} 完整 URL
 */
export function getOSSUrl(key) {
  const domain = config.oss.domain || config.oss.host;
  // 确保 key 不以 / 开头
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  return `${domain}/${cleanKey}`;
}

/**
 * 获取随机默认头像 URL
 * @returns {String} 默认头像 URL
 */
export function getRandomDefaultAvatar() {
  const avatars = config.defaultAvatars;
  if (!avatars || avatars.length === 0) {
    // 如果没有配置默认头像，返回一个占位图
    return `https://echostar.oss-cn-shanghai.aliyuncs.com/avatars/default${Math.floor(Math.random() * 5) + 1}.png`;
  }
  return avatars[Math.floor(Math.random() * avatars.length)];
}
