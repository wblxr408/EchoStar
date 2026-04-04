import { reactive, toRefs } from 'vue';

// ========== 全局响应式状态 ==========
const state = reactive({
  toasts: [],
  confirmDialog: null, // { message, resolve, reject }
  promptDialog: null,   // { message, placeholder, defaultValue, resolve }
});

let toastId = 0;

// ========== Toast（替代 alert）==========
/**
 * @param {string} message  提示文本
 * @param {'success'|'error'|'warning'|'info'} type  类型
 * @param {number} duration  自动关闭时间(ms)，0=不自动关闭
 */
export function showToast(message, type = 'info', duration = 2500) {
  const id = ++toastId;
  state.toasts.push({ id, message, type, visible: true });

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
  return id;
}

function removeToast(id) {
  const idx = state.toasts.findIndex(t => t.id === id);
  if (idx !== -1) {
    state.toasts[idx].visible = false;
    // 等动画结束再移除
    setTimeout(() => {
      const i = state.toasts.findIndex(t => t.id === id);
      if (i !== -1) state.toasts.splice(i, 1);
    }, 300);
  }
}

// ========== Confirm（替代 confirm）==========
/**
 * @param {string} message  确认文本
 * @returns {Promise<boolean>}
 */
export function showConfirm(message) {
  return new Promise((resolve) => {
    state.confirmDialog = { message, resolve };
  });
}

export function handleConfirmResult(result) {
  if (state.confirmDialog) {
    state.confirmDialog.resolve(result);
    state.confirmDialog = null;
  }
}

// ========== Prompt（替代 prompt）==========
/**
 * @param {string} message  提示文本
 * @param {{ placeholder?: string, defaultValue?: string }} opts
 * @returns {Promise<string|null>} 用户输入的值，取消返回 null
 */
export function showPrompt(message, opts = {}) {
  return new Promise((resolve) => {
    state.promptDialog = { message, ...opts, resolve };
  });
}

export function handlePromptResult(value) {
  if (state.promptDialog) {
    state.promptDialog.resolve(value);
    state.promptDialog = null;
  }
}

// ========== Composable ==========
export function useToast() {
  return {
    ...toRefs(state),
    showToast,
    showConfirm,
    handleConfirmResult,
    showPrompt,
    handlePromptResult,
  };
}
