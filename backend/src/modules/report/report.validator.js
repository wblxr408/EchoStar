import Joi from 'joi';

/**
 * 创建举报验证规则
 */
export const createReportSchema = Joi.object({
  targetType: Joi.string()
    .valid('story', 'comment')
    .required()
    .messages({
      'any.only': '举报类型必须是 story 或 comment',
      'any.required': '举报类型不能为空'
    }),

  targetId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '目标ID必须是数字',
      'number.positive': '目标ID必须大于0',
      'any.required': '目标ID不能为空'
    }),

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

/**
 * 处理举报验证规则
 */
export const handleReportSchema = Joi.object({
  action: Joi.string()
    .valid('approve', 'reject')
    .required()
    .messages({
      'any.only': '操作类型必须是 approve 或 reject',
      'any.required': '操作类型不能为空'
    })
});

/**
 * 获取举报列表验证规则
 */
export const getReportsSchema = Joi.object({
  targetType: Joi.string()
    .valid('story', 'comment')
    .optional()
    .messages({
      'any.only': '举报类型必须是 story 或 comment'
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

/**
 * 验证中间件：创建举报
 */
export const validateCreateReport = (req, res, next) => {
  const { error } = createReportSchema.validate(req.body, {
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
 * 验证中间件：处理举报
 */
export const validateHandleReport = (req, res, next) => {
  const { error } = handleReportSchema.validate(req.body, {
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
 * 验证中间件：获取举报列表
 */
export const validateGetReports = (req, res, next) => {
  const { error, value } = getReportsSchema.validate(req.query, {
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

  req.query = { ...req.query, ...value };
  next();
};
