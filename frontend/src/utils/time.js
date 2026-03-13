/**
 * 时间格式化工具
 */

/**
 * 格式化时间为相对时间
 * @param {String|Date} time - 时间
 * @returns {String} 格式化后的相对时间
 */
export function formatRelativeTime(time) {
  const now = new Date();
  const date = new Date(time);
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 30) {
    return `${days}天前`;
  } else if (months < 12) {
    return `${months}个月前`;
  } else {
    return `${years}年前`;
  }
}

/**
 * 格式化时间为标准格式
 * @param {String|Date} time - 时间
 * @param {String} format - 格式 (默认: YYYY-MM-DD HH:mm:ss)
 * @returns {String} 格式化后的时间
 */
export function formatDateTime(time, format = 'YYYY-MM-DD HH:mm:ss') {
  const date = new Date(time);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 判断时光胶囊是否已解锁
 * @param {String|Date} unlockAt - 解锁时间
 * @returns {Boolean}
 */
export function isTimeCapsuleUnlocked(unlockAt) {
  return new Date() >= new Date(unlockAt);
}

/**
 * 计算时光胶囊剩余时间
 * @param {String|Date} unlockAt - 解锁时间
 * @returns {String} 剩余时间描述
 */
export function getTimeCapsuleCountdown(unlockAt) {
  const now = new Date();
  const unlock = new Date(unlockAt);
  const diff = unlock - now;

  if (diff <= 0) {
    return '已解锁';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}天${hours}小时后解锁`;
  } else if (hours > 0) {
    return `${hours}小时后解锁`;
  } else {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}分钟后解锁`;
  }
}
