import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

/**
 * 动态高度虚拟滚动 Composable
 *
 * 用法：
 *   const { containerRef, totalHeight, visibleItems, scrollToBottom } =
 *     useVirtualScroll({ itemList, estimatedHeight: 180 })
 *
 *   模板中：
 *     <div ref="containerRef" style="position:relative;overflow-y:auto">
 *       <div :style="{ height: totalHeight + 'px' }" />
 *       <div v-for="item in visibleItems" :key="item.data.id"
 *            :style="{ position:'absolute', top:item.top+'px', width:'100%' }">
 *         ...渲染内容...
 *       </div>
 *     </div>
 */
export function useVirtualScroll({
  itemList,
  estimatedHeight = 160,
  bufferCount = 3,
  gap = 0, // 项之间的间距（px）
  onNearBottom,
}) {
  const containerRef = ref(null)

  // 每项的已测量/估计高度缓存：Map<index, height>
  const itemHeights = ref(new Map())
  // 每项的 Y 偏移量缓存：Map<index, offsetTop>
  const itemOffsets = ref(new Map())

  const scrollTop = ref(0)
  const containerHeight = ref(0)

  // 计算总高度
  const totalHeight = computed(() => {
    const list = itemList.value
    if (!list || list.length === 0) return 0
    const lastIdx = list.length - 1
    // 最后一项不需要额外间距：offset(最后一项) + 内容高度
    return getItemOffset(lastIdx) + (itemHeights.value.get(lastIdx) ?? estimatedHeight)
  })

  // 获取某一项的高度（含间距，优先用实测值，否则用估计值）
  function getItemOccupiedSpace(index) {
    return (itemHeights.value.get(index) ?? estimatedHeight) + gap
  }

  // 获取某一项的顶部偏移（带缓存）
  // 第一项 top=0（无前导间距），后续每项累加前一项的高度+间距
  function getItemOffset(index) {
    const cached = itemOffsets.value.get(index)
    if (cached !== undefined) return cached

    if (index === 0) {
      itemOffsets.value.set(0, 0)
      return 0
    }

    // 从前一项的已知偏移开始累加
    let prevOffset = getItemOffset(index - 1)
    const offset = prevOffset + getItemOccupiedSpace(index - 1)
    itemOffsets.value.set(index, offset)
    return offset
  }

  // 当某项高度更新后，使后续所有偏移失效
  function invalidateOffsetsFrom(startIndex) {
    const map = itemOffsets.value
    // 创建新 Map 以触发响应式更新
    const newMap = new Map()
    for (const [k, v] of map) {
      if (k < startIndex) newMap.set(k, v)
    }
    itemOffsets.value = newMap
  }

  // 根据当前 scrollTop 计算可见范围
  const visibleItems = computed(() => {
    const list = itemList.value
    if (!list || list.length === 0) return []
    
    // 使用实际容器高度，未测量时用估计值兜底（避免连接前返回空）
    const ch = containerHeight.value > 0 ? containerHeight.value : estimatedHeight * 5
    const st = scrollTop.value
    const start = Math.max(0, st - estimatedHeight * bufferCount)
    const end = ch + estimatedHeight * (bufferCount + 1)

    const result = []
    let foundFirst = false

    for (let i = 0; i < list.length; i++) {
      const top = getItemOffset(i)
      const h = getItemOccupiedSpace(i)
      const bottom = top + h

      if (bottom > start && top < end) {
        result.push({ data: list[i], index: i, top })
        foundFirst = true
      } else if (foundFirst && top >= end) {
        break
      }
    }

    return result
  })

  // 二分查找：找到 scrollTop 对应的第一个可见项索引
  function findStartIndex(targetScroll) {
    const list = itemList.value
    if (!list || list.length === 0) return 0
    let lo = 0
    let hi = list.length - 1
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      const offset = getItemOffset(mid)
      const h = getItemOccupiedSpace(mid)
      if (offset + h <= targetScroll) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }
    return Math.max(0, lo - 1)
  }

  // 更新滚动信息并检查是否需要加载更多
  function updateScrollInfo() {
    const el = containerRef.value
    if (!el) return

    scrollTop.value = el.scrollTop
    containerHeight.value = el.clientHeight

    // 触发加载更多回调
    if (onNearBottom && itemList.value?.length > 0) {
      const threshold = 120 // 距底部多少像素时触发
      const distToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      if (distToBottom < threshold) {
        onNearBottom()
      }
    }
  }

  // 注册某项的实际高度
  function registerItemHeight(index, el) {
    if (!el) return
    const h = el.offsetHeight
    if (h <= 0) return

    const oldH = itemHeights.value.get(index)
    if (oldH !== h) {
      // 高度变化了，更新缓存并使后续偏移失效
      const newMap = new Map(itemHeights.value)
      newMap.set(index, h)
      itemHeights.value = newMap

      invalidateOffsetsFrom(index)
    }
  }

  // 批量注册（供 ResizeObserver 使用）
  const pendingMeasurements = new Set()

  function scheduleMeasure(index, el) {
    if (!el) return
    pendingMeasurements.add({ index, el })
  }

  function flushMeasurements() {
    let changed = false
    const newMap = new Map(itemHeights.value)
    for (const { index, el } of pendingMeasurements) {
      const h = el.offsetHeight
      if (h > 0) {
        const oldH = itemHeights.value.get(index)
        if (oldH !== h) {
          changed = true
          newMap.set(index, h)
          invalidateOffsetsFrom(index)
        }
      }
    }
    if (changed) itemHeights.value = newMap
    pendingMeasurements.clear()
    return changed
  }

  // 滚动事件处理（节流）
  let rafId = null
  function onScroll() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      rafId = null
      updateScrollInfo()
    })
  }

  // 监听容器挂载
  let resizeObserver = null
  let connected = false

  function connect() {
    if (connected || !containerRef.value) return
    connected = true

    const el = containerRef.value
    containerHeight.value = el.clientHeight
    scrollTop.value = el.scrollTop

    el.addEventListener('scroll', onScroll, { passive: true })

    // 容器尺寸变化时重新计算
    resizeObserver = new ResizeObserver(() => {
      if (containerRef.value) {
        containerHeight.value = containerRef.value.clientHeight
      }
    })
    resizeObserver.observe(el)
  }

  function disconnect() {
    if (!connected) return
    connected = false

    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', onScroll)
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  // 当数据列表重置时清除高度缓存
  watch(itemList, (newList, oldList) => {
    if (!newList || newList.length === 0) {
      itemHeights.value = new Map()
      itemOffsets.value = new Map()
      return
    }
    // 如果是刷新操作（长度变小），清除缓存以避免残留
    if (oldList && newList.length < oldList.length) {
      itemHeights.value = new Map()
      itemOffsets.value = new Map()
    }
  }, { flush: 'post' })

  // 组件卸载时清理
  onUnmounted(() => {
    disconnect()
  })

  // 滚动到底部
  function scrollToBottom() {
    nextTick(() => {
      const el = containerRef.value
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      }
    })
  }

  // 滚动到指定项
  function scrollToIndex(index) {
    nextTick(() => {
      const el = containerRef.value
      if (!el) return
      const targetOffset = getItemOffset(index)
      el.scrollTo({ top: targetOffset, behavior: 'smooth' })
    })
  }

  return {
    containerRef,
    totalHeight,
    visibleItems,
    registerItemHeight,
    scheduleMeasure,
    flushMeasurements,
    connect,
    disconnect,
    scrollToBottom,
    scrollToIndex,
    // 暴露给调试使用
    getItemOccupiedSpace,
    getItemOffset,
  }
}
