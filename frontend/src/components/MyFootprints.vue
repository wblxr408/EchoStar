<template>
  <transition name="footprint-fade">
    <div
      v-if="visible"
      class="footprints-overlay"
      :class="{ 'footprints-dark': isDark }"
      @click.stop
    >
      <!-- 顶部标题栏 -->
      <div class="footprints-header">
        <div class="footprints-title">
          <span class="footprints-icon">🐾</span>
          <span>我的足迹</span>
        </div>
        <button class="footprints-close-btn" @click="handleClose" aria-label="关闭足迹动画">
          <span>✕</span>
        </button>
      </div>

      <!-- 进度信息 -->
      <div class="footprints-progress">
        <div class="progress-text">
          <span v-if="phase === 'loading'" class="progress-label">加载故事中…</span>
          <span v-else-if="phase === 'ready'" class="progress-label">共 {{ stories.length }} 个足迹，点击播放</span>
          <span v-else-if="phase === 'playing'" class="progress-label">
            途经 {{ Math.round(travelProgress * stories.length) }} / {{ stories.length }}
          </span>
          <span v-else-if="phase === 'paused'" class="progress-label">
            {{ isDraggingProgress ? '拖动中' : '已暂停' }} · 途经 {{ Math.round(travelProgress * stories.length) }} / {{ stories.length }}
          </span>
          <span v-else-if="phase === 'ended'" class="progress-label">足迹回放完毕</span>
        </div>
        <div v-if="stories.length > 0" class="progress-bar-track" ref="progressBarRef">
          <div
            class="progress-bar-fill"
            :style="{
              width: (travelProgress * 100) + '%',
            }"
          ></div>
          <div
            class="progress-bar-thumb"
            :style="{
              left: (travelProgress * 100) + '%',
            }"
            :class="{ 'thumb-active': isDraggingProgress }"
          ></div>
          <input
            type="range"
            class="progress-bar-input"
            min="0"
            max="1000"
            step="1"
            :value="Math.round(travelProgress * 1000)"
            :disabled="phase === 'loading' || phase === 'ready'"
            @input="handleProgressInput"
            @mousedown="handleProgressDragStart"
            @mouseup="handleProgressDragEnd"
            @touchstart="handleProgressDragStart"
            @touchend="handleProgressDragEnd"
          />
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="footprints-controls">
        <template v-if="phase === 'ready'">
          <button class="ctrl-btn ctrl-primary" @click="startAnimation">
            <span class="ctrl-icon">▶</span>
            <span>开始回放</span>
          </button>
        </template>

        <template v-else-if="phase === 'playing'">
          <button class="ctrl-btn" @click="pauseAnimation" title="暂停">
            <span class="ctrl-icon">⏸</span>
          </button>
          <button class="ctrl-btn" @click="skipToEnd" title="跳至结尾">
            <span class="ctrl-icon">⏩</span>
          </button>
          <div class="speed-selector">
            <button
              v-for="s in speedOptions"
              :key="s.value"
              class="speed-btn"
              :class="{ active: playbackSpeed === s.value }"
              @click="changeSpeed(s.value)"
            >
              {{ s.label }}
            </button>
          </div>
        </template>

        <template v-else-if="phase === 'paused'">
          <button class="ctrl-btn ctrl-primary" @click="resumeAnimation" title="继续">
            <span class="ctrl-icon">▶</span>
          </button>
          <button class="ctrl-btn" @click="skipToEnd" title="跳至结尾">
            <span class="ctrl-icon">⏩</span>
          </button>
          <div class="speed-selector">
            <button
              v-for="s in speedOptions"
              :key="s.value"
              class="speed-btn"
              :class="{ active: playbackSpeed === s.value }"
              @click="changeSpeed(s.value)"
            >
              {{ s.label }}
            </button>
          </div>
        </template>

        <template v-else-if="phase === 'ended'">
          <button class="ctrl-btn" @click="replayAnimation" title="重新播放">
            <span class="ctrl-icon">🔄</span>
            <span>重播</span>
          </button>
        </template>
      </div>

      <!-- 当前故事卡片 -->
      <transition name="story-card-slide">
        <div
          v-if="currentStory && (phase === 'playing' || phase === 'paused' || phase === 'ended')"
          class="footprints-story-card"
          :class="{ 'story-card-dark': isDark }"
          @click.stop="handleStoryCardClick"
        >
          <div class="story-card-emotion" :style="{ borderColor: currentEmotionColor }">
            {{ currentEmotionEmoji }}
          </div>
          <div class="story-card-body">
            <p class="story-card-content">{{ currentStory.content || currentStory.preview || '' }}</p>
            <div class="story-card-meta">
              <span class="story-card-location">📍 {{ currentStory.location?.address || currentStory.locationName || '' }}</span>
              <span class="story-card-time">{{ formatTime(currentStory.createdAt) }}</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- 空状态 -->
      <div v-if="phase === 'ready' && stories.length === 0" class="footprints-empty">
        <span class="empty-icon">🐾</span>
        <p>暂无故事足迹</p>
        <p class="empty-hint">发布你的第一个故事，开启足迹之旅</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { getEmotionEmoji, getEmotionColor, fromEmotionTag } from '../utils/emotion'
import { storyApi } from '../api/story'
import { useMapStore } from '../stores/map'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  isDark: {
    type: Boolean,
    default: false,
  },
  mapRef: {
    type: Object,
    default: null,
  },
  storyDetailOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'story-click', 'animation-start', 'animation-end'])

// --- Bright arc color palette ---
const ARC_COLORS = [
  '#FFD700', // 金色
  '#FF6B9D', // 粉色
  '#5B9CFF', // 蓝色
  '#7CFF7C', // 亮绿
  '#FF8C42', // 橙色
  '#B47EFF', // 紫色
  '#00E5FF', // 青色
  '#FF5252', // 红色
]

function pickArcColor(index) {
  return ARC_COLORS[index % ARC_COLORS.length]
}

// --- State ---
const phase = ref('loading') // loading | ready | playing | paused | ended
const stories = ref([])
const travelProgress = ref(0) // 0..1 overall progress
const currentSegmentIndex = ref(0) // which arc segment we're on
const showAllLines = ref(false)
const isDraggingProgress = ref(false)
const wasPlayingBeforeDrag = ref(false)
let wasPlayingBeforeStoryDetail = false

const playbackSpeed = ref(1)
const speedOptions = [
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '4x', value: 4 },
]

// Map overlay references
let arcPolylines = []     // completed arc segments
let travelerMarker = null // the moving dot
let emotionMarkers = []   // glassmorphism emotion markers
let allLinesPolylines = []
let animFrameId = null
let animStartTime = null
let pauseElapsed = 0      // ms elapsed before pause
const BASE_DURATION = 2500 // ms per segment at 1x
let lastVisitedIdx = -1   // track which marker was last triggered for flash
let footprintModeActive = false // whether we're in footprint mode (hiding original markers)
let classObserver = null   // MutationObserver to keep footprint-mode class persistent

// --- Computed ---
const currentStory = computed(() => {
  const idx = Math.min(currentSegmentIndex.value, stories.value.length - 1)
  if (idx >= 0 && idx < stories.value.length) {
    return stories.value[idx]
  }
  return null
})

const currentEmotionColor = computed(() => {
  if (!currentStory.value) return '#667eea'
  const emotion = fromEmotionTag(currentStory.value.emotionTag) || currentStory.value.emotion
  return getEmotionColor(emotion) || '#667eea'
})

const currentEmotionEmoji = computed(() => {
  if (!currentStory.value) return '😊'
  return getEmotionEmoji(currentStory.value.emotionTag || currentStory.value.emotion) || '😊'
})

// --- Watch visibility ---
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await loadStories()
  } else {
    cleanup()
  }
})

// --- Watch story detail open state ---
watch(() => props.storyDetailOpen, (isOpen) => {
  if (isOpen && phase.value === 'playing') {
    wasPlayingBeforeStoryDetail = true
    pauseAnimation()
  } else if (!isOpen && wasPlayingBeforeStoryDetail && phase.value === 'paused') {
    wasPlayingBeforeStoryDetail = false
    resumeAnimation()
  } else if (!isOpen) {
    wasPlayingBeforeStoryDetail = false
  }
})

// --- Load stories ---
async function loadStories() {
  phase.value = 'loading'
  try {
    const result = await storyApi.getMyStories({ page: 1, limit: 999 })
    const data = result.data || result
    const rawStories = Array.isArray(data?.stories)
      ? data.stories
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : []

    // Supplement emotionTag from mapStore (backend getMyStories doesn't return emotionTag)
    const mapStore = useMapStore()
    const mapStoryMap = new Map()
    for (const ms of mapStore.stories) {
      if (ms?.id && ms.emotionTag) {
        mapStoryMap.set(String(ms.id), ms.emotionTag)
      }
    }

    let enriched = rawStories
      .filter(s => s && s.location && (s.location.latitude || s.location.lat) && (s.location.longitude || s.location.lng))
      .map(s => {
        if (!s.emotionTag && s.id) {
          const mapEmotionTag = mapStoryMap.get(String(s.id))
          if (mapEmotionTag) {
            return { ...s, emotionTag: mapEmotionTag }
          }
        }
        return s
      })

    // For stories still missing emotionTag, fetch from getStoryById (batch, max 5 concurrent)
    const missingIds = enriched.filter(s => !s.emotionTag && s.id).map(s => s.id)
    if (missingIds.length > 0) {
      const batchSize = 5
      for (let i = 0; i < missingIds.length; i += batchSize) {
        const batch = missingIds.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          batch.map(id => storyApi.getStoryById(id))
        )
        results.forEach((res, idx) => {
          if (res.status === 'fulfilled' && res.value?.data?.emotionTag) {
            const storyId = batch[idx]
            const story = enriched.find(s => String(s.id) === String(storyId))
            if (story) story.emotionTag = res.value.data.emotionTag
          }
        })
      }
    }

    stories.value = enriched.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    phase.value = 'ready'
  } catch (err) {
    console.error('[MyFootprints] Failed to load stories:', err)
    stories.value = []
    phase.value = 'ready'
  }
}

// --- Map helpers ---
function getMapInstance() {
  const mapRef = props.mapRef
  if (!mapRef) return null
  const component = mapRef.value !== undefined ? mapRef.value : mapRef
  if (!component) return null
  if (!component.getMap) return null
  return component.getMap()
}

function getStoryCoords(story) {
  if (!story?.location) return null
  const lat = Number(story.location.latitude ?? story.location.lat)
  const lng = Number(story.location.longitude ?? story.location.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return [lng, lat]
}

// --- Generate arc path between two points ---
function generateArcPath(from, to, numPoints = 40) {
  const path = []
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dist = Math.sqrt(dx * dx + dy * dy)
  const curvature = Math.min(dist * 0.25, 0.015)
  const perpX = -dy / (dist || 1)
  const perpY = dx / (dist || 1)

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const x = from[0] + dx * t
    const y = from[1] + dy * t
    const arc = curvature * 4 * t * (1 - t)
    path.push([x + perpX * arc, y + perpY * arc])
  }
  return path
}

// --- Get point along polyline path at progress t (0..1) ---
function getPointAlongPath(path, t) {
  if (!path || path.length < 2) return path?.[0] || null
  const clamped = Math.max(0, Math.min(1, t))
  const totalSegments = path.length - 1
  const segFloat = clamped * totalSegments
  const segIdx = Math.floor(segFloat)
  const segT = segFloat - segIdx

  if (segIdx >= totalSegments) return path[totalSegments]

  const p0 = path[segIdx]
  const p1 = path[segIdx + 1]
  return [
    p0[0] + (p1[0] - p0[0]) * segT,
    p0[1] + (p1[1] - p0[1]) * segT,
  ]
}

// --- Build all arc paths ---
function buildAllArcPaths() {
  const paths = []
  for (let i = 1; i < stories.value.length; i++) {
    const from = getStoryCoords(stories.value[i - 1])
    const to = getStoryCoords(stories.value[i])
    if (from && to) {
      paths.push(generateArcPath(from, to))
    } else {
      paths.push(null)
    }
  }
  return paths
}

// --- Animation control ---
function startAnimation() {
  if (stories.value.length === 0) return
  phase.value = 'playing'
  travelProgress.value = 0
  currentSegmentIndex.value = 0
  pauseElapsed = 0
  lastVisitedIdx = -1
  emit('animation-start')
  hideOtherMarkers()
  drawAllArcs()
  addEmotionMarkers()
  createTraveler()
  fitMapToAllPoints()
  beginTravelAnimation()
}

function pauseAnimation() {
  phase.value = 'paused'
  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  if (animStartTime !== null) {
    pauseElapsed += performance.now() - animStartTime
    animStartTime = null
  }
}

function resumeAnimation() {
  if (phase.value !== 'paused') return
  phase.value = 'playing'
  animStartTime = null
  beginTravelAnimation()
}

function changeSpeed(newSpeed) {
  const oldSpeed = playbackSpeed.value
  if (newSpeed === oldSpeed) return

  // Recalculate pauseElapsed to maintain current progress position
  // at the new speed. Progress = pauseElapsed / totalDuration.
  // totalDuration = (BASE_DURATION / speed) * totalSegments
  // To keep same progress: newPauseElapsed / newTotalDuration = oldPauseElapsed / oldTotalDuration
  // So: newPauseElapsed = oldPauseElapsed * (oldSpeed / newSpeed)
  const allPaths = buildAllArcPaths()
  const totalSegments = allPaths.length
  if (totalSegments === 0) {
    playbackSpeed.value = newSpeed
    return
  }

  if (phase.value === 'paused') {
    pauseElapsed = pauseElapsed * (oldSpeed / newSpeed)
  } else if (phase.value === 'playing' && animStartTime !== null) {
    const nowElapsed = (performance.now() - animStartTime) + pauseElapsed
    pauseElapsed = nowElapsed * (oldSpeed / newSpeed)
    animStartTime = null
  }

  playbackSpeed.value = newSpeed

  // If was playing, restart animation loop with new speed
  if (phase.value === 'playing') {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
    beginTravelAnimation()
  }
}

function skipToEnd() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  travelProgress.value = 1
  currentSegmentIndex.value = stories.value.length - 1
  moveTravelerToProgress(1)
  // Flash all remaining markers
  emotionMarkers.forEach(m => {
    const el = m.getContent?.()
    if (el) el.classList.add('fp-flash')
  })
  endAnimation()
}

function replayAnimation() {
  clearAllOverlays()
  startAnimation()
}

function endAnimation() {
  phase.value = 'ended'
  travelProgress.value = 1
  currentSegmentIndex.value = stories.value.length - 1
  // Set pauseElapsed to match full progress so seekToProgress works correctly if user drags later
  const allPaths = buildAllArcPaths()
  const totalSegments = allPaths.length
  if (totalSegments > 0) {
    const totalDuration = (BASE_DURATION / playbackSpeed.value) * totalSegments
    pauseElapsed = totalDuration
  }
  animStartTime = null
  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  emit('animation-end')
  // Keep original markers hidden until user closes footprints
}

function handleClose() {
  cleanup()
  emit('close')
}

// --- Draw all arcs at once ---
function drawAllArcs() {
  const map = getMapInstance()
  if (!map || !window.AMap) return

  arcPolylines.forEach(p => map.remove(p))
  arcPolylines = []

  for (let i = 1; i < stories.value.length; i++) {
    const from = getStoryCoords(stories.value[i - 1])
    const to = getStoryCoords(stories.value[i])
    if (!from || !to) continue

    const path = generateArcPath(from, to)
    const color = pickArcColor(i - 1)

    const polyline = new window.AMap.Polyline({
      path,
      strokeColor: color,
      strokeWeight: props.isDark ? 3 : 2.5,
      strokeOpacity: props.isDark ? 0.75 : 0.6,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
      zIndex: 200,
    })
    map.add(polyline)
    arcPolylines.push(polyline)
  }
}

// --- Create glassmorphism emotion markers for user stories ---
function addEmotionMarkers() {
  const map = getMapInstance()
  if (!map || !window.AMap) return

  // Clear previous
  emotionMarkers.forEach(m => map.remove(m))
  emotionMarkers = []

  stories.value.forEach((story, idx) => {
    const coords = getStoryCoords(story)
    if (!coords) return

    const emotion = fromEmotionTag(story.emotionTag) || story.emotion
    const emotionColor = getEmotionColor(emotion) || '#667eea'
    const emoji = getEmotionEmoji(story.emotionTag || story.emotion) || '😊'
    const isDark = props.isDark

    // Unique ID for flash targeting
    const markerId = `fp-emotion-${idx}`

    const content = document.createElement('div')
    content.className = 'fp-emotion-marker'
    content.id = markerId
    content.dataset.idx = idx
    content.innerHTML = `
      <div class="fp-emotion-core" style="
        --emotion-color: ${emotionColor};
      ">
        <div class="fp-emotion-ring"></div>
        <div class="fp-emotion-ripple"></div>
        <span class="fp-emotion-emoji">${emoji}</span>
      </div>
    `

    // Apply dark mode if needed
    if (isDark) {
      content.classList.add('fp-emotion-dark')
    }

    const marker = new window.AMap.Marker({
      position: coords,
      content,
      offset: new window.AMap.Pixel(-20, -20),
      zIndex: 300,
    })

    marker._storyId = String(story.id)
    marker._markerId = markerId
    marker._storyIdx = idx

    marker.on('click', () => {
      emit('story-click', story)
    })

    map.add(marker)
    emotionMarkers.push(marker)
  })
}

// --- Trigger flash on a specific marker ---
function flashMarker(idx) {
  if (idx < 0 || idx >= emotionMarkers.length) return
  const marker = emotionMarkers[idx]
  const el = marker.getContent?.()
  if (!el) return

  // Remove then re-add class to re-trigger animation
  el.classList.remove('fp-flash')
  // Force reflow
  void el.offsetWidth
  el.classList.add('fp-flash')

  // Remove class after animation ends
  setTimeout(() => {
    el.classList.remove('fp-flash')
  }, 800)
}

// --- Create the traveling marker ---
function createTraveler() {
  const map = getMapInstance()
  if (!map || !window.AMap || stories.value.length === 0) return

  if (travelerMarker) {
    map.remove(travelerMarker)
    travelerMarker = null
  }

  const firstCoords = getStoryCoords(stories.value[0])
  if (!firstCoords) return

  const isDark = props.isDark
  const content = document.createElement('div')
  content.className = 'fp-traveler'
  content.innerHTML = `
    <div class="fp-traveler-dot" style="
      border: 2px solid ${isDark ? 'rgba(255,255,255,0.8)' : 'rgba(255,215,0,0.9)'};
    "></div>
  `

  travelerMarker = new window.AMap.Marker({
    position: firstCoords,
    content,
    offset: new window.AMap.Pixel(-9, -9),
    zIndex: 500,
  })
  map.add(travelerMarker)

  // Flash the first marker immediately (starting point)
  flashMarker(0)
  lastVisitedIdx = 0 // Already visited index 0; next flash will be at index 1 when we arrive
}

// --- Core travel animation ---
function beginTravelAnimation() {
  if (phase.value !== 'playing') return

  const allPaths = buildAllArcPaths()
  const totalSegments = allPaths.length

  if (totalSegments === 0) {
    endAnimation()
    return
  }

  const perSegmentDuration = BASE_DURATION / playbackSpeed.value
  const totalDuration = perSegmentDuration * totalSegments

  if (animStartTime === null) {
    animStartTime = performance.now()
  }

  function tick(now) {
    if (phase.value !== 'playing') return

    const elapsed = (now - animStartTime) + pauseElapsed
    const rawProgress = elapsed / totalDuration
    const progress = Math.min(rawProgress, 1)

    travelProgress.value = progress
    moveTravelerToProgress(progress, allPaths, totalSegments)

    if (progress < 1) {
      animFrameId = requestAnimationFrame(tick)
    } else {
      endAnimation()
    }
  }

  animFrameId = requestAnimationFrame(tick)
}

function moveTravelerToProgress(progress, allPaths, totalSegments) {
  const map = getMapInstance()
  if (!map || !travelerMarker) return

  if (!allPaths) {
    allPaths = buildAllArcPaths()
    totalSegments = allPaths.length
  }

  if (totalSegments === 0) return

  // Each segment gets equal time
  const segFloat = progress * totalSegments
  const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1)
  const segProgress = segFloat - segIdx

  // Current story index:
  //   segIdx 0 = path from story[0] → story[1]
  //   When segProgress is near 0, we're at story[segIdx] (departure point)
  //   When segProgress is near 1, we're at story[segIdx+1] (arrival point)
  const storyIdx = segProgress < 0.5 ? segIdx : segIdx + 1
  currentSegmentIndex.value = Math.min(storyIdx, stories.value.length - 1)

  // Flash when arriving at a story point (segProgress crosses ~0.9 threshold → we reached the end)
  const arrivalIdx = segIdx + 1
  if (arrivalIdx !== lastVisitedIdx && segProgress > 0.85 && arrivalIdx < stories.value.length) {
    flashMarker(arrivalIdx)
    lastVisitedIdx = arrivalIdx
  }

  const path = allPaths[segIdx]
  if (path) {
    const pos = getPointAlongPath(path, segProgress)
    if (pos) {
      travelerMarker.setPosition(pos)
      map.setCenter(pos, false, 200)

      // Dynamic zoom: adjust zoom level based on distance between current segment's two points
      adjustZoomForSegment(map, segIdx)
    }
  }

  if (progress >= 1) {
    const lastCoords = getStoryCoords(stories.value[stories.value.length - 1])
    if (lastCoords) {
      travelerMarker.setPosition(lastCoords)
      currentSegmentIndex.value = stories.value.length - 1
      map.setCenter(lastCoords, false, 200)
    }
  }
}

// --- Dynamic zoom based on distance between two points in a segment ---
function adjustZoomForSegment(map, segIdx) {
  if (segIdx < 0 || segIdx >= stories.value.length - 1) return

  const fromCoords = getStoryCoords(stories.value[segIdx])
  const toCoords = getStoryCoords(stories.value[segIdx + 1])
  if (!fromCoords || !toCoords) return

  // Calculate distance in degrees
  const dx = toCoords[0] - fromCoords[0]
  const dy = toCoords[1] - fromCoords[1]
  const distDeg = Math.sqrt(dx * dx + dy * dy)

  // Approximate distance in km (1 degree ≈ 111km, adjust for latitude)
  const avgLat = (fromCoords[1] + toCoords[1]) / 2
  const distKm = distDeg * 111 * Math.cos(avgLat * Math.PI / 180)

  // Map distance to zoom level:
  //   < 1km   → zoom 15 (very close, street level)
  //   1-5km   → zoom 13-14
  //   5-20km  → zoom 11-12
  //   20-100km → zoom 9-10
  //   100-500km → zoom 7-8
  //   > 500km  → zoom 5-6
  let targetZoom
  if (distKm < 0.5) {
    targetZoom = 16
  } else if (distKm < 1) {
    targetZoom = 15
  } else if (distKm < 3) {
    targetZoom = 14
  } else if (distKm < 8) {
    targetZoom = 13
  } else if (distKm < 20) {
    targetZoom = 12
  } else if (distKm < 50) {
    targetZoom = 11
  } else if (distKm < 100) {
    targetZoom = 10
  } else if (distKm < 300) {
    targetZoom = 8
  } else if (distKm < 800) {
    targetZoom = 7
  } else {
    targetZoom = 5
  }

  const currentZoom = map.getZoom()
  // Only adjust if difference is significant, to avoid jitter
  if (Math.abs(currentZoom - targetZoom) > 0.5) {
    map.setZoom(targetZoom, false, 400)
  }
}

// --- Fit map to show all points ---
function fitMapToAllPoints() {
  const map = getMapInstance()
  if (!map || !window.AMap || stories.value.length === 0) return

  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
  stories.value.forEach(story => {
    const coords = getStoryCoords(story)
    if (coords) {
      minLng = Math.min(minLng, coords[0])
      maxLng = Math.max(maxLng, coords[0])
      minLat = Math.min(minLat, coords[1])
      maxLat = Math.max(maxLat, coords[1])
    }
  })

  if (minLng === Infinity) return

  const bounds = new window.AMap.Bounds(
    new window.AMap.LngLat(minLng, minLat),
    new window.AMap.LngLat(maxLng, maxLat),
  )
  map.setBounds(bounds, false, [80, 80, 80, 80])
}

// --- Toggle all lines (after animation ended) ---
function toggleShowAllLines() {
  showAllLines.value = !showAllLines.value
  const map = getMapInstance()
  if (!map || !window.AMap) return

  if (showAllLines.value) {
    for (let i = 1; i < stories.value.length; i++) {
      const from = getStoryCoords(stories.value[i - 1])
      const to = getStoryCoords(stories.value[i])
      if (!from || !to) continue

      const path = generateArcPath(from, to)
      const color = pickArcColor(i - 1)

      const line = new window.AMap.Polyline({
        path,
        strokeColor: color,
        strokeWeight: props.isDark ? 2.5 : 2,
        strokeOpacity: props.isDark ? 0.6 : 0.45,
        strokeStyle: 'dashed',
        lineJoin: 'round',
        lineCap: 'round',
        zIndex: 150,
      })
      map.add(line)
      allLinesPolylines.push(line)
    }
  } else {
    allLinesPolylines.forEach(l => {
      if (map) map.remove(l)
    })
    allLinesPolylines = []
  }
}

// --- Hide/show ALL original map markers (including clusters) ---
function hideOtherMarkers() {
  const map = getMapInstance()
  if (!map) return
  const container = map.getContainer?.()
  if (!container) return

  container.classList.add('footprint-mode')
  footprintModeActive = true

  // Set up MutationObserver to re-add footprint-mode class if it gets removed
  // (e.g., when theme change triggers updateMarkers or rebuilds DOM)
  if (classObserver) classObserver.disconnect()
  classObserver = new MutationObserver(() => {
    if (!footprintModeActive) return
    // Re-add footprint-mode to the current container if it was removed
    const currentContainer = map.getContainer?.()
    if (currentContainer && !currentContainer.classList.contains('footprint-mode')) {
      currentContainer.classList.add('footprint-mode')
    }
  })
  classObserver.observe(container, {
    attributes: true,
    attributeFilter: ['class'],
  })

  // Also periodically check for container replacement (theme change may replace DOM)
  // This is a lightweight check that only runs while footprint mode is active
  startContainerWatch(map)
}

// Timer to watch for container replacement
let containerWatchTimer = null

function startContainerWatch(map) {
  stopContainerWatch()
  containerWatchTimer = setInterval(() => {
    if (!footprintModeActive) {
      stopContainerWatch()
      return
    }
    const container = map.getContainer?.()
    if (container && !container.classList.contains('footprint-mode')) {
      container.classList.add('footprint-mode')
      // Also re-observe the new container
      if (classObserver) classObserver.disconnect()
      classObserver.observe(container, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }
  }, 500)
}

function stopContainerWatch() {
  if (containerWatchTimer) {
    clearInterval(containerWatchTimer)
    containerWatchTimer = null
  }
}

function showAllMarkers() {
  footprintModeActive = false
  if (classObserver) {
    classObserver.disconnect()
    classObserver = null
  }
  stopContainerWatch()
  const map = getMapInstance()
  if (!map) return
  const container = map.getContainer?.()
  if (container) {
    container.classList.remove('footprint-mode')
  }
}

// --- Cleanup ---
function clearAllOverlays() {
  const map = getMapInstance()

  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }

  arcPolylines.forEach(p => { if (map) map.remove(p) })
  arcPolylines = []

  allLinesPolylines.forEach(l => { if (map) map.remove(l) })
  allLinesPolylines = []

  emotionMarkers.forEach(m => { if (map) map.remove(m) })
  emotionMarkers = []

  if (travelerMarker && map) {
    map.remove(travelerMarker)
    travelerMarker = null
  }

  showAllLines.value = false
  lastVisitedIdx = -1
}

function cleanup() {
  clearAllOverlays()
  showAllMarkers()
  phase.value = 'loading'
  travelProgress.value = 0
  currentSegmentIndex.value = 0
  pauseElapsed = 0
  animStartTime = null
  stories.value = []
}

// --- Helpers ---
function formatTime(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return ''
  }
}

// --- Progress bar dragging ---
function handleProgressInput(e) {
  const value = Number(e.target.value) / 1000
  seekToProgress(value)
}

function handleProgressDragStart() {
  isDraggingProgress.value = true
  if (phase.value === 'playing') {
    wasPlayingBeforeDrag.value = true
    pauseAnimation()
  } else if (phase.value === 'ended') {
    // Allow dragging in ended state — switch to paused
    wasPlayingBeforeDrag.value = false
    phase.value = 'paused'
  } else {
    wasPlayingBeforeDrag.value = false
  }
}

function handleProgressDragEnd() {
  isDraggingProgress.value = false
  if (wasPlayingBeforeDrag.value) {
    resumeAnimation()
  }
}

function seekToProgress(progress) {
  travelProgress.value = progress

  // Update segment index
  const allPaths = buildAllArcPaths()
  const totalSegments = allPaths.length
  if (totalSegments === 0) return

  const segFloat = progress * totalSegments
  const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1)
  const segProgress = segFloat - segIdx
  const storyIdx = segProgress < 0.5 ? segIdx : segIdx + 1
  currentSegmentIndex.value = Math.min(storyIdx, stories.value.length - 1)

  // Move traveler to new position
  const map = getMapInstance()
  if (!map || !travelerMarker) return

  const path = allPaths[segIdx]
  if (path) {
    const pos = getPointAlongPath(path, segProgress)
    if (pos) {
      travelerMarker.setPosition(pos)
      map.setCenter(pos, false, 200)
      adjustZoomForSegment(map, segIdx)
    }
  }

  if (progress >= 1) {
    const lastCoords = getStoryCoords(stories.value[stories.value.length - 1])
    if (lastCoords) {
      travelerMarker.setPosition(lastCoords)
      currentSegmentIndex.value = stories.value.length - 1
      map.setCenter(lastCoords, false, 200)
    }
  }

  // Recalculate pauseElapsed to match new progress
  const perSegmentDuration = BASE_DURATION / playbackSpeed.value
  const totalDuration = perSegmentDuration * totalSegments
  pauseElapsed = progress * totalDuration
  animStartTime = null
}

function handleStoryCardClick() {
  if (currentStory.value) {
    emit('story-click', currentStory.value)
  }
}

// Keyboard support
function handleKeydown(e) {
  if (!props.visible) return
  if (e.key === 'Escape') {
    handleClose()
  } else if (e.key === ' ' && phase.value === 'playing') {
    e.preventDefault()
    pauseAnimation()
  } else if (e.key === ' ' && phase.value === 'paused') {
    e.preventDefault()
    resumeAnimation()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}

onUnmounted(() => {
  cleanup()
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
/* ─── Design tokens (light: warm bronze-gold / dark: cool blue-violet) ─── */
.footprints-overlay {
  --panel-bg: linear-gradient(160deg, rgba(250, 239, 217, 0.96) 0%, rgba(240, 223, 191, 0.98) 56%, rgba(229, 206, 166, 0.98) 100%);
  --panel-border: rgba(184, 135, 46, 0.46);
  --panel-strong: #4d2f14;
  --panel-muted: rgba(77, 47, 20, 0.74);
  --panel-soft: rgba(91, 58, 25, 0.1);
  --panel-soft-strong: rgba(125, 84, 37, 0.18);
  --panel-shadow: rgba(71, 43, 17, 0.18);
  --accent: #b36e2d;
  --accent-strong: #8e4d15;
  --accent-soft: rgba(179, 110, 45, 0.14);

  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: min(560px, calc(100vw - 32px));
  background: var(--panel-bg);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-radius: 28px;
  border: 1px solid var(--panel-border);
  box-shadow:
    0 20px 40px -24px var(--panel-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  padding: 20px 24px;
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--panel-strong);
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.footprints-overlay::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 22px;
  border: 1px solid rgba(199, 151, 60, 0.18);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.08) 0%, transparent 24%),
    linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.03) 48%, transparent 100%);
  pointer-events: none;
}

/* ─── Dark theme ─── */
.footprints-dark.footprints-overlay {
  --panel-bg: linear-gradient(160deg, rgba(20, 27, 48, 0.98) 0%, rgba(28, 40, 68, 0.98) 58%, rgba(36, 53, 88, 0.98) 100%);
  --panel-border: rgba(144, 177, 236, 0.24);
  --panel-strong: #edf3ff;
  --panel-muted: rgba(228, 238, 255, 0.78);
  --panel-soft: rgba(131, 164, 224, 0.12);
  --panel-soft-strong: rgba(131, 164, 224, 0.2);
  --panel-shadow: rgba(7, 12, 26, 0.32);
  --accent: #8fb4ff;
  --accent-strong: #c6dbff;
  --accent-soft: rgba(143, 180, 255, 0.14);
}

.footprints-dark.footprints-overlay::before {
  border-color: rgba(141, 176, 235, 0.14);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.06) 0%, transparent 24%),
    linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.03) 48%, transparent 100%);
}

/* ─── Header ─── */
.footprints-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.footprints-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--panel-strong);
  letter-spacing: 0.02em;
}

.footprints-icon { font-size: 20px; }

.footprints-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: var(--panel-soft);
  color: var(--panel-strong);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.22s ease;
}

.footprints-close-btn:hover {
  background: var(--panel-soft-strong);
  transform: translateY(-1px);
}

/* ─── Progress ─── */
.footprints-progress {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
}
.progress-text { margin-bottom: 8px; }

.progress-label {
  font-size: 13px;
  color: var(--panel-muted);
  font-weight: 500;
}

.progress-bar-track {
  height: 5px;
  background: var(--panel-soft);
  border-radius: 3px;
  overflow: visible;
  position: relative;
  cursor: pointer;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-strong));
  border-radius: 3px;
  transition: width 0.1s linear;
  pointer-events: none;
}

.progress-bar-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fffdf8;
  border: 2.5px solid var(--accent);
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px var(--panel-shadow);
  pointer-events: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  z-index: 2;
}

.progress-bar-thumb.thumb-active {
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 4px 14px var(--accent);
}

.footprints-dark .progress-bar-thumb {
  background: #1e1e3a;
  border-color: var(--accent);
}

.progress-bar-input {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 22px;
  transform: translateY(-50%);
  opacity: 0;
  cursor: pointer;
  margin: 0;
  z-index: 3;
}

.progress-bar-input:disabled {
  cursor: default;
}

/* ─── Controls ─── */
.footprints-controls {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: var(--panel-soft);
  color: var(--panel-strong);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
  white-space: nowrap;
}

.ctrl-btn:hover {
  background: var(--panel-soft-strong);
  transform: translateY(-1px);
}

.ctrl-btn.active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-strong);
  box-shadow: 0 12px 22px -18px var(--accent);
}

.ctrl-primary {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
  color: #fffdf8;
  box-shadow: 0 14px 26px -18px var(--accent);
}

.ctrl-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px -18px var(--accent);
}

.ctrl-icon { font-size: 14px; line-height: 1; }

.speed-selector {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.speed-btn {
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: var(--panel-soft);
  color: var(--panel-muted);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s ease;
}

.speed-btn.active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-strong);
  box-shadow: 0 12px 22px -18px var(--accent);
}

.speed-btn:hover {
  background: var(--panel-soft-strong);
  transform: translateY(-1px);
}

/* ─── Story card ─── */
.footprints-story-card {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.18) 0%, transparent 100%),
    var(--panel-soft);
  border-radius: 20px;
  border: 1px solid var(--panel-border);
  box-shadow: 0 4px 16px -8px var(--panel-shadow);
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.footprints-story-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px -18px var(--accent);
}

.story-card-emotion {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border-left: 3px solid;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.story-card-body { flex: 1; min-width: 0; }

.story-card-content {
  font-size: 13.5px;
  color: var(--panel-strong);
  line-height: 1.5;
  margin: 0 0 6px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-card-meta {
  display: flex;
  gap: 12px;
  font-size: 11.5px;
  color: var(--panel-muted);
}

.story-card-location {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Empty state ─── */
.footprints-empty {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 24px 0 8px;
}

.empty-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 10px;
  opacity: 0.6;
}

.footprints-empty p {
  margin: 0;
  color: var(--panel-muted);
  font-size: 14px;
}

.empty-hint {
  font-size: 12px !important;
  margin-top: 4px !important;
  opacity: 0.7;
}

/* ─── Transitions ─── */
.footprint-fade-enter-active,
.footprint-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.footprint-fade-enter-from,
.footprint-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}

.story-card-slide-enter-active,
.story-card-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.story-card-slide-enter-from,
.story-card-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

<style>
/* ============================================
   Global styles — footprint mode marker hiding
   ============================================ */

/* Hide ALL original map markers & clusters during footprint mode */
.footprint-mode .custom-marker,
.footprint-mode .cluster-marker,
.footprint-mode .amap-marker-content > div:not(.fp-emotion-marker):not(.fp-traveler) {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 0.4s ease;
}

/* ============================================
   Glassmorphism Emotion Marker
   ============================================ */
.fp-emotion-marker {
  position: relative;
  width: 40px;
  height: 40px;
}

.fp-emotion-core {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Glassmorphism */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(255, 255, 255, 0.18) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(12px) saturate(1.6);
  -webkit-backdrop-filter: blur(12px) saturate(1.6);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.6),
    0 0 0 1px var(--emotion-color, #667eea);
  animation: fp-emotion-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  animation-delay: calc(var(--appear-delay, 0) * 1ms);
}

/* Dark mode glassmorphism */
.fp-emotion-dark .fp-emotion-core {
  background: linear-gradient(
    135deg,
    rgba(30, 30, 60, 0.65) 0%,
    rgba(20, 20, 50, 0.35) 50%,
    rgba(15, 15, 40, 0.2) 100%
  );
  border-color: rgba(143, 180, 255, 0.2);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(143, 180, 255, 0.15),
    0 0 0 1px var(--emotion-color, #8fb4ff);
}

.fp-emotion-emoji {
  font-size: 18px;
  line-height: 1;
  z-index: 2;
  position: relative;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

/* Subtle color ring around the glassmorphism circle */
.fp-emotion-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid var(--emotion-color, #667eea);
  opacity: 0.5;
  animation: fp-ring-breathe 3s ease-in-out infinite;
}

.fp-emotion-dark .fp-emotion-ring {
  opacity: 0.35;
}

/* Ripple halo */
.fp-emotion-ripple {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px solid var(--emotion-color, #667eea);
  opacity: 0;
  animation: fp-ripple-out 3s ease-out infinite;
}

.fp-emotion-dark .fp-emotion-ripple {
  border-color: var(--emotion-color, #8fb4ff);
}

/* ---- Flash animation when traveler arrives ---- */
.fp-emotion-marker.fp-flash .fp-emotion-core {
  animation: fp-flash-burst 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards !important;
}

.fp-emotion-marker.fp-flash .fp-emotion-ring {
  animation: fp-flash-ring 0.7s ease-out forwards !important;
}

.fp-emotion-marker.fp-flash .fp-emotion-ripple {
  animation:
    fp-ripple-flash-1 0.7s ease-out forwards,
    fp-ripple-flash-2 0.7s 0.1s ease-out forwards !important;
}

/* ============================================
   Traveler dot
   ============================================ */
.fp-traveler {
  pointer-events: none;
}

.fp-traveler-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff 30%, #FFD700 70%);
  box-shadow:
    0 0 16px rgba(255, 215, 0, 0.6),
    0 0 32px rgba(255, 215, 0, 0.3);
  animation: fp-traveler-pulse 1.2s ease-in-out infinite;
}

/* ============================================
   Keyframes
   ============================================ */
@keyframes fp-emotion-appear {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fp-ring-breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.2;
  }
}

@keyframes fp-ripple-out {
  0% {
    transform: scale(0.85);
    opacity: 0.3;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

/* Flash burst - the core scales up and glows intensely */
@keyframes fp-flash-burst {
  0% {
    transform: scale(1);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.08),
      inset 0 1px 1px rgba(255, 255, 255, 0.6),
      0 0 0 1px var(--emotion-color, #667eea);
  }
  30% {
    transform: scale(1.35);
    box-shadow:
      0 0 28px color-mix(in srgb, var(--emotion-color, #667eea) 50%, transparent),
      0 0 56px color-mix(in srgb, var(--emotion-color, #667eea) 25%, transparent),
      inset 0 1px 1px rgba(255, 255, 255, 0.8),
      0 0 0 3px var(--emotion-color, #667eea);
  }
  100% {
    transform: scale(1);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.08),
      inset 0 1px 1px rgba(255, 255, 255, 0.6),
      0 0 0 1px var(--emotion-color, #667eea);
  }
}

/* Flash ring - expands and fades */
@keyframes fp-flash-ring {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

/* Flash ripple - two expanding rings */
@keyframes fp-ripple-flash-1 {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
    border-width: 3px;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
    border-width: 1px;
  }
}

@keyframes fp-ripple-flash-2 {
  0% {
    transform: scale(1);
    opacity: 0.6;
    border-width: 2px;
  }
  100% {
    transform: scale(3);
    opacity: 0;
    border-width: 0.5px;
  }
}

@keyframes fp-traveler-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 16px rgba(255, 215, 0, 0.6), 0 0 32px rgba(255, 215, 0, 0.3);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 24px rgba(255, 215, 0, 0.8), 0 0 48px rgba(255, 215, 0, 0.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fp-emotion-core,
  .fp-emotion-ring,
  .fp-emotion-ripple,
  .fp-traveler-dot {
    animation: none !important;
  }
}
</style>
