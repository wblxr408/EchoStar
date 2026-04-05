import { Router } from 'express';
import { TestAuthService } from './test-auth.service.js';

const router = Router();
const testAuthService = new TestAuthService();

/**
 * 测试专用注册接口 - 完全绕过数据库验证
 */
router.post('/test_register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({
        code: 400,
        message: '邮箱、密码和用户名不能为空'
      });
    }

    const result = await testAuthService.testRegister(email, password, username);
    
    res.json({
      code: 0,
      message: '注册成功',
      data: result
    });
  } catch (error) {
    console.error('Test register error:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

/**
 * 测试专用登录接口
 */
router.post('/test_login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        code: 400,
        message: '邮箱和密码不能为空'
      });
    }

    const result = await testAuthService.testLogin(email, password);
    
    res.json({
      code: 0,
      message: '登录成功',
      data: result
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

export default router;