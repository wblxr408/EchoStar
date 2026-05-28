<template>
  <div class="map-page" :class="{ 'search-blur': anyPanelOpen }" @click="handlePageClick">
    <transition name="welcome-fade">
      <div v-if="showWelcomeOverlay" class="welcome-overlay" @click.stop>
        <div class="welcome-overlay__sky" aria-hidden="true">
          <div class="welcome-overlay__nebula"></div>
          <div class="welcome-overlay__stars"></div>
        </div>
        <div ref="welcomeContentRef" class="welcome-content">
          <p
            ref="welcomeTextRef"
            class="welcome-text"
            :style="{ '--welcome-text-scale': welcomeTextScale }"
          >
            {{ currentWelcomeQuote }}
          </p>
        </div>
      </div>
      </transition>

    <!-- 搜索框 -->
    <div v-show="!isAdjustingPlanePosition" class="map-search-bar" :class="{ dark: effectiveMapTheme === 'dark' }" @click.stop>
      <div class="map-search-input-wrap">
        <svg class="map-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="searchKeyword"
          class="map-search-input"
          type="text"
          placeholder="搜索故事/用户/地点"
          @keydown.enter="handleSearchSubmit"
          @focus="searchFocused = true"
        />
        <button v-if="searchKeyword" class="map-search-clear" @click="clearSearch()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- 搜索结果面板 -->
    <div
      v-show="!isAdjustingPlanePosition && showMapFilterPanel"
      class="map-filter-bar"
      :class="{ dark: effectiveMapTheme === 'dark' }"
      @click.stop
    >
      <div class="map-filter-bar__row">
        <div class="map-filter-group">
          <span class="map-filter-label">按心情</span>
          <div class="map-filter-chip-list">
            <button
              class="map-filter-chip"
              :class="{ active: activeEmotionFilter === 'all' }"
              @click="setEmotionFilter('all')"
            >
              全部
            </button>
            <button
              v-for="emotion in emotionFilterOptions"
              :key="emotion.value"
              class="map-filter-chip"
              :class="{ active: activeEmotionFilter === emotion.value }"
              @click="setEmotionFilter(emotion.value)"
            >
              {{ emotion.icon }} {{ emotion.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="map-filter-bar__row map-filter-bar__row--secondary">
        <div class="map-filter-group">
          <span class="map-filter-label">按时间</span>
          <div class="map-filter-chip-list">
            <button
              v-for="preset in timeFilterOptions"
              :key="preset.key"
              class="map-filter-chip"
              :class="{ active: activeTimePreset === preset.key }"
              @click="applyTimePreset(preset.key)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <div class="map-filter-date-range">
          <input
            v-model="mapFilterStartDate"
            class="map-filter-date-input"
            type="date"
            @change="handleMapFilterDateChange"
          />
          <span class="map-filter-date-sep">至</span>
          <input
            v-model="mapFilterEndDate"
            class="map-filter-date-input"
            type="date"
            @change="handleMapFilterDateChange"
          />
        </div>

        <button
          v-if="isUserMapFilterActive"
          class="map-filter-reset"
          @click="clearMapFilters"
        >
          清空筛选
        </button>
      </div>

      <div
        v-if="mapFilterStatusText || isSystemDisplayLimitEnabled"
        class="map-filter-status"
      >
        <span v-if="mapFilterStatusText">{{ mapFilterStatusText }}</span>
        <span
          v-if="isSystemDisplayLimitEnabled"
          class="map-filter-status__badge"
        >
          当前缩放最多显示 {{ defaultMapVisibleEntityLimit }} 个点位
        </span>
      </div>
    </div>

    <transition name="search-panel-fade">
      <div
        v-if="showSearchPanel"
        class="map-search-results"
        :class="{ dark: effectiveMapTheme === 'dark' }"
        @click.stop
      >
        <!-- 标签页切换 -->
        <div class="search-tabs">
          <button class="search-tab" :class="{ active: searchTab === 'story' }" @click="switchSearchTab('story')">故事</button>
          <button class="search-tab" :class="{ active: searchTab === 'user' }" @click="switchSearchTab('user')">用户</button>
          <button class="search-tab" :class="{ active: searchTab === 'place' }" @click="switchSearchTab('place')">地点</button>
        </div>

        <!-- 故事标签页 -->
        <div ref="searchVScrollContainerRef" v-if="searchTab === 'story'" class="map-search-results-list">
          <div v-if="searchLoading" class="map-search-empty">搜索中...</div>
          <div v-else-if="searchKeyword.trim() && !searchStorySearched" class="map-search-empty">搜索中...</div>
          <div v-else-if="searchKeyword.trim() && searchResults.length === 0" class="map-search-empty">未找到相关故事</div>
          <div v-else-if="!searchKeyword.trim()" class="map-search-empty">输入关键词搜索故事</div>
          <template v-else>
            <div class="vscroll-spacer" :style="{ height: searchVScrollTotalHeight + 'px' }"></div>
            <div
              v-for="item in searchVScrollVisibleItems"
              :key="item.data.id + '-search-' + searchAnimationKey"
              ref="searchVScrollItemRefs"
              :data-search-story-index="item.index"
              class="map-search-card panel-item vscroll-item story-card-enter"
              :class="{ 'is-vip-card': item.data.author?.vip }"
              :style="{ position: 'absolute', top: item.top + 'px', left: '0', right: '0', animationDelay: item.index * 0.12 + 's' }"
              @click="openStoryFromCollection(item.data)"
            >
              <div class="item-header">
                <img :src="item.data.avatar" class="item-avatar" alt="头像" />
                <div class="item-meta">
                  <span class="vip-name-row"><span class="item-author vip-username" :class="{ 'has-vip': item.data.author?.vip }">{{ item.data.author?.username || item.data.username || '匿名用户' }}</span><span class="vip-text-badge-sm" v-if="item.data.author?.vip">VIP</span></span>
                  <span class="item-time">{{ formatRelativeTime(item.data.createdAt) }}&ensp;&ensp;📍 {{ item.data.locationName || '' }}</span>
                </div>
              </div>
              <p class="item-content" :style="getItemContentStyle(item.data)">{{ item.data.content }}</p>
              <div v-if="item.data.images?.length" class="item-images"><img :src="item.data.images[0]" alt="配图" /></div>
              <div class="item-footer">
                <span class="item-likes">👁 {{ item.data.viewCount ?? 0 }}</span>
              </div>
            </div>
            <div v-if="searchLoadingMore" class="map-search-empty">加载更多...</div>
            <div v-if="!searchHasMore && searchResults.length > 0" class="map-search-empty">没有更多了</div>
          </template>
        </div>

        <!-- 地点标签页 -->
        <div v-if="searchTab === 'place'" class="map-search-results-list">
          <div v-if="searchPlaceLoading" class="map-search-empty">搜索地点中...</div>
          <div v-else-if="searchKeyword.trim() && !searchPlaceSearched" class="map-search-empty">搜索地点中...</div>
          <div v-else-if="searchPlaceError" class="map-search-empty">{{ searchPlaceError }}</div>
          <div v-else-if="searchKeyword.trim() && searchPlaceResults.length === 0" class="map-search-empty">未找到相关地点</div>
          <div v-else-if="!searchKeyword.trim()" class="map-search-empty">输入地点名称搜索</div>
          <template v-else>
            <div
              v-for="(poi, idx) in searchPlaceResults"
              :key="poi.id || idx"
              class="search-place-item panel-item"
              @click.stop="handlePlaceSelect(poi)"
            >
              <div class="search-place-icon">📍</div>
              <div class="search-place-info">
                <div class="search-place-name">{{ poi.name }}</div>
                <div class="search-place-addr">{{ poi.address || poi.cityname || '' }}</div>
              </div>
              <div v-if="poi.distance" class="search-place-dist">{{ formatDistance(poi.distance) }}</div>
            </div>
          </template>
        </div>

        <!-- 用户标签页 -->
        <div ref="userSearchVScrollContainerRef" v-else-if="searchTab === 'user'" class="map-search-results-list">
          <div v-if="searchUserLoading" class="map-search-empty">搜索中...</div>
          <div v-else-if="searchKeyword.trim() && !searchUserSearched" class="map-search-empty">搜索中...</div>
          <div v-else-if="!searchKeyword.trim()" class="map-search-empty">输入用户名或ID搜索用户</div>
          <div v-else-if="searchUserResults.length === 0" class="map-search-empty">未找到相关用户</div>
          <template v-else>
            <div class="vscroll-spacer" :style="{ height: userSearchVScrollTotalHeight + 'px' }"></div>
            <div
              v-for="item in userSearchVScrollVisibleItems"
              :key="item.data.id + '-usersearch-' + searchAnimationKey"
              ref="userSearchVScrollItemRefs"
              :data-search-user-index="item.index"
              class="search-user-card vscroll-item story-card-enter"
              :class="{ 'is-vip-card': item.data.vip }"
              :style="{ position: 'absolute', top: item.top + 'px', left: '0', right: '0', animationDelay: item.index * 0.12 + 's' }"
              @click="openUserDetail(item.data)"
            >
              <div class="search-user-card__avatar">
                <img :src="item.data.avatar || 'https://picsum.photos/80/80?random=1'" alt="用户头像" />
              </div>
              <div class="search-user-card__info">
                <div class="search-user-card__name-row">
                  <span class="vip-name-row"><span class="search-user-card__name vip-username" :class="{ 'has-vip': item.data.vip }">{{ item.data.username || '未设置' }}</span><span class="vip-text-badge-sm" v-if="item.data.vip">VIP</span></span>
                </div>
                <div class="search-user-card__id">STAR-ID: {{ item.data.id }}</div>
              </div>
              <svg class="search-user-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div v-if="searchUserLoadingMore" class="map-search-empty">加载更多...</div>
            <div v-if="!searchUserHasMore && searchUserResults.length > 0" class="map-search-empty">没有更多了</div>
          </template>
        </div>
      </div>
      </transition>

    <!-- 用户详情弹窗 -->
    <Teleport to="body">
      <transition name="publish-modal">
        <div v-if="searchUserDetailOpen && searchedUser" class="search-user-modal-shell" :class="{ 'has-profile-search': userDetailSearchActive }" @click.self="closeUserDetail">
        <!-- 左侧搜索结果面板 -->
        <transition name="profile-search-panel">
          <div v-if="userDetailSearchActive" class="profile-search-panel" :class="{ dark: effectiveMapTheme === 'dark' }">
            <div class="profile-search-header">
              <h3>{{ searchedUser.username || '该用户' }}的含有"{{ userDetailSearchQuery }}"关键词的作品 <span class="profile-search-count" v-if="userDetailSearchResults.length">({{ userDetailSearchResults.length }})</span></h3>
            </div>
            <div ref="userDetailSearchVScrollContainerRef" class="profile-search-list">
              <div v-if="userDetailSearchResults.length === 0" class="panel-empty">
                <span class="empty-icon">🔍</span><span>没有找到匹配的故事</span>
              </div>
              <template v-else>
                <div class="vscroll-spacer" :style="{ height: userDetailSearchVScrollTotalHeight + 'px' }"></div>
                <div
                  v-for="item in userDetailSearchVScrollVisibleItems"
                  :key="item.data.id + '-search-' + searchAnimationKey"
                  ref="userDetailSearchVScrollItemRefs"
                  :data-virtual-index="item.index"
                  class="panel-item vscroll-item story-card-enter"
                  :class="{ 'is-vip-card': searchedUser.vip }"
                  :style="{ position: 'absolute', top: item.top + 'px', left: '0', right: '0', animationDelay: item.index * 0.12 + 's' }"
                  @click="openStoryFromCollection(item.data)"
                >
                  <div class="item-header">
                    <img :src="searchedUser.avatar || 'https://picsum.photos/80/80?random=1'" class="item-avatar" alt="头像" />
                    <div class="item-meta">
                      <span class="vip-name-row"><span class="item-author vip-username" :class="{ 'has-vip': searchedUser.vip }">{{ searchedUser.username || '匿名用户' }}</span><span class="vip-text-badge-sm" v-if="searchedUser.vip">VIP</span></span>
                      <span class="item-time">{{ formatRelativeTime(item.data.createdAt) }}</span>
                    </div>
                  </div>
                  <p class="item-content" :style="getItemContentStyle(item.data)">{{ item.data.content }}</p>
                  <div v-if="item.data.images?.length" class="item-images"><img :src="item.data.images[0]" alt="配图" /></div>
                  <div class="item-footer">
                    <span class="item-likes">❤️ {{ item.data.likeCount ?? item.data.likes ?? 0 }}</span>
                    <span class="item-likes">⭐️ {{ item.data.favoriteCount ?? 0 }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </transition>
        <div class="map-search-user-detail" :class="{ dark: effectiveMapTheme === 'dark' }">
          <div class="user-sidebar-header">
            <h3>个人信息</h3>
            <button class="close-btn" @click.stop="closeUserDetail">
              <span>×</span>
            </button>
          </div>
          <div class="user-sidebar-content">
            <div class="search-user-profile">
              <!-- 头像 + 用户名/ID -->
              <div class="user-profile-new">
                <div class="user-avatar-wrapper">
                  <div class="user-avatar-large">
                    <img :src="searchedUser.avatar || 'https://picsum.photos/80/80?random=1'" alt="用户头像" />
                  </div>
                </div>
                <div class="user-identity-area">
                  <div class="user-identity-top">
                    <div class="user-name-row">
                      <span class="vip-text-badge" v-if="searchedUser.vip">VIP</span>
                      <span class="user-display-name" :class="{ 'has-vip': searchedUser.vip }">{{ searchedUser.username || '未设置' }}</span>
                    </div>
                    <div class="user-star-id">STAR-ID: {{ searchedUser.id ?? '' }}</div>
                  </div>
                </div>
              </div>

              <!-- 签名 -->
              <div class="user-bio-area search-user-bio" :class="{ 'vip-bio': searchedUser.vip }">
                <div class="bio-content">
                  <span class="bio-text" :style="getBioFontStyle(searchedUser.bioFontFamily, searchedUser.bioFontEffect)">{{ searchedUser.bio || '这个人很懒，什么都没有写~' }}</span>
                </div>
              </div>

              <!-- 搜索框 -->
              <div class="profile-search-input-wrapper">
                <input ref="userDetailSearchInputRef" v-model="userDetailSearchQuery" placeholder="搜索TA的作品" class="profile-search-input" @focus="userDetailSearchActive = true" @blur="handleUserDetailSearchBlur" />
                <button v-if="userDetailSearchQuery" class="search-clear-btn" @click.stop="userDetailSearchQuery = ''; userDetailSearchInputRef?.focus()">×</button>
              </div>

              <!-- 标签栏 -->
              <div class="user-content-tabs-wrapper">
                <div class="user-content-tabs">
                  <button class="content-tab active">作品<span class="tab-count">{{ searchedUserStories.length }}</span></button>
                </div>
              </div>

              <!-- 故事列表 -->
              <div ref="userDetailVScrollContainerRef" class="user-content-list" @scroll="handleProfileScroll">
                <div v-if="searchedUserStories.length === 0" class="panel-empty">
                  <span class="empty-icon">📝</span><span>还没有发布任何故事</span>
                </div>
                <template v-else>
                  <div class="vscroll-spacer" :style="{ height: userDetailVScrollTotalHeight + 'px' }"></div>
                  <div
                    v-for="item in userDetailVScrollVisibleItems"
                    :key="item.data.id + '-detail-' + searchAnimationKey"
                    ref="userDetailVScrollItemRefs"
                    :data-virtual-index="item.index"
                    class="panel-item vscroll-item story-card-enter"
                    :class="{ 'is-vip-card': searchedUser.vip }"
                    :style="{ position: 'absolute', top: item.top + 'px', left: '0', right: '0', animationDelay: item.index * 0.07 + 's' }"
                    @click="openStoryFromCollection(item.data)"
                  >
                    <div class="item-header">
                      <img :src="searchedUser.avatar || 'https://picsum.photos/80/80?random=1'" class="item-avatar" alt="头像" />
                      <div class="item-meta">
                        <span class="vip-name-row"><span class="item-author vip-username" :class="{ 'has-vip': searchedUser.vip }">{{ searchedUser.username || '匿名用户' }}</span><span class="vip-text-badge-sm" v-if="searchedUser.vip">VIP</span></span>
                        <span class="item-time">{{ formatRelativeTime(item.data.createdAt) }}</span>
                      </div>
                    </div>
                    <p class="item-content" :style="getItemContentStyle(item.data)">{{ item.data.content }}</p>
                    <div v-if="item.data.images?.length" class="item-images"><img :src="item.data.images[0]" alt="配图" /></div>
                    <div class="item-footer">
                      <span class="item-likes">❤️ {{ item.data.likeCount ?? item.data.likes ?? 0 }}</span>
                      <span class="item-likes">⭐️ {{ item.data.favoriteCount ?? 0 }}</span>
                    </div>
                  </div>
                  <div v-if="searchedUserStories.length > 0" class="panel-no-more"><span>没有更多了</span></div>
                </template>
              </div>
              <transition name="back-to-top">
                <button
                  v-if="showProfileBackToTop"
                  class="wall-back-to-top profile-back-to-top"
                  :class="{ dark: effectiveMapTheme === 'dark' }"
                  @click="scrollProfileToTop(userDetailVScrollContainerRef)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 19V6" />
                    <path d="M6.5 11.5 12 6l5.5 5.5" />
                    <path d="M8 4h8" />
                  </svg>
                </button>
              </transition>
            </div>
          </div>
          <!-- 返回顶部按钮 (他人主页) -->
        </div>
      </div>
      </transition>
    </Teleport>

    <div class="map-container">
      <AMap
        ref="amapRef"
        :stories="mapStore.stories"
        :clusters="clusters"
        :system-limit-enabled="isSystemDisplayLimitEnabled"
        :max-visible-entities="defaultMapVisibleEntityLimit"
        :user-location="mapStore.userLocation"
        :center="mapStore.center"
        :zoom="mapStore.zoom"
        :theme="effectiveMapTheme"
        :point-pick-mode="isMapPointPickMode"
        :temp-picked-location="activeTempPickedLocation"
        :paper-plane-position="planePosition"
        @marker-click="handleMarkerClick"
        @map-click="handlePublishMapClick"
        @map-move="handleMapMove"
        @cluster-click="handleClusterClick"
        @theme-change="handleThemeChange"
        @paper-plane-click="handlePaperPlaneClick"
        @paper-plane-hover="handlePaperPlaneHover"
        @paper-plane-leave="handlePaperPlaneLeave"
        @paper-plane-move="handlePaperPlaneMove"
      />
    </div>

    <button
      v-show="!isAdjustingPlanePosition"
      class="locate-btn"
      :class="{ dark: effectiveMapTheme === 'dark' }"
      title="回到我的位置"
      aria-label="回到我的位置"
      @click.stop="handleLocate"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
      </svg>
    </button>

    <ClusterPopover
      v-if="showClusterPopover"
      :visible="showClusterPopover"
      :stories="clusterPopoverStories"
      :map-theme="effectiveMapTheme"
      @close="showClusterPopover = false"
      @select-story="openStoryFromCollection"
      @preview-image="handlePreviewImage"
    />

    <ImageLightbox
      :visible="showLightbox"

      :images="lightboxImages"
      :initial-index="lightboxInitialIndex"
      @close="showLightbox = false"
    />

    <MyFootprints
      :visible="showFootprints"
      :is-dark="effectiveMapTheme === 'dark'"
      :map-ref="amapRef"
      :story-detail-open="!!selectedStory && showFootprints"
      @close="showFootprints = false"
      @story-click="handleStoryClick"
    />

    <!-- VIP Center -->
    <VipCenter
      :visible="showVipCenter"
      :is-dark="effectiveMapTheme === 'dark'"
      :high-z-index="vipCenterFromStory"
      @close="showVipCenter = false; showCommentSettings = false; commentSettingsFromStory = false; vipCenterFromStory = false; fontPickerFromStory = false; showFontPicker = false"
      @open-polish="showToast('在我的故事中点击擦亮按钮即可使用')"
      @open-comment-settings="showFontPicker = false; fontPickerFromStory = false; commentSettingsFromStory = vipCenterFromStory; showCommentSettings = !showCommentSettings"
      @open-visual="showVipCenter = false; showVisualCustomizer = true"
      @open-footprints="showVipCenter = false; showUserSidebar = false; handleFootprints()"
      @open-fonts="showCommentSettings = false; commentSettingsFromStory = false; fontPickerFromStory = vipCenterFromStory; showFontPicker = !showFontPicker"
    />

    <!-- Font Picker -->
    <FontPicker
      :visible="showFontPicker"
      :is-dark="effectiveMapTheme === 'dark'"
      :high-z-index="fontPickerFromStory"
      @close="showFontPicker = false; fontPickerFromStory = false"
    />

    <!-- Coin Center -->
    <CoinCenter
      :visible="showCoinCenter"
      :is-dark="effectiveMapTheme === 'dark'"
      @close="showCoinCenter = false"
    />

    <!-- Comment Settings -->
    <CommentSettings
      :visible="showCommentSettings"
      :is-dark="effectiveMapTheme === 'dark'"
      :high-z-index="commentSettingsFromStory"
      @close="handleCommentSettingsClose"
      @request-vip="vipCenterFromStory = commentSettingsFromStory; showCommentSettings = false; commentSettingsFromStory = false; showVipCenter = true"
      @saved="handleCommentSettingsSaved"
    />

    <!-- Visual Customizer -->
    <VisualCustomizer
      :visible="showVisualCustomizer"
      :is-dark="effectiveMapTheme === 'dark'"
      @close="showVisualCustomizer = false"
      @request-vip="showVisualCustomizer = false; showVipCenter = true"
      @saved="handleVisualCustomizerSaved"
    />

    <transition name="publish-modal">
      <div
        v-if="showSidebar"
        class="story-modal-shell"
        @click.self="closeStoryPanel"
      >
        <div
          class="story-sidebar"
          :class="{
            'show-sidebar': showSidebar,
            dark: effectiveMapTheme === 'dark',
          }"
          @click.stop
        >
          <div class="sidebar-header">
            <div class="sidebar-tabs">
              <button
                class="tab-btn"
                :class="{ active: sidebarTab === 'featured' }"
                @click="sidebarTab = 'featured'"
              >
                精选推荐
              </button>
              <button
                class="tab-btn"
                :class="{ active: sidebarTab === 'recommend' }"
                @click="sidebarTab = 'recommend'"
              >
                为你推荐
              </button>
            </div>
            <button class="close-btn" @click.stop="closeStoryPanel">
              <span>×</span>
            </button>
          </div>

          <div ref="sidebarContentRef" class="sidebar-content" @scroll="handleWallScroll($event, sidebarTab)">
            <!-- 精选推荐 - Grid 卡片 -->
            <div v-show="sidebarTab === 'featured'" class="wall-tab-scroll">
              <div v-if="wallTabs.featured.loading" class="loading">加载中...</div>
              <div v-else-if="wallTabs.featured.error" class="empty">
                <p>{{ wallTabs.featured.error }}</p>
              </div>
              <div v-else-if="wallTabs.featured.items.length === 0" class="empty">
                <p>暂无精选内容</p>
                <p class="hint">管理员会定期挑选优质内容展示在这里</p>
              </div>
              <div v-else class="story-wall-grid">
                <StoryWallCard
                  v-for="(story, idx) in wallTabs.featured.items"
                  :key="story.id + '-wall-featured-' + idx"
                  :story="story"
                  :theme="effectiveMapTheme"
                  :class="['story-card-enter', { 'no-anim-delay': idx >= 18 }]"
                  :data-virtual-index="idx"
                  :style="{ animationDelay: idx < 18 ? idx * 0.12 + 's' : '0s' }"
                  @select="handleWallCardSelect"
                />
              </div>
              <div v-if="wallTabs.featured.loadingMore" class="wall-loading-more">加载中...</div>
              <div v-else-if="!wallTabs.featured.hasMore && wallTabs.featured.items.length > 0" class="wall-loading-more">没有更多了</div>
            </div>

            <!-- 为你推荐 - Grid 卡片 -->
            <div v-show="sidebarTab === 'recommend'" class="wall-tab-scroll">
              <div v-if="wallTabs.recommend.loading" class="loading">加载中...</div>
              <div v-else-if="wallTabs.recommend.error" class="empty">
                <p>{{ wallTabs.recommend.error }}</p>
              </div>
              <div v-else-if="wallTabs.recommend.items.length === 0" class="empty">
                <p>暂无推荐内容</p>
                <p class="hint">发布故事或点赞更多内容，会为你推荐更懂你的故事</p>
              </div>
              <div v-else class="story-wall-grid">
                <StoryWallCard
                  v-for="(story, idx) in wallTabs.recommend.items"
                  :key="story.id + '-wall-recommend-' + idx"
                  :story="story"
                  :theme="effectiveMapTheme"
                  :class="['story-card-enter', { 'no-anim-delay': idx >= 18 }]"
                  :data-virtual-index="idx"
                  :style="{ animationDelay: idx < 18 ? idx * 0.12 + 's' : '0s' }"
                  @select="handleWallCardSelect"
                />
              </div>
              <div v-if="wallTabs.recommend.loadingMore" class="wall-loading-more">加载中...</div>
              <div v-else-if="!wallTabs.recommend.hasMore && wallTabs.recommend.items.length > 0" class="wall-loading-more">没有更多了</div>
            </div>
          </div>
          <!-- 返回顶部按钮 -->
          <transition name="back-to-top">
            <button
              v-if="showWallBackToTop"
              class="wall-back-to-top"
              :class="{ dark: effectiveMapTheme === 'dark' }"
              @click="scrollWallToTop"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 19V6" />
                <path d="M6.5 11.5 12 6l5.5 5.5" />
                <path d="M8 4h8" />
              </svg>
            </button>
          </transition>
        </div>
      </div>
      </transition>

    <!-- 纸飞机附近故事面板 -->
    <transition name="publish-modal">
      <div
        v-if="showPlaneNearby"
        class="story-modal-shell"
        @click.self="closePlaneNearby"
      >
        <div
          class="plane-nearby-sidebar"
          :class="{ dark: effectiveMapTheme === 'dark' }"
          @click.stop
        >
          <div class="plane-nearby-header">
            <div class="plane-nearby-header__left">
              <h3>附近故事</h3>
            </div>
            <button class="close-btn" @click.stop="closePlaneNearby">
              <span>×</span>
            </button>
          </div>
          <div ref="planeNearbyContentRef" class="plane-nearby-content" @scroll="handlePlaneNearbyScroll($event)">
            <div v-if="planeNearbyLoading && !planeNearbyInitialDone" class="loading">加载中...</div>
            <div v-else-if="planeNearbyError" class="empty">
              <p>{{ planeNearbyError }}</p>
            </div>
            <div v-else-if="planeNearbyItems.length === 0 && planeNearbyInitialDone" class="empty">
              <p>附近暂无故事</p>
              <p class="hint">换个位置试试？</p>
            </div>
            <template v-else>
              <div class="story-wall-grid">
                <StoryWallCard
                  v-for="(story, idx) in planeNearbyItems"
                  :key="story.id + '-plane-nearby-' + idx"
                  :story="story"
                  :theme="effectiveMapTheme"
                  :class="['story-card-enter', { 'no-anim-delay': idx >= 18 }]"
                  :data-virtual-index="idx"
                  :style="{ animationDelay: idx < 18 ? idx * 0.12 + 's' : '0s' }"
                  @select="openStoryFromCollection(story)"
                />
              </div>
              <div v-if="planeNearbyLoadingMore" class="wall-loading-more">加载中...</div>
              <div v-else-if="!planeNearbyHasMore && planeNearbyItems.length > 0" class="wall-loading-more">没有更多了</div>
            </template>
          </div>
          <!-- 返回顶部按钮 -->
          <transition name="back-to-top">
            <button
              v-if="showPlaneNearbyBackToTop"
              class="wall-back-to-top"
              :class="{ dark: effectiveMapTheme === 'dark' }"
              @click="scrollPlaneNearbyToTop"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 19V6" />
                <path d="M6.5 11.5 12 6l5.5 5.5" />
                <path d="M8 4h8" />
              </svg>
            </button>
          </transition>
        </div>
      </div>
    </transition>

    <button
      v-show="!isAdjustingPlanePosition"
      class="map-filter-toggle"
      :class="{ dark: effectiveMapTheme === 'dark', active: showMapFilterPanel }"
      type="button"
      title="地图筛选"
      aria-label="地图筛选"
      @click.stop="toggleMapFilterPanel"
    >
      <span class="map-filter-toggle__icon">⌘</span>
      <span class="map-filter-toggle__text">
        {{ showMapFilterPanel ? "收起筛选" : "地图筛选" }}
      </span>
    </button>

    <div
      v-show="!isAdjustingPlanePosition"
      :class="[
        'dock-container',
        effectiveMapTheme === 'dark' ? 'dock-dark' : 'dock-light',
        { 'dock-vip-theme': isVipTheme, 'poker-mode': usePokerTheme },
        {
          'show-publish-sidebar': showPublishSidebar,
          'show-dock-publish-sidebar': showDockPublishSidebar,
          'show-user-sidebar': showUserSidebar,
          expanded: isDockExpanded,
          locked: isPickingPublishLocation || isPickingDockPublishLocation,
        },
      ]"
      @click.stop
    >
      <button
        class="dock-main"
        :class="{ expanded: isDockExpanded }"
        :disabled="isPickingPublishLocation"
        type="button"
        @click.stop="toggleDock"
      >
        <span class="dock-main-symbol">{{ isDockExpanded ? "✦" : "☰" }}</span>
        <span class="dock-main-text">{{
          isDockExpanded ? "收起卡组" : "功能卡组"
        }}</span>
      </button>

      <div
        ref="dockMenuRef"
        class="dock-menu"
        :class="{ expanded: isDockExpanded }"
      >
        <div
          ref="dockCardStackRef"
          class="dock-card-stack"
          :class="{
            'selected-state': Boolean(selectedDockCard),
            'selection-motion': Boolean(
              selectedDockCard ||
              drawingDockCard ||
              liftingDockCard ||
              returningDockCard,
            ),
          }"
          :style="getDockStackStyle(visibleDockActions.length)"
          @mousemove="handleDockStackPointerMove"
          @mouseleave="scheduleClearDockHover"
        >
          <div
            class="dock-card-info"
            :class="{ visible: isDockExpanded }"
            :style="getDockInfoStyle(visibleDockActions.length)"
          >
            <template v-if="activeDockAction">
              <p class="dock-card-info-kicker">{{ activeDockAction.tag }}</p>
              <h4>{{ activeDockAction.title }}</h4>
              <p>{{ activeDockAction.description }}</p>
            </template>
            <template v-else>
              <p class="dock-card-info-kicker">Card Select</p>
              <h4>功能卡组</h4>
              <p>
                把鼠标停在卡牌上，像卡牌游戏选牌一样查看功能，再点击执行原有操作。
              </p>
            </template>
          </div>

          <template
            v-for="(action, index) in visibleDockActions"
            :key="action.key"
          >
            <span
              v-if="shouldRenderDockAnchor(action.key)"
              class="dock-card-placeholder"
              :class="{
                'dock-card-hitbox-disabled':
                  action.key === themeSelectorCardKey &&
                  themeDockSubmenuVisible,
              }"
              :style="
                getDockPlaceholderStyle(index, visibleDockActions.length, action)
              "
              aria-hidden="true"
              @mouseenter="setDockHover(action.key)"
              @mouseleave="scheduleClearDockHover"
              @click.stop="handleDockCardClick(action)"
            ></span>

            <span
              v-if="shouldRenderDockAnchor(action.key)"
              class="dock-card-anchor"
              :class="{
                'dock-card-hitbox-disabled':
                  action.key === themeSelectorCardKey &&
                  themeDockSubmenuVisible,
              }"
              :style="
                getDockAnchorStyle(index, visibleDockActions.length, action)
              "
              aria-hidden="true"
              @mouseenter="setDockHover(action.key)"
              @mouseleave="scheduleClearDockHover"
              @click.stop="handleDockCardClick(action)"
            ></span>

            <component
              :is="action.key === themeSelectorCardKey ? 'div' : 'button'"
              class="dock-card"
              :class="{
                drawing: drawingDockCard === action.key,
                lifting: liftingDockCard === action.key,
                active: selectedDockCard === action.key,
                returning: returningDockCard === action.key,
                disabled: action.disabled,
                rippling: ripplingDockCard === action.key,
                selector: action.key === themeSelectorCardKey,
              }"
              :style="
                getDockCardStyle(index, visibleDockActions.length, action)
              "
              :disabled="
                action.key === themeSelectorCardKey
                  ? undefined
                  : action.disabled || isPickingPublishLocation
              "
              :title="action.title"
              :type="action.key === themeSelectorCardKey ? undefined : 'button'"
              @mouseenter="setDockHover(action.key)"
              @mouseleave="scheduleClearDockHover"
              @click.stop="handleDockCardClick(action)"
            >
              <div class="dock-card-body">
                <!-- ── 经典主题 ── -->
                <template v-if="!usePokerTheme">
                <span class="dock-card-suit suit-top">{{ action.suit }}</span>
                <span class="dock-card-order">{{ String(index + 1).padStart(2, "0") }}</span>
                <span class="dock-card-corner corner-top-right"></span>
                <span class="dock-card-corner corner-bottom-left"></span>
                <div
                  class="dock-card-face"
                  :class="{ 'dock-card-face--theme-selector': action.key === themeSelectorCardKey && themeDockSubmenuVisible }"
                >
                  <span class="dock-card-pattern"></span>
                  <template v-if="action.key === themeSelectorCardKey && themeDockSubmenuVisible">
                    <div class="dock-theme-inline">
                      <p class="dock-theme-inline__eyebrow">Theme Select</p>
                      <strong class="dock-theme-inline__title">切换主题</strong>
                      <div class="dock-theme-inline__list">
                        <button
                          v-for="option in dockThemeOptions"
                          :key="option.key"
                          type="button"
                          class="dock-theme-inline-option"
                          :class="{ active: isThemeOptionActive(option), disabled: option.disabled }"
                          :style="{ '--theme-option-accent': option.accent, '--theme-option-accent-soft': option.accentSoft }"
                          :disabled="option.disabled"
                          :title="option.tooltip"
                          @click.stop.prevent="handleThemeOptionClick(option)"
                        >
                          <div class="dock-theme-inline-option__row">
                            <span class="dock-theme-inline-option__icon">{{ option.icon }}</span>
                            <span class="dock-theme-inline-option__label">{{ option.label }}</span>
                          </div>
                          <small class="dock-theme-inline-option__meta">{{ option.helper }}</small>
                        </button>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <span class="dock-card-icon">{{ action.icon }}</span>
                    <span class="dock-card-title">{{ action.title }}</span>
                    <span class="dock-card-subtitle">{{ action.subtitle }}</span>
                  </template>
                </div>
                <span class="dock-card-suit suit-bottom">{{ action.suit }}</span>
                </template>

                <!-- ── 扑克主题 ── -->
                <template v-else>
                  <span class="poker-corner poker-corner--tr">
                    <span class="poker-corner__value">{{ action.cornerValue }}</span>
                    <span class="poker-corner__suit" :class="{ 'suit-red': action.suit === '♥' || action.suit === '♦' }">{{ action.suit }}</span>
                  </span>
                  <span class="poker-corner poker-corner--bl">
                    <span class="poker-corner__value">{{ action.cornerValue }}</span>
                    <span class="poker-corner__suit" :class="{ 'suit-red': action.suit === '♥' || action.suit === '♦' }">{{ action.suit }}</span>
                  </span>
                  <div
                    class="dock-card-face"
                    :class="{ 'dock-card-face--theme-selector': action.key === themeSelectorCardKey && themeDockSubmenuVisible }"
                  >
                    <span v-if="action.cornerValue === 'K'" class="poker-figure" aria-hidden="true">♛</span>
                    <span v-else-if="action.cornerValue === 'Q'" class="poker-figure" aria-hidden="true">♕</span>
                    <span v-else-if="action.cornerValue === 'J'" class="poker-figure" aria-hidden="true">♞</span>
                    <template v-if="action.key === themeSelectorCardKey && themeDockSubmenuVisible">
                      <div class="dock-theme-inline">
                        <p class="dock-theme-inline__eyebrow">Theme Select</p>
                        <strong class="dock-theme-inline__title">切换主题</strong>
                        <div class="dock-theme-inline__list">
                          <button
                            v-for="option in dockThemeOptions"
                            :key="option.key"
                            type="button"
                            class="dock-theme-inline-option"
                            :class="{ active: isThemeOptionActive(option), disabled: option.disabled }"
                            :style="{ '--theme-option-accent': option.accent, '--theme-option-accent-soft': option.accentSoft }"
                            :disabled="option.disabled"
                            :title="option.tooltip"
                            @click.stop.prevent="handleThemeOptionClick(option)"
                          >
                            <div class="dock-theme-inline-option__row">
                              <span class="dock-theme-inline-option__icon">{{ option.icon }}</span>
                              <span class="dock-theme-inline-option__label">{{ option.label }}</span>
                            </div>
                            <small class="dock-theme-inline-option__meta">{{ option.helper }}</small>
                          </button>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <span class="poker-center-icon">{{ action.icon }}</span>
                      <span class="poker-center-title">{{ action.title }}</span>
                    </template>
                  </div>
                </template>
              </div>
              <span class="dock-card-ripple"></span>
            </component>
          </template>
        </div>
      </div>
    </div>

    <ClusterPopover
      v-if="showClusterPopover"
      :visible="showClusterPopover"
      :stories="clusterPopoverStories"
      :map-theme="effectiveMapTheme"
      @close="showClusterPopover = false"
      @select-story="openStoryFromCollection"
      @preview-image="handlePreviewImage"
    />

    <ImageLightbox
      :visible="showLightbox"

      :images="lightboxImages"
      :initial-index="lightboxInitialIndex"
      @close="showLightbox = false"
    />

    <div
        v-show="showPublishSidebar"
        class="publish-modal-shell"
        :class="{ 'pick-mode': isPickingPublishLocation }"
        @click.self="closePublishPanel"
      >
        <div
          class="publish-modal"
          :class="{
            dark: effectiveMapTheme === 'dark',
            collapsed: isPickingPublishLocation,
          }"
          @click.stop
        >
          <button
            v-if="isPickingPublishLocation"
            type="button"
            class="publish-pick-dock"
            @click="restorePublishPanelFromPick"
          >
            <span class="pick-dock-handle"></span>
            <strong>地图选点中</strong>
            <span>点击这里恢复发布卡，并默认取消选点</span>
          </button>

          <template v-else>
            <button
              class="publish-modal-close"
              type="button"
              @click="closePublishPanel"
            >
              <span class="close-icon">×</span>
              <span class="close-text">关闭</span>
            </button>
            <div class="publish-modal-scroll">
              <PublishForm
                :visible="showPublishSidebar"
                :plane-position="planePosition"
                :map-center="mapStore.center"
                :user-location="mapStore.userLocation"
                :map-theme="effectiveMapTheme"
                :prefill-query="publishPrefillQuery"
                @submit="handlePublishSubmit"
                @cancel="closePublishPanel"
                @adjust-plane-position="handleAdjustPlanePosition"
                @request-vip="showVipCenter = true"
              />
            </div>
          </template>
        </div>

        <div
          v-if="publishPickPrompt"
          class="publish-pick-confirm"
          :style="getPublishPickPromptStyle(publishPickPrompt)"
          @click.stop
        >
          <p>是否在这附近搜索？</p>
          <div class="publish-pick-confirm-actions">
            <button
              type="button"
              class="confirm-btn"
              @click="confirmPublishNearbySearch"
            >
              是
            </button>
            <button
              type="button"
              class="cancel-btn"
              @click="rejectPublishNearbySearch"
            >
              否
            </button>
          </div>
        </div>
      </div>

    <!-- 功能卡组发布故事面板（旧版独立） -->
      <div
        v-show="showDockPublishSidebar"
        class="publish-modal-shell"
        :class="{ 'pick-mode': isPickingDockPublishLocation }"
        @click.self="closeDockPublishPanel"
      >
        <div
          class="publish-modal"
          :class="{
            dark: effectiveMapTheme === 'dark',
            collapsed: isPickingDockPublishLocation,
          }"
          @click.stop
        >
          <button
            v-if="isPickingDockPublishLocation"
            type="button"
            class="publish-pick-dock"
            @click="restoreDockPublishPanelFromPick"
          >
            <span class="pick-dock-handle"></span>
            <strong>地图选点中</strong>
            <span>点击这里恢复发布卡，并默认取消选点</span>
          </button>

          <template v-else>
            <button
              class="publish-modal-close"
              type="button"
              @click="closeDockPublishPanel"
            >
              <span class="close-icon">×</span>
              <span class="close-text">关闭</span>
            </button>
            <div class="publish-modal-scroll">
              <PublishFormDock
                :visible="showDockPublishSidebar"
                :map-center="mapStore.center"
                :user-location="mapStore.userLocation"
                :suggested-locations="dockPublishSuggestedLocations"
                :picked-map-location="dockPublishPickedLocation"
                :is-picking-location="isPickingDockPublishLocation"
                :map-theme="effectiveMapTheme"
                @submit="handleDockPublishSubmit"
                @cancel="closeDockPublishPanel"
                @request-vip="showVipCenter = true"
                @request-map-pick="startDockPublishMapPick"
                @cancel-map-pick="cancelDockPublishMapPick"
              />
            </div>
          </template>
        </div>

        <div
          v-if="isDockPublishPickPrompt"
          class="publish-pick-confirm"
          :style="getDockPublishPickPromptStyle(isDockPublishPickPrompt)"
          @click.stop
        >
          <p>是否在这附近搜索？</p>
          <div class="publish-pick-confirm-actions">
            <button
              type="button"
              class="confirm-btn"
              @click="confirmDockPublishNearbySearch"
            >
              是
            </button>
            <button
              type="button"
              class="cancel-btn"
              @click="rejectDockPublishNearbySearch"
            >
              否
            </button>
          </div>
        </div>
      </div>

    <!-- 调整纸飞机位置模式 - 底部提示栏 -->
    <transition name="adjust-overlay-fade">
      <div v-if="isAdjustingPlanePosition" class="adjust-plane-overlay">
        <button
          type="button"
          class="publish-pick-dock adjust-plane-dock"
          @click="restorePublishPanelFromAdjustPlane"
        >
          <span class="pick-dock-handle"></span>
          <strong>点击地图上的某个位置来更新纸飞机位置</strong>
          <span>或者点击这里回到发布页面</span>
        </button>
      </div>
    </transition>

    <!-- 调整纸飞机位置 - 确认弹窗（独立于发布面板，不受 showPublishSidebar 控制） -->
    <div
      v-if="publishPickPrompt && isAdjustingPlanePosition"
      class="publish-pick-confirm"
      :style="getPublishPickPromptStyle(publishPickPrompt)"
      @click.stop
    >
      <p>是否在这附近搜索？</p>
      <div class="publish-pick-confirm-actions">
        <button
          type="button"
          class="confirm-btn"
          @click="confirmPublishNearbySearch"
        >
          是
        </button>
        <button
          type="button"
          class="cancel-btn"
          @click="rejectPublishNearbySearch"
        >
          否
        </button>
      </div>
    </div>

    <transition name="publish-modal">
      <div v-if="showUserSidebar" class="user-modal-shell" :class="{ 'has-profile-search': myProfileSearchActive }">
        <!-- 左侧搜索结果面板 -->
        <transition name="profile-search-panel">
          <div v-if="myProfileSearchActive" class="profile-search-panel" :class="{ dark: effectiveMapTheme === 'dark' }">
            <div class="profile-search-header">
              <h3>含有"{{ myProfileSearchQuery }}"关键词的{{ userContentTab === 'likes' ? '点赞故事' : userContentTab === 'favorites' ? '收藏故事' : '作品' }} <span class="profile-search-count" v-if="myProfileSearchResults.length">({{ myProfileSearchResults.length }})</span></h3>
            </div>
            <div ref="myProfileSearchVScrollContainerRef" class="profile-search-list">
              <div v-if="myProfileSearchResults.length === 0" class="panel-empty">
                <span class="empty-icon">🔍</span><span>没有找到匹配的故事</span>
              </div>
              <template v-else>
                <div class="vscroll-spacer" :style="{ height: myProfileSearchVScrollTotalHeight + 'px' }"></div>
                <div
                  v-for="item in myProfileSearchVScrollVisibleItems"
                  :key="item.data.id + '-mysearch-' + storyCardAnimationKey"
                  ref="myProfileSearchVScrollItemRefs"
                  :data-virtual-index="item.index"
                  class="panel-item vscroll-item story-card-enter"
                  :class="{ 'is-vip-card': getStoryAuthorVip(item.data) }"
                  :style="{ position: 'absolute', top: item.top + 'px', left: '0', right: '0', animationDelay: item.index * 0.12 + 's' }"
                  @click="handleStoryClick(item.data)"
                >
                  <div class="item-header">
                    <img :src="item.data.avatar" class="item-avatar" alt="头像" />
                    <div class="item-meta">
                      <span class="vip-name-row"><span class="item-author vip-username" :class="{ 'has-vip': getStoryAuthorVip(item.data) }">{{ getStoryAuthorName(item.data) }}</span><span class="vip-text-badge-sm" v-if="getStoryAuthorVip(item.data)">VIP</span></span>
                      <span class="item-time">{{ formatRelativeTime(item.data.createdAt) }}&ensp;&ensp;📍 {{ getStoryLocationText(item.data) }}</span>
                    </div>
                  </div>
                  <p class="item-content" :style="getItemContentStyle(item.data)">{{ item.data.content }}</p>
                  <div v-if="item.data.images?.length" class="item-images"><img :src="item.data.images[0]" alt="配图" /></div>
                  <div class="item-footer">
                    <span class="item-likes">❤️ {{ item.data.likeCount ?? item.data.likes ?? 0 }}</span>
                    <span class="item-likes">⭐️ {{ item.data.favoriteCount ?? 0 }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </transition>
        <div
          class="user-sidebar"
          :class="{
            'show-sidebar': showUserSidebar,
            dark: effectiveMapTheme === 'dark',
          }"
        >
          <div class="user-sidebar-header">
            <h3>个人信息</h3>
            <button class="close-btn" @click.stop="closeUserPanel">
              <span>×</span>
            </button>
          </div>

          <div
            v-if="!userStore.isLoggedIn || userStore.isGuest"
            class="user-sidebar-content"
          >
            <div class="guest-profile">
              <div class="guest-avatar">
                <span>👤</span>
              </div>
              <div class="guest-info">
                <h4>{{ userStore.isGuest ? "游客用户" : "未登录" }}</h4>
                <p>
                  {{
                    userStore.isGuest
                      ? "登录后可体验完整功能"
                      : "请登录以使用完整功能"
                  }}
                </p>
              </div>
            </div>
            <div class="guest-actions">
              <button
                class="guest-action-btn login-btn"
                @click="handleGuestLoginClick"
              >
                <span class="btn-icon">🔑</span>
                <span class="btn-text">{{
                  userStore.isGuest ? "登录账号" : "登录"
                }}</span>
              </button>
              <button
                v-if="!userStore.isLoggedIn"
                class="guest-action-btn guest-btn"
                @click="handleEnterGuestMode"
              >
                <span class="btn-icon">🚶</span>
                <span class="btn-text">游客体验</span>
              </button>
              <button
                v-if="userStore.isGuest"
                class="guest-action-btn logout-btn"
                @click="handleGuestLogout"
              >
                <span class="btn-icon">🚪</span>
                <span class="btn-text">退出</span>
              </button>
            </div>
          </div>

          <div v-else class="user-sidebar-content">
            <!-- 头像 + 用户名/ID栏 -->
            <div class="user-profile-new">
              <div class="user-avatar-wrapper">
                <div class="user-avatar-large" @click="triggerAvatarUpload">
                  <img
                    :src="
                      avatarPreview ||
                      userStore.user?.avatar ||
                      'https://picsum.photos/80/80?random=1'
                    "
                    alt="用户头像"
                  />
                  <div class="avatar-overlay">
                    <span class="avatar-edit-icon">📷</span>
                    <span class="avatar-edit-text">更换头像</span>
                  </div>
                </div>
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleAvatarChange"
                />
                <div v-if="avatarUploading" class="avatar-upload-status">
                  <span class="upload-spinner">⌛</span>
                  <span>上传中...</span>
                </div>
                <div v-if="avatarError" class="avatar-error">
                  {{ avatarError }}
                </div>
              </div>

              <div class="user-identity-area">
                <div class="user-identity-top">
                  <div class="user-name-row">
                    <span
                      v-if="userStore.user?.vip"
                      class="vip-text-badge"
                      style="cursor: pointer;"
                      title="VIP 中心"
                      @click="showVipCenter = true"
                    >VIP</span>
                    <span
                      v-else
                      class="vip-text-badge vip-text-badge--inactive"
                      style="cursor: pointer;"
                      title="开通 VIP"
                      @click="showVipCenter = true"
                    >👑 开通</span>
                    <span class="user-display-name" :class="{ 'has-vip': userStore.user?.vip }">{{
                      userStore.user?.username || userStore.user?.name || "未设置"
                    }}</span>
                    <button
                      class="icon-edit-btn"
                      title="编辑资料"
                      @click="handleOpenEditProfile"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                  <div class="user-star-id">STAR-ID: {{ userStore.user?.id ?? "" }}</div>
                </div>
                <button class="wallet-inline-btn" @click="showCoinCenter = true">
                  <span class="wallet-inline-btn__icon">🪙</span>
                  <span class="wallet-inline-btn__label">我的情绪币</span>
                  <span>{{ vipStore.emotionCoins || 0 }}</span>
                </button>
                <div class="user-identity-actions">
                  <button class="switch-account-btn" @click="handleSwitchAccount">
                    切换账号
                  </button>
                  <button class="logout-inline-btn" @click="handleLogout">
                    退出
                  </button>
                </div>
              </div>
            </div>

            <!-- Bio 签名区域 -->
            <div class="user-bio-area" :class="{ 'vip-bio': userStore.user?.vip }" @click="startEditBio">
              <div class="bio-content">
                <span v-if="editingBioInline" class="bio-input-wrap">
                  <textarea
                    ref="bioInputRef"
                    v-model="bioDraft"
                    maxlength="200"
                    rows="3"
                    @click.stop
                    @keyup.esc="cancelEditBio"
                    @keydown.enter.exact.prevent="saveBioInline"
                    @blur="handleBioBlur"
                    :style="getBioFontStyle(bioFontFamily || readBioFontFromCookie(), bioFontEffect || readBioFontEffectFromCookie())"
                  ></textarea>
                  <span class="bio-char-count">{{ bioDraft.length }}/200</span>
                  <div class="inline-font-row" @click.stop>
                    <button type="button" class="btn-comment-bg"
                      :class="{ 'btn-comment-bg--locked': !vipStore.isVipActive }"
                      @mousedown.prevent="bioFontBtnMousedown = true"
                      @click.stop="bioFontBtnMousedown = false; vipStore.isVipActive ? (showBioFontPicker = !showBioFontPicker) : (showVipCenter = true)">
                      {{ vipStore.isVipActive ? '🔤 个性字体' : '🔒 个性字体' }}
                    </button>
                  </div>
                </span>
                <span v-else class="bio-text" :style="getBioFontStyle(userStore.user?.bioFontFamily, userStore.user?.bioFontEffect)">{{ userStore.user?.bio || '这个人很懒，什么都没有写~' }}</span>
              </div>
              <div class="bio-edit-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
            </div>

            <FontPicker
              :visible="showBioFontPicker"
              :is-dark="isDarkMap"
              target-type="bio"
              :selected-font="bioFontFamily"
              :selected-effect="bioFontEffect"
              @select="bioFontFamily = $event"
              @select-effect="bioFontEffect = $event"
              @close="showBioFontPicker = false"
            />

            <!-- 搜索框 -->
            <div class="profile-search-input-wrapper">
              <input ref="myProfileSearchInputRef" v-model="myProfileSearchQuery" placeholder="搜索下方选中标签内的故事" class="profile-search-input" @focus="myProfileSearchActive = true" @blur="handleMyProfileSearchBlur" />
              <button v-if="myProfileSearchQuery" class="search-clear-btn" @click.stop="myProfileSearchQuery = ''; myProfileSearchInputRef?.focus()">×</button>
            </div>

            <!-- 标签栏 -->
            <div class="user-content-tabs-wrapper">
              <div class="user-content-tabs">
                <button
                  class="content-tab"
                  :class="{ active: userContentTab === 'posts' }"
                  @click="switchUserContentTab('posts')"
                >
                  作品<span v-if="postsTotalCount >= 0" class="tab-count">{{ postsTotalCount }}</span>
                </button>
                <button
                  class="content-tab"
                  :class="{ active: userContentTab === 'likes' }"
                  @click="switchUserContentTab('likes')"
                >
                  点赞<span v-if="likesTotalCount >= 0" class="tab-count">{{ likesTotalCount }}</span>
                </button>
                <button
                  class="content-tab"
                  :class="{ active: userContentTab === 'favorites' }"
                  @click="switchUserContentTab('favorites')"
                >
                  收藏<span v-if="favoritesTotalCount >= 0" class="tab-count">{{ favoritesTotalCount }}</span>
                </button>
              </div>
            </div>

            <!-- 标签内容区（虚拟滚动） -->
            <div ref="vScrollContainerRef" class="user-content-list profile-story-list" @scroll="handleProfileScroll">
              <!-- 作品 -->
              <template v-if="userContentTab === 'posts'">
                <div v-if="postsLoading && postsList.length === 0" class="panel-loading">
                  <span class="loading-spinner">⌛</span><span>加载中...</span>
                </div>
                <div v-else-if="postsList.length === 0" class="panel-empty">
                  <span class="empty-icon">📝</span><span>还没有发布任何故事</span>
                </div>
                <template v-else>
                  <div class="vscroll-spacer" :style="{ height: vScrollTotalHeight + profileStoryListTopInset + 'px' }"></div>
                  <div
                    v-for="item in vScrollVisibleItems"
                    :key="item.data.id + '-' + storyCardAnimationKey"
                    ref="vScrollItemRefs"
                    :data-virtual-index="item.index"
                    class="panel-item vscroll-item story-card-enter"
                    :class="{ 'is-vip-card': getStoryAuthorVip(item.data), 'is-capsule-locked': isCapsuleLocked(item.data) }"
                    :style="{ position: 'absolute', top: item.top + profileStoryListTopInset + 'px', left: '0', right: '0', animationDelay: item.index * 0.07 + 's' }"
                    @click="handleStoryClick(item.data)"
                  >
                    <div class="item-header">
                      <img :src="item.data.avatar" class="item-avatar" alt="头像" />
                      <div class="item-meta">
                        <span class="vip-name-row"><span class="item-author vip-username" :class="{ 'has-vip': getStoryAuthorVip(item.data) }">{{ getStoryAuthorName(item.data) }}</span><span class="vip-text-badge-sm" v-if="getStoryAuthorVip(item.data)">VIP</span></span>
                        <span class="item-time">{{ formatRelativeTime(item.data.createdAt) }}&ensp;&ensp;📍 {{ getStoryLocationText(item.data) }}</span>
                      </div>
                      <button class="item-action-btn delete-btn" title="删除故事" @click.stop="handleDeleteStory(item.data)"><span>🗑️</span></button>
                      <PolishStory :story-id="item.data.id" @polished="handleStoryPolished" @error="handlePolishError" />
                    </div>
                    <template v-if="isCapsuleLocked(item.data)">
                      <div class="capsule-lock-strip">
                        <svg class="capsule-lock-icon" viewBox="0 0 24 28" fill="none" width="18" height="21">
                          <rect x="3" y="13" width="18" height="13" rx="3" fill="currentColor" opacity="0.12" stroke="currentColor" stroke-width="1.5"/>
                          <path d="M8 13V9a4 4 0 1 1 8 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                          <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                        </svg>
                        <span class="capsule-lock-label">时光胶囊未解锁</span>
                        <span class="capsule-lock-timer" v-if="getCapsuleCountdown(item.data)">{{ getCapsuleCountdown(item.data) }}</span>
                      </div>
                    </template>
                    <template v-else>
                    <p class="item-content" :style="getItemContentStyle(item.data)">{{ item.data.content }}</p>
                    <div v-if="item.data.images?.length" class="item-images"><img :src="item.data.images[0]" alt="配图" /></div>
                    </template>
                    <div class="item-footer">
                      <span class="item-likes">❤️ {{ item.data.likeCount ?? item.data.likes ?? 0 }}</span>
                      <span class="item-likes">⭐️ {{ item.data.favoriteCount ?? 0 }}</span>
                    </div>
                  </div>
                  <div v-if="postsLoadingMore" class="panel-loading-more"><span class="loading-spinner">⌛</span><span>加载更多...</span></div>
                  <div v-if="!postsHasMore && postsList.length > 0" class="panel-no-more"><span>没有更多了</span></div>
                </template>
              </template>

              <!-- 点赞 -->
              <template v-if="userContentTab === 'likes'">
                <div v-if="likesLoading && likesList.length === 0" class="panel-loading">
                  <span class="loading-spinner">⌛</span><span>加载中...</span>
                </div>
                <div v-else-if="likesList.length === 0" class="panel-empty">
                  <span class="empty-icon">💝</span><span>还没有点赞任何故事</span>
                </div>
                <template v-else>
                  <div class="vscroll-spacer" :style="{ height: vScrollTotalHeight + profileStoryListTopInset + 'px' }"></div>
                  <div
                    v-for="item in vScrollVisibleItems"
                    :key="item.data.id + '-' + storyCardAnimationKey"
                    ref="vScrollItemRefs"
                    :data-virtual-index="item.index"
                    class="panel-item vscroll-item story-card-enter"
                    :class="{ 'is-vip-card': getStoryAuthorVip(item.data) }"
                    :style="{ position: 'absolute', top: item.top + profileStoryListTopInset + 'px', left: '0', right: '0', animationDelay: item.index * 0.07 + 's' }"
                    @click="handleStoryClick(item.data)"
                  >
                    <div class="item-header">
                      <img :src="item.data.avatar" class="item-avatar" alt="头像" />
                      <div class="item-meta">
                        <span class="vip-name-row"><span class="item-author vip-username" :class="{ 'has-vip': getStoryAuthorVip(item.data) }">{{ getStoryAuthorName(item.data) }}</span><span class="vip-text-badge-sm" v-if="getStoryAuthorVip(item.data)">VIP</span></span>
                        <span class="item-time">{{ formatRelativeTime(item.data.createdAt) }}&ensp;&ensp;📍 {{ getStoryLocationText(item.data) }}</span>
                      </div>
                      <button class="item-action-btn unlike-btn" title="取消点赞" @click.stop="handleUnlike(item.data)"><span>❌</span></button>
                    </div>
                    <p class="item-content" :style="getItemContentStyle(item.data)">{{ item.data.content }}</p>
                    <div v-if="item.data.images?.length" class="item-images"><img :src="item.data.images[0]" alt="配图" /></div>
                    <div class="item-footer">
                      <span class="item-likes">❤️ {{ item.data.likeCount ?? item.data.likes ?? 0 }}</span>
                      <span class="item-likes">⭐️ {{ item.data.favoriteCount ?? 0 }}</span>
                    </div>
                  </div>
                  <div v-if="likesLoadingMore" class="panel-loading-more"><span class="loading-spinner">⌛</span><span>加载更多...</span></div>
                  <div v-if="!likesHasMore && likesList.length > 0" class="panel-no-more"><span>没有更多了</span></div>
                </template>
              </template>

              <!-- 收藏 -->
              <template v-if="userContentTab === 'favorites'">
                <div v-if="favoritesLoading && favoritesList.length === 0" class="panel-loading">
                  <span class="loading-spinner">⌛</span><span>加载中...</span>
                </div>
                <div v-else-if="favoritesList.length === 0" class="panel-empty">
                  <span class="empty-icon">⭐</span><span>还没有收藏任何故事</span>
                </div>
                <template v-else>
                  <div class="vscroll-spacer" :style="{ height: vScrollTotalHeight + profileStoryListTopInset + 'px' }"></div>
                  <div
                    v-for="item in vScrollVisibleItems"
                    :key="item.data.id + '-' + storyCardAnimationKey"
                    ref="vScrollItemRefs"
                    :data-virtual-index="item.index"
                    class="panel-item vscroll-item story-card-enter"
                    :class="{ 'is-vip-card': getStoryAuthorVip(item.data) }"
                    :style="{ position: 'absolute', top: item.top + profileStoryListTopInset + 'px', left: '0', right: '0', animationDelay: item.index * 0.12 + 's' }"
                    @click="handleStoryClick(item.data)"
                  >
                    <div class="item-header">
                      <img :src="item.data.avatar" class="item-avatar" alt="头像" />
                      <div class="item-meta">
                        <span class="vip-name-row"><span class="item-author vip-username" :class="{ 'has-vip': getStoryAuthorVip(item.data) }">{{ getStoryAuthorName(item.data) }}</span><span class="vip-text-badge-sm" v-if="getStoryAuthorVip(item.data)">VIP</span></span>
                        <span class="item-time">{{ formatRelativeTime(item.data.createdAt) }}&ensp;&ensp;📍 {{ getStoryLocationText(item.data) }}</span>
                      </div>
                      <button
                        class="item-action-btn unfavorite-btn"
                        :class="{ 'is-restorable': item.data.isFavorited === false }"
                        :title="item.data.isFavorited !== false ? '取消收藏' : '重新收藏'"
                        @click.stop="handleToggleFavoriteFromList(item.data)"
                      ><span>{{ item.data.isFavorited !== false ? "❌" : "✨" }}</span></button>
                    </div>
                    <p class="item-content" :style="getItemContentStyle(item.data)">{{ item.data.content }}</p>
                    <div v-if="item.data.images?.length" class="item-images"><img :src="item.data.images[0]" alt="配图" /></div>
                    <div class="item-footer">
                      <span class="item-likes">❤️ {{ item.data.likeCount ?? item.data.likes ?? 0 }}</span>
                      <span class="item-likes">⭐️ {{ item.data.favoriteCount ?? 0 }}</span>
                    </div>
                  </div>
                  <div v-if="favoritesLoadingMore" class="panel-loading-more"><span class="loading-spinner">⌛</span><span>加载更多...</span></div>
                  <div v-if="!favoritesHasMore && favoritesList.length > 0" class="panel-no-more"><span>没有更多了</span></div>
                </template>
              </template>
            </div>
            <transition name="back-to-top">
              <button
                v-if="showProfileBackToTop"
                class="wall-back-to-top profile-back-to-top"
                :class="{ dark: effectiveMapTheme === 'dark' }"
                @click="scrollProfileToTop(vScrollContainerRef)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 19V6" />
                  <path d="M6.5 11.5 12 6l5.5 5.5" />
                  <path d="M8 4h8" />
                </svg>
              </button>
            </transition>
          </div>
          <!-- 返回顶部按钮 (我的主页 - 已移入标签栏内) -->
        </div>
      </div>
      </transition>

    <!-- 编辑资料弹窗（修改用户名、邮箱、密码） -->
    <div v-if="showEditProfileModal" class="modal-overlay" :class="{ dark: effectiveMapTheme === 'dark' }" @click.self="handleCloseEditProfile">
      <div class="edit-profile-modal" :class="{ dark: effectiveMapTheme === 'dark' }">
        <div class="edit-profile-header">
          <h3>编辑资料</h3>
          <button class="close-btn" @click="handleCloseEditProfile"><span>×</span></button>
        </div>
        <div class="edit-profile-body">
          <div class="edit-field">
            <label>用户名</label>
            <input v-model="editProfileForm.username" type="text" placeholder="输入新用户名" maxlength="20" />
            <span v-if="editProfileErrors.username" class="field-error-inline">{{ editProfileErrors.username }}</span>
          </div>
          <div class="edit-field">
            <label>邮箱</label>
            <input :value="editProfileForm.email" type="email" disabled />
            <span class="field-hint">邮箱暂不支持修改</span>
          </div>

          <!-- 分隔线：修改密码区域 -->
          <div class="edit-password-section">
            <div class="edit-password-title">修改密码</div>
          </div>

          <div class="edit-field">
            <label>旧密码</label>
            <div class="edit-input-wrap">
              <input
                v-model="editProfileForm.currentPassword"
                :type="editProfileShowOldPwd ? 'text' : 'password'"
                placeholder="请输入旧密码"
                @input="onOldPasswordInput"
              />
              <button class="eye-toggle" type="button" @click="editProfileShowOldPwd = !editProfileShowOldPwd">
                <svg v-if="!editProfileShowOldPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <div v-if="pwdVerify.oldPasswordError" class="validation-tip tip-error">
              <span class="tip-text">{{ pwdVerify.oldPasswordError }}</span>
            </div>
          </div>
          <div class="edit-field">
            <label>新密码</label>
            <div class="edit-input-wrap">
              <input
                v-model="editProfileForm.newPassword"
                :type="editProfileShowNewPwd ? 'text' : 'password'"
                placeholder="请输入新密码"
                @input="onNewPasswordInput"
              />
              <button class="eye-toggle" type="button" @click="editProfileShowNewPwd = !editProfileShowNewPwd">
                <svg v-if="!editProfileShowNewPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <div v-if="pwdVerify.newPasswordMsg" :class="['validation-tip', pwdVerify.newPasswordValid ? 'tip-success' : 'tip-error']">
              <span class="tip-text">{{ pwdVerify.newPasswordMsg }}</span>
            </div>
          </div>
          <div class="edit-field">
            <label>确认新密码</label>
            <div class="edit-input-wrap">
              <input
                v-model="editProfileForm.confirmPassword"
                :type="editProfileShowConfirmPwd ? 'text' : 'password'"
                placeholder="请再次输入新密码"
                @input="onConfirmPasswordInput"
              />
              <button class="eye-toggle" type="button" @click="editProfileShowConfirmPwd = !editProfileShowConfirmPwd">
                <svg v-if="!editProfileShowConfirmPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <div v-if="pwdVerify.confirmPasswordMsg" :class="['validation-tip', pwdVerify.confirmPasswordValid ? 'tip-success' : 'tip-error']">
              <span class="tip-text">{{ pwdVerify.confirmPasswordMsg }}</span>
            </div>
          </div>
          <div class="edit-field">
            <button
              class="btn-confirm-password"
              :disabled="!pwdVerify.canSubmit || editProfileSavingPassword"
              @click="handleConfirmChangePassword"
            >
              {{ editProfileSavingPassword ? '修改中...' : '确认修改密码' }}
            </button>
          </div>
        </div>
        <div class="edit-profile-footer">
          <button class="btn-cancel" @click="handleCloseEditProfile">取消</button>
          <button class="btn-save" :disabled="editProfileSaving" @click="handleSaveEditProfile">
            {{ editProfileSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 切换账号弹窗 -->
    <div v-if="showSwitchAccountModal" class="modal-overlay" :class="{ dark: effectiveMapTheme === 'dark' }" @click.self="showSwitchAccountModal = false">
      <div class="switch-account-modal" :class="{ dark: effectiveMapTheme === 'dark' }">
        <div class="switch-account-header">
          <h3>切换账号</h3>
          <button class="close-btn" @click="showSwitchAccountModal = false"><span>×</span></button>
        </div>
        <div class="switch-account-body">
          <div class="account-slots">
            <div class="account-slot current">
              <img :src="userStore.user?.avatar || 'https://picsum.photos/80/80?random=1'" class="slot-avatar" />
              <span class="vip-name-row"><span class="slot-name vip-username" :class="{ 'has-vip': userStore.user?.vip }">{{ userStore.user?.username || '当前账号' }}</span><span class="vip-text-badge-sm" v-if="userStore.user?.vip">VIP</span></span>
              <span class="slot-current-badge">当前</span>
            </div>
            <div v-for="acc in savedAccounts" :key="acc.id" class="account-slot" @click="handleSwitchToAccount(acc)">
              <img :src="acc.avatar || 'https://picsum.photos/80/80?random=2'" class="slot-avatar" />
              <span class="vip-name-row"><span class="slot-name vip-username" :class="{ 'has-vip': acc.vip }">{{ acc.username || '其他账号' }}</span><span class="vip-text-badge-sm" v-if="acc.vip">VIP</span></span>
            </div>
            <div v-if="savedAccounts.length < 2" class="account-slot add-slot" @click="handleAddAccount">
              <div class="add-avatar">+</div>
              <span class="slot-name">添加账号</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PaperPlaneStory
      v-if="selectedStory"
      :story="selectedStory"
      :like-pending="storyLikePending"
      :favorite-pending="storyFavoritePending"
      :start-position="storyStartPosition"
      :direct-open="storyDirectOpen"
      :is-dark="effectiveMapTheme === 'dark'"
      :next-stop="nextStop"
      :next-stop-loading="nextStopLoading"
      @close="closeStoryModal"
      @preview-image="handlePreviewImage"
      @like="toggleStoryLike"
      @favorite="toggleStoryFavorite"
      @comment="handleStoryComment"
      @submit-comment="handleSubmitCommentFromStory"
      @report="handleStoryReport"
      @request-vip="showVipCenter = true"
      @view-user-profile="openUserDetail"
      @open-comment-bg="handleOpenCommentBg"
      @open-vip-center="vipCenterFromStory = true; showVipCenter = true"
      @go-next-stop="goToNextStop"
    />

    <div class="msg-trigger-wrapper">
      <button
        class="msg-trigger-btn"
        :class="{ dark: effectiveMapTheme === 'dark' }"
        @click.stop="openMsgPanel"
      >
        我的通知
      </button>
      <span v-if="hasNotificationBadge" class="msg-badge-dot"></span>
    </div>

    <transition name="notification-fade">
      <div
        v-if="showNotificationPanel"
        class="notification-backdrop"
        @click.self="closeNotificationPanel"
      >
        <div
          class="notification-panel"
          :class="{ dark: effectiveMapTheme === 'dark' }"
          @click.stop
        >
          <div class="notification-header">
            <div class="notification-tabs">
              <button
                class="notification-tab-btn"
                :class="{ active: notificationTab === 'messages' }"
                @click="switchNotificationTab('messages')"
              >
                消息
                <span v-if="notificationUnreadCount > 0" class="tab-badge">{{
                  notificationUnreadCount > 99 ? "99+" : notificationUnreadCount
                }}</span>
              </button>
              <button
                class="notification-tab-btn"
                :class="{ active: notificationTab === 'announcements' }"
                @click="switchNotificationTab('announcements')"
              >
                公告
                <span v-if="hasUnreadAnnouncements" class="tab-dot"></span>
              </button>
            </div>
            <div class="notification-actions">
              <template v-if="notificationTab === 'messages'">
                <button
                  v-if="notificationUnreadCount > 0"
                  class="mark-read-btn"
                  @click="markAllNotificationsRead"
                >
                  全部已读
                </button>
                <button
                  v-if="notifications.length > 0"
                  class="clear-all-btn"
                  @click="clearAllNotifications"
                >
                  清空全部
                </button>
              </template>
              <button class="close-btn" @click="closeNotificationPanel">
                <span>×</span>
              </button>
            </div>
          </div>
          <div class="notification-content">
            <template v-if="notificationTab === 'messages'">
              <div v-if="notificationsLoading" class="notification-loading">
                <span class="loading-spinner">⌛</span>
                <span>加载中...</span>
              </div>
              <div
                v-else-if="notifications.length === 0"
                class="notification-empty"
              >
                <span class="empty-icon">📭</span>
                <span>暂无通知</span>
              </div>
              <div v-else class="notification-list">
                <div
                  v-for="notice in notifications"
                  :key="notice.id"
                  class="notification-item"
                  :class="{ unread: !notice.isRead }"
                >
                  <div class="notice-avatar">
                    <img
                      v-if="notice.fromUser?.avatar"
                      :src="notice.fromUser.avatar"
                      alt=""
                    />
                    <span v-else>{{
                      (notice.fromUser?.username ||
                        notice.fromUserName ||
                        "匿")[0]
                    }}</span>
                  </div>
                  <div class="notice-body">
                    <p class="notice-content">{{ notice.content }}</p>
                    <span class="notice-time">{{
                      formatRelativeTime(notice.createdAt)
                    }}</span>
                  </div>
                  <span v-if="!notice.isRead" class="unread-dot"></span>
                </div>
              </div>
            </template>
            <template v-if="notificationTab === 'announcements'">
              <div v-if="announcementsLoading" class="notification-loading">
                <span class="loading-spinner">⌛</span>
                <span>加载中...</span>
              </div>
              <div
                v-else-if="announcements.length === 0"
                class="notification-empty"
              >
                <span class="empty-icon">📢</span>
                <span>暂无公告</span>
              </div>
              <div v-else class="announcement-panel-list">
                <div
                  v-for="ann in announcements"
                  :key="ann.id"
                  class="np-announcement-card"
                  :class="ann.type"
                >
                  <div class="np-ann-header">
                    <span class="np-ann-type-badge">{{
                      getAnnouncementTypeIcon(ann.type)
                    }}</span>
                    <span class="np-ann-time">{{
                      formatRelativeTime(ann.createdAt)
                    }}</span>
                  </div>
                  <h4 class="np-ann-title">{{ ann.title }}</h4>
                  <p class="np-ann-content">{{ ann.content }}</p>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
      </transition>

    <LoginModal v-if="showLoginModal" @close="handleLoginModalClose" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { useMapStore } from "../../stores/map";
import { useUserStore, saveDockThemeForUser } from "../../stores/user";
import PaperPlaneStory from "../../components/PaperPlaneStory.vue";
import { mapApi } from "../../api/map";
import { likeApi } from "../../api/like";
import { commentApi } from "../../api/comment";
import { storyApi } from "../../api/story";
import { favoriteApi } from "../../api/favorite";
import { getFontStyle, injectFontEffectAnimations } from "../../composables/useFontEffect";
import { authApi } from "../../api/auth";
import { reportApi } from "../../api/report";
import { notificationApi } from "../../api/notification";
import { showToast, showConfirm } from "../../composables/useToast.js";
import AMap from "../../components/AMap.vue";
import StoryCard from "../../components/StoryCard.vue";
import StoryWallCard from "../../components/StoryWallCard.vue";
import ClusterPopover from "../../components/ClusterPopover.vue";
import ImageLightbox from "../../components/ImageLightbox.vue";
import MyFootprints from "../../components/MyFootprints.vue";
import VipCenter from "../../components/VipCenter.vue";
import FontPicker from "../../components/FontPicker.vue";
import CoinCenter from "../../components/CoinCenter.vue";

injectFontEffectAnimations();

function getItemContentStyle(storyData) {
  if (!storyData) return {};
  const ff = storyData.fontFamily || '';
  const fe = storyData.fontEffect || '';
  if (!ff && !fe) return {};
  return getFontStyle(ff, fe);
}
import CommentSettings from "../../components/CommentSettings.vue";
import VisualCustomizer from "../../components/VisualCustomizer.vue";
import PolishStory from "../../components/PolishStory.vue";
import PublishForm from "../../components/PublishForm.vue";
import PublishFormDock from "../../components/PublishFormDock.vue";
import LoginModal from "../Home/components/LoginModal.vue";
import { useVipStore } from "../../stores/vip";
import { formatRelativeTime } from "../../utils/time";
import { EMOTIONS, getEmotionEmoji } from "../../utils/emotion";
import { getAnnouncementTypeIcon } from "../../utils/announcement";
import { searchPoisWithContext } from "../../utils/poiSearch";
import { REPORT_TYPES } from "../../utils/report";
import { uploadAvatar as uploadToOSS, validateImage } from "../../utils/upload";
import { useVirtualScroll } from "../../composables/useVirtualScroll.js";

const mapStore = useMapStore();
const userStore = useUserStore();
const vipStore = useVipStore();

const clusters = ref([]);

const showClusterPopover = ref(false);
const clusterPopoverStories = ref([]);
const showLightbox = ref(false);
const lightboxImages = ref([]);
const lightboxInitialIndex = ref(0);

const showSidebar = ref(false);
const showPublishSidebar = ref(false);
const showDockPublishSidebar = ref(false);
const showUserSidebar = ref(false);
const isPickingPublishLocation = ref(false);
const isPickingDockPublishLocation = ref(false);
const pickedPublishLocation = ref(null);
const suggestedPublishLocations = ref([]);
const publishPickPrompt = ref(null);
const publishPrefillQuery = ref('');
const adjustPlaneSavedPrefill = ref('');
const adjustPlaneSavedPosition = ref(null);
const isAdjustingPlanePosition = ref(false);
const isAdjustingWaitingForPlane = ref(false);
const isPublishWaitingForPlane = ref(false);
const isDockPublishWaitingForPlane = ref(false);
const shouldAutoConfirmPublishPick = ref(false);
const shouldAutoConfirmAdjustPlanePick = ref(false);
const shouldAutoConfirmDockPublishPick = ref(false);
const dockPublishClickScreenPos = ref(null);
const adjustPlaneClickScreenPos = ref(null);
const showLoginModal = ref(false);
const showNotificationPanel = ref(false);
const notificationTab = ref("messages");
const notifications = ref([]);
const notificationsLoading = ref(false);
const notificationUnreadCount = ref(0);
const announcementsLoading = ref(false);
const loading = ref(false);
const defaultMapExploreLimit = 200;
const filteredMapExploreLimit = 500;
const emotionFilterOptions = EMOTIONS;
const timeFilterOptions = [
  { key: "all", label: "全部时间" },
  { key: "24h", label: "24小时" },
  { key: "7d", label: "7天内" },
  { key: "30d", label: "30天内" },
];
const activeEmotionFilter = ref("all");
const activeTimePreset = ref("all");
const mapFilterStartDate = ref("");
const mapFilterEndDate = ref("");
const showMapFilterPanel = ref(false);
const nearbySearchQuery = ref("");
const nearbySearchResults = ref([]);
const nearbySearching = ref(false);
const nearbySearchError = ref("");
const nearbyHasSearched = ref(false);
const isMapPointPickMode = computed(
  () =>
    isPickingPublishLocation.value
    || isPickingDockPublishLocation.value
    || isAdjustingPlanePosition.value,
);
const activeTempPickedLocation = computed(() => {
  if (isPickingDockPublishLocation.value) {
    return dockPublishPickedLocation.value;
  }

  if (isPickingPublishLocation.value || isAdjustingPlanePosition.value) {
    return pickedPublishLocation.value;
  }

  return null;
});
const nearbyCenterLabel = ref("");
const nearbyPinnedCenterLabel = ref(null);
const currentUserLocationLabel = ref("");
const currentUserSearchLocality = ref(null);
const feedStories = ref([]);
const feedLoading = ref(false);
const feedLoadingMore = ref(false);
const feedPage = ref(1);
const feedPagination = ref({ total: 0, totalPages: 0 });
const feedHasMore = computed(
  () => feedPage.value < feedPagination.value.totalPages,
);
const randomWalking = ref(false);
const nextStop = ref(null);
const nextStopLoading = ref(false);
const selectedStory = ref(null);
const storyStartPosition = ref({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
});
const storyDirectOpen = ref(true); // `false` 时从地图起点飞入
const THEME_SELECTOR_CARD_KEY = "theme";
const themeSelectorCardKey = THEME_SELECTOR_CARD_KEY;
const mapTheme = ref(localStorage.getItem("mapTheme") || "auto");
const amapRef = ref(null);
const minuteTicker = ref(0);
const isDockExpanded = ref(false);

function getTimeBasedTheme() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}
function normalizeThemeChoice(theme) {
  return ["auto", "light", "dark", "vip"].includes(theme) ? theme : "auto";
}

const selectedThemeChoice = computed(() => {
  const normalized = normalizeThemeChoice(mapTheme.value);

  if (normalized === "auto") {
    return getTimeBasedTheme();
  }

  return normalized;
});

const effectiveMapTheme = computed(() => {
  void minuteTicker.value;
  if (selectedThemeChoice.value === "vip") {
    return "dark";
  }

  return selectedThemeChoice.value;
});
const isUserMapFilterActive = computed(
  () =>
    activeEmotionFilter.value !== "all" ||
    Boolean(mapFilterStartDate.value) ||
    Boolean(mapFilterEndDate.value),
);
const isSystemDisplayLimitEnabled = computed(
  () => !isUserMapFilterActive.value,
);
function getZoomAdaptiveVisibleEntityLimit(zoom) {
  const normalizedZoom = Number(zoom);

  if (!Number.isFinite(normalizedZoom)) {
    return 96;
  }

  if (normalizedZoom <= 5) {
    return 24;
  }

  if (normalizedZoom <= 7) {
    return 36;
  }

  if (normalizedZoom <= 9) {
    return 54;
  }

  if (normalizedZoom <= 11) {
    return 72;
  }

  if (normalizedZoom <= 13) {
    return 96;
  }

  if (normalizedZoom <= 15) {
    return 132;
  }

  if (normalizedZoom <= 17) {
    return 180;
  }

  return 240;
}
const defaultMapVisibleEntityLimit = computed(() =>
  getZoomAdaptiveVisibleEntityLimit(mapStore.zoom),
);
const mapExploreFetchLimit = computed(() =>
  isUserMapFilterActive.value
    ? filteredMapExploreLimit
    : defaultMapExploreLimit,
);
const mapFilterQuery = computed(() => {
  const result = {};

  if (activeEmotionFilter.value !== "all") {
    result.emotionTag = activeEmotionFilter.value;
  }

  if (activeTimePreset.value === "24h") {
    result.createdAfter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    result.createdBefore = new Date().toISOString();
    return result;
  }

  if (activeTimePreset.value === "7d") {
    result.createdAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    result.createdBefore = new Date().toISOString();
    return result;
  }

  if (activeTimePreset.value === "30d") {
    result.createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    result.createdBefore = new Date().toISOString();
    return result;
  }

  if (mapFilterStartDate.value) {
    result.createdAfter = new Date(`${mapFilterStartDate.value}T00:00:00`).toISOString();
  }

  if (mapFilterEndDate.value) {
    result.createdBefore = new Date(`${mapFilterEndDate.value}T23:59:59.999`).toISOString();
  }

  return result;
});
const mapFilterStatusText = computed(() => {
  if (!isUserMapFilterActive.value) {
    return "";
  }

  const segments = [];
  if (activeEmotionFilter.value !== "all") {
    segments.push(`心情：${activeEmotionFilter.value}`);
  }

  if (mapFilterStartDate.value || mapFilterEndDate.value) {
    const startText = mapFilterStartDate.value || "最早";
    const endText = mapFilterEndDate.value || "现在";
    segments.push(`时间：${startText} 至 ${endText}`);
  }

  return `筛选中：${segments.join("｜")}。系统显示上限已关闭。`;
});
const nearbyCenterSummary = computed(() => {
  if (!nearbyCenterLabel.value) {
    return "会优先参考你附近的结果，遇到明确地标时也会保留全局最佳匹配。";
  }

  return `当前显示的是 ${nearbyCenterLabel.value} 附近的故事。`;
});
const anyPanelOpen = computed(() => {
  return showSidebar.value || showPlaneNearby.value || showUserSidebar.value || showPublishSidebar.value || showDockPublishSidebar.value
    || showSwitchAccountModal.value || showLoginModal.value || showNotificationPanel.value
    || showEditProfileModal.value || isDockExpanded.value || isAdjustingPlanePosition.value;
});
const hoveredDockCard = ref("");
const selectedDockCard = ref("");
const drawingDockCard = ref("");
const liftingDockCard = ref("");
const returningDockCard = ref("");
const dockMenuRef = ref(null);
const dockCardStackRef = ref(null);
const ripplingDockCard = ref("");
const dockActionPending = ref(false);
const VIP_THEME_KEYS = new Set(["poker"]); // VIP 专属主题集合，后续新增主题直接往这里加
const DEFAULT_THEME_KEY = "tarot"; // 非 VIP 用户的兜底主题
const activeDockTheme = ref(localStorage.getItem("dockTheme") || DEFAULT_THEME_KEY);
const usePokerTheme = ref(activeDockTheme.value === "poker");
function getActiveThemeKey() {
  return activeDockTheme.value;
}
const isDarkMap = computed(() => effectiveMapTheme.value === "dark");
const isVipTheme = computed(() => selectedThemeChoice.value === "vip");
const canUseVipTheme = computed(
  () =>
    Boolean(userStore.user?.vip) &&
    Boolean(userStore.isLoggedIn) &&
    !userStore.isGuest,
);
const accountSessionKey = computed(() => {
  const isLogged = Boolean(userStore.isLoggedIn);
  const isGuestUser = Boolean(userStore.isGuest);
  const userId = userStore.user?.id ? String(userStore.user.id) : "";
  const token = userStore.token || "";
  return `${isLogged ? 1 : 0}|${isGuestUser ? 1 : 0}|${userId}|${token}`;
});
let vipAccountSyncToken = 0;

async function syncVipStateForAccountChange() {
  const syncToken = ++vipAccountSyncToken;
  await vipStore.refreshAccountState();
  if (syncToken !== vipAccountSyncToken) {
    return;
  }

  if (!vipStore.isVipActive && VIP_THEME_KEYS.has(getActiveThemeKey())) {
    activeDockTheme.value = DEFAULT_THEME_KEY;
    usePokerTheme.value = false;
    saveDockThemeForUser(userStore.user?.id, DEFAULT_THEME_KEY);
  }
}

watch(
  accountSessionKey,
  () => {
    void syncVipStateForAccountChange();
  },
  { immediate: true },
);
let dockHoverClearTimer = null;
let dockSelectionTimer = null;
let dockPointerX = null;
let nearbyPlaceSearchInstance = null;
let nearbyPlaceSearchPromise = null;
let nearbySearchTimer = null;
let nearbyCenterLabelTimer = null;
let activeNearbySearchToken = 0;
let activeNearbyCenterLabelToken = 0;
let activeUserLocationLabelToken = 0;
let activeClusterRequestToken = 0;
let suppressNearbySearchQueryWatch = false;
let geocoderInstance = null;
let geocoderPromise = null;
const reverseGeocodeCache = new Map();
const reverseGeocodePending = new Map();

const DOCK_CARD_PREP_MS = 80;
const DOCK_CARD_DRAW_MS = 100;
const DOCK_CARD_RETURN_MS = 300;
const STORY_MODAL_OPEN_DELAY_MS = 420;
const POI_SEARCH_RADIUS_METERS = 50000;

const showWelcomeOverlay = ref(true);
const welcomeContentRef = ref(null);
const welcomeTextRef = ref(null);
const welcomeTextScale = ref(1);
let welcomeOverlayTimer = null;
let welcomeTextResizeFrame = 0;

const welcomeQuotes = [
  "欢迎来到心灵栖息之所！",
  "今日もがんばったね、ほんとにお疲れ様",
  "Breathe. You are safe in this moment.",
  "在这颗星球的某个角落，总有故事与你共鸣。",
  "Quiet the mind, and the soul will speak.",
];

const currentWelcomeQuote = ref(
  welcomeQuotes[Math.floor(Math.random() * welcomeQuotes.length)],
);
function fitWelcomeTextToSingleLine() {
  if (!showWelcomeOverlay.value) {
    return;
  }

  const container = welcomeContentRef.value;
  const text = welcomeTextRef.value;

  if (!(container instanceof HTMLElement) || !(text instanceof HTMLElement)) {
    return;
  }

  welcomeTextScale.value = 1;

  const availableWidth = container.clientWidth;
  const contentWidth = text.scrollWidth;

  if (!availableWidth || !contentWidth) {
    return;
  }

  welcomeTextScale.value = Math.min(1, availableWidth / contentWidth);
}

function scheduleWelcomeTextFit() {
  if (welcomeTextResizeFrame) {
    window.cancelAnimationFrame(welcomeTextResizeFrame);
  }

  welcomeTextResizeFrame = window.requestAnimationFrame(() => {
    welcomeTextResizeFrame = 0;
    fitWelcomeTextToSingleLine();
  });
}

const isEditingUsername = ref(false);
const editingUsername = ref("");
const usernameError = ref("");
const checkingUsername = ref(false);

const canSaveUsername = computed(() => {
  const trimmed = editingUsername.value.trim();
  return (
    trimmed.length >= 2 &&
    trimmed.length <= 20 &&
    !checkingUsername.value &&
    !usernameError.value
  );
});

const avatarInput = ref(null);
const avatarPreview = ref("");
const avatarUploading = ref(false);
const avatarError = ref("");
const currentAvatarFile = ref(null);

const isEditingPassword = ref(false);
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const savingPassword = ref(false);
const passwordError = ref("");
const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const currentPasswordError = ref("");
const newPasswordError = ref("");
const confirmPasswordError = ref("");

const canSavePassword = computed(() => {
  return (
    passwordForm.value.currentPassword.length > 0 &&
    passwordForm.value.newPassword.length >= 6 &&
    passwordForm.value.confirmPassword.length >= 6 &&
    passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
    !savingPassword.value &&
    !currentPasswordError.value &&
    !newPasswordError.value &&
    !confirmPasswordError.value
  );
});

watch(
  () => passwordForm.value.currentPassword,
  (val) => {
    if (!val) {
      currentPasswordError.value = "请输入当前密码";
    } else {
      currentPasswordError.value = "";
    }
  },
);

watch(
  () => passwordForm.value.newPassword,
  (val) => {
    if (val && val.length < 6) {
      newPasswordError.value = "新密码至少需要 6 位";
    } else {
      newPasswordError.value = "";
    }
    if (passwordForm.value.confirmPassword) {
      confirmPasswordError.value =
        val !== passwordForm.value.confirmPassword
          ? "两次输入的新密码不一致"
          : "";
    }
  },
);

watch(
  () => passwordForm.value.confirmPassword,
  (val) => {
    if (val && val !== passwordForm.value.newPassword) {
      confirmPasswordError.value = "两次输入的新密码不一致";
    } else if (val && val.length < 6) {
      confirmPasswordError.value = "新密码至少需要 6 位";
    } else {
      confirmPasswordError.value = "";
    }
  },
);

const showLikesPanel = ref(false);
const showPostsPanel = ref(false);
const showFavoritesPanel = ref(false);

// --- 新增：用户信息面板状态 ---
const userContentTab = ref('posts');
const postsTotalCount = ref(-1);
const likesTotalCount = ref(-1);
const favoritesTotalCount = ref(-1);
const storyCardAnimationKey = ref(0); // 用于触发入场动画的版本号

// Bio 编辑
const editingBioInline = ref(false);
const bioDraft = ref('');
const bioInputRef = ref(null);
const bioChanged = ref(false);
const showBioFontPicker = ref(false);
const bioFontFamily = ref('');
const bioFontEffect = ref('');
const bioFontBtnMousedown = ref(false);

function readBioFontFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)vip_default_font=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}
function readBioFontEffectFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)vip_default_font_effect=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}
function getBioFontStyle(bioFF, bioFE) {
  const ff = bioFF || '';
  const fe = bioFE || '';
  if (!ff && !fe) return {};
  return getFontStyle(ff, fe);
}

// 编辑资料弹窗
const showEditProfileModal = ref(false);
const editProfileForm = ref({ username: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
const editProfileErrors = ref({ username: '', password: '' });
const editProfileSaving = ref(false);
const editProfileShowOldPwd = ref(false);
const editProfileShowNewPwd = ref(false);
const editProfileShowConfirmPwd = ref(false);
const editProfileSavingPassword = ref(false);

// 密码修改实时验证状态
const pwdVerify = ref({
  newPasswordMsg: '',
  newPasswordValid: false,
  confirmPasswordMsg: '',
  confirmPasswordValid: false,
  oldPasswordError: '',
  canSubmit: false,
});

function computePasswordValidation() {
  const form = editProfileForm.value;
  const v = pwdVerify.value;

  // 新密码验证
  if (!form.newPassword) {
    v.newPasswordMsg = '';
    v.newPasswordValid = false;
  } else if (form.newPassword.length < 6) {
    v.newPasswordMsg = '密码不得少于6位';
    v.newPasswordValid = false;
  } else if (form.newPassword === form.currentPassword) {
    v.newPasswordMsg = '与旧密码相同';
    v.newPasswordValid = false;
  } else {
    v.newPasswordMsg = '新密码格式正确';
    v.newPasswordValid = true;
  }

  // 确认新密码验证
  if (!form.confirmPassword) {
    v.confirmPasswordMsg = '';
    v.confirmPasswordValid = false;
  } else if (form.confirmPassword !== form.newPassword) {
    v.confirmPasswordMsg = '与输入的新密码不同';
    v.confirmPasswordValid = false;
  } else {
    v.confirmPasswordMsg = '输入正确';
    v.confirmPasswordValid = true;
  }

  // 综合判断：所有条件通过才允许提交
  v.canSubmit = v.newPasswordValid && v.confirmPasswordValid && !!form.currentPassword;
}

function onOldPasswordInput() {
  // 用户修改旧密码时，清除旧密码错误提示
  pwdVerify.value.oldPasswordError = '';
  computePasswordValidation();
}

function onNewPasswordInput() {
  computePasswordValidation();
}

function onConfirmPasswordInput() {
  computePasswordValidation();
}

// 切换账号弹窗
const showSwitchAccountModal = ref(false);
const savedAccounts = ref([]);
const isSwitchingAccount = ref(false); // 标记是否在切换账号流程中
const showFootprints = ref(false);
const showVipCenter = ref(false);
const showFontPicker = ref(false);
const showCoinCenter = ref(false);
const showCommentSettings = ref(false);
const commentSettingsFromStory = ref(false);
const vipCenterFromStory = ref(false);
const fontPickerFromStory = ref(false);
const showVisualCustomizer = ref(false);
const likesList = ref([]);
const postsList = ref([]);
const favoritesList = ref([]);
const likesLoading = ref(false);
const postsLoading = ref(false);
const favoritesLoading = ref(false);
const likesLoadingMore = ref(false);
const postsLoadingMore = ref(false);
const favoritesLoadingMore = ref(false);
const likesPage = ref(1);
const postsPage = ref(1);
const favoritesPage = ref(1);
const likesHasMore = ref(true);
const postsHasMore = ref(true);
const favoritesHasMore = ref(true);
const likesPageSize = 20;
const postsPageSize = 20;
const favoritesPageSize = 20;

// 虚拟滚动：根据当前标签页动态切换数据源
const currentVirtualList = computed(() => {
  if (userContentTab.value === 'posts') return postsList.value;
  if (userContentTab.value === 'likes') return likesList.value;
  if (userContentTab.value === 'favorites') return favoritesList.value;
  return [];
});

const profileStoryListTopInset = 12;

const {
  containerRef: vScrollContainerRef,
  totalHeight: vScrollTotalHeight,
  visibleItems: vScrollVisibleItems,
  connect: vScrollConnect,
  disconnect: vScrollDisconnect,
  scheduleMeasure: vScrollScheduleMeasure,
  flushMeasurements: vScrollFlushMeasurements,
} = useVirtualScroll({
  itemList: currentVirtualList,
  estimatedHeight: 160,
  gap: 12, // 卡片间距（替代原 flex gap）
  bufferCount: 8,
  nearBottomThreshold: 1200,
  onNearBottom: () => {
    // 滚动到底部附近时加载更多
    if (userContentTab.value === 'posts') loadPostsData(true);
    else if (userContentTab.value === 'likes') loadLikesData(true);
    else if (userContentTab.value === 'favorites') loadFavoritesData(true);
  },
});

// 虚拟滚动项的 DOM 引用（用于测量实际高度）
const vScrollItemRefs = ref([]);

// 监听虚拟滚动项的 DOM 变化，实时测量高度
watch(vScrollItemRefs, (refs) => {
  if (!refs || refs.length === 0) return;
  for (let el of refs) {
    if (el && el.$el) el = el.$el;
    if (el && el.dataset) {
      const idx = parseInt(el.dataset.virtualIndex, 10);
      if (!isNaN(idx)) {
        vScrollScheduleMeasure(idx, el);
      }
    }
  }
}, { flush: 'post', deep: true });

// 每次可见项更新后刷新测量
watch(vScrollVisibleItems, () => {
  nextTick(() => { vScrollFlushMeasurements(); });
}, { flush: 'post' });

// ========== 搜索虚拟滚动（声明后移至 searchResults/searchUserResults 之后）==========

// ========== Feed 推荐流虚拟滚动 ==========
const feedVScrollItemRefs = ref([]);
const {
  containerRef: feedVScrollContainerRef,
  totalHeight: feedVScrollTotalHeight,
  visibleItems: feedVScrollVisibleItems,
  connect: feedVScrollConnect,
  disconnect: feedVScrollDisconnect,
  scheduleMeasure: feedVScrollScheduleMeasure,
  flushMeasurements: feedVScrollFlushMeasurements,
} = useVirtualScroll({
  itemList: computed(() => feedStories.value),
  estimatedHeight: 220,
  gap: 14, // story-list 的 gap
  bufferCount: 3,
  onNearBottom: () => loadMoreFeed(),
});

watch(feedVScrollItemRefs, (refs) => {
  if (!refs || refs.length === 0) return;
  for (let el of refs) {
    if (el && el.$el) el = el.$el;
    if (el && el.dataset) {
      const idx = parseInt(el.dataset.feedIndex, 10);
      if (!isNaN(idx)) feedVScrollScheduleMeasure(idx, el);
    }
  }
}, { flush: 'post', deep: true });

watch(feedVScrollVisibleItems, () => {
  nextTick(() => { feedVScrollFlushMeasurements(); });
}, { flush: 'post' });

const sidebarTab = ref("featured");
const featuredStories = ref([]);
const announcements = ref([]);

// ========== 故事墙 Grid 卡片数据（每个标签页独立管理） ==========
const WALL_INITIAL_LIMIT = 18; // 初始加载量（6行×3列）
const WALL_PAGE_SIZE = 12; // 每次加载更多
const WALL_MAX_CACHE = 500; // 单标签最大缓存条数

function createWallTabState() {
  return {
    items: [], // 缓存的 story 列表
    page: 0,
    totalPages: 1,
    loading: false,
    loadingMore: false,
    initialLoadDone: false,
    hasMore: true,
    error: null,
  };
}

const wallTabs = ref({
  featured: createWallTabState(),
  recommend: createWallTabState(),
});
const wallAllInitialDone = computed(
  () =>
    wallTabs.value.featured.initialLoadDone &&
    wallTabs.value.recommend.initialLoadDone,
);

// 故事墙两个标签页同时加载
async function loadAllWallTabs() {
  const center =
    extractCoordinates(mapStore.center) ||
    extractCoordinates(mapStore.userLocation);
  const lat = center?.latitude;
  const lng = center?.longitude;
  console.log('[loadAllWallTabs] lat:', lat, 'lng:', lng, 'center:', center);

  // 重置所有标签页状态
  for (const key of Object.keys(wallTabs.value)) {
    wallTabs.value[key] = createWallTabState();
  }

  // 同时请求两个标签页
  console.log('[loadAllWallTabs] 开始并行加载 featured + recommend');
  await Promise.allSettled([
    loadWallFeatured(),
    loadWallRecommend(lat, lng),
  ]);

  storyCardAnimationKey.value++;
  console.log('[loadAllWallTabs] 加载完成');
}

async function loadWallFeatured() {
  const tab = wallTabs.value.featured;
  tab.loading = true;
  tab.error = null;
  try {
    const res = await storyApi.getFeaturedStories({
      limit: WALL_INITIAL_LIMIT,
      summary: true,
    });
    const data = res?.data ?? res;
    const stories = (data?.stories ?? [])
      .map((s) => normalizeStoryForMap(s))
      .filter(Boolean);
    tab.items = stories;
    tab.page = 1;
    tab.totalPages = data?.pagination?.totalPages ?? 1;
    tab.hasMore = tab.page < tab.totalPages;
    tab.initialLoadDone = true;
  } catch (e) {
    console.error('[wall-featured] load failed:', e);
    tab.error = '加载失败';
    tab.initialLoadDone = true;
  } finally {
    tab.loading = false;
  }
}

async function loadWallRecommend(lat, lng) {
  const tab = wallTabs.value.recommend;
  tab.loading = true;
  tab.error = null;
  console.log('[wall-recommend] 开始加载, lat:', lat, 'lng:', lng);
  try {
    const res = await mapApi.getRecommendationFeed({
      lat,
      lng,
      limit: WALL_INITIAL_LIMIT,
      summary: true,
    });
    console.log('[wall-recommend] 原始响应:', JSON.stringify(res).substring(0, 500));
    const data = res?.data ?? res;
    console.log('[wall-recommend] 解析data:', JSON.stringify(data).substring(0, 500));
    const rawList = data?.stories ?? [];
    console.log('[wall-recommend] stories数量:', rawList.length);
    const stories = rawList
      .map((s) => normalizeStoryForMap(s))
      .filter(Boolean);
    console.log('[wall-recommend] normalize后数量:', stories.length);
    tab.items = stories;
    tab.page = 1;
    tab.totalPages = data?.pagination?.totalPages ?? 1;
    tab.hasMore = tab.page < tab.totalPages;
    tab.initialLoadDone = true;
  } catch (e) {
    console.error('[wall-recommend] load failed:', e);
    tab.error = '加载失败';
    tab.initialLoadDone = true;
  } finally {
    tab.loading = false;
  }
}

// 加载更多（下滑触发）
async function loadWallMore(tabName) {
  const tab = wallTabs.value[tabName];
  if (tab.loadingMore || !tab.hasMore || tab.loading) return;
  tab.loadingMore = true;
  try {
    const center =
      extractCoordinates(mapStore.center) ||
      extractCoordinates(mapStore.userLocation);
    const lat = center?.latitude;
    const lng = center?.longitude;
    const nextPage = tab.page + 1;

    let stories = [];
    if (tabName === 'featured') {
      const res = await storyApi.getFeaturedStories({
        page: nextPage,
        limit: WALL_PAGE_SIZE,
        summary: true,
      });
      const data = res?.data ?? res;
      stories = (data?.stories ?? [])
        .map((s) => normalizeStoryForMap(s))
        .filter(Boolean);
      tab.totalPages = data?.pagination?.totalPages ?? tab.totalPages;
    } else if (tabName === 'recommend') {
      const res = await mapApi.getRecommendationFeed({
        lat,
        lng,
        page: nextPage,
        limit: WALL_PAGE_SIZE,
        summary: true,
      });
      const data = res?.data ?? res;
      stories = (data?.stories ?? [])
        .map((s) => normalizeStoryForMap(s))
        .filter(Boolean);
      tab.totalPages = data?.pagination?.totalPages ?? tab.totalPages;
    }

    if (stories.length > 0) {
      tab.items = [...tab.items, ...stories];
      tab.page = nextPage;
      tab.hasMore = nextPage < tab.totalPages;
    } else {
      tab.hasMore = false;
    }

    // 缓存溢出淘汰：移除最旧的条目
    if (tab.items.length > WALL_MAX_CACHE) {
      const excess = tab.items.length - WALL_MAX_CACHE;
      tab.items = tab.items.slice(excess);
    }
  } catch (e) {
    console.error(`[wall-${tabName}] loadMore failed:`, e);
  } finally {
    tab.loadingMore = false;
  }
}

// 点击 Grid 卡片 → 打开故事详情弹窗
// watcher (hydrateSelectedStoryDetail) 会自动获取完整数据
function handleWallCardSelect(story) {
  if (!story?.id) return;
  openStoryModal(story, 0, {
    directOpen: true,
    startPosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  });
}

// 滚动事件处理：检测接近底部 + 返回顶部按钮
const sidebarContentRef = ref(null);
const showWallBackToTop = ref(false);

function handleWallScroll(e, tabName) {
  const el = e.target;
  if (!el) return;
  const threshold = 200;
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (scrollHeight - scrollTop - clientHeight < threshold) {
    loadWallMore(tabName);
  }
  showWallBackToTop.value = scrollTop > 120;
}

function scrollWallToTop() {
  sidebarContentRef.value?.scrollTo({ top: 0, behavior: 'smooth' });
  showWallBackToTop.value = false;
}

// 个人主页面板滚动：返回顶部按钮（我的主页 + 他人主页共用）
const showProfileBackToTop = ref(false);
let profileLastScrollTop = 0;

function handleProfileScroll(e) {
  const el = e.target;
  if (!el) return;

  // 限制滚动范围：不允许超出内容 + 60px 底部留白
  const maxScrollTop = el.scrollHeight - el.clientHeight;
  if (el.scrollTop > maxScrollTop) {
    el.scrollTop = maxScrollTop;
  }

  const scrollTop = el.scrollTop;
  showProfileBackToTop.value = scrollTop > 120;
  profileLastScrollTop = scrollTop;
}

function scrollProfileToTop(targetRef) {
  targetRef?.scrollTo({ top: 0, behavior: 'smooth' });
  profileLastScrollTop = 0;
  showProfileBackToTop.value = false;
}

function resetProfileScrollState() {
  profileLastScrollTop = 0;
  showProfileBackToTop.value = false;
}

// 搜索面板打开/关闭时连接/断开搜索虚拟滚动（移至搜索 VS 实例声明后）

// Feed 区域在 recommend tab 激活时连接
watch(sidebarTab, (tab) => {
  showWallBackToTop.value = false;
  if (tab === 'recommend') {
    nextTick(() => feedVScrollConnect());
  } else {
    feedVScrollDisconnect();
  }
});

const storyCommentComposerOpen = ref(false);
const storyCommentDraft = ref("");
const storyCommentSubmitting = ref(false);
const storyComments = ref([]);
const storyCommentsLoading = ref(false);
const storyLikeCount = ref(0);
const storyIsLiked = ref(false);
const storyLikePending = ref(false);
const storyIsFavorited = ref(false);
const storyFavoriteCount = ref(0);
const storyFavoritePending = ref(false);

// --- 搜索框状态 ---
const searchKeyword = ref('');
const searchFocused = ref(false);
const searchTab = ref('story');
const searchResults = ref([]);
const searchLoading = ref(false);
const searchLoadingMore = ref(false);
const searchAnimationKey = ref(0); // 搜索结果入场动画触发
const searchHasMore = ref(false);
const searchPage = ref(1);
const searchPageSize = 10;
const searchStorySearched = ref(false);
const searchUserLoading = ref(false);
const searchUserSearched = ref(false);
const searchUserResults = ref([]);
const searchUserPage = ref(1);
const searchUserHasMore = ref(false);
const searchUserLoadingMore = ref(false);
const searchUserPageSize = 20;
const searchedUser = ref(null);
const searchedUserStories = ref([]);
const searchUserDetailOpen = ref(false);

// 他人主页虚拟滚动
const {
  containerRef: userDetailVScrollContainerRef,
  totalHeight: userDetailVScrollTotalHeight,
  visibleItems: userDetailVScrollVisibleItems,
  connect: userDetailVScrollConnect,
  disconnect: userDetailVScrollDisconnect,
  scheduleMeasure: userDetailVScrollScheduleMeasure,
  flushMeasurements: userDetailVScrollFlushMeasurements,
} = useVirtualScroll({
  itemList: searchedUserStories,
  estimatedHeight: 160,
  gap: 12,
  bufferCount: 4,
});

const userDetailVScrollItemRefs = ref([]);

watch(userDetailVScrollItemRefs, (refs) => {
  if (!refs || refs.length === 0) return;
  for (let el of refs) {
    if (el && el.$el) el = el.$el;
    if (el && el.dataset) {
      const idx = parseInt(el.dataset.virtualIndex, 10);
      if (!isNaN(idx)) {
        userDetailVScrollScheduleMeasure(idx, el);
      }
    }
  }
}, { flush: 'post', deep: true });

watch(userDetailVScrollVisibleItems, () => {
  nextTick(() => { userDetailVScrollFlushMeasurements(); });
}, { flush: 'post' });

// ========== 个人主页搜索（左侧弹窗）==========

// --- 他人主页搜索 ---
const userDetailSearchQuery = ref('');
const userDetailSearchActive = ref(false);
const userDetailSearchInputRef = ref(null);
let userDetailSearchActiveTimer = null;
const userDetailSearchResults = computed(() => {
  const query = userDetailSearchQuery.value.trim().toLowerCase();
  if (!query) return [];
  return searchedUserStories.value.filter(s => s.content && s.content.toLowerCase().includes(query));
});

const {
  containerRef: userDetailSearchVScrollContainerRef,
  totalHeight: userDetailSearchVScrollTotalHeight,
  visibleItems: userDetailSearchVScrollVisibleItems,
  connect: userDetailSearchVScrollConnect,
  disconnect: userDetailSearchVScrollDisconnect,
  scheduleMeasure: userDetailSearchVScrollScheduleMeasure,
  flushMeasurements: userDetailSearchVScrollFlushMeasurements,
} = useVirtualScroll({
  itemList: userDetailSearchResults,
  estimatedHeight: 160,
  gap: 12,
  bufferCount: 4,
});

const userDetailSearchVScrollItemRefs = ref([]);

watch(userDetailSearchVScrollItemRefs, (refs) => {
  if (!refs || refs.length === 0) return;
  for (let el of refs) {
    if (el && el.$el) el = el.$el;
    if (el && el.dataset) {
      const idx = parseInt(el.dataset.virtualIndex, 10);
      if (!isNaN(idx)) userDetailSearchVScrollScheduleMeasure(idx, el);
    }
  }
}, { flush: 'post', deep: true });

watch(userDetailSearchVScrollVisibleItems, () => {
  nextTick(() => { userDetailSearchVScrollFlushMeasurements(); });
}, { flush: 'post' });

watch(userDetailSearchQuery, (val) => {
  if (val.trim()) {
    if (userDetailSearchActiveTimer) { clearTimeout(userDetailSearchActiveTimer); userDetailSearchActiveTimer = null; }
    nextTick(() => userDetailSearchVScrollConnect());
  } else {
    userDetailSearchVScrollDisconnect();
  }
});

function handleUserDetailSearchBlur() {
  nextTick(() => {
    if (!userDetailSearchQuery.value.trim()) {
      userDetailSearchActiveTimer = setTimeout(() => {
        userDetailSearchActive.value = false;
        userDetailSearchActiveTimer = null;
      }, 300);
    }
  });
}

// --- 我的主页搜索 ---
const myProfileSearchQuery = ref('');
const myProfileSearchActive = ref(false);
const myProfileSearchInputRef = ref(null);
let myProfileSearchActiveTimer = null;
const myProfileSearchResults = computed(() => {
  const query = myProfileSearchQuery.value.trim().toLowerCase();
  if (!query) return [];
  return currentVirtualList.value.filter(s => s.content && s.content.toLowerCase().includes(query));
});

const {
  containerRef: myProfileSearchVScrollContainerRef,
  totalHeight: myProfileSearchVScrollTotalHeight,
  visibleItems: myProfileSearchVScrollVisibleItems,
  connect: myProfileSearchVScrollConnect,
  disconnect: myProfileSearchVScrollDisconnect,
  scheduleMeasure: myProfileSearchVScrollScheduleMeasure,
  flushMeasurements: myProfileSearchVScrollFlushMeasurements,
} = useVirtualScroll({
  itemList: myProfileSearchResults,
  estimatedHeight: 160,
  gap: 12,
  bufferCount: 4,
});

const myProfileSearchVScrollItemRefs = ref([]);

watch(myProfileSearchVScrollItemRefs, (refs) => {
  if (!refs || refs.length === 0) return;
  for (let el of refs) {
    if (el && el.$el) el = el.$el;
    if (el && el.dataset) {
      const idx = parseInt(el.dataset.virtualIndex, 10);
      if (!isNaN(idx)) myProfileSearchVScrollScheduleMeasure(idx, el);
    }
  }
}, { flush: 'post', deep: true });

watch(myProfileSearchVScrollVisibleItems, () => {
  nextTick(() => { myProfileSearchVScrollFlushMeasurements(); });
}, { flush: 'post' });

watch(myProfileSearchQuery, (val) => {
  if (val.trim()) {
    if (myProfileSearchActiveTimer) { clearTimeout(myProfileSearchActiveTimer); myProfileSearchActiveTimer = null; }
    nextTick(() => myProfileSearchVScrollConnect());
  } else {
    myProfileSearchVScrollDisconnect();
  }
});

function handleMyProfileSearchBlur() {
  nextTick(() => {
    if (!myProfileSearchQuery.value.trim()) {
      myProfileSearchActiveTimer = setTimeout(() => {
        myProfileSearchActive.value = false;
        myProfileSearchActiveTimer = null;
      }, 300);
    }
  });
}

// --- 地点搜索状态 ---
const searchPlaceResults = ref([]);
const searchPlaceLoading = ref(false);
const searchPlaceError = ref('');
const searchPlaceSearched = ref(false);

// ========== 纸飞机附近故事面板 ==========
const showPlaneNearby = ref(false);
const planeNearbyLoading = ref(false);
const planeNearbyLoadingMore = ref(false);
const planeNearbyItems = ref([]);
const planeNearbyPage = ref(0);
const planeNearbyTotalPages = ref(1);
const planeNearbyHasMore = computed(
  () => planeNearbyPage.value < planeNearbyTotalPages.value,
);
const planeNearbyError = ref(null);
const planeNearbyInitialDone = ref(false);
const planePosition = ref(null); // { latitude, longitude }

// ========== 搜索故事虚拟滚动 ==========
const searchVScrollItemRefs = ref([]);
const {
  containerRef: searchVScrollContainerRef,
  totalHeight: searchVScrollTotalHeight,
  visibleItems: searchVScrollVisibleItems,
  connect: searchVScrollConnect,
  disconnect: searchVScrollDisconnect,
  scheduleMeasure: searchVScrollScheduleMeasure,
  flushMeasurements: searchVScrollFlushMeasurements,
} = useVirtualScroll({
  itemList: computed(() => searchResults.value),
  estimatedHeight: 130,
  gap: 8,
  bufferCount: 4,
  onNearBottom: () => loadSearchResults(true),
});

watch(searchVScrollItemRefs, (refs) => {
  if (!refs || refs.length === 0) return;
  for (let el of refs) {
    if (el && el.$el) el = el.$el;
    if (el && el.dataset) {
      const idx = parseInt(el.dataset.searchStoryIndex, 10);
      if (!isNaN(idx)) searchVScrollScheduleMeasure(idx, el);
    }
  }
}, { flush: 'post', deep: true });

watch(searchVScrollVisibleItems, () => {
  nextTick(() => { searchVScrollFlushMeasurements(); });
}, { flush: 'post' });

// ========== 搜索用户虚拟滚动 ==========
const userSearchVScrollItemRefs = ref([]);
const {
  containerRef: userSearchVScrollContainerRef,
  totalHeight: userSearchVScrollTotalHeight,
  visibleItems: userSearchVScrollVisibleItems,
  connect: userSearchVScrollConnect,
  disconnect: userSearchVScrollDisconnect,
  scheduleMeasure: userSearchVScrollScheduleMeasure,
  flushMeasurements: userSearchVScrollFlushMeasurements,
} = useVirtualScroll({
  itemList: computed(() => searchUserResults.value),
  estimatedHeight: 68,
  gap: 0,
  bufferCount: 6,
  onNearBottom: () => performUserSearch(searchKeyword.value.trim(), true),
});

watch(userSearchVScrollItemRefs, (refs) => {
  if (!refs || refs.length === 0) return;
  for (let el of refs) {
    if (el && el.$el) el = el.$el;
    if (el && el.dataset) {
      const idx = parseInt(el.dataset.searchUserIndex, 10);
      if (!isNaN(idx)) userSearchVScrollScheduleMeasure(idx, el);
    }
  }
}, { flush: 'post', deep: true });

watch(userSearchVScrollVisibleItems, () => {
  nextTick(() => { userSearchVScrollFlushMeasurements(); });
}, { flush: 'post' });

// 搜索面板打开/关闭时连接/断开搜索虚拟滚动
watch(searchFocused, (focused) => {
  if (focused) {
    nextTick(() => {
      searchVScrollConnect();
      userSearchVScrollConnect();
    });
  } else {
    searchVScrollDisconnect();
    userSearchVScrollDisconnect();
  }
});

const showSearchPanel = computed(() => {
  return searchFocused.value;
});

function clearSearch() {
  searchKeyword.value = '';
  searchResults.value = [];
  searchHasMore.value = false;
  searchStorySearched.value = false;
  searchUserSearched.value = false;
  searchUserResults.value = [];
  searchUserPage.value = 1;
  searchUserHasMore.value = false;
  searchUserLoadingMore.value = false;
  searchedUser.value = null;
  searchedUserStories.value = [];
  searchUserDetailOpen.value = false;
  searchPlaceResults.value = [];
  searchPlaceLoading.value = false;
  searchPlaceError.value = '';
  searchPlaceSearched.value = false;
}

function switchSearchTab(tab) {
  if (searchTab.value === tab) return;
  searchTab.value = tab;
  const keyword = searchKeyword.value.trim();
  if (!keyword) return;
  if (tab === 'place') {
    performGlobalPlaceSearch(keyword);
  } else if (tab === 'story') {
    loadSearchResults(false);
  } else {
    performUserSearch(keyword, false);
  }
}

let searchDebounceTimer = null;
watch(searchKeyword, (keyword) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    if (searchTab.value === 'place') {
      performGlobalPlaceSearch(trimmed);
    } else if (searchTab.value === 'story') {
      loadSearchResults(false);
    } else {
      performUserSearch(trimmed, false);
    }
  }, 350);
});

const storyReportPanelOpen = ref(false);
const selectedStoryReportReason = ref("");
const storyReportDescription = ref("");
const storyReportError = ref("");
const storyReportSubmitting = ref(false);
const storyReportReasons = REPORT_TYPES;
let storyOpenTimer = null;
let activeStoryRequestToken = 0;

const storyAuthorName = computed(() =>
  firstNonEmptyString(
    selectedStory.value?.username,
    selectedStory.value?.author,
    "匿名用户",
  ),
);
const storyAuthorInitial = computed(
  () => storyAuthorName.value.slice(0, 1).toUpperCase() || "匿",
);
const storyAuthorAvatar = computed(() =>
  firstNonEmptyString(selectedStory.value?.avatar),
);
const storyPrimaryImage = computed(() =>
  Array.isArray(selectedStory.value?.images)
    ? selectedStory.value.images[0] || ""
    : "",
);
const storyGalleryImages = computed(() =>
  Array.isArray(selectedStory.value?.images)
    ? selectedStory.value.images.slice(1)
    : [],
);
const storyDisplayLocation = computed(() =>
  selectedStory.value ? getStoryLocationText(selectedStory.value) : "未知地点",
);
const storyCommentCount = computed(() => {
  const fromList = Array.isArray(storyComments.value)
    ? storyComments.value.length
    : 0;
  const fromStory = Number(
    selectedStory.value?.commentCount ??
      selectedStory.value?.comments?.length ??
      0,
  );
  return Math.max(fromList, Number.isFinite(fromStory) ? fromStory : 0);
});
const storyTarotKicker = computed(() => {
  if (selectedStory.value?.isFeatured) {
    return "精选秘牌";
  }
  if (selectedStory.value?.isPinned) {
    return "置顶回响";
  }
  return "故事显影";
});
const storyTarotTitle = computed(() => {
  const locationText = storyDisplayLocation.value;
  return locationText && locationText !== "未知地点"
    ? locationText
    : "回响之牌";
});
const storyTarotSuit = computed(() => {
  const emotion = firstNonEmptyString(
    selectedStory.value?.emotionTag,
    selectedStory.value?.emotion,
  );

  if (emotion.includes("喜") || emotion.includes("乐")) {
    return "♦";
  }
  if (emotion.includes("伤") || emotion.includes("悲")) {
    return "♥";
  }
  if (emotion.includes("怒") || emotion.includes("躁")) {
    return "♠";
  }
  return "✦";
});

watch(
  () => selectedStory.value?.id ?? null,
  (storyId) => {
    activeStoryRequestToken += 1;
    const requestToken = activeStoryRequestToken;
    resetStoryOverlayState();

    if (!storyId || !selectedStory.value) {
      return;
    }

    storyLikeCount.value = Number(
      selectedStory.value.likeCount ?? selectedStory.value.likes ?? 0,
    );
    storyIsLiked.value = Boolean(selectedStory.value.isLiked);
    storyIsFavorited.value = Boolean(selectedStory.value.isFavorited);
    storyComments.value = normalizeStoryComments(selectedStory.value.comments);
    void hydrateSelectedStoryDetail(selectedStory.value, requestToken);
  },
);

function resetStoryOverlayState() {
  storyCommentComposerOpen.value = false;
  storyCommentDraft.value = "";
  storyCommentSubmitting.value = false;
  storyComments.value = [];
  storyCommentsLoading.value = false;
  storyLikeCount.value = 0;
  storyIsLiked.value = false;
  storyLikePending.value = false;
  storyIsFavorited.value = false;
  storyFavoriteCount.value = 0;
  storyFavoritePending.value = false;
  storyReportPanelOpen.value = false;
  selectedStoryReportReason.value = "";
  storyReportDescription.value = "";
  storyReportError.value = "";
  storyReportSubmitting.value = false;
}

function normalizeStoryComment(comment) {
  if (!comment || typeof comment !== "object") {
    return null;
  }

  const commentUser =
    comment.user && typeof comment.user === "object" ? comment.user : null;
  const author = firstNonEmptyString(
    commentUser?.username,
    comment.author,
    "匿名用户",
  );

  return {
    id: comment.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: commentUser?.id ?? comment.userId ?? null,
    author,
    avatar: firstNonEmptyString(commentUser?.avatar, comment.avatar),
    vip: Boolean(commentUser?.vip ?? false),
    content: firstNonEmptyString(comment.content),
    createdAt: comment.createdAt || new Date().toISOString(),
    commentBg: commentUser?.commentBg ?? comment.commentBg ?? null,
    fontFamily: comment.fontFamily || '',
    fontEffect: comment.fontEffect || '',
  };
}

function normalizeStoryComments(comments) {
  if (!Array.isArray(comments)) {
    return [];
  }

  return comments
    .map((comment) => normalizeStoryComment(comment))
    .filter(Boolean);
}

function getCommentInitial(author) {
  return firstNonEmptyString(author, "匿").slice(0, 1).toUpperCase();
}

function closeStoryReportPanel() {
  storyReportPanelOpen.value = false;
  selectedStoryReportReason.value = "";
  storyReportDescription.value = "";
  storyReportError.value = "";
}

function normalizeStoryIdKey(storyId) {
  if (storyId === undefined || storyId === null) {
    return null;
  }

  return typeof storyId === "bigint"
    ? storyId.toString()
    : String(storyId).trim();
}

function mutateStoryReference(target, storyId, mutate) {
  if (!target || typeof target !== "object") {
    return false;
  }

  const normalizedStoryId = normalizeStoryIdKey(storyId);
  if (!normalizedStoryId) {
    return false;
  }

  if (normalizeStoryIdKey(target.id) === normalizedStoryId) {
    mutate(target);
    return true;
  }

  if (
    target.story &&
    typeof target.story === "object" &&
    normalizeStoryIdKey(target.story.id) === normalizedStoryId
  ) {
    mutate(target.story);
    return true;
  }

  return false;
}

function syncStoryAcrossCollections(storyId, mutate) {
  const collections = [
    stories,
    feedStories,
    featuredStories,
    favoritesList,
    likesList,
    postsList,
    searchResults,
  ];

  collections.forEach((collection) => {
    if (!Array.isArray(collection.value)) {
      return;
    }

    collection.value.forEach((item) => {
      mutateStoryReference(item, storyId, mutate);
    });
  });

  mutateStoryReference(selectedStory.value, storyId, mutate);
}

function syncCurrentUserProfileAcrossStories(nextUser) {
  const normalizedUserId = normalizeStoryIdKey(
    nextUser?.id ?? userStore.user?.id,
  );
  if (!normalizedUserId) {
    return;
  }

  const nextUsername = firstNonEmptyString(nextUser?.username, nextUser?.name);
  const nextAvatar = firstNonEmptyString(nextUser?.avatar, nextUser?.avatarUrl);
  const collections = [
    stories,
    feedStories,
    featuredStories,
    favoritesList,
    likesList,
    postsList,
    searchResults,
  ];

  const applyUserProfile = (story) => {
    if (!story || typeof story !== "object") {
      return;
    }

    const author = resolveStoryAuthor(story);
    const storyAuthorId = normalizeStoryIdKey(
      author.id ??
        story.author?.id ??
        story.user?.id ??
        story.authorId ??
        story.userId,
    );

    if (storyAuthorId !== normalizedUserId) {
      return;
    }

    if (nextUsername) {
      story.username = nextUsername;
    }

    if (nextAvatar) {
      story.avatar = nextAvatar;
    }

    const nextAuthor = {
      ...(story.author && typeof story.author === "object" ? story.author : {}),
      id:
        story.author?.id ??
        story.user?.id ??
        story.authorId ??
        story.userId ??
        nextUser?.id ??
        null,
      username: nextUsername || author.username,
      avatar: nextAvatar || author.avatar,
    };

    story.author = nextAuthor;

    if (story.user && typeof story.user === "object") {
      story.user = {
        ...story.user,
        id: story.user.id ?? nextAuthor.id,
        username: nextUsername || story.user.username || author.username,
        avatar:
          nextAvatar ||
          story.user.avatar ||
          story.user.avatarUrl ||
          author.avatar,
      };
    }
  };

  collections.forEach((collection) => {
    if (!Array.isArray(collection.value)) {
      return;
    }

    collection.value.forEach((item) => {
      const targetStory =
        item?.story && typeof item.story === "object" ? item.story : item;
      applyUserProfile(targetStory);
    });
  });

  applyUserProfile(selectedStory.value);
}

async function hydrateSelectedStoryDetail(story, requestToken) {
  const storyId = story?.id;
  if (!storyId) {
    return;
  }

  storyCommentsLoading.value = true;
  const detailFallbackAuthor = {
    id:
      story?.author?.id ??
      story?.user?.id ??
      story?.authorId ??
      story?.userId ??
      null,
    username: firstNonEmptyString(
      story?.username,
      typeof story?.author === "string" ? story.author : "",
      story?.author?.username,
    ),
    avatar: firstNonEmptyString(story?.avatar, story?.author?.avatar),
  };

  const tasks = [
    storyApi.getStoryById(storyId),
    commentApi.getStoryComments(storyId, { page: 1, limit: 20 }),
  ];

  if (userStore.isLoggedIn && !userStore.isGuest) {
    tasks.push(likeApi.check(storyId));
  } else {
    tasks.push(Promise.resolve(null));
  }

  if (userStore.isLoggedIn && !userStore.isGuest) {
    tasks.push(favoriteApi.check(storyId));
  } else {
    tasks.push(Promise.resolve(null));
  }

  tasks.push(favoriteApi.getCount(storyId));

  try {
    const [
      detailResult,
      commentsResult,
      likeResult,
      favoriteResult,
      favCountResult,
    ] = await Promise.allSettled(tasks);
    if (
      requestToken !== activeStoryRequestToken ||
      normalizeStoryIdKey(selectedStory.value?.id) !==
        normalizeStoryIdKey(storyId)
    ) {
      return;
    }

    if (detailResult.status === "fulfilled" && detailResult.value) {
      const detailData = detailResult.value?.data ?? detailResult.value;
      const normalizedDetail = normalizeUserPanelStory(
        detailData,
        detailFallbackAuthor,
      );

      if (normalizedDetail) {
        const nextLikeCount = Number(
          normalizedDetail.likeCount ?? normalizedDetail.likes ?? 0,
        );
        const detailAuthor = resolveStoryAuthor(
          normalizedDetail,
          detailFallbackAuthor,
        );
        syncStoryAcrossCollections(storyId, (item) => {
          const existingLocationLabel = pickLocationText(
            [
              item.location?.address,
              item.location?.formattedAddress,
              item.location?.name,
              item.locationName,
            ],
            false,
          );
          const detailLocationLabel = pickLocationText(
            [
              normalizedDetail.location?.address,
              normalizedDetail.location?.formattedAddress,
              normalizedDetail.location?.name,
              normalizedDetail.locationName,
            ],
            false,
          );

          item.content = firstNonEmptyString(
            normalizedDetail.content,
            item.content,
          );
          item.createdAt = normalizedDetail.createdAt || item.createdAt;
          item.username = firstNonEmptyString(
            detailAuthor.username,
            item.username,
            getStoryAuthorName(item),
          );
          item.avatar = firstNonEmptyString(
            detailAuthor.avatar,
            item.avatar,
            item.author?.avatar,
          );
          item.author = {
            ...(item.author && typeof item.author === "object"
              ? item.author
              : {}),
            id: detailAuthor.id ?? item.author?.id ?? null,
            username: item.username,
            avatar: item.avatar,
          };
          item.images = Array.isArray(normalizedDetail.images)
            ? normalizedDetail.images
            : item.images;
          item.emotion = firstNonEmptyString(
            normalizedDetail.emotion,
            item.emotion,
          );
          item.emotionTag = firstNonEmptyString(
            normalizedDetail.emotionTag,
            item.emotionTag,
          );

          if (Number.isFinite(nextLikeCount)) {
            item.likes = nextLikeCount;
            item.likeCount = nextLikeCount;
          }

          if (
            normalizedDetail.location &&
            extractCoordinates(normalizedDetail.location)
          ) {
            item.location = buildNormalizedStoryLocation(
              normalizedDetail,
              extractCoordinates(normalizedDetail.location),
              existingLocationLabel ? item.location : null,
            );
          }

          if (detailLocationLabel) {
            item.locationName = detailLocationLabel;
          }

          if (typeof detailData?.isFeatured === "boolean") {
            item.isFeatured = detailData.isFeatured;
          }

          if (typeof detailData?.isPinned === "boolean") {
            item.isPinned = detailData.isPinned;
          }
        });
      }
    }

    if (commentsResult.status === "fulfilled") {
      const commentsData = commentsResult.value?.data ?? commentsResult.value;
      const nextComments = normalizeStoryComments(commentsData?.comments);
      storyComments.value = nextComments;
      syncStoryAcrossCollections(storyId, (item) => {
        item.comments = nextComments;
        item.commentCount = nextComments.length;
      });
    }

    if (likeResult.status === "fulfilled" && likeResult.value) {
      const likeData = likeResult.value?.data ?? likeResult.value;
      storyIsLiked.value = Boolean(likeData?.isLiked);
      syncStoryAcrossCollections(storyId, (item) => {
        item.isLiked = storyIsLiked.value;
      });
    }

    if (favoriteResult.status === "fulfilled" && favoriteResult.value) {
      const favoriteData = favoriteResult.value?.data ?? favoriteResult.value;
      storyIsFavorited.value = Boolean(favoriteData?.isFavorited);
      syncStoryAcrossCollections(storyId, (item) => {
        item.isFavorited = storyIsFavorited.value;
      });
    }

    if (favCountResult.status === "fulfilled" && favCountResult.value) {
      const favCountData = favCountResult.value?.data ?? favCountResult.value;
      const count = Number(favCountData?.favoriteCount ?? 0);
      storyFavoriteCount.value = Number.isFinite(count) ? count : 0;
      syncStoryAcrossCollections(storyId, (item) => {
        item.favoriteCount = storyFavoriteCount.value;
      });
    }
  } catch (error) {
    console.error("加载故事详情失败:", error);
  } finally {
    if (
      requestToken === activeStoryRequestToken &&
      normalizeStoryIdKey(selectedStory.value?.id) ===
        normalizeStoryIdKey(storyId)
    ) {
      storyCommentsLoading.value = false;
    }
  }
}

function openStoryModal(story, delay = 0, options = {}) {
  if (!story) {
    return;
  }

  const { directOpen = true, startPosition = null } = options;

  clearTimeout(storyOpenTimer);
  const show = () => {
    storyOpenTimer = null;
    storyDirectOpen.value = directOpen;
    if (startPosition) {
      storyStartPosition.value = startPosition;
    } else {
      storyStartPosition.value = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
    }
    selectedStory.value = story;
    void hydrateStoryLocations([story]);
  };

  if (delay > 0) {
    storyOpenTimer = setTimeout(show, delay);
    return;
  }

  show();
}

function openStoryFromCollection(story) {
  if (!story) {
    return;
  }

  // 时光胶囊未解锁时，提示用户
  const isLocked = story.isTimeCapsule && !(story.isUnlocked === true);
  if (isLocked) {
    showToast("时光胶囊未解锁，请等待解锁时间到来", "warning");
    return;
  }

  searchUserDetailOpen.value = false;

  const coords =
    extractCoordinates(story.location) || extractCoordinates(story);
  const shouldAnimateAfterMove = Boolean(coords);

  if (coords) {
    suppressMapReloadUntil = Date.now() + 1200;
    mapStore.updateCenter(coords.latitude, coords.longitude);
    mapStore.updateZoom(16);
  }

  openStoryModal(
    story,
    shouldAnimateAfterMove ? STORY_MODAL_OPEN_DELAY_MS : 0,
    {
      directOpen: true,
      startPosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    },
  );
}

async function toggleStoryLike() {
  if (!selectedStory.value) {
    return;
  }

  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast("请先登录后再点赞", "warning");
    return;
  }

  if (storyLikePending.value) {
    return;
  }

  const storyId = selectedStory.value.id;
  const previousLiked = storyIsLiked.value;
  const previousCount = storyLikeCount.value;
  const nextLiked = !previousLiked;
  const nextCount = Math.max(0, previousCount + (nextLiked ? 1 : -1));

  storyLikePending.value = true;
  storyIsLiked.value = nextLiked;
  storyLikeCount.value = nextCount;
  handleStoryLike({
    storyId,
    liked: nextLiked,
    likeCount: nextCount,
    previousLiked,
  });

  try {
    const response = await likeApi.toggle(storyId);
    const result = response?.data ?? response;
    const resolvedLiked =
      typeof result?.isLiked === "boolean" ? result.isLiked : nextLiked;
    const resolvedLikeCount = Number.isFinite(Number(result?.likeCount))
      ? Number(result.likeCount)
      : nextCount;

    storyIsLiked.value = resolvedLiked;
    storyLikeCount.value = resolvedLikeCount;
    handleStoryLike({
      storyId,
      liked: resolvedLiked,
      likeCount: resolvedLikeCount,
      previousLiked: nextLiked,
    });
  } catch (error) {
    console.error("点赞失败:", error);
    storyIsLiked.value = previousLiked;
    storyLikeCount.value = previousCount;
    handleStoryLike({
      storyId,
      liked: previousLiked,
      likeCount: previousCount,
      previousLiked: nextLiked,
    });
    showToast(error.message || "点赞失败，请重试", "error");
  } finally {
    storyLikePending.value = false;
  }
}

async function toggleStoryFavorite() {
  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast("请先登录后再收藏", "warning");
    return;
  }
  if (storyFavoritePending.value) return;

  const storyId = selectedStory.value.id;
  const previousFavorited = storyIsFavorited.value;
  const previousFavoriteCount = storyFavoriteCount.value;

  storyFavoritePending.value = true;
  storyIsFavorited.value = !previousFavorited;
  handleStoryFavorite({
    storyId,
    favorited: !previousFavorited,
    favoriteCount: previousFavoriteCount + (!previousFavorited ? 1 : -1),
    previousFavorited,
  });

  try {
    const response = await favoriteApi.toggle(storyId);
    const result = response?.data ?? response;
    const resolvedFavorited =
      typeof result?.isFavorited === "boolean"
        ? result.isFavorited
        : !previousFavorited;
    storyIsFavorited.value = resolvedFavorited;
    handleStoryFavorite({
      storyId,
      favorited: resolvedFavorited,
      favoriteCount: previousFavoriteCount + (resolvedFavorited ? 1 : -1),
      previousFavorited: !previousFavorited,
    });

    try {
      const countResp = await favoriteApi.getCount(storyId);
      const countData = countResp?.data ?? countResp;
      const count = Number(countData?.favoriteCount ?? 0);
      if (Number.isFinite(count)) {
        storyFavoriteCount.value = count;
        syncStoryAcrossCollections(storyId, (item) => {
          item.favoriteCount = count;
        });
      }
    } catch (_e) {}
  } catch (error) {
    console.error("收藏操作失败:", error);
    storyIsFavorited.value = previousFavorited;
    storyFavoriteCount.value = previousFavoriteCount;
    handleStoryFavorite({
      storyId,
      favorited: previousFavorited,
      favoriteCount: previousFavoriteCount,
      previousFavorited: !previousFavorited,
    });
    showToast(error.message || "收藏操作失败，请重试", "error");
  } finally {
    storyFavoritePending.value = false;
  }
}

async function submitStoryComment() {
  const storyId = selectedStory.value?.id;
  const content = storyCommentDraft.value.trim();

  if (!storyId || !content) {
    return;
  }

  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast("请先登录后再评论", "warning");
    return;
  }

  if (storyCommentSubmitting.value) {
    return;
  }

  storyCommentSubmitting.value = true;
  try {
    let fontFamily = '';
    let fontEffect = '';
    const fontMatch = document.cookie.match(/(?:^|;\s*)vip_default_font=([^;]*)/);
    if (fontMatch) fontFamily = decodeURIComponent(fontMatch[1]);
    const effectMatch = document.cookie.match(/(?:^|;\s*)vip_default_font_effect=([^;]*)/);
    if (effectMatch) fontEffect = decodeURIComponent(effectMatch[1]);
    const fontOptions = {};
    if (fontFamily) fontOptions.fontFamily = fontFamily;
    if (fontEffect) fontOptions.fontEffect = fontEffect;
    const response = await commentApi.create(storyId, content, fontOptions);
    const data = response?.data ?? response;
    const newComment = normalizeStoryComment({
      ...(data?.data ?? data),
      content,
      fontFamily,
      fontEffect,
      user: {
        username: userStore.user?.username,
        avatar: userStore.user?.avatar,
        vip: userStore.user?.vip || 0,
        commentBg: vipStore.savedCommentBg ?? null,
      },
    });

    storyComments.value = [newComment, ...storyComments.value];
    handleStoryComment({ storyId, comment: newComment });
    storyCommentDraft.value = "";
    storyCommentComposerOpen.value = false;
    if (selectedStory.value && normalizeStoryIdKey(selectedStory.value.id) === normalizeStoryIdKey(storyId)) {
      selectedStory.value = { ...selectedStory.value, comments: storyComments.value };
    }
  } catch (error) {
    console.error("评论失败:", error);
    showToast(error.message || "评论失败，请重试", "error");
  } finally {
    storyCommentSubmitting.value = false;
  }
}

async function handleSubmitCommentFromStory({ storyId, content, fontFamily, fontEffect }) {
  if (!storyId || !content) {
    return;
  }

  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast("请先登录后再评论", "warning");
    return;
  }

  if (storyCommentSubmitting.value) {
    return;
  }

  storyCommentSubmitting.value = true;
  try {
    const fontOptions = {};
    if (fontFamily) fontOptions.fontFamily = fontFamily;
    if (fontEffect) fontOptions.fontEffect = fontEffect;
    const response = await commentApi.create(storyId, content, fontOptions);
    const data = response?.data ?? response;
    const newComment = normalizeStoryComment({
      ...(data?.data ?? data),
      content,
      fontFamily,
      fontEffect,
      user: {
        username: userStore.user?.username,
        avatar: userStore.user?.avatar,
        vip: userStore.user?.vip || 0,
        commentBg: vipStore.savedCommentBg ?? null,
      },
    });

    storyComments.value = [newComment, ...storyComments.value];
    handleStoryComment({ storyId, comment: newComment });
    if (selectedStory.value && normalizeStoryIdKey(selectedStory.value.id) === normalizeStoryIdKey(storyId)) {
      selectedStory.value = { ...selectedStory.value, comments: storyComments.value };
    }
  } catch (error) {
    console.error("评论失败:", error);
    showToast(error.message || "评论失败，请重试", "error");
  } finally {
    storyCommentSubmitting.value = false;
  }
}

async function submitStoryReport() {
  if (!selectedStory.value?.id) {
    return;
  }

  if (!selectedStoryReportReason.value) {
    storyReportError.value = "请选择举报原因";
    return;
  }

  if (storyReportDescription.value.trim().length < 10) {
    storyReportError.value = "请至少输入 10 个字的举报说明";
    return;
  }

  storyReportSubmitting.value = true;
  storyReportError.value = "";

  try {
    await handleStoryReport({
      storyId: selectedStory.value.id,
      reason: selectedStoryReportReason.value,
      description: storyReportDescription.value.trim(),
    });
    closeStoryReportPanel();
  } catch (error) {
    storyReportError.value = error.message || "举报失败，请稍后再试";
  } finally {
    storyReportSubmitting.value = false;
  }
}

const dockActions = computed(() => [
  {
    key: "publish",
    tag: "Create Story",
    title: "发布故事",
    subtitle: "你有什么想说的？",
    description: "打开发布面板，把此刻的情绪和故事写进地图里。",
    icon: "✦",
    suit: "♠",
    cornerValue: "A",
    accent: "#ff7a59",
    accentSoft: "rgba(255, 122, 89, 0.24)",
    ink: isDarkMap.value ? "#eef3ff" : "#432013",
    visible: !showPublishSidebar.value && !showDockPublishSidebar.value,
    disabled: false,
    handler: handlePublishClick,
  },
  {
    key: "stories",
    tag: "Story Wall",
    title: "故事墙",
    subtitle: "打开故事墙，浏览精选故事",
    description: "打开故事墙，浏览精选故事和为你推荐。",
    icon: "✉",
    suit: "♥",
    cornerValue: "K",
    accent: "#5f7cff",
    accentSoft: "rgba(95, 124, 255, 0.25)",
    ink: isDarkMap.value ? "#eef3ff" : "#172042",
    visible: true,
    disabled: false,
    handler: handleStoriesClick,
  },
  {
    key: "random",
    tag: "Fate Draw",
    title: randomWalking.value ? "随机漫游中" : "随机漫游",
    subtitle: randomWalking.value ? "正在抽取新地点" : "抽一张未知地点",
    description: randomWalking.value
      ? "正在为你寻找新的落点，请稍等片刻。"
      : "随机去往一处新的位置，看看陌生角落里正在发生什么。",
    icon: "✧",
    suit: "♦",
    cornerValue: "Q",
    accent: "#f2a93b",
    accentSoft: "rgba(242, 169, 59, 0.24)",
    ink: isDarkMap.value ? "#eef3ff" : "#3e2811",
    visible: true,
    disabled: randomWalking.value,
    handler: handleRandomWalk,
  },
  {
    key: "footprints",
    tag: "My Footprints",
    title: "我的足迹",
    subtitle: "回放你的故事轨迹",
    description: "将你发布过的故事按时间顺序连成轨迹，在地图上重温每一段旅程。",
    icon: "🐾",
    suit: "♣",
    cornerValue: "J",
    accent: "#e8b86d",
    accentSoft: "rgba(232, 184, 109, 0.24)",
    ink: isDarkMap.value ? "#eef3ff" : "#3e2811",
    visible: true,
    disabled: false,
    handler: handleFootprints,
  },
  {
    key: "theme",
    tag: "Theme Atelier",
    title: "切换主题氛围",
    subtitle: "切换当前场景氛围",
    description: "在明亮、暗色与会员主题之间切换当前地图氛围。",
    icon: "☯",
    suit: "♥",
    cornerValue: "10",
    accent: "#8e6cff",
    accentSoft: "rgba(142, 108, 255, 0.24)",
    ink: isDarkMap.value ? "#eef3ff" : "#241a3f",
    visible: true,
    disabled: false,
    handler: () => {},
  },
  {
    key: "user",
    tag: "Profile",
    title: "我的信息",
    subtitle: "查看个人信息",
    description: "打开个人信息面板，查看头像、点赞、发布记录和账号设置。",
    icon: "◈",
    suit: "♠",
    cornerValue: "9",
    accent: "#35b4d8",
    accentSoft: "rgba(53, 180, 216, 0.24)",
    ink: isDarkMap.value ? "#eef3ff" : "#112b34",
    visible: true,
    disabled: false,
    handler: handleUserClick,
  },
  {
    key: "logout",
    tag: "System Exit",
    title: "退出登录",
    subtitle: userStore.isGuest ? "结束游客身份" : "返回首页",
    description: userStore.isGuest
      ? "结束当前游客体验并返回首页。"
      : "安全退出当前账号并返回首页。",
    icon: "↩",
    suit: "♣",
    cornerValue: "8",
    accent: "#e0677f",
    accentSoft: "rgba(224, 103, 127, 0.26)",
    ink: isDarkMap.value ? "#eef3ff" : "#341723",
    visible: true,
    disabled: false,
    handler: handleLogout,
  },
]);

const visibleDockActions = computed(() =>
  dockActions.value
    .filter((action) => action.visible)
    .map((action) => {
      if (action.key !== THEME_SELECTOR_CARD_KEY) {
        return action;
      }

      return {
        ...action,
        title:
          selectedThemeChoice.value === "vip"
            ? "会员主题"
            : selectedThemeChoice.value === "dark"
              ? "暗色主题"
              : "明亮主题",
        subtitle: "选择你想使用的主题",
        description: canUseVipTheme.value
          ? "你可以在这里切换你喜欢的主题：明、暗、会员专属。"
          : "你可以在这里切换你喜欢的主题：明、暗、会员专属。",
        icon: selectedThemeChoice.value === "vip" ? "✦" : "☯",
        accent: selectedThemeChoice.value === "vip" ? "#d6b36c" : "#8e6cff",
        accentSoft:
          selectedThemeChoice.value === "vip"
            ? "rgba(214, 179, 108, 0.3)"
            : "rgba(142, 108, 255, 0.24)",
        title: "切换主题",
        subtitle: action.subtitle,
        description: action.description,
        title: "切换主题氛围",
      };
    }),
);

const dockThemeOptions = computed(() => [
  {
    key: "light",
    type: "mode",
    icon: "☀️",
    label: "明亮主题",
    helper: "晨光琉璃",
    accent: "#c98c3d",
    accentSoft: "rgba(201, 140, 61, 0.24)",
    disabled: false,
    tooltip: "切换到明亮主题",
  },
  {
    key: "dark",
    type: "mode",
    icon: "🌙",
    label: "暗色主题",
    helper: "深空星幕",
    accent: "#79a6ff",
    accentSoft: "rgba(121, 166, 255, 0.24)",
    disabled: false,
    tooltip: "切换到暗色主题",
  },
  {
    key: "tarot",
    type: "theme",
    icon: "🔮",
    label: "塔罗牌",
    helper: "经典卡牌风格",
    accent: "#8e6cff",
    accentSoft: "rgba(142, 108, 255, 0.24)",
    disabled: false,
    tooltip: "切换到塔罗牌主题",
  },
  {
    key: "poker",
    type: "theme",
    icon: "🃏",
    label: "扑克牌",
    helper: "经典扑克风格",
    accent: "#e74c3c",
    accentSoft: "rgba(231, 76, 60, 0.24)",
    disabled: false,
    tooltip: "切换到扑克牌主题",
    requiresVip: true,
  },
  {
    key: "more",
    type: "more",
    icon: "✨",
    label: "更多主题",
    helper: "敬请期待",
    accent: "#aaa",
    accentSoft: "rgba(170, 170, 170, 0.24)",
    disabled: true,
    tooltip: "更多主题即将开放",
  },
]);

function isThemeOptionActive(option) {
  if (option.type === "mode") return option.key === selectedThemeChoice.value;
  if (option.type === "theme") return option.key === (usePokerTheme.value ? "poker" : "tarot");
  return false;
}

const themeDockSubmenuVisible = computed(
  () =>
    isDockExpanded.value &&
    selectedDockCard.value === THEME_SELECTOR_CARD_KEY &&
    !drawingDockCard.value &&
    !liftingDockCard.value &&
    !returningDockCard.value,
);

const activeDockAction = computed(() => {
  if (!isDockExpanded.value) {
    return null;
  }

  return (
    visibleDockActions.value.find(
      (action) => action.key === hoveredDockCard.value,
    ) || null
  );
});

const activeDockActionIndex = computed(() =>
  visibleDockActions.value.findIndex(
    (action) => action.key === hoveredDockCard.value,
  ),
);

const dockGapCardIndex = computed(() => {
  const gapKey =
    drawingDockCard.value || liftingDockCard.value || selectedDockCard.value;
  return visibleDockActions.value.findIndex((action) => action.key === gapKey);
});

function clearDockSelectionTimer() {
  if (dockSelectionTimer) {
    window.clearTimeout(dockSelectionTimer);
    dockSelectionTimer = null;
  }
}

function resetDockSelectionMotion() {
  clearDockSelectionTimer();
  selectedDockCard.value = "";
  drawingDockCard.value = "";
  liftingDockCard.value = "";
  returningDockCard.value = "";
}

function startDockReturn(key) {
  if (!key) {
    syncDockHoverSelection();
    return;
  }

  clearDockSelectionTimer();
  drawingDockCard.value = "";
  liftingDockCard.value = "";
  selectedDockCard.value = "";
  returningDockCard.value = key;

  dockSelectionTimer = window.setTimeout(() => {
    dockSelectionTimer = null;

    if (returningDockCard.value === key) {
      returningDockCard.value = "";
    }

    syncDockHoverSelection();
  }, DOCK_CARD_RETURN_MS);
}

function startDockDraw(key) {
  if (!key) {
    return;
  }

  clearDockSelectionTimer();
  drawingDockCard.value = key;
  liftingDockCard.value = "";
  selectedDockCard.value = "";
  returningDockCard.value = "";

  dockSelectionTimer = window.setTimeout(() => {
    dockSelectionTimer = null;

    if (hoveredDockCard.value !== key) {
      if (drawingDockCard.value === key || liftingDockCard.value === key) {
        startDockReturn(key);
      }
      return;
    }

    if (drawingDockCard.value === key) {
      drawingDockCard.value = "";
      liftingDockCard.value = key;

      dockSelectionTimer = window.setTimeout(() => {
        dockSelectionTimer = null;

        if (hoveredDockCard.value !== key) {
          if (liftingDockCard.value === key) {
            startDockReturn(key);
          }
          return;
        }

        if (liftingDockCard.value === key) {
          liftingDockCard.value = "";
          selectedDockCard.value = key;
        }
      }, DOCK_CARD_DRAW_MS);
    }
  }, DOCK_CARD_PREP_MS);
}

function syncDockHoverSelection() {
  if (!isDockExpanded.value || dockActionPending.value) {
    resetDockSelectionMotion();
    return;
  }

  const targetKey = hoveredDockCard.value;

  if (returningDockCard.value) {
    return;
  }

  if (drawingDockCard.value) {
    if (drawingDockCard.value === targetKey) {
      return;
    }

    startDockReturn(drawingDockCard.value);
    return;
  }

  if (liftingDockCard.value) {
    if (liftingDockCard.value === targetKey) {
      return;
    }

    startDockReturn(liftingDockCard.value);
    return;
  }

  if (selectedDockCard.value) {
    if (selectedDockCard.value === targetKey) {
      return;
    }

    startDockReturn(selectedDockCard.value);
    return;
  }

  if (targetKey) {
    startDockDraw(targetKey);
  }
}

function shouldRenderDockAnchor(key) {
  return (
    key === drawingDockCard.value ||
    key === liftingDockCard.value ||
    key === selectedDockCard.value ||
    key === returningDockCard.value
  );
}

watch(isDockExpanded, (expanded) => {
  if (dockHoverClearTimer) {
    window.clearTimeout(dockHoverClearTimer);
    dockHoverClearTimer = null;
  }

  hoveredDockCard.value = "";
  resetDockSelectionMotion();
});

watch(canUseVipTheme, (allowed) => {
  if (!allowed && mapTheme.value === "vip") {
    handleThemeChange("dark");
  }
});

watch(visibleDockActions, (actions) => {
  const keys = new Set(actions.map((action) => action.key));

  if (!keys.has(hoveredDockCard.value)) {
    hoveredDockCard.value = "";
  }

  if (!keys.has(selectedDockCard.value)) {
    selectedDockCard.value = "";
  }

  if (!keys.has(drawingDockCard.value)) {
    drawingDockCard.value = "";
  }

  if (!keys.has(liftingDockCard.value)) {
    liftingDockCard.value = "";
  }

  if (!keys.has(returningDockCard.value)) {
    returningDockCard.value = "";
  }

  syncDockHoverSelection();
});

function setDockHover(key) {
  if (isPickingPublishLocation.value) {
    return;
  }

  if (dockActionPending.value) {
    return;
  }

  if (dockHoverClearTimer) {
    window.clearTimeout(dockHoverClearTimer);
    dockHoverClearTimer = null;
  }

  if (
    hoveredDockCard.value === key &&
    (selectedDockCard.value === key ||
      drawingDockCard.value === key ||
      liftingDockCard.value === key)
  ) {
    return;
  }

  hoveredDockCard.value = key;
  syncDockHoverSelection();
}

function clearDockHover() {
  if (isPickingPublishLocation.value) {
    hoveredDockCard.value = "";
    return;
  }

  if (dockActionPending.value) {
    return;
  }

  if (dockHoverClearTimer) {
    window.clearTimeout(dockHoverClearTimer);
    dockHoverClearTimer = null;
  }

  hoveredDockCard.value = "";
  syncDockHoverSelection();
}

function getDockStickyHoverKey() {
  return selectedDockCard.value || liftingDockCard.value || "";
}

function getDockStickyHorizontalBounds(key) {
  if (!key) {
    return null;
  }

  const index = visibleDockActions.value.findIndex((action) => action.key === key);

  if (index < 0) {
    return null;
  }

  const { cardWidth, spreadX, hoverX } = getDockLayoutMetrics(
    index,
    visibleDockActions.value.length,
    key,
  );
  const horizontalTolerance = 4;

  return {
    left: Math.min(spreadX, hoverX) - horizontalTolerance,
    right: Math.max(spreadX, hoverX) + cardWidth + horizontalTolerance,
  };
}

function isPointerWithinDockStickyHorizontalBounds(key) {
  if (dockPointerX === null) {
    return false;
  }

  const bounds = getDockStickyHorizontalBounds(key);

  if (!bounds) {
    return false;
  }

  return dockPointerX >= bounds.left && dockPointerX <= bounds.right;
}

function handleDockStackPointerMove(event) {
  if (!dockCardStackRef.value) {
    return;
  }

  const rect = dockCardStackRef.value.getBoundingClientRect();
  dockPointerX = event.clientX - rect.left;

  const stickyHoverKey = getDockStickyHoverKey();

  if (!stickyHoverKey || hoveredDockCard.value !== stickyHoverKey) {
    return;
  }

  if (isPointerWithinDockStickyHorizontalBounds(stickyHoverKey)) {
    return;
  }

  hoveredDockCard.value = "";
  syncDockHoverSelection();
}

function scheduleClearDockHover() {
  if (isPickingPublishLocation.value) {
    hoveredDockCard.value = "";
    return;
  }

  if (dockActionPending.value) {
    return;
  }

  if (dockHoverClearTimer) {
    window.clearTimeout(dockHoverClearTimer);
  }

  dockHoverClearTimer = window.setTimeout(() => {
    const stickyHoverKey = getDockStickyHoverKey();
    const pointerStillInDockMenu = Boolean(dockMenuRef.value?.matches?.(":hover"));

    if (
      stickyHoverKey &&
      pointerStillInDockMenu &&
      isPointerWithinDockStickyHorizontalBounds(stickyHoverKey)
    ) {
      hoveredDockCard.value = stickyHoverKey;
      dockHoverClearTimer = null;
      syncDockHoverSelection();
      return;
    }

    hoveredDockCard.value = "";
    dockHoverClearTimer = null;
    syncDockHoverSelection();
  }, 90);
}

function handleDockCardClick(action) {
  if (isPickingPublishLocation.value) {
    return;
  }

  if (action.key === THEME_SELECTOR_CARD_KEY) {
    return;
  }

  if (action.disabled) {
    return;
  }

  if (dockActionPending.value) {
    return;
  }

  if (
    hoveredDockCard.value !== action.key ||
    selectedDockCard.value !== action.key ||
    drawingDockCard.value ||
    liftingDockCard.value ||
    returningDockCard.value
  ) {
    return;
  }

  dockActionPending.value = true;
  ripplingDockCard.value = action.key;

  window.setTimeout(() => {
    ripplingDockCard.value = "";
    dockActionPending.value = false;
    isDockExpanded.value = false;
    action.handler();
  }, 500);
}

function handleThemeOptionClick(option) {
  if (!option || dockActionPending.value) {
    return;
  }

  if (option.disabled) {
    showToast("更多主题即将开放，敬请期待", "info");
    return;
  }

  if (option.type === "mode") {
    handleThemeChange(option.key);
    return;
  }

  if (option.type === "theme") {
    if (VIP_THEME_KEYS.has(option.key) && !canUseVipTheme.value) {
      showToast("请升级会员后使用", "warning");
      return;
    }
    if (option.key === "tarot") {
      activeDockTheme.value = "tarot";
      usePokerTheme.value = false;
    } else if (VIP_THEME_KEYS.has(option.key)) {
      activeDockTheme.value = option.key;
      usePokerTheme.value = (option.key === "poker");
    }
    saveDockThemeForUser(userStore.user?.id, activeDockTheme.value);
    return;
  }
}

function getDockLayoutMetrics(index, total, actionKey = "") {
  const visibleCount = Math.max(total, 1);
  const cardWidth = 244;
  const cardStep = 148;
  const cardHeight = 344;
  const stackSidePadding = 96;
  const sideRetreatBase = 14;
  const sideRetreatBoost = 75;
  const sideRetreatNearBonus = 18;
  const sideCompressionStep = 25;
  const stackWidth =
    cardWidth + (visibleCount - 1) * cardStep + stackSidePadding * 2;
  const middleIndex = (visibleCount - 1) / 2;
  const distanceFromMiddle = index - middleIndex;
  const maxDistance = Math.max(middleIndex, 1);
  const normalizedDistance =
    maxDistance === 0 ? 0 : Math.abs(distanceFromMiddle) / maxDistance;
  const arcLift = Math.round((1 - Math.pow(normalizedDistance, 1.55)) * 74);
  const baseX = stackSidePadding + index * cardStep;
  const collapsedX = (stackWidth - cardWidth) / 2 + index * 2;
  const collapsedY = 28 - index * 2;
  const spreadY = Math.round(-10 - arcLift);
  const spreadRotate = distanceFromMiddle * 8.4;
  const gapIndex = dockGapCardIndex.value;
  const hasExtractionGap = gapIndex >= 0;
  let spreadX = baseX;
  let adjustedSpreadRotate = spreadRotate;
  let selectedLiftX = baseX;

  if (hasExtractionGap) {
    const leftCount = gapIndex;
    const rightCount = visibleCount - gapIndex - 1;
    const selectedBaseX = stackSidePadding + gapIndex * cardStep;

    if (index < gapIndex) {
      const proximityToGap =
        leftCount <= 1 ? 1 : index / (leftCount - 1);
      const nearGapBonus =
        Math.pow(proximityToGap, 1.55) * sideRetreatNearBonus;
      const retreatAmount =
        sideRetreatBase +
        proximityToGap * sideRetreatBoost +
        nearGapBonus +
        index * sideCompressionStep;
      spreadX = baseX - retreatAmount;
      adjustedSpreadRotate -= 0.75 + proximityToGap * 1.25;
    } else if (index > gapIndex) {
      const ordinal = index - gapIndex - 1;
      const proximityToGap =
        rightCount <= 1 ? 1 : 1 - ordinal / (rightCount - 1);
      const nearGapBonus =
        Math.pow(proximityToGap, 1.55) * sideRetreatNearBonus;
      const retreatAmount =
        sideRetreatBase +
        proximityToGap * sideRetreatBoost +
        nearGapBonus +
        (rightCount - ordinal - 1) * sideCompressionStep;
      spreadX = baseX + retreatAmount;
      adjustedSpreadRotate += 0.75 + proximityToGap * 1.25;
    } else {
      selectedLiftX = selectedBaseX;
    }
  }

  const prepX = baseX;
  const prepY = spreadY - 10;
  const prepRotate = spreadRotate * 0.78;
  const drawX = selectedLiftX;
  const drawY = spreadY - 82;
  const drawRotate = spreadRotate * 0.32;
  const hoverX = drawX;
  const hoverY = drawY;
  const hoverRotate = drawRotate;
  const motionState =
    actionKey === drawingDockCard.value
      ? "drawing"
      : actionKey === liftingDockCard.value
        ? "lifting"
        : actionKey === selectedDockCard.value
          ? "selected"
          : actionKey === returningDockCard.value
            ? "returning"
            : "base";

  let visualX = spreadX;
  let visualY = spreadY;
  let visualRotate = adjustedSpreadRotate;

  if (motionState === "drawing") {
    visualX = prepX;
    visualY = prepY;
    visualRotate = prepRotate;
  } else if (motionState === "lifting") {
    visualX = drawX;
    visualY = drawY;
    visualRotate = drawRotate;
  } else if (motionState === "selected") {
    visualX = hoverX;
    visualY = hoverY;
    visualRotate = hoverRotate;
  }

  return {
    cardWidth,
    cardHeight,
    cardStep,
    stackWidth,
    distanceFromMiddle,
    collapsedX,
    collapsedY,
    spreadX,
    spreadY,
    spreadRotate: adjustedSpreadRotate,
    prepX,
    prepY,
    prepRotate,
    drawX,
    drawY,
    drawRotate,
    hoverX,
    hoverY,
    hoverRotate,
    visualX,
    visualY,
    visualRotate,
    motionState,
  };
}

function getDockStackStyle(total) {
  const { stackWidth } = getDockLayoutMetrics(0, total);
  const visibleCount = Math.max(total, 1);

  return {
    width: `${stackWidth}px`,
    height: `${492 + Math.max(0, visibleCount - 1) * 8}px`,
  };
}

function getDockCardStyle(index, total, action) {
  const {
    collapsedX,
    collapsedY,
    spreadX,
    spreadY,
    spreadRotate,
    prepX,
    prepY,
    prepRotate,
    drawX,
    drawY,
    drawRotate,
    hoverX,
    hoverY,
    hoverRotate,
  } = getDockLayoutMetrics(index, total, action.key);

  return {
    "--index": index,
    "--peek-x": `${collapsedX}px`,
    "--peek-y": `${collapsedY}px`,
    "--peek-rotate": "0deg",
    "--spread-x": `${spreadX}px`,
    "--spread-y": `${spreadY}px`,
    "--spread-rotate": `${spreadRotate}deg`,
    "--prep-x": `${prepX}px`,
    "--prep-y": `${prepY}px`,
    "--prep-rotate": `${prepRotate}deg`,
    "--prep-scale": "1",
    "--draw-x": `${drawX}px`,
    "--draw-y": `${drawY}px`,
    "--draw-rotate": `${drawRotate}deg`,
    "--draw-scale": "1.014",
    "--hover-x": `${hoverX}px`,
    "--hover-y": `${hoverY}px`,
    "--hover-rotate": `${hoverRotate}deg`,
    "--hover-scale": "1.014",
    "--card-z": `${total - index}`,
    "--card-accent": action.accent,
    "--card-accent-soft": action.accentSoft,
    "--card-ink": action.ink,
  };
}

function getDockAnchorStyle(index, total, action) {
  const {
    cardWidth,
    cardHeight,
    spreadX,
    spreadY,
    hoverX,
    hoverY,
    motionState,
  } = getDockLayoutMetrics(index, total, action.key);
  const paddingX = motionState === "selected" ? 8 : 6;
  const paddingTop = motionState === "selected" ? 58 : 34;
  const paddingBottom = motionState === "selected" ? 40 : 24;
  const anchorX = Math.min(spreadX, hoverX) - paddingX;
  const anchorY = Math.min(spreadY, hoverY) - paddingTop;
  const anchorWidth = cardWidth + Math.abs(hoverX - spreadX) + paddingX * 2;
  const anchorHeight =
    cardHeight + Math.abs(hoverY - spreadY) + paddingTop + paddingBottom;

  return {
    "--anchor-x": `${anchorX}px`,
    "--anchor-y": `${anchorY}px`,
    width: `${anchorWidth}px`,
    height: `${anchorHeight}px`,
    zIndex: motionState === "selected" ? "117" : "115",
  };
}

function getDockPlaceholderStyle(index, total, action) {
  const { cardWidth, cardHeight, spreadX, spreadY, motionState } =
    getDockLayoutMetrics(index, total, action.key);
  const paddingX = motionState === "selected" ? 6 : 4;
  const paddingY = motionState === "selected" ? 26 : 16;

  return {
    "--placeholder-x": `${spreadX - paddingX}px`,
    "--placeholder-y": `${spreadY - paddingY}px`,
    width: `${cardWidth + paddingX * 2}px`,
    height: `${cardHeight + paddingY * 2}px`,
    zIndex: motionState === "selected" ? "115" : "113",
  };
}

function getDockInfoStyle(total) {
  const infoIndex = activeDockActionIndex.value;
  const { cardWidth, stackWidth } = getDockLayoutMetrics(0, total);
  const infoWidth = Math.min(420, Math.max(300, stackWidth * 0.34));

  if (infoIndex < 0) {
    return {
      width: `${infoWidth}px`,
      left: `${Math.max((stackWidth - infoWidth) / 2, 0)}px`,
      top: "-118px",
    };
  }

  const action = visibleDockActions.value[infoIndex];
  const { distanceFromMiddle, visualX, visualY } = getDockLayoutMetrics(
    infoIndex,
    total,
    action?.key,
  );
  const cardCenterX = visualX + cardWidth / 2;
  const safeLeft = Math.min(
    Math.max(cardCenterX - infoWidth / 2, 0),
    Math.max(stackWidth - infoWidth, 0),
  );
  const topOffset = Math.min(
    -146 + Math.abs(distanceFromMiddle) * 10,
    visualY - 104,
  );

  return {
    width: `${infoWidth}px`,
    left: `${safeLeft}px`,
    top: `${topOffset}px`,
  };
}

watch(showSidebar, (newValue) => {
  window.dispatchEvent(
    new CustomEvent("sidebar-toggle", {
      detail: { isOpen: newValue },
    }),
  );

  if (newValue && sidebarTab.value === "nearby") {
    ensureNearbyPlaceSearch().catch(() => {});
  }
});

watch(sidebarTab, (tab) => {
  if (showSidebar.value && tab === "nearby") {
    ensureNearbyPlaceSearch().catch(() => {});
  }
});

watch(nearbySearchQuery, (query) => {
  if (suppressNearbySearchQueryWatch) {
    suppressNearbySearchQueryWatch = false;
    return;
  }

  clearNearbySearchTimer();

  const keyword = query.trim();
  if (!keyword) {
    nearbySearchResults.value = [];
    nearbySearchError.value = "";
    nearbyHasSearched.value = false;
    activeNearbySearchToken += 1;
    nearbySearching.value = false;
    return;
  }

  if (keyword.length < 2) {
    nearbySearchResults.value = [];
    nearbySearchError.value = "";
    nearbyHasSearched.value = false;
    return;
  }

  nearbySearchTimer = window.setTimeout(() => {
    performNearbyPoiSearch();
  }, 320);
});

watch(
  () => [mapStore.center?.latitude, mapStore.center?.longitude],
  () => {
    scheduleNearbyCenterLabelRefresh();
  },
  { immediate: true },
);

watch(
  () => [mapStore.userLocation?.latitude, mapStore.userLocation?.longitude],
  () => {
    const userCoords = extractCoordinates(mapStore.userLocation);
    if (!userCoords) {
      currentUserLocationLabel.value = "";
      return;
    }

    void refreshCurrentUserLocationLabel();

    if (coordinatesRoughlyEqual(mapStore.center, userCoords)) {
      scheduleNearbyCenterLabelRefresh(
        currentUserLocationLabel.value || "当前位置",
        120,
      );
    }
  },
  { immediate: true },
);

watch(showPublishSidebar, (newValue) => {
  window.dispatchEvent(
    new CustomEvent("publish-sidebar-toggle", {
      detail: { isOpen: newValue },
    }),
  );
});

watch(showUserSidebar, (newValue) => {
  if (!newValue) {
    showLikesPanel.value = false;
    showPostsPanel.value = false;
    showFavoritesPanel.value = false;
    return;
  }

  if (!userStore.isLoggedIn || userStore.isGuest) {
    return;
  }

  void refreshUserPanelTotals();
  refreshActiveUserPanelTab();
});

function closeStoryPanel() {
  showSidebar.value = false;
  showCommentSettings.value = false;
}

function closeUserPanel() {
  // 关闭时保存 bio 和编辑资料弹窗中的更改
  savePendingChanges();
  showUserSidebar.value = false;
  showBioFontPicker.value = false;
  vScrollDisconnect();
  myProfileSearchQuery.value = '';
  myProfileSearchVScrollDisconnect();
  if (myProfileSearchActiveTimer) { clearTimeout(myProfileSearchActiveTimer); myProfileSearchActiveTimer = null; }
  myProfileSearchActive.value = false;
  showLikesPanel.value = false;
  showPostsPanel.value = false;
  showFavoritesPanel.value = false;
  editingBioInline.value = false;
  bioChanged.value = false;
  resetProfileScrollState();
}

// --- 新增：Bio 编辑 ---
function startEditBio() {
  if (editingBioInline.value) return;
  editingBioInline.value = true;
  bioDraft.value = userStore.user?.bio || '';
  bioFontFamily.value = userStore.user?.bioFontFamily || readBioFontFromCookie();
  bioFontEffect.value = userStore.user?.bioFontEffect || readBioFontEffectFromCookie();
  bioChanged.value = false;
  nextTick(() => {
    bioInputRef.value?.focus();
  });
}

function cancelEditBio() {
  editingBioInline.value = false;
  bioDraft.value = '';
  bioFontFamily.value = '';
  bioFontEffect.value = '';
  bioChanged.value = false;
  showBioFontPicker.value = false;
}

let _bioSaving = false;

function handleBioBlur() {
  if (bioFontBtnMousedown.value) return;
  if (showBioFontPicker.value) return;
  saveBioInline();
}

function saveBioInline() {
  if (_bioSaving) return;
  if (!editingBioInline.value) return;
  _bioSaving = true;
  editingBioInline.value = false;
  showBioFontPicker.value = false;
  const newBio = bioDraft.value.trim();
  const fontFamily = bioFontFamily.value || readBioFontFromCookie();
  const fontEffect = bioFontEffect.value || readBioFontEffectFromCookie();
  const oldBio = userStore.user?.bio || '';
  if (newBio === oldBio && fontFamily === (userStore.user?.bioFontFamily || '') && fontEffect === (userStore.user?.bioFontEffect || '')) {
    bioChanged.value = false;
    _bioSaving = false;
    return;
  }
  // 直接提交保存
  bioChanged.value = false;
  const profileData = { bio: newBio };
  if (fontFamily) profileData.bioFontFamily = fontFamily;
  if (fontEffect) profileData.bioFontEffect = fontEffect;
  authApi.updateProfile(profileData).then((response) => {
    userStore.updateUser({ bio: newBio, bioFontFamily: fontFamily, bioFontEffect: fontEffect });
    syncCurrentUserProfileAcrossStories({ ...(userStore.user || {}), bio: newBio, bioFontFamily: fontFamily, bioFontEffect: fontEffect });
    showToast('签名已保存', 'success');
    _bioSaving = false;
  }).catch((error) => {
    console.error('保存签名失败:', error);
    showToast('保存签名失败', 'error');
    _bioSaving = false;
  });
}

// --- 新增：编辑资料弹窗 ---
function handleOpenEditProfile() {
  const u = userStore.user || {};
  editProfileForm.value = {
    username: u.username || u.name || '',
    email: u.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  editProfileErrors.value = { username: '', password: '' };
  editProfileSaving.value = false;
  editProfileSavingPassword.value = false;
  editProfileShowOldPwd.value = false;
  editProfileShowNewPwd.value = false;
  editProfileShowConfirmPwd.value = false;
  pwdVerify.value = {
    newPasswordMsg: '',
    newPasswordValid: false,
    confirmPasswordMsg: '',
    confirmPasswordValid: false,
    oldPasswordError: '',
    canSubmit: false,
  };
  showEditProfileModal.value = true;
}

async function handleSaveEditProfile() {
  editProfileErrors.value = { username: '', password: '' };
  const form = editProfileForm.value;
  const trimmedUsername = form.username.trim();

  // 验证用户名
  if (trimmedUsername.length > 0 && trimmedUsername.length < 2) {
    editProfileErrors.value.username = '用户名至少需要 2 个字符';
    return;
  }
  if (trimmedUsername.length > 20) {
    editProfileErrors.value.username = '用户名最多 20 个字符';
    return;
  }
  if (trimmedUsername && !/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    editProfileErrors.value.username = '用户名只能包含字母、数字、中文、下划线和连字符';
    return;
  }

  editProfileSaving.value = true;
  try {
    const currentUsername = userStore.user?.username || userStore.user?.name;
    if (trimmedUsername && trimmedUsername !== currentUsername) {
      const result = await checkUsernameAvailability(trimmedUsername);
      if (!result.available) {
        editProfileErrors.value.username = result.message || '该用户名已被使用';
        return;
      }
      const response = await authApi.updateProfile({ username: trimmedUsername });
      const updatedUser = response?.data ?? response;
      userStore.updateUser(updatedUser);
      syncCurrentUserProfileAcrossStories({ ...(userStore.user || {}), ...(updatedUser || {}) });
    }

    showToast('资料更新成功', 'success');
    showEditProfileModal.value = false;
  } catch (error) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || '';
    if (msg.includes('用户名') || msg.includes('username')) {
      editProfileErrors.value.username = msg || '用户名修改失败';
    } else {
      showToast(msg || '保存失败，请重试', 'error');
    }
  } finally {
    editProfileSaving.value = false;
  }
}

// 确认修改密码（独立逻辑）
async function handleConfirmChangePassword() {
  if (!pwdVerify.value.canSubmit || editProfileSavingPassword.value) return;

  const form = editProfileForm.value;
  editProfileSavingPassword.value = true;

  try {
    await authApi.changePassword(form.currentPassword, form.newPassword);
    showToast('密码修改成功', 'success');
    // 清空密码字段
    form.currentPassword = '';
    form.newPassword = '';
    form.confirmPassword = '';
    pwdVerify.value = {
      newPasswordMsg: '',
      newPasswordValid: false,
      confirmPasswordMsg: '',
      confirmPasswordValid: false,
      oldPasswordError: '',
      canSubmit: false,
    };
  } catch (error) {
    pwdVerify.value.oldPasswordError = '旧密码不正确';
  } finally {
    editProfileSavingPassword.value = false;
  }
}

function handleCloseEditProfile() {
  showEditProfileModal.value = false;
}

// --- 切换账号 ---
function handleSwitchAccount() {
  const currentId = String(userStore.user?.id || '');
  const stored = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
  savedAccounts.value = stored.filter((a) => String(a.id) !== currentId).slice(0, 2);
  showSwitchAccountModal.value = true;
}

function handleSwitchToAccount(acc) {
  if (!acc.token) {
    // 没有保存 token，回退到登录流程
    showSwitchAccountModal.value = false;
    isSwitchingAccount.value = true;
    showUserSidebar.value = false;
    userStore.logout();
    showLoginModal.value = true;
    return;
  }
  // 直接用保存的 token 切换，无需重新登录
  showSwitchAccountModal.value = false;
  // 先保存当前账号（含 token）到 savedAccounts
  if (userStore.user?.id && userStore.token) {
    saveAccountToStorage({ id: userStore.user.id, username: userStore.user.username, email: userStore.user.email, avatar: userStore.user.avatar, token: userStore.token });
  }
  userStore.setAuth(acc.token, { id: acc.id, username: acc.username, email: acc.email || '', avatar: acc.avatar || '' });
  window.location.reload();
}

function handleAddAccount() {
  showSwitchAccountModal.value = false;
  // 保存当前账号（含 token）到 savedAccounts
  if (userStore.user?.id && userStore.token) {
    saveAccountToStorage({ id: userStore.user.id, username: userStore.user.username, email: userStore.user.email, avatar: userStore.user.avatar, token: userStore.token });
  }
  isSwitchingAccount.value = true;
  showUserSidebar.value = false;
  showLoginModal.value = true;
}

// 保存账号到 localStorage（最多保留 2 个非当前账号）
function saveAccountToStorage(account) {
  const stored = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
  const accId = String(account.id);
  // 去重
  const filtered = stored.filter((a) => String(a.id) !== accId);
  filtered.push(account);
  // 最多保留 2 个
  localStorage.setItem('savedAccounts', JSON.stringify(filtered.slice(-2)));
}

// 切换账号后刷新"我的信息"面板所有内容
function refreshUserPanel() {
  // 重置所有列表
  postsList.value = [];
  postsPage.value = 1;
  postsHasMore.value = true;
  postsTotalCount.value = -1;
  likesList.value = [];
  likesPage.value = 1;
  likesHasMore.value = true;
  likesTotalCount.value = -1;
  favoritesList.value = [];
  favoritesPage.value = 1;
  favoritesHasMore.value = true;
  favoritesTotalCount.value = -1;
  userContentTab.value = 'posts';
  // 刷新用户信息并加载作品
  userStore.fetchUser().then(() => {
    void refreshUserPanelTotals();
    refreshActiveUserPanelTab();
  }).catch((error) => {
    console.error('刷新用户信息失败:', error);
  });
}

// LoginModal 登录成功后的回调
function handleLoginModalClose() {
  showLoginModal.value = false;
  if (isSwitchingAccount.value) {
    isSwitchingAccount.value = false;
    if (userStore.isLoggedIn && userStore.user?.id && userStore.token) {
      // 登录成功：保存新账号（含 token）并刷新面板
      saveAccountToStorage({ id: userStore.user.id, username: userStore.user.username, email: userStore.user.email, avatar: userStore.user.avatar, token: userStore.token });
      showToast('切换账号成功', 'success');
      showUserSidebar.value = true;
      refreshUserPanel();
    }
    // 用户取消了登录，不做额外操作
  }
}

// --- 新增：标签栏切换 ---
function switchUserContentTab(tab) {
  userContentTab.value = tab;
  // 触发入场动画
  storyCardAnimationKey.value++;
  resetProfileScrollState();
  if (tab === 'posts' && postsList.value.length === 0) loadPostsData();
  else if (tab === 'likes' && likesList.value.length === 0) loadLikesData();
  else if (tab === 'favorites' && favoritesList.value.length === 0) loadFavoritesData();
}

function refreshActiveUserPanelTab() {
  if (userContentTab.value === "likes") {
    loadLikesData();
    return;
  }

  if (userContentTab.value === "favorites") {
    loadFavoritesData();
    return;
  }

  loadPostsData();
}

function handleContentListScroll(event) {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  if (scrollHeight - scrollTop - clientHeight < 50) {
    if (userContentTab.value === 'posts') loadPostsData(true);
    else if (userContentTab.value === 'likes') loadLikesData(true);
    else if (userContentTab.value === 'favorites') loadFavoritesData(true);
  }
}

// --- 新增：关闭面板时批量保存 ---
async function savePendingChanges() {
  const changes = [];
  const form = editProfileForm.value;

  // Bio 更改
  if (bioChanged.value) {
    changes.push({ type: 'bio', value: bioDraft.value.trim() });
  }

  // 用户名更改（编辑弹窗中）
  if (showEditProfileModal.value) {
    const trimmedUsername = form.username.trim();
    const currentUsername = userStore.user?.username || userStore.user?.name;
    if (trimmedUsername && trimmedUsername !== currentUsername && trimmedUsername.length >= 2) {
      changes.push({ type: 'username', value: trimmedUsername });
    }
  }

  if (changes.length === 0) return;

  for (const change of changes) {
    try {
      if (change.type === 'bio') {
        await authApi.updateProfile({ bio: change.value });
        userStore.updateUser({ bio: change.value });
        bioChanged.value = false;
      }
    } catch (error) {
      console.error(`保存${change.type}失败:`, error);
    }
  }
}

function closePublishPanel() {
  showFontPicker.value = false;
  isPickingPublishLocation.value = false;
  isAdjustingPlanePosition.value = false;
  isAdjustingWaitingForPlane.value = false;
  isPublishWaitingForPlane.value = false;
  shouldAutoConfirmPublishPick.value = false;
  shouldAutoConfirmAdjustPlanePick.value = false;
  adjustPlaneClickScreenPos.value = null;
  adjustPlaneSavedPrefill.value = '';
  adjustPlaneSavedPosition.value = null;
  suggestedPublishLocations.value = [];
  publishPickPrompt.value = null;
  publishPrefillQuery.value = '';
  pickedPublishLocation.value = null;
  showPublishSidebar.value = false;
}

function handleAdjustPlanePosition() {
  adjustPlaneSavedPrefill.value = publishPrefillQuery.value;
  adjustPlaneSavedPosition.value =
    extractCoordinates(planePosition.value)
    || extractCoordinates(mapStore.userLocation)
    || extractCoordinates(mapStore.center);
  shouldAutoConfirmPublishPick.value = false;
  shouldAutoConfirmAdjustPlanePick.value = false;
  publishPickPrompt.value = null;
  suggestedPublishLocations.value = [];
  pickedPublishLocation.value = null;
  adjustPlaneClickScreenPos.value = null;
  showPublishSidebar.value = false;
  isPickingPublishLocation.value = false;
  isAdjustingPlanePosition.value = true;
}

function startPublishMapPick() {
  suggestedPublishLocations.value = [];
  publishPickPrompt.value = null;
  pickedPublishLocation.value = null;
  isDockExpanded.value = false;
  isPublishWaitingForPlane.value = false;
  shouldAutoConfirmPublishPick.value = false;
  isPickingPublishLocation.value = true;
}

function cancelPublishMapPick() {
  publishPickPrompt.value = null;
  suggestedPublishLocations.value = [];
  pickedPublishLocation.value = null;
  isDockExpanded.value = false;
  isPublishWaitingForPlane.value = false;
  shouldAutoConfirmPublishPick.value = false;
  isPickingPublishLocation.value = false;
}

function restorePublishPanelFromPick() {
  publishPickPrompt.value = null;
  suggestedPublishLocations.value = [];
  pickedPublishLocation.value = null;
  isDockExpanded.value = false;
  isPublishWaitingForPlane.value = false;
  shouldAutoConfirmPublishPick.value = false;
  isPickingPublishLocation.value = false;
}

function restorePublishPanelFromAdjustPlane() {
  publishPickPrompt.value = null;
  suggestedPublishLocations.value = [];
  pickedPublishLocation.value = null;
  adjustPlaneClickScreenPos.value = null;
  if (adjustPlaneSavedPosition.value) {
    planePosition.value = { ...adjustPlaneSavedPosition.value };
  }
  isAdjustingPlanePosition.value = false;
  isAdjustingWaitingForPlane.value = false;
  isPublishWaitingForPlane.value = false;
  shouldAutoConfirmAdjustPlanePick.value = false;
  showPublishSidebar.value = true;
  nextTick(() => {
    publishPrefillQuery.value = adjustPlaneSavedPrefill.value;
  });
  adjustPlaneSavedPosition.value = null;
}

function handleDocumentKeydown(e) {
  if (e.key === "Escape" && isAdjustingPlanePosition.value) {
    restorePublishPanelFromAdjustPlane();
    return;
  }
  if (e.key === "Escape" && isPickingPublishLocation.value) {
    restorePublishPanelFromPick();
  }
  if (e.key === "Escape" && isPickingDockPublishLocation.value) {
    restoreDockPublishPanelFromPick();
  }
}

function handlePublishClick() {
  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast("请先登录后再发布故事", "warning");
    showLoginModal.value = true;
    isDockExpanded.value = false;
    return;
  }
  if (showSidebar.value) {
    closeStoryPanel();
  }
  if (showUserSidebar.value) {
    closeUserPanel();
  }
  if (showPublishSidebar.value) {
    closePublishPanel();
  }
  isPickingDockPublishLocation.value = false;
  isAdjustingPlanePosition.value = false;
  isAdjustingWaitingForPlane.value = false;
  shouldAutoConfirmDockPublishPick.value = false;
  shouldAutoConfirmAdjustPlanePick.value = false;
  adjustPlaneClickScreenPos.value = null;
  isDockExpanded.value = false;
  setTimeout(() => {
    showDockPublishSidebar.value = true;
  }, 100);
}

function closeDockPublishPanel() {
  showFontPicker.value = false;
  isPickingDockPublishLocation.value = false;
  isDockPublishWaitingForPlane.value = false;
  shouldAutoConfirmDockPublishPick.value = false;
  dockPublishClickScreenPos.value = null;
  showDockPublishSidebar.value = false;
}

function startDockPublishMapPick() {
  isDockPublishPickPrompt.value = null;
  dockPublishPickedLocation.value = null;
  isDockExpanded.value = false;
  isDockPublishWaitingForPlane.value = false;
  shouldAutoConfirmDockPublishPick.value = false;
  isPickingDockPublishLocation.value = true;
}

function cancelDockPublishMapPick() {
  isDockPublishPickPrompt.value = null;
  dockPublishPickedLocation.value = null;
  isDockExpanded.value = false;
  isDockPublishWaitingForPlane.value = false;
  shouldAutoConfirmDockPublishPick.value = false;
  isPickingDockPublishLocation.value = false;
}

function restoreDockPublishPanelFromPick() {
  isDockPublishPickPrompt.value = null;
  dockPublishPickedLocation.value = null;
  isDockExpanded.value = false;
  isDockPublishWaitingForPlane.value = false;
  shouldAutoConfirmDockPublishPick.value = false;
  isPickingDockPublishLocation.value = false;
}

const isDockPublishPickPrompt = ref(null);
const dockPublishPickedLocation = ref(null);
const dockPublishSuggestedLocations = ref([]);

async function handleDockPublishSubmit(storyData) {
  try {
    const selectedLocation = extractCoordinates(storyData.location);
    if (!selectedLocation) {
      showToast("请先选择一个地点后再发布故事", "warning");
      return;
    }

    if (!storyData.emotion) {
      showToast("请先选择一个情绪标签", "warning");
      return;
    }

    if (storyData.isTimeCapsule && !storyData.unlockAt) {
      showToast("请为时光胶囊选择解锁时间", "warning");
      return;
    }

    const location = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      address:
        storyData.location?.address || storyData.location?.name || "已选地点",
      name:
        storyData.location?.name || storyData.location?.address || "已选地点",
    };

    const finalEmotionTag = storyData.emotion;
    const { storyApi } = await import("../../api/story");
    const { uploadImages, validateImage } = await import("../../utils/upload");
    let imageUrls = [];
    if (storyData.images && storyData.images.length > 0) {
      for (const file of storyData.images) {
        const validation = validateImage(file);
        if (!validation.valid) {
          console.warn("图片验证失败:", validation.error);
          continue;
        }
      }
      try {
        imageUrls = await uploadImages(storyData.images);
        console.log("图片上传成功:", imageUrls);
      } catch (error) {
        console.error("图片上传失败:", error);
      }
    }

    const createPayload = {
      content: storyData.content,
      images: imageUrls,
      location: {
        lng: location.longitude,
        lat: location.latitude,
      },
      locationName: location.name,
      emotionTag: finalEmotionTag,
      isTimeCapsule: storyData.isTimeCapsule,
      unlockAt: storyData.unlockAt || null,
      visibility: storyData.visibility || "public",
      visibilityStartTime: storyData.visibilityStartTime || null,
      visibilityEndTime: storyData.visibilityEndTime || null,
      fontFamily: storyData.fontFamily || null,
      fontEffect: storyData.fontEffect || null,
    };
    const response = await storyApi.createStory(createPayload);

    const newStory = response.data || response;
    const normalizedNewStory = normalizeStoryForMap(newStory, location);

    if (normalizedNewStory && amapRef.value) {
      amapRef.value.addNewStoryMarker(normalizedNewStory);
    }

    if (normalizedNewStory) {
      mapStore.updateStories([...mapStore.stories, normalizedNewStory]);
      void hydrateStoryLocations([normalizedNewStory]);
    } else {
      console.warn(
        "[Map] Created story is missing valid coordinates:",
        newStory,
      );
      await loadStories();
    }
    updateUserPanelTotalCount(postsTotalCount, 1);

    mapStore.updateCenter(location.latitude, location.longitude);
    mapStore.updateZoom(15);

    showToast("发布成功！", "success");
    closeDockPublishPanel();
  } catch (error) {
    console.error("发布失败:", error);
    showToast("发布失败，请重试", "error");
  }
}

function formatMapPickAddress(latitude, longitude) {
  return `经度 ${longitude.toFixed(6)}，纬度 ${latitude.toFixed(6)}`;
}

function toFiniteNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function firstNonEmptyString(...values) {
  for (const value of values.flat()) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function buildLocationDistrictLabel(source) {
  if (!source || typeof source !== "object") {
    return "";
  }

  const city = firstNonEmptyString(source.city);
  const district = firstNonEmptyString(source.district);
  const province = firstNonEmptyString(source.province);

  if (city && district) {
    return district.includes(city) ? district : `${city} ${district}`;
  }

  return district || city || province || "";
}

function getNonPlaceholderLocationLabel(...values) {
  for (const value of values.flat()) {
    if (typeof value !== "string" || !value.trim()) {
      continue;
    }

    const normalized = value.trim();
    if (!isGenericLocationPlaceholder(normalized)) {
      return normalized;
    }
  }

  return "";
}

function buildLocationAddressLabel(source, latitude, longitude) {
  const districtLabel = buildLocationDistrictLabel(source);
  const rawAddress = getNonPlaceholderLocationLabel(
    source?.address,
    source?.formattedAddress,
    source?.name,
  );

  if (rawAddress) {
    if (districtLabel && !rawAddress.includes(districtLabel)) {
      return `${districtLabel} ${rawAddress}`;
    }

    return rawAddress;
  }

  return districtLabel || formatMapPickAddress(latitude, longitude);
}

function formatPoiDistrictLabel(poi) {
  if (!poi || typeof poi !== "object") {
    return "已解析位置";
  }

  return buildLocationDistrictLabel(poi) || "已解析位置";
}

function resolveStoryAuthor(source, fallbackAuthor = null) {
  if (!source || typeof source !== "object") {
    return {
      id: fallbackAuthor?.id ?? null,
      username: firstNonEmptyString(
        fallbackAuthor?.username,
        "\u533f\u540d\u7528\u6237",
      ),
      avatar: firstNonEmptyString(fallbackAuthor?.avatar),
      vip: fallbackAuthor?.vip ?? false,
    };
  }

  const authorObject =
    source.author && typeof source.author === "object" ? source.author : null;
  const userObject =
    source.user && typeof source.user === "object" ? source.user : null;
  const storyAuthorId = normalizeStoryIdKey(
    authorObject?.id ??
      userObject?.id ??
      fallbackAuthor?.id ??
      source.authorId ??
      source.userId ??
      null,
  );
  const currentUserId = normalizeStoryIdKey(userStore.user?.id);
  const useCurrentUserProfile = Boolean(
    currentUserId && storyAuthorId && currentUserId === storyAuthorId,
  );

  return {
    id: useCurrentUserProfile
      ? (userStore.user?.id ??
        authorObject?.id ??
        userObject?.id ??
        fallbackAuthor?.id ??
        source.authorId ??
        source.userId ??
        null)
      : (authorObject?.id ??
        userObject?.id ??
        fallbackAuthor?.id ??
        source.authorId ??
        source.userId ??
        null),
    username: firstNonEmptyString(
      useCurrentUserProfile ? userStore.user?.username : "",
      useCurrentUserProfile ? userStore.user?.name : "",
      authorObject?.username,
      userObject?.username,
      typeof source.author === "string" ? source.author : "",
      source.username,
      source.userName,
      fallbackAuthor?.username,
      "\u533f\u540d\u7528\u6237",
    ),
    avatar: firstNonEmptyString(
      useCurrentUserProfile ? userStore.user?.avatar : "",
      useCurrentUserProfile ? userStore.user?.avatarUrl : "",
      authorObject?.avatar,
      authorObject?.avatarUrl,
      userObject?.avatar,
      userObject?.avatarUrl,
      source.avatar,
      source.avatarUrl,
      fallbackAuthor?.avatar,
    ),
    vip: Boolean(authorObject?.vip ?? userObject?.vip ?? source.author?.vip),
  };
}

function getStoryAuthorName(story) {
  return resolveStoryAuthor(story).username;
}

function getStoryAuthorAvatar(story) {
  return resolveStoryAuthor(story).avatar;
}

function getStoryAuthorVip(story) {
  return Boolean(resolveStoryAuthor(story).vip);
}

function isCapsuleLocked(story) {
  if (!story?.isTimeCapsule) return false;
  if (story.isUnlocked === true) return false;
  const unlockAt = story.unlockAt;
  if (!unlockAt) return true;
  return new Date(unlockAt) > new Date();
}

function getCapsuleCountdown(story) {
  if (!story?.unlockAt) return '';
  const diff = new Date(story.unlockAt) - new Date();
  if (diff <= 0) return '';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}天${hours}小时后解锁`;
  if (hours > 0) return `${hours}小时${minutes}分钟后解锁`;
  return `${minutes}分钟后解锁`;
}

function getStoryAuthorInitial(story) {
  return getStoryAuthorName(story).slice(0, 1).toUpperCase() || "\u533f";
}

function isCoordinateOnlyLocationLabel(value) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim();
  return (
    normalized.startsWith("经度 ") ||
    /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(normalized)
  );
}

function pickLocationText(candidates, allowCoordinateFallback = true) {
  let coordinateFallback = "";

  for (const value of candidates) {
    if (typeof value !== "string" || !value.trim()) {
      continue;
    }

    const normalized = value.trim();
    if (isCoordinateOnlyLocationLabel(normalized)) {
      if (!coordinateFallback) {
        coordinateFallback = normalized;
      }
      continue;
    }

    return normalized;
  }

  return allowCoordinateFallback ? coordinateFallback : "";
}

function isGenericLocationPlaceholder(value) {
  if (typeof value !== "string") {
    return false;
  }

  return [
    "Map Pick",
    "Map Center",
    "Current Location",
    "Nearby Place",
    "已选地点",
  ].includes(value.trim());
}

function sanitizeLocationLabel(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  if (
    isGenericLocationPlaceholder(normalized)
    || isCoordinateOnlyLocationLabel(normalized)
  ) {
    return "";
  }

  return normalized;
}

function getStoryLocationText(story, fallback = "未知位置") {
  const label = pickLocationText([
    story?.location?.address,
    story?.location?.formattedAddress,
    story?.location?.name,
    story?.locationName,
  ]);

  return label || fallback;
}

function hasResolvedStoryLocation(story) {
  return Boolean(
    pickLocationText(
      [
        story?.location?.address,
        story?.location?.formattedAddress,
        story?.location?.name,
        story?.locationName,
      ],
      false,
    ),
  );
}

function getCoordinateCacheKey(latitude, longitude) {
  return `${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}`;
}

function buildFallbackLocation(latitude, longitude, overrides = {}) {
  const city = firstNonEmptyString(overrides.city);
  const district = buildLocationDistrictLabel({
    city,
    district: firstNonEmptyString(overrides.district),
    province: firstNonEmptyString(overrides.province),
  });
  const province = firstNonEmptyString(overrides.province);
  const name = getNonPlaceholderLocationLabel(
    overrides.name,
    overrides.address,
    district,
    "已选地点",
  );
  const address = buildLocationAddressLabel(
    {
      ...overrides,
      city,
      district,
      province,
      name,
    },
    latitude,
    longitude,
  );

  return {
    id: overrides.id || `map-pick-${longitude}-${latitude}`,
    name,
    address,
    latitude,
    longitude,
    city,
    district,
    adcode: firstNonEmptyString(overrides.adcode),
    province,
    type: firstNonEmptyString(overrides.type, "map-click"),
    nearbyPois: Array.isArray(overrides.nearbyPois) ? overrides.nearbyPois : [],
  };
}

function pickLocationDisplayName(location, fallback = "") {
  if (!location || typeof location !== "object") {
    return sanitizeLocationLabel(fallback);
  }

  const candidates = [
    location.name,
    location.district,
    location.address,
  ]
    .map((value) => sanitizeLocationLabel(value))
    .filter(Boolean);

  return pickLocationText(candidates, false) || sanitizeLocationLabel(fallback);
}

function coordinatesRoughlyEqual(left, right) {
  const leftCoords = extractCoordinates(left);
  const rightCoords = extractCoordinates(right);
  if (!leftCoords || !rightCoords) {
    return false;
  }

  return (
    Math.abs(leftCoords.latitude - rightCoords.latitude) < 0.0008 &&
    Math.abs(leftCoords.longitude - rightCoords.longitude) < 0.0008
  );
}

function setNearbyPinnedCenterLabel(location, fallback = "") {
  const coords = extractCoordinates(location);
  const label = pickLocationDisplayName(location, fallback);

  if (!coords || !label) {
    nearbyPinnedCenterLabel.value = null;
    return;
  }

  nearbyPinnedCenterLabel.value = {
    key: getCoordinateCacheKey(coords.latitude, coords.longitude),
    label,
  };
  nearbyCenterLabel.value = label;
}

function clearNearbyCenterLabelTimer() {
  if (nearbyCenterLabelTimer) {
    window.clearTimeout(nearbyCenterLabelTimer);
    nearbyCenterLabelTimer = null;
  }
}

async function refreshCurrentUserLocationLabel(preferredLabel = "") {
  const coords = extractCoordinates(mapStore.userLocation);
  if (!coords) {
    currentUserLocationLabel.value = "";
    currentUserSearchLocality.value = null;
    return;
  }

  if (preferredLabel) {
    currentUserLocationLabel.value = preferredLabel;
  }

  const currentToken = ++activeUserLocationLabelToken;

  try {
    const resolvedLocation = await reverseGeocodeLocationDetailSafe(
      coords.latitude,
      coords.longitude,
    );
    if (currentToken !== activeUserLocationLabelToken) {
      return;
    }

    currentUserLocationLabel.value = pickLocationDisplayName(
      resolvedLocation,
      currentUserLocationLabel.value || preferredLabel || "当前位置",
    );
    currentUserSearchLocality.value = {
      city: firstNonEmptyString(resolvedLocation?.city),
      district: firstNonEmptyString(resolvedLocation?.district),
      adcode: firstNonEmptyString(resolvedLocation?.adcode),
      province: firstNonEmptyString(resolvedLocation?.province),
    };
  } catch (error) {
    if (currentToken !== activeUserLocationLabelToken) {
      return;
    }

    currentUserLocationLabel.value =
      currentUserLocationLabel.value || preferredLabel || "当前位置";
    currentUserSearchLocality.value = null;
  }
}

async function resolveNearbyCenterLabel(preferredLabel = "") {
  const center =
    extractCoordinates(mapStore.center) ||
    extractCoordinates(mapStore.userLocation);
  if (!center) {
    nearbyCenterLabel.value = "";
    nearbyPinnedCenterLabel.value = null;
    return;
  }

  const centerKey = getCoordinateCacheKey(center.latitude, center.longitude);
  const pinnedLabel =
    nearbyPinnedCenterLabel.value?.key === centerKey
      ? nearbyPinnedCenterLabel.value.label
      : "";

  if (
    nearbyPinnedCenterLabel.value &&
    nearbyPinnedCenterLabel.value.key !== centerKey
  ) {
    nearbyPinnedCenterLabel.value = null;
  }

  const atUserLocation = coordinatesRoughlyEqual(center, mapStore.userLocation);
  const optimisticLabel = pickLocationText(
    [
      preferredLabel,
      pinnedLabel,
      atUserLocation ? currentUserLocationLabel.value : "",
    ],
    false,
  );

  if (optimisticLabel) {
    nearbyCenterLabel.value = optimisticLabel;
  }

  const currentToken = ++activeNearbyCenterLabelToken;

  try {
    const resolvedLocation = await reverseGeocodeLocationDetailSafe(
      center.latitude,
      center.longitude,
    );
    if (currentToken !== activeNearbyCenterLabelToken) {
      return;
    }

    nearbyCenterLabel.value = pickLocationDisplayName(
      {
        name: pickLocationText(
          [
            preferredLabel,
            pinnedLabel,
            atUserLocation ? currentUserLocationLabel.value : "",
            resolvedLocation?.name,
          ],
          false,
        ),
        district: resolvedLocation?.district,
        address: resolvedLocation?.address,
      },
      atUserLocation
        ? currentUserLocationLabel.value || "当前位置"
        : "地图中心附近",
    );

    if (atUserLocation && !currentUserLocationLabel.value) {
      currentUserLocationLabel.value = nearbyCenterLabel.value;
    }
  } catch (error) {
    if (currentToken !== activeNearbyCenterLabelToken) {
      return;
    }

    nearbyCenterLabel.value =
      optimisticLabel ||
      (atUserLocation
        ? currentUserLocationLabel.value || "当前位置"
        : "地图中心附近");
  }
}

function scheduleNearbyCenterLabelRefresh(preferredLabel = "", delay = 320) {
  clearNearbyCenterLabelTimer();
  nearbyCenterLabelTimer = window.setTimeout(() => {
    void resolveNearbyCenterLabel(preferredLabel);
  }, delay);
}

function buildNormalizedStoryLocation(
  story,
  coords = null,
  fallbackLocation = null,
) {
  const sourceLocation =
    story?.location && typeof story.location === "object" ? story.location : {};
  const fallback =
    fallbackLocation && typeof fallbackLocation === "object"
      ? fallbackLocation
      : {};
  const normalizedCoords =
    coords ||
    extractCoordinates(sourceLocation) ||
    extractCoordinates(fallback);
  const address = pickLocationText([
    story?.locationName,
    sourceLocation.name,
    fallback.name,
    sourceLocation.address,
    sourceLocation.formattedAddress,
    fallback.address,
    normalizedCoords
      ? formatMapPickAddress(
          normalizedCoords.latitude,
          normalizedCoords.longitude,
        )
      : "",
  ]);
  const name = pickLocationText([
    story?.locationName,
    sourceLocation.name,
    fallback.name,
    sourceLocation.address,
    fallback.address,
  ]);
  const district = firstNonEmptyString(
    sourceLocation.district,
    fallback.district,
  );
  const type = firstNonEmptyString(sourceLocation.type, fallback.type);

  if (!normalizedCoords && !address && !name && !district && !type) {
    return null;
  }

  const normalizedLocation = {
    ...fallback,
    ...sourceLocation,
  };

  if (normalizedCoords) {
    normalizedLocation.latitude = normalizedCoords.latitude;
    normalizedLocation.longitude = normalizedCoords.longitude;
    normalizedLocation.lat = normalizedCoords.latitude;
    normalizedLocation.lng = normalizedCoords.longitude;
  }

  if (name) {
    normalizedLocation.name = name;
  }
  if (address) {
    normalizedLocation.address = address;
  }
  if (district) {
    normalizedLocation.district = district;
  }
  if (type) {
    normalizedLocation.type = type;
  }

  return normalizedLocation;
}

function getSuggestedLocationDistance(location, originLocation) {
  const explicitDistance = toFiniteNumber(location?.distance);
  if (explicitDistance !== null) {
    return explicitDistance;
  }

  const coords = extractCoordinates(location);
  const origin = extractCoordinates(originLocation);
  if (!coords || !origin) {
    return Number.MAX_SAFE_INTEGER;
  }

  return (
    Math.pow(coords.latitude - origin.latitude, 2) +
    Math.pow(coords.longitude - origin.longitude, 2)
  );
}

function clearNearbySearchTimer() {
  if (nearbySearchTimer) {
    window.clearTimeout(nearbySearchTimer);
    nearbySearchTimer = null;
  }
}

function setNearbySearchQuerySilently(value) {
  suppressNearbySearchQueryWatch = true;
  nearbySearchQuery.value = value;
}

function clearNearbyPoiSearch() {
  clearNearbySearchTimer();
  activeNearbySearchToken += 1;
  setNearbySearchQuerySilently("");
  nearbySearchResults.value = [];
  nearbySearchError.value = "";
  nearbyHasSearched.value = false;
  nearbySearching.value = false;
}

function scheduleNearbyStoriesReload(delay = 320) {
  clearTimeout(loadTimer);
  loadTimer = window.setTimeout(() => {
    loadStories();
    loadClusterData();
  }, delay);
}

function ensureNearbyPlaceSearch() {
  if (nearbyPlaceSearchInstance) {
    return Promise.resolve(nearbyPlaceSearchInstance);
  }

  if (nearbyPlaceSearchPromise) {
    return nearbyPlaceSearchPromise;
  }

  nearbyPlaceSearchPromise = new Promise((resolve, reject) => {
    if (!window.AMap?.plugin) {
      nearbyPlaceSearchPromise = null;
      reject(new Error("AMap is not ready."));
      return;
    }

    window.AMap.plugin(["AMap.PlaceSearch"], () => {
      if (!window.AMap?.PlaceSearch) {
        nearbyPlaceSearchPromise = null;
        reject(new Error("AMap PlaceSearch is unavailable."));
        return;
      }

      nearbyPlaceSearchInstance = new window.AMap.PlaceSearch({
        pageSize: 10,
        pageIndex: 1,
        extensions: "all",
      });

      resolve(nearbyPlaceSearchInstance);
    });
  });

  return nearbyPlaceSearchPromise;
}

async function performNearbyPoiSearch() {
  const keyword = nearbySearchQuery.value.trim();
  if (keyword.length < 2) {
    nearbySearchResults.value = [];
    nearbySearchError.value = "至少输入 2 个字再搜索地点。";
    nearbyHasSearched.value = false;
    return;
  }

  const currentToken = ++activeNearbySearchToken;
  nearbySearching.value = true;
  nearbySearchError.value = "";
  nearbyHasSearched.value = true;

  try {
    await ensureNearbyPlaceSearch();
    const anchor =
      extractCoordinates(mapStore.userLocation) ||
      extractCoordinates(mapStore.center);
    const sortAnchor = extractCoordinates(mapStore.userLocation) || anchor;
    const { pois, errorMessage } = await searchPoisWithContext({
      createPlaceSearch: (options = {}) =>
        new window.AMap.PlaceSearch({
          pageSize: 10,
          pageIndex: 1,
          extensions: "all",
          ...options,
        }),
      keyword,
      anchor,
      sortAnchor,
      locality: currentUserSearchLocality.value,
      radius: POI_SEARCH_RADIUS_METERS,
      normalizePoi: normalizeNearbyPoiFromGeocode,
    });

    if (currentToken !== activeNearbySearchToken) {
      return;
    }

    nearbySearching.value = false;
    nearbySearchResults.value = pois;
    nearbySearchError.value = errorMessage;
  } catch (error) {
    if (currentToken !== activeNearbySearchToken) {
      return;
    }

    nearbySearching.value = false;
    nearbySearchResults.value = [];
    nearbySearchError.value = "地点服务暂时不可用，请确认地图脚本已正确加载。";
    console.error("[Map] Failed to search nearby POI:", error);
  }
}

function focusNearbyStoriesOnPoi(poi) {
  const coords = extractCoordinates(poi);
  if (!coords) {
    return;
  }

  clearNearbySearchTimer();
  activeNearbySearchToken += 1;
  setNearbySearchQuerySilently(
    firstNonEmptyString(poi?.name, nearbySearchQuery.value),
  );
  nearbySearchResults.value = [];
  nearbySearchError.value = "";
  nearbyHasSearched.value = false;
  setNearbyPinnedCenterLabel(poi, "已选地点");

  suppressMapReloadUntil = Date.now() + 1200;
  mapStore.updateCenter(coords.latitude, coords.longitude);
  mapStore.updateZoom(Math.max(Number(mapStore.zoom) || 12, 15));
  scheduleNearbyCenterLabelRefresh(
    nearbyPinnedCenterLabel.value?.label || "",
    80,
  );
  scheduleNearbyStoriesReload();
}

// ========== 全局搜索 - 地点搜索 ==========
async function performGlobalPlaceSearch(keyword) {
  if (!keyword || keyword.trim().length < 2) {
    searchPlaceResults.value = [];
    return;
  }

  searchPlaceLoading.value = true;
  searchPlaceError.value = '';

  try {
    await ensureNearbyPlaceSearch();
    const anchor =
      extractCoordinates(mapStore.userLocation) ||
      extractCoordinates(mapStore.center);
    const sortAnchor = extractCoordinates(mapStore.userLocation) || anchor;
    const { pois, errorMessage } = await searchPoisWithContext({
      createPlaceSearch: (options = {}) =>
        new window.AMap.PlaceSearch({
          pageSize: 10,
          pageIndex: 1,
          extensions: 'all',
          ...options,
        }),
      keyword: keyword.trim(),
      anchor,
      sortAnchor,
      locality: currentUserSearchLocality.value,
      radius: POI_SEARCH_RADIUS_METERS,
      normalizePoi: normalizeNearbyPoiFromGeocode,
    });

    searchPlaceResults.value = pois || [];
    searchPlaceError.value = errorMessage || '';
    searchPlaceSearched.value = true;
  } catch (err) {
    searchPlaceResults.value = [];
    searchPlaceError.value = '地点搜索暂不可用';
    console.error('[Map] Place search failed:', err);
  } finally {
    searchPlaceLoading.value = false;
  }
}

function handlePlaceSelect(poi) {
  const coords = extractCoordinates(poi);
  if (!coords) return;

  // 先移动地图到目标位置并放大
  mapStore.updateCenter(coords.latitude, coords.longitude);
  mapStore.updateZoom(Math.max(Number(mapStore.zoom) || 12, 15));

  // 等待地图动画稳定后，纸飞机从屏幕边缘飞入
  setTimeout(() => {
    if (amapRef.value) {
      amapRef.value.flyPaperPlaneFromEdge(coords.latitude, coords.longitude);
    }
  }, 800);

  // 关闭搜索面板
  searchFocused.value = false;
}

function formatDistance(meters) {
  if (meters == null) return '';
  if (meters < 1000) return Math.round(meters) + 'm';
  return (meters / 1000).toFixed(1) + 'km';
}

// ========== 纸飞机附近故事面板 ==========
async function loadPlaneNearby(isLoadMore = false) {
  const pos = planePosition.value || extractCoordinates(mapStore.userLocation) || extractCoordinates(mapStore.center);
  if (!pos) {
    planeNearbyError.value = '无法获取位置';
    return;
  }

  const page = isLoadMore ? planeNearbyPage.value + 1 : 1;
  const limit = isLoadMore ? WALL_PAGE_SIZE : WALL_INITIAL_LIMIT;

  if (isLoadMore) {
    planeNearbyLoadingMore.value = true;
  } else {
    planeNearbyLoading.value = true;
    planeNearbyItems.value = [];
    planeNearbyPage.value = 0;
    planeNearbyError.value = null;
  }

  try {
    const res = await mapApi.exploreStories(pos.latitude, pos.longitude, 5000, {
      page,
      limit,
      summary: '1',
    });
    const data = res?.data || res;
    const stories = data?.stories || data?.list || data?.items || (Array.isArray(data) ? data : []);

    if (isLoadMore) {
      planeNearbyItems.value.push(...stories);
    } else {
      planeNearbyItems.value = stories;
    }
    planeNearbyPage.value = page;
    planeNearbyTotalPages.value = data?.totalPages || data?.pagination?.totalPages || 1;
    planeNearbyInitialDone.value = true;
    planeNearbyError.value = null;
  } catch (err) {
    if (!isLoadMore) planeNearbyError.value = '加载附近故事失败';
    console.error('[PlaneNearby] load failed:', err);
  } finally {
    planeNearbyLoading.value = false;
    planeNearbyLoadingMore.value = false;
  }
}

function openPlaneNearby() {
  if (showPublishSidebar.value) closePublishPanel();
  if (showUserSidebar.value) closeUserPanel();
  showPlaneNearby.value = true;
  isDockExpanded.value = false;
  loadPlaneNearby(false);
}

function closePlaneNearby() {
  showPlaneNearby.value = false;
  showPlaneNearbyBackToTop.value = false;
}

const planeNearbyContentRef = ref(null);
const showPlaneNearbyBackToTop = ref(false);

function handlePlaneNearbyScroll(e) {
  const el = e.target;
  if (!el) return;
  // 加载更多
  if (planeNearbyLoadingMore.value || !planeNearbyHasMore.value) {
    // 仍然检测滚动方向
  } else {
    const threshold = 100;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      loadPlaneNearby(true);
    }
  }
  showPlaneNearbyBackToTop.value = el.scrollTop > 120;
}

function scrollPlaneNearbyToTop() {
  planeNearbyContentRef.value?.scrollTo({ top: 0, behavior: 'smooth' });
  showPlaneNearbyBackToTop.value = false;
}

// 纸飞机菜单 DOM（悬停触发）
let planeMenuEl = null;
let planeMenuHideTimer = null;
const PLANE_MENU_HIDE_DELAY = 300;

function hidePlaneMenu(immediate = false) {
  if (planeMenuHideTimer) {
    clearTimeout(planeMenuHideTimer);
    planeMenuHideTimer = null;
  }
  if (!planeMenuEl) return;
  if (immediate) {
    if (planeMenuEl.parentNode) planeMenuEl.parentNode.removeChild(planeMenuEl);
    planeMenuEl = null;
    return;
  }
  planeMenuEl.style.transition = 'opacity 0.1s ease, transform 0.1s ease';
  planeMenuEl.style.opacity = '0';
  planeMenuEl.style.transform = 'translateY(8px)';
  setTimeout(() => {
    if (planeMenuEl && planeMenuEl.parentNode) {
      planeMenuEl.parentNode.removeChild(planeMenuEl);
    }
    planeMenuEl = null;
  }, 100);
}

function showPlaneMenu(clientX, clientY) {
  if (planeMenuHideTimer) {
    clearTimeout(planeMenuHideTimer);
    planeMenuHideTimer = null;
  }
  // 如果菜单已存在且可见，仅更新位置
  if (planeMenuEl && planeMenuEl.parentNode) {
    const menuW = planeMenuEl.offsetWidth;
    const menuH = planeMenuEl.offsetHeight;
    let left = clientX - menuW / 2;
    let top = clientY - menuH - 12;
    if (left < 8) left = 8;
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
    if (top < 8) top = clientY + 16;
    planeMenuEl.style.left = left + 'px';
    planeMenuEl.style.top = top + 'px';
    planeMenuEl.style.opacity = '1';
    planeMenuEl.style.transform = 'translateY(0)';
    return;
  }

  planeMenuEl = document.createElement('div');
  planeMenuEl.className = 'paper-plane-menu';
  planeMenuEl.innerHTML = `
    <div class="plane-menu-item" data-action="nearby">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <span>附近故事</span>
    </div>
    <div class="plane-menu-item" data-action="publish">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
      <span>发布故事</span>
    </div>
  `;

  // 点击选项
  planeMenuEl.addEventListener('click', (e) => {
    const item = e.target.closest('.plane-menu-item');
    if (!item) return;
    const action = item.dataset.action;
    hidePlaneMenu();
    if (action === 'nearby') {
      openPlaneNearby();
    } else if (action === 'publish') {
      handlePaperPlanePublish();
    }
  });

  // 鼠标在菜单上时保持显示，离开后延迟隐藏
  planeMenuEl.addEventListener('mouseenter', () => {
    if (planeMenuHideTimer) {
      clearTimeout(planeMenuHideTimer);
      planeMenuHideTimer = null;
    }
  }, { passive: true });
  planeMenuEl.addEventListener('mouseleave', () => {
    scheduleHidePlaneMenu();
  }, { passive: true });

  // 定位菜单在纸飞机位置上方
  document.body.appendChild(planeMenuEl);
  const menuW = planeMenuEl.offsetWidth;
  const menuH = planeMenuEl.offsetHeight;
  let left = clientX - menuW / 2;
  let top = clientY - menuH - 12;
  if (left < 8) left = 8;
  if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
  if (top < 8) top = clientY + 16;
  planeMenuEl.style.left = left + 'px';
  planeMenuEl.style.top = top + 'px';
  planeMenuEl.classList.toggle('dark', effectiveMapTheme.value === 'dark');

  // 触发弹出动画
  requestAnimationFrame(() => {
    planeMenuEl.style.opacity = '1';
    planeMenuEl.style.transform = 'translateY(0)';
  });
}

function scheduleHidePlaneMenu() {
  if (planeMenuHideTimer) clearTimeout(planeMenuHideTimer);
  planeMenuHideTimer = setTimeout(() => {
    hidePlaneMenu();
    planeMenuHideTimer = null;
  }, PLANE_MENU_HIDE_DELAY);
}

function handlePaperPlaneHover(point) {
  if (isAdjustingPlanePosition.value || isPickingPublishLocation.value || isPickingDockPublishLocation.value) return;
  if (point.screenX != null && point.screenY != null) {
    showPlaneMenu(point.screenX, point.screenY);
  }
}

function handlePaperPlaneLeave() {
  scheduleHidePlaneMenu();
}

function handlePaperPlaneClick(point) {
  // 悬停模式下点击纸飞机也显示菜单
  if (isAdjustingPlanePosition.value || isPickingPublishLocation.value || isPickingDockPublishLocation.value) return;
  if (point.screenX != null && point.screenY != null) {
    showPlaneMenu(point.screenX, point.screenY);
  } else {
    const mapRef = document.querySelector('.amap-container');
    if (mapRef) {
      const rect = mapRef.getBoundingClientRect();
      showPlaneMenu(rect.left + rect.width / 2, rect.top + rect.height / 2 - 60);
    }
  }
}

function handlePaperPlanePublish() {
  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast("请先登录后再发布故事", "warning");
    showLoginModal.value = true;
    return;
  }
  // 关闭其他面板
  if (showSidebar.value) closeStoryPanel();
  if (showUserSidebar.value) closeUserPanel();
  if (showPlaneNearby.value) showPlaneNearby.value = false;
  if (showVipCenter.value) showVipCenter = false;
  if (showDockPublishSidebar.value) closeDockPublishPanel();
  isAdjustingPlanePosition.value = false;
  isAdjustingWaitingForPlane.value = false;
  isPublishWaitingForPlane.value = false;
  shouldAutoConfirmPublishPick.value = false;
  shouldAutoConfirmAdjustPlanePick.value = false;
  adjustPlaneClickScreenPos.value = null;
  adjustPlaneSavedPosition.value = null;
  // 逆地理编码纸飞机位置
  const coords =
    extractCoordinates(planePosition.value)
    || extractCoordinates(mapStore.userLocation)
    || extractCoordinates(mapStore.center);
  if (!coords) {
    showToast('æµ£å¶‡ç–†ç‘™ï½†ç€½æ¾¶è¾«è§¦é”›å²ƒî‡¬é–²å¶ˆç˜¯', 'warning');
    return;
  }
  reverseGeocodeLocationDetailSafe(coords.latitude, coords.longitude).then((location) => {
    if (!location) return;
    const displayName = pickPublishLocationSearchTextSafe(location, "当前位置");
    isPickingPublishLocation.value = false;
    showPublishSidebar.value = true;
    nextTick(() => {
      publishPrefillQuery.value = displayName;
    });
  });
}

async function handlePaperPlaneMove(point) {
  // 始终同步纸飞机实际位置
  if (point?.latitude != null && point?.longitude != null) {
    planePosition.value = { latitude: point.latitude, longitude: point.longitude };
  }

  // 发布故事地图选点 - 纸飞机已飞到选点位置，更新询问弹窗
  if (isPublishWaitingForPlane.value) {
    const pickedLocation = await reverseGeocodePickedLocation(
      point.latitude,
      point.longitude,
    );
    isPublishWaitingForPlane.value = false;
    if (pickedLocation) {
      if (shouldAutoConfirmPublishPick.value) {
        finalizePublishPickSelection(pickedLocation);
        return;
      }
      setPublishPickSelection(pickedLocation, publishPickPrompt.value);
    }
    return;
  }

  // 调整纸飞机位置 - 纸飞机已到达新位置，弹窗确认
  if (isAdjustingWaitingForPlane.value) {
    const pickedLocation = await reverseGeocodePickedLocation(point.latitude, point.longitude);
    isAdjustingWaitingForPlane.value = false;
    if (pickedLocation) {
      if (shouldAutoConfirmAdjustPlanePick.value) {
        finalizeAdjustPlanePickSelection(pickedLocation);
        return;
      }
      setPublishPickSelection(pickedLocation, adjustPlaneClickScreenPos.value);
    }
    adjustPlaneClickScreenPos.value = null;
    return;
  }

  // 功能卡组发布 - 纸飞机已飞到选点位置，弹窗确认
  if (isDockPublishWaitingForPlane.value) {
    const pickedLocation = await reverseGeocodePickedLocation(point.latitude, point.longitude);
    isDockPublishWaitingForPlane.value = false;
    if (pickedLocation) {
      if (shouldAutoConfirmDockPublishPick.value) {
        finalizeDockPublishPickSelection(pickedLocation);
        dockPublishClickScreenPos.value = null;
        return;
      }
      setDockPublishPickSelection(pickedLocation, dockPublishClickScreenPos.value);
    }
    dockPublishClickScreenPos.value = null;
    return;
  }

  // 如果附近故事面板已打开，重新加载
  if (showPlaneNearby.value) {
    loadPlaneNearby(false);
  }
}

function ensureGeocoder() {
  if (geocoderInstance) {
    return Promise.resolve(geocoderInstance);
  }

  if (geocoderPromise) {
    return geocoderPromise;
  }

  geocoderPromise = new Promise((resolve, reject) => {
    if (!window.AMap?.plugin) {
      geocoderPromise = null;
      reject(new Error("AMap is not ready."));
      return;
    }

    window.AMap.plugin(["AMap.Geocoder"], () => {
      if (!window.AMap?.Geocoder) {
        geocoderPromise = null;
        reject(new Error("AMap Geocoder is unavailable."));
        return;
      }

      geocoderInstance = new window.AMap.Geocoder({ extensions: "all" });
      resolve(geocoderInstance);
    });
  });

  return geocoderPromise;
}

async function reverseGeocodeLocationDetail(latitude, longitude) {
  const cacheKey = getCoordinateCacheKey(latitude, longitude);
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey);
  }

  if (reverseGeocodePending.has(cacheKey)) {
    return reverseGeocodePending.get(cacheKey);
  }

  const pendingTask = (async () => {
    try {
      const geocoder = await ensureGeocoder();
      const result = await new Promise((resolve) => {
        geocoder.getAddress([longitude, latitude], (status, geocodeResult) => {
          resolve(status === "complete" ? geocodeResult : null);
        });
      });

      const regeocode = result?.regeocode || {};
      const district = [
        regeocode.addressComponent?.city,
        regeocode.addressComponent?.district,
        regeocode.addressComponent?.township,
      ]
        .filter(Boolean)
        .join(" ");
      const city = firstNonEmptyString(
        regeocode.addressComponent?.city,
        regeocode.addressComponent?.province,
      );
      const province = firstNonEmptyString(
        regeocode.addressComponent?.province,
      );
      const locality = {
        city,
        district,
        adcode: firstNonEmptyString(regeocode.addressComponent?.adcode),
        province,
      };
      const firstPoi = Array.isArray(regeocode.pois)
        ? normalizeNearbyPoiFromGeocode(regeocode.pois[0], locality)
        : null;
      const resolvedLocation = buildFallbackLocation(latitude, longitude, {
        id: `map-pick-${longitude}-${latitude}`,
        name: getNonPlaceholderLocationLabel(
          firstPoi?.name,
          regeocode.formattedAddress,
          district,
          city,
          province,
          "已选地点",
        ),
        address: pickLocationText([
          firstPoi?.address,
          regeocode.formattedAddress,
          firstPoi?.name,
          formatMapPickAddress(latitude, longitude),
        ]),
        city: firstNonEmptyString(firstPoi?.city, city),
        district: firstNonEmptyString(firstPoi?.district, district),
        adcode: firstNonEmptyString(
          firstPoi?.adcode,
          regeocode.addressComponent?.adcode,
        ),
        province: firstNonEmptyString(firstPoi?.province, province),
        type: firstNonEmptyString(firstPoi?.type, "map-click"),
        nearbyPois: Array.isArray(regeocode.pois) ? regeocode.pois : [],
      });

      reverseGeocodeCache.set(cacheKey, resolvedLocation);
      return resolvedLocation;
    } catch (error) {
      return buildFallbackLocation(latitude, longitude);
    } finally {
      reverseGeocodePending.delete(cacheKey);
    }
  })();

  reverseGeocodePending.set(cacheKey, pendingTask);
  return pendingTask;
}

function normalizeNearbyPoiFromGeocode(poi, locality = null) {
  if (!poi) {
    return null;
  }

  const latitude = toFiniteNumber(
    poi.location?.getLat?.() ?? poi.location?.lat,
  );
  const longitude = toFiniteNumber(
    poi.location?.getLng?.() ?? poi.location?.lng,
  );
  if (latitude === null || longitude === null) {
    return null;
  }

  const city = firstNonEmptyString(
    poi.cityname,
    poi.city,
    locality?.city,
    locality?.province,
  );
  const province = firstNonEmptyString(
    poi.pname,
    poi.province,
    locality?.province,
  );
  const district = buildLocationDistrictLabel({
    city,
    district: firstNonEmptyString(poi.adname, poi.district, locality?.district),
    province,
  });
  const address = buildLocationAddressLabel(
    {
      city,
      district,
      province,
      address: firstNonEmptyString(poi.address),
      formattedAddress: firstNonEmptyString(poi.formattedAddress),
      name: poi.name || "Nearby Place",
    },
    latitude,
    longitude,
  );

  return {
    id: poi.id || `nearby-${longitude}-${latitude}-${poi.name || "poi"}`,
    name: poi.name || "Nearby Place",
    address: address || poi.name || formatMapPickAddress(latitude, longitude),
    latitude,
    longitude,
    city,
    district,
    adcode: firstNonEmptyString(poi.adcode, locality?.adcode),
    province,
    type: poi.type || "nearby-poi",
    distance: toFiniteNumber(poi.distance),
  };
}

function formatMapPickAddressSafe(latitude, longitude) {
  return `经度 ${Number(longitude).toFixed(6)}，纬度 ${Number(latitude).toFixed(6)}`;
}

function formatPoiDistrictLabelSafe(poi) {
  if (!poi || typeof poi !== "object") {
    return "已解析位置";
  }

  return buildLocationDistrictLabel(poi) || "已解析位置";
}

function isCoordinateOnlyLocationLabelSafe(value) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim();
  return (
    normalized.startsWith("经度 ") ||
    normalized.startsWith("缁忓害 ") ||
    /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(normalized)
  );
}

function isGenericLocationPlaceholderSafe(value) {
  if (typeof value !== "string") {
    return false;
  }

  return [
    "Map Pick",
    "Map Center",
    "Current Location",
    "Nearby Place",
    "已选地点",
    "当前位置",
    "当前地理位置",
  ].includes(value.trim());
}

function getStoryLocationTextSafe(story, fallback = "未知位置") {
  const label = pickLocationText([
    story?.location?.address,
    story?.location?.formattedAddress,
    story?.location?.name,
    story?.locationName,
  ]);

  return label || fallback;
}

function sanitizeLocationLabelSafe(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  if (
    isGenericLocationPlaceholderSafe(normalized) ||
    isCoordinateOnlyLocationLabelSafe(normalized)
  ) {
    return "";
  }

  return normalized;
}

function pickPublishLocationSearchTextSafe(location, fallback = "") {
  const safeFallback = sanitizeLocationLabelSafe(fallback);
  if (!location || typeof location !== "object") {
    return safeFallback || "当前位置";
  }

  const suggestedLocation = buildSuggestedLocations(
    location,
    location.nearbyPois || [],
  )[0];
  const candidates = [
    suggestedLocation?.name,
    suggestedLocation?.address,
    location.name,
    location.address,
    location.formattedAddress,
    location.district,
    location.city,
    safeFallback,
  ]
    .map((value) => sanitizeLocationLabelSafe(value))
    .filter(Boolean);

  return pickLocationText(candidates, false) || safeFallback || "当前位置";
}

function hasResolvedLocationDetails(location) {
  if (!location || typeof location !== "object") {
    return false;
  }

  return Boolean(
    sanitizeLocationLabelSafe(location.name) ||
      sanitizeLocationLabelSafe(location.address) ||
      sanitizeLocationLabelSafe(location.district) ||
      firstNonEmptyString(location.city, location.province),
  );
}

async function resolveLocationFromNearbyPlaceSearch(
  latitude,
  longitude,
  locality = null,
) {
  try {
    await ensureNearbyPlaceSearch();
    const anchor = { latitude, longitude };
    const { pois } = await searchPoisWithContext({
      createPlaceSearch: (options = {}) =>
        new window.AMap.PlaceSearch({
          pageSize: 8,
          pageIndex: 1,
          extensions: "all",
          ...options,
        }),
      keyword: "",
      anchor,
      sortAnchor: anchor,
      locality,
      radius: 1500,
      normalizePoi: (poi) => normalizeNearbyPoiFromGeocode(poi, locality),
    });

    return Array.isArray(pois) ? pois[0] || null : null;
  } catch (error) {
    return null;
  }
}

async function reverseGeocodeLocationDetailSafe(latitude, longitude) {
  const cacheKey = getCoordinateCacheKey(latitude, longitude);
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey);
  }

  if (reverseGeocodePending.has(cacheKey)) {
    return reverseGeocodePending.get(cacheKey);
  }

  const pendingTask = (async () => {
    try {
      const geocoder = await ensureGeocoder();
      const result = await new Promise((resolve) => {
        geocoder.getAddress([longitude, latitude], (status, geocodeResult) => {
          resolve(status === "complete" ? geocodeResult : null);
        });
      });

      const regeocode = result?.regeocode || {};
      const district = [
        regeocode.addressComponent?.city,
        regeocode.addressComponent?.district,
        regeocode.addressComponent?.township,
      ]
        .filter(Boolean)
        .join(" ");
      const city = firstNonEmptyString(
        regeocode.addressComponent?.city,
        regeocode.addressComponent?.province,
      );
      const province = firstNonEmptyString(
        regeocode.addressComponent?.province,
      );
      const locality = {
        city,
        district,
        adcode: firstNonEmptyString(regeocode.addressComponent?.adcode),
        province,
      };
      const rawPois = Array.isArray(regeocode.pois) ? regeocode.pois : [];
      const normalizedPois = rawPois
        .map((poi) => normalizeNearbyPoiFromGeocode(poi, locality))
        .filter(Boolean);
      const firstPoi = normalizedPois[0] || null;
      const formattedAddress = firstNonEmptyString(regeocode.formattedAddress);
      let resolvedLocation = buildFallbackLocation(latitude, longitude, {
        id: `map-pick-${longitude}-${latitude}`,
        name: getNonPlaceholderLocationLabel(
          firstPoi?.name,
          formattedAddress,
          district,
          city,
          province,
          "已选地点",
        ),
        address: pickLocationText([
          firstPoi?.address,
          formattedAddress,
          firstPoi?.name,
          formatMapPickAddressSafe(latitude, longitude),
        ]),
        city: firstNonEmptyString(firstPoi?.city, city),
        district: firstNonEmptyString(firstPoi?.district, district),
        adcode: firstNonEmptyString(
          firstPoi?.adcode,
          regeocode.addressComponent?.adcode,
        ),
        province: firstNonEmptyString(firstPoi?.province, province),
        type: firstNonEmptyString(firstPoi?.type, "map-click"),
        nearbyPois: normalizedPois,
      });

      if (!hasResolvedLocationDetails(resolvedLocation)) {
        const nearbyPoi = await resolveLocationFromNearbyPlaceSearch(
          latitude,
          longitude,
          locality,
        );
        if (nearbyPoi) {
          resolvedLocation = buildFallbackLocation(latitude, longitude, {
            ...nearbyPoi,
            nearbyPois: [nearbyPoi],
            type: firstNonEmptyString(nearbyPoi.type, "map-click"),
          });
        }
      }

      if (hasResolvedLocationDetails(resolvedLocation)) {
        reverseGeocodeCache.set(cacheKey, resolvedLocation);
      }

      return resolvedLocation;
    } catch (error) {
      return buildFallbackLocation(latitude, longitude);
    } finally {
      reverseGeocodePending.delete(cacheKey);
    }
  })();

  reverseGeocodePending.set(cacheKey, pendingTask);
  return pendingTask;
}

function buildSuggestedLocations(rawLocation, nearbyPois = []) {
  if (!rawLocation) {
    return [];
  }

  const normalizedPois = nearbyPois
    .map((poi) => normalizeNearbyPoiFromGeocode(poi, rawLocation))
    .filter(Boolean)
    .filter(
      (poi, index, list) =>
        list.findIndex((item) => item.id === poi.id) === index,
    )
    .sort(
      (left, right) =>
        getSuggestedLocationDistance(left, rawLocation) -
        getSuggestedLocationDistance(right, rawLocation),
    )
    .slice(0, 8);

  if (normalizedPois.length > 0) {
    return normalizedPois;
  }

  const coords = extractCoordinates(rawLocation);
  return coords
    ? [buildFallbackLocation(coords.latitude, coords.longitude, rawLocation)]
    : [];
}

function pickPublishLocationSearchText(location, fallback = "") {
  const safeFallback = sanitizeLocationLabel(fallback);
  if (!location || typeof location !== "object") {
    return safeFallback || "当前位置";
  }

  const suggestedLocation = buildSuggestedLocations(
    location,
    location.nearbyPois || [],
  )[0];
  const candidates = [
    suggestedLocation?.name,
    suggestedLocation?.address,
    location.name,
    location.address,
    location.formattedAddress,
    location.district,
    location.city,
    safeFallback,
  ]
    .map((value) => sanitizeLocationLabel(value))
    .filter(Boolean);

  return pickLocationText(candidates, false) || safeFallback || "当前位置";
}

function resolveSuggestedLocationSelection(location) {
  const suggestedLocations = buildSuggestedLocations(
    location,
    location?.nearbyPois || [],
  );
  return {
    suggestedLocations,
    nextLocation: suggestedLocations[0] || location,
  };
}

function finalizePublishPickSelection(location) {
  const { suggestedLocations, nextLocation } = resolveSuggestedLocationSelection(location);
  const displayName = pickPublishLocationSearchTextSafe(
    nextLocation,
    publishPrefillQuery.value || "当前位置",
  );

  suggestedPublishLocations.value = suggestedLocations;
  pickedPublishLocation.value = nextLocation;
  publishPrefillQuery.value = displayName;
  publishPickPrompt.value = null;
  isPublishWaitingForPlane.value = false;
  shouldAutoConfirmPublishPick.value = false;
  isPickingPublishLocation.value = false;
}

function finalizeAdjustPlanePickSelection(location) {
  const { suggestedLocations, nextLocation } = resolveSuggestedLocationSelection(location);
  const displayName = pickPublishLocationSearchTextSafe(
    nextLocation,
    adjustPlaneSavedPrefill.value || publishPrefillQuery.value || "当前位置",
  );

  suggestedPublishLocations.value = suggestedLocations;
  pickedPublishLocation.value = nextLocation;
  publishPickPrompt.value = null;
  adjustPlaneClickScreenPos.value = null;
  isAdjustingPlanePosition.value = false;
  isPickingPublishLocation.value = false;
  isAdjustingWaitingForPlane.value = false;
  isPublishWaitingForPlane.value = false;
  shouldAutoConfirmAdjustPlanePick.value = false;
  showPublishSidebar.value = true;
  nextTick(() => {
    publishPrefillQuery.value = displayName;
  });
  adjustPlaneSavedPosition.value = null;
}

function finalizeDockPublishPickSelection(location) {
  const { suggestedLocations, nextLocation } = resolveSuggestedLocationSelection(location);

  dockPublishSuggestedLocations.value = suggestedLocations;
  dockPublishPickedLocation.value = nextLocation;
  isDockPublishPickPrompt.value = null;
  isDockPublishWaitingForPlane.value = false;
  shouldAutoConfirmDockPublishPick.value = false;
  dockPublishClickScreenPos.value = null;
  isPickingDockPublishLocation.value = false;
}

function setPublishPickSelection(location, screenPos = null) {
  if (!location) {
    return;
  }

  const nextScreenX =
    toFiniteNumber(screenPos?.screenX)
    ?? toFiniteNumber(publishPickPrompt.value?.screenX);
  const nextScreenY =
    toFiniteNumber(screenPos?.screenY)
    ?? toFiniteNumber(publishPickPrompt.value?.screenY);

  pickedPublishLocation.value = location;
  publishPickPrompt.value = {
    location,
    screenX: nextScreenX,
    screenY: nextScreenY,
  };
}

function setDockPublishPickSelection(location, screenPos = null) {
  if (!location) {
    return;
  }

  const nextScreenX =
    toFiniteNumber(screenPos?.screenX)
    ?? toFiniteNumber(isDockPublishPickPrompt.value?.screenX);
  const nextScreenY =
    toFiniteNumber(screenPos?.screenY)
    ?? toFiniteNumber(isDockPublishPickPrompt.value?.screenY);

  dockPublishPickedLocation.value = location;
  isDockPublishPickPrompt.value = {
    location,
    screenX: nextScreenX,
    screenY: nextScreenY,
  };
}

function getPublishPickPromptStyle(prompt) {
  const promptWidth = 220;
  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  const screenX = toFiniteNumber(prompt?.screenX) ?? viewportWidth / 2;
  const screenY = toFiniteNumber(prompt?.screenY) ?? viewportHeight / 2;
  const left = Math.min(
    Math.max(screenX - promptWidth / 2, 16),
    Math.max(viewportWidth - promptWidth - 16, 16),
  );
  const top = Math.min(
    Math.max(screenY + 18, 16),
    Math.max(viewportHeight - 132, 16),
  );

  return {
    left: `${left}px`,
    top: `${top}px`,
  };
}

function confirmPublishNearbySearch() {
  const prompt = publishPickPrompt.value;
  if (!prompt?.location) {
    publishPickPrompt.value = null;
    return;
  }

  if (isAdjustingPlanePosition.value) {
    if (isAdjustingWaitingForPlane.value) {
      shouldAutoConfirmAdjustPlanePick.value = true;
      publishPickPrompt.value = null;
      return;
    }

    finalizeAdjustPlanePickSelection(prompt.location);
    return;
  }

  if (isPublishWaitingForPlane.value) {
    shouldAutoConfirmPublishPick.value = true;
    publishPickPrompt.value = null;
    return;
  }

  finalizePublishPickSelection(prompt.location);
}

function rejectPublishNearbySearch() {
  publishPickPrompt.value = null;
  suggestedPublishLocations.value = [];
  pickedPublishLocation.value = null;
  // 调整纸飞机位置模式 - 拒绝后继续调整模式，可重新点击地图
  if (isAdjustingPlanePosition.value) {
    shouldAutoConfirmAdjustPlanePick.value = false;
    isAdjustingWaitingForPlane.value = false;
    return;
  }
  shouldAutoConfirmPublishPick.value = false;
  isPublishWaitingForPlane.value = false;
  isPickingPublishLocation.value = true;
}

function confirmDockPublishNearbySearch() {
  const prompt = isDockPublishPickPrompt.value;
  if (!prompt?.location) {
    isDockPublishPickPrompt.value = null;
    return;
  }

  if (isDockPublishWaitingForPlane.value) {
    shouldAutoConfirmDockPublishPick.value = true;
    isDockPublishPickPrompt.value = null;
    return;
  }

  finalizeDockPublishPickSelection(prompt.location);
}

function rejectDockPublishNearbySearch() {
  isDockPublishPickPrompt.value = null;
  dockPublishSuggestedLocations.value = [];
  dockPublishPickedLocation.value = null;
  shouldAutoConfirmDockPublishPick.value = false;
  isDockPublishWaitingForPlane.value = false;
  isPickingDockPublishLocation.value = true;
}

function getDockPublishPickPromptStyle(prompt) {
  return getPublishPickPromptStyle(prompt);
}

function reverseGeocodePickedLocation(latitude, longitude) {
  return reverseGeocodeLocationDetailSafe(latitude, longitude);
}

async function handlePublishMapClick(point) {
  hidePlaneMenu();
  searchFocused.value = false;

  // 调整纸飞机位置模式 - 纸飞机飞到点击位置
  if (isAdjustingPlanePosition.value) {
    const coords = extractCoordinates(point);
    if (!coords) return;
    isAdjustingWaitingForPlane.value = true;
    adjustPlaneClickScreenPos.value = { screenX: point?.screenX, screenY: point?.screenY };
    setPublishPickSelection(
      buildFallbackLocation(coords.latitude, coords.longitude),
      adjustPlaneClickScreenPos.value,
    );
    if (coordinatesRoughlyEqual(planePosition.value, coords)) {
      isAdjustingWaitingForPlane.value = false;
      const pickedLocation = await reverseGeocodePickedLocation(
        coords.latitude,
        coords.longitude,
      );
      if (pickedLocation) {
        setPublishPickSelection(pickedLocation, adjustPlaneClickScreenPos.value);
      }
      adjustPlaneClickScreenPos.value = null;
      return;
    }
    planePosition.value = { latitude: coords.latitude, longitude: coords.longitude };
    return;
  }

  // 功能卡组发布 - 地图选点模式（纸飞机飞过去再解析）
  if (showDockPublishSidebar.value && isPickingDockPublishLocation.value) {
    const coords = extractCoordinates(point);
    if (!coords) return;
    isDockPublishWaitingForPlane.value = true;
    dockPublishClickScreenPos.value = { screenX: point?.screenX, screenY: point?.screenY };
    setDockPublishPickSelection(
      buildFallbackLocation(coords.latitude, coords.longitude),
      dockPublishClickScreenPos.value,
    );
    if (coordinatesRoughlyEqual(planePosition.value, coords)) {
      isDockPublishWaitingForPlane.value = false;
      const pickedLocation = await reverseGeocodePickedLocation(
        coords.latitude,
        coords.longitude,
      );
      if (pickedLocation) {
        setDockPublishPickSelection(pickedLocation, dockPublishClickScreenPos.value);
      }
      dockPublishClickScreenPos.value = null;
      return;
    }
    planePosition.value = { latitude: coords.latitude, longitude: coords.longitude };
    return;
  }
  // 纸飞机发布 - 地图选点模式
  if (!showPublishSidebar.value || !isPickingPublishLocation.value) {
    const coords = extractCoordinates(point);
    console.log('[Map] Moving paper plane to:', coords);
    if (coords) {
      planePosition.value = { latitude: coords.latitude, longitude: coords.longitude };
    }
    return;
  }

  const coords = extractCoordinates(point);
  if (!coords) {
    return;
  }

  suggestedPublishLocations.value = [];
  isPublishWaitingForPlane.value = true;
  setPublishPickSelection(
    buildFallbackLocation(coords.latitude, coords.longitude),
    { screenX: point?.screenX, screenY: point?.screenY },
  );
  if (coordinatesRoughlyEqual(planePosition.value, coords)) {
    isPublishWaitingForPlane.value = false;
    const pickedLocation = await reverseGeocodePickedLocation(
      coords.latitude,
      coords.longitude,
    );
    if (pickedLocation) {
      setPublishPickSelection(pickedLocation, publishPickPrompt.value);
    }
    return;
  }
  planePosition.value = { latitude: coords.latitude, longitude: coords.longitude };
}

function handleUserClick() {
  if (showPublishSidebar.value) {
    closePublishPanel();
  }
  if (showDockPublishSidebar.value) {
    closeDockPublishPanel();
  }
  if (showSidebar.value) {
    closeStoryPanel();
  }
  resetProfileScrollState();
  setTimeout(() => {
    showUserSidebar.value = true;
    // 面板打开后连接虚拟滚动（等 DOM 渲染完）
    nextTick(() => vScrollConnect());
  }, 100);
  isDockExpanded.value = false;

  if (userStore.isLoggedIn && !userStore.isGuest) {
    userStore.fetchUser().catch((error) => {
      console.error("刷新用户信息失败:", error);
    });
  }

  // 自动加载默认标签页（作品）数据
}

function handleMyLikes() {
  if (showPostsPanel.value) showPostsPanel.value = false;
  if (showFavoritesPanel.value) showFavoritesPanel.value = false;
  showLikesPanel.value = !showLikesPanel.value;

  if (showLikesPanel.value) {
    loadLikesData();
  }
}

function handleMyFavorites() {
  if (showLikesPanel.value) showLikesPanel.value = false;
  if (showPostsPanel.value) showPostsPanel.value = false;
  showFavoritesPanel.value = !showFavoritesPanel.value;

  if (showFavoritesPanel.value) {
    loadFavoritesData();
  }
}

function handleMyPosts() {
  if (showLikesPanel.value) showLikesPanel.value = false;
  if (showFavoritesPanel.value) showFavoritesPanel.value = false;
  showPostsPanel.value = !showPostsPanel.value;

  if (showPostsPanel.value) {
    void loadPostsData();
  }
}

async function handleFootprints() {
  if (showLikesPanel.value) showLikesPanel.value = false;
  if (showPostsPanel.value) showPostsPanel.value = false;
  if (showFavoritesPanel.value) showFavoritesPanel.value = false;

  if (showFootprints.value) {
    showFootprints.value = false;
    isDockExpanded.value = false;
    return;
  }

  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast("登录后才能使用我的足迹", "warning");
    isDockExpanded.value = false;
    return;
  }

  try {
    const storiesResp = await storyApi.getMyStories({ page: 1, limit: 2 });
    const storiesData = storiesResp?.data || storiesResp;
    const totalStories = Number(
      storiesData?.pagination?.total
      ?? storiesData?.stories?.length
      ?? storiesData?.items?.length
      ?? 0
    );

    if (totalStories < 2) {
      showToast("至少发布 2 个故事后才能播放足迹动画", "warning");
      isDockExpanded.value = false;
      return;
    }

    await vipStore.fetchEconomy();

    const result = await vipStore.useFootprint();
    if (!result.success) {
      showToast(result.message, 'error');
      isDockExpanded.value = false;
      return;
    }

    showFootprints.value = true;
  } catch (error) {
    console.error("打开足迹失败:", error);
    showToast(error?.message || "打开足迹失败，请稍后重试", "error");
  }

  isDockExpanded.value = false;
}

// --- VIP handlers ---
function handleStoryPolished({ storyId }) {
  const story = postsList.value.find(s => String(s.id) === String(storyId));
  if (story) {
    story._polished = true;
    story._polishedAt = new Date().toISOString();
  }
}

function handlePolishError({ type, message }) {
  if (type === 'insufficient_coins') {
    showCoinCenter.value = true;
  }
  showToast(message, type === 'insufficient_coins' ? 'warning' : 'error');
}

function handleCommentSettingsSaved(settings) {
  console.log('[Map] Comment settings saved:', settings);
  // 刷新当前故事评论中当前用户的 commentBg
  if (selectedStory.value && settings) {
    const currentUserId = String(userStore.user?.id);
    if (currentUserId) {
      storyComments.value = storyComments.value.map(c => {
        if (String(c.userId) === currentUserId) {
          return { ...c, commentBg: settings };
        }
        return c;
      });
      selectedStory.value = { ...selectedStory.value, comments: storyComments.value };
    }
  }
}

function handleOpenCommentBg() {
  commentSettingsFromStory.value = true;
  showCommentSettings.value = true;
}

function handleCommentSettingsClose() {
  showCommentSettings.value = false;
  commentSettingsFromStory.value = false;
  vipCenterFromStory.value = false;
}

function handleVisualCustomizerSaved(settings) {
  console.log('[Map] Visual customizer saved:', settings);
}

async function loadLikesData(isLoadMore = false) {
  if (isLoadMore) {
    if (likesLoadingMore.value || !likesHasMore.value) return;
    likesLoadingMore.value = true;
  } else {
    if (likesLoading.value) return;
    likesLoading.value = true;
    likesPage.value = 1;
    likesHasMore.value = true;
  }

  try {
    const result = await likeApi.getMyLikes({
      page: isLoadMore ? likesPage.value + 1 : 1,
      limit: likesPageSize,
    });

    const data = result.data || result;
    const rawStories = Array.isArray(data?.stories)
      ? data.stories
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.likes)
          ? data.likes
          : Array.isArray(data)
            ? data
            : [];
    const stories = rawStories
      .map((item) => {
        const story = normalizeUserPanelStory(item);
        if (story) {
          story.isLiked = true;
        }
        return story;
      })
      .filter(Boolean);


    if (isLoadMore) {
      likesList.value.push(...stories);
      likesPage.value++;
    } else {
      likesList.value = stories;
      storyCardAnimationKey.value++; // 触发入场动画
    }

    if (data?.pagination?.total != null) {
      likesTotalCount.value = data.pagination.total;
    } else if (!isLoadMore) {
      likesTotalCount.value = stories.length;
    }

    void hydrateStoryLocations(stories);

    if (stories.length < likesPageSize) {
      likesHasMore.value = false;
    }
  } catch (error) {
    console.error("加载点赞数据失败:", error);
  } finally {
    likesLoading.value = false;
    likesLoadingMore.value = false;
  }
}

function resolveUserPanelPaginationTotal(result) {
  const data = result?.data ?? result;
  const total = Number(data?.pagination?.total);
  return Number.isFinite(total) ? total : null;
}

async function refreshUserPanelTotals() {
  const [postsResult, likesResult, favoritesResult] = await Promise.allSettled([
    storyApi.getMyStories({ page: 1, limit: 1 }),
    likeApi.getMyLikes({ page: 1, limit: 1 }),
    favoriteApi.getMyFavorites({ page: 1, limit: 1 }),
  ]);

  if (postsResult.status === "fulfilled") {
    const total = resolveUserPanelPaginationTotal(postsResult.value);
    if (total !== null) {
      postsTotalCount.value = total;
    }
  }

  if (likesResult.status === "fulfilled") {
    const total = resolveUserPanelPaginationTotal(likesResult.value);
    if (total !== null) {
      likesTotalCount.value = total;
    }
  }

  if (favoritesResult.status === "fulfilled") {
    const total = resolveUserPanelPaginationTotal(favoritesResult.value);
    if (total !== null) {
      favoritesTotalCount.value = total;
    }
  }
}

function updateUserPanelTotalCount(totalCountRef, delta) {
  if (!delta) {
    return;
  }

  const currentTotal = Number(totalCountRef.value);
  if (!Number.isFinite(currentTotal) || currentTotal < 0) {
    return;
  }

  totalCountRef.value = Math.max(0, currentTotal + delta);
}

async function loadPostsData(isLoadMore = false) {
  if (isLoadMore) {
    if (postsLoadingMore.value || !postsHasMore.value) return;
    postsLoadingMore.value = true;
  } else {
    if (postsLoading.value) return;
    postsLoading.value = true;
    postsPage.value = 1;
    postsHasMore.value = true;
  }

  try {
    const result = await storyApi.getMyStories({
      page: isLoadMore ? postsPage.value + 1 : 1,
      limit: postsPageSize,
    });

    const data = result.data || result;
    const rawStories = Array.isArray(data?.stories)
      ? data.stories
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [];
    const fallbackAuthor = {
      username: userStore.user?.username || userStore.user?.name || "我",
      avatar: userStore.user?.avatar || "",
    };
    const stories = rawStories
      .map((item) => normalizeUserPanelStory(item, fallbackAuthor))
      .filter(Boolean);

    if (isLoadMore) {
      postsList.value.push(...stories);
      postsPage.value++;
    } else {
      postsList.value = stories;
      storyCardAnimationKey.value++; // 触发入场动画
    }

    // 更新总数
    if (data?.pagination?.total != null) {
      postsTotalCount.value = data.pagination.total;
    } else if (!isLoadMore) {
      postsTotalCount.value = stories.length;
    }

    // 判断是否已到最后一页
    if (stories.length < postsPageSize) {
      postsHasMore.value = false;
    }

    void hydrateStoryLocations(stories);

    // 从后端数据恢复擦亮状态
    vipStore.restorePolishedStories(rawStories);
  } catch (error) {
    console.error("加载发布数据失败:", error);
  } finally {
    postsLoading.value = false;
    postsLoadingMore.value = false;
  }
}

function handleLikesScroll(event) {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  if (scrollHeight - scrollTop - clientHeight < 50) {
    loadLikesData(true);
  }
}

function handlePostsScroll(event) {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  if (scrollHeight - scrollTop - clientHeight < 50) {
    loadPostsData(true);
  }
}

async function loadFavoritesData(isLoadMore = false) {
  if (isLoadMore) {
    if (favoritesLoadingMore.value || !favoritesHasMore.value) return;
    favoritesLoadingMore.value = true;
  } else {
    if (favoritesLoading.value) return;
    favoritesLoading.value = true;
    favoritesPage.value = 1;
    favoritesHasMore.value = true;
  }

  try {
    const result = await favoriteApi.getMyFavorites({
      page: isLoadMore ? favoritesPage.value + 1 : 1,
      limit: favoritesPageSize,
    });

    const data = result.data || result;
    const rawFavorites = Array.isArray(data?.favorites)
      ? data.favorites
      : Array.isArray(data?.items)
        ? data.items
        : [];

    const basicStories = rawFavorites
      .map((item) => {
        const storyData = item.story || item;
        const story = normalizeUserPanelStory(storyData);
        if (story) story.isFavorited = true;
        return story;
      })
      .filter(Boolean);

    if (isLoadMore) {
      favoritesList.value.push(...basicStories);
      favoritesPage.value++;
    } else {
      favoritesList.value = basicStories;
      storyCardAnimationKey.value++; // 触发入场动画
    }

    if (data?.pagination?.total != null) {
      favoritesTotalCount.value = data.pagination.total;
    } else if (!isLoadMore) {
      favoritesTotalCount.value = basicStories.length;
    }

    void hydrateStoryLocations(basicStories);

    if (basicStories.length < favoritesPageSize) {
      favoritesHasMore.value = false;
    }
  } catch (error) {
    console.error("加载收藏数据失败:", error);
  } finally {
    favoritesLoading.value = false;
    favoritesLoadingMore.value = false;
  }
}

function handleFavoritesScroll(event) {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  if (scrollHeight - scrollTop - clientHeight < 50) {
    loadFavoritesData(true);
  }
}

async function handleToggleFavoriteFromList(story) {
  const isCurrentlyFavorited = story.isFavorited !== false;

  try {
    if (isCurrentlyFavorited) {
      if (!(await showConfirm("确定要取消收藏吗？"))) return;
      await favoriteApi.remove(story.id);
      handleStoryFavorite({
        storyId: story.id,
        favorited: false,
        favoriteCount: Math.max(0, Number(story.favoriteCount ?? 0) - 1),
        previousFavorited: true,
      });
    } else {
      await favoriteApi.create(story.id);
      handleStoryFavorite({
        storyId: story.id,
        favorited: true,
        favoriteCount: Number(story.favoriteCount ?? 0) + 1,
        previousFavorited: false,
      });
    }

    try {
      const countResp = await favoriteApi.getCount(story.id);
      const countData = countResp?.data ?? countResp;
      const count = Number(countData?.favoriteCount ?? 0);
      if (Number.isFinite(count)) {
        story.favoriteCount = count;
        syncStoryAcrossCollections(story.id, (item) => {
          item.favoriteCount = count;
        });
      }
    } catch (_e) {}
  } catch (error) {
    console.error("收藏操作失败:", error);
    showToast(error.message || "操作失败，请重试", "error");
  }
}

// --- 搜索功能 ---
async function loadSearchResults(isLoadMore = false) {
  const keyword = searchKeyword.value.trim();
  if (!keyword) return;

  if (isLoadMore) {
    if (searchLoadingMore.value || !searchHasMore.value) return;
    searchLoadingMore.value = true;
    searchPage.value++;
  } else {
    searchLoading.value = true;
    searchPage.value = 1;
    searchResults.value = [];
    searchHasMore.value = false;
    searchStorySearched.value = true;
  }

  try {
    const result = await storyApi.searchStories(keyword, {
      page: searchPage.value,
      limit: searchPageSize,
    });
    const data = result.data || result;
    const rawStories = Array.isArray(data?.stories) ? data.stories : [];
    const pagination = data?.pagination || {};
    const totalPages = pagination.totalPages ?? 1;

    searchHasMore.value = searchPage.value < totalPages;

    const newStories = rawStories.map((item) => {
      const author = item.author || {};
      const normalized = {
        ...item,
        id: normalizeStoryIdKey(item.id),
        avatar: author.avatar || null,
        username: author.username || '匿名用户',
        author: {
          id: normalizeStoryIdKey(author.id),
          username: author.username || '匿名用户',
          avatar: author.avatar || null,
          vip: author.vip || 0,
        },
        locationName: item.locationName || null,
      };
      const storyIdKey = normalizeStoryIdKey(item.id);
      const likedItem = likesList.value.find((l) => normalizeStoryIdKey(l.id) === storyIdKey);
      const favItem = favoritesList.value.find((f) => normalizeStoryIdKey(f.id) === storyIdKey);
      if (likedItem) normalized.isLiked = true;
      if (favItem) normalized.isFavorited = true;
      return normalized;
    });

    if (isLoadMore) {
      searchResults.value.push(...newStories);
    } else {
      searchResults.value = newStories;
      searchAnimationKey.value++; // 触发入场动画
    }
  } catch (error) {
    console.error("搜索故事失败:", error);
    showToast("搜索失败，请重试", "error");
  } finally {
    searchLoading.value = false;
    searchLoadingMore.value = false;
  }
}


const escapeLikeKeyword = (s) => s.replace(/[%_\\]/g, '\\$&');
const isPureNumber = (s) => /^\d+$/.test(s);

async function performUserSearch(keyword, isLoadMore = false) {
  if (!keyword) return;

  if (isLoadMore) {
    if (searchUserLoadingMore.value || !searchUserHasMore.value) return;
    searchUserLoadingMore.value = true;
    searchUserPage.value++;
  } else {
    searchUserLoading.value = true;
    searchUserPage.value = 1;
    searchUserResults.value = [];
    searchUserHasMore.value = false;
    searchUserSearched.value = true;
    searchedUser.value = null;
    searchedUserStories.value = [];
    searchUserDetailOpen.value = false;
  }

  try {
    const escapedKeyword = escapeLikeKeyword(keyword);
    const pureNum = isPureNumber(keyword);
    let exactUser = null;
    let fuzzyUsers = [];

    // 如果是纯数字，并行：精确ID查找 + 模糊用户名搜索
    if (pureNum && !isLoadMore) {
      const [exactResult, fuzzyResult] = await Promise.allSettled([
        authApi.getUserById(keyword),
        authApi.searchUsersByUsername(escapedKeyword, { page: 1, limit: searchUserPageSize }),
      ]);

      if (exactResult.status === 'fulfilled') {
        const data = exactResult.value?.data || exactResult.value;
        if (data && !data._updating) {
          exactUser = {
            id: normalizeStoryIdKey(data.id),
            username: data.username || '未设置',
            avatar: data.avatar || data.avatarUrl || null,
            bio: data.bio || null,
            vip: data.vip || 0,
          };
        }
      }

      if (fuzzyResult.status === 'fulfilled') {
        const fuzzyData = fuzzyResult.value?.data || fuzzyResult.value;
        fuzzyUsers = Array.isArray(fuzzyData?.users)
          ? fuzzyData.users.map(normalizeSearchUserResult)
          : [];
        const total = fuzzyData?.pagination?.total ?? 0;
        searchUserHasMore.value = searchUserPageSize < total;
      }
    } else if (pureNum && isLoadMore) {
      // 加载更多时只需模糊搜索（精确ID已查过）
      const fuzzyResult = await authApi.searchUsersByUsername(escapedKeyword, {
        page: searchUserPage.value,
        limit: searchUserPageSize,
      });
      const fuzzyData = fuzzyResult?.data || fuzzyResult;
      fuzzyUsers = Array.isArray(fuzzyData?.users)
        ? fuzzyData.users.map(normalizeSearchUserResult)
        : [];
      const total = fuzzyData?.pagination?.total ?? 0;
      searchUserHasMore.value = searchUserPage.value < Math.ceil(total / searchUserPageSize);
    } else {
      // 非纯数字：只做模糊用户名搜索
      const fuzzyResult = await authApi.searchUsersByUsername(escapedKeyword, {
        page: isLoadMore ? searchUserPage.value : 1,
        limit: searchUserPageSize,
      });
      const fuzzyData = fuzzyResult?.data || fuzzyResult;
      fuzzyUsers = Array.isArray(fuzzyData?.users)
        ? fuzzyData.users.map(normalizeSearchUserResult)
        : [];
      const total = fuzzyData?.pagination?.total ?? 0;
      const totalPages = Math.ceil(total / searchUserPageSize);
      if (!isLoadMore) {
        searchUserHasMore.value = 1 < totalPages;
        searchUserPage.value = 1;
      } else {
        searchUserHasMore.value = searchUserPage.value < totalPages;
      }
    }

    if (isLoadMore) {
      searchUserResults.value.push(...fuzzyUsers);
    } else {
      // 合并：精确ID匹配排第一，去除模糊结果中的重复
      const fuzzyIds = new Set(fuzzyUsers.map((u) => u.id));
      const merged = exactUser && !fuzzyIds.has(exactUser.id)
        ? [exactUser, ...fuzzyUsers]
        : fuzzyUsers;
      searchUserResults.value = merged;
      searchAnimationKey.value++; // 触发入场动画
    }
  } catch (error) {
    console.error("搜索用户失败:", error);
    if (!isLoadMore) {
      searchUserResults.value = [];
    }
  } finally {
    searchUserLoading.value = false;
    searchUserLoadingMore.value = false;
  }
}

function normalizeSearchUserResult(user) {
  if (!user) return null;
  return {
    id: normalizeStoryIdKey(user.id),
    username: user.username || '未设置',
    avatar: user.avatar || user.avatarUrl || null,
    bio: user.bio || null,
    vip: user.vip || 0,
  };
}

function handleUserSearchScroll(event) {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  if (scrollHeight - scrollTop - clientHeight < 50 && searchUserHasMore.value && !searchUserLoadingMore.value) {
    const keyword = searchKeyword.value.trim();
    if (keyword) performUserSearch(keyword, true);
  }
}

async function openUserDetail(user) {
  if (!user?.id) return;
  searchUserDetailOpen.value = true;
  searchedUser.value = null;
  searchedUserStories.value = [];
  resetProfileScrollState();

  try {
    const result = await authApi.getUserById(user.id);
    const data = result.data || result;
    if (data && !data._updating) {
      searchedUser.value = {
        ...data,
        avatar: data.avatar || data.avatarUrl || null,
      };
      const rawStories = Array.isArray(data.stories) ? data.stories : [];
      searchedUserStories.value = rawStories.map((s) => ({
        ...s,
        id: normalizeStoryIdKey(s.id),
        avatar: data.avatar || null,
        username: data.username || '匿名用户',
        author: {
          id: normalizeStoryIdKey(data.id),
          username: data.username || '匿名用户',
          avatar: data.avatar || null,
          vip: data.vip || 0,
        },
      }));
      searchAnimationKey.value++; // 触发入场动画
      nextTick(() => userDetailVScrollConnect());
    }
  } catch (error) {
    console.error("获取用户详情失败:", error);
    showToast("获取用户信息失败", "error");
    searchUserDetailOpen.value = false;
  }
}

function closeUserDetail() {
  searchUserDetailOpen.value = false;
  userDetailVScrollDisconnect();
  userDetailSearchQuery.value = '';
  userDetailSearchVScrollDisconnect();
  if (userDetailSearchActiveTimer) { clearTimeout(userDetailSearchActiveTimer); userDetailSearchActiveTimer = null; }
  userDetailSearchActive.value = false;
  resetProfileScrollState();
}

function handleSearchSubmit() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchFocused.value = true;
  const keyword = searchKeyword.value.trim();
  if (!keyword) return;
  if (searchTab.value === 'story') {
    loadSearchResults(false);
  } else {
    performUserSearch(keyword, false);
  }
}

function handleSearchScroll(event) {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  if (scrollHeight - scrollTop - clientHeight < 50 && searchHasMore.value && !searchLoadingMore.value) {
    loadSearchResults(true);
  }
}

function handleSearchUnlike(story) {
  if (!(story.isLiked)) return;
  likeApi.remove(story.id).then(() => {
    story.isLiked = false;
    const likeCount = Math.max(0, Number(story.likeCount ?? 0) - 1);
    story.likeCount = likeCount;
    handleStoryLike({
      storyId: story.id,
      liked: false,
      likeCount,
      previousLiked: true,
    });
  }).catch((err) => {
    console.error("取消点赞失败:", err);
    showToast("取消点赞失败", "error");
  });
}

function handleSearchToggleFavorite(story) {
  const isFavorited = story.isFavorited !== false;
  const action = isFavorited ? favoriteApi.remove(story.id) : favoriteApi.create(story.id);
  action.then(() => {
    const nextFavorited = !isFavorited;
    story.isFavorited = nextFavorited;
    const favCount = nextFavorited
      ? Number(story.favoriteCount ?? 0) + 1
      : Math.max(0, Number(story.favoriteCount ?? 0) - 1);
    story.favoriteCount = favCount;
    handleStoryFavorite({
      storyId: story.id,
      favorited: nextFavorited,
      favoriteCount: favCount,
      previousFavorited: isFavorited,
    });
  }).catch((err) => {
    console.error("收藏操作失败:", err);
    showToast("操作失败", "error");
  });
}

function handleStoryClick(story) {
  if (isCapsuleLocked(story)) {
    showToast('时光胶囊未解锁，请等待解锁时间到来', 'warning');
    return;
  }
  showFavoritesPanel.value = false;
  showLikesPanel.value = false;
  showPostsPanel.value = false;
  openStoryFromCollection(story);
}

async function handleUnlike(story) {
  if (!(await showConfirm("确定要取消点赞吗？"))) {
    return;
  }

  try {
    await likeApi.remove(story.id);
    const likeCount = Math.max(
      0,
      Number(story.likeCount ?? story.likes ?? 0) - 1,
    );
    handleStoryLike({
      storyId: story.id,
      liked: false,
      likeCount,
      previousLiked: true,
    });

    console.log("已取消点赞:", story.id);
  } catch (error) {
    console.error("取消点赞失败:", error);
    showToast("取消点赞失败，请重试", "error");
  }
}

async function handleDeleteStory(story) {
  if (!(await showConfirm("确定要删除这个故事吗？此操作不可恢复。"))) {
    return;
  }

  try {
    await storyApi.deleteStory(story.id);
    const index = postsList.value.findIndex(
      (item) => normalizeStoryIdKey(item.id) === normalizeStoryIdKey(story.id),
    );
    if (index > -1) {
      postsList.value.splice(index, 1);
    }
    updateUserPanelTotalCount(postsTotalCount, -1);

    console.log("已删除故事:", story.id);
  } catch (error) {
    console.error("删除故事失败:", error);
    showToast("删除失败，请重试", "error");
  }
}

function startEditUsername() {
  editingUsername.value =
    userStore.user?.username || userStore.user?.name || "";
  isEditingUsername.value = true;
  usernameError.value = "";
}

function cancelEditUsername() {
  isEditingUsername.value = false;
  editingUsername.value = "";
  usernameError.value = "";
}

async function checkUsernameAvailability(username) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const reservedUsernames = ["admin", "test", "user", "system", "root"];
      if (reservedUsernames.includes(username.toLowerCase())) {
        resolve({ available: false, message: "该用户名已被使用" });
      } else {
        resolve({ available: true });
      }
    }, 300);
  });
}

async function saveUsername() {
  const trimmedUsername = editingUsername.value.trim();

  if (trimmedUsername.length < 2) {
    usernameError.value = "用户名至少需要 2 个字符";
    return;
  }
  if (trimmedUsername.length > 20) {
    usernameError.value = "用户名最多 20 个字符";
    return;
  }
  // 用户名限制在常见可读字符范围内。
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    usernameError.value = "用户名只能包含字母、数字、中文、下划线和连字符";
    return;
  }

  checkingUsername.value = true;
  usernameError.value = "";

  try {
    const currentUsername = userStore.user?.username || userStore.user?.name;
    if (trimmedUsername === currentUsername) {
      cancelEditUsername();
      return;
    }

    const result = await checkUsernameAvailability(trimmedUsername);

    if (!result.available) {
      usernameError.value = result.message || "该用户名已被使用";
      return;
    }

    const response = await authApi.updateProfile({
      username: trimmedUsername,
    });
    const updatedUser = response?.data ?? response;
    userStore.updateUser(updatedUser);
    syncCurrentUserProfileAcrossStories({
      ...(userStore.user || {}),
      ...(updatedUser || {}),
    });

    isEditingUsername.value = false;
    editingUsername.value = "";
    usernameError.value = "";

    console.log("用户名已更新:", trimmedUsername);
  } catch (error) {
    usernameError.value = "保存失败，请重试";
    console.error("保存用户名失败:", error);
  } finally {
    checkingUsername.value = false;
  }
}

function triggerAvatarUpload() {
  if (avatarUploading.value) return;
  avatarInput.value?.click();
}

function handleAvatarChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    avatarError.value = "请选择图片文件";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    avatarError.value = "图片大小不能超过 5MB";
    return;
  }

  avatarError.value = "";

  currentAvatarFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result;
    uploadAvatar(file);
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

async function uploadAvatar(file) {
  if (!file) {
    file = currentAvatarFile.value;
  }
  if (!file) {
    avatarError.value = "未选择文件";
    return;
  }

  avatarUploading.value = true;
  avatarError.value = "";

  try {
    const validation = validateImage(file);
    if (!validation.valid) {
      avatarError.value = validation.error;
      return;
    }

    const uploadedUrl = await uploadToOSS(file);
    const response = await authApi.updateProfile({
      avatarUrl: uploadedUrl,
    });
    const updatedUser = response?.data ?? response;
    userStore.updateUser(updatedUser);

    syncCurrentUserProfileAcrossStories({
      ...(userStore.user || {}),
      ...(updatedUser || {}),
    });
    avatarPreview.value = "";
    currentAvatarFile.value = null;
    console.log("头像已更新:", uploadedUrl);
  } catch (error) {
    avatarError.value = error.message || "上传失败，请重试";
    avatarPreview.value = "";
    console.error("上传头像失败:", error);
  } finally {
    avatarUploading.value = false;
  }
}

function startEditPassword() {
  isEditingPassword.value = true;
  passwordError.value = "";
  currentPasswordError.value = "";
  newPasswordError.value = "";
  confirmPasswordError.value = "";
  passwordForm.value = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
  showCurrentPassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
}

function cancelEditPassword() {
  isEditingPassword.value = false;
  passwordError.value = "";
  currentPasswordError.value = "";
  newPasswordError.value = "";
  confirmPasswordError.value = "";
  passwordForm.value = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
  showCurrentPassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
}

async function savePassword() {
  const { currentPassword, newPassword, confirmPassword } = passwordForm.value;

  if (!currentPassword) {
    passwordError.value = "请输入当前密码";
    return;
  }
  if (newPassword.length < 6) {
    passwordError.value = "新密码至少需要 6 位";
    return;
  }
  if (newPassword !== confirmPassword) {
    passwordError.value = "两次输入的新密码不一致";
    return;
  }

  savingPassword.value = true;
  passwordError.value = "";

  try {
    await authApi.changePassword(currentPassword, newPassword);
    cancelEditPassword();
  } catch (error) {
    const detailMessage = Array.isArray(error?.response?.data?.details)
      ? error.response.data.details
          .map((item) => item?.message || item)
          .filter(Boolean)
          .join("；")
      : "";
    passwordError.value =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      detailMessage ||
      "修改失败，请检查当前密码是否正确";
    console.error("修改密码失败:", error);
  } finally {
    savingPassword.value = false;
  }
}

function handleStoriesClick() {
  if (showPublishSidebar.value) {
    closePublishPanel();
  }
  if (showUserSidebar.value) {
    closeUserPanel();
  }
  showSidebar.value = !showSidebar.value;
  isDockExpanded.value = false;
  console.log('[sidebar] 打开侧边栏, wallAllInitialDone:', wallAllInitialDone.value, 'showSidebar:', showSidebar.value);
  // 打开侧边栏时同时加载三个标签页
  if (showSidebar.value && !wallAllInitialDone.value) {
    console.log('[sidebar] 触发 loadAllWallTabs');
    loadAllWallTabs();
  }
}

function handleLocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapStore.setUserLocation(latitude, longitude);
        mapStore.updateCenter(latitude, longitude);
        mapStore.updateZoom(15);
        nearbyPinnedCenterLabel.value = null;
        nearbyCenterLabel.value = currentUserLocationLabel.value || "当前位置";
        void refreshCurrentUserLocationLabel(nearbyCenterLabel.value);
        scheduleNearbyCenterLabelRefresh(nearbyCenterLabel.value, 80);
        isDockExpanded.value = false;
      },
      (error) => {
        console.error("获取位置失败:", error);
        showToast("获取位置失败，请检查定位权限", "error");
        isDockExpanded.value = false;
      },
    );
  } else {
    showToast("您的浏览器不支持地理定位", "error");
    isDockExpanded.value = false;
  }
}

async function handlePublishSubmit(storyData) {
  try {
    const selectedLocation = extractCoordinates(storyData.location);
    if (!selectedLocation) {
      showToast("请先选择一个地点后再发布故事", "warning");
      return;
    }

    if (!storyData.emotion) {
      showToast("请先选择一个情绪标签", "warning");
      return;
    }

    if (storyData.isTimeCapsule && !storyData.unlockAt) {
      showToast("请为时光胶囊选择解锁时间", "warning");
      return;
    }

    const location = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      address:
        storyData.location?.address || storyData.location?.name || "已选地点",
      name:
        storyData.location?.name || storyData.location?.address || "已选地点",
    };

    const finalEmotionTag = storyData.emotion;
    const { storyApi } = await import("../../api/story");
    const { uploadImages, validateImage } = await import("../../utils/upload");
    let imageUrls = [];
    if (storyData.images && storyData.images.length > 0) {
      for (const file of storyData.images) {
        const validation = validateImage(file);
        if (!validation.valid) {
          console.warn("图片验证失败:", validation.error);
          continue;
        }
      }
      try {
        imageUrls = await uploadImages(storyData.images);
        console.log("图片上传成功:", imageUrls);
      } catch (error) {
        console.error("图片上传失败:", error);
      }
    }

    const createPayload2 = {
      content: storyData.content,
      images: imageUrls,
      location: {
        lng: location.longitude,
        lat: location.latitude,
      },
      locationName: location.name,
      emotionTag: finalEmotionTag,
      isTimeCapsule: storyData.isTimeCapsule,
      unlockAt: storyData.unlockAt || null,
      visibility: storyData.visibility || "public",
      visibilityStartTime: storyData.visibilityStartTime || null,
      visibilityEndTime: storyData.visibilityEndTime || null,
      fontFamily: storyData.fontFamily || null,
      fontEffect: storyData.fontEffect || null,
    };
    const response = await storyApi.createStory(createPayload2);

    const newStory = response.data || response;
    const normalizedNewStory = normalizeStoryForMap(newStory, location);

    if (normalizedNewStory && amapRef.value) {
      amapRef.value.addNewStoryMarker(normalizedNewStory);
    }

    if (normalizedNewStory) {
      mapStore.updateStories([...mapStore.stories, normalizedNewStory]);
      void hydrateStoryLocations([normalizedNewStory]);
    } else {
      console.warn(
        "[Map] Created story is missing valid coordinates:",
        newStory,
      );
      await loadStories();
    }
    updateUserPanelTotalCount(postsTotalCount, 1);

    mapStore.updateCenter(location.latitude, location.longitude);
    mapStore.updateZoom(15);

    showToast("发布成功！", "success");
    closePublishPanel();
  } catch (error) {
    console.error("发布失败:", error);
    showToast("发布失败，请重试", "error");
  }
}

function toggleTheme() {
  const next = effectiveMapTheme.value === "dark" ? "light" : "dark";
  handleThemeChange(next);
  isDockExpanded.value = false;
}

function toggleDock() {
  if (isPickingPublishLocation.value) {
    isDockExpanded.value = false;
    return;
  }

  showMapFilterPanel.value = false;
  isDockExpanded.value = !isDockExpanded.value;
}

async function handleLogout() {
  if (await showConfirm("确定要退出登录吗？")) {
    showUserSidebar.value = false;
    userStore.logout();
    window.location.href = "/";
  }
  isDockExpanded.value = false;
}

function handleGuestLoginClick() {
  showUserSidebar.value = false;
  showLoginModal.value = true;
}

function handleEnterGuestMode() {
  userStore.loginAsGuest();
  showUserSidebar.value = false;
}

function handleGuestLogout() {
  userStore.exitGuestMode();
  showUserSidebar.value = false;
}

function handlePageClick(event) {
  if (isAdjustingPlanePosition.value) return;
  if (showPublishSidebar.value && isPickingPublishLocation.value) {
    return;
  }

  const target = event?.target;
  if (!(target instanceof Node)) {
    return;
  }

  const storySidebar = document.querySelector(".story-sidebar");
  const storyTarotShell = document.querySelector(".story-tarot-shell");
  const publishModal = document.querySelector(".publish-modal");
  const userSidebar = document.querySelector(".user-sidebar");
  const userModalShell = document.querySelector(".user-modal-shell");
  const likesPanel = document.querySelector(".likes-panel");
  const postsPanel = document.querySelector(".posts-panel");
  const favoritesPanel = document.querySelector(".favorites-panel");
  const dockContainer = document.querySelector(".dock-container");
  const mapFilterPanel = document.querySelector(".map-filter-bar");
  const mapFilterToggle = document.querySelector(".map-filter-toggle");
  const userDetail = document.querySelector(".search-user-modal-shell");

  if (
    likesPanel?.contains(target) ||
    postsPanel?.contains(target) ||
    favoritesPanel?.contains(target)
  ) {
    return;
  }

  if (userSidebar?.contains(target) || userModalShell?.contains(target)) {
    showLikesPanel.value = false;
    showPostsPanel.value = false;
    showFavoritesPanel.value = false;
    return;
  }

  if (userDetail?.contains(target)) {
    return;
  }

  if (
    storySidebar?.contains(target) ||
    storyTarotShell?.contains(target) ||
    publishModal?.contains(target) ||
    dockContainer?.contains(target) ||
    mapFilterPanel?.contains(target) ||
    mapFilterToggle?.contains(target)
  ) {
    return;
  }

  showMapFilterPanel.value = false;
  closeStoryPanel();
  closePublishPanel();
  searchFocused.value = false;
  searchUserDetailOpen.value = false;
}

const stories = computed(() => mapStore.stories);

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function scheduleMapDataReload(delay = 220) {
  clearTimeout(loadTimer);
  showClusterPopover.value = false;
  clusterPopoverStories.value = [];
  loadTimer = setTimeout(() => {
    loadStories();
    loadClusterData();
  }, delay);
}

function toggleMapFilterPanel() {
  showMapFilterPanel.value = !showMapFilterPanel.value;
  if (showMapFilterPanel.value) {
    isDockExpanded.value = false;
  }
}

function setEmotionFilter(value) {
  if (activeEmotionFilter.value === value) {
    return;
  }

  activeEmotionFilter.value = value;
  scheduleMapDataReload();
}

function applyTimePreset(presetKey) {
  if (activeTimePreset.value === presetKey) {
    return;
  }

  activeTimePreset.value = presetKey;

  if (presetKey === "all") {
    mapFilterStartDate.value = "";
    mapFilterEndDate.value = "";
    scheduleMapDataReload();
    return;
  }

  const now = new Date();
  const endDate = formatDateInputValue(now);
  const startDate = new Date(now);

  if (presetKey === "24h") {
    startDate.setDate(startDate.getDate() - 1);
  } else if (presetKey === "7d") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (presetKey === "30d") {
    startDate.setDate(startDate.getDate() - 30);
  }

  mapFilterStartDate.value = formatDateInputValue(startDate);
  mapFilterEndDate.value = endDate;
  scheduleMapDataReload();
}

function handleMapFilterDateChange() {
  if (
    mapFilterStartDate.value &&
    mapFilterEndDate.value &&
    mapFilterStartDate.value > mapFilterEndDate.value
  ) {
    const start = mapFilterStartDate.value;
    mapFilterStartDate.value = mapFilterEndDate.value;
    mapFilterEndDate.value = start;
  }

  activeTimePreset.value =
    mapFilterStartDate.value || mapFilterEndDate.value ? "custom" : "all";
  scheduleMapDataReload();
}

function clearMapFilters() {
  activeEmotionFilter.value = "all";
  activeTimePreset.value = "all";
  mapFilterStartDate.value = "";
  mapFilterEndDate.value = "";
  scheduleMapDataReload();
}

async function loadStories() {
  loading.value = true;
  try {
    const center = extractCoordinates(mapStore.center);
    if (!center) {
      console.warn(
        "[Map] Skip loadStories because center is invalid:",
        mapStore.center,
      );
      mapStore.updateStories([]);
      return;
    }

    const currentBounds = getMapBounds();
    const shouldUseViewportRadius = isUserMapFilterActive.value;
    const fetchRadius = shouldUseViewportRadius
      ? getStoryFetchRadiusMeters(center, currentBounds)
      : 5000;

    const response = await mapApi.exploreStories(center.latitude, center.longitude, fetchRadius, {
      limit: mapExploreFetchLimit.value,
      ...mapFilterQuery.value,
    });
    console.log("[Map] exploreStories response:", response, "radius:", fetchRadius);

    const stories = extractStoriesFromResponse(response);
    if (!stories) {
      console.error(
        "[Map] exploreStories returned an unexpected payload:",
        response,
      );
      mapStore.updateStories([]);
      return;
    }

    const normalizedStories = stories
      .map((story) => normalizeStoryForMap(story))
      .filter(Boolean);

    console.log("[Map] normalized stories:", normalizedStories);
    mapStore.updateStories(normalizedStories);
    void hydrateStoryLocations(normalizedStories);
  } catch (error) {
    console.error("加载故事失败:", error);
    mapStore.updateStories([]);
  } finally {
    loading.value = false;
  }
}

const CLUSTER_ZOOM_THRESHOLD = 16;

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function calculateDistanceMeters(from, to) {
  const fromLat = Number(from?.latitude ?? from?.lat);
  const fromLng = Number(from?.longitude ?? from?.lng);
  const toLat = Number(to?.latitude ?? to?.lat);
  const toLng = Number(to?.longitude ?? to?.lng);

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return null;
  }

  const earthRadiusMeters = 6371000;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const fromLatRad = toRadians(fromLat);
  const toLatRad = toRadians(toLat);

  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLatRad) *
      Math.cos(toLatRad) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMeters * arc;
}

function getStoryFetchRadiusMeters(center, bounds) {
  const paddedBounds = padBounds(bounds, 0.12) || bounds;
  if (!center || !paddedBounds?.northEast || !paddedBounds?.southWest) {
    return 5000;
  }

  const corners = [
    {
      latitude: paddedBounds.northEast.lat,
      longitude: paddedBounds.northEast.lng,
    },
    {
      latitude: paddedBounds.northEast.lat,
      longitude: paddedBounds.southWest.lng,
    },
    {
      latitude: paddedBounds.southWest.lat,
      longitude: paddedBounds.northEast.lng,
    },
    {
      latitude: paddedBounds.southWest.lat,
      longitude: paddedBounds.southWest.lng,
    },
  ];

  const distances = corners
    .map((corner) => calculateDistanceMeters(center, corner))
    .filter(Number.isFinite);

  if (!distances.length) {
    return 5000;
  }

  return Math.min(Math.max(Math.ceil(Math.max(...distances) * 1.1), 5000), 50000);
}

function padBounds(bounds, paddingRatio = 0.08) {
  if (!bounds?.northEast || !bounds?.southWest) {
    return null;
  }

  const north = Number(bounds.northEast.lat);
  const east = Number(bounds.northEast.lng);
  const south = Number(bounds.southWest.lat);
  const west = Number(bounds.southWest.lng);

  if (![north, east, south, west].every(Number.isFinite)) {
    return null;
  }

  const latPadding = Math.max(Math.abs(north - south) * paddingRatio, 0.0005);
  const lngPadding = Math.max(Math.abs(east - west) * paddingRatio, 0.0005);

  return {
    northEast: {
      lat: Math.min(90, north + latPadding),
      lng: Math.min(180, east + lngPadding),
    },
    southWest: {
      lat: Math.max(-90, south - latPadding),
      lng: Math.max(-180, west - lngPadding),
    },
  };
}

async function loadClusterData() {
  const requestToken = ++activeClusterRequestToken;
  try {
    const currentZoom = mapStore.zoom;

    if (currentZoom >= CLUSTER_ZOOM_THRESHOLD) {
      console.log(
        "[Map] zoom >= threshold, clearing clusters, zoom:",
        currentZoom,
      );
      clusters.value = [];
      return;
    }

    if (!amapRef.value) {
      console.log("[Map] amapRef not ready");
      return;
    }

    const bounds = getMapBounds();
    console.log("[Map] getBounds result:", bounds);

    if (!bounds) {
      console.log("[Map] No bounds available, using default");
      const center = extractCoordinates(mapStore.center);
      if (!center) return;

      const defaultBounds = {
        northEast: {
          lat: center.latitude + 0.05,
          lng: center.longitude + 0.05,
        },
        southWest: {
          lat: center.latitude - 0.05,
          lng: center.longitude - 0.05,
        },
      };

      const response = await mapApi.getClusterData(
        defaultBounds.northEast,
        defaultBounds.southWest,
        currentZoom,
        mapFilterQuery.value,
      );

      const data = extractClustersFromResponse(response);
      console.log("[Map] cluster API response:", data);
      if (requestToken === activeClusterRequestToken && Array.isArray(data)) {
        clusters.value = data;
        console.log(
          "[Map] clusters loaded with default bounds:",
          clusters.value.length,
        );
      }
      return;
    }

    const paddedBounds = padBounds(bounds) || bounds;
    const response = await mapApi.getClusterData(
      paddedBounds.northEast,
      paddedBounds.southWest,
      currentZoom,
      mapFilterQuery.value,
    );

    const data = extractClustersFromResponse(response);
    console.log("[Map] cluster API response:", data);
    if (requestToken === activeClusterRequestToken && Array.isArray(data)) {
      clusters.value = data;
      console.log(
        "[Map] clusters loaded:",
        clusters.value.length,
        clusters.value,
      );
    }
  } catch (error) {
    if (requestToken === activeClusterRequestToken) {
      clusters.value = [];
    }
    console.error("加载聚合数据失败:", error);
  }
}

function getMapBounds() {
  if (!amapRef.value) return null;
  return amapRef.value.getBounds();
}

function handleClusterClick({ cluster, latitude, longitude, count, showPopover }) {
  console.log("[Map] cluster clicked:", cluster, count, showPopover);

  const currentZoom = mapStore.zoom;
  const ZOOM_MAX = 18; // 放大上限，同时也是弹出故事列表的阈值
  const newZoom = Math.min(currentZoom + 2, ZOOM_MAX);

  // 已达上限无法继续放大 → 回退为弹出故事列表
  if (!Number.isFinite(currentZoom) || currentZoom >= ZOOM_MAX + 2 ) {
    const pointIds = cluster?.pointIds || [];
    const allStories = mapStore.stories || [];
    // 统一转为字符串比较
    const pidSet = new Set(pointIds.map(String));
    let matched = pointIds.length > 0
      ? allStories.filter((s) => pidSet.has(String(s.id ?? "")) || pidSet.has(String(s._id ?? "")))
      : [];

    // 坐标近邻匹配补充
    if (matched.length === 0 && count > 1) {
      const latTol = 0.001;
      const lngTol = 0.001;
      allStories.forEach((s) => {
        const sLat = s.location?.latitude ?? s.location?.lat;
        const sLng = s.location?.longitude ?? s.location?.lng;
        if (
          sLat != null && sLng != null &&
          Math.abs(sLat - latitude) < latTol &&
          Math.abs(sLng - longitude) < lngTol &&
          !matched.find((m) => String(m.id ?? m._id ?? "") === String(s.id ?? s._id ?? ""))
        ) {
          matched.push(s);
        }
      });
    }

    if (matched.length >= 1) {
      clusterPopoverStories.value = matched;
      showClusterPopover.value = true;
    }
    return;
  }

  // 正常流程：放大地图 +2 级
  mapStore.updateCenter(latitude, longitude);
  mapStore.updateZoom(newZoom);

  // 收集该聚合点关联的故事，用于浮层展示（放大后如果仍有多条故事则展示）
  const pointIds = cluster?.pointIds || [];
  const allStories = mapStore.stories || [];
  const matched = pointIds.length > 0
    ? allStories.filter((s) => pointIds.includes(s.id) || pointIds.includes(s._id))
    : [];

  // 坐标近邻匹配（补充）
  if (matched.length === 0 && count > 1) {
    const latTol = 0.001;
    const lngTol = 0.001;
    allStories.forEach((s) => {
      const sLat = s.location?.latitude ?? s.location?.lat;
      const sLng = s.location?.longitude ?? s.location?.lng;
      if (
        sLat != null && sLng != null &&
        Math.abs(sLat - latitude) < latTol &&
        Math.abs(sLng - longitude) < lngTol &&
        !matched.find((m) => (m.id || m._id) === (s.id || s._id))
      ) {
        matched.push(s);
      }
    });
  }

  // 放大后如果仍有多条重叠故事，且缩放级别足够高（>= ZOOM_MAX-2），才弹出列表
  // 低缩放时只执行放大操作，不弹列表
  if (matched.length > 1 && newZoom >= ZOOM_MAX - 2) {
    clusterPopoverStories.value = matched;
    showClusterPopover.value = true;
  }

  setTimeout(() => {
    loadStories();
    loadClusterData();
  }, 300);
}

async function loadFeaturedStories() {
  try {
    const res = await storyApi.getFeaturedStories();
    const data = res?.data ?? res;
    const list = data?.stories ?? [];
    featuredStories.value = list
      .map((s) => normalizeStoryForMap(s))
      .filter(Boolean);
    storyCardAnimationKey.value++; // 触发入场动画
  } catch (error) {
    console.error("加载精选推荐失败:", error);
    featuredStories.value = [];
  }
}

async function loadRecommendationFeed(reset = true) {
  if (reset) {
    feedPage.value = 1;
    feedStories.value = [];
    feedLoading.value = true;
  }
  try {
    const center =
      extractCoordinates(mapStore.center) ||
      extractCoordinates(mapStore.userLocation);
    const lat = center?.latitude;
    const lng = center?.longitude;
    const res = await mapApi.getRecommendationFeed({
      lat,
      lng,
      page: feedPage.value,
      limit: 20,
    });
    const data = res?.data ?? res;
    const list = data?.stories ?? [];
    const pagination = data?.pagination ?? {};
    feedPagination.value = pagination;
    const normalized = list.map((s) => normalizeStoryForMap(s)).filter(Boolean);
    if (reset) {
      feedStories.value = normalized;
      storyCardAnimationKey.value++; // 触发入场动画
    } else {
      feedStories.value = [...feedStories.value, ...normalized];
    }
    void hydrateStoryLocations(normalized);
  } catch (error) {
    console.error("加载推荐流失败:", error);
    if (reset) feedStories.value = [];
  } finally {
    if (reset) feedLoading.value = false;
  }
}

async function loadMoreFeed() {
  if (feedLoadingMore.value || !feedHasMore.value) return;
  feedLoadingMore.value = true;
  feedPage.value += 1;
  try {
    const center =
      extractCoordinates(mapStore.center) ||
      extractCoordinates(mapStore.userLocation);
    const res = await mapApi.getRecommendationFeed({
      lat: center?.latitude,
      lng: center?.longitude,
      page: feedPage.value,
      limit: 20,
    });
    const data = res?.data ?? res;
    const list = data?.stories ?? [];
    feedPagination.value = data?.pagination ?? {};
    const normalized = list.map((s) => normalizeStoryForMap(s)).filter(Boolean);
    feedStories.value = [...feedStories.value, ...normalized];
    void hydrateStoryLocations(normalized);
  } catch (error) {
    console.error("加载更多失败:", error);
    feedPage.value -= 1;
  } finally {
    feedLoadingMore.value = false;
  }
}

function handleMarkerClick(data) {
  const { story, screenX, screenY } = data;
  // 时光胶囊未解锁时，提示用户
  const isLocked = story.isTimeCapsule && !(story.isUnlocked === true);
  if (isLocked) {
    showToast("时光胶囊未解锁，请等待解锁时间到来", "warning");
    return;
  }
  openStoryModal(story, 0, {
    directOpen: true,
    startPosition: { x: screenX, y: screenY },
  });
}

function closeStoryModal() {
  clearTimeout(storyOpenTimer);
  storyOpenTimer = null;
  closeStoryReportPanel();
  selectedStory.value = null;
  nextStop.value = null;
}

function handleMapMove(event) {
  const center = extractCoordinates(event);
  if (!center) {
    console.warn("[Map] Skip invalid map move event:", event);
    return;
  }

  mapStore.updateCenter(center.latitude, center.longitude);

  const zoom = Number(event?.zoom);
  if (Number.isFinite(zoom)) {
    mapStore.updateZoom(zoom);
    if (Date.now() < suppressMapReloadUntil) {
      clearTimeout(loadTimer);
      return;
    }
  }

  scheduleMapDataReload(500);
}

let loadTimer = null;
let suppressMapReloadUntil = 0;

function extractCoordinates(location) {
  if (!location || typeof location !== "object") {
    return null;
  }

  const latitude = [
    location.latitude,
    location.lat,
    Array.isArray(location.coordinates) ? location.coordinates[1] : undefined,
  ].find((value) => Number.isFinite(Number(value)));
  const longitude = [
    location.longitude,
    location.lng,
    Array.isArray(location.coordinates) ? location.coordinates[0] : undefined,
  ].find((value) => Number.isFinite(Number(value)));

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
}

function normalizeStoryForMap(story, fallbackLocation = null) {
  if (!story || typeof story !== "object") {
    return null;
  }

  const coords =
    extractCoordinates(story.location) ||
    extractCoordinates(story) ||
    extractCoordinates(fallbackLocation);

  if (!coords) {
    console.warn("[Map] Skip story with invalid coordinates:", story);
    return null;
  }

  const author = resolveStoryAuthor(story);
  const nextLikeCount = Number(story.likeCount ?? story.likes ?? 0);
  const normalizedLikeCount = Number.isFinite(nextLikeCount)
    ? nextLikeCount
    : 0;
  const normalizedStoryId = normalizeStoryIdKey(story.id ?? story.storyId);

  if (!normalizedStoryId) {
    return null;
  }

  return {
    ...story,
    id: normalizedStoryId,
    images: Array.isArray(story.images) ? story.images : [],
    likes: normalizedLikeCount,
    likeCount: normalizedLikeCount,
    username: author.username,
    avatar: author.avatar,
    author,
    locationName: pickLocationText(
      [story.locationName, story.location?.name, story.location?.address],
      false,
    ),
    location: buildNormalizedStoryLocation(story, coords, fallbackLocation),
  };
}

function normalizeUserPanelStory(item, fallbackAuthor = null) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const nextBaseStory =
    item.story && typeof item.story === "object" ? item.story : item;
  if (!nextBaseStory || typeof nextBaseStory !== "object") {
    return null;
  }

  const nextAuthor = resolveStoryAuthor(nextBaseStory, fallbackAuthor);
  const nextCoords = extractCoordinates(nextBaseStory.location);
  const nextLikeCount = Number(
    nextBaseStory.likeCount ?? nextBaseStory.likes ?? 0,
  );
  const nextNormalizedLikeCount = Number.isFinite(nextLikeCount)
    ? nextLikeCount
    : 0;
  const nextFavoriteCount = Number(nextBaseStory.favoriteCount ?? 0);
  const nextNormalizedFavoriteCount = Number.isFinite(nextFavoriteCount)
    ? nextFavoriteCount
    : 0;
  const normalizedStoryId = normalizeStoryIdKey(
    nextBaseStory.id ?? item.storyId ?? item.id,
  );
  if (!normalizedStoryId) {
    return null;
  }
  const nextLocationName = pickLocationText(
    [
      nextBaseStory.locationName,
      nextBaseStory.location?.name,
      nextBaseStory.location?.address,
    ],
    false,
  );

  return {
    ...nextBaseStory,
    id: normalizedStoryId,
    createdAt: nextBaseStory.createdAt || item.createdAt,
    images: Array.isArray(nextBaseStory.images) ? nextBaseStory.images : [],
    likes: nextNormalizedLikeCount,
    likeCount: nextNormalizedLikeCount,
    favoriteCount: nextNormalizedFavoriteCount,
    username: nextAuthor.username,
    avatar: nextAuthor.avatar,
    author: nextAuthor,
    locationName: nextLocationName,
    location: buildNormalizedStoryLocation(nextBaseStory, nextCoords),
  };
}

async function hydrateStoryLocations(stories = []) {
  const targets = Array.isArray(stories)
    ? stories.filter((story) => {
        const coords = extractCoordinates(story?.location);
        return coords && !hasResolvedStoryLocation(story);
      })
    : [];

  await Promise.allSettled(
    targets.map(async (story) => {
      const coords = extractCoordinates(story.location);
      if (!coords) {
        return;
      }

      const resolvedLocation = await reverseGeocodeLocationDetailSafe(
        coords.latitude,
        coords.longitude,
      );
      story.location = buildNormalizedStoryLocation(
        story,
        coords,
        resolvedLocation,
      );

      if (!story.locationName) {
        story.locationName = pickLocationText(
          [resolvedLocation?.name, resolvedLocation?.address],
          false,
        );
      }
    }),
  );
}

function extractStoriesFromResponse(response) {
  const candidates = [
    response?.data?.stories,
    response?.stories,
    Array.isArray(response?.data) ? response.data : null,
    Array.isArray(response) ? response : null,
  ];

  return candidates.find(Array.isArray) ?? null;
}

function extractClustersFromResponse(response) {
  const candidates = [
    response?.data?.data,
    response?.data,
    Array.isArray(response?.clusters) ? response.clusters : null,
    Array.isArray(response) ? response : null,
  ];

  return candidates.find(Array.isArray) ?? null;
}

function normalizeRandomWalkResponse(response) {
  const candidates = [response, response?.data, response?.data?.data].filter(
    Boolean,
  );

  for (const candidate of candidates) {
    const story = candidate.story || candidate.data?.story || null;
    const coords =
      extractCoordinates(candidate.location) ||
      extractCoordinates(candidate.data?.location) ||
      extractCoordinates(story?.location);

    if (story && coords) {
      const normalizedStory = normalizeStoryForMap(story, coords);
      if (!normalizedStory) {
        continue;
      }

      return {
        story: normalizedStory,
        coords,
      };
    }
  }

  return null;
}

function buildNextStopPreview(story, coords) {
  if (!story) return null;
  return {
    story,
    coords,
    locationName: story.locationName || "未知地点",
    emotionTag: story.emotionTag || "",
    authorName: story.username || story.author?.username || "匿名用户",
    authorAvatar: story.avatar || story.author?.avatar || null,
    thumbnail:
      Array.isArray(story.images) && story.images.length > 0
        ? story.images[0]
        : null,
    contentPreview: story.content
      ? story.content.length > 60
        ? `${story.content.substring(0, 60)}...`
        : story.content
      : "",
    recommendation: story.recommendation || null,
  };
}

async function prefetchNextStop() {
  nextStopLoading.value = true;
  try {
    const center =
      extractCoordinates(mapStore.center) ||
      extractCoordinates(mapStore.userLocation);
    const lat = center?.latitude ?? 39.9;
    const lng = center?.longitude ?? 116.4;
    const response = await mapApi.randomWalk(lat, lng);
    const normalized = normalizeRandomWalkResponse(response);
    if (normalized) {
      nextStop.value = buildNextStopPreview(normalized.story, normalized.coords);
    }
  } catch (error) {
    console.error("预加载下一站失败:", error);
    nextStop.value = null;
  } finally {
    nextStopLoading.value = false;
  }
}

async function handleRandomWalk() {
  randomWalking.value = true;
  nextStop.value = null;
  try {
    const center =
      extractCoordinates(mapStore.center) ||
      extractCoordinates(mapStore.userLocation);
    const originLatitude = center?.latitude ?? 39.9;
    const originLongitude = center?.longitude ?? 116.4;
    const response = await mapApi.randomWalk(originLatitude, originLongitude);
    console.log("随机漫步响应:", response);

    const normalized = normalizeRandomWalkResponse(response);
    const { story, coords } = normalized || {};
    if (!normalized) {
      console.error("random walk response format error:", response);
      showToast("随机漫步返回数据格式错误", "error");
      return;
    }

    let nextLatitude = coords.latitude;
    let nextLongitude = coords.longitude;

    if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
      if (story.location) {
        nextLatitude = Number(story.location.lat ?? story.location.latitude);
        nextLongitude = Number(story.location.lng ?? story.location.longitude);
      }
    }

    if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
      console.error("随机漫步返回的位置为空:", coords, story);
      showToast("随机漫步返回的位置信息为空", "error");
      return;
    }

    const location = {
      latitude: nextLatitude,
      longitude: nextLongitude,
    };

    mapStore.updateCenter(nextLatitude, nextLongitude);
    mapStore.updateZoom(15);
    setTimeout(() => {
      openStoryModal(story);
    }, 800);
    void prefetchNextStop();
  } catch (error) {
    console.error("随机漫步失败:", error);
    showToast("随机漫步失败，请重试", "error");
  } finally {
    randomWalking.value = false;
  }
  isDockExpanded.value = false;
}

async function goToNextStop() {
  if (!nextStop.value) return;
  const ns = nextStop.value;
  nextStop.value = null;
  randomWalking.value = true;

  try {
    const { coords, story } = ns;
    const nextLatitude = coords.latitude;
    const nextLongitude = coords.longitude;

    if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
      showToast("下一站位置信息无效", "error");
      return;
    }

    selectedStory.value = null;
    mapStore.updateCenter(nextLatitude, nextLongitude);
    mapStore.updateZoom(15);
    setTimeout(() => {
      openStoryModal(story);
    }, 800);
    void prefetchNextStop();
  } catch (error) {
    console.error("跳转下一站失败:", error);
    showToast("跳转下一站失败，请重试", "error");
  } finally {
    randomWalking.value = false;
  }
}

function handlePreviewImage({ index, images }) {
  if (!images || images.length === 0) return;
  lightboxImages.value = images;
  lightboxInitialIndex.value = index || 0;
  showLightbox.value = true;
}

function openFeaturedStory(story) {
  openStoryFromCollection(story);
}

function handleStoryLike({ storyId, liked, likeCount, previousLiked }) {
  const currentLikeCount = Number(
    selectedStory.value?.likeCount ??
      selectedStory.value?.likes ??
      storyLikeCount.value ??
      0,
  );
  const nextLikeCount = Number.isFinite(Number(likeCount))
    ? Number(likeCount)
    : Math.max(0, currentLikeCount + (liked ? 1 : -1));

  storyLikeCount.value = nextLikeCount;
  storyIsLiked.value = liked;

  if (typeof previousLiked === "boolean" && previousLiked !== liked) {
    updateUserPanelTotalCount(likesTotalCount, liked ? 1 : -1);
  }

  syncStoryAcrossCollections(storyId, (story) => {
    story.likes = nextLikeCount;
    story.likeCount = nextLikeCount;
    story.isLiked = liked;
  });

  const likesIndex = likesList.value.findIndex(
    (item) => normalizeStoryIdKey(item.id) === normalizeStoryIdKey(storyId),
  );
  if (!liked && likesIndex > -1) {
    likesList.value.splice(likesIndex, 1);
  } else if (liked && likesIndex === -1 && selectedStory.value) {
    const normalizedStory = normalizeUserPanelStory(selectedStory.value);
    if (normalizedStory) {
      normalizedStory.isLiked = true;
      normalizedStory.likeCount = nextLikeCount;
      normalizedStory.likes = nextLikeCount;
      likesList.value.unshift(normalizedStory);
    }
  }
}

function handleStoryFavorite({
  storyId,
  favorited,
  favoriteCount,
  previousFavorited,
}) {
  storyIsFavorited.value = favorited;
  if (typeof favoriteCount === "number") {
    storyFavoriteCount.value = Math.max(0, favoriteCount);
  }
  if (
    typeof previousFavorited === "boolean" &&
    previousFavorited !== favorited
  ) {
    updateUserPanelTotalCount(
      favoritesTotalCount,
      favorited ? 1 : -1,
    );
  }
  syncStoryAcrossCollections(storyId, (story) => {
    story.isFavorited = favorited;
    if (typeof favoriteCount === "number") {
      story.favoriteCount = favoriteCount;
    }
  });

  const favoritesIndex = favoritesList.value.findIndex(
    (item) => normalizeStoryIdKey(item.id) === normalizeStoryIdKey(storyId),
  );
  if (!favorited && favoritesIndex > -1) {
    favoritesList.value.splice(favoritesIndex, 1);
  } else if (favorited && favoritesIndex === -1 && selectedStory.value) {
    const normalizedStory = normalizeUserPanelStory(selectedStory.value);
    if (normalizedStory) {
      normalizedStory.isFavorited = true;
      if (typeof favoriteCount === "number") {
        normalizedStory.favoriteCount = favoriteCount;
      }
      favoritesList.value.unshift(normalizedStory);
    }
  }
}

function handleStoryComment({ storyId, comment }) {
  const normalizedComment = normalizeStoryComment(comment);
  if (!normalizedComment) {
    return;
  }

  syncStoryAcrossCollections(storyId, (story) => {
    const nextComments = normalizeStoryComments(story.comments);
    const exists = nextComments.some(
      (item) => item.id === normalizedComment.id,
    );
    story.comments = exists
      ? nextComments
      : [normalizedComment, ...nextComments];
    story.commentCount = story.comments.length;
  });
}

async function handleStoryReport({ storyId, reason, description }) {
  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast("请先登录后再举报", "warning");
    return;
  }

  try {
    await reportApi.create("story", storyId, `${reason}: ${description}`);
    showToast("举报已提交，我们会尽快处理", "success");
  } catch (error) {
    console.error("举报失败:", error);
    const message = error.message || "举报失败，请重试";
    showToast(message, "error");
    throw new Error(message);
  }
}

function handleThemeChange(theme) {
  const normalizedTheme = normalizeThemeChoice(theme);
  const nextTheme =
    normalizedTheme === "vip" && !canUseVipTheme.value ? "dark" : normalizedTheme;

  mapTheme.value = nextTheme;
  localStorage.setItem("mapTheme", nextTheme);
  window.dispatchEvent(
    new CustomEvent("map-theme-change", {
      detail: {
        theme: nextTheme === "vip" ? "dark" : nextTheme,
        selectedTheme: nextTheme,
      },
    }),
  );
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapStore.setUserLocation(latitude, longitude);
        mapStore.updateCenter(latitude, longitude);
        nearbyPinnedCenterLabel.value = null;
        nearbyCenterLabel.value = currentUserLocationLabel.value || "当前位置";
        void refreshCurrentUserLocationLabel(nearbyCenterLabel.value);
        scheduleNearbyCenterLabelRefresh(nearbyCenterLabel.value, 80);
      },
      (error) => {
        console.error("获取位置失败:", error);
      },
    );
  }
}

function handleDocumentClick(event) {
  const dockContainer = document.querySelector(".dock-container");
  const target = event?.target;

  if (!dockContainer || !(target instanceof Node)) {
    return;
  }

  if (!dockContainer.contains(target)) {
    isDockExpanded.value = false;
  }
}

let themeAutoCheckInterval = null;

async function loadNotifications() {
  if (!userStore.isLoggedIn || userStore.isGuest) return;

  notificationsLoading.value = true;
  try {
    const [listRes, countRes] = await Promise.all([
      notificationApi.getMyNotifications({ page: 1, limit: 10 }),
      notificationApi.getUnreadCount(),
    ]);

    const listData = listRes?.data ?? listRes;
    const countData = countRes?.data ?? countRes;

    notifications.value = listData?.notifications || [];
    notificationUnreadCount.value = countData?.unreadCount || 0;
  } catch (error) {
    console.error("加载通知失败:", error);
  } finally {
    notificationsLoading.value = false;
  }
}

function closeNotificationPanel() {
  showNotificationPanel.value = false;
}

function openMsgPanel() {
  showNotificationPanel.value = true;
  if (notificationTab.value === "messages") {
    loadNotifications();
  } else {
    loadAnnouncements();
  }
}

function switchNotificationTab(tab) {
  notificationTab.value = tab;
  if (tab === "messages") {
    if (notificationUnreadCount.value > 0) {
      notificationApi.markAllRead().catch(() => {});
      notificationUnreadCount.value = 0;
      notifications.value = notifications.value.map((n) => ({
        ...n,
        isRead: true,
      }));
    }
    loadNotifications();
  } else {
    loadAnnouncements();
  }
}

async function loadAnnouncements() {
  announcementsLoading.value = true;
  try {
    const res = await mapApi.getAnnouncements();
    const data = res?.data ?? res;
    announcements.value = data?.announcements || [];
    if (notificationTab.value === "announcements") {
      markAnnouncementsAsRead();
    }
  } catch (error) {
    console.error("加载公告失败:", error);
  } finally {
    announcementsLoading.value = false;
  }
}

async function markAllNotificationsRead() {
  try {
    await notificationApi.markAllRead();
    notificationUnreadCount.value = 0;
    notifications.value = notifications.value.map((n) => ({
      ...n,
      isRead: true,
    }));
  } catch (error) {
    console.error("标记已读失败:", error);
  }
}

async function clearAllNotifications() {
  if (!(await showConfirm("确定要清空所有通知吗？此操作不可恢复。"))) return;
  try {
    await notificationApi.clearAll();
    notifications.value = [];
    notificationUnreadCount.value = 0;
  } catch (error) {
    console.error("清空通知失败:", error);
  }
}

const readAnnouncementIds = ref([]);

function markAnnouncementsAsRead() {
  announcements.value.forEach((a) => {
    if (!readAnnouncementIds.value.includes(a.id)) {
      readAnnouncementIds.value.push(a.id);
    }
  });
}

const hasUnreadMessages = computed(() => notificationUnreadCount.value > 0);

const hasUnreadAnnouncements = computed(() => {
  return announcements.value.some(
    (a) => !readAnnouncementIds.value.includes(a.id),
  );
});

const hasNotificationBadge = computed(
  () => hasUnreadMessages.value || hasUnreadAnnouncements.value,
);

async function prefetchUnreadCount() {
  if (!userStore.isLoggedIn || userStore.isGuest) return;
  try {
    const res = await notificationApi.getUnreadCount();
    const data = res?.data ?? res;
    notificationUnreadCount.value = data?.unreadCount || 0;
  } catch (error) {}
}

onMounted(() => {
  const uid = userStore.user?.id;
  const savedFont = uid ? (localStorage.getItem(`vip_font_${uid}`) || localStorage.getItem('storyFont')) : localStorage.getItem('storyFont');
  if (savedFont) {
    document.documentElement.style.setProperty('--story-font', `'${savedFont}', cursive, sans-serif`);
    document.cookie = `vip_default_font=${encodeURIComponent(savedFont)};path=/;max-age=${365 * 86400};SameSite=Lax`;
  }
  if (uid) {
    const savedEffect = localStorage.getItem(`vip_font_effect_${uid}`) || '';
    document.cookie = `vip_default_font_effect=${encodeURIComponent(savedEffect)};path=/;max-age=${365 * 86400};SameSite=Lax`;
  }
  getUserLocation();
  loadStories();
  setTimeout(loadClusterData, 1000);
  themeAutoCheckInterval = setInterval(() => {
    minuteTicker.value += 1;
  }, 60000);

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
  window.addEventListener("resize", scheduleWelcomeTextFit);
  scheduleWelcomeTextFit();
  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleWelcomeTextFit).catch(() => {});
  }
  welcomeOverlayTimer = window.setTimeout(() => {
    showWelcomeOverlay.value = false;
  }, 1100);

  if (userStore.isGuest) {
    // 游客强制回退到默认主题
    if (VIP_THEME_KEYS.has(getActiveThemeKey())) {
      activeDockTheme.value = DEFAULT_THEME_KEY;
      usePokerTheme.value = false;
      saveDockThemeForUser(userStore.user?.id, DEFAULT_THEME_KEY);
    }
  } else if (userStore.isLoggedIn && !userStore.isGuest) {
    const loadTasks = [loadNotifications(), loadAnnouncements()];
    Promise.all(loadTasks).then(() => {
      const hasUnread =
        notificationUnreadCount.value > 0 || hasUnreadAnnouncements.value;
      if (hasUnread) {
        if (notificationUnreadCount.value > 0) {
          notificationTab.value = "messages";
          if (notificationUnreadCount.value > 0) {
            notificationApi.markAllRead().catch(() => {});
            notificationUnreadCount.value = 0;
          }
        } else {
          notificationTab.value = "announcements";
          markAnnouncementsAsRead();
        }
        showNotificationPanel.value = true;
      }
    });
  }
});

onUnmounted(() => {
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("keydown", handleDocumentKeydown);
  window.removeEventListener("resize", scheduleWelcomeTextFit);
  clearNearbySearchTimer();
  clearNearbyCenterLabelTimer();
  activeNearbySearchToken += 1;
  activeNearbyCenterLabelToken += 1;
  activeUserLocationLabelToken += 1;
  clearTimeout(loadTimer);
  clearTimeout(storyOpenTimer);
  clearTimeout(welcomeOverlayTimer);
  if (welcomeTextResizeFrame) {
    window.cancelAnimationFrame(welcomeTextResizeFrame);
  }
  if (themeAutoCheckInterval) clearInterval(themeAutoCheckInterval);
});
</script>

<style scoped>
.welcome-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4a4063 0%, #b85b56 50%, #e08e6d 100%);
}

.welcome-content {
  text-align: center;
  padding: 0 40px;
}

.welcome-text {
  font-family:
    "Matisse-EB", "FOT-MatissePro-EB", "STZhongsong", "华文中宋", "Songti SC",
    serif;
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 4px;
  line-height: 1.5;
  margin: 0;

  color: #fdfdfd;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);

  display: inline-block;
  opacity: 0;
  transform: translateY(15px) scale(var(--welcome-text-scale, 1));
  transform-origin: center center;
  animation: textCinematicShow 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: 0.2s;
}

@keyframes textCinematicShow {
  to {
    opacity: 1;
    transform: translateY(0) scale(var(--welcome-text-scale, 1));
  }
}

.welcome-fade-enter-active,
.welcome-fade-leave-active {
  transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.welcome-fade-enter-from,
.welcome-fade-leave-to {
  opacity: 0;
  transform: scale(1.04);
}

.welcome-overlay {
  overflow: hidden;
  background: linear-gradient(180deg, #02040b 0%, #060b18 46%, #0b1530 100%);
}

.welcome-overlay__sky,
.welcome-overlay__nebula,
.welcome-overlay__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.welcome-overlay__sky {
  background:
    radial-gradient(
      circle at 18% 18%,
      rgba(56, 74, 168, 0.14) 0%,
      transparent 22%
    ),
    radial-gradient(
      circle at 82% 14%,
      rgba(82, 52, 142, 0.12) 0%,
      transparent 20%
    ),
    radial-gradient(
      circle at 50% 110%,
      rgba(28, 62, 120, 0.18) 0%,
      transparent 34%
    ),
    linear-gradient(180deg, #02040b 0%, #060b18 46%, #0b1530 100%);
}

.welcome-overlay__nebula {
  background:
    radial-gradient(
      circle at 24% 28%,
      rgba(118, 141, 241, 0.09) 0%,
      transparent 24%
    ),
    radial-gradient(
      circle at 76% 32%,
      rgba(154, 113, 222, 0.08) 0%,
      transparent 20%
    ),
    radial-gradient(
      circle at 50% 72%,
      rgba(82, 136, 226, 0.08) 0%,
      transparent 26%
    );
  filter: blur(20px);
  opacity: 0.8;
  animation: welcomeNebulaFloat 12s ease-in-out infinite alternate;
}

.welcome-overlay__stars {
  background-image:
    radial-gradient(
      circle at 7% 12%,
      rgba(255, 255, 255, 0.95) 0 1px,
      transparent 1.6px
    ),
    radial-gradient(
      circle at 17% 68%,
      rgba(255, 244, 201, 0.88) 0 1.3px,
      transparent 2px
    ),
    radial-gradient(
      circle at 24% 22%,
      rgba(255, 255, 255, 0.78) 0 1px,
      transparent 1.8px
    ),
    radial-gradient(
      circle at 32% 14%,
      rgba(201, 224, 255, 0.8) 0 1.2px,
      transparent 2px
    ),
    radial-gradient(
      circle at 43% 82%,
      rgba(255, 244, 201, 0.84) 0 1.3px,
      transparent 2px
    ),
    radial-gradient(
      circle at 54% 18%,
      rgba(255, 255, 255, 0.78) 0 1px,
      transparent 1.8px
    ),
    radial-gradient(
      circle at 63% 72%,
      rgba(201, 224, 255, 0.84) 0 1.4px,
      transparent 2.1px
    ),
    radial-gradient(
      circle at 72% 10%,
      rgba(255, 244, 201, 0.9) 0 1.3px,
      transparent 2px
    ),
    radial-gradient(
      circle at 86% 24%,
      rgba(255, 255, 255, 0.85) 0 1.1px,
      transparent 1.8px
    ),
    radial-gradient(
      circle at 93% 66%,
      rgba(201, 224, 255, 0.82) 0 1.4px,
      transparent 2.2px
    ),
    radial-gradient(
      circle at 14% 88%,
      rgba(255, 255, 255, 0.72) 0 1px,
      transparent 1.7px
    ),
    radial-gradient(
      circle at 84% 86%,
      rgba(255, 244, 201, 0.82) 0 1.2px,
      transparent 2px
    );
  opacity: 0.95;
  animation: welcomeStarsPulse 4.8s ease-in-out infinite;
}

.welcome-content {
  position: relative;
  z-index: 1;
  width: min(96vw, 1280px);
  max-width: calc(100vw - 24px);
  box-sizing: border-box;
}

.welcome-text {
  font-size: clamp(36px, 4vw, 52px);
  white-space: nowrap;
  letter-spacing: clamp(1px, 0.22vw, 4px);
  background: linear-gradient(135deg, #fff8e8 0%, #f0d79a 44%, #c9923a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: none;
  filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.42))
    drop-shadow(0 0 18px rgba(255, 220, 150, 0.2));
}

@keyframes welcomeNebulaFloat {
  from {
    transform: scale(1) translate3d(0, 0, 0);
  }

  to {
    transform: scale(1.06) translate3d(-1.5%, 1.5%, 0);
  }
}

@keyframes welcomeStarsPulse {
  0%,
  100% {
    opacity: 0.82;
  }

  50% {
    opacity: 1;
  }
}

.map-page {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.map-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: #e8e8e8;
}

.map-container :deep(.amap-container) {
  width: 100% !important;
  height: 100% !important;
}

.story-sidebar {
  position: fixed;
  left: 50%;
  top: 50%;
  bottom: auto;
  right: auto;
  width: min(860px, calc(100vw - 48px));
  height: min(90vh, 960px);
  border-radius: 32px;
  border: 1px solid rgba(196, 142, 48, 0.36);
  background: linear-gradient(
    160deg,
    rgba(18, 23, 37, 0.96) 0%,
    rgba(31, 42, 64, 0.97) 56%,
    rgba(17, 25, 42, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(3, 7, 18, 0.72),
    0 0 0 1px rgba(255, 248, 232, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transform: translate(-50%, -50%) scale(0.96);
  transition:
    transform 0.34s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.26s ease,
    visibility 0.26s ease;
  z-index: 340;
  display: flex;
  flex-direction: column;
  visibility: hidden;
  pointer-events: none;
  opacity: 0;
  overflow: hidden;
}

.story-sidebar.show-sidebar {
  transform: translate(-50%, -50%) scale(1);
  visibility: visible;
  pointer-events: auto;
  opacity: 1;
  box-shadow:
    0 40px 80px -32px rgba(3, 7, 18, 0.72),
    0 0 0 1px rgba(255, 248, 232, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 0 100vmax rgba(8, 11, 19, 0.46);
}

.story-sidebar::before,
.story-sidebar::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.story-sidebar::before {
  inset: 10px;
  border-radius: 24px;
  border: 1px solid rgba(199, 151, 60, 0.18);
  background:
    radial-gradient(
      circle at top right,
      rgba(255, 255, 255, 0.08) 0%,
      transparent 24%
    ),
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.03) 48%,
      transparent 100%
    );
  z-index: 0;
}

.story-sidebar::after {
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.26s ease;
  background:
    radial-gradient(
      circle at top,
      rgba(255, 229, 176, 0.12) 0%,
      transparent 30%
    ),
    rgba(8, 11, 19, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.story-sidebar.show-sidebar::after {
  opacity: 1;
}

.sidebar-header {
  position: relative;
  z-index: 1;
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-right: 102px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

.sidebar-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.76);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  font-weight: 500;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.story-sidebar .close-btn {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 2;
  min-width: 82px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(13, 19, 34, 0.82);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 18px 26px -20px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.story-sidebar .close-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  height: 100%;
  width: 100%;
  transform: translate(-0.25px, -1.25px);
}

.story-sidebar .close-btn:hover {
  background: rgba(26, 35, 58, 0.96);
  border-color: rgba(255, 255, 255, 0.36);
}

.sidebar-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  z-index: 1;
  padding: 0;
  /* 隐藏滚动条但保留滚轮功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.sidebar-content::-webkit-scrollbar {
  display: none;
}

/* 故事墙标签页 - 不产生独立滚动，由 sidebar-content 统一滚动 */
.wall-tab-scroll {
  overflow: visible;
  padding: 16px 24px 24px;
}

/* 返回顶部按钮 - 固定在容器右下角 */
.wall-back-to-top {
  position: absolute;
  right: 18px;
  bottom: 18px;
  top: auto;
  z-index: 10;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(13, 19, 34, 0.82);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18px 36px -18px rgba(0, 0, 0, 0.55);
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}
.wall-back-to-top:hover {
  background: rgba(26, 35, 58, 0.96);
  border-color: rgba(255, 255, 255, 0.36);
  transform: scale(1.08);
}
.wall-back-to-top svg {
  width: 20px;
  height: 20px;
}
.wall-back-to-top.dark {
  border-color: rgba(141, 176, 235, 0.24);
  background: rgba(15, 22, 40, 0.9);
}
.wall-back-to-top:not(.dark) {
  border-color: rgba(196, 142, 48, 0.28);
  background: rgba(63, 40, 11, 0.82);
  color: #fffaf1;
}
/* 标签栏包裹层 - 为返回顶部按钮提供定位上下文 */
.user-content-tabs-wrapper {
  position: relative;
  margin-bottom: 0;
}
.wall-back-to-top.profile-back-to-top {
  position: absolute;
}
.wall-back-to-top:not(.dark):hover {
  background: rgba(88, 56, 18, 0.95);
}

/* 返回顶部过渡动画 */
.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 故事墙 Grid 布局 */
.story-wall-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-bottom: 20px;
}

/* 响应式：窄屏改为 2 列 */
@media (max-width: 480px) {
  .story-wall-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 加载更多提示 */
.wall-loading-more {
  text-align: center;
  padding: 16px 0 24px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.loading {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.7);
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.8);
}

.empty .hint {
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.6;
  color: rgba(255, 255, 255, 0.7);
}

.story-list {
  position: relative;
  padding-bottom: 64px;
}

/* 非 Feed 的 story-list 保持 grid 布局（如精选等） */
.story-list:not(.vscroll-container) {
  display: grid;
  gap: 14px;
}

.story-list :deep(.story-card),
.story-list > .featured-story-card {
  width: 100%;
  max-width: none;
  margin: 0;
}

.story-list :deep(.story-card) {
  margin-bottom: 0;
  border-radius: 14px;
  padding: 16px 16px 14px;
}

.story-list :deep(.story-header) {
  margin-bottom: 10px;
}

.story-list :deep(.user-info) {
  gap: 10px;
}

.story-list :deep(.avatar-shell) {
  width: 36px;
  height: 36px;
  font-size: 14px;
}

.story-list :deep(.emotion-icon) {
  font-size: 22px;
}

.story-list :deep(.story-content) {
  margin-bottom: 12px;
}

.story-list :deep(.story-content p) {
  font-size: 14px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-list :deep(.story-images) {
  gap: 6px;
  margin-bottom: 12px;
}

.story-list :deep(.story-images img) {
  border-radius: 10px;
  aspect-ratio: 4 / 3;
}

.story-list :deep(.story-footer) {
  gap: 12px;
}

.story-list :deep(.location) {
  font-size: 12px;
}

.nearby-search-panel {
  margin-bottom: 18px;
  padding: 18px;
  border-radius: 24px;
  display: grid;
  gap: 14px;
  border: 1px solid transparent;
}

.nearby-search-panel__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.nearby-search-panel__kicker {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.nearby-search-panel__heading h3 {
  margin: 0;
  font-size: 22px;
  line-height: 1.1;
}

.nearby-search-panel__summary {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.65;
}

.nearby-search-panel__controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.nearby-search-panel__input,
.nearby-search-panel__submit,
.nearby-search-panel__ghost-btn,
.nearby-search-panel__text-btn,
.nearby-search-panel__result {
  font: inherit;
}

.nearby-search-panel__input {
  width: 100%;
  min-width: 0;
  height: 48px;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid transparent;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.nearby-search-panel__submit,
.nearby-search-panel__ghost-btn {
  height: 48px;
  padding: 0 18px;
  border-radius: 16px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.nearby-search-panel__submit:hover:not(:disabled),
.nearby-search-panel__ghost-btn:hover {
  transform: translateY(-1px);
}

.nearby-search-panel__submit:disabled,
.nearby-search-panel__ghost-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.nearby-search-panel__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.nearby-search-panel__text-btn {
  padding: 0;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.nearby-search-panel__tip,
.nearby-search-panel__feedback,
.nearby-search-panel__result-copy span,
.nearby-search-panel__result-meta {
  font-size: 13px;
  line-height: 1.6;
}

.nearby-search-panel__feedback {
  margin: 0;
}

.nearby-search-panel__results {
  display: grid;
  gap: 10px;
}

.nearby-search-panel__result {
  width: 100%;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: transparent;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.nearby-search-panel__result:hover {
  transform: translateY(-1px);
}

.nearby-search-panel__result-copy,
.nearby-search-panel__result-meta {
  display: grid;
  gap: 4px;
}

.nearby-search-panel__result-copy {
  min-width: 0;
}

.nearby-search-panel__result-copy strong,
.nearby-search-panel__result-copy span {
  display: block;
  word-break: break-word;
}

.nearby-search-panel__result-meta {
  justify-items: end;
  text-align: right;
  flex-shrink: 0;
}

.nearby-search-panel__result-meta small {
  font-size: 12px;
}

.load-more-wrap {
  padding: 16px;
  text-align: center;
  width: 100%;
  margin: 0;
}

.load-more-btn {
  padding: 10px 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more-btn:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.15);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.featured-story-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transform: scale(0.96);
  transition: all 0.3s;
  border: 2px solid rgba(255, 255, 255, 0.15);
}

.featured-story-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px) scale(1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.featured-image {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 2;
}

.featured-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 6px;
}

.featured-badges .badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.featured-badges .badge.featured {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: white;
}

.featured-badges .badge.pinned {
  background: #667eea;
  color: white;
}

.featured-content {
  padding: 10px 11px 11px;
}

.featured-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.featured-author-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-weight: 700;
}

.featured-author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-author-name {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.72);
}

.featured-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.55;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.featured-meta .emotion {
  font-size: 14px;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  border-left: 3px solid #667eea;
  transition: all 0.3s;
}

.announcement-card:hover {
  background: rgba(255, 255, 255, 0.12);
}

.announcement-card.emotion {
  border-left-color: #e74c3c;
}

.announcement-card.feature {
  border-left-color: #f39c12;
}

.announcement-card.warning {
  border-left-color: #f39c12;
}

.ann-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ann-type-badge {
  font-size: 16px;
}

.ann-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.ann-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
}

.ann-content {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0;
}

.dock-container {
  --dock-main-gradient: linear-gradient(
    135deg,
    rgba(19, 30, 61, 0.94) 0%,
    rgba(50, 26, 66, 0.96) 52%,
    rgba(108, 54, 61, 0.96) 100%
  );
  --dock-main-shadow: rgba(8, 13, 29, 0.34);
  --dock-main-border: rgba(255, 255, 255, 0.16);
  --dock-info-bg: linear-gradient(
    145deg,
    rgba(8, 12, 25, 0.97) 0%,
    rgba(17, 24, 45, 0.95) 100%
  );
  --dock-info-border: rgba(255, 230, 186, 0.12);
  --dock-info-kicker: rgba(255, 214, 143, 0.9);
  --dock-info-text: rgba(255, 255, 255, 0.76);
  --dock-card-surface: linear-gradient(
    160deg,
    #f5ead5 0%,
    #eddcc0 58%,
    #e6cfad 100%
  );
  --dock-card-border: rgba(181, 132, 42, 0.56);
  --dock-card-frame: rgba(189, 146, 61, 0.44);
  --dock-card-pattern: rgba(147, 111, 48, 0.18);
  --dock-card-edge-ring: rgba(214, 166, 75, 0.18);
  --dock-card-edge-glow: rgba(233, 193, 114, 0.18);
  --dock-card-order: rgba(27, 33, 52, 0.44);
  --dock-card-subtitle: rgba(27, 33, 52, 0.72);
  --dock-card-icon-bg: linear-gradient(
    145deg,
    rgba(255, 248, 234, 0.9) 0%,
    rgba(232, 214, 186, 0.82) 100%
  );
  --dock-card-active-border: rgba(255, 239, 192, 0.98);
  --dock-card-active-frame: rgba(236, 190, 96, 0.82);
  --dock-card-active-corner: rgba(228, 176, 66, 0.92);
  --dock-submenu-shadow: rgba(8, 13, 29, 0.28);
  --dock-submenu-option-text: rgba(255, 255, 255, 0.84);
  --dock-submenu-option-muted: rgba(255, 255, 255, 0.6);
  --dock-submenu-option-bg: rgba(255, 255, 255, 0.08);
  --dock-submenu-option-border: rgba(255, 255, 255, 0.08);
  --dock-submenu-option-hover: rgba(255, 255, 255, 0.14);
  position: fixed;
  bottom: 32px;
  right: 96px;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 18px;
  z-index: 200;
  transition: all 0.3s ease;
}

.dock-container.dock-light {
  --dock-main-gradient: linear-gradient(
    135deg,
    rgba(183, 108, 58, 0.94) 0%,
    rgba(204, 137, 77, 0.97) 48%,
    rgba(118, 78, 45, 0.94) 100%
  );
  --dock-main-shadow: rgba(72, 41, 15, 0.28);
  --dock-main-border: rgba(255, 248, 231, 0.34);
  --dock-info-bg: linear-gradient(
    145deg,
    rgba(63, 41, 22, 0.96) 0%,
    rgba(102, 69, 36, 0.94) 100%
  );
  --dock-info-border: rgba(255, 231, 188, 0.24);
  --dock-info-kicker: rgba(255, 216, 151, 0.96);
  --dock-info-text: rgba(255, 246, 229, 0.82);
  --dock-card-surface: linear-gradient(
    160deg,
    #faefd9 0%,
    #f0dfbf 54%,
    #e5c996 100%
  );
  --dock-card-border: rgba(194, 139, 39, 0.64);
  --dock-card-frame: rgba(203, 154, 53, 0.5);
  --dock-card-pattern: rgba(155, 101, 34, 0.16);
  --dock-card-edge-ring: rgba(221, 170, 72, 0.22);
  --dock-card-edge-glow: rgba(241, 199, 114, 0.22);
  --dock-card-order: rgba(64, 43, 21, 0.42);
  --dock-card-subtitle: rgba(64, 43, 21, 0.72);
  --dock-card-icon-bg: linear-gradient(
    145deg,
    rgba(255, 247, 228, 0.9) 0%,
    rgba(234, 214, 180, 0.82) 100%
  );
  --dock-card-active-border: rgba(255, 245, 213, 1);
  --dock-card-active-frame: rgba(222, 164, 61, 0.88);
  --dock-card-active-corner: rgba(215, 151, 41, 0.96);
  --dock-submenu-shadow: rgba(72, 41, 15, 0.18);
  --dock-submenu-option-text: rgba(255, 249, 238, 0.9);
  --dock-submenu-option-muted: rgba(255, 238, 214, 0.66);
  --dock-submenu-option-bg: rgba(255, 255, 255, 0.1);
  --dock-submenu-option-border: rgba(255, 242, 220, 0.12);
  --dock-submenu-option-hover: rgba(255, 255, 255, 0.16);
}

.dock-container.dock-dark {
  --dock-main-gradient: linear-gradient(
    135deg,
    rgba(28, 34, 63, 0.96) 0%,
    rgba(40, 56, 96, 0.96) 48%,
    rgba(16, 22, 44, 0.98) 100%
  );
  --dock-main-shadow: rgba(5, 8, 20, 0.42);
  --dock-main-border: rgba(194, 214, 255, 0.18);
  --dock-info-bg: linear-gradient(
    145deg,
    rgba(9, 14, 31, 0.98) 0%,
    rgba(18, 28, 57, 0.96) 100%
  );
  --dock-info-border: rgba(158, 192, 255, 0.18);
  --dock-info-kicker: rgba(168, 204, 255, 0.92);
  --dock-info-text: rgba(219, 229, 255, 0.78);
  --dock-card-surface: linear-gradient(
    160deg,
    #16213d 0%,
    #1d2d54 54%,
    #243865 100%
  );
  --dock-card-border: rgba(139, 171, 235, 0.28);
  --dock-card-frame: rgba(139, 171, 235, 0.2);
  --dock-card-pattern: rgba(139, 171, 235, 0.16);
  --dock-card-edge-ring: rgba(0, 0, 0, 0);
  --dock-card-edge-glow: rgba(0, 0, 0, 0);
  --dock-card-order: rgba(220, 231, 255, 0.38);
  --dock-card-subtitle: rgba(220, 231, 255, 0.72);
  --dock-card-icon-bg: linear-gradient(
    145deg,
    rgba(27, 42, 79, 0.92) 0%,
    rgba(39, 59, 108, 0.86) 100%
  );
  --dock-card-active-border: rgba(226, 238, 255, 0.98);
  --dock-card-active-frame: rgba(155, 193, 255, 0.78);
  --dock-card-active-corner: rgba(155, 193, 255, 0.96);
  --dock-submenu-shadow: rgba(5, 8, 20, 0.34);
  --dock-submenu-option-text: rgba(238, 244, 255, 0.88);
  --dock-submenu-option-muted: rgba(198, 214, 245, 0.62);
  --dock-submenu-option-bg: rgba(255, 255, 255, 0.06);
  --dock-submenu-option-border: rgba(198, 214, 245, 0.08);
  --dock-submenu-option-hover: rgba(255, 255, 255, 0.1);
}

.dock-container.dock-vip-theme {
  --dock-main-gradient: linear-gradient(
    135deg,
    rgba(56, 37, 17, 0.98) 0%,
    rgba(97, 70, 28, 0.97) 48%,
    rgba(39, 25, 11, 0.98) 100%
  );
  --dock-main-shadow: rgba(39, 24, 7, 0.42);
  --dock-main-border: rgba(248, 225, 171, 0.26);
  --dock-info-bg: linear-gradient(
    145deg,
    rgba(42, 26, 10, 0.98) 0%,
    rgba(92, 63, 23, 0.96) 100%
  );
  --dock-info-border: rgba(248, 225, 171, 0.22);
  --dock-info-kicker: rgba(255, 224, 163, 0.94);
  --dock-info-text: rgba(255, 247, 231, 0.82);
  --dock-card-surface: linear-gradient(
    160deg,
    #24150a 0%,
    #5b3b16 52%,
    #8c6730 100%
  );
  --dock-card-border: rgba(236, 196, 112, 0.5);
  --dock-card-frame: rgba(242, 210, 139, 0.34);
  --dock-card-pattern: rgba(255, 225, 161, 0.16);
  --dock-card-edge-ring: rgba(255, 221, 145, 0.14);
  --dock-card-edge-glow: rgba(255, 210, 116, 0.24);
  --dock-card-order: rgba(255, 232, 187, 0.46);
  --dock-card-subtitle: rgba(255, 244, 222, 0.74);
  --dock-card-icon-bg: linear-gradient(
    145deg,
    rgba(137, 100, 37, 0.92) 0%,
    rgba(76, 49, 18, 0.88) 100%
  );
  --dock-card-active-border: rgba(255, 238, 194, 0.98);
  --dock-card-active-frame: rgba(255, 215, 124, 0.86);
  --dock-card-active-corner: rgba(255, 205, 104, 0.98);
  --dock-submenu-shadow: rgba(41, 25, 7, 0.34);
  --dock-submenu-option-text: rgba(255, 248, 233, 0.92);
  --dock-submenu-option-muted: rgba(248, 228, 188, 0.72);
  --dock-submenu-option-bg: rgba(255, 247, 230, 0.08);
  --dock-submenu-option-border: rgba(255, 225, 171, 0.14);
  --dock-submenu-option-hover: rgba(255, 247, 230, 0.14);
}

.dock-container.show-user-sidebar {
  right: 96px;
}

.dock-container.show-dock-publish-sidebar {
  right: 96px;
}

.dock-container.locked {
  opacity: 0.72;
}

.dock-container.locked .dock-main,
.dock-container.locked .dock-card,
.dock-container.locked .dock-card-anchor {
  pointer-events: none;
}

.dock-container.locked .dock-main {
  cursor: not-allowed;
  box-shadow: 0 12px 28px rgba(8, 13, 29, 0.24);
}

.dock-menu {
  position: fixed;
  left: 50%;
  bottom: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, 20px) scale(0.92);
  transform-origin: center bottom;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.32s ease,
    transform 0.46s cubic-bezier(0.16, 1, 0.3, 1),
    visibility 0.32s ease;
  z-index: 210;
}

.dock-menu.expanded {
  transform: translate(-50%, 0) scale(1);
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.dock-main {
  min-width: 154px;
  height: 76px;
  border-radius: 24px;
  padding: 0 20px 0 16px;
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.22) 0%,
      transparent 44%
    ),
    var(--dock-main-gradient);
  color: white;
  box-shadow: 0 18px 40px var(--dock-main-shadow);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  border: 1px solid var(--dock-main-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.dock-main:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 44px rgba(8, 13, 29, 0.42);
}

.dock-main.expanded {
  box-shadow: 0 24px 52px rgba(8, 13, 29, 0.48);
}

.dock-main-symbol {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.dock-main-text {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.dock-card-info {
  position: absolute;
  z-index: 180;
  min-height: 144px;
  padding: 20px 24px 22px;
  border-radius: 24px;
  background: var(--dock-info-bg);
  border: 1px solid var(--dock-info-border);
  box-shadow: 0 24px 42px rgba(5, 9, 20, 0.42);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  color: #f7f2eb;
  transform: translateY(18px) scale(0.96);
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition:
    opacity 0.28s ease,
    transform 0.44s cubic-bezier(0.16, 1, 0.3, 1),
    left 0.42s cubic-bezier(0.16, 1, 0.3, 1),
    top 0.42s cubic-bezier(0.16, 1, 0.3, 1);
}

.dock-card-info::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at top right,
      rgba(255, 214, 143, 0.12) 0%,
      transparent 28%
    ),
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.04) 48%,
      transparent 100%
    );
  pointer-events: none;
}

.dock-card-info.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.dock-card-info-kicker {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dock-info-kicker);
}

.dock-card-info h4 {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.dock-card-info p:last-child {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--dock-info-text);
}

.dock-card-stack {
  position: relative;
  align-self: stretch;
  min-width: 0;
}

.dock-card-placeholder,
.dock-card-anchor {
  display: block;
  position: absolute;
  left: 0;
  bottom: 0;
  width: 244px;
  height: 344px;
  border-radius: 30px;
  opacity: 0;
  cursor: pointer;
  pointer-events: auto;
}

.dock-card-placeholder {
  transform: translate3d(var(--placeholder-x), var(--placeholder-y), 0);
  transform-origin: center center;
  z-index: 113;
}

.dock-card-anchor {
  transform: translate3d(var(--anchor-x), var(--anchor-y), 0);
  transform-origin: center center;
  z-index: 115;
}

.dock-card-hitbox-disabled {
  pointer-events: none !important;
}

.dock-card {
  --active-breathe-y: 0px;
  position: absolute;
  left: 0;
  bottom: 0;
  width: 244px;
  height: 344px;
  padding: 20px 20px 22px;
  border-radius: 30px;
  border: 1px solid var(--dock-card-border);
  background: var(--dock-card-surface);
  box-shadow:
    0 20px 38px rgba(8, 12, 24, 0.26),
    0 0 0 1px var(--dock-card-edge-ring),
    0 0 22px -6px var(--dock-card-edge-glow),
    inset 0 0 0 2px rgba(255, 246, 223, 0.75),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  color: var(--card-ink);
  cursor: pointer;
  overflow: visible;
  transform: translate3d(var(--peek-x), var(--peek-y), 0)
    rotate(var(--peek-rotate));
  transform-origin: center bottom;
  opacity: 0;
  pointer-events: auto;
  will-change: transform, opacity, filter;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
  transition:
    transform 0.52s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.52s ease,
    filter 0.52s ease,
    opacity 0.32s ease,
    border-color 0.52s ease;
}

.dock-card.selector {
  cursor: default;
}

.dock-card-body {
  position: relative;
  height: 100%;
  border-radius: inherit;
  overflow: hidden;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.dock-card::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 22px;
  border: 1px solid var(--dock-card-frame);
  background:
    radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.2) 0 18%,
      transparent 18.5%
    ),
    radial-gradient(
      circle at center,
      transparent 0 39%,
      var(--dock-card-pattern) 39.5%,
      transparent 40.5%
    ),
    linear-gradient(
      0deg,
      transparent calc(50% - 1px),
      var(--dock-card-pattern) 50%,
      transparent calc(50% + 1px)
    ),
    linear-gradient(
      90deg,
      transparent calc(50% - 1px),
      var(--dock-card-pattern) 50%,
      transparent calc(50% + 1px)
    );
  opacity: 0.65;
  pointer-events: none;
}

.dock-card::after {
  content: "";
  position: absolute;
  inset: 24px;
  border-radius: 24px;
  background:
    radial-gradient(
      circle at top center,
      rgba(255, 255, 255, 0.28) 0%,
      transparent 22%
    ),
    repeating-linear-gradient(
      135deg,
      rgba(147, 111, 48, 0.03) 0 6px,
      rgba(255, 255, 255, 0.03) 6px 12px
    );
  mix-blend-mode: soft-light;
  pointer-events: none;
}

.dock-menu.expanded .dock-card {
  opacity: 1;
  transform: translate3d(var(--spread-x), var(--spread-y), 0)
    rotate(var(--spread-rotate));
  transition-delay: calc(var(--index) * 62ms);
  z-index: var(--card-z);
}

.dock-card-stack.selection-motion .dock-card {
  transition-delay: 0ms !important;
}

.dock-container.dock-dark .dock-card-stack.selected-state
  .dock-card:not(.active):not(.drawing):not(.lifting):not(.returning) {
  opacity: 1;
  filter: saturate(0.9) brightness(0.86) contrast(0.94);
}

.dock-container.dock-light .dock-card-stack.selected-state
  .dock-card:not(.active):not(.drawing):not(.lifting):not(.returning) {
  opacity: 1;
  filter: saturate(0.9) brightness(0.95) contrast(0.94);
}

.dock-card-stack.selection-motion
  .dock-card:not(.drawing):not(.lifting):not(.active):not(.returning) {
  transition-duration: 0.24s, 0.26s, 0.26s, 0.18s, 0.26s;
  transition-timing-function:
    cubic-bezier(0.2, 0.82, 0.22, 1), ease, ease, ease, ease;
}

.dock-card-stack.selection-motion .dock-card.drawing {
  transition-delay: 85ms, 0ms, 0ms, 0ms, 0ms !important;
}

.dock-menu.expanded .dock-card:nth-child(odd) {
  transition-duration: 0.62s;
}

.dock-menu.expanded .dock-card.drawing {
  transform: translate3d(var(--prep-x), var(--prep-y), 0)
    rotate(var(--prep-rotate)) scale(var(--prep-scale));
  transition-duration: 0.24s, 0.28s, 0.28s, 0.18s, 0.28s;
  transition-timing-function:
    cubic-bezier(0.32, 0.94, 0.48, 1), ease, ease, ease, ease;
  z-index: var(--card-z) !important;
}

.dock-menu.expanded .dock-card.lifting {
  transform: translate3d(var(--draw-x), var(--draw-y), 0)
    rotate(var(--draw-rotate)) scale(var(--draw-scale));
  transition-duration: 0.1s, 0.12s, 0.12s, 0.1s, 0.12s;
  transition-timing-function:
    cubic-bezier(0.2, 0.88, 0.24, 1), ease, ease, ease, ease;
  z-index: 116 !important;
}

.dock-menu.expanded .dock-card.active {
  transform: translate3d(
      var(--hover-x),
      calc(var(--hover-y) + var(--active-breathe-y)),
      0
    )
    rotate(var(--hover-rotate))
    scale(var(--hover-scale));
  transition-duration: 0.12s, 0.16s, 0.16s, 0.12s, 0.16s;
  animation: dockCardActiveBreath 2.4s linear 0.5s infinite;
  animation-fill-mode: backwards;
  box-shadow:
    0 24px 44px rgba(8, 12, 24, 0.34),
    0 0 0 1px var(--dock-card-edge-ring),
    0 0 28px -5px var(--card-accent-soft),
    inset 0 0 0 2px rgba(255, 246, 223, 0.84),
    inset 0 1px 0 rgba(255, 255, 255, 0.76);
  z-index: 116 !important;
}

.dock-menu.expanded .dock-card.drawing,
.dock-menu.expanded .dock-card.lifting,
.dock-menu.expanded .dock-card.active {
  border-width: 2px;
  border-color: var(--dock-card-active-border);
  filter: none;
}

.dock-menu.expanded .dock-card.drawing::before,
.dock-menu.expanded .dock-card.lifting::before,
.dock-menu.expanded .dock-card.active::before {
  opacity: 0.98;
  border-width: 2px;
  border-color: var(--dock-card-active-frame);
}

.dock-menu.expanded .dock-card.drawing .dock-card-corner,
.dock-menu.expanded .dock-card.lifting .dock-card-corner,
.dock-menu.expanded .dock-card.active .dock-card-corner {
  border-color: var(--dock-card-active-corner);
}

.dock-menu.expanded .dock-card.drawing::after,
.dock-menu.expanded .dock-card.lifting::after,
.dock-menu.expanded .dock-card.active::after {
  opacity: 0.65;
}

.dock-menu.expanded .dock-card.returning {
  transition-duration: 0.28s, 0.28s, 0.28s, 0.2s, 0.28s;
  transition-timing-function:
    cubic-bezier(0.42, 0, 0.58, 1), ease, ease, ease, ease;
}

.dock-card:focus {
  outline: none;
}

.dock-card.disabled {
  opacity: 0.72;
  filter: grayscale(0.18);
  cursor: not-allowed;
}

.dock-card.disabled:hover,
.dock-card.disabled:focus {
  transform: translate3d(var(--spread-x), var(--spread-y), 0)
    rotate(var(--spread-rotate));
  box-shadow:
    0 20px 38px rgba(8, 12, 24, 0.26),
    inset 0 0 0 2px rgba(255, 246, 223, 0.75),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  filter: grayscale(0.18);
  animation: none;
}

.dock-card-ripple {
  position: absolute;
  inset: -10px;
  border-radius: 36px;
  border: 2px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.28),
    0 0 18px rgba(255, 255, 255, 0.22);
  opacity: 0;
  transform: scale(0.96);
  pointer-events: none;
}

.dock-card.rippling .dock-card-ripple {
  animation: dockCardRipple 0.5s ease-out forwards;
}

@keyframes dockCardRipple {
  0% {
    opacity: 0.8;
    transform: scale(0.98);
  }
  70% {
    opacity: 0.28;
    transform: scale(1.16);
  }
  100% {
    opacity: 0;
    transform: scale(1.24);
  }
}

@keyframes dockCardHoverWobble {
  0%,
  100% {
    transform: translate3d(var(--hover-x), var(--hover-y), 0)
      rotate(calc(var(--hover-rotate) - 0.45deg)) scale(var(--hover-scale));
  }
  18% {
    transform: translate3d(
        calc(var(--hover-x) - 1px),
        calc(var(--hover-y) - 2px),
        0
      )
      rotate(calc(var(--hover-rotate) + 0.25deg)) scale(var(--hover-scale));
  }
  50% {
    transform: translate3d(
        calc(var(--hover-x) + 2px),
        calc(var(--hover-y) - 3px),
        0
      )
      rotate(calc(var(--hover-rotate) + 0.8deg)) scale(var(--hover-scale));
  }
  78% {
    transform: translate3d(
        calc(var(--hover-x) - 1px),
        calc(var(--hover-y) - 1px),
        0
      )
      rotate(calc(var(--hover-rotate) - 0.65deg)) scale(var(--hover-scale));
  }
}

@property --active-breathe-y {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}

@keyframes dockCardActiveBreath {
  0%,
  100% {
    --active-breathe-y: 0px;
  }
  12.5% {
    --active-breathe-y: -1.15px;
  }
  25% {
    --active-breathe-y: -2px;
  }
  37.5% {
    --active-breathe-y: -1.15px;
  }
  50% {
    --active-breathe-y: 0px;
  }
  62.5% {
    --active-breathe-y: 1.15px;
  }
  75% {
    --active-breathe-y: 2px;
  }
  87.5% {
    --active-breathe-y: 1.15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dock-menu.expanded .dock-card.active,
  .dock-card.rippling .dock-card-ripple {
    animation: none !important;
  }
}

.dock-card-corner {
  position: absolute;
  width: 34px;
  height: 34px;
  border: 1px solid var(--dock-card-frame);
  z-index: 2;
}

.dock-card .corner-top-right {
  top: 14px;
  right: 14px;
  border-left: none;
  border-bottom: none;
  border-radius: 0 12px 0 0;
}

.dock-card .corner-bottom-left {
  bottom: 14px;
  left: 14px;
  border-top: none;
  border-right: none;
  border-radius: 0 0 0 12px;
}

.dock-card-suit,
.dock-card-order {
  position: absolute;
  z-index: 2;
}

.dock-card-suit {
  font-size: 22px;
  font-weight: 700;
  color: var(--card-accent);
}

.dock-card-order {
  top: 18px;
  right: 18px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--dock-card-order);
}

.dock-card .suit-top {
  top: 14px;
  left: 16px;
}

.dock-card .suit-bottom {
  right: 16px;
  bottom: 14px;
  transform: rotate(180deg);
}

.dock-card-face {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}

.dock-card-face--theme-selector {
  gap: 0;
  padding: 20px 16px 18px;
}

.dock-theme-inline {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
}

.dock-theme-inline__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dock-card-order);
}

.dock-theme-inline__title {
  margin-bottom: 16px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--card-ink);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.18);
}

.dock-theme-inline__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  max-height: 260px;
  padding-right: 4px;
}

.dock-theme-inline__list::-webkit-scrollbar {
  width: 4px;
}

.dock-theme-inline__list::-webkit-scrollbar-track {
  background: transparent;
}

.dock-theme-inline__list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

.dock-theme-inline__list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.dock-theme-inline-option {
  appearance: none;
  -webkit-appearance: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 11px 12px;
  font: inherit;
  border-radius: 18px;
  border: 2px solid rgba(186, 154, 98, 0.72);
  background: #ffffff;
  color: #23170c;
  text-align: left;
  box-shadow:
    0 10px 20px -16px rgba(15, 12, 10, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.54);
  cursor: pointer;
  user-select: none;
  outline: none;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}

.dock-theme-inline-option:hover,
.dock-theme-inline-option:focus-visible {
  transform: translateY(-1px);
  border-color: rgba(161, 124, 57, 0.88);
  background: #ffffff;
  box-shadow:
    0 14px 24px -20px rgba(15, 12, 10, 0.46),
    0 0 0 1px rgba(180, 139, 67, 0.2);
}

.dock-theme-inline-option.active {
  border-color: #c99a2e;
  background: #ffffff;
  box-shadow:
    0 16px 28px -20px rgba(15, 12, 10, 0.4),
    0 0 0 2px rgba(217, 176, 74, 0.38);
}

.dock-theme-inline-option.disabled {
  opacity: 0.72;
  cursor: not-allowed;
  box-shadow: none;
  background: #ffffff;
  border-color: rgba(175, 154, 118, 0.72);
  color: rgba(61, 47, 33, 0.88);
}

.dock-theme-inline-option__row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dock-theme-inline-option__icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.dock-theme-inline-option__label {
  font-size: 13px;
  font-weight: 700;
  color: inherit;
}

.dock-theme-inline-option__meta {
  font-size: 11px;
  color: rgba(69, 54, 35, 0.82);
}

.dock-card-pattern {
  position: absolute;
  inset: 28px 26px;
  border-radius: 22px;
  border: 1px solid var(--dock-card-pattern);
  background:
    radial-gradient(
      circle at center,
      transparent 0 35px,
      var(--dock-card-pattern) 35.5px,
      transparent 36.5px
    ),
    radial-gradient(
      circle at center,
      var(--dock-card-pattern) 0 2px,
      transparent 2.5px
    ),
    linear-gradient(
      0deg,
      transparent calc(50% - 1px),
      var(--dock-card-pattern) 50%,
      transparent calc(50% + 1px)
    ),
    linear-gradient(
      90deg,
      transparent calc(50% - 1px),
      var(--dock-card-pattern) 50%,
      transparent calc(50% + 1px)
    );
  opacity: 0.85;
  pointer-events: none;
}

.dock-card-icon {
  width: 88px;
  height: 88px;
  border-radius: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  color: var(--card-accent);
  background:
    radial-gradient(
      circle at 30% 30%,
      rgba(255, 255, 255, 0.65) 0%,
      rgba(255, 255, 255, 0.2) 34%,
      transparent 35%
    ),
    var(--dock-card-icon-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 8px 18px rgba(88, 61, 18, 0.12);
}

.dock-card-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.dock-card-subtitle {
  max-width: 146px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--dock-card-subtitle);
}

@media (max-width: 960px) {
  .dock-card-info {
    display: none;
  }

  .dock-theme-inline__title {
    margin-bottom: 14px;
    font-size: 18px;
  }

  .dock-theme-inline-option {
    padding: 10px 11px;
  }

  .dock-card {
    width: 186px;
    height: 262px;
  }

  .dock-card-icon {
    width: 68px;
    height: 68px;
    font-size: 36px;
  }

  .poker-mode .dock-card {
    width: 186px;
    height: 262px;
    border-radius: 24px;
  }

  .poker-mode .poker-corner {
    width: 40px;
    height: 46px;
  }

  .poker-mode .poker-corner__value {
    font-size: 22px;
  }

  .poker-mode .poker-corner__suit {
    font-size: 17px;
  }

  .poker-mode .poker-corner--tr {
    top: 8px;
    right: 8px;
  }

  .poker-mode .poker-corner--bl {
    bottom: 8px;
    left: 8px;
  }

  .poker-mode .poker-figure {
    font-size: 40px;
  }

  .poker-mode .poker-center-icon {
    width: 60px;
    height: 60px;
    font-size: 32px;
  }

  .poker-mode .poker-center-title {
    font-size: 16px;
  }
}

/* ═══════════════════════════════════════════════════
   扑克主题样式 — 仅在 .poker-mode 下激活
   ═══════════════════════════════════════════════════ */

/* 扑克模式 — 卡片外观覆盖 */
.poker-mode .dock-card {
  padding: 0;
  border-radius: 60px;
  border: 1.5px solid var(--dock-card-border);
  overflow: hidden;
  box-shadow:
    0 20px 38px rgba(8, 12, 24, 0.26),
    0 0 0 1px var(--dock-card-edge-ring),
    var(--poker-inner-shadow, inset 0 0 0 1.5px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8));
}

.poker-mode .dock-card::before {
  content: "";
  position: absolute;
  inset: 6px;
  border-radius: 55px;
  border: 1px solid var(--dock-card-frame);
  background: none;
  opacity: 0.5;
  pointer-events: none;
}

.poker-mode .dock-card::after {
  content: "";
  position: absolute;
  inset: 14px;
  border-radius: 48px;
  border: 0.5px solid var(--dock-card-pattern);
  background: none;
  mix-blend-mode: normal;
  pointer-events: none;
}

/* 扑克模式 — 隐藏经典主题元素 */
.poker-mode .dock-card-suit,
.poker-mode .dock-card-order,
.poker-mode .dock-card-corner,
.poker-mode .dock-card-pattern,
.poker-mode .dock-card-icon,
.poker-mode .dock-card-title,
.poker-mode .dock-card-subtitle {
  display: none !important;
}

/* 扑克模式 — 浅色卡片表面 */
.poker-mode.dock-light .dock-card {
  background: linear-gradient(165deg, #ffffff 0%, #f8f6f2 48%, #f0ece4 100%);
  border-color: rgba(30, 30, 30, 0.18);
}

/* 扑克模式 — 深色卡片表面 */
.poker-mode.dock-dark .dock-card {
  background: linear-gradient(165deg, #1a1a1a 0%, #222222 48%, #181818 100%);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 扑克模式 — VIP 卡片表面 */
.poker-mode.dock-vip-theme .dock-card {
  background: linear-gradient(165deg, #3d2a14 0%, #2a1e0e 48%, #1a1208 100%);
  border-color: rgba(236, 196, 112, 0.35);
}

/* ── 扑克角标 ── */
.poker-corner {
  position: absolute;
  width: 52px;
  height: 62px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 3;
  line-height: 1;
  gap: 0;
}

.poker-corner--tr {
  top: 12px;
  right: 12px;
}

.poker-corner--bl {
  bottom: 12px;
  left: 12px;
  transform: rotate(180deg);
}

.poker-corner__value {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.poker-corner__suit {
  font-size: 22px;
  line-height: 1;
}

/* 花色颜色：♠♣ 黑色，♥♦ 红色 */
.poker-mode.dock-light .poker-corner__value,
.poker-mode.dock-light .poker-corner__suit {
  color: #1a1a1a;
}

.poker-mode.dock-light .poker-corner__suit.suit-red {
  color: #c0392b;
}

.poker-mode.dock-dark .poker-corner__value,
.poker-mode.dock-dark .poker-corner__suit {
  color: #e0e0e0;
}

.poker-mode.dock-dark .poker-corner__suit.suit-red {
  color: #e74c5c;
}

.poker-mode.dock-vip-theme .poker-corner__value,
.poker-mode.dock-vip-theme .poker-corner__suit {
  color: #f0dca0;
}

.poker-mode.dock-vip-theme .poker-corner__suit.suit-red {
  color: #e8a040;
}

/* ── 扑克人物水印 (J/Q/K) ── */
.poker-figure {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 64px;
  line-height: 1;
  opacity: 0.1;
  pointer-events: none;
  z-index: 1;
}

.poker-mode.dock-light .poker-figure { color: #1a1a1a; }
.poker-mode.dock-dark .poker-figure { color: #e0e0e0; }
.poker-mode.dock-vip-theme .poker-figure { color: #f0dca0; }

/* ── 扑克中心图标 ── */
.poker-center-icon {
  position: relative;
  z-index: 2;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  background: var(--dock-card-icon-bg);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.poker-mode.dock-light .poker-center-icon {
  color: #1a1a1a;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(240, 236, 228, 0.88) 100%);
}

.poker-mode.dock-dark .poker-center-icon {
  color: #e0e0e0;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
}

.poker-mode.dock-vip-theme .poker-center-icon {
  color: #f0dca0;
  background: linear-gradient(145deg, rgba(137, 100, 37, 0.92) 0%, rgba(76, 49, 18, 0.88) 100%);
}

/* ── 扑克中心标题 ── */
.poker-center-title {
  position: relative;
  z-index: 2;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.02em;
  margin-top: 10px;
}

.poker-mode.dock-light .poker-center-title { color: #1a1a1a; }
.poker-mode.dock-dark .poker-center-title { color: #e0e0e0; }
.poker-mode.dock-vip-theme .poker-center-title { color: #f0dca0; }

/* 扑克模式 — 主题选择器卡片内联 */
.poker-mode .dock-card-face--theme-selector {
  padding: 40px 36px 52px 36px;
}

.poker-mode .dock-theme-inline {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
}

/* 扑克模式 — 激活卡片增强 */
.poker-mode .dock-menu.expanded .dock-card.drawing,
.poker-mode .dock-menu.expanded .dock-card.lifting,
.poker-mode .dock-menu.expanded .dock-card.active {
  border-width: 2px;
  border-color: var(--dock-card-active-frame, rgba(255, 255, 255, 0.18));
  box-shadow:
    0 28px 44px rgba(8, 12, 24, 0.32),
    0 0 28px -5px var(--card-accent-soft, rgba(255, 255, 255, 0.08)),
    inset 0 0 0 2px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.publish-modal-enter-active,
.publish-modal-leave-active {
  transition: opacity 0.28s ease;
}

.publish-modal-enter-active .publish-modal,
.publish-modal-leave-active .publish-modal {
  transition:
    transform 0.34s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.26s ease;
}

.publish-modal-enter-active .map-search-user-detail,
.publish-modal-leave-active .map-search-user-detail {
  transition:
    transform 0.34s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.26s ease;
}

.publish-modal-enter-from,
.publish-modal-leave-to {
  opacity: 0;
}

.publish-modal-enter-from .publish-modal,
.publish-modal-leave-to .publish-modal {
  opacity: 0;
  transform: translateY(26px) scale(0.96);
}

.publish-modal-enter-from .map-search-user-detail,
.publish-modal-leave-to .map-search-user-detail {
  opacity: 0;
  transform: translateY(26px) scale(0.96);
}

.publish-modal-shell {
  position: fixed;
  inset: 0;
  z-index: 340;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 24px;
  background:
    radial-gradient(
      circle at top,
      rgba(255, 229, 176, 0.16) 0%,
      transparent 30%
    ),
    rgba(8, 11, 19, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.publish-modal-shell.pick-mode {
  pointer-events: none;
  align-items: flex-end;
  padding: 0;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.publish-modal {
  position: relative;
  width: min(980px, calc(100vw - 48px));
  height: min(90vh, 960px);
  border-radius: 36px;
  overflow: hidden;
  border: 1px solid rgba(196, 142, 48, 0.38);
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.98) 0%,
    rgba(240, 223, 191, 0.98) 52%,
    rgba(229, 206, 166, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(7, 11, 22, 0.5),
    0 0 0 1px rgba(255, 248, 232, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
}

.publish-modal-shell.pick-mode .publish-modal {
  width: 100%;
  height: auto;
  max-height: none;
  pointer-events: none;
  overflow: visible;
  border: none;
  background: transparent;
  box-shadow: none;
}

.publish-modal::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 28px;
  border: 1px solid rgba(199, 151, 60, 0.22);
  background:
    radial-gradient(
      circle at top right,
      rgba(255, 255, 255, 0.14) 0%,
      transparent 24%
    ),
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.05) 48%,
      transparent 100%
    );
  pointer-events: none;
}

.publish-modal.collapsed::before {
  display: none;
}

.publish-modal.dark {
  border-color: rgba(141, 176, 235, 0.24);
  background: linear-gradient(
    160deg,
    rgba(15, 22, 40, 0.98) 0%,
    rgba(22, 34, 58, 0.98) 52%,
    rgba(29, 46, 78, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(3, 6, 15, 0.64),
    0 0 0 1px rgba(182, 208, 255, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.publish-modal.dark::before {
  border-color: rgba(141, 176, 235, 0.14);
}

.publish-modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
  min-width: 88px;
  height: 46px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(33, 22, 9, 0.76);
  color: #fffaf1;
  box-shadow:
    0 18px 26px -20px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.publish-modal-close:hover {
  transform: translateY(-1px);
  background: rgba(53, 34, 13, 0.92);
  border-color: rgba(255, 255, 255, 0.42);
}

.publish-modal.dark .publish-modal-close {
  background: rgba(10, 17, 33, 0.82);
  border-color: rgba(198, 219, 255, 0.22);
  color: #eef4ff;
}

.publish-modal.dark .publish-modal-close:hover {
  background: rgba(18, 30, 58, 0.94);
  border-color: rgba(198, 219, 255, 0.42);
}

.publish-modal-close .close-icon {
  line-height: 1;
  transform: translateY(-1px);
  font-size: 22px;
}

.publish-modal-close .close-text {
  font-size: 13px;
  letter-spacing: 0.08em;
}

.publish-modal-scroll {
  position: relative;
  z-index: 1;
  height: min(90vh, 960px);
  overflow-y: auto;
  padding: 28px;
}

.publish-pick-dock {
  pointer-events: auto;
  width: 100%;
  padding: 20px 32px;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.78);
  color: #ffffff;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition:
    transform 0.22s ease,
    background 0.22s ease,
    opacity 0.22s ease;
}

.publish-pick-dock:hover {
  transform: translateY(-1px);
  background: rgba(0, 0, 0, 0.84);
}

.publish-modal.dark .publish-pick-dock {
  background: rgba(0, 0, 0, 0.78);
  color: #ffffff;
}

.pick-dock-handle {
  display: none;
}

.publish-pick-dock strong {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: center;
}

.publish-pick-dock span:last-child {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
}

.publish-modal.dark .publish-pick-dock span:last-child {
  color: rgba(255, 255, 255, 0.65);
}

@media (max-width: 640px) {
  .publish-pick-dock {
    padding: 18px 24px calc(18px + env(safe-area-inset-bottom, 0px));
  }
}

.publish-pick-confirm {
  position: fixed;
  z-index: 181;
  width: 220px;
  padding: 14px 14px 12px;
  border-radius: 18px;
  border: 1px solid rgba(199, 151, 60, 0.3);
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.98) 0%,
    rgba(240, 223, 191, 0.98) 100%
  );
  box-shadow:
    0 18px 40px -24px rgba(6, 10, 20, 0.5),
    0 0 0 1px rgba(255, 248, 232, 0.32);
  pointer-events: auto;
}

.publish-pick-confirm p {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #4a3520;
}

.publish-pick-confirm-actions {
  display: flex;
  gap: 10px;
}

.publish-pick-confirm-actions button {
  flex: 1;
  height: 38px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.publish-pick-confirm-actions button:hover {
  transform: translateY(-1px);
}

.publish-pick-confirm .confirm-btn {
  color: #fff8ef;
  background: linear-gradient(135deg, #8c5c22 0%, #c68e30 100%);
  box-shadow: 0 10px 20px -14px rgba(140, 92, 34, 0.76);
}

.publish-pick-confirm .cancel-btn {
  color: #6b4d2d;
  border-color: rgba(165, 122, 44, 0.28);
  background: rgba(255, 249, 240, 0.96);
}

@media (max-width: 768px) {
  .publish-modal-shell {
    padding: 16px;
    align-items: stretch;
  }

  .publish-modal-shell.pick-mode {
    padding: 0 12px 0;
    align-items: flex-end;
  }

  .publish-modal {
    width: 100%;
    max-height: 100%;
    border-radius: 28px;
  }

  .publish-modal::before {
    inset: 10px;
    border-radius: 22px;
  }

  .publish-modal-scroll {
    max-height: 100%;
    padding: 18px 16px 20px;
  }

  .publish-modal-close {
    top: 14px;
    right: 14px;
    min-width: 46px;
    padding: 0;
  }

  .publish-modal-close .close-text {
    display: none;
  }

  .publish-modal-shell.pick-mode .publish-modal {
    width: calc(100vw - 24px);
  }

  .publish-pick-confirm {
    width: min(220px, calc(100vw - 32px));
  }
}

.user-sidebar {
  position: fixed;
  left: 50%;
  top: 50%;
  right: auto;
  bottom: auto;
  width: min(900px, calc(100vw - 48px));
  height: min(90vh, 960px);
  height: min(90vh, 960px);
  border-radius: 36px;
  border: 1px solid rgba(196, 142, 48, 0.34);
  background: linear-gradient(
    160deg,
    rgba(18, 23, 37, 0.97) 0%,
    rgba(31, 42, 64, 0.98) 56%,
    rgba(17, 25, 42, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(3, 7, 18, 0.72),
    0 0 0 1px rgba(255, 248, 232, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transform: translate(-50%, -50%) scale(0.96);
  transition:
    transform 0.34s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.26s ease,
    visibility 0.26s ease;
  z-index: 341;
  display: grid;
  grid-template-rows: auto 1fr;
  visibility: hidden;
  pointer-events: none;
  opacity: 0;
  overflow: hidden;
}

.user-sidebar.show-sidebar {
  transform: translate(-50%, -50%) scale(1);
  visibility: visible;
  pointer-events: auto;
  opacity: 1;
  box-shadow:
    0 40px 80px -32px rgba(3, 7, 18, 0.72),
    0 0 0 1px rgba(255, 248, 232, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 0 100vmax rgba(8, 11, 19, 0.46);
}

.user-sidebar::before,
.user-sidebar::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.user-sidebar::before {
  inset: 12px;
  border-radius: 28px;
  border: 1px solid rgba(199, 151, 60, 0.16);
  background:
    radial-gradient(
      circle at top right,
      rgba(255, 255, 255, 0.08) 0%,
      transparent 24%
    ),
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.03) 48%,
      transparent 100%
    );
  z-index: 0;
}

.user-sidebar::after {
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.26s ease;
  background:
    radial-gradient(
      circle at top,
      rgba(255, 229, 176, 0.12) 0%,
      transparent 30%
    ),
    rgba(8, 11, 19, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.user-sidebar.show-sidebar::after {
  opacity: 1;
}

.user-sidebar-header {
  position: relative;
  z-index: 1;
  padding: 28px 28px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 108px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

.user-sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.user-sidebar .close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
  min-width: 88px;
  height: 46px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(13, 19, 34, 0.82);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 18px 26px -20px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.user-sidebar .close-btn:hover {
  background: rgba(26, 35, 58, 0.96);
  border-color: rgba(255, 255, 255, 0.36);
}

.user-sidebar .close-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  height: 100%;
  width: 100%;
  transform: translate(-0.25px, -1.25px);
}

.user-sidebar-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  z-index: 1;
  padding: 20px 36px 28px;
  display: flex;
  flex-direction: column;
}

.guest-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
}

.guest-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.3) 0%,
    rgba(118, 75, 162, 0.3) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}

.guest-info {
  text-align: center;
}

.guest-info h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.guest-info p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.guest-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 16px;
}

.guest-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.guest-action-btn.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.guest-action-btn.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.guest-action-btn.guest-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.guest-action-btn.guest-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.guest-action-btn.logout-btn {
  background: rgba(244, 67, 54, 0.2);
  color: #ffffff;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.guest-action-btn.logout-btn:hover {
  background: rgba(244, 67, 54, 0.3);
}

.guest-action-btn .btn-icon {
  font-size: 18px;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.user-avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.user-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(102, 126, 234, 0.5);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.user-avatar-large:hover {
  border-color: rgba(102, 126, 234, 0.8);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.user-avatar-large:hover img {
  transform: scale(1.05);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-avatar-large:hover .avatar-overlay {
  opacity: 1;
}

.avatar-edit-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.avatar-edit-text {
  font-size: 12px;
  color: #ffffff;
  font-weight: 500;
}

.avatar-upload-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.upload-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.avatar-error {
  font-size: 12px;
  color: #f44336;
  padding: 4px 8px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
  text-align: center;
}

.user-info-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.info-value {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
}

.info-item.editable {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.info-item.editable .info-label {
  margin-bottom: 4px;
}

.info-value-with-edit {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.edit-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(102, 126, 234, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.edit-btn:hover {
  background: rgba(102, 126, 234, 0.4);
}

.username-edit-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.username-edit-form input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transition: all 0.2s ease;
}

.username-edit-form input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(255, 255, 255, 0.15);
}

.username-edit-form input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.username-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.username-actions button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.username-actions .save-btn {
  background: rgba(76, 175, 80, 0.3);
  color: #4caf50;
}

.username-actions .save-btn:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.5);
}

.username-actions .save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.username-actions .cancel-btn {
  background: rgba(244, 67, 54, 0.3);
  color: #f44336;
}

.username-actions .cancel-btn:hover {
  background: rgba(244, 67, 54, 0.5);
}

.username-error {
  font-size: 12px;
  color: #f44336;
  padding: 4px 8px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
}

.password-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eye-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.eye-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.password-edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.password-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.password-input-wrapper input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transition: all 0.2s ease;
}

.password-input-wrapper input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(255, 255, 255, 0.15);
}

.password-input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.eye-btn-small {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.eye-btn-small:hover {
  background: rgba(255, 255, 255, 0.2);
}

.password-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
}

.password-actions button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.password-actions .save-btn {
  background: rgba(76, 175, 80, 0.3);
  color: #4caf50;
}

.password-actions .save-btn:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.5);
}

.password-actions .save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-actions .cancel-btn {
  background: rgba(244, 67, 54, 0.3);
  color: #f44336;
}

.password-actions .cancel-btn:hover {
  background: rgba(244, 67, 54, 0.5);
}

.password-error {
  font-size: 12px;
  color: #f44336;
  padding: 4px 8px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
}

.field-error {
  font-size: 12px;
  color: #f44336;
  padding: 2px 0 0 2px;
  animation: shake 0.3s ease;
}

.password-input-wrapper input.input-error {
  border-color: rgba(244, 67, 54, 0.6);
  background: rgba(244, 67, 54, 0.08);
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.2) 0%,
    rgba(118, 75, 162, 0.2) 100%
  );
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #ffffff;
}

.user-action-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.3) 0%,
    rgba(118, 75, 162, 0.3) 100%
  );
  border-color: rgba(102, 126, 234, 0.5);
  transform: translateX(4px);
}

.user-action-btn .btn-icon {
  font-size: 20px;
}

.user-action-btn .btn-text {
  font-size: 16px;
  font-weight: 500;
}

.user-action-btn.active {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.5) 0%,
    rgba(118, 75, 162, 0.5) 100%
  );
  border-color: rgba(102, 126, 234, 0.8);
  box-shadow: 0 0 15px rgba(102, 126, 234, 0.3);
}

.logout-action-btn {
  background: linear-gradient(
    135deg,
    rgba(244, 67, 54, 0.2) 0%,
    rgba(244, 67, 54, 0.1) 100%
  ) !important;
  border-color: rgba(244, 67, 54, 0.3) !important;
}

.footprints-btn {
  background: linear-gradient(
    135deg,
    rgba(232, 184, 109, 0.2) 0%,
    rgba(240, 147, 251, 0.2) 100%
  ) !important;
  border-color: rgba(232, 184, 109, 0.3) !important;
}

.footprints-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(232, 184, 109, 0.3) 0%,
    rgba(240, 147, 251, 0.3) 100%
  ) !important;
  border-color: rgba(232, 184, 109, 0.5) !important;
}

.footprints-btn.active {
  background: linear-gradient(
    135deg,
    rgba(232, 184, 109, 0.5) 0%,
    rgba(240, 147, 251, 0.5) 100%
  ) !important;
  border-color: rgba(232, 184, 109, 0.8) !important;
  box-shadow: 0 0 15px rgba(232, 184, 109, 0.3) !important;
}

/* 定位按钮 - 右下角 */
.locate-btn {
  position: fixed;
  bottom: 100px;
  right: 15px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(102, 126, 234, 0.25);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #667eea;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 190;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.25s ease;
}

.locate-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.45);
}

.locate-btn:active {
  transform: scale(0.95);
}

.locate-btn.dark {
  background: rgba(26, 26, 46, 0.92);
  border-color: rgba(143, 180, 255, 0.2);
  color: #8fb4ff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.locate-btn.dark:hover {
  box-shadow: 0 4px 16px rgba(143, 180, 255, 0.2);
  border-color: rgba(143, 180, 255, 0.4);
}

/* ===== 调整纸飞机位置模式 - 底部提示栏 ===== */
.adjust-plane-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1100;
  padding: 0;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: none;
}

.adjust-plane-dock {
  appearance: none;
  -webkit-appearance: none;
  text-align: center;
}

.adjust-overlay-fade-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.adjust-overlay-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.adjust-overlay-fade-enter-from,
.adjust-overlay-fade-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.logout-action-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(244, 67, 54, 0.3) 0%,
    rgba(244, 67, 54, 0.2) 100%
  ) !important;
  border-color: rgba(244, 67, 54, 0.5) !important;
}

.user-sub-sidebar {
  position: fixed;
  right: 320px;
  top: 0;
  bottom: 0;
  width: 360px;
  background: linear-gradient(
    135deg,
    rgba(40, 40, 45, 0.95) 0%,
    rgba(30, 30, 35, 0.98) 100%
  );
  box-shadow: -2px 0 20px rgba(0, 0, 0, 0.4);
  transform: translateX(100%);
  transition:
    transform 0.3s ease,
    visibility 0.3s ease;
  z-index: 149;
  display: grid;
  grid-template-rows: auto 1fr;
  visibility: hidden;
  pointer-events: none;
}

.user-sub-sidebar.show-panel {
  transform: translateX(0);
  visibility: visible;
  pointer-events: auto;
}

.sub-sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
}

.sub-sidebar-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.user-sub-sidebar .close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-sub-sidebar .close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.user-sub-sidebar .close-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  height: 100%;
  width: 100%;
  transform: translate(-0.25px, -1.25px);
}

.sub-sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.user-sub-sidebar {
  left: 50%;
  top: 50%;
  right: auto;
  bottom: auto;
  width: min(760px, calc(100vw - 64px));
  max-height: min(78vh, 760px);
  border-radius: 30px;
  border: 1px solid rgba(196, 142, 48, 0.24);
  background: linear-gradient(
    160deg,
    rgba(14, 19, 31, 0.98) 0%,
    rgba(24, 32, 51, 0.98) 100%
  );
  box-shadow:
    0 28px 64px -30px rgba(3, 6, 15, 0.74),
    0 0 0 1px rgba(255, 248, 232, 0.06);
  transform: translate(-50%, -50%) scale(0.96);
  transition:
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.24s ease,
    visibility 0.24s ease;
  z-index: 342;
  opacity: 0;
  overflow: hidden;
}

.user-sub-sidebar.show-panel {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

.sub-sidebar-header {
  position: relative;
  z-index: 1;
  padding: 22px 24px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-right: 72px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

.user-sub-sidebar .close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.sub-sidebar-content {
  position: relative;
  z-index: 1;
  padding: 18px 20px 20px;
}

.panel-loading,
.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.6);
}

.panel-empty .empty-icon {
  font-size: 48px;
}

.panel-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-item {
  padding: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 3px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;
  transform: translate3d(0, 0, 0);
  will-change: transform, opacity;
}

.panel-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translate3d(0, -3px, 0);
  box-shadow: 0 18px 30px -24px rgba(0, 0, 0, 0.35);
}

/* 故事卡片入场动画 - stagger: 0.12s | duration: 0.45s | distance: 80vh */
/* animation-delay 通过模板内联 style 设置，此处不声明 */

@keyframes storyCardEntrance {
  0% {
    opacity: 0;
    transform: translate3d(0, 34px, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(0, -2px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.story-card-enter {
  animation: storyCardEntrance 0.52s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

/* 动态加载的卡片：快速淡入，无延迟等待 */
.story-wall-grid .story-card-enter.no-anim-delay {
  animation: storyCardFadeIn 0.3s ease forwards;
}

@keyframes storyCardFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.story-list :deep(.story-card.story-card-enter) {
  animation: storyCardEntrance 0.52s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

@media (prefers-reduced-motion: reduce) {
  .story-card-enter {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

.item-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-author {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.item-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  position: relative;
}

.item-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin-left: auto;
  opacity: 0.7;
}

.item-action-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.item-action-btn.unlike-btn:hover {
  background: rgba(244, 67, 54, 0.2);
}

.item-action-btn.delete-btn:hover {
  background: rgba(244, 67, 54, 0.2);
}

/* ── 时光胶囊锁定条 ── */
.panel-item.is-capsule-locked {
  cursor: not-allowed;
}
.panel-item.is-capsule-locked:hover {
  background: rgba(255, 255, 255, 0.03);
  transform: none;
}

.capsule-lock-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(160, 185, 215, 0.18) 0%, rgba(140, 170, 205, 0.12) 100%);
  border: 1px solid rgba(180, 200, 225, 0.2);
}

.capsule-lock-icon {
  color: rgba(160, 185, 215, 0.7);
  flex-shrink: 0;
  animation: capsule-lock-pulse 3s ease-in-out infinite;
}

.capsule-lock-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.8);
  letter-spacing: 0.02em;
}

.capsule-lock-timer {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.55);
  white-space: nowrap;
}

@keyframes capsule-lock-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

/* 暗色模式下的胶囊锁定条 — 侧边栏默认为暗色 */
.user-sidebar:not(.dark) .capsule-lock-strip {
  background: linear-gradient(135deg, rgba(80, 110, 160, 0.15) 0%, rgba(60, 95, 145, 0.1) 100%);
  border-color: rgba(100, 140, 200, 0.15);
}
.user-sidebar:not(.dark) .capsule-lock-icon {
  color: rgba(120, 160, 220, 0.65);
}
.user-sidebar:not(.dark) .capsule-lock-label {
  color: rgba(130, 165, 220, 0.8);
}
.user-sidebar:not(.dark) .capsule-lock-timer {
  color: rgba(130, 165, 220, 0.5);
}

.item-content {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin: 0 0 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-images {
  margin-bottom: 10px;
}

.item-images img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.item-location {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-likes {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-content-list .item-footer {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
}

.user-content-list .item-likes {
  white-space: nowrap;
}

.likes-panel .item-likes + .item-likes,
.posts-panel .item-likes + .item-likes,
.favorites-panel .item-likes + .item-likes {
  margin-left: 10px;
}

.likes-panel .item-action-btn span,
.favorites-panel .item-action-btn span {
  font-size: 0;
  line-height: 0;
}

.likes-panel .item-action-btn span::before {
  font-size: 18px;
  line-height: 1;
}

.favorites-panel .item-action-btn span::before {
  font-size: 18px;
  line-height: 1;
}

.likes-panel .unlike-btn span::before {
  content: "❌";
}

.favorites-panel .unfavorite-btn span::before {
  content: "⭐";
}

.favorites-panel .unfavorite-btn.is-restorable span::before {
  content: "✨";
}

.panel-loading-more,
.panel-no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.story-tarot-shell {
  --story-tarot-surface: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.98) 0%,
    rgba(240, 223, 191, 0.98) 54%,
    rgba(229, 201, 150, 0.98) 100%
  );
  --story-tarot-border: rgba(196, 142, 48, 0.42);
  --story-tarot-frame: rgba(188, 141, 52, 0.34);
  --story-tarot-pattern: rgba(151, 101, 34, 0.16);
  --story-tarot-panel: rgba(255, 250, 241, 0.68);
  --story-tarot-panel-strong: rgba(255, 252, 246, 0.84);
  --story-tarot-text: #3c2910;
  --story-tarot-muted: rgba(72, 48, 17, 0.7);
  --story-tarot-accent: #8b561d;
  --story-tarot-accent-soft: rgba(159, 105, 34, 0.14);
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  background:
    radial-gradient(
      circle at top,
      rgba(255, 226, 170, 0.26) 0%,
      transparent 30%
    ),
    rgba(10, 13, 22, 0.62);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  z-index: 341;
}

.story-tarot-shell.dark {
  --story-tarot-surface: linear-gradient(
    160deg,
    rgba(14, 23, 41, 0.98) 0%,
    rgba(24, 35, 59, 0.98) 54%,
    rgba(33, 50, 84, 0.98) 100%
  );
  --story-tarot-border: rgba(141, 176, 235, 0.28);
  --story-tarot-frame: rgba(141, 176, 235, 0.18);
  --story-tarot-pattern: rgba(141, 176, 235, 0.14);
  --story-tarot-panel: rgba(255, 255, 255, 0.07);
  --story-tarot-panel-strong: rgba(255, 255, 255, 0.1);
  --story-tarot-text: #eef4ff;
  --story-tarot-muted: rgba(219, 229, 255, 0.72);
  --story-tarot-accent: #b8d1ff;
  --story-tarot-accent-soft: rgba(131, 176, 255, 0.16);
}

.story-tarot-stage {
  position: relative;
  width: min(760px, calc(100vw - 40px));
  max-height: calc(100vh - 56px);
}

.story-tarot-card {
  position: relative;
  max-height: calc(100vh - 56px);
  padding: 28px;
  border-radius: 34px;
  border: 1px solid var(--story-tarot-border);
  background: var(--story-tarot-surface);
  box-shadow:
    0 40px 88px -36px rgba(4, 8, 18, 0.72),
    0 0 0 1px rgba(255, 255, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  color: var(--story-tarot-text);
  overflow: hidden;
}

.story-tarot-card::before,
.story-tarot-card::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.story-tarot-card::before {
  inset: 14px;
  border-radius: 26px;
  border: 1px solid var(--story-tarot-frame);
  background:
    radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.16) 0 18%,
      transparent 18.5%
    ),
    radial-gradient(
      circle at center,
      transparent 0 40%,
      var(--story-tarot-pattern) 40.5%,
      transparent 41.5%
    ),
    linear-gradient(
      0deg,
      transparent calc(50% - 1px),
      var(--story-tarot-pattern) 50%,
      transparent calc(50% + 1px)
    ),
    linear-gradient(
      90deg,
      transparent calc(50% - 1px),
      var(--story-tarot-pattern) 50%,
      transparent calc(50% + 1px)
    );
  opacity: 0.72;
}

.story-tarot-card::after {
  inset: 26px;
  border-radius: 24px;
  background:
    radial-gradient(
      circle at top center,
      rgba(255, 255, 255, 0.24) 0%,
      transparent 24%
    ),
    repeating-linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.04) 0 6px,
      rgba(255, 255, 255, 0) 6px 12px
    );
  mix-blend-mode: soft-light;
}

.story-tarot-scroll {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 18px;
  max-height: calc(100vh - 112px);
  padding-right: 8px;
  overflow-y: auto;
}

.story-tarot-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 3;
  height: 46px;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(10, 17, 33, 0.8);
  color: #eef4ff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.story-tarot-close:hover {
  transform: translateY(-2px);
  background: rgba(16, 28, 52, 0.94);
  border-color: rgba(255, 255, 255, 0.4);
}

.story-tarot-shell:not(.dark) .story-tarot-close {
  background: rgba(53, 34, 13, 0.84);
  color: #fff8ee;
}

.story-tarot-shell:not(.dark) .story-tarot-close:hover {
  background: rgba(76, 49, 17, 0.96);
}

.story-tarot-close .close-icon {
  font-size: 22px;
  line-height: 1;
}

.story-tarot-close .close-text {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.story-tarot-suit {
  position: absolute;
  z-index: 1;
  font-size: 28px;
  font-weight: 700;
  color: var(--story-tarot-accent);
  opacity: 0.88;
}

.story-tarot-suit.suit-top {
  top: 22px;
  left: 26px;
}

.story-tarot-suit.suit-bottom {
  right: 26px;
  bottom: 22px;
  transform: rotate(180deg);
}

.story-tarot-corner {
  position: absolute;
  width: 38px;
  height: 38px;
  z-index: 1;
  border: 1px solid var(--story-tarot-frame);
  opacity: 0.74;
}

.story-tarot-corner.corner-top-right {
  top: 22px;
  right: 26px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 16px;
}

.story-tarot-corner.corner-bottom-left {
  left: 26px;
  bottom: 22px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 16px;
}

.story-tarot-headline {
  text-align: center;
  padding-top: 10px;
}

.story-tarot-kicker {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--story-tarot-accent);
}

.story-tarot-headline h3 {
  margin: 0;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.1;
}

.story-tarot-location {
  margin: 10px 0 0 0;
  font-size: 14px;
  color: var(--story-tarot-muted);
}

.story-tarot-author,
.story-tarot-panel,
.story-tarot-content-block {
  position: relative;
  border-radius: 24px;
  border: 1px solid var(--story-tarot-frame);
  background: var(--story-tarot-panel);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.story-tarot-author {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 16px 18px;
}

.story-tarot-avatar,
.story-tarot-comment-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.52) 0%,
    var(--story-tarot-accent-soft) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.26);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--story-tarot-accent);
}

.story-tarot-avatar img,
.story-tarot-comment-avatar img,
.story-tarot-hero img,
.story-tarot-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-tarot-author-meta {
  display: grid;
  gap: 4px;
}

.story-tarot-author-meta strong {
  font-size: 16px;
}

.story-tarot-author-meta span {
  font-size: 13px;
  color: var(--story-tarot-muted);
}

.story-tarot-emotion {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  border: 1px solid var(--story-tarot-frame);
  background: var(--story-tarot-panel-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.story-tarot-hero {
  position: relative;
  min-height: 260px;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid var(--story-tarot-frame);
  background:
    radial-gradient(
      circle at top,
      rgba(255, 255, 255, 0.18) 0%,
      transparent 24%
    ),
    linear-gradient(135deg, var(--story-tarot-accent-soft) 0%, transparent 100%);
}

.story-tarot-hero.has-image img {
  display: block;
  cursor: pointer;
}

.story-tarot-oracle {
  min-height: 260px;
  display: grid;
  place-content: center;
  gap: 10px;
  padding: 28px;
  text-align: center;
}

.story-tarot-oracle strong {
  font-size: 30px;
  font-family: "Georgia", "Times New Roman", serif;
}

.story-tarot-oracle span:last-child {
  font-size: 14px;
  color: var(--story-tarot-muted);
}

.story-tarot-oracle-icon {
  font-size: 44px;
}

.story-tarot-badges {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.story-tarot-badge {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.story-tarot-badge.pinned {
  background: rgba(27, 36, 58, 0.7);
  color: #eef4ff;
}

.story-tarot-badge.featured {
  background: rgba(120, 72, 19, 0.78);
  color: #fff5e7;
}

.story-tarot-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 10px;
}

.story-tarot-thumb {
  height: 92px;
  padding: 0;
  border: 1px solid var(--story-tarot-frame);
  border-radius: 18px;
  overflow: hidden;
  background: transparent;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.story-tarot-thumb:hover {
  transform: translateY(-2px);
  border-color: var(--story-tarot-accent);
  box-shadow: 0 16px 26px -22px rgba(0, 0, 0, 0.45);
}

.story-tarot-content-block {
  padding: 18px 20px;
}

.story-tarot-content {
  margin: 0;
  font-size: 16px;
  line-height: 1.9;
  white-space: pre-wrap;
  word-break: break-word;
}

.story-tarot-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.story-tarot-stat {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--story-tarot-frame);
  background: var(--story-tarot-panel);
  font-size: 13px;
  font-weight: 700;
  color: var(--story-tarot-muted);
}

.story-tarot-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.story-tarot-action {
  min-height: 70px;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid var(--story-tarot-frame);
  background: var(--story-tarot-panel);
  color: var(--story-tarot-text);
  display: grid;
  gap: 4px;
  justify-items: start;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.story-tarot-action:hover {
  transform: translateY(-2px);
  border-color: var(--story-tarot-accent);
  box-shadow: 0 18px 28px -24px rgba(0, 0, 0, 0.4);
}

.story-tarot-action span {
  font-size: 13px;
  color: var(--story-tarot-muted);
}

.story-tarot-action strong {
  font-size: 20px;
  line-height: 1;
}

.story-tarot-action.active,
.story-tarot-action.liked {
  border-color: var(--story-tarot-accent);
  background: var(--story-tarot-panel-strong);
  box-shadow:
    0 0 0 2px var(--story-tarot-accent-soft),
    0 20px 30px -24px rgba(0, 0, 0, 0.42);
}

.story-tarot-action.pending {
  opacity: 0.7;
  cursor: progress;
}

.story-tarot-panel {
  padding: 18px;
}

.story-tarot-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.story-tarot-section-head span,
.story-tarot-section-head strong {
  font-size: 14px;
  font-weight: 700;
}

.story-tarot-link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--story-tarot-accent);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.story-tarot-textarea {
  width: 100%;
  resize: vertical;
  min-height: 110px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--story-tarot-frame);
  background: var(--story-tarot-panel-strong);
  color: var(--story-tarot-text);
  font-size: 14px;
  line-height: 1.7;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.story-tarot-textarea:focus {
  border-color: var(--story-tarot-accent);
  box-shadow: 0 0 0 3px var(--story-tarot-accent-soft);
}

.story-tarot-panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.story-tarot-secondary,
.story-tarot-primary {
  min-width: 112px;
  height: 42px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.story-tarot-secondary {
  border-color: var(--story-tarot-frame);
  background: transparent;
  color: var(--story-tarot-muted);
}

.story-tarot-primary {
  background: linear-gradient(
    135deg,
    rgba(108, 67, 20, 0.96) 0%,
    rgba(144, 92, 28, 0.96) 100%
  );
  color: #fff7ea;
  box-shadow: 0 20px 30px -24px rgba(77, 45, 11, 0.7);
}

.story-tarot-shell.dark .story-tarot-primary {
  background: linear-gradient(
    135deg,
    rgba(110, 149, 218, 0.9) 0%,
    rgba(82, 122, 200, 0.92) 100%
  );
  color: #08111f;
  box-shadow: 0 20px 30px -24px rgba(10, 17, 33, 0.7);
}

.story-tarot-primary:disabled,
.story-tarot-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.story-tarot-empty,
.story-tarot-error {
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--story-tarot-panel-strong);
  font-size: 14px;
  line-height: 1.7;
}

.story-tarot-empty {
  color: var(--story-tarot-muted);
}

.story-tarot-error {
  margin: 14px 0 0;
  color: #b3342b;
}

.story-tarot-shell.dark .story-tarot-error {
  color: #ff9d94;
}

.story-tarot-comment-list {
  display: grid;
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

.story-tarot-comment {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid var(--story-tarot-frame);
  background: var(--story-tarot-panel-strong);
}

.story-tarot-comment-avatar {
  width: 42px;
  height: 42px;
  font-size: 14px;
}

.story-tarot-comment-body {
  display: grid;
  gap: 6px;
}

.story-tarot-comment-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.story-tarot-comment-head strong {
  font-size: 14px;
}

.story-tarot-comment-head span {
  font-size: 12px;
  color: var(--story-tarot-muted);
}

.story-tarot-comment-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.story-tarot-report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.story-tarot-report-option {
  position: relative;
}

.story-tarot-report-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.story-tarot-report-option span {
  display: block;
  min-height: 52px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid var(--story-tarot-frame);
  background: var(--story-tarot-panel-strong);
  font-size: 13px;
  line-height: 1.45;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.story-tarot-report-option span:hover {
  transform: translateY(-1px);
}

.story-tarot-report-option input:checked + span {
  border-color: var(--story-tarot-accent);
  box-shadow: 0 0 0 2px var(--story-tarot-accent-soft);
}

.story-modal-shell,
.user-modal-shell {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 24px;
  background:
    radial-gradient(
      circle at top,
      rgba(255, 229, 176, 0.16) 0%,
      transparent 30%
    ),
    rgba(8, 11, 19, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.story-modal-shell {
  z-index: 338;
}

.user-modal-shell {
  z-index: 339;
}

.publish-modal-enter-active .story-sidebar,
.publish-modal-leave-active .story-sidebar,
.publish-modal-enter-active .user-sidebar,
.publish-modal-leave-active .user-sidebar,
.publish-modal-enter-active .story-tarot-stage,
.publish-modal-leave-active .story-tarot-stage {
  transition:
    transform 0.34s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.26s ease;
}

.publish-modal-enter-from .story-sidebar,
.publish-modal-leave-to .story-sidebar,
.publish-modal-enter-from .user-sidebar,
.publish-modal-leave-to .user-sidebar,
.publish-modal-enter-from .story-tarot-stage,
.publish-modal-leave-to .story-tarot-stage {
  transform: translate(-50%, -47%) scale(0.94);
  opacity: 0;
}

.publish-modal-enter-from .story-tarot-stage,
.publish-modal-leave-to .story-tarot-stage {
  transform: translateY(24px) scale(0.94) rotate(-0.8deg);
}

.story-sidebar::after,
.user-sidebar::after {
  display: none;
}

.story-sidebar.show-sidebar,
.user-sidebar.show-sidebar {
  box-shadow:
    0 40px 80px -32px rgba(7, 11, 22, 0.5),
    0 0 0 1px rgba(255, 248, 232, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
}

.story-sidebar:not(.dark),
.user-sidebar:not(.dark),
.user-sub-sidebar:not(.dark) {
  border-color: rgba(196, 142, 48, 0.38);
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.98) 0%,
    rgba(240, 223, 191, 0.98) 52%,
    rgba(229, 206, 166, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(7, 11, 22, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.66);
  color: #3c2910;
}

.story-sidebar.dark,
.user-sidebar.dark,
.user-sub-sidebar.dark {
  border-color: rgba(141, 176, 235, 0.24);
  background: linear-gradient(
    160deg,
    rgba(15, 22, 40, 0.98) 0%,
    rgba(22, 34, 58, 0.98) 52%,
    rgba(29, 46, 78, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(3, 6, 15, 0.64),
    0 0 0 1px rgba(182, 208, 255, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  color: #eef4ff;
}

.story-sidebar:not(.dark)::before,
.user-sidebar:not(.dark)::before,
.user-sub-sidebar:not(.dark)::before {
  border-color: rgba(199, 151, 60, 0.22);
  background:
    radial-gradient(
      circle at top right,
      rgba(255, 255, 255, 0.14) 0%,
      transparent 24%
    ),
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.05) 48%,
      transparent 100%
    );
}

.story-sidebar.dark::before,
.user-sidebar.dark::before,
.user-sub-sidebar.dark::before {
  border-color: rgba(141, 176, 235, 0.14);
  background:
    radial-gradient(
      circle at top right,
      rgba(255, 255, 255, 0.08) 0%,
      transparent 24%
    ),
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.03) 48%,
      transparent 100%
    );
}

.story-sidebar:not(.dark) .sidebar-header,
.user-sidebar:not(.dark) .user-sidebar-header,
.user-sub-sidebar:not(.dark) .sub-sidebar-header {
  border-bottom-color: rgba(148, 111, 46, 0.18);
  background: linear-gradient(
    180deg,
    rgba(255, 252, 245, 0.42) 0%,
    rgba(255, 245, 227, 0.14) 100%
  );
}

.story-sidebar.dark .sidebar-header,
.user-sidebar.dark .user-sidebar-header,
.user-sub-sidebar.dark .sub-sidebar-header {
  border-bottom-color: rgba(198, 219, 255, 0.12);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

.story-sidebar:not(.dark) .sidebar-header h3,
.user-sidebar:not(.dark) .user-sidebar-header h3,
.user-sub-sidebar:not(.dark) .sub-sidebar-header h4,
.story-sidebar:not(.dark) .loading,
.story-sidebar:not(.dark) .empty,
.story-sidebar:not(.dark) .empty .hint,
.story-sidebar:not(.dark) .featured-text,
.story-sidebar:not(.dark) .featured-meta,
.story-sidebar:not(.dark) .featured-author-name,
.story-sidebar:not(.dark) .ann-title,
.story-sidebar:not(.dark) .ann-content,
.story-sidebar:not(.dark) .ann-time,
.story-sidebar:not(.dark) .ann-header,
.user-sidebar:not(.dark) .guest-info h4,
.user-sidebar:not(.dark) .guest-info p,
.user-sidebar:not(.dark) .info-label,
.user-sidebar:not(.dark) .info-value,
.user-sidebar:not(.dark) .avatar-upload-status,
.user-sidebar:not(.dark) .avatar-edit-text,
.user-sub-sidebar:not(.dark) .panel-loading,
.user-sub-sidebar:not(.dark) .panel-empty,
.user-sub-sidebar:not(.dark) .panel-loading-more,
.user-sub-sidebar:not(.dark) .panel-no-more,
.user-sub-sidebar:not(.dark) .item-content,
.user-sub-sidebar:not(.dark) .item-footer,
.user-sub-sidebar:not(.dark) .item-author,
.user-sub-sidebar:not(.dark) .item-time {
  color: #3c2910;
}

/* 浅色模式下内容列表的卡片样式 */
.user-sidebar:not(.dark) .user-content-list .panel-item {
  border-color: rgba(164, 122, 48, 0.38);
}

.user-sidebar:not(.dark) .user-content-list .item-author {
  color: #333;
}

.user-sidebar:not(.dark) .user-content-list /* ── 时光胶囊锁定条 ── */
.panel-item.is-capsule-locked {
  cursor: not-allowed;
}
.panel-item.is-capsule-locked:hover {
  background: rgba(255, 255, 255, 0.03);
  transform: none;
}

.capsule-lock-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(160, 185, 215, 0.18) 0%, rgba(140, 170, 205, 0.12) 100%);
  border: 1px solid rgba(180, 200, 225, 0.2);
}

.capsule-lock-icon {
  color: rgba(160, 185, 215, 0.7);
  flex-shrink: 0;
  animation: capsule-lock-pulse 3s ease-in-out infinite;
}

.capsule-lock-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.8);
  letter-spacing: 0.02em;
}

.capsule-lock-timer {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.55);
  white-space: nowrap;
}

@keyframes capsule-lock-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

/* 暗色模式下的胶囊锁定条 — 侧边栏默认为暗色 */
.user-sidebar:not(.dark) .capsule-lock-strip {
  background: linear-gradient(135deg, rgba(80, 110, 160, 0.15) 0%, rgba(60, 95, 145, 0.1) 100%);
  border-color: rgba(100, 140, 200, 0.15);
}
.user-sidebar:not(.dark) .capsule-lock-icon {
  color: rgba(120, 160, 220, 0.65);
}
.user-sidebar:not(.dark) .capsule-lock-label {
  color: rgba(130, 165, 220, 0.8);
}
.user-sidebar:not(.dark) .capsule-lock-timer {
  color: rgba(130, 165, 220, 0.5);
}

.item-content {
  color: #2c2c2c;
}

.user-sidebar:not(.dark) .user-content-list .item-time {
  color: #888;
}

.user-sidebar:not(.dark) .user-content-list .item-footer {
  color: #666;
}

.user-sidebar {
  --profile-story-card-bg: rgba(24, 34, 56, 0.92);
  --profile-story-card-bg-hover: rgba(31, 45, 73, 0.98);
  --profile-story-card-border: rgba(151, 186, 255, 0.3);
  --profile-story-card-border-hover: rgba(191, 214, 255, 0.52);
  --profile-story-card-shadow: 0 24px 40px -30px rgba(3, 8, 20, 0.85);
  --profile-story-card-shadow-hover: 0 26px 42px -28px rgba(3, 8, 20, 0.92);
  --profile-story-card-text: #ffffff;
  --profile-story-card-muted: rgba(255, 255, 255, 0.84);
}

.user-sidebar:not(.dark) {
  --profile-story-card-bg: rgba(255, 245, 229, 0.96);
  --profile-story-card-bg-hover: rgba(255, 239, 215, 0.99);
  --profile-story-card-border: rgba(94, 66, 22, 0.28);
  --profile-story-card-border-hover: rgba(94, 66, 22, 0.42);
  --profile-story-card-shadow: 0 24px 40px -30px rgba(94, 66, 22, 0.28);
  --profile-story-card-shadow-hover: 0 26px 42px -28px rgba(94, 66, 22, 0.34);
  --profile-story-card-text: #000000;
  --profile-story-card-muted: rgba(0, 0, 0, 0.82);
}

.user-sidebar .user-content-list .panel-item {
  background: var(--profile-story-card-bg);
  border: 1.5px solid var(--profile-story-card-border);
  box-shadow: var(--profile-story-card-shadow);
}

.user-sidebar .user-content-list .panel-item:hover {
  background: var(--profile-story-card-bg-hover);
  border-color: var(--profile-story-card-border-hover);
  box-shadow: var(--profile-story-card-shadow-hover);
}

.user-sidebar .user-content-list .panel-item.is-capsule-locked:hover {
  background: var(--profile-story-card-bg);
}

.user-sidebar .user-content-list .item-author,
.user-sidebar .user-content-list .item-content {
  color: var(--profile-story-card-text);
}

.user-sidebar .user-content-list .item-time,
.user-sidebar .user-content-list .item-footer,
.user-sidebar .user-content-list .item-likes {
  color: var(--profile-story-card-muted);
}

.user-sidebar .user-content-list .item-action-btn {
  color: var(--profile-story-card-text);
}

.story-sidebar.dark .sidebar-header h3,
.user-sidebar.dark .user-sidebar-header h3,
.user-sub-sidebar.dark .sub-sidebar-header h4,
.story-sidebar.dark .loading,
.story-sidebar.dark .empty,
.story-sidebar.dark .empty .hint,
.story-sidebar.dark .featured-text,
.story-sidebar.dark .featured-meta,
.story-sidebar.dark .featured-author-name,
.story-sidebar.dark .ann-title,
.story-sidebar.dark .ann-content,
.story-sidebar.dark .ann-time,
.story-sidebar.dark .ann-header,
.user-sidebar.dark .guest-info h4,
.user-sidebar.dark .guest-info p,
.user-sidebar.dark .info-label,
.user-sidebar.dark .info-value,
.user-sidebar.dark .avatar-upload-status,
.user-sidebar.dark .avatar-edit-text,
.user-sub-sidebar.dark .panel-loading,
.user-sub-sidebar.dark .panel-empty,
.user-sub-sidebar.dark .panel-loading-more,
.user-sub-sidebar.dark .panel-no-more,
.user-sub-sidebar.dark .item-content,
.user-sub-sidebar.dark .item-footer,
.user-sub-sidebar.dark .item-author,
.user-sub-sidebar.dark .item-time {
  color: #eef4ff;
}

.story-sidebar:not(.dark) .tab-btn {
  border-color: rgba(196, 142, 48, 0.18);
  background: rgba(255, 250, 241, 0.42);
  color: rgba(73, 46, 12, 0.82);
}

.story-sidebar:not(.dark) .tab-btn:hover {
  background: rgba(255, 246, 228, 0.88);
  color: #4b3010;
}

.story-sidebar:not(.dark) .tab-btn.active {
  border-color: rgba(120, 83, 29, 0.28);
  background: rgba(63, 40, 11, 0.88);
  color: #fffaf1;
  box-shadow: 0 18px 26px -20px rgba(0, 0, 0, 0.32);
}

.story-sidebar.dark .tab-btn {
  border-color: rgba(198, 219, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(238, 244, 255, 0.78);
}

.story-sidebar.dark .tab-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #eef4ff;
}

.story-sidebar.dark .tab-btn.active {
  border-color: rgba(198, 219, 255, 0.22);
  background: rgba(10, 17, 33, 0.82);
  color: #eef4ff;
  box-shadow: 0 18px 26px -20px rgba(0, 0, 0, 0.4);
}

.story-sidebar:not(.dark) .nearby-search-panel {
  border-color: rgba(196, 142, 48, 0.2);
  background: linear-gradient(
    180deg,
    rgba(255, 252, 246, 0.94) 0%,
    rgba(248, 238, 217, 0.84) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.56),
    0 18px 30px -26px rgba(66, 42, 15, 0.2);
}

.story-sidebar:not(.dark) .nearby-search-panel__kicker,
.story-sidebar:not(.dark) .nearby-search-panel__text-btn {
  color: #8b561d;
}

.story-sidebar:not(.dark) .nearby-search-panel__summary,
.story-sidebar:not(.dark) .nearby-search-panel__tip,
.story-sidebar:not(.dark) .nearby-search-panel__feedback,
.story-sidebar:not(.dark) .nearby-search-panel__result-copy span,
.story-sidebar:not(.dark) .nearby-search-panel__result-meta {
  color: rgba(75, 48, 16, 0.78);
}

.story-sidebar:not(.dark) .nearby-search-panel__heading h3,
.story-sidebar:not(.dark) .nearby-search-panel__result-copy strong {
  color: #3c2910;
}

.story-sidebar:not(.dark) .nearby-search-panel__input {
  border-color: rgba(196, 142, 48, 0.18);
  background: rgba(255, 252, 246, 0.95);
  color: #3c2910;
}

.story-sidebar:not(.dark) .nearby-search-panel__input::placeholder {
  color: rgba(97, 67, 24, 0.5);
}

.story-sidebar:not(.dark) .nearby-search-panel__input:focus {
  border-color: rgba(139, 86, 29, 0.42);
  box-shadow: 0 0 0 4px rgba(159, 105, 34, 0.12);
}

.story-sidebar:not(.dark) .nearby-search-panel__submit {
  background: linear-gradient(
    135deg,
    rgba(118, 72, 20, 0.96) 0%,
    rgba(168, 108, 31, 0.96) 100%
  );
  color: #fff8ef;
  box-shadow: 0 18px 28px -22px rgba(77, 45, 11, 0.52);
}

.story-sidebar:not(.dark) .nearby-search-panel__ghost-btn {
  border-color: rgba(153, 107, 36, 0.26);
  background: rgba(255, 251, 244, 0.88);
  color: #5c3a13;
}

.story-sidebar:not(.dark) .nearby-search-panel__result {
  border-color: rgba(196, 142, 48, 0.14);
  background: rgba(255, 251, 244, 0.78);
}

.story-sidebar:not(.dark) .nearby-search-panel__result:hover {
  border-color: rgba(139, 86, 29, 0.3);
  box-shadow: 0 18px 28px -24px rgba(66, 42, 15, 0.24);
}

.story-sidebar:not(.dark) .nearby-search-panel__feedback--error {
  color: #b3342b;
}

.story-sidebar.dark .nearby-search-panel {
  border-color: rgba(198, 219, 255, 0.16);
  background: linear-gradient(
    180deg,
    rgba(16, 24, 41, 0.94) 0%,
    rgba(19, 32, 57, 0.88) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 18px 30px -26px rgba(0, 0, 0, 0.4);
}

.story-sidebar.dark .nearby-search-panel__kicker,
.story-sidebar.dark .nearby-search-panel__text-btn {
  color: #b9d7ff;
}

.story-sidebar.dark .nearby-search-panel__summary,
.story-sidebar.dark .nearby-search-panel__tip,
.story-sidebar.dark .nearby-search-panel__feedback,
.story-sidebar.dark .nearby-search-panel__result-copy span,
.story-sidebar.dark .nearby-search-panel__result-meta {
  color: rgba(226, 236, 255, 0.74);
}

.story-sidebar.dark .nearby-search-panel__heading h3,
.story-sidebar.dark .nearby-search-panel__result-copy strong {
  color: #eef4ff;
}

.story-sidebar.dark .nearby-search-panel__input {
  border-color: rgba(198, 219, 255, 0.14);
  background: rgba(8, 14, 28, 0.78);
  color: #eef4ff;
}

.story-sidebar.dark .nearby-search-panel__input::placeholder {
  color: rgba(226, 236, 255, 0.42);
}

.story-sidebar.dark .nearby-search-panel__input:focus {
  border-color: rgba(150, 190, 255, 0.36);
  box-shadow: 0 0 0 4px rgba(87, 135, 212, 0.14);
}

.story-sidebar.dark .nearby-search-panel__submit {
  background: linear-gradient(
    135deg,
    rgba(59, 96, 162, 0.94) 0%,
    rgba(84, 139, 222, 0.94) 100%
  );
  color: #eef4ff;
  box-shadow: 0 18px 28px -22px rgba(6, 12, 28, 0.56);
}

.story-sidebar.dark .nearby-search-panel__ghost-btn {
  border-color: rgba(198, 219, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: #eef4ff;
}

.story-sidebar.dark .nearby-search-panel__result {
  border-color: rgba(198, 219, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.story-sidebar.dark .nearby-search-panel__result:hover {
  border-color: rgba(150, 190, 255, 0.28);
  box-shadow: 0 18px 28px -24px rgba(0, 0, 0, 0.36);
}

.story-sidebar.dark .nearby-search-panel__feedback--error {
  color: #ff9d8f;
}

.story-sidebar:not(.dark) .close-btn,
.user-sidebar:not(.dark) .close-btn,
.user-sub-sidebar:not(.dark) .close-btn {
  border-color: rgba(255, 255, 255, 0.26);
  background: rgba(33, 22, 9, 0.76);
  color: #fffaf1;
  box-shadow:
    0 18px 26px -20px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

.story-sidebar:not(.dark) .close-btn:hover,
.user-sidebar:not(.dark) .close-btn:hover,
.user-sub-sidebar:not(.dark) .close-btn:hover {
  background: rgba(53, 34, 13, 0.92);
  border-color: rgba(255, 255, 255, 0.42);
}

.story-sidebar.dark .close-btn,
.user-sidebar.dark .close-btn,
.user-sub-sidebar.dark .close-btn {
  border-color: rgba(198, 219, 255, 0.22);
  background: rgba(10, 17, 33, 0.82);
  color: #eef4ff;
  box-shadow:
    0 18px 26px -20px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.story-sidebar.dark .close-btn:hover,
.user-sidebar.dark .close-btn:hover,
.user-sub-sidebar.dark .close-btn:hover {
  background: rgba(18, 30, 58, 0.94);
  border-color: rgba(198, 219, 255, 0.42);
}

.story-sidebar:not(.dark) .featured-story-card,
.story-sidebar:not(.dark) .announcement-card,
.user-sidebar:not(.dark) .info-item,
.user-sidebar:not(.dark) .guest-action-btn.guest-btn,
.user-sidebar:not(.dark) .guest-action-btn.logout-btn,
.user-sub-sidebar:not(.dark) .panel-item {
  border-color: rgba(164, 122, 48, 0.16);
  background: rgba(255, 252, 246, 0.34);
  box-shadow: 0 18px 26px -22px rgba(98, 75, 34, 0.18);
}

.story-sidebar:not(.dark) .featured-story-card:hover {
  background: rgba(255, 250, 242, 0.52);
}

.story-sidebar.dark .featured-story-card,
.story-sidebar.dark .announcement-card,
.user-sidebar.dark .info-item,
.user-sidebar.dark .guest-action-btn.guest-btn,
.user-sidebar.dark .guest-action-btn.logout-btn,
.user-sub-sidebar.dark .panel-item {
  border-color: rgba(182, 208, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 18px 26px -22px rgba(3, 6, 15, 0.3);
}

.story-sidebar.dark .featured-story-card:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-sidebar:not(.dark) .username-edit-form input,
.user-sidebar:not(.dark) .password-input-wrapper input {
  background: rgba(255, 253, 248, 0.74);
  border-color: rgba(164, 122, 48, 0.18);
  color: #3c2910;
}

.user-sidebar:not(.dark) .username-edit-form input::placeholder,
.user-sidebar:not(.dark) .password-input-wrapper input::placeholder {
  color: rgba(94, 63, 20, 0.5);
}

.user-sidebar:not(.dark) .password-input-wrapper input.input-error {
  border-color: rgba(180, 60, 40, 0.6);
  background: rgba(244, 180, 160, 0.15);
}

.user-sidebar:not(.dark) .field-error {
  color: #b33c2c;
}

.user-sidebar:not(.dark) .edit-btn,
.user-sidebar:not(.dark) .eye-btn,
.user-sidebar:not(.dark) .eye-btn-small,
.user-sidebar:not(.dark) .cancel-btn {
  background: rgba(255, 252, 246, 0.56);
  border-color: rgba(164, 122, 48, 0.16);
  color: #5e3f14;
}

.user-sidebar.dark .username-edit-form input,
.user-sidebar.dark .password-input-wrapper input {
  background: rgba(8, 14, 28, 0.52);
  border-color: rgba(182, 208, 255, 0.14);
  color: #eef4ff;
}

.user-sidebar.dark .edit-btn,
.user-sidebar.dark .eye-btn,
.user-sidebar.dark .eye-btn-small,
.user-sidebar.dark .cancel-btn {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(182, 208, 255, 0.12);
  color: #eef4ff;
}

.user-sidebar:not(.dark) .save-btn {
  box-shadow: 0 18px 30px -22px rgba(111, 82, 28, 0.46);
}

@media (max-width: 768px) {
  .story-modal-shell,
  .user-modal-shell,
  .story-tarot-shell {
    padding: 12px;
  }

  .story-sidebar,
  .user-sidebar,
  .story-tarot-stage,
  .user-sub-sidebar {
    width: calc(100vw - 24px);
    height: calc(100vh - 24px);
    border-radius: 28px;
  }

  .story-tarot-card {
    max-height: calc(100vh - 24px);
    padding: 20px;
    border-radius: 28px;
  }

  .story-tarot-scroll {
    max-height: calc(100vh - 88px);
    padding-right: 2px;
  }

  .story-tarot-actions {
    grid-template-columns: 1fr;
  }

  .story-tarot-author {
    grid-template-columns: auto 1fr;
  }

  .story-tarot-emotion {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .story-tarot-close {
    top: 12px;
    right: 12px;
    height: 42px;
    padding: 0 12px;
  }

  .sidebar-header,
  .user-sidebar-header,
  .sub-sidebar-header {
    padding-left: 18px;
    padding-right: 72px;
  }

  .sidebar-content,
  .user-sidebar-content,
  .sub-sidebar-content {
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: 18px;
  }

  .nearby-search-panel {
    padding: 16px;
    border-radius: 20px;
  }

  .nearby-search-panel__heading {
    flex-direction: column;
    align-items: stretch;
  }

  .nearby-search-panel__controls {
    grid-template-columns: 1fr;
  }

  .nearby-search-panel__submit,
  .nearby-search-panel__ghost-btn {
    width: 100%;
  }

  .nearby-search-panel__result {
    align-items: flex-start;
    flex-direction: column;
  }

  .nearby-search-panel__result-meta {
    justify-items: start;
    text-align: left;
  }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.notification-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9997;
}

.notification-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 360px;
  max-height: calc(100vh - 120px);
  border-radius: 24px;
  border: 1px solid rgba(199, 151, 60, 0.32);
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.98) 0%,
    rgba(240, 223, 191, 0.98) 54%,
    rgba(229, 201, 150, 0.98) 100%
  );
  box-shadow:
    0 40px 88px -36px rgba(4, 8, 18, 0.72),
    0 0 0 1px rgba(255, 255, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  color: #3c2910;
  overflow: hidden;
  z-index: 9998;
}

.notification-panel.dark {
  border-color: rgba(141, 176, 235, 0.24);
  background: linear-gradient(
    160deg,
    rgba(15, 22, 40, 0.98) 0%,
    rgba(22, 34, 58, 0.98) 52%,
    rgba(29, 46, 78, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(3, 6, 15, 0.64),
    0 0 0 1px rgba(182, 208, 255, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  color: #eef4ff;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(148, 111, 46, 0.18);
  background: linear-gradient(
    180deg,
    rgba(255, 252, 245, 0.42) 0%,
    rgba(255, 245, 227, 0.14) 100%
  );
}

.notification-tabs {
  display: flex;
  gap: 4px;
}

.notification-tab-btn {
  padding: 5px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(60, 41, 16, 0.55);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.notification-tab-btn .tab-badge {
  position: absolute;
  top: -2px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  background: #f44336;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 0 4px;
  box-shadow: 0 1px 4px rgba(244, 67, 54, 0.4);
}

.notification-tab-btn .tab-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f44336;
  box-shadow: 0 0 4px rgba(244, 67, 54, 0.6);
}

.notification-tab-btn.active {
  border-color: rgba(199, 151, 60, 0.28);
  background: rgba(255, 255, 255, 0.45);
  color: #3c2910;
}

.notification-tab-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.22);
}

.notification-panel.dark .notification-header {
  border-bottom-color: rgba(198, 219, 255, 0.12);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

.notification-panel.dark .notification-tab-btn {
  color: rgba(200, 210, 230, 0.55);
}

.notification-panel.dark .notification-tab-btn.active {
  border-color: rgba(141, 176, 235, 0.28);
  background: rgba(255, 255, 255, 0.08);
  color: #eef4ff;
}

.notification-panel.dark .notification-tab-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.04);
}

.notification-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  font-family: "Georgia", "Times New Roman", serif;
}

.notification-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-actions .mark-read-btn {
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 111, 46, 0.24);
  background: rgba(255, 255, 255, 0.42);
  color: #8b561d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.notification-actions .clear-all-btn {
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid rgba(220, 80, 60, 0.22);
  background: rgba(244, 67, 54, 0.08);
  color: #c0392b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.notification-actions .clear-all-btn:hover {
  background: rgba(244, 67, 54, 0.18);
}

.notification-panel.dark .notification-actions .clear-all-btn {
  border-color: rgba(244, 67, 54, 0.3);
  background: rgba(244, 67, 54, 0.1);
  color: #f5a8a2;
}

.notification-panel.dark .notification-actions .clear-all-btn:hover {
  background: rgba(244, 67, 54, 0.22);
}

.notification-panel.dark .notification-actions .mark-read-btn {
  border-color: rgba(141, 176, 235, 0.28);
  background: rgba(255, 255, 255, 0.08);
  color: #a8c4ff;
}

.notification-actions .mark-read-btn:hover {
  background: rgba(255, 255, 255, 0.62);
}

.notification-panel.dark .notification-actions .mark-read-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}

.notification-actions .close-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(148, 111, 46, 0.18);
  background: rgba(255, 255, 255, 0.24);
  color: #8b561d;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
}

.notification-panel.dark .notification-actions .close-btn {
  border-color: rgba(141, 176, 235, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #a8c4ff;
}

.notification-actions .close-btn:hover {
  background: rgba(255, 255, 255, 0.42);
}

.notification-panel.dark .notification-actions .close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.notification-content {
  padding: 12px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.notification-loading,
.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: rgba(60, 41, 16, 0.6);
}

.notification-panel.dark .notification-loading,
.notification-panel.dark .notification-empty {
  color: rgba(200, 210, 230, 0.6);
}

.empty-icon {
  font-size: 32px;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 111, 46, 0.14);
  background: rgba(255, 255, 255, 0.48);
  transition: all 0.18s ease;
  position: relative;
}

.notification-panel.dark .notification-item {
  border-color: rgba(141, 176, 235, 0.12);
  background: rgba(255, 255, 255, 0.05);
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.68);
}

.notification-panel.dark .notification-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.notification-item.unread {
  border-color: rgba(199, 151, 60, 0.32);
  background: rgba(255, 250, 240, 0.62);
}

.notification-panel.dark .notification-item.unread {
  border-color: rgba(141, 176, 235, 0.28);
  background: rgba(142, 108, 255, 0.08);
}

.notice-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.52) 0%,
    rgba(159, 105, 34, 0.14) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.26);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #8b561d;
  flex-shrink: 0;
}

.notification-panel.dark .notice-avatar {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(142, 108, 255, 0.14) 100%
  );
  color: #a8c4ff;
}

.notice-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.notice-body {
  flex: 1;
  min-width: 0;
}

.notice-content {
  margin: 0 0 4px;
  font-size: 14px;
  line-height: 1.5;
  color: inherit;
}

.notice-time {
  font-size: 12px;
  color: rgba(60, 41, 16, 0.5);
}

.notification-panel.dark .notice-time {
  color: rgba(200, 210, 230, 0.5);
}

.unread-dot {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff6b6b;
}

.notification-panel.dark .unread-dot {
  background: #8e6cff;
}

.announcement-panel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.np-announcement-card {
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 111, 46, 0.14);
  background: rgba(255, 255, 255, 0.48);
  transition: all 0.18s ease;
  border-left: 3px solid #667eea;
}

.np-announcement-card:hover {
  background: rgba(255, 255, 255, 0.68);
}

.np-announcement-card.emotion {
  border-left-color: #e74c3c;
}

.np-announcement-card.feature {
  border-left-color: #f39c12;
}

.np-announcement-card.warning {
  border-left-color: #f39c12;
}

.np-ann-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.np-ann-type-badge {
  font-size: 16px;
}

.np-ann-time {
  font-size: 12px;
  color: rgba(60, 41, 16, 0.5);
}

.np-ann-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
  font-family: "Georgia", "Times New Roman", serif;
}

.np-ann-content {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.8;
}

.notification-panel.dark .np-announcement-card {
  border-color: rgba(141, 176, 235, 0.12);
  border-left-color: #667eea;
  background: rgba(255, 255, 255, 0.05);
}

.notification-panel.dark .np-announcement-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.notification-panel.dark .np-announcement-card.emotion {
  border-left-color: #e74c3c;
}

.notification-panel.dark .np-announcement-card.feature {
  border-left-color: #f39c12;
}

.notification-panel.dark .np-announcement-card.warning {
  border-left-color: #f39c12;
}

.notification-panel.dark .np-ann-time {
  color: rgba(200, 210, 230, 0.5);
}

.msg-trigger-wrapper {
  position: fixed;
  right: 0;
  top: 25%;
  transform: translateY(-50%);
  z-index: 9996;
}

.msg-trigger-btn {
  writing-mode: vertical-lr;
  text-orientation: upright;
  letter-spacing: 0;
  position: relative;
  width: 30px;
  height: 200px;
  border: none;
  border-radius: 10px 0 0 10px;
  background: linear-gradient(
    180deg,
    rgba(250, 239, 217, 0.92) 0%,
    rgba(229, 201, 150, 0.92) 100%
  );
  border: 1px solid rgba(199, 151, 60, 0.24);
  border-right: none;
  color: #8b561d;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  z-index: 9996;
  text-orientation: mixed;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: -4px 0 16px -6px rgba(4, 8, 18, 0.18);
}

.msg-trigger-btn:hover {
  width: 38px;
  background: linear-gradient(
    180deg,
    rgba(255, 250, 240, 0.96) 0%,
    rgba(240, 223, 191, 0.96) 100%
  );
}

.msg-trigger-btn.dark {
  background: linear-gradient(
    180deg,
    rgba(15, 22, 40, 0.92) 0%,
    rgba(29, 46, 78, 0.92) 100%
  );
  border-color: rgba(141, 176, 235, 0.18);
  color: #a8c4ff;
  box-shadow: -4px 0 16px -6px rgba(3, 6, 15, 0.32);
}

.msg-trigger-btn.dark:hover {
  width: 38px;
  background: linear-gradient(
    180deg,
    rgba(22, 34, 58, 0.96) 0%,
    rgba(35, 55, 90, 0.96) 100%
  );
}

.msg-badge-dot {
  position: absolute;
  top: 8px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f44336;
  border: 2px solid #fff8ee;
  box-shadow: 0 0 6px rgba(244, 67, 54, 0.7);
  animation: badge-pulse 2s ease-in-out infinite;
  z-index: 1;
}

.msg-trigger-btn.dark + .msg-badge-dot,
.msg-wrapper .msg-badge-dot {
  border-color: #1a2845;
}

@keyframes badge-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.25);
    opacity: 0.75;
  }
}

.notification-fade-enter-active,
.notification-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.notification-fade-enter-from,
.notification-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

@media (max-width: 640px) {
  .notification-panel {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }
}

/* ============ 新用户信息面板样式 ============ */

/* 用户头像+用户名/ID 新布局 */
.user-profile-new {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px 0;
}

.user-profile-new .user-avatar-wrapper {
  flex-shrink: 0;
}

.user-identity-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-identity-top {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-display-name {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: linear-gradient(90deg, #b8860b 0%, #ffd700 25%, #fff 50%, #ffd700 75%, #b8860b 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: vipGoldFlow 3s linear infinite;
}

.user-display-name:not(.has-vip) {
  background: none;
  -webkit-background-clip: unset;
  background-clip: unset;
  -webkit-text-fill-color: unset;
  color: #333;
}

.user-display-name.has-vip {
  animation: vipGoldFlow 3s linear infinite;
}

@keyframes vipGoldFlow {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}


/* VIP 样式已移除 */

/* VIP 文字标签 - 头像旁的VIP标识（鎏金渐变斜体浮夸风） */
.vip-text-badge {
  display: inline-block;
  padding: 2px 10px;
  border: 1.5px solid rgba(255, 215, 0, 0.55);
  border-radius: 6px;
  background-color: #ffd700;
  background-image: linear-gradient(90deg, #b8860b 0%, #ffd700 25%, #fff5cc 50%, #ffd700 75%, #b8860b 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  font-size: 16px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 1px;
  line-height: 1.3;
  animation: vipGoldFlow 3s linear infinite;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.2), inset 0 0 4px rgba(255, 215, 0, 0.08);
}

.vip-text-badge:hover {
  transform: scale(1.08);
  filter: brightness(1.15);
}

/* VIP 小徽标 - 用于紧凑列表（item-meta内、slot内等） */
.vip-text-badge-sm {
  display: inline-block;
  padding: 0 4px;
  border-radius: 3px;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #5d4037;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  transition: all 0.2s ease;
  line-height: 16px;
  vertical-align: middle;
  margin-left: 4px;
}

.vip-text-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.vip-text-badge--inactive {
  background-color: transparent;
  background-image: linear-gradient(90deg, #8b6914 0%, #c9a227 25%, #c9b896 50%, #c9a227 75%, #8b6914 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  border: 1.5px solid rgba(184, 135, 46, 0.45);
  font-style: normal;
  animation: vipGoldFlow 3s linear infinite;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.15);
}

/* VIP 用户名+徽标行内容器 - 保持同行 */
.vip-name-row {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

/* 通用 VIP 用户名流金样式 */
.vip-username.has-vip {
  background: linear-gradient(90deg, #b8860b 0%, #ffd700 25%, #fff 50%, #ffd700 75%, #b8860b 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: vipGoldFlow 3s linear infinite;
  display: inline;
}

.icon-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #999;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.icon-edit-btn:hover {
  background: #f0f0f0;
  color: #555;
}

.user-star-id {
  font-size: 12px;
  color: #999;
  font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
  letter-spacing: 0.5px;
}

.wallet-inline-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  margin-top: 10px;
  padding: 6px 12px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.18), rgba(245, 166, 35, 0.24));
  color: #7a5200;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.wallet-inline-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px -14px rgba(173, 121, 13, 0.7);
}

.wallet-inline-btn__icon {
  font-size: 14px;
}

.wallet-inline-btn__label {
  opacity: 0.88;
}

.user-identity-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.switch-account-btn {
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: #e8f0fe;
  color: #1a73e8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.switch-account-btn:hover {
  background: #d2e3fc;
}

.logout-inline-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.logout-inline-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Bio 签名区域 */
.user-bio-area {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  margin: 0 0 8px 0;
  background: #f9fafb;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  cursor: text;
  transition: border-color 0.15s, background 0.15s;
  min-height: 40px;
}

.user-bio-area:hover {
  border-color: #ddd;
  background: #f5f5f5;
}

.bio-content {
  flex: 1;
  min-width: 0;
}

.bio-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  word-break: break-word;
}

/* VIP 个性签名样式 */
.vip-bio {
  background: rgba(255, 223, 120, 0.45) !important;
  border-color: rgba(218, 180, 60, 0.5) !important;
}
.vip-bio .bio-text {
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(90deg, #ff4444, #ff8888, #ff5555, #ff3333, #ff7777, #ff4444);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: vip-bio-flow 3s linear infinite;
}
@keyframes vip-bio-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
.dark .vip-bio {
  background: rgba(255, 215, 0, 0.08) !important;
  border-color: rgba(255, 200, 0, 0.2) !important;
}

.bio-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bio-input-wrap textarea {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
}

.bio-input-wrap textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.bio-char-count {
  font-size: 11px;
  color: #bbb;
  text-align: right;
}

.inline-font-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.btn-comment-bg {
  height: 36px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(184, 135, 46, 0.25);
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px -6px rgba(255, 215, 0, 0.4);
}

.btn-comment-bg:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px -6px rgba(255, 215, 0, 0.5);
}

.btn-comment-bg--locked {
  background: rgba(184, 135, 46, 0.08);
  border-color: rgba(0,0,0,0.1);
  color: #888;
  box-shadow: none;
  cursor: pointer;
}

.btn-comment-bg--locked:hover {
  background: rgba(184, 135, 46, 0.15);
  transform: translateY(-1px);
}

.font-clear-btn {
  padding: 6px 12px;
  border: 1px solid rgba(200, 100, 100, 0.3);
  border-radius: 14px;
  background: rgba(200, 100, 100, 0.08);
  color: var(--panel-muted, #bbb);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.font-clear-btn:hover {
  background: rgba(200, 100, 100, 0.18);
}

.bio-edit-icon {
  flex-shrink: 0;
  padding-top: 2px;
  color: #ccc;
}

/* 标签栏 */
.user-content-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #eee;
  padding: 0;
  margin-bottom: 0;
}

.content-tab {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: #999;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.content-tab::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: #667eea;
  border-radius: 1px;
  transition: width 0.2s;
}

.content-tab.active {
  color: #333;
}

.content-tab.active::after {
  width: 60%;
}

.content-tab:hover {
  color: #555;
}

.tab-count {
  font-size: 11px;
  font-weight: 700;
  color: #aaa;
  background: #f0f0f0;
  padding: 1px 6px;
  border-radius: 8px;
}

.content-tab.active .tab-count {
  color: #667eea;
  background: #eef0ff;
}

/* 内容列表区域 */
.user-content-list {
  position: relative; /* 虚拟滚动子元素绝对定位需要 */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 12px 28px;
  overscroll-behavior-y: contain; /* 防止过度滚动 */
}


/* 虚拟滚动相关样式 */
.vscroll-spacer {
  position: relative;
  width: 100%;
  pointer-events: none;
}

.vscroll-item {
  box-sizing: border-box;
}

/* 用户面板卡片间距（由 composable gap:12 处理，此处不再重复） */

/* 隐藏整个侧边栏的外层滚动条 */
.user-sidebar {
  overflow: hidden !important;
  scrollbar-width: none;
}

.user-sidebar::-webkit-scrollbar {
  display: none;
}

.user-sidebar-content {
  scrollbar-width: none;
}

.user-sidebar-content::-webkit-scrollbar {
  display: none;
}

/* 隐藏故事列表滚动条但保留滚动功能 */
.user-content-list {
  scrollbar-width: none;
}

.user-content-list::-webkit-scrollbar {
  display: none;
}

.profile-story-list {
  padding-top: 0;
}

/* 编辑资料弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.modal-overlay.dark {
  background: rgba(0, 0, 0, 0.65);
}

.edit-profile-modal {
  width: 400px;
  max-width: calc(100vw - 40px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.edit-profile-modal.dark {
  background: #1a1a2e;
  color: #edf3ff;
}

.edit-profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.edit-profile-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.edit-profile-body {
  padding: 20px;
}

.edit-field {
  margin-bottom: 16px;
  position: relative;
}

.edit-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
}

.optional-hint {
  font-weight: 400;
  color: #aaa;
}

.edit-field input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;
}

.edit-field input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.edit-input-wrap input {
  padding-right: 40px;
}

/* 隐藏浏览器原生的密码显示/隐藏按钮 */
.edit-input-wrap input::-ms-reveal,
.edit-input-wrap input::-ms-clear {
  display: none;
}

.edit-input-wrap input::-webkit-credentials-auto-fill-button,
.edit-input-wrap input::-webkit-reveal-password-button {
  display: none !important;
}

.edit-field input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.eye-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.eye-toggle:hover {
  background: rgba(0, 0, 0, 0.06);
}

.dark .eye-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
}

.eye-toggle svg {
  display: block;
}

.edit-input-wrap {
  position: relative;
}

.field-error-inline {
  display: block;
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
}

.field-hint {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}

.edit-profile-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #eee;
}

.edit-profile-footer .btn-cancel {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  color: #555;
  font-size: 14px;
  cursor: pointer;
}

.edit-profile-footer .btn-save {
  padding: 8px 24px;
  border: none;
  border-radius: 8px;
  background: #667eea;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.edit-profile-footer .btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 修改密码分隔区 */
.edit-password-section {
  padding-top: 8px;
  margin-top: 8px;
  margin-bottom: 4px;
  border-top: 1px solid #eee;
}

.edit-password-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
}

.dark .edit-password-section {
  border-top-color: #333;
}

.dark .edit-password-title {
  color: #aab;
}

/* 密码验证提示样式 */
.validation-tip {
  margin-top: 2px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.4;
}

.tip-error {
  border: 1px solid #dc2626;
  background: rgba(239, 68, 68, 0.1);
}

.tip-error .tip-text {
  color: #dc2626;
}

.tip-success {
  border: 1px solid #16a34a;
  background: rgba(34, 197, 94, 0.1);
  margin-bottom: 8px;
}

.tip-success .tip-text {
  color: #16a34a;
}

.dark .tip-error {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

.dark .tip-error .tip-text {
  color: #fca5a5;
}

.dark .tip-success {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.dark .tip-success .tip-text {
  color: #86efac;
}

/* 确认修改密码按钮 */
.btn-confirm-password {
  width: 100%;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #667eea;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 4px;
}

.btn-confirm-password:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-confirm-password:not(:disabled):hover {
  opacity: 0.85;
}

.dark .btn-confirm-password {
  background: #5a6fd6;
}

/* 切换账号弹窗 */
.switch-account-modal {
  width: 360px;
  max-width: calc(100vw - 40px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.switch-account-modal.dark {
  background: #1a1a2e;
  color: #edf3ff;
}

.switch-account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.switch-account-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.switch-account-body {
  padding: 20px;
}

.account-slots {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.account-slot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.account-slot:hover {
  background: #f9fafb;
  border-color: #ddd;
}

.account-slot.current {
  background: #f0f7ff;
  border-color: #c2d9ff;
  cursor: default;
}

.slot-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.slot-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.slot-current-badge {
  font-size: 11px;
  color: #1a73e8;
  background: #e8f0fe;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.add-slot {
  border-style: dashed;
  border-color: #ccc;
  justify-content: center;
}

.add-slot:hover {
  border-color: #999;
  background: #fafafa;
}

.add-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #aaa;
}

/* 暗色模式适配 */
.dark .user-display-name {
  color: #edf3ff;
}

.dark .user-display-name:not(.has-vip) {
  -webkit-text-fill-color: unset;
}

.dark .user-display-name.has-vip {
  background: linear-gradient(90deg, #b8860b 0%, #ffd700 25%, #ffe4b5 50%, #ffd700 75%, #b8860b 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: vipGoldFlow 3s linear infinite;
}

.dark .user-star-id { color: #8899aa; }
.dark .wallet-inline-btn {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.16), rgba(143, 180, 255, 0.18));
  color: #f4e2a5;
}
.dark .user-bio-area { background: #1e2a3a; border-color: #2a3a4a; }
.dark .bio-text { color: #aabbcc; }
.dark .bio-input-wrap textarea { background: #0f1a2a; border-color: #2a3a4a; color: #edf3ff; }
.dark .user-content-tabs { border-bottom-color: #2a3a4a; }
.dark .content-tab { color: #7788aa; }
.dark .content-tab.active { color: #b8cfff; }
.dark .content-tab.active::after { background: #8fb4ff; }
.dark .tab-count { color: #556677; background: #1e2a3a; }
.dark .content-tab.active .tab-count { color: #8fb4ff; background: #1a2a4a; }
.dark .icon-edit-btn { color: #667788; }
.dark .icon-edit-btn:hover { background: #2a3a4a; color: #aabbcc; }
.dark .bio-edit-icon { color: #445566; }
.dark .logout-inline-btn { color: #778899; }
.dark .logout-inline-btn:hover { background: #3a2020; color: #ff6b6b; }
.dark .switch-account-btn { background: #1a2a4a; color: #8fb4ff; }
.dark .switch-account-btn:hover { background: #243656; }
.dark .edit-profile-header { border-bottom-color: #2a3a4a; }
.dark .edit-profile-footer { border-top-color: #2a3a4a; }
.dark .edit-field label { color: #8899aa; }
.dark .edit-field input { background: #0f1a2a; border-color: #2a3a4a; color: #edf3ff; }
.dark .edit-field input:disabled { background: #162030; color: #556677; }
.dark .switch-account-header { border-bottom-color: #2a3a4a; }
.dark .account-slot { border-color: #2a3a4a; }
.dark .account-slot:hover { background: #1a2a3a; border-color: #3a4a5a; }
.dark .account-slot.current { background: #162030; border-color: #2a4a6a; }
.dark .slot-name { color: #c8d8e8; }
.dark .slot-current-badge { color: #8fb4ff; background: #1a2a4a; }
.dark .add-slot { border-color: #3a4a5a; }
.dark .add-slot:hover { border-color: #4a5a6a; background: #162030; }
.dark .add-avatar { border-color: #4a5a6a; color: #5a6a7a; }
.dark .edit-profile-footer .btn-cancel { background: #2a3a4a; color: #aabbcc; }

/* ===== 地图搜索框 ===== */
.map-search-bar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: min(520px, calc(100vw - 40px));
  transition: filter 0.3s ease;
}
.map-search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  height: 44px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid rgba(0, 0, 0, 0.14);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.14),
    0 0 0 1px rgba(255, 255, 255, 0.18);
  transition: all 0.25s ease;
}
/* 浅色模式暖色调 */
.map-search-bar:not(.dark) .map-search-input-wrap {
  background: linear-gradient(135deg, rgba(250, 239, 217, 0.92) 0%, rgba(240, 223, 191, 0.92) 100%);
  border-color: rgba(92, 51, 20, 0.65);
  border-width: 3px;
  box-shadow:
    0 10px 28px rgba(7, 11, 22, 0.2),
    0 0 0 1px rgba(255, 248, 232, 0.72),
    0 0 24px rgba(114, 80, 22, 0.18);
}
.map-search-bar:not(.dark) .map-search-input-wrap:focus-within {
  border-color: rgba(72, 38, 12, 0.82);
  border-width: 3px;
  box-shadow:
    0 12px 32px rgba(7, 11, 22, 0.24),
    0 0 0 1px rgba(255, 248, 232, 0.86),
    0 0 0 5px rgba(35, 29, 18, 0.14),
    0 0 34px rgba(196, 142, 48, 0.28);
}
.map-search-bar.dark .map-search-input-wrap {
  background: rgba(20, 28, 42, 0.88);
  border-color: rgba(248, 251, 255, 0.78);
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.12),
    0 0 22px rgba(214, 230, 255, 0.18);
}
.map-search-input-wrap:focus-within {
  border-color: rgba(102, 126, 234, 0.62);
  box-shadow:
    0 12px 30px rgba(102, 126, 234, 0.18),
    0 0 0 4px rgba(102, 126, 234, 0.12);
}
.map-search-bar.dark .map-search-input-wrap:focus-within {
  border-color: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.44),
    0 0 0 1px rgba(255, 255, 255, 0.18),
    0 0 0 5px rgba(230, 240, 255, 0.14),
    0 0 34px rgba(143, 180, 255, 0.34);
}
/* 浅色模式文字颜色 */
.map-search-bar:not(.dark) .map-search-icon { color: #8b6d3a; }
.map-search-bar:not(.dark) .map-search-input { color: #3c2910; }
.map-search-bar:not(.dark) .map-search-input::placeholder { color: rgba(94, 63, 20, 0.45); }
.map-search-bar:not(.dark) .map-search-clear { background: rgba(164, 122, 48, 0.12); }
.map-search-bar:not(.dark) .map-search-clear svg { color: #8b6d3a; }
.map-search-bar:not(.dark) .map-search-clear:hover { background: rgba(164, 122, 48, 0.22); }
.map-search-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #999;
}
.map-search-bar.dark .map-search-icon { color: #667788; }
.map-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}
.map-search-input::placeholder { color: #aaa; }
.map-search-bar.dark .map-search-input { color: #dde4f0; }
.map-search-bar.dark .map-search-input::placeholder { color: #556677; }
.map-search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background 0.2s;
}
.map-search-clear svg { width: 14px; height: 14px; color: #888; }
.map-search-clear:hover { background: rgba(0, 0, 0, 0.12); }
.map-search-bar.dark .map-search-clear { background: rgba(255, 255, 255, 0.08); }
.map-search-bar.dark .map-search-clear svg { color: #778899; }
.map-search-bar.dark .map-search-clear:hover { background: rgba(255, 255, 255, 0.15); }

/* ===== 搜索结果面板 ===== */
.map-filter-bar {
  position: fixed;
  top: auto;
  left: auto;
  right: 268px;
  bottom: 122px;
  transform: none;
  z-index: 200;
  width: min(440px, calc(100vw - 48px));
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding: 16px;
  border-radius: 24px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(196, 142, 48, 0.26);
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.92) 0%,
    rgba(240, 223, 191, 0.93) 52%,
    rgba(229, 206, 166, 0.92) 100%
  );
  box-shadow:
    0 14px 36px rgba(7, 11, 22, 0.14),
    0 0 0 1px rgba(255, 248, 232, 0.38);
}

.map-filter-bar.dark {
  border-color: rgba(143, 180, 255, 0.18);
  background: linear-gradient(
    160deg,
    rgba(18, 24, 39, 0.92) 0%,
    rgba(25, 37, 61, 0.94) 52%,
    rgba(20, 31, 53, 0.94) 100%
  );
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.28),
    0 0 0 1px rgba(190, 214, 255, 0.08);
}

.map-filter-bar__row {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.map-filter-bar__row + .map-filter-bar__row {
  margin-top: 10px;
}

.map-filter-bar__row--secondary {
  align-items: flex-start;
}

.map-filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.map-filter-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b4c1d;
}

.map-filter-bar.dark .map-filter-label {
  color: #b7c8e8;
}

.map-filter-chip-list {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.map-filter-chip {
  border: 1px solid rgba(145, 107, 38, 0.22);
  background: rgba(255, 250, 242, 0.78);
  color: #5a3a14;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.map-filter-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(145, 107, 38, 0.38);
  box-shadow: 0 8px 18px rgba(84, 55, 18, 0.14);
}

.map-filter-chip.active {
  background: linear-gradient(135deg, #ffe4aa 0%, #f7c86a 100%);
  border-color: rgba(145, 107, 38, 0.44);
  box-shadow: 0 10px 20px rgba(145, 107, 38, 0.18);
}

.map-filter-bar.dark .map-filter-chip {
  border-color: rgba(143, 180, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: #e5eefb;
}

.map-filter-bar.dark .map-filter-chip:hover {
  border-color: rgba(143, 180, 255, 0.28);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
}

.map-filter-bar.dark .map-filter-chip.active {
  background: linear-gradient(135deg, rgba(143, 180, 255, 0.34), rgba(94, 138, 230, 0.44));
  border-color: rgba(143, 180, 255, 0.42);
}

.map-filter-date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.map-filter-date-input {
  min-width: 138px;
  height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(145, 107, 38, 0.22);
  background: rgba(255, 252, 245, 0.84);
  color: #3c2910;
  font-size: 13px;
  outline: none;
}

.map-filter-date-input:focus {
  border-color: rgba(145, 107, 38, 0.42);
  box-shadow: 0 0 0 4px rgba(145, 107, 38, 0.1);
}

.map-filter-bar.dark .map-filter-date-input {
  border-color: rgba(143, 180, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: #eef4ff;
}

.map-filter-bar.dark .map-filter-date-input:focus {
  border-color: rgba(143, 180, 255, 0.38);
  box-shadow: 0 0 0 4px rgba(143, 180, 255, 0.12);
}

.map-filter-date-sep {
  font-size: 12px;
  color: rgba(90, 58, 20, 0.7);
}

.map-filter-bar.dark .map-filter-date-sep {
  color: rgba(208, 224, 255, 0.72);
}

.map-filter-reset {
  height: 38px;
  border: none;
  border-radius: 12px;
  padding: 0 14px;
  background: rgba(60, 26, 0, 0.82);
  color: #fff7ed;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.map-filter-reset:hover {
  transform: translateY(-1px);
  opacity: 0.92;
}

.map-filter-bar.dark .map-filter-reset {
  background: rgba(143, 180, 255, 0.18);
  color: #eff5ff;
}

.map-filter-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  font-size: 12px;
  color: rgba(73, 48, 16, 0.82);
  flex-wrap: wrap;
}

.map-filter-bar.dark .map-filter-status {
  color: rgba(225, 236, 255, 0.82);
}

.map-filter-status__badge {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(196, 142, 48, 0.16);
  color: #6b4c1d;
  font-weight: 600;
}

.map-filter-bar.dark .map-filter-status__badge {
  background: rgba(143, 180, 255, 0.16);
  color: #dfeaff;
}

@media (max-width: 760px) {
  .map-filter-bar {
    right: 14px;
    bottom: 200px;
    width: calc(100vw - 28px);
    max-height: calc(100vh - 248px);
    padding: 14px;
    border-radius: 20px;
  }

  .map-filter-date-input {
    min-width: 0;
    width: calc(50vw - 42px);
  }

  .map-search-results {
    top: 212px;
    max-height: calc(100vh - 240px);
  }
}

.map-search-results {
  position: fixed;
  top: 178px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 49;
  width: min(480px, calc(100vw - 40px));
  max-height: calc(100vh - 110px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  transition: filter 0.3s ease;
}
/* 浅色模式暖色调 */
.map-search-results:not(.dark) {
  background: linear-gradient(160deg, rgba(250, 239, 217, 0.97) 0%, rgba(240, 223, 191, 0.97) 52%, rgba(229, 206, 166, 0.97) 100%);
  border-color: rgba(196, 142, 48, 0.3);
  box-shadow: 0 8px 40px rgba(7, 11, 22, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.4);
}
.map-search-results:not(.dark) .search-tabs {
  border-bottom-color: rgba(148, 111, 46, 0.18);
}
.map-search-results:not(.dark) .search-tab { color: #8b6d3a; }
.map-search-results:not(.dark) .search-tab:hover { color: #5e3f14; }
.map-search-results:not(.dark) .search-tab.active { color: #96772e; }
.map-search-results:not(.dark) .search-tab.active::after { background: #96772e; }
.map-search-results:not(.dark) .map-search-empty { color: #8b6d3a; }
.map-search-results:not(.dark) .search-user-profile .user-display-name { color: #3c2910; }
.map-search-results:not(.dark) .search-user-profile .user-star-id { color: #8b6d3a; }
.map-search-results.dark {
  background: rgba(20, 28, 42, 0.95);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
}
.map-search-results-list {
  position: relative; /* 虚拟滚动子元素绝对定位需要 */
  overflow-y: auto;
  max-height: calc(100vh - 120px);
  padding: 8px;
  scrollbar-width: none;
}
.map-search-results-list::-webkit-scrollbar { display: none; }
.map-search-card {
}
.map-search-card:last-child { }
.map-search-results.dark .map-search-card.panel-item {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(182, 208, 255, 0.12);
}
.map-search-results.dark .map-search-card /* ── 时光胶囊锁定条 ── */
.panel-item.is-capsule-locked {
  cursor: not-allowed;
}
.panel-item.is-capsule-locked:hover {
  background: rgba(255, 255, 255, 0.03);
  transform: none;
}

.capsule-lock-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(160, 185, 215, 0.18) 0%, rgba(140, 170, 205, 0.12) 100%);
  border: 1px solid rgba(180, 200, 225, 0.2);
}

.capsule-lock-icon {
  color: rgba(160, 185, 215, 0.7);
  flex-shrink: 0;
  animation: capsule-lock-pulse 3s ease-in-out infinite;
}

.capsule-lock-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.8);
  letter-spacing: 0.02em;
}

.capsule-lock-timer {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.55);
  white-space: nowrap;
}

@keyframes capsule-lock-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

/* 暗色模式下的胶囊锁定条 — 侧边栏默认为暗色 */
.user-sidebar:not(.dark) .capsule-lock-strip {
  background: linear-gradient(135deg, rgba(80, 110, 160, 0.15) 0%, rgba(60, 95, 145, 0.1) 100%);
  border-color: rgba(100, 140, 200, 0.15);
}
.user-sidebar:not(.dark) .capsule-lock-icon {
  color: rgba(120, 160, 220, 0.65);
}
.user-sidebar:not(.dark) .capsule-lock-label {
  color: rgba(130, 165, 220, 0.8);
}
.user-sidebar:not(.dark) .capsule-lock-timer {
  color: rgba(130, 165, 220, 0.5);
}

.item-content { color: rgba(255, 255, 255, 0.85); }
.map-search-results.dark .map-search-card .item-author { color: #fff; }
.map-search-results.dark .map-search-card .item-time { color: rgba(255, 255, 255, 0.5); }
.map-search-results.dark .map-search-card .item-footer { color: rgba(255, 255, 255, 0.5); }
.map-search-results:not(.dark) .map-search-card.panel-item {
  background: rgba(255, 252, 246, 0.34);
  border-color: rgba(164, 122, 48, 0.35);
  border-width: 1.5px;
  box-shadow: 0 18px 26px -22px rgba(98, 75, 34, 0.18);
}
.map-search-results:not(.dark) .map-search-card.panel-item:hover {
  background: rgba(255, 250, 242, 0.52);
  border-color: rgba(164, 122, 48, 0.35);
}
.map-search-results:not(.dark) .map-search-card /* ── 时光胶囊锁定条 ── */
.panel-item.is-capsule-locked {
  cursor: not-allowed;
}
.panel-item.is-capsule-locked:hover {
  background: rgba(255, 255, 255, 0.03);
  transform: none;
}

.capsule-lock-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(160, 185, 215, 0.18) 0%, rgba(140, 170, 205, 0.12) 100%);
  border: 1px solid rgba(180, 200, 225, 0.2);
}

.capsule-lock-icon {
  color: rgba(160, 185, 215, 0.7);
  flex-shrink: 0;
  animation: capsule-lock-pulse 3s ease-in-out infinite;
}

.capsule-lock-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.8);
  letter-spacing: 0.02em;
}

.capsule-lock-timer {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.55);
  white-space: nowrap;
}

@keyframes capsule-lock-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

/* 暗色模式下的胶囊锁定条 — 侧边栏默认为暗色 */
.user-sidebar:not(.dark) .capsule-lock-strip {
  background: linear-gradient(135deg, rgba(80, 110, 160, 0.15) 0%, rgba(60, 95, 145, 0.1) 100%);
  border-color: rgba(100, 140, 200, 0.15);
}
.user-sidebar:not(.dark) .capsule-lock-icon {
  color: rgba(120, 160, 220, 0.65);
}
.user-sidebar:not(.dark) .capsule-lock-label {
  color: rgba(130, 165, 220, 0.8);
}
.user-sidebar:not(.dark) .capsule-lock-timer {
  color: rgba(130, 165, 220, 0.5);
}

.map-search-results:not(.dark) .item-content { color: #2c2c2c; }
.map-search-results:not(.dark) .map-search-card .item-author { color: #333; }
.map-search-results:not(.dark) .map-search-card .item-time { color: #888; }
.map-search-results:not(.dark) .map-search-card .item-footer { color: #666; }
/* 搜索用户结果面板内故事列表浅色模式文字 */
.map-search-results:not(.dark) .search-user-profile .user-content-list .panel-item {
  background: rgba(255, 252, 246, 0.34);
  border-color: rgba(164, 122, 48, 0.38);
  box-shadow: 0 18px 26px -22px rgba(98, 75, 34, 0.18);
}
.map-search-results:not(.dark) .search-user-profile .user-content-list .panel-item:hover {
  background: rgba(255, 250, 242, 0.52);
  border-color: rgba(164, 122, 48, 0.52);
}
.map-search-results:not(.dark) .search-user-profile .user-content-list .panel-item /* ── 时光胶囊锁定条 ── */
.panel-item.is-capsule-locked {
  cursor: not-allowed;
}
.panel-item.is-capsule-locked:hover {
  background: rgba(255, 255, 255, 0.03);
  transform: none;
}

.capsule-lock-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(160, 185, 215, 0.18) 0%, rgba(140, 170, 205, 0.12) 100%);
  border: 1px solid rgba(180, 200, 225, 0.2);
}

.capsule-lock-icon {
  color: rgba(160, 185, 215, 0.7);
  flex-shrink: 0;
  animation: capsule-lock-pulse 3s ease-in-out infinite;
}

.capsule-lock-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.8);
  letter-spacing: 0.02em;
}

.capsule-lock-timer {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.55);
  white-space: nowrap;
}

@keyframes capsule-lock-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

/* 暗色模式下的胶囊锁定条 — 侧边栏默认为暗色 */
.user-sidebar:not(.dark) .capsule-lock-strip {
  background: linear-gradient(135deg, rgba(80, 110, 160, 0.15) 0%, rgba(60, 95, 145, 0.1) 100%);
  border-color: rgba(100, 140, 200, 0.15);
}
.user-sidebar:not(.dark) .capsule-lock-icon {
  color: rgba(120, 160, 220, 0.65);
}
.user-sidebar:not(.dark) .capsule-lock-label {
  color: rgba(130, 165, 220, 0.8);
}
.user-sidebar:not(.dark) .capsule-lock-timer {
  color: rgba(130, 165, 220, 0.5);
}

.map-search-results:not(.dark) .search-user-profile .item-content { color: #2c2c2c; }
.map-search-results:not(.dark) .search-user-profile .user-content-list .panel-item .item-author { color: #333; }
.map-search-results:not(.dark) .search-user-profile .user-content-list .panel-item .item-time { color: #888; }
.map-search-results:not(.dark) .search-user-profile .user-content-list .panel-item .item-footer { color: #666; }
.map-search-results:not(.dark) .search-user-profile .user-content-list .panel-item .item-likes { color: #666; }
.map-search-results:not(.dark) .search-user-profile .panel-empty { color: #8b6d3a; }
.map-search-results:not(.dark) .search-user-profile .user-content-tabs { border-bottom-color: rgba(148, 111, 46, 0.18); }
.map-search-results:not(.dark) .search-user-profile .content-tab { color: #8b6d3a; }
.map-search-results:not(.dark) .search-user-profile .content-tab.active { color: #3c2910; }
.map-search-results:not(.dark) .search-user-profile .tab-count { color: #8b6d3a; background: rgba(255, 252, 246, 0.5); }
.map-search-results:not(.dark) .search-user-profile .user-bio-area { background: rgba(255, 252, 246, 0.34); border-color: rgba(164, 122, 48, 0.16); }
.map-search-results:not(.dark) .search-user-profile .bio-text { color: #3c2910; }
.map-search-empty {
  padding: 20px 16px;
  text-align: center;
  font-size: 13px;
  color: #999;
}
.map-search-results.dark .map-search-empty { color: #556677; }

/* 搜索面板内点赞/收藏按钮图标放大 */
.map-search-card .item-action-btn span { font-size: 0; line-height: 0; }
.map-search-card .item-action-btn span::before { font-size: 18px; line-height: 1; }
.map-search-card .unlike-btn span::before { content: "❌"; }
.map-search-card .unfavorite-btn span::before { content: "❌"; }

/* 搜索面板过渡动画 */
.search-panel-fade-enter-active,
.search-panel-fade-leave-active {
  transition: all 0.2s ease;
}
.search-panel-fade-enter-from,
.search-panel-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

/* ===== 搜索标签页 ===== */
.search-tabs {
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0 12px;
  flex-shrink: 0;
}
.map-search-results.dark .search-tabs { border-bottom-color: rgba(255, 255, 255, 0.08); }
.search-tab {
  padding: 10px 18px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #999;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}
.search-tab:hover { color: #666; }
.search-tab.active { color: #667eea; }
.search-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 18px;
  right: 18px;
  height: 2px;
  background: #667eea;
  border-radius: 1px;
}
.map-search-results.dark .search-tab { color: #556677; }
.map-search-results.dark .search-tab:hover { color: #8899aa; }
.map-search-results.dark .search-tab.active { color: #8fb4ff; }
.map-search-results.dark .search-tab.active::after { background: #8fb4ff; }

/* ===== 搜索用户卡片 ===== */
.search-user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.2s;
}
.search-user-card:hover {
  background: rgba(139, 170, 220, 0.12);
}
.map-search-results:not(.dark) .search-user-card:hover {
  background: rgba(139, 110, 50, 0.08);
}
.search-user-card__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.search-user-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.search-user-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.search-user-card__name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #edf3ff;
}
.map-search-results:not(.dark) .search-user-card__name { color: #333; }
.search-user-card__id {
  font-size: 11px;
  color: #667788;
}
.map-search-results:not(.dark) .search-user-card__id { color: #999; }
.search-user-card__arrow {
  width: 16px;
  height: 16px;
  color: #667788;
  flex-shrink: 0;
  opacity: 0.5;
}
.map-search-results:not(.dark) .search-user-card__arrow { color: #999; }

/* ===== 用户详情弹窗 ===== */
.search-user-modal-shell {
  position: fixed;
  inset: 0;
  z-index: 10100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(7, 11, 22, 0.55);
  backdrop-filter: blur(6px);
}
.map-search-user-detail .user-sidebar-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  z-index: 1;
  padding: 20px 28px 28px;
  display: flex;
  flex-direction: column;
}
.map-search-user-detail .search-user-profile {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.map-search-user-detail {
  position: relative;
  width: min(900px, calc(100vw - 48px));
  height: min(90vh, 960px);
  height: min(90vh, 960px);
  --profile-story-card-bg: rgba(24, 34, 56, 0.92);
  --profile-story-card-bg-hover: rgba(31, 45, 73, 0.98);
  --profile-story-card-border: rgba(151, 186, 255, 0.3);
  --profile-story-card-border-hover: rgba(191, 214, 255, 0.52);
  --profile-story-card-shadow: 0 24px 40px -30px rgba(3, 8, 20, 0.85);
  --profile-story-card-shadow-hover: 0 26px 42px -28px rgba(3, 8, 20, 0.92);
  --profile-story-card-text: #ffffff;
  --profile-story-card-muted: rgba(255, 255, 255, 0.84);
  border-radius: 36px;
  border: 1px solid rgba(196, 142, 48, 0.34);
  background: linear-gradient(
    160deg,
    rgba(18, 23, 37, 0.97) 0%,
    rgba(31, 42, 64, 0.98) 56%,
    rgba(17, 25, 42, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(3, 7, 18, 0.72),
    0 0 0 1px rgba(255, 248, 232, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.map-search-user-detail::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 28px;
  border: 1px solid rgba(199, 151, 60, 0.22);
  pointer-events: none;
  z-index: 0;
}

/* 浅色模式 */
.map-search-user-detail:not(.dark) {
  --profile-story-card-bg: rgba(255, 245, 229, 0.96);
  --profile-story-card-bg-hover: rgba(255, 239, 215, 0.99);
  --profile-story-card-border: rgba(94, 66, 22, 0.28);
  --profile-story-card-border-hover: rgba(94, 66, 22, 0.42);
  --profile-story-card-shadow: 0 24px 40px -30px rgba(94, 66, 22, 0.28);
  --profile-story-card-shadow-hover: 0 26px 42px -28px rgba(94, 66, 22, 0.34);
  --profile-story-card-text: #000000;
  --profile-story-card-muted: rgba(0, 0, 0, 0.82);
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.98) 0%,
    rgba(240, 223, 191, 0.98) 52%,
    rgba(229, 206, 166, 0.98) 100%
  );
  border-color: rgba(196, 142, 48, 0.38);
  box-shadow:
    0 40px 80px -32px rgba(7, 11, 22, 0.5),
    0 0 0 1px rgba(255, 248, 232, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
}
.map-search-user-detail:not(.dark)::before {
  border-color: rgba(199, 151, 60, 0.22);
}
.map-search-user-detail:not(.dark) .user-sidebar-header {
  border-bottom-color: rgba(148, 111, 46, 0.18);
  background: linear-gradient(
    180deg,
    rgba(255, 252, 245, 0.42) 0%,
    rgba(255, 245, 227, 0.14) 100%
  );
}
.map-search-user-detail:not(.dark) .user-sidebar-header h3 {
  color: #3c2910;
}
.map-search-user-detail .close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
  min-width: 88px;
  height: 46px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(13, 19, 34, 0.82);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.map-search-user-detail .close-btn:hover {
  background: rgba(26, 35, 58, 0.96);
  border-color: rgba(255, 255, 255, 0.36);
}
.map-search-user-detail .close-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  height: 100%;
  width: 100%;
  transform: translate(-0.25px, -1.25px);
}
.map-search-user-detail:not(.dark) .close-btn {
  border-color: rgba(255, 255, 255, 0.26);
  background: rgba(33, 22, 9, 0.76);
  color: #fffaf1;
  box-shadow:
    0 18px 26px -20px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}
.map-search-user-detail:not(.dark) .close-btn:hover {
  background: rgba(53, 34, 13, 0.92);
  border-color: rgba(255, 255, 255, 0.42);
}
.map-search-user-detail:not(.dark) .user-content-list .panel-item {
  border-color: rgba(164, 122, 48, 0.38);
}
.map-search-user-detail .user-content-list .panel-item {
  background: var(--profile-story-card-bg);
  border: 1.5px solid var(--profile-story-card-border);
  box-shadow: var(--profile-story-card-shadow);
}
.map-search-user-detail .user-content-list .panel-item:hover {
  background: var(--profile-story-card-bg-hover);
  border-color: var(--profile-story-card-border-hover);
  box-shadow: var(--profile-story-card-shadow-hover);
}
.map-search-user-detail .user-content-list .panel-item.is-capsule-locked:hover {
  background: var(--profile-story-card-bg);
}
.map-search-user-detail .user-content-list .item-author,
.map-search-user-detail .user-content-list .item-content {
  color: var(--profile-story-card-text);
}
.map-search-user-detail .user-content-list .item-time,
.map-search-user-detail .user-content-list .item-footer,
.map-search-user-detail .user-content-list .item-likes {
  color: var(--profile-story-card-muted);
}
.map-search-user-detail:not(.dark) .user-content-list .item-author { color: #3c2910; }
.map-search-user-detail:not(.dark) .user-content-list /* ── 时光胶囊锁定条 ── */
.panel-item.is-capsule-locked {
  cursor: not-allowed;
}
.panel-item.is-capsule-locked:hover {
  background: rgba(255, 255, 255, 0.03);
  transform: none;
}

.capsule-lock-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(160, 185, 215, 0.18) 0%, rgba(140, 170, 205, 0.12) 100%);
  border: 1px solid rgba(180, 200, 225, 0.2);
}

.capsule-lock-icon {
  color: rgba(160, 185, 215, 0.7);
  flex-shrink: 0;
  animation: capsule-lock-pulse 3s ease-in-out infinite;
}

.capsule-lock-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.8);
  letter-spacing: 0.02em;
}

.capsule-lock-timer {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: rgba(160, 185, 215, 0.55);
  white-space: nowrap;
}

@keyframes capsule-lock-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

/* 暗色模式下的胶囊锁定条 — 侧边栏默认为暗色 */
.user-sidebar:not(.dark) .capsule-lock-strip {
  background: linear-gradient(135deg, rgba(80, 110, 160, 0.15) 0%, rgba(60, 95, 145, 0.1) 100%);
  border-color: rgba(100, 140, 200, 0.15);
}
.user-sidebar:not(.dark) .capsule-lock-icon {
  color: rgba(120, 160, 220, 0.65);
}
.user-sidebar:not(.dark) .capsule-lock-label {
  color: rgba(130, 165, 220, 0.8);
}
.user-sidebar:not(.dark) .capsule-lock-timer {
  color: rgba(130, 165, 220, 0.5);
}

.map-search-user-detail:not(.dark) .item-content { color: #3c2910; }
.map-search-user-detail:not(.dark) .user-content-list .item-time { color: #3c2910; }
.map-search-user-detail:not(.dark) .user-content-list .item-footer { color: #3c2910; }
.map-search-user-detail:not(.dark) .bio-text { color: #3c2910; }
.map-search-user-detail:not(.dark) .panel-empty { color: #3c2910; }
.map-search-user-detail:not(.dark) .content-tab { color: #3c2910; }
.map-search-user-detail:not(.dark) .content-tab.active { color: #5e3f14; }

/* ===== 搜索用户信息面板 ===== */

/* ===== 个人主页搜索（左侧弹窗） ===== */
.profile-search-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto 0;
  width: min(480px, 42vw);
  height: min(90vh, 960px);
  border-radius: 36px;
  border: 1px solid rgba(196, 142, 48, 0.34);
  background: linear-gradient(
    160deg,
    rgba(18, 23, 37, 0.97) 0%,
    rgba(31, 42, 64, 0.98) 56%,
    rgba(17, 25, 42, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(3, 7, 18, 0.72),
    0 0 0 1px rgba(255, 248, 232, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}
.profile-search-panel::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 28px;
  border: 1px solid rgba(199, 151, 60, 0.22);
  pointer-events: none;
  z-index: 0;
}
.profile-search-panel:not(.dark) {
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.98) 0%,
    rgba(240, 223, 191, 0.98) 52%,
    rgba(229, 206, 166, 0.98) 100%
  );
  border-color: rgba(196, 142, 48, 0.38);
  box-shadow:
    0 40px 80px -32px rgba(7, 11, 22, 0.5),
    0 0 0 1px rgba(255, 248, 232, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
}
.profile-search-panel:not(.dark)::before {
  border-color: rgba(199, 151, 60, 0.22);
}

.profile-search-header {
  position: relative;
  z-index: 1;
  padding: 28px 28px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 108px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}
.profile-search-panel:not(.dark) .profile-search-header {
  border-bottom-color: rgba(148, 111, 46, 0.18);
  background: linear-gradient(
    180deg,
    rgba(255, 252, 245, 0.42) 0%,
    rgba(255, 245, 227, 0.14) 100%
  );
}
.profile-search-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}
.profile-search-panel:not(.dark) .profile-search-header h3 {
  color: #3c2910;
}
.profile-search-count {
  font-size: 14px;
  font-weight: 400;
  opacity: 0.6;
}
.profile-search-header .close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
  min-width: 88px;
  height: 46px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(13, 19, 34, 0.82);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-search-header .close-btn:hover {
  background: rgba(26, 35, 58, 0.96);
  border-color: rgba(255, 255, 255, 0.36);
}
.profile-search-panel:not(.dark) .close-btn {
  border-color: rgba(255, 255, 255, 0.26);
  background: rgba(33, 22, 9, 0.76);
  color: #fffaf1;
}
.profile-search-panel:not(.dark) .close-btn:hover {
  background: rgba(53, 34, 13, 0.92);
  border-color: rgba(255, 255, 255, 0.42);
}

.profile-search-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding: 16px 10px 20px;
  scrollbar-width: none;
}
.profile-search-list .vscroll-item {
  left: 20px !important;
  right:20px !important;
}
.profile-search-list::-webkit-scrollbar {
  display: none;
}
.profile-search-panel:not(.dark) .panel-empty {
  color: #3c2910;
}
.profile-search-panel:not(.dark) .panel-item {
  border-color: rgba(164, 122, 48, 0.38);
}
.profile-search-panel:not(.dark) .item-author {
  color: #3c2910;
}
.profile-search-panel:not(.dark) .item-content {
  color: #2c2c2c;
}
.profile-search-panel:not(.dark) .item-time {
  color: #888;
}
.profile-search-panel:not(.dark) .item-footer {
  color: #666;
}
.profile-search-panel.dark .panel-item {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.18);
}
.profile-search-panel.dark .panel-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}
.profile-search-panel.dark .item-author {
  color: #ffffff;
}
.profile-search-panel.dark .item-content {
  color: rgba(255, 255, 255, 0.85);
}
.profile-search-panel.dark .item-time {
  color: rgba(255, 255, 255, 0.5);
}
.profile-search-panel.dark .item-footer {
  color: rgba(255, 255, 255, 0.5);
}
.profile-search-panel.dark .panel-empty {
  color: rgba(255, 255, 255, 0.6);
}

/* 搜索面板入场/出场动画 */
.profile-search-panel-enter-active,
.profile-search-panel-leave-active {
  transition: opacity 0.38s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
}
.profile-search-panel-enter-from,
.profile-search-panel-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

/* 搜索框样式 */
.profile-search-input-wrapper {
  position: relative;
  margin-bottom: 4px;
}
.profile-search-input {
  width: 100%;
  height: 38px;
  padding: 0 36px 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
}
.profile-search-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}
.profile-search-input:focus {
  border-color: rgba(199, 151, 60, 0.5);
  background: rgba(255, 255, 255, 0.09);
}
.search-clear-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.search-clear-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* 浅色模式搜索框 */
.user-sidebar:not(.dark) .profile-search-input,
.map-search-user-detail:not(.dark) .profile-search-input {
  border-color: rgba(164, 122, 48, 0.18);
  background: rgba(255, 253, 248, 0.74);
  color: #3c2910;
}
.user-sidebar:not(.dark) .profile-search-input::placeholder,
.map-search-user-detail:not(.dark) .profile-search-input::placeholder {
  color: rgba(94, 63, 20, 0.5);
}
.user-sidebar:not(.dark) .profile-search-input:focus,
.map-search-user-detail:not(.dark) .profile-search-input:focus {
  border-color: rgba(164, 122, 48, 0.4);
  background: rgba(255, 253, 248, 0.9);
}
.user-sidebar:not(.dark) .search-clear-btn,
.map-search-user-detail:not(.dark) .search-clear-btn {
  background: rgba(164, 122, 48, 0.15);
  color: #5e3f14;
}
.user-sidebar:not(.dark) .search-clear-btn:hover,
.map-search-user-detail:not(.dark) .search-clear-btn:hover {
  background: rgba(164, 122, 48, 0.3);
}

/* 搜索面板并排：主面板不闪，保持原尺寸平滑位移 */

.map-search-user-detail {
  transition: margin-left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-user-modal-shell.has-profile-search .map-search-user-detail {
  margin-left: -250px;
}

.user-modal-shell.has-profile-search .user-sidebar.show-sidebar {
  transform: translate(calc(-50% - 250px), -50%) scale(1) !important;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

/* 搜索面板绝对定位到个人主页右侧 */

/* 我的主页：profile 用 fixed + transform 偏移，右侧边 = 50% - 250px + P/2 */
.user-modal-shell .profile-search-panel {
  left: calc(50% - 230px + min(450px, (100vw - 48px) / 2));
}

/* 他人主页：profile 用 flex + margin-left 偏移，右侧边 = 50% + P/2 - 125px */
.search-user-modal-shell .profile-search-panel {
  left: calc(50% + min(450px, calc((100vw - 48px) / 2)) - 105px);
}

@media (max-width: 1200px) {
  .search-user-modal-shell.has-profile-search .map-search-user-detail {
    margin-left: -200px;
  }
  .user-modal-shell.has-profile-search .user-sidebar.show-sidebar {
    transform: translate(calc(-50% - 200px), -50%) scale(1) !important;
  }
  .user-modal-shell .profile-search-panel {
    left: calc(50% - 180px + min(450px, (100vw - 48px) / 2));
  }
  .search-user-modal-shell .profile-search-panel {
    left: calc(50% + min(450px, calc((100vw - 48px) / 2)) - 80px);
  }
}

@media (max-width: 700px) {
  .search-user-modal-shell.has-profile-search .map-search-user-detail {
    margin-left: 0;
  }
  .user-modal-shell.has-profile-search .user-sidebar.show-sidebar {
    transform: translate(-50%, -50%) scale(1) !important;
  }
  .search-user-modal-shell .profile-search-panel,
  .user-modal-shell .profile-search-panel {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    margin: 0;
    width: 100vw;
    height: 45vh;
    border-radius: 36px 36px 0 0;
  }
}
.search-user-profile {
  padding: 12px 8px 4px;
}
.search-user-profile .user-profile-new {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.search-user-profile .user-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  cursor: default;
}
.search-user-profile .user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.search-user-profile .user-identity-area {
  flex: 1;
  min-width: 0;
}
.search-user-profile .user-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.search-user-profile .user-display-name {
  font-size: 18px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.map-search-user-detail.dark .search-user-profile .user-display-name { color: #edf3ff; }
.map-search-user-detail:not(.dark) .search-user-profile .user-display-name { color: #3c2910; }
.search-user-profile .user-star-id {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.map-search-user-detail.dark .search-user-profile .user-star-id { color: #556677; }
.map-search-user-detail:not(.dark) .search-user-profile .user-star-id { color: #3c2910; }
.search-user-bio {
  cursor: default !important;
  margin-top: 12px;
}
.search-user-bio .bio-edit-icon { display: none; }
.search-user-profile .user-content-list {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: none;
  overscroll-behavior-y: contain;
}
.search-user-profile .user-content-list::-webkit-scrollbar {
  display: none;
}
.map-search-results-list {
  max-height: calc(100vh - 160px);
}

/* 使用 JS 控制模糊 */
.search-blur .map-search-bar,
.search-blur .map-search-results {
  filter: blur(4px);
  opacity: 0.6;
  transition: filter 0.3s ease, opacity 0.3s ease;
}
/* 搜索面板始终保持可交互，不受 blur 影响 */
.map-search-results {
  pointer-events: auto !important;
}
.map-search-bar {
  pointer-events: auto !important;
}

/* ===== 地点搜索结果项 ===== */
.search-place-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.search-place-item:hover {
  background: rgba(255, 255, 255, 0.06);
}
.search-place-icon {
  font-size: 22px;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 107, 107, 0.1);
}
.search-place-info {
  flex: 1;
  min-width: 0;
}
.search-place-name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.map-search-results.dark .search-place-name { color: #edf3ff; }
.map-search-results:not(.dark) .search-place-name { color: #1a1a2e; }
.search-place-addr {
  font-size: 12px;
  color: #8899aa;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.map-search-results:not(.dark) .search-place-addr { color: #666; }
.search-place-dist {
  font-size: 12px;
  color: #8899aa;
  flex-shrink: 0;
  white-space: nowrap;
}
.map-search-results:not(.dark) .search-place-dist { color: #999; }

/* ===== 纸飞机附近故事面板 ===== */
.plane-nearby-sidebar {
  position: fixed;
  left: 50%;
  top: 50%;
  bottom: auto;
  right: auto;
  width: min(860px, calc(100vw - 48px));
  height: min(90vh, 960px);
  border-radius: 32px;
  border: 1px solid rgba(196, 142, 48, 0.36);
  background: linear-gradient(
    160deg,
    rgba(18, 23, 37, 0.96) 0%,
    rgba(31, 42, 64, 0.97) 56%,
    rgba(17, 25, 42, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(3, 7, 18, 0.72),
    0 0 0 1px rgba(255, 248, 232, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transform: translate(-50%, -50%) scale(0.96);
  transition:
    transform 0.34s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.26s ease,
    visibility 0.26s ease;
  z-index: 340;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 亮色模式 - 与故事墙一致暖色调 */
.plane-nearby-sidebar:not(.dark) {
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.98) 0%,
    rgba(240, 223, 191, 0.98) 52%,
    rgba(229, 206, 166, 0.98) 100%
  );
  border-color: rgba(196, 142, 48, 0.38);
  box-shadow:
    0 40px 80px -32px rgba(7, 11, 22, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.66);
  color: #3c2910;
}

.publish-modal-enter-active .plane-nearby-sidebar,
.publish-modal-leave-active .plane-nearby-sidebar {
  transition:
    transform 0.34s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.26s ease;
}
.publish-modal-enter-from .plane-nearby-sidebar {
  transform: translate(-50%, -50%) scale(0.9);
  opacity: 0;
}
.publish-modal-leave-to .plane-nearby-sidebar {
  transform: translate(-50%, -50%) scale(0.9);
  opacity: 0;
}

.plane-nearby-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.plane-nearby-sidebar:not(.dark) .plane-nearby-header {
  border-bottom-color: rgba(148, 111, 46, 0.18);
}

.plane-nearby-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.plane-nearby-header__icon {
  font-size: 22px;
}
.plane-nearby-header h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}
.plane-nearby-sidebar.dark .plane-nearby-header h3 { color: #edf3ff; }
.plane-nearby-sidebar:not(.dark) .plane-nearby-header h3 { color: #3c2910; }

.plane-nearby-sidebar .close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #ccc;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.plane-nearby-sidebar:not(.dark) .close-btn {
  background: rgba(196, 142, 48, 0.15);
  color: #5c3a13;
}
.plane-nearby-sidebar .close-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}
.plane-nearby-sidebar:not(.dark) .close-btn:hover {
  background: rgba(196, 142, 48, 0.28);
}

.plane-nearby-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 24px 24px;
  position: relative;
  /* 隐藏滚动条但保留滚轮功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.plane-nearby-content::-webkit-scrollbar {
  display: none;
}

.plane-nearby-sidebar .map-search-empty {
  text-align: center;
  padding: 16px 0;
  font-size: 13px;
}
.plane-nearby-sidebar.dark .map-search-empty { color: #667788; }
.plane-nearby-sidebar:not(.dark) .map-search-empty { color: rgba(75, 48, 16, 0.78); }

.plane-nearby-sidebar .loading,
.plane-nearby-sidebar .empty {
  text-align: center;
  padding: 40px 20px;
  font-size: 14px;
}
.plane-nearby-sidebar.dark .loading,
.plane-nearby-sidebar.dark .empty { color: #8899aa; }
.plane-nearby-sidebar:not(.dark) .loading,
.plane-nearby-sidebar:not(.dark) .empty { color: #3c2910; }
.plane-nearby-sidebar .empty .hint {
  font-size: 12px;
  color: #667788;
  margin-top: 6px;
}
.plane-nearby-sidebar:not(.dark) .empty .hint { color: rgba(75, 48, 16, 0.78); }

/* 纸飞机附近面板 - Grid 布局 */
.plane-nearby-sidebar .story-wall-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-bottom: 20px;
}
@media (max-width: 480px) {
  .plane-nearby-sidebar .story-wall-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.plane-nearby-sidebar .wall-loading-more {
  text-align: center;
  padding: 16px 0;
  font-size: 13px;
}
.plane-nearby-sidebar.dark .wall-loading-more { color: #667788; }
.plane-nearby-sidebar:not(.dark) .wall-loading-more { color: rgba(75, 48, 16, 0.78); }
</style>

<style>
.paper-plane-menu {
  position: fixed;
  z-index: 1200;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  padding: 6px;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: auto;
  min-width: 120px;
}
.paper-plane-menu.dark {
  background: #000000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}
.paper-plane-menu::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  width: 12px;
  height: 12px;
  background: inherit;
  border-radius: 2px;
  transform: translateX(-50%) rotate(45deg);
}
.plane-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  color: #000;
  transition: background 0.15s;
  user-select: none;
}
.paper-plane-menu.dark .plane-menu-item {
  color: #fff;
}
.plane-menu-item[data-action="nearby"] {
  background: #FF6B6B;
  border-radius: 10px;
  color: #fff;
}
.plane-menu-item[data-action="publish"] {
  background: #FF9E9E;
  border-radius: 10px;
  color: #fff;
}
.paper-plane-menu.dark .plane-menu-item[data-action="nearby"],
.paper-plane-menu.dark .plane-menu-item[data-action="publish"] {
  color: #fff;
}
.plane-menu-item:hover {
  filter: brightness(1.1);
}
.plane-menu-item svg {
  flex-shrink: 0;
  opacity: 0.85;
}

/* 地图筛选入口改为右下角展开 */
.map-filter-toggle {
  position: fixed;
  right: 268px;
  bottom: 32px;
  z-index: 201;
  min-width: 154px;
  height: 76px;
  padding: 0 20px 0 16px;
  border: 1px solid rgba(255, 248, 231, 0.34);
  border-radius: 24px;
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.22) 0%,
      transparent 44%
    ),
    linear-gradient(
      135deg,
      rgba(183, 108, 58, 0.94) 0%,
      rgba(204, 137, 77, 0.97) 48%,
      rgba(118, 78, 45, 0.94) 100%
    );
  box-shadow: 0 18px 40px rgba(72, 41, 15, 0.28);
  color: #fffaf1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  cursor: pointer;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
}

.map-filter-toggle:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 44px rgba(72, 41, 15, 0.34);
}

.map-filter-toggle.active {
  border-color: rgba(255, 242, 208, 0.72);
  box-shadow: 0 24px 52px rgba(72, 41, 15, 0.38);
}

.map-filter-toggle.dark {
  border-color: rgba(194, 214, 255, 0.18);
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.16) 0%,
      transparent 44%
    ),
    linear-gradient(
      135deg,
      rgba(28, 34, 63, 0.96) 0%,
      rgba(40, 56, 96, 0.96) 48%,
      rgba(16, 22, 44, 0.98) 100%
    );
  box-shadow: 0 18px 40px rgba(5, 8, 20, 0.42);
}

.map-filter-toggle.dark:hover {
  box-shadow: 0 22px 44px rgba(5, 8, 20, 0.48);
}

.map-filter-toggle.dark.active {
  border-color: rgba(226, 238, 255, 0.56);
  box-shadow: 0 24px 52px rgba(5, 8, 20, 0.54);
}

.map-filter-toggle__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.map-filter-toggle__text {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .map-filter-toggle {
    right: 14px;
    bottom: 116px;
    min-width: 148px;
  }
}
</style>
