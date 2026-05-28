const EMOTION_DEFINITIONS = {
  happy: {
    key: "happy",
    tag: "\u5f00\u5fc3",
    icon: "\ud83d\ude0a",
    label: "\u5f00\u5fc3",
    color: "#ffd700",
  },
  sad: {
    key: "sad",
    tag: "\u96be\u8fc7",
    icon: "\ud83d\ude22",
    label: "\u96be\u8fc7",
    color: "#6b7280",
  },
  peaceful: {
    key: "peaceful",
    tag: "\u6cbb\u6108",
    icon: "\ud83d\ude0c",
    label: "\u6cbb\u6108",
    color: "#10b981",
  },
  excited: {
    key: "excited",
    tag: "\u6253\u5361",
    icon: "\ud83d\udccd",
    label: "\u6253\u5361",
    color: "#f97316",
  },
  neutral: {
    key: "neutral",
    tag: "\u6cbb\u6108",
    icon: "\ud83d\ude42",
    label: "\u6cbb\u6108",
    color: "#10b981",
  },
};

const EMOTION_ALIASES = {
  happy: "happy",
  "\u5f00\u5fc3": "happy",
  sad: "sad",
  "\u96be\u8fc7": "sad",
  peaceful: "peaceful",
  "\u6cbb\u6108": "peaceful",
  neutral: "peaceful",
  "\u5e73\u9759": "peaceful",
  excited: "excited",
  "\u6253\u5361": "excited",
};

function cleanEmotionValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeEmotionValue(value) {
  const normalized = cleanEmotionValue(value);
  return EMOTION_ALIASES[normalized] || normalized || "";
}

export function normalizeEmotionTag(value) {
  const normalizedValue = normalizeEmotionValue(value);
  return EMOTION_DEFINITIONS[normalizedValue]?.tag || cleanEmotionValue(value);
}

function resolveEmotionInfo(value) {
  const normalizedValue = normalizeEmotionValue(value);
  if (!normalizedValue) {
    return null;
  }

  return EMOTION_DEFINITIONS[normalizedValue] || null;
}

export const EMOTIONS = [
  EMOTION_DEFINITIONS.happy,
  EMOTION_DEFINITIONS.sad,
  EMOTION_DEFINITIONS.peaceful,
  EMOTION_DEFINITIONS.excited,
].map(({ tag, icon, label, color }) => ({
  value: tag,
  icon,
  label,
  color,
}));

export const EMOTION_TAGS = [...EMOTIONS];

export function getEmotionEmoji(value) {
  return resolveEmotionInfo(value)?.icon || "\ud83d\udccd";
}

export function getEmotionLabel(value) {
  return resolveEmotionInfo(value)?.label || "\u672a\u77e5";
}

export function getEmotionColor(value) {
  return resolveEmotionInfo(value)?.color || "#9ca3af";
}

export function getEmotionInfo(value) {
  return resolveEmotionInfo(value);
}

export function toEmotionTag(value) {
  return normalizeEmotionTag(value);
}

export function fromEmotionTag(value) {
  return normalizeEmotionValue(value);
}
