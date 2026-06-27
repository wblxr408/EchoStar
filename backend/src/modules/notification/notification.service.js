import { redisClient } from '../../common/utils/redis.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { v4 as uuidv4 } from 'uuid';

// 用户通知列表最大容量
const MAX_NOTIFICATIONS = 100;
// 已读通知过期时间（7天）
const READ_TTL = 7 * 24 * 60 * 60;

/**
 * Notification Service - 通知业务逻辑（Redis）
 */
class NotificationServiceClass {
  /**
   * 获取触发用户名（容错处理，数据库挂掉不崩溃）
   */
  async getFromUserName(fromUserId) {
    try {
      const user = await User.findByPk(fromUserId, {
        attributes: ['username']
      });
      return user?.username || '匿名用户';
    } catch (error) {
      console.error('❌ 获取用户名失败:', error);
      return '匿名用户';
    }
  }

  /**
   * 获取触发用户完整信息（包含头像）
   */
  async getFromUserInfo(fromUserId) {
    try {
      const user = await User.findByPk(fromUserId, {
        attributes: ['id', 'username', 'avatarUrl', 'vip']
      });
      if (!user) {
        return {
          id: fromUserId,
          username: '匿名用户',
          avatar: null,
          vip: 0
        };
      }
      return {
        id: user.id,
        username: user.username || '匿名用户',
        avatar: user.avatarUrl || null,
        vip: user.vip || 0
      };
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error);
      return {
        id: fromUserId,
        username: '匿名用户',
        avatar: null,
        vip: 0
      };
    }
  }

  /**
   * 创建通知
   */
  async createNotification(type, toUserId, fromUserId, storyId, content = '') {
    const redis = redisClient.getClient();

    // 点赞去重：24小时内同一用户对同一故事只发送一次点赞通知
    if (type === 'like') {
      const dedupeKey = `notice:like:${storyId}:${fromUserId}`;
      const exists = await redis.get(dedupeKey);
      if (exists) {
        console.log(`🔄 点赞通知去重: 用户${fromUserId}已点赞故事${storyId}`);
        return { success: false, reason: 'deduplicated' };
      }
      // 设置去重标记，24小时过期
      await redis.setex(dedupeKey, 24 * 60 * 60, '1');
    }

    // 生成通知ID
    const noticeId = uuidv4();
    const timestamp = Date.now();

    // 获取用户名（容错处理）
    const fromUserName = await this.getFromUserName(fromUserId);

    // 生成通知内容
    let noticeContent;
    if (type === 'like') {
      noticeContent = `${fromUserName} 赞了你的故事`;
    } else if (type === 'comment') {
      noticeContent = `${fromUserName} 评论了你的故事: ${content}`;
    } else {
      noticeContent = `${fromUserName} 与你发生了互动`;
    }

    // 存储通知详情（未读，isRead: 0，无过期时间）
    await redis.hmset(`notice:data:${noticeId}`, {
      type,
      fromUserId: String(fromUserId),
      storyId: String(storyId),
      fromUserName,
      content: noticeContent,
      createdAt: String(timestamp),
      isRead: '0'
    });

    // 添加到用户通知列表（倒序排列，最新的在前）
    await redis.zadd(`notice:list:${toUserId}`, timestamp, noticeId);

    // 添加到未读列表
    await redis.sadd(`notice:unread:${toUserId}`, noticeId);

    // 检查列表长度，超过上限则删除最旧的通知
    const count = await redis.zcard(`notice:list:${toUserId}`);
    if (count > MAX_NOTIFICATIONS) {
      const removeCount = count - MAX_NOTIFICATIONS;

      // 获取最旧的通知ID（需要删除的）
      const oldestIds = await redis.zrange(`notice:list:${toUserId}`, 0, removeCount - 1);

      if (oldestIds.length > 0) {
        const pipeline = redis.pipeline();

        pipeline.zrem(`notice:list:${toUserId}`, ...oldestIds);

        oldestIds.forEach(oldId => {
        pipeline.del(`notice:data:${oldId}`);
        pipeline.srem(`notice:unread:${toUserId}`, oldId);
        
        });

        await pipeline.exec();
        console.log(`🗑️ 清理旧通知: userId=${toUserId}, count=${oldestIds.length}`);
      }
    }

    console.log(`✅ 创建通知成功: type=${type}, toUserId=${toUserId}, noticeId=${noticeId}`);
    return { success: true, noticeId };
  }

  /**
   * 获取用户通知列表（分页）
   */
  async getNotifications(userId, { page = 1, limit = 10 } = {}) {
    const redis = redisClient.getClient();
    const offset = (page - 1) * limit;
    const start = offset;
    const end = offset + limit - 1;

    // 合并为单次 pipeline：unread + 通知列表 + 总数（原来 4 次串行往返）
    const initPipeline = redis.pipeline();
    initPipeline.smembers(`notice:unread:${userId}`);
    initPipeline.zrevrange(`notice:list:${userId}`, start, end);
    initPipeline.zcard(`notice:list:${userId}`);
    const [[, unreadIds], [, noticeIds], [, total]] = await initPipeline.exec();

    // 转成 Set，O(1) 判断
    const unreadSet = new Set(unreadIds);

    if (noticeIds.length === 0) {
      return {
        notifications: [],
        pagination: {
          total: total || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      };
    }

    // 批量获取通知详情（1 次 pipeline 往返）
    const noticePipeline = redis.pipeline();
    noticeIds.forEach(noticeId => noticePipeline.hgetall(`notice:data:${noticeId}`));
    const noticeResults = await noticePipeline.exec();

    // 提取所有去重的 fromUserId，批量查询用户信息（N+1 → 1）
    const fromUserIds = [...new Set(
      noticeResults
        .map(([, data]) => data?.fromUserId)
        .filter(Boolean)
        .map(Number)
    )];

    let userMap = new Map();
    if (fromUserIds.length > 0) {
      try {
        const users = await User.findAll({
          where: { id: fromUserIds },
          attributes: ['id', 'username', 'avatarUrl', 'vip']
        });
        userMap = new Map(users.map(u => [u.id, {
          id: u.id,
          username: u.username || '匿名用户',
          avatar: u.avatarUrl || null,
          vip: u.vip || 0
        }]));
      } catch (err) {
        console.error('[notification-service] 批量查询用户失败:', err);
      }
    }

    // 构建通知列表
    const notifications = noticeResults
      .map(([, data], idx) => {
        if (!data || Object.keys(data).length === 0) return null;
        const fromUserId = parseInt(data.fromUserId);
        return {
          id: noticeIds[idx],
          type: data.type,
          fromUserId,
          storyId: parseInt(data.storyId),
          fromUser: userMap.get(fromUserId) || { id: fromUserId, username: '匿名用户', avatar: null, vip: 0 },
          fromUserName: data.fromUserName,
          content: data.content,
          createdAt: parseInt(data.createdAt),
          isRead: !unreadSet.has(noticeIds[idx])
        };
      })
      .filter(n => n !== null);

    return {
      notifications,
      pagination: {
        total: total || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((total || 0) / limit)
      }
    };
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(userId, noticeId) {
    const redis = redisClient.getClient();

    // 权限校验：检查通知归属（必须前置，无法放入管道）
    const score = await redis.zscore(`notice:list:${userId}`, noticeId);
    if (score === null) {
      throw new Error('通知不存在或无权访问');
    }
    
    const pipeline = redis.pipeline();
    pipeline.srem(`notice:unread:${userId}`, noticeId);
    pipeline.hset(`notice:data:${noticeId}`, 'isRead', '1');
    pipeline.expire(`notice:data:${noticeId}`, READ_TTL);

    await pipeline.exec();

    return { success: true, message: '标记已读成功' };
}

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId) {
    const redis = redisClient.getClient();
    const unreadIds = await redis.smembers(`notice:unread:${userId}`);

    if (unreadIds.length === 0) {
      return { success: true, message: '没有需要标记的通知' };
    }

    const pipeline = redis.pipeline();

    pipeline.srem(`notice:unread:${userId}`, ...unreadIds);

    unreadIds.forEach(noticeId => {
      pipeline.hset(`notice:data:${noticeId}`, 'isRead', '1');
      pipeline.expire(`notice:data:${noticeId}`, READ_TTL);
    });

    await pipeline.exec();

    console.log(`✅ 批量标记已读: userId=${userId}, count=${unreadIds.length}`);
    return { success: true, message: `已标记 ${unreadIds.length} 条通知为已读` };
  }
  /**
   * 获取未读通知数量（使用 SCARD，性能优化）
   */
  async getUnreadCount(userId) {
    const redis = redisClient.getClient();

    // 直接获取未读列表的大小
    const unreadCount = await redis.scard(`notice:unread:${userId}`);

    return { userId, unreadCount };
  }

  /**
   * 清空所有通知
   */
  async clearAllNotifications(userId) {
    const redis = redisClient.getClient();

    // 获取所有通知ID
    const noticeIds = await redis.zrange(`notice:list:${userId}`, 0, -1);

    if (noticeIds.length === 0) {
      return { success: true, message: '没有需要清空的通知' };
    }

    // 使用 pipeline 批量删除
    const pipeline = redis.pipeline();

    // 批量删除通知详情
    noticeIds.forEach(noticeId => {
      pipeline.del(`notice:data:${noticeId}`);
    });

    // 删除通知列表、未读列表
    pipeline.del(`notice:list:${userId}`);
    pipeline.del(`notice:unread:${userId}`);

    await pipeline.exec();

    console.log(`✅ 清空所有通知: userId=${userId}, count=${noticeIds.length}`);
    return { success: true, message: `已清空 ${noticeIds.length} 条通知` };
  }
}

// 创建单例实例
export const notificationServiceInstance = new NotificationServiceClass();

// 导出别名
export { notificationServiceInstance as NotificationService };
