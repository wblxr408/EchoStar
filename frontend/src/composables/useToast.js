import { reactive, toRefs } from "vue";

const state = reactive({
  toasts: [],
  confirmDialog: null,
  promptDialog: null,
});

let toastId = 0;

export function showToast(message, type = "info", duration = 2500) {
  const id = ++toastId;
  state.toasts.push({ id, message, type, visible: true });

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
  return id;
}

function removeToast(id) {
  const idx = state.toasts.findIndex((t) => t.id === id);
  if (idx !== -1) {
    state.toasts[idx].visible = false;
    setTimeout(() => {
      const i = state.toasts.findIndex((t) => t.id === id);
      if (i !== -1) state.toasts.splice(i, 1);
    }, 300);
  }
}

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
