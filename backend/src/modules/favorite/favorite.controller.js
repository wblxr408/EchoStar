import { FavoriteService } from './favorite.service.js';

/**
 * 收藏/取消收藏
 */
export const toggleFavorite = async (req, res, next) => {
  try {
    const { storyId } = req.body;
    const userId = req.user.id;

    const result = await FavoriteService.toggleFavorite(userId, storyId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建收藏
 */
export const createFavorite = async (req, res, next) => {
  try {
    const { storyId } = req.body;
    const userId = req.user.id;

    const favorite = await FavoriteService.createFavorite(userId, storyId);
    res.json({ code: 0, data: favorite });
  } catch (error) {
    next(error);
  }
};

/**
 * 取消收藏
 */
export const deleteFavorite = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    await FavoriteService.deleteFavorite(storyId, userId);
    res.json({ code: 0, message: '取消收藏成功' });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取故事收藏列表
 */
export const getFavoritesByStoryId = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await FavoriteService.getFavoritesByStoryId(storyId, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 统计收藏数量
 */
export const getFavoriteCount = async (req, res, next) => {
  try {
    const { storyId } = req.params;

    const result = await FavoriteService.getFavoriteCount(storyId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 检查用户是否已收藏
 */
export const checkIsFavorited = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id; // 可选认证

    const result = await FavoriteService.checkIsFavorited(storyId, userId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户的收藏列表（我的收藏）
 */
export const getUserFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await FavoriteService.getUserFavorites(userId, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 批量检查多个故事的收藏状态
 */
export const checkMultipleFavorited = async (req, res, next) => {
  try {
    const { storyIds } = req.body;
    const userId = req.user?.id; // 可选认证

    if (!Array.isArray(storyIds)) {
      return res.status(400).json({ code: 400, message: 'storyIds 必须是数组' });
    }

    const result = await FavoriteService.checkMultipleFavorited(storyIds, userId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};
