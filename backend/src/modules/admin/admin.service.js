import { Story } from '../story/story.model.js';
import { User } from '../auth/auth.model.js';
import { AdminAction, Report } from './admin.model.js';
import { Op } from 'sequelize';

/**
 * 自定义错误类 - 统一错误处理
 */
class AdminError extends Error {
  constructor(message, code = 4000) {
    super(message);
    this.code = code;
    this.name = 'AdminError';
  }
}

/**
 * Admin Service - 管理员业务逻辑
 */
export const AdminService = {
  /**
   * 设为推荐
   */
  async recommendStory(storyId, adminId, reason) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new AdminError('故事不存在', 4004);
    }

    // 检查是否已经是推荐状态
    if (story.isRecommended) {
      throw new AdminError('故事已经是推荐状态', 4000);
    }

    await story.update({ isRecommended: true });

    // 记录管理员操作
    await AdminAction.create({
      storyId,
      adminId,
      actionType: 'recommend',
      reason
    });
  },

  /**
   * Shadowban 故事
   */
  async shadowbanStory(storyId, reason, adminId) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new AdminError('故事不存在', 4004);
    }

    // 检查是否已经是 shadowban 状态
    if (story.visibility === 'shadowban') {
      throw new AdminError('故事已经是 shadowban 状态', 4000);
    }

    await story.update({ visibility: 'shadowban' });

    // 记录管理员操作
    await AdminAction.create({
      storyId,
      adminId,
      actionType: 'shadowban',
      reason
    });
  },

  /**
   * 恢复故事
   */
  async restoreStory(storyId, adminId) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new AdminError('故事不存在', 4004);
    }

    // 检查当前状态
    if (story.visibility === 'public') {
      throw new AdminError('故事已经是公开状态', 4000);
    }

    // 检查是否为已删除状态
    if (story.visibility === 'deleted') {
      throw new AdminError('故事已删除，无法恢复', 4000);
    }

    await story.update({ visibility: 'public' });

    // 记录管理员操作
    await AdminAction.create({
      storyId,
      adminId,
      actionType: 'restore'
    });
  },

  /**
   * 获取举报列表
   */
  async getReports({ status = 'pending', page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Report.findAndCountAll({
      where: { status },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Story,
          as: 'story',
          attributes: ['id', 'content', 'images']
        },
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username']
        }
      ]
    });

    return {
      reports: rows.map(report => ({
        id: report.id,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
        story: report.story ? {
          id: report.story.id,
          content: report.story.content ? report.story.content.substring(0, 100) : '',
          images: JSON.parse(report.story.images)
        } : null,
        reporter: report.reporter ? {
          id: report.reporter.id,
          username: report.reporter.username
        } : null
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  },

  /**
   * 处理举报
   */
  async handleReport(reportId, action, adminId) {
    const report = await Report.findByPk(reportId);

    if (!report) {
      throw new AdminError('举报不存在', 4004);
    }

    if (report.status !== 'pending') {
      throw new AdminError('举报已处理', 4000);
    }

    if (action === 'approve') {
      // 批准举报，Shadowban 该故事
      await this.shadowbanStory(report.storyId, `举报通过: ${report.reason}`, adminId);
      await report.update({ status: 'approved', handledBy: adminId, handledAt: new Date() });
    } else if (action === 'reject') {
      // 拒绝举报
      await report.update({ status: 'rejected', handledBy: adminId, handledAt: new Date() });
    } else {
      throw new AdminError('无效的操作类型', 4000);
    }
  },

  /**
   * 数据统计
   */
  async getStatistics() {
    // 总用户数
    const totalUsers = await User.count();

    // 总故事数
    const totalStories = await Story.count();

    // 公开故事数
    const publicStories = await Story.count({
      where: { visibility: 'public' }
    });

    // 时光胶囊数
    const timeCapsules = await Story.count({
      where: { isTimeCapsule: true }
    });

    // Shadowban 故事数
    const shadowbannedStories = await Story.count({
      where: { visibility: 'shadowban' }
    });

    // 待处理举报数
    const pendingReports = await Report.count({
      where: { status: 'pending' }
    });

    // 今日新增故事
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStories = await Story.count({
      where: {
        createdAt: {
          [Op.gte]: today
        }
      }
    });

    return {
      totalUsers,
      totalStories,
      publicStories,
      timeCapsules,
      shadowbannedStories,
      pendingReports,
      todayStories
    };
  }
};
