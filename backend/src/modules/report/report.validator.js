import Joi from 'joi';

const targetIdSchema = Joi.alternatives()
  .try(
    Joi.string().trim().pattern(/^-?[1-9]\d*$/),
    Joi.number().integer().invalid(0).unsafe(false)
  )
  .custom((value, helpers) => {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
      return helpers.error('number.unsafe');
    }

    const normalizedValue = typeof value === 'bigint'
      ? value.toString()
      : String(value).trim();

    if (!/^-?[1-9]\d*$/.test(normalizedValue)) {
      return helpers.error('string.pattern.base');
    }

    return normalizedValue;
  })
  .messages({
    'alternatives.match': '目标ID格式不正确',
    'number.base': '目标ID必须是数字',
    'number.integer': '目标ID必须是整数',
    'number.unsafe': '目标ID超出安全整数范围，请使用字符串传递',
    'any.invalid': '目标ID不能为0',
    'string.base': '目标ID必须是字符串或数字',
    'string.empty': '目标ID不能为空',
    'string.pattern.base': '目标ID格式不正确'
  });

export const createReportSchema = Joi.object({
  targetType: Joi.string()
    .valid('story', 'comment')
    .required()
    .messages({
      'any.only': '举报目标类型必须是 story 或 comment',
      'any.required': '举报目标类型不能为空'
    }),

  targetId: targetIdSchema.required(),

  reason: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': '举报原因不能为空',
      'string.min': '举报原因不能为空',
      'string.max': '举报原因不能超过 500 字',
      'any.required': '举报原因不能为空'
    })
});

export const handleReportSchema = Joi.object({
  action: Joi.string()
    .valid('approve', 'reject', 'restore')
    .required()
    .messages({
      'any.only': '处理动作必须是 approve、reject 或 restore',
      'any.required': '处理动作不能为空'
    })
});

export const getReportsSchema = Joi.object({
  targetType: Joi.string()
    .valid('story', 'comment')
    .optional()
    .messages({
      'any.only': '举报目标类型必须是 story 或 comment'
    }),

  status: Joi.string()
    .valid('pending', 'approved', 'rejected')
    .optional()
    .messages({
      'any.only': '状态必须是 pending、approved 或 rejected'
    }),

  page: Joi.number()
    .integer()
    .positive()
    .optional()
    .default(1),

  limit: Joi.number()
    .integer()
    .positive()
    .max(100)
    .optional()
    .default(20)
});

export const validateCreateReport = (req, res, next) => {
  const { error, value } = createReportSchema.validate(req.body, {
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

export const validateHandleReport = (req, res, next) => {
  const { error } = handleReportSchema.validate(req.body, {
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

  next();
};

export const validateGetReports = (req, res, next) => {
  const { error, value } = getReportsSchema.validate(req.query, {
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

  req.query = { ...req.query, ...value };
  next();
};
