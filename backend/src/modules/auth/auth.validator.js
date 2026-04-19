import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(2)
    .max(30)
    .optional()
    .messages({
      'string.min': '用户名至少 2 个字符',
      'string.max': '用户名不能超过 30 个字符'
    }),
  avatarUrl: Joi.string()
    .uri()
    .allow('')
    .optional()
    .messages({
      'string.uri': '头像地址格式不正确'
    }),
  bio: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': '个性签名不能超过 200 个字符'
    }),
  bioFontFamily: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': '字体名称不能超过 100 个字符'
    }),
  bioFontEffect: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .optional()
    .messages({
      'string.max': '字体特效标识不能超过 50 个字符'
    })
}).min(1);

export const validateUpdateProfile = (req, res, next) => {
  const { error, value } = updateProfileSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({
      code: 4000,
      message: '输入验证失败',
      errors
    });
  }

  req.body = value;
  next();
};
