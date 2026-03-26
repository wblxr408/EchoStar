import { Favorite } from './favorite.model.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { Op } from 'sequelize';

/**
 * Favorite Service - 收藏业务逻辑
 */
class FavoriteServiceClass {
  /**
   * 收藏/取消收藏（根据是否存在决定操作）
   */
  async toggleFavorite(userId, storyId) {
    // 验证故事是否存在
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('故事不存在');
    }

    // 检查是否已收藏
    const existingFavorite = await Favorite.findOne({
      where: { userId, storyId }
    });

    if (existingFavorite) {
      // 已收藏，则取消收藏
      await existingFavorite.destroy();
      return { isFavorited: false, message: '已取消收藏' };
    } else {
      // 未收藏，则收藏
      const favorite = await Favorite.create({
        userId,
        storyId
      });
      return { isFavorited: true, message: '收藏成功', id: favorite.id };
    }
  }

  /**
   * 创建收藏
   */
  async createFavorite(userId, storyId) {
    // 验证故事是否存在
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('故事不存在');
    }

    // 检查是否已收藏
    const existingFavorite = await Favorite.findOne({
      where: { userId, storyId }
    });

    if (existingFavorite) {
      throw new Error('已经收藏过此故事');
    }

    // 创建收藏
    const favorite = await Favorite.create({
      userId,
      storyId
    });

    return {
      id: favorite.id,
      storyId: favorite.storyId,
      createdAt: favorite.createdAt
    };
  }

  /**
   * 取消收藏
   */
  async deleteFavorite(storyId, userId) {
    const favorite = await Favorite.findOne({
      where: { userId, storyId }
    });

    if (!favorite) {
      throw new Error('收藏记录不存在');
    }

    await favorite.destroy();

    return { success: true, message: '取消收藏成功' };
  }

  /**
   * 获取故事收藏列表
   */
  async getFavoritesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Favorite.findAndCountAll({
      where: { storyId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      favorites: rows.map(favorite => ({
        id: favorite.id,
        createdAt: favorite.createdAt,
        user: {
          id: favorite.userId,
          username: favorite.user?.username || '匿名用户',
          avatar: favorite.user?.avatarUrl || null
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 统计收藏数量
   */
  async getFavoriteCount(storyId) {
    const count = await Favorite.count({
      where: { storyId }
    });

    return { storyId, favoriteCount: count };
  }

  /**
   * 检查用户是否已收藏
   */
  async checkIsFavorited(storyId, userId) {
    const favorite = await Favorite.findOne({
      where: { userId, storyId }
    });

    return { storyId, isFavorited: !!favorite };
  }

  /**
   * 获取用户的收藏列表（我的收藏）
   */
  async getUserFavorites(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Favorite.findAndCountAll({
      where: { userId },
      include: [{
        model: Story,
        as: 'story',
        attributes: ['id', 'content', 'images', 'emotionTag', 'createdAt']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      favorites: rows.map(favorite => ({
        id: favorite.id,
        createdAt: favorite.createdAt,
        story: {
          id: favorite.storyId,
          content: favorite.story?.content,
          images: favorite.story?.images || [],
          emotionTag: favorite.story?.emotionTag,
          createdAt: favorite.story?.createdAt
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 批量检查多个故事的收藏状态
   */
  async checkMultipleFavorited(storyIds, userId) {
    const favorites = await Favorite.findAll({
      where: {
        userId,
        storyId: { [Op.in]: storyIds }
      },
      attributes: ['storyId']
    });

    const favoritedStoryIds = favorites.map(favorite => favorite.storyId);

    return storyIds.map(storyId => ({
      storyId,
      isFavorited: favoritedStoryIds.includes(storyId)
    }));
  }
}

// 创建单例实例
export const favoriteServiceInstance = new FavoriteServiceClass();

// 导出别名
export { favoriteServiceInstance as FavoriteService };
