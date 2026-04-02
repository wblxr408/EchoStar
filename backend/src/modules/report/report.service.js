import { Report } from './report.model.js';
import { Story } from '../story/story.model.js';
import { Comment } from '../comment/comment.model.js';
import { User } from '../auth/auth.model.js';
import { Op } from 'sequelize';
import { safeParseJSONB } from '../../common/utils/jsonb.util.js';
import { redisClient } from '../../common/utils/redis.js';
import { commentCacheUtil } from '../../common/utils/comment-cache.util.js';

/**
 * 自定义错误类 - 统一错误处理
 */
class ReportError extends Error {
  constructor(message, code = 4000) {
    super(message);
    this.code = code;
    this.name = 'ReportError';
  }
}

/**
 * Report Service - 举报业务逻辑
 */
export const ReportService = {
  /**
   * 创建举报
   */
  async createReport({ targetType, targetId, reporterId, reason }) {
    // 检查举报目标是否存在
    let target;
    if (targetType === 'story') {
      target = await Story.findByPk(targetId, {
        attributes: ['id', 'userId']
      });
    } else if (targetType === 'comment') {
      target = await Comment.findByPk(targetId, {
        attributes: ['id', 'userId', 'status']
      });

      // 评论必须是活跃状态才能被举报
      if (target && target.status !== 'active') {
        throw new ReportError('该评论已被删除', 4000);
      }
    }

    if (!target) {
      throw new ReportError('举报目标不存在', 4004);
    }

    // 检查是否重复举报
    const existingReport = await Report.findOne({
      where: {
        targetType,
        targetId,
        reporterId,
        status: { [Op.in]: ['pending', 'approved'] }
      }
    });

    if (existingReport) {
      if (existingReport.status === 'approved') {
        throw new ReportError('该举报已被批准', 4000);
      }
      throw new ReportError('您已举报过该内容，请勿重复举报', 4000);
    }

    // 创建举报记录
    const report = await Report.create({
      targetType,
      targetId,
      reporterId,
      reason
    });

    return report;
  },

  /**
   * 获取用户自己的举报列表【已修复N+1查询】
   */
  async getUserReports({ reporterId, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Report.findAndCountAll({
      where: { reporterId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    if (!rows.length) {
      return { reports: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    // 批量查询目标数据，彻底解决N+1
    const storyIds = [];
    const commentIds = [];
    rows.forEach(item => {
      if (item.targetType === 'story') storyIds.push(item.targetId);
      if (item.targetType === 'comment') commentIds.push(item.targetId);
    });

    const [stories, comments] = await Promise.all([
      Story.findAll({
        where: { id: storyIds },
        attributes: ['id', 'content', 'images', 'visibility', 'userId']
      }),
      Comment.findAll({
        where: { id: commentIds },
        attributes: ['id', 'content', 'status', 'userId']
      })
    ]);

    const storyMap = new Map(stories.map(s => [s.id, s]));
    const commentMap = new Map(comments.map(c => [c.id, c]));

    const reports = rows.map(report => {
      let target = null;
      if (report.targetType === 'story') {
        const s = storyMap.get(report.targetId);
        target = s ? {
          type: 'story',
          id: s.id,
          content: s.content?.substring(0, 200) || '',
          images: safeParseJSONB(s.images, []),
          visibility: s.visibility,
          userId: s.userId
        } : null;
      } else if (report.targetType === 'comment') {
        const c = commentMap.get(report.targetId);
        target = c ? {
          type: 'comment',
          id: c.id,
          content: c.content,
          status: c.status,
          userId: c.userId
        } : null;
      }

      return {
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        target,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
        handledAt: report.handledAt
      };
    });

    return {
      reports,
      pagination: {
        total: count,
        page: parseInt(page),
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  },

  /**
   * 管理员获取举报列表
   */
  async getReports({ targetType, status = 'pending', page = 1, limit = 20 }) {
    // 强制必须传入 targetType（二选一，无混合）
    if (!targetType || !['story', 'comment'].includes(targetType)) {
      throw new ReportError('请指定举报类型：story 或 comment', 4000);
    }

    const offset = (page - 1) * limit;
    const whereCondition = { status, targetType };

    // 1. 一次性查询举报列表（仅当前指定类型）
    const { rows, count } = await Report.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username', 'avatarUrl'] },
        { model: User, as: 'handler', attributes: ['id', 'username'] }
      ]
    });

    if (!rows.length) {
      return { reports: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    // 2. 提取所有目标ID + 批量查询（仅查对应一张表，无多余查询）
    const targetIds = rows.map(item => item.targetId);
    let targetMap = new Map();

    if (targetType === 'story') {
      const stories = await Story.findAll({
        where: { id: targetIds },
        attributes: ['id', 'content', 'images', 'visibility', 'isTimeCapsule', 'userId']
      });
      targetMap = new Map(stories.map(s => [s.id, s]));
    } else if (targetType === 'comment') {
      const comments = await Comment.findAll({
        where: { id: targetIds },
        attributes: ['id', 'content', 'status', 'userId'],
        include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
      });
      targetMap = new Map(comments.map(c => [c.id, c]));
    }

    // 3. 组装数据（结构完全不变）
    const reports = rows.map(report => {
      let target = null;
      const data = targetMap.get(report.targetId);

      if (targetType === 'story' && data) {
        target = {
          type: 'story',
          id: data.id,
          content: data.content?.substring(0, 200) || '',
          images: safeParseJSONB(data.images, []),
          visibility: data.visibility,
          userId: data.userId
        };
      } else if (targetType === 'comment' && data) {
        target = {
          type: 'comment',
          id: data.id,
          content: data.content,
          status: data.status,
          userId: data.userId,
          username: data.user?.username || null
        };
      }

      return {
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        target,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
        handledAt: report.handledAt,
        reporter: {
          id: report.reporter.id,
          username: report.reporter.username,
          avatarUrl: report.reporter.avatarUrl
        },
        handler: report.handler ? {
          id: report.handler.id,
          username: report.handler.username
        } : null
      };
    });

    return {
      reports,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  },

  /**
   * 获取举报目标信息
   */
  async getTargetInfo(targetType, targetId) {
    if (targetType === 'story') {
      const story = await Story.findByPk(targetId, {
        attributes: ['id', 'content', 'images', 'visibility', 'isTimeCapsule', 'userId']
      });
      if (!story) return null;
      return {
        type: 'story',
        id: story.id,
        content: story.content ? story.content.substring(0, 200) : '',
        images: story.images ? safeParseJSONB(story.images, []) : [],
        visibility: story.visibility,
        userId: story.userId
      };
    } else if (targetType === 'comment') {
      const comment = await Comment.findByPk(targetId, {
        attributes: ['id', 'content', 'status', 'userId'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }
        ]
      });
      if (!comment) return null;
      return {
        type: 'comment',
        id: comment.id,
        content: comment.content,
        status: comment.status,
        userId: comment.userId,
        username: comment.user ? comment.user.username : null
      };
    }
    return null;
  },

  /**
   * 处理举报
   */
  async handleReport(reportId, action, adminId) {
    const report = await Report.findByPk(reportId);

    if (!report) {
      throw new ReportError('举报不存在', 4004);
    }

    // restore: 将已处理的举报恢复为待处理
    if (action === 'restore') {
      if (report.status === 'pending') {
        throw new ReportError('该举报已是待处理状态', 4000);
      }

      // 如果之前是批准状态，恢复对应内容
      if (report.status === 'approved') {
        if (report.targetType === 'story') {
          const story = await Story.findByPk(report.targetId);
          if (story) {
            await story.update({ visibility: 'public' });
          }
        } else if (report.targetType === 'comment') {
          const comment = await Comment.findByPk(report.targetId);
          if (comment) {
            await comment.update({ status: 'active' });
            // 恢复评论时递增评论缓存计数
            await commentCacheUtil.incrementCommentCount(comment.storyId);
          }
        }
      }

      await report.update({
        status: 'pending',
        handledBy: null,
        handledAt: null
      });

      // 清除相关缓存
      try {
        const redis = redisClient.getClient();
        if (report.targetType === 'story') {
          await redis.del(`story:raw:${report.targetId}`);
        }
      } catch (err) {
        console.error(`❌ 清除缓存失败 [restore]:`, err);
      }

      return;
    }

    if (report.status !== 'pending') {
      throw new ReportError('举报已处理', 4000);
    }

    if (action === 'approve') {
      // 批准举报
      if (report.targetType === 'story') {
        // 故事设置为 shadowban
        const story = await Story.findByPk(report.targetId);
        if (story) {
          await story.update({ visibility: 'shadowban' });
        }
      } else if (report.targetType === 'comment') {
        // 评论软删除
        const comment = await Comment.findByPk(report.targetId);
        if (comment) {
          await comment.update({ status: 'deleted' });
          // 递减评论缓存计数
          await commentCacheUtil.decrementCommentCount(comment.storyId);
        }
      }
    }

    // 更新举报状态
    await report.update({
      status: action === 'approve' ? 'approved' : 'rejected',
      handledBy: adminId,
      handledAt: new Date()
    });

    // 批准故事举报时清除 story:raw 缓存
    if (action === 'approve' && report.targetType === 'story') {
      try {
        const redis = redisClient.getClient();
        await redis.del(`story:raw:${report.targetId}`);
      } catch (err) {
        console.error(`❌ 清除故事缓存失败 [storyId: ${report.targetId}]:`, err);
      }
    }
  },

  /**
   * 获取举报统计
   */
  async getStatistics() {
    const pending = await Report.count({ where: { status: 'pending' } });
    const storyReports = await Report.count({
      where: { targetType: 'story', status: 'pending' }
    });
    const commentReports = await Report.count({
      where: { targetType: 'comment', status: 'pending' }
    });

    return {
      pending,
      storyReports,
      commentReports
    };
  },

  /**
   * 管理员获取故事举报列表
   */
  async getStoryReports({ status = 'pending', page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const whereCondition = { targetType: 'story', status };

    const { rows, count } = await Report.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username', 'avatarUrl'] },
        { model: User, as: 'handler', attributes: ['id', 'username'] }
      ]
    });

    if (!rows.length) {
      return { reports: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    const targetIds = rows.map(item => item.targetId);
    const stories = await Story.findAll({
      where: { id: targetIds },
      attributes: ['id', 'content', 'images', 'visibility', 'userId']
    });
    const storyMap = new Map(stories.map(s => [s.id, s]));

    const reports = rows.map(report => {
      const story = storyMap.get(report.targetId);
      return {
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        target: story ? {
          type: 'story',
          id: story.id,
          content: story.content?.substring(0, 200) || '',
          images: story.images,
          visibility: story.visibility,
          userId: story.userId
        } : null,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
        handledAt: report.handledAt,
        reporter: {
          id: report.reporter.id,
          username: report.reporter.username,
          avatarUrl: report.reporter.avatarUrl
        },
        handler: report.handler ? {
          id: report.handler.id,
          username: report.handler.username
        } : null
      };
    });

    return {
      reports,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  },

  /**
   * 管理员获取评论举报列表
   */
  async getCommentReports({ status = 'pending', page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const whereCondition = { targetType: 'comment', status };

    const { rows, count } = await Report.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username', 'avatarUrl'] },
        { model: User, as: 'handler', attributes: ['id', 'username'] }
      ]
    });

    if (!rows.length) {
      return { reports: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    const targetIds = rows.map(item => item.targetId);
    const comments = await Comment.findAll({
      where: { id: targetIds },
      attributes: ['id', 'content', 'status', 'userId'],
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
    });
    const commentMap = new Map(comments.map(c => [c.id, c]));

    const reports = rows.map(report => {
      const comment = commentMap.get(report.targetId);
      return {
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        target: comment ? {
          type: 'comment',
          id: comment.id,
          content: comment.content,
          status: comment.status,
          userId: comment.userId,
          username: comment.user?.username || null
        } : null,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
        handledAt: report.handledAt,
        reporter: {
          id: report.reporter.id,
          username: report.reporter.username,
          avatarUrl: report.reporter.avatarUrl
        },
        handler: report.handler ? {
          id: report.handler.id,
          username: report.handler.username
        } : null
      };
    });

    return {
      reports,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }
};
