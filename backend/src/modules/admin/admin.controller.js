import { AdminService } from './admin.service.js';

/**
 * 设为推荐
 */
export const recommendStory = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    await AdminService.recommendStory(storyId, adminId, reason);
    res.json({ code: 0, message: '设置成功' });
  } catch (error) {
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
    next(error);
  }
};

/**
 * 获取举报列表
 */
export const getReports = async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const result = await AdminService.getReports({ status, page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 处理举报
 */
export const handleReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { action } = req.body; // 'approve' | 'reject'

    // 验证 action 参数
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({
        code: 4000,
        message: '无效的操作类型，必须是 approve 或 reject'
      });
    }

    const adminId = req.user.id;

    await AdminService.handleReport(reportId, action, adminId);
    res.json({ code: 0, message: '处理成功' });
  } catch (error) {
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
