import Joi from 'joi';

/**
 * 发布故事验证规则
 */
export const createStorySchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': '故事内容不能为空',
      'string.max': '故事内容不能超过 500 字'
    }),

  images: Joi.array()
    .items(Joi.string().uri())
    .max(9)
    .optional()
    .messages({
      'array.max': '最多上传 9 张图片'
    }),

  location: Joi.object({
    latitude: Joi.number()
      .min(-90)
      .max(90)
      .required(),
    longitude: Joi.number()
      .min(-180)
      .max(180)
      .required(),
    name: Joi.string()
      .optional()
  }).required(),

  emotion: Joi.string()
    .valid('happy', 'sad', 'neutral', 'excited', 'peaceful')
    .optional(),

  isTimeCapsule: Joi.boolean()
    .optional(),

  unlockAt: Joi.date()
    .iso()
    .min('now')
    .when('isTimeCapsule', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'date.min': '解锁时间必须在未来'
    })
});

/**
 * 验证中间件
 */
export const validateCreateStory = (req, res, next) => {
  const { error } = createStorySchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      code: 400,
      message: '输入验证失败',
      errors
    });
  }

  next();
};
