/**
 * 多进程集群模式入口
 * 使用 Node.js 原生 cluster 模块，自动 fork CPU 核心数个 worker 进程
 * 
 * 使用方式：
 *   node src/cluster.js          (多进程集群模式)
 *   node src/server.js           (单进程模式，开发用)
 *   npm run dev                  (nodemon 单进程)
 */

process.env.TZ = 'Asia/Shanghai';

import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import process from 'node:process';

const numCPUs = availableParallelism();

if (cluster.isPrimary) {
  console.log(`\n========================================`);
  console.log(`  EchoStar Cluster Mode`);
  console.log(`  Primary PID: ${process.pid}`);
  console.log(`  Workers: ${numCPUs}`);
  console.log(`========================================\n`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });
} else {
  // Worker 进程加载 server.js
  await import('./server.js');
}
