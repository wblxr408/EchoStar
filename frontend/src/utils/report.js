/**
 * 举报相关工具函数
 */

// 举报类型配置
export const REPORT_TYPES = [
  { key: 'spam', label: '📢 垃圾广告' },
  { key: 'abuse', label: '🤬 恶意攻击' },
  { key: 'illegal', label: '🚫 违法违规' },
  { key: 'porn', label: '🔞 色情内容' },
  { key: 'other', label: '📝 其他' }
];

// 举报类型映射表
const reportTypeMap = REPORT_TYPES.reduce((acc, r) => {
  acc[r.key] = r.label;
  return acc;
}, {});

/**
 * 获取举报类型标签
 * @param {String} type - 举报类型key
 * @returns {String} 带emoji的标签
 */
export function getReportTypeLabel(type) {
  return reportTypeMap[type] || '📝 其他';
}

/**
 * 获取举报类型纯文本（不含emoji）
 * @param {String} type - 举报类型key
 * @returns {String} 纯文本标签
 */
export function getReportTypeText(type) {
  const label = reportTypeMap[type] || '其他';
  return label.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '');
}
