import { Favorite } from './favorite.model.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { Op } from 'sequelize';
import { likeCacheUtil } from '../../common/utils/like-cache.util.js';

function parseStoryLocationValue(locationValue) {
  if (!locationValue) {
    return null;
  }

  if (locationValue.type === 'Point' && Array.isArray(locationValue.coordinates)) {
    return {
      lng: locationValue.coordinates[0],
      lat: locationValue.coordinates[1]
    };
  }

  const locationStr = typeof locationValue === 'string'
    ? locationValue
    : locationValue.toString();
  const match = locationStr.match(/POINT\(([^ ]+) ([^ ]+)\)/i);

  if (!match) {
    return null;
  }

  return {
    lng: parseFloat(match[1]),
    lat: parseFloat(match[2])
  };
}

function normalizeStoryId(storyId) {
  if (storyId === undefined || storyId === null) {
    throw new Error('Story ID is required');
  }

  return typeof storyId === 'bigint'
    ? storyId.toString()
    : String(storyId).trim();
}

class FavoriteServiceClass {
  async toggleFavorite(userId, storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const story = await Story.findByPk(normalizedStoryId);

    if (!story) {
      throw new Error('Story not found');
    }

    const existing = await Favorite.findOne({
      where: {
        userId,
        storyId: normalizedStoryId
      }
    });

    if (existing) {
      await existing.destroy();

      const { favoriteCount } = await this.getFavoriteCount(normalizedStoryId);
      return {
        isFavorited: false,
        favoriteCount,
        message: 'Favorite removed'
      };
    }

    await Favorite.create({
      userId,
      storyId: normalizedStoryId
    });

    const { favoriteCount } = await this.getFavoriteCount(normalizedStoryId);
    return {
      isFavorited: true,
      favoriteCount,
      message: 'Favorite created'
    };
  }

  async createFavorite(userId, storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const story = await Story.findByPk(normalizedStoryId);

    if (!story) {
      throw new Error('Story not found');
    }

    const existing = await Favorite.findOne({
      where: {
        userId,
        storyId: normalizedStoryId
      }
    });

    if (existing) {
      throw new Error('Story already favorited');
    }

    const favorite = await Favorite.create({
      userId,
      storyId: normalizedStoryId
    });

    return {
      id: favorite.id,
      storyId: normalizedStoryId,
      createdAt: favorite.createdAt
    };
  }

  async deleteFavorite(storyId, userId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const favorite = await Favorite.findOne({
      where: {
        userId,
        storyId: normalizedStoryId
      }
    });

    if (!favorite) {
      throw new Error('Favorite record not found');
    }

    await favorite.destroy();
    return {
      success: true,
      message: 'Favorite removed'
    };
  }

  async getFavoritesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const normalizedPage = parseInt(page, 10) || 1;
    const normalizedLimit = parseInt(limit, 10) || 10;
    const offset = (normalizedPage - 1) * normalizedLimit;

    const { rows, count } = await Favorite.findAndCountAll({
      where: {
        storyId: normalizedStoryId
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: normalizedLimit,
      offset
    });

    return {
      favorites: rows.map((favorite) => ({
        id: favorite.id,
        createdAt: favorite.createdAt,
        user: {
          id: favorite.userId,
          username: favorite.user?.username || 'Unknown user',
          avatar: favorite.user?.avatarUrl || null
        }
      })),
      pagination: {
        total: count,
        page: normalizedPage,
        limit: normalizedLimit,
        totalPages: Math.ceil(count / normalizedLimit)
      }
    };
  }

  async getFavoriteCount(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const count = await Favorite.count({
      where: {
        storyId: normalizedStoryId
      }
    });

    return {
      storyId: normalizedStoryId,
      favoriteCount: count
    };
  }

  async checkIsFavorited(storyId, userId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (!userId) {
      return {
        storyId: normalizedStoryId,
        isFavorited: false
      };
    }

    const favorite = await Favorite.findOne({
      where: {
        userId,
        storyId: normalizedStoryId
      }
    });

    return {
      storyId: normalizedStoryId,
      isFavorited: Boolean(favorite)
    };
  }

  async getUserFavorites(userId, { page = 1, limit = 10 } = {}) {
    const normalizedPage = parseInt(page, 10) || 1;
    const normalizedLimit = parseInt(limit, 10) || 10;
    const offset = (normalizedPage - 1) * normalizedLimit;

    const { rows, count } = await Favorite.findAndCountAll({
      where: { userId },
      include: [{
        model: Story,
        as: 'story',
        attributes: ['id', 'content', 'images', 'emotionTag', 'createdAt', 'location', 'locationName'],
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatarUrl']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: normalizedLimit,
      offset
    });

    const storyIds = rows
      .map((favorite) => normalizeStoryId(favorite.storyId))
      .filter(Boolean);

    const [likeCountResults, favoriteCountResults] = await Promise.all([
      Promise.all(storyIds.map((storyId) => likeCacheUtil.getLikeCount(storyId))),
      Promise.all(storyIds.map((storyId) => this.getFavoriteCount(storyId)))
    ]);

    const likeCounts = {};
    const favoriteCounts = {};
    storyIds.forEach((storyId, index) => {
      likeCounts[storyId] = likeCountResults[index];
      favoriteCounts[storyId] = favoriteCountResults[index]?.favoriteCount || 0;
    });

    return {
      favorites: rows.map((favorite) => {
        const normalizedStoryId = normalizeStoryId(favorite.storyId);

        return {
          id: favorite.id,
          createdAt: favorite.createdAt,
          story: {
            id: normalizedStoryId,
            content: favorite.story?.content,
            images: favorite.story?.images || [],
            emotionTag: favorite.story?.emotionTag,
            createdAt: favorite.story?.createdAt,
            location: parseStoryLocationValue(favorite.story?.location),
            locationName: favorite.story?.locationName,
            likeCount: likeCounts[normalizedStoryId] || 0,
            favoriteCount: favoriteCounts[normalizedStoryId] || 0,
            author: favorite.story?.author
              ? {
                  id: favorite.story.author.id,
                  username: favorite.story.author.username,
                  avatar: favorite.story.author.avatarUrl || null
                }
              : null
          }
        };
      }),
      pagination: {
        total: count,
        page: normalizedPage,
        limit: normalizedLimit,
        totalPages: Math.ceil(count / normalizedLimit)
      }
    };
  }

  async checkMultipleFavorited(storyIds, userId) {
    const normalizedStoryIds = Array.isArray(storyIds)
      ? storyIds.map((storyId) => normalizeStoryId(storyId))
      : [];

    if (!userId) {
      return normalizedStoryIds.map((storyId) => ({
        storyId,
        isFavorited: false
      }));
    }

    const favorites = await Favorite.findAll({
      where: {
        userId,
        storyId: {
          [Op.in]: normalizedStoryIds
        }
      },
      attributes: ['storyId']
    });

    const favoritedIds = new Set(
      favorites.map((favorite) => normalizeStoryId(favorite.storyId))
    );

    return normalizedStoryIds.map((storyId) => ({
      storyId,
      isFavorited: favoritedIds.has(storyId)
    }));
  }
}

export const favoriteServiceInstance = new FavoriteServiceClass();
export { favoriteServiceInstance as FavoriteService };
