/**
 * 公告相关工具函数
 */

// 公告类型配置
export const ANNOUNCEMENT_TYPES = [
  { key: 'info', icon: '📢', label: '通知', color: '#667eea' },
  { key: 'warning', icon: '⚠️', label: '警告', color: '#f59e0b' },
  { key: 'feature', icon: '✨', label: '更新', color: '#10b981' },
  { key: 'emotion', icon: '💝', label: '互动', color: '#ef4444' }
];

// 公告类型映射表
const announcementTypeMap = ANNOUNCEMENT_TYPES.reduce((acc, a) => {
  acc[a.key] = a;
  return acc;
}, {});

/**
 * 获取公告类型图标
 * @param {String} type - 公告类型key
 * @returns {String} emoji图标
 */
export function getAnnouncementTypeIcon(type) {
  return announcementTypeMap[type]?.icon || '📢';
}

/**
 * 获取公告类型标签
 * @param {String} type - 公告类型key
 * @returns {String} 文本标签
 */
export function getAnnouncementTypeLabel(type) {
  return announcementTypeMap[type]?.label || '系统公告';
}

/**
 * 获取公告类型颜色
 * @param {String} type - 公告类型key
 * @returns {String} 颜色值
 */
export function getAnnouncementTypeColor(type) {
  return announcementTypeMap[type]?.color || '#667eea';
}
