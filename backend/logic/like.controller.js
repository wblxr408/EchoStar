import { LikeService } from './like.service.js';

/**
 * 点赞/取消点赞
 */
export const toggleLike = async (req, res, next) => {
  try {
    const { storyId } = req.body;
    const userId = req.user.id;

    const result = await LikeService.toggleLike(userId, storyId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建点赞
 */
export const createLike = async (req, res, next) => {
  try {
    const { storyId } = req.body;
    const userId = req.user.id;

    const like = await LikeService.createLike(userId, storyId);
    res.json({ code: 0, data: like });
  } catch (error) {
    next(error);
  }
};

/**
 * 取消点赞
 */
export const deleteLike = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    await LikeService.deleteLike(storyId, userId);
    res.json({ code: 0, message: '取消点赞成功' });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取故事点赞列表
 */
export const getLikesByStoryId = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await LikeService.getLikesByStoryId(storyId, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 统计点赞数量
 */
export const getLikeCount = async (req, res, next) => {
  try {
    const { storyId } = req.params;

    const result = await LikeService.getLikeCount(storyId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 检查用户是否已点赞
 */
export const checkIsLiked = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id; // 可选认证

    const result = await LikeService.checkIsLiked(storyId, userId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户的点赞列表
 */
export const getUserLikes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await LikeService.getUserLikes(userId, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 批量检查多个故事的点赞状态
 */
export const checkMultipleLiked = async (req, res, next) => {
  try {
    const { storyIds } = req.body;
    const userId = req.user?.id; // 可选认证

    if (!Array.isArray(storyIds)) {
      return res.status(400).json({ code: 400, message: 'storyIds 必须是数组' });
    }

    const result = await LikeService.checkMultipleLiked(storyIds, userId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};
