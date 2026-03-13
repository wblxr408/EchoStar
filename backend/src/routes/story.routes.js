import { Router } from 'express';
import * as storyController from '../modules/story/story.controller.js';
import { authenticateJWT, optionalAuth } from '../modules/auth/auth.middleware.js';
import { validateCreateStory } from '../modules/story/story.validator.js';
import { generalLimiter } from '../common/middleware/rate-limit.js';

const router = Router();

/**
 * POST /api/stories - 发布故事
 */
router.post(
  '/',
  authenticateJWT,
  validateCreateStory,
  generalLimiter,
  storyController.createStory
);

/**
 * GET /api/stories/:id - 查看故事详情
 */
router.get('/:id', optionalAuth, storyController.getStoryById);

/**
 * DELETE /api/stories/:id - 删除故事
 */
router.delete('/:id', authenticateJWT, storyController.deleteStory);

/**
 * GET /api/stories/me/list - 我的故事列表
 */
router.get('/me/list', authenticateJWT, storyController.getMyStories);

/**
 * GET /api/stories/upload/token - 获取 OSS 上传凭证
 */
router.get('/upload/token', authenticateJWT, storyController.getUploadToken);

/**
 * POST /api/stories/:id/unlock - 解锁时光胶囊（定时任务调用）
 */
router.post('/:id/unlock', storyController.unlockTimeCapsule);

export default router;
