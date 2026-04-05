/**
 * 清除数据并重启环境脚本
 * 
 * 执行流程：
 * 1. docker compose down -v (停止并删除容器和卷)
 * 2. docker compose up -d (后台启动容器)
 * 3. 等待数据库就绪
 * 4. 启动开发服务器 (npm run dev)
 * 5. 等待服务器就绪
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';
import fs from 'fs';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const BACKEND_DIR = join(__dirname, '..', '..', '..');

// 检查服务器是否就绪
function checkServerReady(url) {
  return new Promise((resolve) => {
    const req = http.get(`${url}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // 只有状态码为 200 时才认为服务器已就绪
        console.log(`[DEBUG] 健康检查响应: ${res.statusCode}`);
        resolve(res.statusCode === 200);
      });
    });
    req.on('error', (err) => {
      // 连接错误，服务器可能还没启动
      resolve(false);
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 等待服务器就绪
async function waitForServer(url, maxWait = 60000) {
  console.log(`[INFO] 等待服务器就绪: ${url}`);
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    if (await checkServerReady(url)) {
      console.log('[INFO] 服务器已就绪');
      return true;
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n[ERROR] 服务器启动超时');
  return false;
}

// 等待数据库就绪
async function waitForDatabase(maxWait = 60000) {
  console.log('[INFO] 等待数据库就绪...');
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      // 尝试直接连接数据库
      const { stdout } = await execAsync('docker compose exec -T postgres pg_isready -U postgres', { cwd: BACKEND_DIR });
      if (stdout.includes('accepting connections')) {
        console.log('[INFO] 数据库已就绪');
        return true;
      }
    } catch (e) {
      // 如果 pg_isready 失败，尝试检查容器状态
      try {
        const { stdout } = await execAsync('docker compose ps', { cwd: BACKEND_DIR });
        // Windows docker compose ps 输出格式不同
        if (stdout.includes('postgres') && (stdout.includes('running') || stdout.includes('Up') || stdout.includes('healthy'))) {
          // 额外等待让数据库完全初始化
          await new Promise(r => setTimeout(r, 3000));
          // 尝试用 psql 测试连接
          try {
            await execAsync('docker compose exec -T postgres psql -U postgres -c "SELECT 1"', { cwd: BACKEND_DIR });
            console.log('[INFO] 数据库已就绪');
            return true;
          } catch (e2) {
            // 连接测试失败，继续等待
          }
        }
      } catch (e2) {
        // 忽略错误
      }
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n[ERROR] 数据库启动超时');
  // 打印调试信息
  try {
    const { stdout } = await execAsync('docker compose ps', { cwd: BACKEND_DIR });
    console.log('[DEBUG] 容器状态:\n', stdout);
  } catch (e) {}
  return false;
}

async function main() {
  console.log('========================================');
  console.log('     清除数据并重启测试环境');
  console.log('========================================\n');

  try {
    // 1. 停止并删除容器
    console.log('[STEP 1] 停止并删除容器...');
    try {
      await execAsync('docker compose down -v', { cwd: BACKEND_DIR });
      console.log('[INFO] 容器和卷已删除');
    } catch (e) {
      console.log('[WARN] 停止容器失败（可能未运行）:', e.message);
    }

    // 2. 启动容器
    console.log('\n[STEP 2] 启动容器...');
    await execAsync('docker compose up -d', { cwd: BACKEND_DIR });
    console.log('[INFO] 容器已启动');

    // 3. 等待数据库
    console.log('\n[STEP 3] 等待数据库...');
    if (!await waitForDatabase()) {
      process.exit(1);
    }

    // 4. 启动开发服务器（在后台）
    const noLimitMode = process.argv.includes('--no-limit');
    const clusterMode = process.argv.includes('--cluster');
    console.log('\n[STEP 4] 启动开发服务器...');

    // 设置测试环境变量（放宽速率限制）
    const testEnv = {
      ...process.env,
      K6_TEST: 'true',
    };
    // 确保 NODE_ENV 不被设为 test，否则 syncDatabase 会被跳过
    delete testEnv.NODE_ENV;

    let serverProcess;

    if (noLimitMode && clusterMode) {
      // 集群 + 关限流模式：使用 cluster.no-limit.js 启动
      const clusterNoLimitPath = join(BACKEND_DIR, 'src', 'cluster.no-limit.js');
      if (!fs.existsSync(clusterNoLimitPath)) {
        console.error('[ERROR] 未找到 src/cluster.no-limit.js');
        console.error('[ERROR] 请确保该文件存在（它应该在 .gitignore 中，不会被提交到仓库）');
        process.exit(1);
      }
      serverProcess = spawn('node', [clusterNoLimitPath], {
        cwd: BACKEND_DIR,
        shell: true,
        detached: true,
        stdio: ['ignore', 'inherit', 'inherit'],
        env: testEnv,
      });
      console.log('[INFO] 已启用集群 + 关限流测试模式（多进程 + 速率限制已禁用）');
    } else if (noLimitMode) {
      // 关限流模式：使用 server.no-limit.js 启动（禁用所有限流中间件）
      const noLimitPath = join(BACKEND_DIR, 'src', 'server.no-limit.js');
      if (!fs.existsSync(noLimitPath)) {
        console.error('[ERROR] 未找到 src/server.no-limit.js');
        console.error('[ERROR] 请确保该文件存在（它应该在 .gitignore 中，不会被提交到仓库）');
        process.exit(1);
      }
      serverProcess = spawn('node', [noLimitPath], {
        cwd: BACKEND_DIR,
        shell: true,
        detached: true,
        stdio: ['ignore', 'inherit', 'inherit'],
        env: testEnv,
      });
      console.log('[INFO] 已启用关限流测试模式（所有速率限制已禁用）');
    } else {
      // 限流测试模式：使用正常服务器启动（保留限流功能）
      serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: BACKEND_DIR,
        shell: true,
        detached: true,
        stdio: ['ignore', 'inherit', 'inherit'],
        env: testEnv,
      });
      console.log('[INFO] 已启用限流测试模式（速率限制保留）');
    }

    serverProcess.unref();
    
    console.log('[INFO] 服务器已在后台启动');
    
    // 5. 等待服务器就绪
    console.log('\n[STEP 5] 等待服务器就绪...');
    const serverReady = await waitForServer(BASE_URL);
    if (!serverReady) {
      console.log('[ERROR] 服务器启动失败');
      console.log('[INFO] 查看服务器日志：');
      try {
        const { stdout } = await execAsync('npm run dev 2>&1 | head -50', { cwd: BACKEND_DIR });
        console.log(stdout);
      } catch (e) {}
      process.exit(1);
    }

    // 6. 额外等待数据库表同步完成
    console.log('\n[STEP 6] 等待数据库表同步...');
    await new Promise(r => setTimeout(r, 5000));
    console.log('[INFO] 数据库表同步等待完成');

    // 7. 验证服务器健康状态
    console.log('\n[STEP 7] 验证服务器健康状态...');
    const healthCheck = await checkServerReady(BASE_URL);
    if (!healthCheck) {
      console.log('[ERROR] 服务器健康检查失败');
      process.exit(1);
    }
    console.log('[INFO] 服务器健康检查通过');

    console.log('\n========================================');
    console.log('     环境重启完成！');
    console.log('========================================\n');
    
    // 返回成功，让测试脚本继续
    process.exit(0);

  } catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);
  }
}

main();
