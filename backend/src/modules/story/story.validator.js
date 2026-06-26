import Joi from 'joi';

export const createStorySchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .custom((value, helpers) => {
      const sepIdx = value.indexOf('\x1E');
      if (sepIdx !== -1 && sepIdx <= 20) {
        const title = value.slice(0, sepIdx);
        if (title.length > 0 && title.trim().length === 0) {
          return helpers.error('content.titleWhitespace');
        }
      }
      return value;
    })
    .messages({
      'string.empty': '故事内容不能为空',
      'string.max': '故事内容不能超过 1000 字',
      'content.titleWhitespace': '标题不能为全空白字符'
    }),

  images: Joi.array()
    .items(Joi.string().uri())
    .min(0)
    .max(9)
    .required()
    .messages({
      'array.min': '至少上传 0 张图片',
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

  locationName: Joi.string()
    .allow(null, '')
    .optional(),

  emotionTag: Joi.string()
    .valid('治愈', '难过', '开心', '打卡')
    .required(),

  isTimeCapsule: Joi.boolean()
    .optional(),

  unlockAt: Joi.when('isTimeCapsule', {
    is: true,
    then: Joi.date()
      .iso()
      .min('now')
      .required()
      .messages({
        'date.min': '解锁时间必须在未来'
      }),
    otherwise: Joi.optional()
  }),

  visibility: Joi.string()
    .valid('public', 'shadowban')
    .optional()
    .default('public')
    .messages({
      'any.only': '可见性只能为 public 或 shadowban'
    }),

  visibilityStartTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': '开始时间格式应为 HH:mm'
    }),

  visibilityEndTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': '结束时间格式应为 HH:mm'
    })
});

export const validateCreateStory = (req, res, next) => {
  const { error } = createStorySchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    console.error('Validation Errors:', errors);
    return res.status(400).json({
      code: 4000,
      message: '输入验证失败',
      errors
    });
  }

  next();
};

export const modifyStorySchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'string.empty': '故事内容不能为空',
      'string.max': '故事内容不能超过 1000 字'
    }),

  emotionTag: Joi.string()
    .valid('治愈', '难过', '开心', '打卡')
    .optional()
    .messages({
      'any.only': 'emotionTag 只能是：治愈、难过、开心、打卡'
    })
}).min(1).messages({
  'object.min': '至少需要提供一个要修改的字段'
});

export const validateModifyStory = (req, res, next) => {
  const { error } = modifyStorySchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false
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
