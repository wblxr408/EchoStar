/**
 * 字体特效工具函数
 * 根据字体特效 key 返回对应的 CSS style 对象
 */

export const SOLID_COLORS = {
  color_gold: '#d4a017',
  color_pink: '#e84393',
  color_blue: '#0984e3',
  color_green: '#00b894',
  color_red: '#d63031',
  color_purple: '#6c5ce7',
  color_cyan: '#00cec9',
  color_orange: '#e17055',
}

export const FLOW_EFFECTS = {
  flow_rainbow: {
    backgroundImage: 'linear-gradient(90deg, #ff6b6b, #ffa502, #ffd43b, #51cf66, #339af0, #845ef7, #ff6b6b)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'font-flow-rainbow 2s linear infinite',
  },
  flow_gold: {
    backgroundImage: 'linear-gradient(90deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'font-flow-gold 2s linear infinite',
  },
  flow_sunset: {
    backgroundImage: 'linear-gradient(90deg, #ff6b6b, #ee5a24, #f0932b, #ffbe76, #ff6b6b)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'font-flow-sunset 2s linear infinite',
  },
  flow_ocean: {
    backgroundImage: 'linear-gradient(90deg, #0984e3, #00cec9, #74b9ff, #00b894, #0984e3)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'font-flow-ocean 2s linear infinite',
  },
  flow_aurora: {
    backgroundImage: 'linear-gradient(90deg, #a29bfe, #6c5ce7, #00cec9, #55efc4, #a29bfe)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'font-flow-aurora 2s linear infinite',
  },
  flow_neon: {
    backgroundImage: 'linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff, #ffff00, #ff00ff)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'font-flow-neon 1.5s linear infinite',
  },
  flow_sakura: {
    backgroundImage: 'linear-gradient(90deg, #fd79a8, #e84393, #fab1a0, #fd79a8)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'font-flow-sakura 2s linear infinite',
  },
  flow_starry: {
    backgroundImage: 'linear-gradient(90deg, #2d3436, #636e72, #dfe6e9, #b2bec3, #2d3436)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'font-flow-starry 3s linear infinite',
  },
}

/**
 * 根据字体特效 key 获取 CSS style 对象
 * @param {string} effectKey - 特效 key，如 'color_gold', 'flow_rainbow'
 * @returns {object} CSS style 对象
 */
export function getFontEffectStyle(effectKey) {
  if (!effectKey) return {}

  if (SOLID_COLORS[effectKey]) {
    return { color: SOLID_COLORS[effectKey] }
  }

  if (FLOW_EFFECTS[effectKey]) {
    return { ...FLOW_EFFECTS[effectKey] }
  }

  return {}
}

/**
 * 组合字体和特效的完整 style
 * @param {string} fontFamily - 字体名称
 * @param {string} fontEffect - 特效 key
 * @returns {object} CSS style 对象
 */
export function getFontStyle(fontFamily, fontEffect) {
  const style = {}

  if (fontFamily) {
    style.fontFamily = `'${fontFamily}', cursive, sans-serif`
  }

  const effectStyle = getFontEffectStyle(fontEffect)
  Object.assign(style, effectStyle)

  return style
}

/**
 * 注入字体流光动画的 CSS keyframes（只执行一次）
 */
let injected = false

export function injectFontEffectAnimations() {
  if (injected) return
  injected = true

  const style = document.createElement('style')
  style.id = 'font-effect-animations'
  style.textContent = `
@keyframes font-flow-rainbow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes font-flow-gold { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes font-flow-sunset { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes font-flow-ocean { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes font-flow-aurora { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes font-flow-neon { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes font-flow-sakura { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes font-flow-starry { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
`
  document.head.appendChild(style)
}
