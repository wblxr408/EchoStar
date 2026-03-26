import { ReportService } from './report.service.js';

/**
 * 创建举报（用户）
 */
export const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason } = req.body;
    const reporterId = req.user.id;

    const report = await ReportService.createReport({
      targetType,
      targetId,
      reporterId,
      reason
    });

    res.status(201).json({
      code: 0,
      message: '举报提交成功',
      data: {
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        status: report.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户自己的举报列表（用户）
 */
export const getUserReports = async (req, res, next) => {
  try {
    const reporterId = req.user.id;
    const { page, limit } = req.query;

    const result = await ReportService.getUserReports({
      reporterId,
      page,
      limit
    });

    res.json({
      code: 0,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取举报列表（管理员）
 */
export const getReports = async (req, res, next) => {
  try {
    const { targetType, status, page, limit } = req.query;

    const result = await ReportService.getReports({
      targetType,
      status,
      page,
      limit
    });

    res.json({
      code: 0,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 处理举报（管理员）
 */
export const handleReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { action } = req.body;
    const adminId = req.user.id;

    await ReportService.handleReport(reportId, action, adminId);
    res.json({
      code: 0,
      message: action === 'approve' ? '举报已批准，内容已处理' : '举报已拒绝'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取举报统计（管理员）
 */
export const getStatistics = async (req, res, next) => {
  try {
    const stats = await ReportService.getStatistics();
    res.json({ code: 0, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取故事举报列表（管理员）
 */
export const getStoryReports = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    const result = await ReportService.getStoryReports({ status, page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取评论举报列表（管理员）
 */
export const getCommentReports = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    const result = await ReportService.getCommentReports({ status, page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};
