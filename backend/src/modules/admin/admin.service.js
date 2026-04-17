import { Story } from '../story/story.model.js';
import { User } from '../auth/auth.model.js';
import { AdminAction } from './admin.model.js';
import { Blacklist } from '../auth/blacklist.model.js';
import { sequelize } from '../../config/database.js';
import { clearUserCache } from '../auth/auth.middleware.js';
import { Op } from 'sequelize';
import { redisClient } from '../../common/utils/redis.js';
import { Like } from '../like/like.model.js';
import { Comment } from '../comment/comment.model.js';
import { Favorite } from '../favorite/favorite.model.js';

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

    // 禁止推荐未解锁的时光胶囊
    if (story.isTimeCapsule && story.unlockAt && new Date(story.unlockAt) > new Date()) {
      throw new AdminError('无法推荐未解锁的时光胶囊故事', 400);
    }

    // 更新推荐状态
    await story.update({ isRecommended: true });

    // 清除故事详情缓存
    const redis = redisClient.getClient();
    await redis.del(`story:raw:${storyId}`);

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

    // 清除故事详情缓存
    const redis = redisClient.getClient();
    await redis.del(`story:raw:${storyId}`);

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

    await story.update({ visibility: 'shadowban', isRecommended: false });

    // 清除故事缓存，确保立即生效
    const redis = redisClient.getClient();
    await redis.del(`story:raw:${storyId}`);

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

    await story.update({ visibility: 'public', isRecommended: false });

    // 清除故事缓存，确保立即生效
    const redisForRestore = redisClient.getClient();
    await redisForRestore.del(`story:raw:${storyId}`);

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

    // 检查是否已在黑名单中
    const existingBlacklist = await Blacklist.findOne({ where: { email: user.email } });
    if (existingBlacklist) {
      throw new AdminError('该用户已在黑名单中', 400);
    }

    // 使用事务确保原子性
    const transaction = await sequelize.transaction();
    try {
      // 将用户状态标记为 deleted
      await user.update({ status: 'deleted' }, { transaction });

      // 在黑名单中记录被封禁信息
      await Blacklist.create({
        email: user.email,
        reason: reason || '违规操作',
        bannedBy: adminId
      }, { transaction });

      await transaction.commit();

      await clearUserCache(user.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * 解封用户
   */
  async unbanUser(userId, adminId) {
    // 先查找用户获取 email
    const userdata = await User.findByPk(userId);
    if (!userdata) {
      throw new AdminError('原用户数据已被清除，无法解封', 404);
    }

    // 查找黑名单记录
    const blacklistEntry = await Blacklist.findOne({ where: { email: userdata.email } });
    if (!blacklistEntry) {
      throw new AdminError('用户不在封禁状态', 400);
    }

    // 使用事务确保原子性
    const transaction = await sequelize.transaction();
    try {
      // 解封用户
      await userdata.update({ status: 'normal' }, { transaction });

      // 从黑名单中移除该用户的记录
      await Blacklist.destroy({
        where: { email: userdata.email },
        transaction
      });

      await transaction.commit();

      await clearUserCache(userdata.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * 升级用户为VIP
   * @param {number} userId - 用户ID
   * @param {number} adminId - 管理员ID
   * @param {number} days - VIP天数
   */
  async upgradeUserToVip(userId, adminId, days = 30) {
    const { VipService } = await import('../vip/vip.service.js');
    return await VipService.upgradeUserToVip(userId, adminId, days);
  },

  /**
   * 数据统计
   */
  async getStatistics() {
    // 总用户数
    const totalUsers = await User.count();

    // 总故事数（排除 deleted）
    const totalStories = await Story.count({
      where: { visibility: { [Op.ne]: 'deleted' } }
    });

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

    // 点赞总数
    const totalLikes = await Like.count();

    // 评论总数（活跃状态）
    const totalComments = await Comment.count({
      where: { status: 'active' }
    });

    // 收藏总数
    const totalFavorites = await Favorite.count();

    return {
      totalUsers,
      totalStories,
      publicStories,
      timeCapsules,
      shadowbannedStories,
      todayStories,
      totalLikes,
      totalComments,
      totalFavorites
    };
  }
};
