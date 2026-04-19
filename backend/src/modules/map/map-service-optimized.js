/**
 * 高性能地图服务 - 优化版本
 * 针对 2核4G 服务器优化，大幅提升响应速度和并发能力
 */

import { Story } from '../story/story.model.js';
import { User } from '../auth/auth.model.js';
import { sequelize } from '../../config/database.js';
import { Op } from 'sequelize';
import { clusterPoints } from './cluster.util.js';
import { safeParseJSONB } from '../../common/utils/jsonb.util.js';
import { redisClient } from '../../common/utils/redis.js';

// ===================== 常量配置 =====================
const CONSTANTS = {
  DEFAULT_RADIUS: 1000, // 增加默认半径，减少查询次数
  MAX_EXPLORE_LIMIT: 30, // 减少单次查询数量，降低内存占用
  MAX_WALL_LIMIT: 20,
  MAX_CLUSTER_LIMIT: 200, // 减少聚合查询数据量
  PUBLIC_VISIBILITY: 'public',
  CACHE_TTL: 300, // 5分钟缓存
  BATCH_SIZE: 50 // 批量处理大小
};

/**
 * 高性能位置解析工具
 */
class LocationParser {
  static parsePoint(locationVal) {
    if (!locationVal) return { lat: 0, lng: 0 };
    
    // 兼容 GeoJSON 对象格式
    if (locationVal.type === 'Point' && Array.isArray(locationVal.coordinates)) {
      return { lng: locationVal.coordinates[0], lat: locationVal.coordinates[1] };
    }

    // 兼容 WKT 字符串格式 "POINT (0 0)"
    const locStr = String(locationVal);
    const match = locStr.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (match) {
      return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    }

    return { lat: 0, lng: 0 };
  }

  static normalizeStoryId(storyId) {
    if (storyId === undefined || storyId === null) return null;
    return typeof storyId === 'bigint' ? storyId.toString() : String(storyId).trim();
  }
}

/**
 * 高性能缓存管理器
 */
class CacheManager {
  constructor() {
    this.prefix = 'map:cache';
  }

  generateCacheKey(operation, params) {
    const keyParams = Object.keys(params)
      .sort()
      .map(k => `${k}:${params[k]}`)
      .join(':');
    return `${this.prefix}:${operation}:${Buffer.from(keyParams).toString('base64')}`;
  }

  async get(cacheKey) {
    try {
      const redis = redisClient.getClient();
      const cached = await redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      return null; // 缓存失败时直接返回null，不影响业务
    }
  }

  async set(cacheKey, data, ttl = CONSTANTS.CACHE_TTL) {
    try {
      const redis = redisClient.getClient();
      await redis.setex(cacheKey, ttl, JSON.stringify(data));
    } catch (err) {
      // 缓存设置失败不影响业务
    }
  }

  async invalidateByPattern(pattern) {
    try {
      const redis = redisClient.getClient();
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      // 缓存清理失败不影响业务
    }
  }
}

/**
 * 高性能故事格式化器
 */
class StoryFormatter {
  static formatStory(story) {
    if (!story) return null;

    // 手动解析 location
    const { lat, lng } = LocationParser.parsePoint(story.location);

    return {
      id: LocationParser.normalizeStoryId(story.id),
      content: story.content?.length > 100 ? 
        story.content.substring(0, 100) + '...' : story.content,
      images: safeParseJSONB(story.images, []),
      username: story.author?.username || story.username || '',
      avatar: story.author?.avatarUrl || story.avatar || null,
      author: story.author ? {
        id: story.author.id,
        username: story.author.username || '匿名用户',
        avatar: story.author.avatarUrl || null
      } : null,
      location: {
        latitude: lat,
        longitude: lng
      },
      locationName: story.locationName,
      emotionTag: story.emotionTag,
      isTimeCapsule: !!story.isTimeCapsule,
      unlockAt: story.unlockAt || null,
      isUnlocked: !story.isTimeCapsule || (story.unlockAt && new Date(story.unlockAt) <= new Date()),
      isRecommended: story.isRecommended,
      fontFamily: story.fontFamily || null,
      fontEffect: story.fontEffect || null,
      createdAt: story.createdAt
    };
  }

  static formatStories(stories) {
    return stories.map(s => this.formatStory(s)).filter(Boolean);
  }
}

/**
 * 高性能查询构建器
 */
class QueryBuilder {
  static getDWithinCondition(latitude, longitude, radius) {
    return sequelize.literal(`
      ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
        :radius
      )
    `);
  }

  static getBoundsCondition(bounds) {
    const { northEast, southWest } = bounds;
    return sequelize.literal(`
      location && ST_MakeEnvelope(:swLng, :swLat, :neLng, :neLat, 4326)
    `);
  }

  static getBaseQuery(includeUser = true) {
    const attributes = [
      'id',
      'content',
      'images',
      'location',
      'locationName',
      'emotionTag',
      'isTimeCapsule',
      'unlockAt',
      'isRecommended',
      'fontFamily',
      'fontEffect',
      'createdAt'
    ];

    const include = includeUser ? [{
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'avatarUrl']
    }] : [];

    const where = {
      visibility: CONSTANTS.PUBLIC_VISIBILITY,
      location: { [Op.not]: null }
    };

    return { attributes, include, where };
  }
}

/**
 * 高性能地图服务主类
 */
class HighPerformanceMapService {
  constructor() {
    this.cacheManager = new CacheManager();
    this.isSilentLogs = process.env.NODE_ENV === 'production' || 
                        process.env.NODE_ENV === 'test';
  }

  /**
   * 高性能地图探索
   */
  async exploreStories(latitude, longitude, radius = CONSTANTS.DEFAULT_RADIUS) {
    const cacheKey = this.cacheManager.generateCacheKey('explore', {
      lat: Math.round(latitude * 1000) / 1000, // 降低精度减少缓存键数量
      lng: Math.round(longitude * 1000) / 1000,
      radius: Math.round(radius / 100) * 100 // 按100米分组
    });

    // 尝试从缓存获取
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const stories = await Story.findAll({
        where: {
          ...QueryBuilder.getBaseQuery().where,
          [Op.and]: [
            QueryBuilder.getDWithinCondition(latitude, longitude, radius),
            sequelize.literal(`NOT (is_time_capsule = true AND unlock_at IS NOT NULL AND unlock_at > NOW())`)
          ]
        },
        replacements: { lat: latitude, lng: longitude, radius },
        attributes: QueryBuilder.getBaseQuery().attributes,
        include: QueryBuilder.getBaseQuery().include,
        order: [['createdAt', 'DESC']],
        limit: CONSTANTS.MAX_EXPLORE_LIMIT
      });

      const formattedStories = StoryFormatter.formatStories(stories);
      
      // 异步缓存，不阻塞响应
      this.cacheManager.set(cacheKey, formattedStories).catch(() => {});
      
      return formattedStories;
    } catch (error) {
      if (!this.isSilentLogs) {
        console.error('地图探索查询失败:', error);
      }
      return [];
    }
  }

  /**
   * 高性能随机漫步
   */
  async randomWalk() {
    const cacheKey = this.cacheManager.generateCacheKey('random_walk', {});
    
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const story = await Story.findOne({
        where: {
          ...QueryBuilder.getBaseQuery().where,
          [Op.and]: [
            sequelize.literal(`NOT (is_time_capsule = true AND unlock_at IS NOT NULL AND unlock_at > NOW())`)
          ]
        },
        order: [
          [sequelize.literal('is_recommended DESC NULLS LAST')],
          [sequelize.random()]
        ],
        attributes: QueryBuilder.getBaseQuery().attributes,
        include: QueryBuilder.getBaseQuery().include
      });

      if (!story) return null;

      const { lat, lng } = LocationParser.parsePoint(story.location);
      const result = {
        location: { latitude: lat, longitude: lng },
        story: StoryFormatter.formatStory(story)
      };

      // 短期缓存，避免重复查询
      this.cacheManager.set(cacheKey, result, 60).catch(() => {});
      
      return result;
    } catch (error) {
      if (!this.isSilentLogs) {
        console.error('随机漫步查询失败:', error);
      }
      return null;
    }
  }

  /**
   * 高性能位置墙
   */
  async getLocationWall(latitude, longitude, radius = CONSTANTS.DEFAULT_RADIUS) {
    const cacheKey = this.cacheManager.generateCacheKey('location_wall', {
      lat: Math.round(latitude * 1000) / 1000,
      lng: Math.round(longitude * 1000) / 1000,
      radius: Math.round(radius / 100) * 100
    });

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const stories = await Story.findAll({
        where: {
          ...QueryBuilder.getBaseQuery().where,
          [Op.and]: [
            QueryBuilder.getDWithinCondition(latitude, longitude, radius),
            sequelize.literal(`NOT (is_time_capsule = true AND unlock_at IS NOT NULL AND unlock_at > NOW())`)
          ]
        },
        replacements: { lat: latitude, lng: longitude, radius },
        attributes: QueryBuilder.getBaseQuery().attributes,
        include: QueryBuilder.getBaseQuery().include,
        order: [['createdAt', 'DESC']],
        limit: CONSTANTS.MAX_WALL_LIMIT
      });

      const formattedStories = StoryFormatter.formatStories(stories);
      
      this.cacheManager.set(cacheKey, formattedStories).catch(() => {});
      
      return formattedStories;
    } catch (error) {
      if (!this.isSilentLogs) {
        console.error('位置墙查询失败:', error);
      }
      return [];
    }
  }

  /**
   * 动态聚合网格大小计算
   */
  getDynamicGridSize(zoom) {
    const z = zoom ?? 10;
    if (z <= 5) return 15000;
    if (z <= 7) return 8000;
    if (z <= 9) return 3000;
    if (z <= 11) return 1500;
    if (z <= 13) return 800;
    if (z <= 14) return 300;
    return 150;
  }

  /**
   * 高性能聚合数据查询
   */
  async getClusterData(bounds, zoom) {
    const cacheKey = this.cacheManager.generateCacheKey('cluster_data', {
      swLat: Math.round(bounds.southWest.lat * 1000) / 1000,
      swLng: Math.round(bounds.southWest.lng * 1000) / 1000,
      neLat: Math.round(bounds.northEast.lat * 1000) / 1000,
      neLng: Math.round(bounds.northEast.lng * 1000) / 1000,
      zoom
    });

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { northEast, southWest } = bounds;
      const stories = await Story.findAll({
        where: {
          ...QueryBuilder.getBaseQuery(false).where,
          [Op.and]: [
            QueryBuilder.getBoundsCondition(bounds)
          ]
        },
        replacements: {
          swLng: southWest.lng,
          swLat: southWest.lat,
          neLng: northEast.lng,
          neLat: northEast.lat
        },
        attributes: ['id', 'location', 'emotionTag', 'fontFamily', 'fontEffect'],
        limit: CONSTANTS.MAX_CLUSTER_LIMIT
      });

      // 解析位置并聚类
      const points = stories.map(s => {
        const { lat, lng } = LocationParser.parsePoint(s.location);
        return {
          id: LocationParser.normalizeStoryId(s.id),
          latitude: lat,
          longitude: lng,
          emotionTag: s.emotionTag,
          fontFamily: s.fontFamily || null,
          fontEffect: s.fontEffect || null
        };
      });

      const gridSize = this.getDynamicGridSize(zoom);
      const clusters = clusterPoints(points, gridSize);

      // 短期缓存聚合数据
      this.cacheManager.set(cacheKey, clusters, 120).catch(() => {});
      
      return clusters;
    } catch (error) {
      if (!this.isSilentLogs) {
        console.error('聚合数据查询失败:', error);
      }
      return [];
    }
  }

  /**
   * 批量缓存预热（用于热门区域）
   */
  async preloadHotSpots(hotSpots) {
    const promises = hotSpots.map(spot => 
      this.exploreStories(spot.latitude, spot.longitude, spot.radius)
        .catch(() => {}) // 忽略单个预热失败
    );
    
    await Promise.all(promises);
  }

  /**
   * 清理缓存
   */
  async clearCache() {
    await this.cacheManager.invalidateByPattern('map:cache:*');
  }
}

// 创建单例实例
export const highPerformanceMapService = new HighPerformanceMapService();
export default highPerformanceMapService;