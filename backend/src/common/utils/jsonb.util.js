/**
 * JSONB 字段处理工具
 *
 * 用于安全处理 PostgreSQL JSONB 类型字段，兼容 Sequelize 的不同行为
 */

/**
 * 安全解析 JSONB 字段
 *
 * 处理 Sequelize 对 JSONB 类型的不一致行为：
 * - 某些情况下自动解析为 JavaScript 对象/数组
 * - 某些情况下返回字符串
 * - 可能返回 null 或 undefined
 *
 * @param {*} value - 从数据库读取的 JSONB 值
 * @param {any} defaultValue - 解析失败时的默认值，默认为 []
 * @returns {any} 解析后的值
 *
 * @example
 * // 当 Sequelize 已经解析为数组时
 * safeParseJSONB(['url1', 'url2'], []) // 返回 ['url1', 'url2']
 *
 * // 当 Sequelize 返回字符串时
 * safeParseJSONB('["url1", "url2"]', []) // 返回 ['url1', 'url2']
 *
 * // 当值为 null 时
 * safeParseJSONB(null, []) // 返回 []
 *
 * // 解析失败时
 * safeParseJSONB('invalid json', []) // 返回 []
 */
export function safeParseJSONB(value, defaultValue = []) {
  // 如果已经是对象或数组，直接返回
  if (Array.isArray(value)) {
    return value;
  }

  if (value !== null && typeof value === 'object') {
    return value;
  }

  // 如果是 null 或 undefined，返回默认值
  if (value === null || value === undefined) {
    return defaultValue;
  }

  // 如果是字符串，尝试解析
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      // 如果解析结果不是数组/对象，返回默认值
      if (Array.isArray(parsed) || (parsed !== null && typeof parsed === 'object')) {
        return parsed;
      }
      return defaultValue;
    } catch (error) {
      console.warn('[safeParseJSONB] JSONB 解析失败:', error);
      return defaultValue;
    }
  }

  // 其他情况（数字、布尔值等），返回默认值
  return defaultValue;
}
