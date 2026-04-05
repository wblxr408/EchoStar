import { User } from '../user/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * 测试专用认证服务 - 完全绕过数据库检查
 * 仅用于性能测试，不进行任何数据库验证
 */
export class TestAuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'test-secret';
  }

  /**
   * 生成测试JWT token
   */
  generateToken(userId) {
    return jwt.sign({ userId, type: 'access' }, this.jwtSecret, {
      expiresIn: '24h',
    });
  }

  /**
   * 测试专用注册接口 - 完全绕过数据库验证
   */
  async testRegister(email, password, username) {
    const fixedEmail = email.trim().toLowerCase();
    
    // 生成虚拟用户ID（基于邮箱和时间的哈希）
    const userId = this.generateUserId(fixedEmail);
    
    // 生成虚拟头像
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    
    // 生成token
    const token = this.generateToken(userId);
    
    return {
      accessToken: token,
      user: {
        id: userId,
        username: username,
        avatar: avatarUrl
      }
    };
  }

  /**
   * 生成基于邮箱的虚拟用户ID
   */
  generateUserId(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString();
  }

  /**
   * 测试专用登录接口
   */
  async testLogin(email, password) {
    const fixedEmail = email.trim().toLowerCase();
    const userId = this.generateUserId(fixedEmail);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    
    const token = this.generateToken(userId);
    
    return {
      accessToken: token,
      user: {
        id: userId,
        username: email.split('@')[0],
        avatar: avatarUrl
      }
    };
  }
}