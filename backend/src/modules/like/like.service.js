import { Like } from './like.model.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { Op } from 'sequelize';
import { NotificationService } from '../notification/notification.service.js';

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

class LikeServiceClass {
  async toggleLike(userId, storyId) {
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('Story not found');
    }

    const existingLike = await Like.findOne({
      where: { userId, storyId }
    });

    if (existingLike) {
      await existingLike.destroy();
      const likeCount = await Like.count({ where: { storyId } });
      return {
        isLiked: false,
        likeCount,
        message: 'Like removed'
      };
    }

    const like = await Like.create({
      userId,
      storyId
    });

    if (story.userId !== userId) {
      NotificationService.createNotification('like', story.userId, userId, storyId).catch((err) => {
        console.error('Failed to create like notification:', err);
      });
    }

    const likeCount = await Like.count({ where: { storyId } });

    return {
      isLiked: true,
      likeCount,
      message: 'Like created',
      id: like.id
    };
  }

  async createLike(userId, storyId) {
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('Story not found');
    }

    const existingLike = await Like.findOne({
      where: { userId, storyId }
    });

    if (existingLike) {
      throw new Error('Story already liked');
    }

    const like = await Like.create({
      userId,
      storyId
    });

    if (story.userId !== userId) {
      NotificationService.createNotification('like', story.userId, userId, storyId).catch((err) => {
        console.error('Failed to create like notification:', err);
      });
    }

    return {
      id: like.id,
      storyId: like.storyId,
      createdAt: like.createdAt
    };
  }

  async deleteLike(storyId, userId) {
    const like = await Like.findOne({
      where: { userId, storyId }
    });

    if (!like) {
      throw new Error('Like record not found');
    }

    await like.destroy();

    return {
      success: true,
      message: 'Like removed'
    };
  }

  async getLikesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Like.findAndCountAll({
      where: { storyId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return {
      likes: rows.map((like) => ({
        id: like.id,
        createdAt: like.createdAt,
        user: {
          id: like.userId,
          username: like.user?.username || 'Anonymous',
          avatar: like.user?.avatarUrl || null
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getLikeCount(storyId) {
    const count = await Like.count({
      where: { storyId }
    });

    return { storyId, likeCount: count };
  }

  async checkIsLiked(storyId, userId) {
    if (!userId) {
      return { storyId, isLiked: false };
    }

    const like = await Like.findOne({
      where: { userId, storyId }
    });

    return { storyId, isLiked: !!like };
  }

  async getUserLikes(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Like.findAndCountAll({
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
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return {
      likes: rows.map((like) => ({
        id: like.id,
        createdAt: like.createdAt,
        story: {
          id: like.storyId,
          content: like.story?.content,
          images: like.story?.images || [],
          emotionTag: like.story?.emotionTag,
          createdAt: like.story?.createdAt,
          location: parseStoryLocationValue(like.story?.location),
          locationName: like.story?.locationName,
          author: like.story?.author
            ? {
                id: like.story.author.id,
                username: like.story.author.username,
                avatar: like.story.author.avatarUrl || null
              }
            : null
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async checkMultipleLiked(storyIds, userId) {
    if (!userId) {
      return storyIds.map((storyId) => ({
        storyId,
        isLiked: false
      }));
    }

    const likes = await Like.findAll({
      where: {
        userId,
        storyId: { [Op.in]: storyIds }
      },
      attributes: ['storyId']
    });

    const likedStoryIds = likes.map((like) => like.storyId);

    return storyIds.map((storyId) => ({
      storyId,
      isLiked: likedStoryIds.includes(storyId)
    }));
  }
}

export const likeServiceInstance = new LikeServiceClass();
export { likeServiceInstance as LikeService };
