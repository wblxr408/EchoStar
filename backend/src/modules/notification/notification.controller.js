import { NotificationService } from './notification.service.js';

/**
 * 标记通知为已读
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id: noticeId } = req.params;
    const userId = req.user.id;

    await NotificationService.markAsRead(userId, noticeId);
    res.json({ code: 0, message: '标记已读成功' });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取我的通知列表（分页）
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await NotificationService.getNotifications(userId, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取未读通知数量
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await NotificationService.getUnreadCount(userId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 标记所有通知为已读
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await NotificationService.markAllAsRead(userId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 清空所有通知
 */
export const clearAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await NotificationService.clearAllNotifications(userId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建通知（内部调用，不需要路由）
 * 此方法供其他模块（如Like、Comment）调用
 */
export const createNotification = async (type, toUserId, fromUserId, storyId, content = '') => {
  return await NotificationService.createNotification(type, toUserId, fromUserId, storyId, content);
};
