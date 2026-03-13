import crypto from 'crypto';
import config from '../../config/index.js';

/**
 * 生成 OSS 上传凭证（使用阿里云 OSS）
 * @returns {Object} 包含上传所需的签名信息
 */
export function generateOSSToken() {
  const expiration = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

  const policy = {
    expiration: expiration.toISOString(),
    conditions: [
      ['content-length-range', 0, 10 * 1024 * 1024], // 限制文件大小为 10MB
      ['starts-with', '$key', 'uploads/'] // 限制上传路径
    ]
  };

  const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64');

  const signature = crypto
    .createHmac('sha1', config.oss.accessKeySecret)
    .update(policyBase64)
    .digest('base64');

  return {
    accessKeyId: config.oss.accessKeyId,
    policy: policyBase64,
    signature,
    host: config.oss.host,
    expire: expiration.getTime(),
    dir: 'uploads/' // 上传目录
  };
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
