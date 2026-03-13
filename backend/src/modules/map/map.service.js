import { Story } from '../story/story.model.js';
import { sequelize } from '../../config/database.js';
import { Op } from 'sequelize';
import { clusterPoints } from './cluster.util.js';

/**
 * Map Service - 地图探索业务逻辑
 */
export const MapService = {
  /**
   * 范围查询故事（使用 PostGIS ST_DWithin）
   */
  async exploreStories(latitude, longitude, radius) {
    // 使用 PostGIS 查询（需要先配置 PostGIS 扩展）
    // 这里使用简化的方式，实际应使用空间索引
    const stories = await Story.findAll({
      where: {
        visibility: 'public',
        // 使用 Sequelize 的原始查询
        [Op.and]: sequelize.literal(`
          ST_DWithin(
            ST_MakePoint(longitude, latitude)::geography,
            ST_MakePoint(${longitude}, ${latitude})::geography,
            ${radius}
          )
        `)
      },
      attributes: [
        'id',
        'content',
        'images',
        'latitude',
        'longitude',
        'locationName',
        'emotion',
        'isRecommended',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    return stories.map(story => ({
      id: story.id,
      content: story.content.substring(0, 100) + (story.content.length > 100 ? '...' : ''),
      images: JSON.parse(story.images),
      location: {
        latitude: story.latitude,
        longitude: story.longitude,
        name: story.locationName
      },
      emotion: story.emotion,
      isRecommended: story.isRecommended,
      createdAt: story.createdAt
    }));
  },

  /**
   * 随机漫步
   */
  async randomWalk() {
    // 随机获取一个故事
    const story = await Story.findOne({
      where: {
        visibility: 'public',
        isRecommended: true // 优先推荐内容
      },
      order: sequelize.random(),
      attributes: [
        'id',
        'content',
        'images',
        'latitude',
        'longitude',
        'locationName',
        'emotion',
        'createdAt'
      ]
    });

    if (!story) {
      // 如果没有推荐内容，随机返回一个
      const fallbackStory = await Story.findOne({
        where: { visibility: 'public' },
        order: sequelize.random()
      });

      if (!fallbackStory) {
        throw new Error('暂无可探索的故事');
      }

      return this.formatStory(fallbackStory);
    }

    return this.formatStory(story);
  },

  /**
   * 同地点故事墙
   */
  async getLocationWall(latitude, longitude, radius = 50) {
    const stories = await Story.findAll({
      where: {
        visibility: 'public',
        [Op.and]: sequelize.literal(`
          ST_DWithin(
            ST_MakePoint(longitude, latitude)::geography,
            ST_MakePoint(${longitude}, ${latitude})::geography,
            ${radius}
          )
        `)
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    return stories.map(story => this.formatStory(story));
  },

  /**
   * 获取聚合数据（用于地图缩放显示）
   */
  async getClusterData(bounds) {
    const { northEast, southWest } = bounds;

    // 查询边界内的所有故事
    const stories = await Story.findAll({
      where: {
        visibility: 'public',
        latitude: {
          [Op.between]: [southWest.latitude, northEast.latitude]
        },
        longitude: {
          [Op.between]: [southWest.longitude, northEast.longitude]
        }
      },
      attributes: ['id', 'latitude', 'longitude', 'emotion']
    });

    // 使用聚合算法
    const clusters = clusterPoints(
      stories.map(s => ({
        id: s.id,
        latitude: parseFloat(s.latitude),
        longitude: parseFloat(s.longitude),
        emotion: s.emotion
      }))
    );

    return clusters;
  },

  /**
   * 格式化故事数据
   */
  formatStory(story) {
    return {
      id: story.id,
      content: story.content,
      images: JSON.parse(story.images),
      location: {
        latitude: story.latitude,
        longitude: story.longitude,
        name: story.locationName
      },
      emotion: story.emotion,
      isRecommended: story.isRecommended,
      createdAt: story.createdAt
    };
  }
};
