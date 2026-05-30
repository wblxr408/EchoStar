/**
 * 故事标题编解码工具
 *
 * 约定：前端在发布时将标题（最多 20 字符）和正文合并为一个字符串存入后端 content 字段。
 *
 * 当前格式（v2）：使用 ASCII Record Separator (\x1E) 作为分隔符
 *   格式：[标题]\x1E[正文]
 *
 * 旧格式（v1）：使用 \x00 补齐到 20 字符
 *   格式：[标题(20字符,不足用 \x00 补齐)] + [正文]
 *
 * 旧数据兼容：不包含任何分隔符的旧数据整个作为正文。
 */

const TITLE_LENGTH = 20;
const TITLE_PAD_CHAR = '\x00';  // v1 填充字符（向后兼容）
const TITLE_SEP = '\x1E';        // v2 分隔符（ASCII Record Separator）

/**
 * 编码：将标题 + 正文合并为单个字符串（发送给后端）
 * @param {string} title  - 标题（最多 TITLE_LENGTH 个字符）
 * @param {string} body   - 正文
 * @returns {string} 合并后的字符串
 */
export function encodeStoryContent(title, body) {
  const safeTitle = (title || '').slice(0, TITLE_LENGTH);
  return safeTitle + TITLE_SEP + (body || '');
}

/**
 * 解码：从合并字符串中提取标题和正文
 * @param {string} content - 后端返回的 content 字段
 * @returns {{ title: string, body: string }}
 */
export function decodeStoryContent(content) {
  if (!content || typeof content !== 'string') {
    return { title: '', body: content || '' };
  }

  // v2 格式：title\x1Ebody
  const sepIdx = content.indexOf(TITLE_SEP);
  if (sepIdx !== -1 && sepIdx <= TITLE_LENGTH) {
    return {
      title: content.slice(0, sepIdx),
      body: content.slice(sepIdx + 1),
    };
  }

  // v1 格式：title + \x00 补齐到 20 字符 + body
  if (content.includes(TITLE_PAD_CHAR)) {
    const header = content.slice(0, TITLE_LENGTH);
    const rest = content.slice(TITLE_LENGTH);
    const title = header.replace(/\x00/g, '');
    const body = rest || '';
    return { title, body };
  }

  // 旧格式：无标题
  return { title: '', body: content };
}

/**
 * 快速提取标题（用于列表展示）
 * @param {string} content
 * @returns {string}
 */
export function extractTitle(content) {
  return decodeStoryContent(content).title;
}

/**
 * 快速提取正文（用于详情展示）
 * @param {string} content
 * @returns {string}
 */
export function extractBody(content) {
  return decodeStoryContent(content).body;
}
