# 雪花ID迁移指南

## 概述

本次迁移将 Story 和 Comment 模型的主键从自增 INTEGER 改为雪花ID（BIGINT），以便在 RocketMQ 削峰场景下能够立即返回真实的 ID 给前端。

## 迁移步骤

### 1. 执行数据库迁移

```bash
# 在 PostgreSQL 中执行迁移脚本（按顺序执行）
psql -U postgres -d echostar -f migrations/001-convert-story-id-to-snowflake.sql
psql -U postgres -d echostar -f migrations/002-convert-comment-id-to-snowflake.sql
```

**注意**：执行前请备份数据库！

### 2. 配置雪花ID参数

在 `.env` 文件中配置雪花ID生成器的参数：

```env
SNOWFLAKE_WORKER_ID=1
SNOWFLAKE_DATACENTER_ID=1
```

- `SNOWFLAKE_WORKER_ID`: 工作机器ID（0-31）
- `SNOWFLAKE_DATACENTER_ID`: 数据中心ID（0-31）

**重要**：确保不同实例的 workerId + datacenterId 组合唯一，避免 ID 冲突。

### 3. 重启服务

```bash
npm run dev
```

## 验证迁移

创建一个新故事，检查返回的 ID 是否为雪花ID格式（大整数）：

```json
{
  "id": "1899286752244883456",
  ...
}
```

创建一个新评论，检查返回的 ID 是否为雪花ID格式（大整数）：

```json
{
  "id": "1899286752244883457",
  ...
}
```

## 回滚方案

如果需要回滚，执行以下 SQL：

```sql
-- 删除外键约束
ALTER TABLE likes DROP CONSTRAINT likes_story_id_fkey;
ALTER TABLE comments DROP CONSTRAINT comments_story_id_fkey;
ALTER TABLE favorites DROP CONSTRAINT favorites_story_id_fkey;
ALTER TABLE time_capsules DROP CONSTRAINT time_capsules_story_id_fkey;
ALTER TABLE admin_actions DROP CONSTRAINT admin_actions_story_id_fkey;

-- 回滚字段类型（注意：这会导致雪花ID溢出丢失）
ALTER TABLE stories ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE likes ALTER COLUMN story_id TYPE INTEGER USING story_id::INTEGER;
ALTER TABLE comments ALTER COLUMN story_id TYPE INTEGER USING story_id::INTEGER;
ALTER TABLE comments ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE favorites ALTER COLUMN story_id TYPE INTEGER USING story_id::INTEGER;
ALTER TABLE time_capsules ALTER COLUMN story_id TYPE INTEGER USING story_id::INTEGER;
ALTER TABLE admin_actions ALTER COLUMN story_id TYPE INTEGER USING story_id::INTEGER;

-- 重建外键约束
ALTER TABLE likes ADD CONSTRAINT likes_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id);
ALTER TABLE comments ADD CONSTRAINT comments_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id);
ALTER TABLE favorites ADD CONSTRAINT favorites_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id);
ALTER TABLE time_capsules ADD CONSTRAINT time_capsules_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id);
ALTER TABLE admin_actions ADD CONSTRAINT admin_actions_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id);
```

**警告**：回滚后，所有雪花ID创建的故事和评论将因为溢出而丢失，请谨慎操作。

## 影响范围

### 模型层
- ✅ Story 模型 id 字段：INTEGER → BIGINT
- ✅ Comment 模型 id 字段：INTEGER → BIGINT
- ✅ Like 模型 storyId 字段：INTEGER → BIGINT
- ✅ Comment 模型 storyId 字段：INTEGER → BIGINT
- ✅ Favorite 模型 storyId 字段：INTEGER → BIGINT
- ✅ TimeCapsule 模型 storyId 字段：INTEGER → BIGINT
- ✅ AdminAction 模型 storyId 字段：INTEGER → BIGINT

### 业务代码
- ✅ 无需修改（JavaScript 动态类型 + Sequelize 自动处理）

### 数据库
- ✅ 执行迁移脚本即可
- ⚠️  现有数据不受影响（INTEGER → BIGINT 无损转换）
