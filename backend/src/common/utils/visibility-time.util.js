import { sequelize } from '../../config/database.js';

/**
 * 时段限定可见条件：无时间窗口 或 当前服务器时间在窗口内
 * 支持跨夜窗口（如 23:00-05:00 深夜树洞）
 * @returns {import('sequelize').Literal}
 */
export function getVisibilityTimeCondition() {
  return sequelize.literal(`
    (
      (visibility_start_time IS NULL AND visibility_end_time IS NULL)
      OR
      (
        visibility_start_time IS NOT NULL AND visibility_end_time IS NOT NULL
        AND (
          (visibility_start_time <= visibility_end_time AND (CURRENT_TIME)::time >= visibility_start_time::time AND (CURRENT_TIME)::time < visibility_end_time::time)
          OR
          (visibility_start_time > visibility_end_time AND ((CURRENT_TIME)::time >= visibility_start_time::time OR (CURRENT_TIME)::time < visibility_end_time::time))
        )
      )
    )
  `);
}
