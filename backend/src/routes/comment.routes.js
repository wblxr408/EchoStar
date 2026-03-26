import { Router } from 'express';
import * as commentController from '../modules/comment/comment.controller.js';
import { authenticateJWT } from '../modules/auth/auth.middleware.js';
import { validateCreateComment } from '../modules/comment/comment.validator.js';
import { generalLimiter } from '../common/middleware/rate-limit.js';

const router = Router();

/**
 * POST /api/comments - 创建评论
 */
router.post(
  '/',
  authenticateJWT,
  validateCreateComment,
  generalLimiter,
  commentController.createComment
);

/**
 * GET /api/comments/search - 搜索评论（固定路径需在动态路径之前）
 */
router.get('/search', commentController.searchComments);

/**
 * GET /api/comments/me - 获取当前用户的评论列表（固定路径需在动态路径之前）
 */
router.get('/me', authenticateJWT, commentController.getUserComments);

/**
 * GET /api/comments/story/:storyId - 获取故事评论列表
 */
router.get('/story/:storyId', commentController.getCommentsByStoryId);

/**
 * GET /api/comments/:storyId/count - 统计评论数量
 */
router.get('/:storyId/count', commentController.getCommentCount);

/**
 * DELETE /api/comments/:id - 删除评论
 */
router.delete('/:id', authenticateJWT, commentController.deleteComment);

export default router;
