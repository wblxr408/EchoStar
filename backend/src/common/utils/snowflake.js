/**
 * 雪花ID生成器
 * 分布式唯一ID生成算法
 *
 * ID结构：41位时间戳 + 10位机器ID + 12位序列号
 * 总共64位，使用 BigInt 存储
 */
class Snowflake {
  constructor(workerId = 1, datacenterId = 1) {
    // 起始时间戳（2023-01-01 00:00:00 UTC）
    this.epoch = 1672531200000;

    // 机器ID位数
    this.workerIdBits = 5;
    this.datacenterIdBits = 5;
    this.sequenceBits = 12;

    // 最大值
    this.maxWorkerId = (1 << this.workerIdBits) - 1;
    this.maxDatacenterId = (1 << this.datacenterIdBits) - 1;
    this.maxSequence = (1 << this.sequenceBits) - 1;

    // 位移
    this.workerIdShift = this.sequenceBits;
    this.datacenterIdShift = this.sequenceBits + this.workerIdBits;
    this.timestampShift = this.sequenceBits + this.workerIdBits + this.datacenterIdBits;

    // 初始化
    this.workerId = workerId;
    this.datacenterId = datacenterId;
    this.sequence = 0;
    this.lastTimestamp = -1;

    // 校验
    if (workerId > this.maxWorkerId || workerId < 0) {
      throw new Error(`Worker ID must be between 0 and ${this.maxWorkerId}`);
    }
    if (datacenterId > this.maxDatacenterId || datacenterId < 0) {
      throw new Error(`Datacenter ID must be between 0 and ${this.maxDatacenterId}`);
    }
  }

  /**
   * 生成下一个ID
   * @returns {string} 雪花ID字符串
   */
  nextId() {
    let timestamp = this._currentTimeMillis();

    // 时钟回拨处理
    if (timestamp < this.lastTimestamp) {
      const offset = this.lastTimestamp - timestamp;
      if (offset <= 5) {
        // 小于5ms，等待
        while (timestamp <= this.lastTimestamp) {
          timestamp = this._currentTimeMillis();
        }
      } else {
        throw new Error(`Clock moved backwards. Refusing to generate ID for ${offset}ms`);
      }
    }

    // 同一毫秒内
    if (this.lastTimestamp === timestamp) {
      this.sequence = (this.sequence + 1) & this.maxSequence;
      // 序列号溢出，等待下一毫秒
      if (this.sequence === 0) {
        timestamp = this._tilNextMillis(this.lastTimestamp);
      }
    } else {
      // 新的一毫秒
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    // 组装ID
    const id = BigInt((timestamp - this.epoch) << this.timestampShift)
      | BigInt(this.datacenterId << this.datacenterIdShift)
      | BigInt(this.workerId << this.workerIdShift)
      | BigInt(this.sequence);

    return id.toString();
  }

  /**
   * 等待下一毫秒
   */
  _tilNextMillis(lastTimestamp) {
    let timestamp = this._currentTimeMillis();
    while (timestamp <= lastTimestamp) {
      timestamp = this._currentTimeMillis();
    }
    return timestamp;
  }

  /**
   * 获取当前时间戳
   */
  _currentTimeMillis() {
    return Date.now();
  }

  /**
   * 解析雪花ID
   * @param {string} id 雪花ID
   * @returns {Object} 解析结果
   */
  parse(id) {
    const num = BigInt(id);

    const timestamp = Number((num >> this.timestampShift) + BigInt(this.epoch));
    const datacenterId = Number((num >> this.datacenterIdShift) & BigInt(this.maxDatacenterId));
    const workerId = Number((num >> this.workerIdShift) & BigInt(this.maxWorkerId));
    const sequence = Number(num & BigInt(this.maxSequence));

    return {
      timestamp,
      datacenterId,
      workerId,
      sequence,
      date: new Date(timestamp)
    };
  }
}

/**
 * 默认雪花ID生成器实例
 * 可以通过环境变量配置 workerId 和 datacenterId
 */
const defaultWorkerId = parseInt(process.env.SNOWFLAKE_WORKER_ID) || 1;
const defaultDatacenterId = parseInt(process.env.SNOWFLAKE_DATACENTER_ID) || 1;

export const snowflake = new Snowflake(defaultWorkerId, defaultDatacenterId);
export default snowflake;
