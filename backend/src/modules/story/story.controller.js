import { StoryService } from './story.service.js';

/**
 * 发布故事
 */
export const createStory = async (req, res, next) => {
  try {
    const { content, images, location, locationName, emotionTag, isTimeCapsule, unlockAt, visibility, visibilityStartTime, visibilityEndTime } = req.body;
    const userId = req.user.id;

    const story = await StoryService.createStory(userId, {
      content,
      images,
      location,
      locationName,
      emotionTag,
      isTimeCapsule,
      unlockAt,
      visibility,
      visibilityStartTime,
      visibilityEndTime
    });

    res.json({ code: 0, data: story });
  } catch (error) {
    next(error);
  }
};

/**
 * 查看故事详情
 */
export const getStoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // 可选认证

    const story = await StoryService.getStoryById(id, userId);
    res.json({ code: 0, data: story });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除故事
 */
export const deleteStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await StoryService.deleteStory(id, userId);
    res.json({ code: 0, message: '删除成功' });
  } catch (error) {
    next(error);
  }
};

/**
 * 我的故事列表
 */
export const getMyStories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await StoryService.getMyStories(userId, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取 OSS 上传凭证
 */
export const getUploadToken = async (req, res, next) => {
  try {
    const token = await StoryService.getUploadToken();
    res.json({ code: 0, data: token });
  } catch (error) {
    next(error);
  }
};

/**
 * 解锁时光胶囊（定时任务调用）
 */
export const unlockTimeCapsule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await StoryService.unlockTimeCapsule(id);
    res.json({ code: 0, message: result.message });
  } catch (error) {
    next(error);
  }
};

/**
 * 修改故事内容（只允许修改 content 和 emotionTag）
 */
export const modifyStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content, emotionTag } = req.body;

    const result = await StoryService.modifyStory(id, userId, content, emotionTag);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 修改故事可见性
 */
export const updateVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { visibility } = req.body;

    const result = await StoryService.updateVisibility(id, userId, visibility);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 搜索故事（模糊匹配 content）
 */
export const searchStories = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    const { page = 1, limit = 10 } = req.query;

    if (!keyword) {
      return res.status(400).json({ code: 400, message: '请提供搜索关键词' });
    }

    const result = await StoryService.searchStories(keyword, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取精选推荐故事
 */
export const getFeaturedStories = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await StoryService.getFeaturedStories({ page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 管理员获取所有帖子
 */
export const getAllStoriesForAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, visibility, isRecommended } = req.query;

    const result = await StoryService.getAllStoriesForAdmin({ page, limit, visibility, isRecommended });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};
