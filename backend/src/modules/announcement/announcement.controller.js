import { AnnouncementService } from './announcement.service.js';

/**
 * 获取公告列表（公开，无需登录）
 */
export const getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await AnnouncementService.getAll({ page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建公告（管理员）
 */
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, type } = req.body;

    // 参数校验
    if (!title || !title.trim()) {
      return res.status(400).json({ code: 400, message: '公告标题不能为空' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '公告内容不能为空' });
    }

    const result = await AnnouncementService.create(
      { title: title.trim(), content: content.trim(), type },
      req.user.id
    );
    res.json({ code: 0, message: '发布公告成功', data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新公告（管理员）
 */
export const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await AnnouncementService.update(id, req.body);
    res.json({ code: 0, message: '更新公告成功', data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除公告（管理员）
 */
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    await AnnouncementService.delete(id);
    res.json({ code: 0, message: '删除公告成功' });
  } catch (error) {
    next(error);
  }
};
