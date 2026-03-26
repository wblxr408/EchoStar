import { Story } from '../story/story.model.js';
import { User } from '../auth/auth.model.js';
import { AdminAction } from './admin.model.js';
import { Op } from 'sequelize';

/**
 * 自定义错误类 - 统一错误处理
 */
class AdminError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
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
      throw new AdminError('故事不存在', 404);
    }

    // 检查是否已经是推荐状态
    if (story.isRecommended) {
      throw new AdminError('故事已经是推荐状态', 400);
    }

    // 更新推荐状态
    await story.update({ isRecommended: true });

    // 记录管理员操作
    await AdminAction.create({
      storyId,
      adminId,
      actionType: 'recommend',
      reason: reason || ''
    });

    return story; // 返回更新后的 story，方便给前端返回状态
  },

  /**
   * 取消推荐
   */
  async unrecommendStory(storyId, adminId, reason) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new AdminError('故事不存在', 404);
    }

    // 检查是否不是推荐状态
    if (!story.isRecommended) {
      throw new AdminError('故事当前不是推荐状态', 400);
    }

    // 取消推荐状态
    await story.update({ isRecommended: false });

    // 记录管理员操作
    await AdminAction.create({
      storyId,
      adminId,
      actionType: 'unrecommend',
      reason: reason || ''
    });

    return story;
  },


  /**
   * Shadowban 故事
   */
  async shadowbanStory(storyId, reason, adminId) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new AdminError('故事不存在', 404);
    }

    // 检查是否已经是 shadowban 状态
    if (story.visibility === 'shadowban') {
      throw new AdminError('故事已经是 shadowban 状态', 400);
    }

    await story.update({ visibility: 'shadowban' });

    // 记录管理员操作
    await AdminAction.create({
      storyId,
      adminId,
      actionType: 'shadowban',
      reason: reason || ''
    });
  },

  /**
   * 恢复故事
   */
  async restoreStory(storyId, adminId) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new AdminError('故事不存在', 404);
    }

    // 检查当前状态
    if (story.visibility === 'public') {
      throw new AdminError('故事已经是公开状态', 400);
    }

    // 检查是否为已删除状态
    if (story.visibility === 'deleted') {
      throw new AdminError('故事已删除，无法恢复', 400);
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
   * 封禁用户
   */
  async banUser(userId, reason, adminId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AdminError('用户不存在', 404);
    }

    if (user.role === 'admin') {
      throw new AdminError('不能封禁管理员', 403);
    }

    if (user.status === 'deleted') {
      throw new AdminError('用户已被封禁或删除', 400);
    }

    // 将用户状态标记为 deleted，现有 auth.middleware.js 会拦截其请求
    await user.update({ status: 'deleted' });

    // 在黑名单中记录被封禁信息
    await Blacklist.create({
      email: user.email,
      reason: reason || '违规操作',
      bannedBy: adminId
    });
  },

  /**
   * 解封用户
   */
  async unbanUser(userId, adminId) {
    // const user = await User.findByPk(userId);
    const user = await Blacklist.findOne({ where: { email } });

    if (!user) {
      throw new AdminError('用户不存在或当前不是封禁状态', 404);
    }

    // if (user.status !== 'deleted') {
    //   throw new AdminError('用户不存在或当前不是封禁状态', 400);
    // }

    const userdata = await User.findByPk(userId);
    if ( !userdata ) {
      throw new AdminError('原用户数据已被清除，无法解封', 404);
    }
    // 解封用户
    await userdata.update({ status: 'normal' });

    // 从黑名单中移除该用户的记录
    await Blacklist.destroy({
      where: {
        email: user.email
      }
    });
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
      todayStories
    };
  }
};
