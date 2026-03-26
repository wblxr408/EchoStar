import { AdminService } from './admin.service.js';

/**
 * 设为推荐
 */
export const recommendStory = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const story = await AdminService.recommendStory(storyId, adminId, reason);
    res.json({
      code: 0,
      message: '设置成功',
      data: {
        id: story.id,
        isRecommended: story.isRecommended
      }
    });
  } catch (error) {
    if (error.name === 'AdminError') {
      return res.status(error.statusCode || 400).json({
        code: error.statusCode || 400,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * 取消推荐
 */
export const unrecommendStory = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const story = await AdminService.unrecommendStory(storyId, adminId, reason);
    res.json({
      code: 0,
      message: '取消推荐成功',
      data: {
        id: story.id,
        isRecommended: story.isRecommended
      }
    });
  } catch (error) {
    if (error.name === 'AdminError') {
      return res.status(error.statusCode || 400).json({
        code: error.statusCode || 400,
        message: error.message
      });
    }
    next(error);
  }
};


/**
 * Shadowban 故事
 */
export const shadowbanStory = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    await AdminService.shadowbanStory(storyId, reason, adminId);
    res.json({ code: 0, message: 'Shadowban 成功' });
  } catch (error) {
    if (error.name === 'AdminError') {
      return res.status(error.statusCode || 400).json({
        code: error.statusCode || 400,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * 恢复故事
 */
export const restoreStory = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const adminId = req.user.id;

    await AdminService.restoreStory(storyId, adminId);
    res.json({ code: 0, message: '恢复成功' });
  } catch (error) {
    if (error.name === 'AdminError') {
      return res.status(error.statusCode || 400).json({
        code: error.statusCode || 400,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * 封禁用户
 */
export const banUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    await AdminService.banUser(userId, reason, adminId);
    res.json({ code: 0, message: '封禁成功' });
  } catch (error) {
    if (error.name === 'AdminError') {
      return res.status(error.statusCode || 400).json({
        code: error.statusCode || 400,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * 解封用户
 */
export const unbanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    await AdminService.unbanUser(userId, adminId);
    res.json({ code: 0, message: '解封成功' });
  } catch (error) {
    if (error.name === 'AdminError') {
      return res.status(error.statusCode || 400).json({
        code: error.statusCode || 400,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * 数据统计
 */
export const getStatistics = async (req, res, next) => {
  try {
    const stats = await AdminService.getStatistics();
    res.json({ code: 0, data: stats });
  } catch (error) {
    next(error);
  }
};
