export const ANNOUNCEMENT_TYPES = [
  { key: "info", icon: "📢", label: "通知", color: "#667eea" },
  { key: "warning", icon: "⚠️", label: "警告", color: "#f59e0b" },
  { key: "feature", icon: "✨", label: "更新", color: "#10b981" },
  { key: "emotion", icon: "💝", label: "互动", color: "#ef4444" },
];

const announcementTypeMap = ANNOUNCEMENT_TYPES.reduce((acc, a) => {
  acc[a.key] = a;
  return acc;
}, {});

export function getAnnouncementTypeIcon(type) {
  return announcementTypeMap[type]?.icon || "📢";
}

export function getAnnouncementTypeLabel(type) {
  return announcementTypeMap[type]?.label || "系统公告";
}

export function getAnnouncementTypeColor(type) {
  return announcementTypeMap[type]?.color || "#667eea";
}
