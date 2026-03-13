/**
 * 图片处理工具
 */

/**
 * 压缩图片
 * @param {File} file - 图片文件
 * @param {Number} maxWidth - 最大宽度（默认 1920）
 * @param {Number} quality - 压缩质量（默认 0.8）
 * @returns {Promise<Blob>} 压缩后的图片 Blob
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

        // 按比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 验证图片文件
 * @param {File} file - 图片文件
 * @param {Number} maxSize - 最大文件大小（单位：字节，默认 10MB）
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateImageFile(file, maxSize = 10 * 1024 * 1024) {
  // 检查文件类型
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: '只支持 JPG、PNG、WebP 格式的图片'
    };
  }

  // 检查文件大小
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `图片大小不能超过 ${Math.floor(maxSize / 1024 / 1024)}MB`
    };
  }

  return { valid: true };
}

/**
 * 生成图片预览 URL
 * @param {File|Blob} file - 图片文件
 * @returns {String} 预览 URL
 */
export function createPreviewURL(file) {
  return URL.createObjectURL(file);
}

/**
 * 释放图片预览 URL
 * @param {String} url - 预览 URL
 */
export function revokePreviewURL(url) {
  URL.revokeObjectURL(url);
}
