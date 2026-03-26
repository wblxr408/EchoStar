import { Router } from 'express';
import * as likeController from '../modules/like/like.controller.js';
import { authenticateJWT, optionalAuth } from '../modules/auth/auth.middleware.js';
import { validateCreateLike, validateCheckMultipleLiked } from '../modules/like/like.validator.js';
import { generalLimiter } from '../common/middleware/rate-limit.js';

const router = Router();

/**
 * POST /api/likes - 点赞/取消点赞（自动切换）
 */
router.post(
  '/',
  authenticateJWT,
  validateCreateLike,
  generalLimiter,
  likeController.toggleLike
);

/**
 * POST /api/likes/create - 创建点赞（明确点赞，不能取消）
 */
router.post(
  '/create',
  authenticateJWT,
  validateCreateLike,
  generalLimiter,
  likeController.createLike
);

/**
 * DELETE /api/likes/:storyId - 取消点赞
 */
router.delete('/:storyId', authenticateJWT, likeController.deleteLike);

/**
 * GET /api/likes/me - 获取当前用户的点赞列表（固定路径需在动态路径之前）
 */
router.get('/me', authenticateJWT, likeController.getUserLikes);

/**
 * GET /api/likes/story/:storyId - 获取故事点赞列表
 */
router.get('/story/:storyId', likeController.getLikesByStoryId);

/**
 * GET /api/likes/:storyId/check - 检查是否已点赞
 */
router.get('/:storyId/check', optionalAuth, likeController.checkIsLiked);

/**
 * GET /api/likes/:storyId/count - 统计点赞数量
 */
router.get('/:storyId/count', likeController.getLikeCount);

/**
 * POST /api/likes/check-multiple - 批量检查多个故事的点赞状态
 */
router.post('/check-multiple', optionalAuth, validateCheckMultipleLiked, likeController.checkMultipleLiked);

export default router;
