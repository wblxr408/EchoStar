/**
 * 上传默认头像到 OSS
 * 
 * 使用方法：
 * 1. 确保后端 .env 文件中配置了 OSS_ACCESS_KEY_ID 和 OSS_ACCESS_KEY_SECRET
 * 2. 运行 node scripts/upload-default-avatars.js
 */

import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OSS 配置 - 从环境变量读取
const client = new OSS({
  region: 'oss-cn-shanghai',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: 'echostar'
});

// 默认头像数量
const DEFAULT_AVATAR_COUNT = 5;

async function uploadDefaultAvatars() {
  // 验证环境变量
  if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET) {
    console.error('❌ 错误: 请在 .env 文件中配置 OSS_ACCESS_KEY_ID 和 OSS_ACCESS_KEY_SECRET');
    process.exit(1);
  }

  console.log('🚀 开始上传默认头像...\n');

  const uploadedUrls = [];

  for (let i = 1; i <= DEFAULT_AVATAR_COUNT; i++) {
    const fileName = `default${i}.svg`;
    const ossPath = `avatars/${fileName}`;

    console.log(`📤 正在上传 ${fileName}...`);
    
    // 创建占位符图片
    const placeholderImage = createPlaceholderImage(i);
    try {
      const result = await client.put(ossPath, placeholderImage, {
        headers: {
          'Content-Type': 'image/svg+xml'
        }
      });
      console.log(`✅ 上传成功: ${result.url}`);
      uploadedUrls.push(result.url);
    } catch (error) {
      console.error(`❌ 上传失败 ${fileName}:`, error.message);
    }
  }

  console.log('\n🎉 上传完成！');
  console.log('\n将以下配置添加到 .env 文件：');
  console.log(`DEFAULT_AVATARS=${uploadedUrls.join(',')}`);
}

/**
 * 创建简单的占位符图片（SVG 格式）
 */
function createPlaceholderImage(index) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'
  ];
  const color = colors[(index - 1) % colors.length];
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="${color}"/>
    <circle cx="100" cy="70" r="40" fill="white" opacity="0.9"/>
    <ellipse cx="100" cy="160" rx="60" ry="50" fill="white" opacity="0.9"/>
  </svg>`;
  
  return Buffer.from(svg);
}

// 运行上传
uploadDefaultAvatars().catch(console.error);
