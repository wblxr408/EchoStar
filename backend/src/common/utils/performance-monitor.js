/**
 * 高性能监控工具
 * 实时监控系统性能，识别瓶颈并提供优化建议
 */

import { performance } from 'perf_hooks';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      slowQuery: 100, // 100ms
      highMemory: 0.8, // 80% 内存使用率
      highCpu: 0.7, // 70% CPU 使用率
    };
    this.alerts = [];
    this.isEnabled = process.env.NODE_ENV !== 'test';
  }

  /**
   * 开始性能监控
   */
  startMonitoring(operationName) {
    if (!this.isEnabled) return null;
    
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    return {
      operationName,
      startTime,
      startMemory,
      end: () => this.endMonitoring(operationName, startTime, startMemory)
    };
  }

  /**
   * 结束性能监控并记录指标
   */
  endMonitoring(operationName, startTime, startMemory) {
    if (!this.isEnabled) return;
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;
    
    const memoryDiff = {
      rss: endMemory.rss - startMemory.rss,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    };

    // 记录指标
    this.recordMetric(operationName, {
      duration,
      memoryDiff,
      timestamp: Date.now()
    });

    // 检查阈值并触发警报
    this.checkThresholds(operationName, duration, memoryDiff);

    return { duration, memoryDiff };
  }

  /**
   * 记录性能指标
   */
  recordMetric(operationName, metric) {
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }
    
    const operationMetrics = this.metrics.get(operationName);
    operationMetrics.push(metric);
    
    // 只保留最近100个指标
    if (operationMetrics.length > 100) {
      operationMetrics.shift();
    }
  }

  /**
   * 检查阈值并触发警报
   */
  checkThresholds(operationName, duration, memoryDiff) {
    // 检查慢查询
    if (duration > this.thresholds.slowQuery) {
      this.triggerAlert('slow_query', {
        operation: operationName,
        duration,
        threshold: this.thresholds.slowQuery
      });
    }

    // 检查内存使用
    const memoryUsage = process.memoryUsage();
    const memoryRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
    
    if (memoryRatio > this.thresholds.highMemory) {
      this.triggerAlert('high_memory', {
        operation: operationName,
        memoryRatio,
        threshold: this.thresholds.highMemory
      });
    }
  }

  /**
   * 触发性能警报
   */
  triggerAlert(type, details) {
    const alert = {
      type,
      details,
      timestamp: Date.now(),
      level: type === 'slow_query' ? 'warning' : 'critical'
    };
    
    this.alerts.push(alert);
    
    // 只保留最近50个警报
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }

    // 开发环境输出警报
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PERF_ALERT] ${type}:`, details);
    }
  }

  /**
   * 获取性能统计
   */
  getStats() {
    const stats = {};
    
    for (const [operation, metrics] of this.metrics) {
      if (metrics.length === 0) continue;
      
      const durations = metrics.map(m => m.duration);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const p95Duration = this.calculatePercentile(durations, 95);
      
      stats[operation] = {
        callCount: metrics.length,
        avgDuration: Math.round(avgDuration),
        maxDuration: Math.round(maxDuration),
        p95Duration: Math.round(p95Duration),
        lastCall: metrics[metrics.length - 1].timestamp
      };
    }
    
    return stats;
  }

  /**
   * 计算百分位数
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(percentile / 100 * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * 获取系统状态
   */
  getSystemStatus() {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024)
      },
      uptime: Math.round(uptime),
      cpuUsage: {
        user: Math.round(cpuUsage.user / 1000), // microseconds to milliseconds
        system: Math.round(cpuUsage.system / 1000)
      },
      alerts: this.alerts.length,
      activeMetrics: this.metrics.size
    };
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions() {
    const stats = this.getStats();
    const suggestions = [];
    
    for (const [operation, data] of Object.entries(stats)) {
      if (data.avgDuration > this.thresholds.slowQuery) {
        suggestions.push({
          operation,
          issue: '响应时间过长',
          severity: data.p95Duration > 500 ? 'high' : 'medium',
          suggestion: `考虑添加缓存或优化数据库查询，当前平均耗时: ${data.avgDuration}ms`
        });
      }
      
      if (data.callCount > 1000 && data.avgDuration > 50) {
        suggestions.push({
          operation,
          issue: '高频调用性能问题',
          severity: 'high',
          suggestion: `高频调用操作应考虑批量处理或异步处理，调用次数: ${data.callCount}`
        });
      }
    }
    
    return suggestions;
  }

  /**
   * 重置监控数据
   */
  reset() {
    this.metrics.clear();
    this.alerts = [];
  }

  /**
   * 导出监控数据
   */
  exportData() {
    return {
      stats: this.getStats(),
      systemStatus: this.getSystemStatus(),
      alerts: this.alerts,
      suggestions: this.generateOptimizationSuggestions(),
      timestamp: Date.now()
    };
  }
}

// 创建全局监控实例
const performanceMonitor = new PerformanceMonitor();

/**
 * 性能监控中间件
 */
export function performanceMiddleware(req, res, next) {
  if (!performanceMonitor.isEnabled) {
    return next();
  }

  const monitor = performanceMonitor.startMonitoring(`${req.method} ${req.path}`);
  
  if (monitor) {
    const originalSend = res.send;
    res.send = function(data) {
      monitor.end();
      originalSend.call(this, data);
    };
  }
  
  next();
}

/**
 * 异步操作性能监控装饰器
 */
export function monitorAsync(operationName) {
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const monitor = performanceMonitor.startMonitoring(operationName);
      try {
        const result = await originalMethod.apply(this, args);
        if (monitor) monitor.end();
        return result;
      } catch (error) {
        if (monitor) monitor.end();
        throw error;
      }
    };
    
    return descriptor;
  };
}

export default performanceMonitor;