import { Router } from 'express';
import * as favoriteController from '../modules/favorite/favorite.controller.js';
import { authenticateJWT, optionalAuth } from '../modules/auth/auth.middleware.js';
import { validateCreateFavorite, validateCheckMultipleFavorited } from '../modules/favorite/favorite.validator.js';
import { generalLimiter } from '../common/middleware/rate-limit.js';

const router = Router();

/**
 * POST /api/favorites - 收藏/取消收藏（自动切换）
 */
router.post(
  '/',
  authenticateJWT,
  validateCreateFavorite,
  generalLimiter,
  favoriteController.toggleFavorite
);

/**
 * POST /api/favorites/create - 创建收藏（明确收藏，不能取消）
 */
router.post(
  '/create',
  authenticateJWT,
  validateCreateFavorite,
  generalLimiter,
  favoriteController.createFavorite
);

/**
 * DELETE /api/favorites/:storyId - 取消收藏
 */
router.delete('/:storyId', authenticateJWT, favoriteController.deleteFavorite);

/**
 * GET /api/favorites/me - 获取当前用户的收藏列表（我的收藏）（固定路径需在动态路径之前）
 */
router.get('/me', authenticateJWT, favoriteController.getUserFavorites);

/**
 * GET /api/favorites/story/:storyId - 获取故事收藏列表
 */
router.get('/story/:storyId', favoriteController.getFavoritesByStoryId);

/**
 * GET /api/favorites/:storyId/check - 检查是否已收藏
 */
router.get('/:storyId/check', optionalAuth, favoriteController.checkIsFavorited);

/**
 * GET /api/favorites/:storyId/count - 统计收藏数量
 */
router.get('/:storyId/count', favoriteController.getFavoriteCount);

/**
 * POST /api/favorites/check-multiple - 批量检查多个故事的收藏状态
 */
router.post('/check-multiple', optionalAuth, validateCheckMultipleFavorited, favoriteController.checkMultipleFavorited);

export default router;
