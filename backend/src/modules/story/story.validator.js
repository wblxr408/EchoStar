import Joi from 'joi';

/**
 * 发布故事验证规则
 */
export const createStorySchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': '故事内容不能为空',
      'string.max': '故事内容不能超过 1000 字'
    }),

  images: Joi.array()
    .items(Joi.string().uri())
    .min(1)
    .max(9)
    .required()
    .messages({
      'array.min': '至少上传 1 张图片',
      'array.max': '最多上传 9 张图片'
    }),

  location: Joi.object({
    lat: Joi.number()
      .min(-90)
      .max(90)
      .required(),
    lng: Joi.number()
      .min(-180)
      .max(180)
      .required()
  }).required(),

  emotionTag: Joi.string()
    .valid('治愈', '难过', '开心', '打卡')
    .required(),

  isTimeCapsule: Joi.boolean()
    .optional(),

  unlockAt: Joi.date()
    .iso()
    .min('now')
    .when('isTimeCapsule', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
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
      code: 4000,
      message: '输入验证失败',
      errors
    });
  }

  next();
};
