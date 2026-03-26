const FRONTEND_EMOTIONS = {
  happy: { value: 'happy', icon: '😊', label: '开心', color: '#ffd700' },
  sad: { value: 'sad', icon: '😢', label: '难过', color: '#6b7280' },
  neutral: { value: 'neutral', icon: '😐', label: '平静', color: '#9ca3af' },
  excited: { value: 'excited', icon: '📍', label: '打卡', color: '#f97316' },
  peaceful: { value: 'peaceful', icon: '😌', label: '治愈', color: '#10b981' }
};

const TAG_TO_EMOTION = {
  开心: 'happy',
  难过: 'sad',
  治愈: 'peaceful',
  打卡: 'excited'
};

const EMOTION_TO_TAG = {
  happy: '开心',
  sad: '难过',
  neutral: '治愈',
  excited: '打卡',
  peaceful: '治愈'
};

export const EMOTIONS = [
  { value: '开心', icon: '😊', label: '开心', color: '#ffd700' },
  { value: '难过', icon: '😢', label: '难过', color: '#6b7280' },
  { value: '治愈', icon: '😌', label: '治愈', color: '#10b981' },
  { value: '打卡', icon: '📍', label: '打卡', color: '#f97316' }
];

export const EMOTION_TAGS = [...EMOTIONS];

const emotionMap = Object.fromEntries(
  Object.values(FRONTEND_EMOTIONS).map((emotion) => [emotion.value, emotion])
);

const emotionTagMap = Object.fromEntries(
  EMOTION_TAGS.map((emotion) => [emotion.value, emotion])
);

function resolveEmotionInfo(emotion) {
  if (!emotion) {
    return null;
  }

  if (emotionMap[emotion]) {
    return emotionMap[emotion];
  }

  if (emotionTagMap[emotion]) {
    return emotionTagMap[emotion];
  }

  const mappedEmotion = TAG_TO_EMOTION[emotion];
  if (mappedEmotion && emotionMap[mappedEmotion]) {
    return emotionMap[mappedEmotion];
  }

  const mappedTag = EMOTION_TO_TAG[emotion];
  if (mappedTag && emotionTagMap[mappedTag]) {
    return emotionTagMap[mappedTag];
  }

  return null;
}

export function getEmotionEmoji(emotion) {
  return resolveEmotionInfo(emotion)?.icon || '📍';
}

export function getEmotionLabel(emotion) {
  return resolveEmotionInfo(emotion)?.label || '未知';
}

export function getEmotionColor(emotion) {
  return resolveEmotionInfo(emotion)?.color || '#9ca3af';
}

export function getEmotionInfo(emotion) {
  return resolveEmotionInfo(emotion);
}

export function toEmotionTag(emotion) {
  return EMOTION_TO_TAG[emotion] || emotion;
}

export function fromEmotionTag(tag) {
  return TAG_TO_EMOTION[tag] || tag;
}
