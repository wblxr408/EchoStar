import Joi from 'joi';

/**
 * 创建收藏验证规则
 */
export const createFavoriteSchema = Joi.object({
  storyId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '故事ID必须是数字',
      'number.positive': '故事ID必须大于0'
    })
});

/**
 * 批量检查收藏状态验证规则
 */
export const checkMultipleFavoritedSchema = Joi.object({
  storyIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': '至少需要 1 个故事ID',
      'array.max': '最多支持 100 个故事ID'
    })
});

/**
 * 验证中间件 - 创建收藏
 */
export const validateCreateFavorite = (req, res, next) => {
  const { error } = createFavoriteSchema.validate(req.body, {
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

/**
 * 验证中间件 - 批量检查收藏状态
 */
export const validateCheckMultipleFavorited = (req, res, next) => {
  const { error } = checkMultipleFavoritedSchema.validate(req.body, {
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
