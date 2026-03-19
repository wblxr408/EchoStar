
import { Story, TimeCapsule } from './story.model.js';

/**
 * 安全查询：根据ID查故事（含时光胶囊关联）
 * 与story.service.js中getStoryById查询逻辑1:1复刻，参数化查询防SQL注入
 * @param {Number|String} storyId 故事ID
 * @returns {Promise<Object>} 故事详情（含timeCapsule关联数据）
 */
export async function getStoryByIdSafe(storyId) {
  return await Story.findByPk(storyId, {
    include: [{
      model: TimeCapsule,
      as: 'timeCapsule'
    }]
  });
}

/**
 * 安全查询：根据用户ID查我的故事列表（分页+时光胶囊关联）
 * 与story.service.js中getMyStories查询逻辑1:1复刻，参数化查询防SQL注入
 * @param {Number|String} userId 用户ID
 * @param {Number} page 页码，默认1
 * @param {Number} limit 每页条数，默认10
 * @returns {Promise<Object>} {rows: 故事列表, count: 总条数}
 */
export async function getStoriesByUserIdSafe(userId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  return await Story.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [{
      model: TimeCapsule,
      as: 'timeCapsule'
    }]
  });
}