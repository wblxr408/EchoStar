import { StoryService } from './story.service.js';

/**
 * 发布故事
 */
export const createStory = async (req, res, next) => {
  try {
    const { content, images, location, emotionTag, isTimeCapsule, unlockAt } = req.body;
    const userId = req.user.id;

    const story = await StoryService.createStory(userId, {
      content,
      images,
      location,
      emotionTag,
      isTimeCapsule,
      unlockAt
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
