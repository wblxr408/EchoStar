/**
 * 统一响应码定义
 */
export const ResponseCode = {
  // 成功
  SUCCESS: 0,

  // 客户端错误 (400-499)
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,

  // 服务器错误 (500-599)
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,

  // 业务错误 (1000+)
  USER_EXISTS: 1001,
  USER_NOT_FOUND: 1002,
  INVALID_PASSWORD: 1003,
  INVALID_TOKEN: 1004,

  STORY_NOT_FOUND: 2001,
  STORY_FORBIDDEN: 2002,
  TIME_CAPSULE_LOCKED: 2003,

  PERMISSION_DENIED: 3001
};

/**
 * 错误消息映射
 */
export const ResponseMessage = {
  [ResponseCode.SUCCESS]: '成功',
  [ResponseCode.BAD_REQUEST]: '请求参数错误',
  [ResponseCode.UNAUTHORIZED]: '未授权',
  [ResponseCode.FORBIDDEN]: '禁止访问',
  [ResponseCode.NOT_FOUND]: '资源不存在',
  [ResponseCode.VALIDATION_ERROR]: '数据验证失败',
  [ResponseCode.TOO_MANY_REQUESTS]: '请求过于频繁',
  [ResponseCode.INTERNAL_ERROR]: '服务器内部错误',
  [ResponseCode.SERVICE_UNAVAILABLE]: '服务暂时不可用',

  [ResponseCode.USER_EXISTS]: '用户已存在',
  [ResponseCode.USER_NOT_FOUND]: '用户不存在',
  [ResponseCode.INVALID_PASSWORD]: '密码错误',
  [ResponseCode.INVALID_TOKEN]: 'Token 无效或已过期',

  [ResponseCode.STORY_NOT_FOUND]: '故事不存在',
  [ResponseCode.STORY_FORBIDDEN]: '无权访问此故事',
  [ResponseCode.TIME_CAPSULE_LOCKED]: '时光胶囊尚未解锁',

  [ResponseCode.PERMISSION_DENIED]: '权限不足'
};
