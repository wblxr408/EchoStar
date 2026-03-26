import Joi from 'joi';

/**
 * 创建评论验证规则
 */
export const createCommentSchema = Joi.object({
  storyId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '故事ID必须是数字',
      'number.positive': '故事ID必须大于0'
    }),

  content: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': '评论内容不能为空',
      'string.max': '评论内容不能超过 500 字'
    })
});

/**
 * 验证中间件
 */
export const validateCreateComment = (req, res, next) => {
  const { error } = createCommentSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      code: 4000,
      message: '输入验证失败',
      errors
    });
  }

  next();
};
