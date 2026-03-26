/**
 * 图片上传工具 - 阿里云 OSS 直传
 *
 * 使用示例:
 * import { uploadImage } from '@/utils/upload'
 *
 * const imageUrl = await uploadImage(file)
 */

import OSS from 'ali-oss';
import { storyApi } from '@/api/client';

/**
 * 上传图片到 OSS
 * @param {File} file - 图片文件
 * @param {Function} [onProgress] - 上传进度回调 (percent) => void
 * @returns {Promise<string>} 图片 URL
 */
export async function uploadImage(file, onProgress) {
  // 1. 获取 OSS 上传凭证
  const credentials = await storyApi.getUploadToken();

  // 2. 初始化 OSS 客户端
  const client = new OSS({
    region: credentials.region,
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    stsToken: credentials.stsToken,
    bucket: credentials.bucket
  });

  // 3. 生成文件名 (避免重复)
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop();
  const fileName = `stories/${timestamp}-${randomStr}.${ext}`;

  // 4. 上传文件
  const result = await client.put(fileName, file, {
    progress: (p) => {
      if (onProgress) {
        onProgress(Math.floor(p * 100));
      }
    }
  });

  // 5. 返回图片 URL
  return result.url;
}

/**
 * 批量上传图片
 * @param {File[]} files - 图片文件数组
 * @param {Function} [onProgress] - 总进度回调 (percent) => void
 * @returns {Promise<string[]>} 图片 URL 数组
 */
export async function uploadImages(files, onProgress) {
  const total = files.length;
  let completed = 0;

  const uploadPromises = files.map(async (file) => {
    const url = await uploadImage(file, () => {
      // 单个文件上传进度暂不处理
    });

    completed++;
    if (onProgress) {
      onProgress(Math.floor((completed / total) * 100));
    }

    return url;
  });

  return Promise.all(uploadPromises);
}

/**
 * 压缩图片
 * @param {File} file - 原始图片
 * @param {number} [maxWidth=1920] - 最大宽度
 * @param {number} [quality=0.8] - 压缩质量 (0-1)
 * @returns {Promise<File>}
 */
export function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 如果宽度超过最大值，等比缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 验证图片文件
 * @param {File} file
 * @param {number} [maxSize=5] - 最大文件大小 (MB)
 * @returns {{valid: boolean, error?: string}}
 */
export function validateImage(file, maxSize = 5) {
  // 检查文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: '仅支持 JPG、PNG、WebP 格式的图片'
    };
  }

  // 检查文件大小
  const maxBytes = maxSize * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `图片大小不能超过 ${maxSize}MB`
    };
  }

  return { valid: true };
}
