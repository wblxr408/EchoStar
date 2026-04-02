import Joi from 'joi';

const storyIdSchema = Joi.alternatives()
  .try(
    Joi.string().trim().pattern(/^[1-9]\d*$/),
    Joi.number().integer().positive().unsafe(false)
  )
  .custom((value, helpers) => {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
      return helpers.error('number.unsafe');
    }

    const normalizedValue = typeof value === 'bigint'
      ? value.toString()
      : String(value).trim();

    if (!/^[1-9]\d*$/.test(normalizedValue)) {
      return helpers.error('string.pattern.base');
    }

    return normalizedValue;
  })
  .messages({
    'alternatives.match': '故事ID必须是正整数',
    'number.base': '故事ID必须是数字',
    'number.integer': '故事ID必须是整数',
    'number.positive': '故事ID必须大于0',
    'number.unsafe': '故事ID过大，请使用字符串形式传递',
    'string.base': '故事ID必须是字符串或数字',
    'string.empty': '故事ID不能为空',
    'string.pattern.base': '故事ID必须是正整数字符串'
  });

export const createCommentSchema = Joi.object({
  storyId: storyIdSchema.required(),
  content: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': '评论内容不能为空',
      'string.max': '评论内容不能超过 500 字'
    })
});

export const validateCreateComment = (req, res, next) => {
  const { error, value } = createCommentSchema.validate(req.body, {
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
