import { CommentService } from './comment.service.js';

/**
 * 创建评论
 */
export const createComment = async (req, res, next) => {
  try {
    const { storyId, content } = req.body;
    const userId = req.user.id;

    const comment = await CommentService.createComment(userId, {
      storyId,
      content
    });

    res.json({ code: 0, data: comment });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取故事评论列表
 */
export const getCommentsByStoryId = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await CommentService.getCommentsByStoryId(storyId, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除评论
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await CommentService.deleteComment(id, userId);
    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    next(error);
  }
};

/**
 * 统计评论数量
 */
export const getCommentCount = async (req, res, next) => {
  try {
    const { storyId } = req.params;

    const result = await CommentService.getCommentCount(storyId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 搜索评论
 */
export const searchComments = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    const { page = 1, limit = 10 } = req.query;

    if (!keyword) {
      return res.status(400).json({ code: 400, message: '请提供搜索关键词' });
    }

    const result = await CommentService.searchComments(keyword, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户的评论列表
 */
export const getUserComments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await CommentService.getUserComments(userId, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};
