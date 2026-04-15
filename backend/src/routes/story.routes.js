import { Router } from 'express';
import * as storyController from '../modules/story/story.controller.js';
import { authenticateJWT, optionalAuth, requireAdmin } from '../modules/auth/auth.middleware.js';
import { validateCreateStory, validateModifyStory } from '../modules/story/story.validator.js';
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
 * GET /api/stories/me/list - 我的故事列表
 */
router.get('/me/list', authenticateJWT, storyController.getMyStories);

/**
 * GET /api/stories/upload/token - 获取 OSS 上传凭证
 */
router.get('/upload-token', authenticateJWT, storyController.getUploadToken);

/**
 * GET /api/stories/search - 搜索故事
 */
router.get('/search', optionalAuth, storyController.searchStories);

/**
 * GET /api/stories/featured - 获取精选推荐故事
 */
router.get('/featured', optionalAuth, storyController.getFeaturedStories);

/**
 * GET /api/stories/:id - 查看故事详情
 */
router.get('/:id', optionalAuth, storyController.getStoryById);

/**
 * DELETE /api/stories/:id - 删除故事
 */
router.delete('/:id', authenticateJWT, storyController.deleteStory);

/**
 * POST /api/stories/:id - 修改故事内容（content 和 emotionTag）
 */
router.post(
  '/:id',
  authenticateJWT,
  validateModifyStory,
  storyController.modifyStory
);

/**
 * PUT /api/stories/:id/visibility - 修改故事可见性
 */
router.put('/:id/visibility', authenticateJWT, storyController.updateVisibility);

/**
 * POST /api/stories/:id/unlock - 解锁时光胶囊（定时任务调用）
 */
router.post('/:id/unlock', storyController.unlockTimeCapsule);


/**
 * GET /api/stories/admin/all - 管理员获取所有帖子
 */
router.get('/admin/all', authenticateJWT, requireAdmin, storyController.getAllStoriesForAdmin);

export default router;
