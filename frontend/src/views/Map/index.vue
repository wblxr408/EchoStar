<template>
  <div class="map-page" @click="handlePageClick">
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
    <div class="map-container">
      <AMap
        ref="amapRef"
        :stories="mapStore.stories"
        :clusters="clusters"
        :user-location="mapStore.userLocation"
        :center="mapStore.center"
        :zoom="mapStore.zoom"
        :theme="effectiveMapTheme"
        :point-pick-mode="isPickingPublishLocation"
        :temp-picked-location="pickedPublishLocation"
        @marker-click="handleMarkerClick"
        @map-click="handlePublishMapClick"
        @map-move="handleMapMove"
        @cluster-click="handleClusterClick"
        @theme-change="handleThemeChange"
      />
    </div>

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
                :class="{ active: sidebarTab === 'nearby' }"
                @click="sidebarTab = 'nearby'"
              >
                附近故事
              </button>
              <button
                class="tab-btn"
                :class="{ active: sidebarTab === 'featured' }"
                @click="
                  sidebarTab = 'featured';
                  loadFeaturedStories();
                "
              >
                精选推荐
              </button>
              <button
                class="tab-btn"
                :class="{ active: sidebarTab === 'recommend' }"
                @click="
                  sidebarTab = 'recommend';
                  loadRecommendationFeed();
                "
              >
                为你推荐
              </button>
            </div>
            <button class="close-btn" @click.stop="closeStoryPanel">
              <span>×</span>
            </button>
          </div>

          <div class="sidebar-content">
            <div v-if="sidebarTab === 'nearby'">
              <section class="nearby-search-panel">
                <div class="nearby-search-panel__heading">
                  <div>
                    <p class="nearby-search-panel__kicker">Place Search</p>
                    <h3>搜索附近地点</h3>
                    <p class="nearby-search-panel__summary">
                      {{ nearbyCenterSummary }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="nearby-search-panel__ghost-btn"
                    @click="handleLocate"
                  >
                    我的定位
                  </button>
                </div>

                <div class="nearby-search-panel__controls">
                  <input
                    v-model="nearbySearchQuery"
                    type="text"
                    class="nearby-search-panel__input"
                    placeholder="搜索商圈、地标、街道或店铺"
                    @keyup.enter="performNearbyPoiSearch"
                  />
                  <button
                    type="button"
                    class="nearby-search-panel__submit"
                    :disabled="
                      nearbySearching || nearbySearchQuery.trim().length < 2
                    "
                    @click="performNearbyPoiSearch"
                  >
                    {{ nearbySearching ? "搜索中..." : "搜索地点" }}
                  </button>
                </div>

                <div class="nearby-search-panel__actions">
                  <button
                    v-if="
                      nearbySearchQuery ||
                      nearbySearchResults.length > 0 ||
                      nearbySearchError
                    "
                    type="button"
                    class="nearby-search-panel__text-btn"
                    @click="clearNearbyPoiSearch"
                  >
                    清空搜索
                  </button>
                  <span class="nearby-search-panel__tip"
                    >会优先参考附近结果，但明确地标也能跳出本地</span
                  >
                </div>

                <p
                  v-if="nearbySearchError"
                  class="nearby-search-panel__feedback nearby-search-panel__feedback--error"
                >
                  {{ nearbySearchError }}
                </p>
                <p
                  v-else-if="nearbySearching"
                  class="nearby-search-panel__feedback"
                >
                  正在查找相关地点...
                </p>
                <p
                  v-else-if="
                    nearbyHasSearched && nearbySearchResults.length === 0
                  "
                  class="nearby-search-panel__feedback"
                >
                  没找到匹配地点，可以换个关键词，或者直接拖动地图继续找。
                </p>

                <div
                  v-if="nearbySearchResults.length > 0"
                  class="nearby-search-panel__results"
                >
                  <button
                    v-for="poi in nearbySearchResults"
                    :key="poi.id"
                    type="button"
                    class="nearby-search-panel__result"
                    @click="focusNearbyStoriesOnPoi(poi)"
                  >
                    <div class="nearby-search-panel__result-copy">
                      <strong>{{ poi.name }}</strong>
                      <span>{{ poi.address }}</span>
                    </div>
                    <div class="nearby-search-panel__result-meta">
                      <span>{{ formatPoiDistrictLabel(poi) }}</span>
                    </div>
                  </button>
                </div>
              </section>

              <div v-if="loading" class="loading">加载中...</div>
              <div v-else-if="stories.length === 0" class="empty">
                <p>附近还没有故事</p>
                <p class="hint">点击发布按钮,留下你的第一个故事吧</p>
              </div>
              <div v-else class="story-list">
                <StoryCard
                  v-for="story in stories"
                  :key="story.id"
                  :story="story"
                  @preview-image="handlePreviewImage"
                  @select-story="openStoryFromCollection"
                />
              </div>
            </div>

            <div v-if="sidebarTab === 'recommend'">
              <div v-if="feedLoading" class="loading">加载中...</div>
              <div v-else-if="feedStories.length === 0" class="empty">
                <p>暂无推荐内容</p>
                <p class="hint">
                  发布故事或点赞更多内容，会为你推荐更懂你的故事
                </p>
              </div>
              <div v-else class="story-list">
                <StoryCard
                  v-for="story in feedStories"
                  :key="story.id"
                  :story="story"
                  @preview-image="handlePreviewImage"
                  @select-story="openStoryFromCollection"
                />
                <div v-if="feedHasMore" class="load-more-wrap">
                  <button
                    class="load-more-btn"
                    :disabled="feedLoadingMore"
                    @click="loadMoreFeed"
                  >
                    {{ feedLoadingMore ? "加载中..." : "加载更多" }}
                  </button>
                </div>
              </div>
            </div>

            <div v-if="sidebarTab === 'featured'">
              <div v-if="featuredStories.length === 0" class="empty">
                <p>暂无精选内容</p>
                <p class="hint">管理员会定期挑选优质内容展示在这里</p>
              </div>
              <div v-else class="story-list">
                <div
                  v-for="story in featuredStories"
                  :key="story.id"
                  class="featured-story-card"
                  @click="openFeaturedStory(story)"
                >
                  <div v-if="story.images?.length" class="featured-image">
                    <img :src="story.images[0]" alt="故事图片" />
                    <div class="featured-badges">
                      <span v-if="story.isPinned" class="badge pinned">📌</span>
                    </div>
                  </div>
                  <div class="featured-content">
                    <div class="featured-author">
                      <div class="featured-author-avatar">
                        <img
                          v-if="getStoryAuthorAvatar(story)"
                          :src="getStoryAuthorAvatar(story)"
                          :alt="getStoryAuthorName(story)"
                        />
                        <span v-else>{{ getStoryAuthorInitial(story) }}</span>
                      </div>
                      <span class="featured-author-name">{{
                        getStoryAuthorName(story)
                      }}</span>
                    </div>
                    <p class="featured-text">{{ story.content }}</p>
                    <div class="featured-meta">
                      <span class="emotion">{{
                        getEmotionEmoji(story.emotionTag || story.emotion)
                      }}</span>
                      <span class="stats"
                        >❤️ {{ story.likeCount || story.likes || 0 }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <div
      :class="[
        'dock-container',
        effectiveMapTheme === 'dark' ? 'dock-dark' : 'dock-light',
        {
          'show-publish-sidebar': showPublishSidebar,
          'show-user-sidebar': showUserSidebar,
          expanded: isDockExpanded,
          locked: isPickingPublishLocation,
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

      <div class="dock-menu" :class="{ expanded: isDockExpanded }">
        <div
          class="dock-card-stack"
          :class="{
            'selection-motion': Boolean(
              selectedDockCard ||
              drawingDockCard ||
              liftingDockCard ||
              returningDockCard,
            ),
          }"
          :style="getDockStackStyle(visibleDockActions.length)"
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
              class="dock-card-anchor"
              :style="
                getDockCardStyle(index, visibleDockActions.length, action)
              "
              aria-hidden="true"
              @mouseenter="setDockHover(action.key)"
              @mouseleave="scheduleClearDockHover"
            ></span>

            <button
              class="dock-card"
              :class="{
                drawing: drawingDockCard === action.key,
                lifting: liftingDockCard === action.key,
                active: selectedDockCard === action.key,
                returning: returningDockCard === action.key,
                disabled: action.disabled,
                rippling: ripplingDockCard === action.key,
              }"
              :style="
                getDockCardStyle(index, visibleDockActions.length, action)
              "
              :disabled="action.disabled || isPickingPublishLocation"
              :title="action.title"
              type="button"
              @mouseenter="setDockHover(action.key)"
              @mouseleave="scheduleClearDockHover"
              @click.stop="handleDockCardClick(action)"
            >
              <div class="dock-card-body">
                <span class="dock-card-suit suit-top">{{ action.suit }}</span>
                <span class="dock-card-order">{{
                  String(index + 1).padStart(2, "0")
                }}</span>
                <span class="dock-card-corner corner-top-right"></span>
                <span class="dock-card-corner corner-bottom-left"></span>

                <div class="dock-card-face">
                  <span class="dock-card-pattern"></span>
                  <span class="dock-card-icon">{{ action.icon }}</span>
                  <span class="dock-card-title">{{ action.title }}</span>
                  <span class="dock-card-subtitle">{{ action.subtitle }}</span>
                </div>

                <span class="dock-card-suit suit-bottom">{{
                  action.suit
                }}</span>
              </div>
              <span class="dock-card-ripple"></span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <transition name="publish-modal">
      <div
        v-if="showPublishSidebar"
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
                :map-center="mapStore.center"
                :user-location="mapStore.userLocation"
                :suggested-locations="suggestedPublishLocations"
                :picked-map-location="pickedPublishLocation"
                :is-picking-location="isPickingPublishLocation"
                :map-theme="effectiveMapTheme"
                @submit="handlePublishSubmit"
                @request-map-pick="startPublishMapPick"
                @cancel-map-pick="cancelPublishMapPick"
                @cancel="closePublishPanel"
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
    </transition>

    <transition name="publish-modal">
      <div v-if="showUserSidebar" class="user-modal-shell">
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
            <div class="user-profile">
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
              <div class="user-info-details">
                <div class="info-item editable">
                  <span class="info-label">用户名</span>
                  <div v-if="!isEditingUsername" class="info-value-with-edit">
                    <span class="info-value">{{
                      userStore.user?.username ||
                      userStore.user?.name ||
                      "未设置"
                    }}</span>
                    <button
                      class="edit-btn"
                      @click="startEditUsername"
                      title="修改用户名"
                    >
                      <span>✏️</span>
                    </button>
                  </div>
                  <div v-else class="username-edit-form">
                    <input
                      v-model="editingUsername"
                      type="text"
                      placeholder="输入新用户名"
                      maxlength="20"
                      @keyup.enter="saveUsername"
                      @keyup.esc="cancelEditUsername"
                    />
                    <div class="username-actions">
                      <button
                        class="save-btn"
                        :disabled="!canSaveUsername"
                        @click="saveUsername"
                      >
                        <span v-if="checkingUsername">⌛</span>
                        <span v-else>✓</span>
                      </button>
                      <button class="cancel-btn" @click="cancelEditUsername">
                        <span>✕</span>
                      </button>
                    </div>
                    <div v-if="usernameError" class="username-error">
                      {{ usernameError }}
                    </div>
                  </div>
                </div>
                <div class="info-item">
                  <span class="info-label">用户ID</span>
                  <span class="info-value">{{ userStore.user?.id ?? "" }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">邮箱</span>
                  <span class="info-value">{{
                    userStore.user?.email ?? ""
                  }}</span>
                </div>
                <div class="info-item editable">
                  <span class="info-label">密码</span>
                  <div v-if="!isEditingPassword" class="info-value-with-edit">
                    <span class="info-value">点击右侧按钮修改密码</span>
                    <button
                      class="edit-btn"
                      @click="startEditPassword"
                      title="修改密码"
                    >
                      <span>✏️</span>
                    </button>
                  </div>
                  <div v-else class="password-edit-form">
                    <div class="password-input-wrapper">
                      <input
                        v-model="passwordForm.currentPassword"
                        :type="showCurrentPassword ? 'text' : 'password'"
                        placeholder="当前密码"
                        :class="{ 'input-error': currentPasswordError }"
                      />
                      <button
                        class="eye-btn-small"
                        @click="showCurrentPassword = !showCurrentPassword"
                      >
                        <span>{{ showCurrentPassword ? "🙈" : "👁️" }}</span>
                      </button>
                    </div>
                    <div v-if="currentPasswordError" class="field-error">
                      {{ currentPasswordError }}
                    </div>
                    <div class="password-input-wrapper">
                      <input
                        v-model="passwordForm.newPassword"
                        :type="showNewPassword ? 'text' : 'password'"
                        placeholder="新密码（至少6位）"
                        minlength="6"
                        :class="{ 'input-error': newPasswordError }"
                      />
                      <button
                        class="eye-btn-small"
                        @click="showNewPassword = !showNewPassword"
                      >
                        <span>{{ showNewPassword ? "🙈" : "👁️" }}</span>
                      </button>
                    </div>
                    <div v-if="newPasswordError" class="field-error">
                      {{ newPasswordError }}
                    </div>
                    <div class="password-input-wrapper">
                      <input
                        v-model="passwordForm.confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        placeholder="确认新密码"
                        minlength="6"
                        :class="{ 'input-error': confirmPasswordError }"
                        @keyup.enter="savePassword"
                        @keyup.esc="cancelEditPassword"
                      />
                      <button
                        class="eye-btn-small"
                        @click="showConfirmPassword = !showConfirmPassword"
                      >
                        <span>{{ showConfirmPassword ? "🙈" : "👁️" }}</span>
                      </button>
                    </div>
                    <div v-if="confirmPasswordError" class="field-error">
                      {{ confirmPasswordError }}
                    </div>
                    <div class="password-actions">
                      <button
                        class="save-btn"
                        :disabled="!canSavePassword || savingPassword"
                        @click="savePassword"
                      >
                        <span v-if="savingPassword">⌛</span>
                        <span v-else>✓</span>
                      </button>
                      <button class="cancel-btn" @click="cancelEditPassword">
                        <span>✕</span>
                      </button>
                    </div>
                    <div v-if="passwordError" class="password-error">
                      {{ passwordError }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="user-actions">
              <button
                class="user-action-btn my-likes-btn"
                :class="{ active: showLikesPanel }"
                @click.stop="handleMyLikes"
              >
                <span class="btn-icon">❤️</span>
                <span class="btn-text">我的点赞</span>
              </button>
              <button
                class="user-action-btn my-favorites-btn"
                :class="{ active: showFavoritesPanel }"
                @click.stop="handleMyFavorites"
              >
                <span class="btn-icon">⭐</span>
                <span class="btn-text">我的收藏</span>
              </button>
              <button
                class="user-action-btn my-posts-btn"
                :class="{ active: showPostsPanel }"
                @click.stop="handleMyPosts"
              >
                <span class="btn-icon">📝</span>
                <span class="btn-text">我的发布</span>
              </button>
              <button
                class="user-action-btn logout-action-btn"
                @click="handleLogout"
              >
                <span class="btn-icon">🚪</span>
                <span class="btn-text">退出登录</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <div
      class="user-sub-sidebar likes-panel"
      :class="{
        'show-panel': showLikesPanel,
        dark: effectiveMapTheme === 'dark',
      }"
      @click.stop
    >
      <div class="sub-sidebar-header">
        <h4>我的点赞</h4>
        <button class="close-btn" @click.stop="showLikesPanel = false">
          <span>×</span>
        </button>
      </div>
      <div class="sub-sidebar-content" @scroll="handleLikesScroll">
        <div
          v-if="likesLoading && likesList.length === 0"
          class="panel-loading"
        >
          <span class="loading-spinner">⌛</span>
          <span>加载中...</span>
        </div>
        <div v-else-if="likesList.length === 0" class="panel-empty">
          <span class="empty-icon">💝</span>
          <span>还没有点赞任何故事</span>
        </div>
        <div v-else class="panel-list">
          <div
            v-for="story in likesList"
            :key="story.id"
            class="panel-item"
            @click="handleStoryClick(story)"
          >
            <div class="item-header">
              <img :src="story.avatar" class="item-avatar" alt="头像" />
              <div class="item-meta">
                <span class="item-author">{{ getStoryAuthorName(story) }}</span>
                <span class="item-time">{{
                  formatRelativeTime(story.createdAt)
                }}</span>
              </div>
              <button
                class="item-action-btn unlike-btn"
                title="取消点赞"
                @click.stop="handleUnlike(story)"
              >
                <span>💔</span>
              </button>
            </div>
            <p class="item-content">{{ story.content }}</p>
            <div v-if="story.images?.length" class="item-images">
              <img :src="story.images[0]" alt="配图" />
            </div>
            <div class="item-footer">
              <span class="item-location"
                >📍 {{ getStoryLocationText(story) }}</span
              >
              <span class="item-likes"
                >❤️ {{ story.likeCount ?? story.likes ?? 0 }}</span
              >
              <span class="item-likes">⭐️ {{ story.favoriteCount ?? 0 }}</span>
            </div>
          </div>
          <div v-if="likesLoadingMore" class="panel-loading-more">
            <span class="loading-spinner">⌛</span>
            <span>加载更多...</span>
          </div>
          <div
            v-if="!likesHasMore && likesList.length > 0"
            class="panel-no-more"
          >
            <span>没有更多了</span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="user-sub-sidebar posts-panel"
      :class="{
        'show-panel': showPostsPanel,
        dark: effectiveMapTheme === 'dark',
      }"
      @click.stop
    >
      <div class="sub-sidebar-header">
        <h4>我的发布</h4>
        <button class="close-btn" @click.stop="showPostsPanel = false">
          <span>×</span>
        </button>
      </div>
      <div class="sub-sidebar-content" @scroll="handlePostsScroll">
        <div
          v-if="postsLoading && postsList.length === 0"
          class="panel-loading"
        >
          <span class="loading-spinner">⌛</span>
          <span>加载中...</span>
        </div>
        <div v-else-if="postsList.length === 0" class="panel-empty">
          <span class="empty-icon">📝</span>
          <span>还没有发布任何故事</span>
        </div>
        <div v-else class="panel-list">
          <div
            v-for="story in postsList"
            :key="story.id"
            class="panel-item"
            @click="handleStoryClick(story)"
          >
            <div class="item-header">
              <img :src="story.avatar" class="item-avatar" alt="头像" />
              <div class="item-meta">
                <span class="item-author">{{ getStoryAuthorName(story) }}</span>
                <span class="item-time">{{
                  formatRelativeTime(story.createdAt)
                }}</span>
              </div>
              <button
                class="item-action-btn delete-btn"
                title="删除故事"
                @click.stop="handleDeleteStory(story)"
              >
                <span>🗑️</span>
              </button>
            </div>
            <p class="item-content">{{ story.content }}</p>
            <div v-if="story.images?.length" class="item-images">
              <img :src="story.images[0]" alt="配图" />
            </div>
            <div class="item-footer">
              <span class="item-location"
                >📍 {{ getStoryLocationText(story) }}</span
              >
              <span class="item-likes"
                >❤️ {{ story.likeCount ?? story.likes ?? 0 }}</span
              >
              <span class="item-likes">⭐️ {{ story.favoriteCount ?? 0 }}</span>
            </div>
          </div>
          <div v-if="postsLoadingMore" class="panel-loading-more">
            <span class="loading-spinner">⌛</span>
            <span>加载更多...</span>
          </div>
          <div
            v-if="!postsHasMore && postsList.length > 0"
            class="panel-no-more"
          >
            <span>没有更多了</span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="user-sub-sidebar favorites-panel"
      :class="{
        'show-panel': showFavoritesPanel,
        dark: effectiveMapTheme === 'dark',
      }"
      @click.stop
    >
      <div class="sub-sidebar-header">
        <h4>我的收藏</h4>
        <button class="close-btn" @click.stop="showFavoritesPanel = false">
          <span>×</span>
        </button>
      </div>
      <div class="sub-sidebar-content" @scroll="handleFavoritesScroll">
        <div
          v-if="favoritesLoading && favoritesList.length === 0"
          class="panel-loading"
        >
          <span class="loading-spinner">⌛</span>
          <span>加载中...</span>
        </div>
        <div v-else-if="favoritesList.length === 0" class="panel-empty">
          <span class="empty-icon">⭐</span>
          <span>还没有收藏任何故事</span>
        </div>
        <div v-else class="panel-list">
          <div
            v-for="story in favoritesList"
            :key="story.id"
            class="panel-item"
            @click="handleStoryClick(story)"
          >
            <div class="item-header">
              <img :src="story.avatar" class="item-avatar" alt="头像" />
              <div class="item-meta">
                <span class="item-author">{{ getStoryAuthorName(story) }}</span>
                <span class="item-time">{{
                  formatRelativeTime(story.createdAt)
                }}</span>
              </div>
              <button
                class="item-action-btn unfavorite-btn"
                :class="{ 'is-restorable': story.isFavorited === false }"
                :title="story.isFavorited !== false ? '取消收藏' : '重新收藏'"
                @click.stop="handleToggleFavoriteFromList(story)"
              >
                <span>{{ story.isFavorited !== false ? "★" : "☆" }}</span>
              </button>
            </div>
            <p class="item-content">{{ story.content }}</p>
            <div v-if="story.images?.length" class="item-images">
              <img :src="story.images[0]" alt="配图" />
            </div>
            <div class="item-footer">
              <span class="item-location"
                >📍 {{ getStoryLocationText(story) }}</span
              >
              <span class="item-likes"
                >❤️ {{ story.likeCount ?? story.likes ?? 0 }}</span
              >
              <span class="item-likes">⭐️ {{ story.favoriteCount ?? 0 }}</span>
            </div>
          </div>
          <div v-if="favoritesLoadingMore" class="panel-loading-more">
            <span class="loading-spinner">⌛</span>
            <span>加载更多...</span>
          </div>
          <div
            v-if="!favoritesHasMore && favoritesList.length > 0"
            class="panel-no-more"
          >
            <span>没有更多了</span>
          </div>
        </div>
      </div>
    </div>

    <div class="project-title"></div>

    <PaperPlaneStory
      v-if="selectedStory"
      :story="selectedStory"
      :like-pending="storyLikePending"
      :favorite-pending="storyFavoritePending"
      :start-position="storyStartPosition"
      :direct-open="storyDirectOpen"
      @close="closeStoryModal"
      @preview-image="handlePreviewImage"
      @like="toggleStoryLike"
      @favorite="toggleStoryFavorite"
      @comment="handleStoryComment"
      @submit-comment="handleSubmitCommentFromStory"
      @report="handleStoryReport"
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

    <LoginModal v-if="showLoginModal" @close="showLoginModal = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useMapStore } from "../../stores/map";
import { useUserStore } from "../../stores/user";
import PaperPlaneStory from "../../components/PaperPlaneStory.vue";
import { mapApi } from "../../api/map";
import { likeApi } from "../../api/like";
import { commentApi } from "../../api/comment";
import { storyApi } from "../../api/story";
import { favoriteApi } from "../../api/favorite";
import { authApi } from "../../api/auth";
import { reportApi } from "../../api/report";
import { notificationApi } from "../../api/notification";
import { showToast, showConfirm } from "../../composables/useToast.js";
import AMap from "../../components/AMap.vue";
import StoryCard from "../../components/StoryCard.vue";
import PublishForm from "../../components/PublishForm.vue";
import LoginModal from "../Home/components/LoginModal.vue";
import { formatRelativeTime } from "../../utils/time";
import { getEmotionEmoji } from "../../utils/emotion";
import { getAnnouncementTypeIcon } from "../../utils/announcement";
import { searchPoisWithContext } from "../../utils/poiSearch";
import { REPORT_TYPES } from "../../utils/report";
import { uploadAvatar as uploadToOSS, validateImage } from "../../utils/upload";

const mapStore = useMapStore();
const userStore = useUserStore();

const clusters = ref([]);

const showSidebar = ref(false);
const showPublishSidebar = ref(false);
const showUserSidebar = ref(false);
const isPickingPublishLocation = ref(false);
const pickedPublishLocation = ref(null);
const suggestedPublishLocations = ref([]);
const publishPickPrompt = ref(null);
const showLoginModal = ref(false);
const showNotificationPanel = ref(false);
const notificationTab = ref("messages");
const notifications = ref([]);
const notificationsLoading = ref(false);
const notificationUnreadCount = ref(0);
const announcementsLoading = ref(false);
const loading = ref(false);
const nearbySearchQuery = ref("");
const nearbySearchResults = ref([]);
const nearbySearching = ref(false);
const nearbySearchError = ref("");
const nearbyHasSearched = ref(false);
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
const selectedStory = ref(null);
const storyStartPosition = ref({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
});
const storyDirectOpen = ref(true); // `false` 时从地图起点飞入
const mapTheme = ref(localStorage.getItem("mapTheme") || "auto");
const amapRef = ref(null);
const minuteTicker = ref(0);
const isDockExpanded = ref(false);

function getTimeBasedTheme() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}
const effectiveMapTheme = computed(() => {
  void minuteTicker.value;
  if (mapTheme.value === "light" || mapTheme.value === "dark") {
    return mapTheme.value;
  }
  return getTimeBasedTheme();
});
const nearbyCenterSummary = computed(() => {
  if (!nearbyCenterLabel.value) {
    return "会优先参考你附近的结果，遇到明确地标时也会保留全局最佳匹配。";
  }

  return `当前显示的是 ${nearbyCenterLabel.value} 附近的故事。`;
});
const hoveredDockCard = ref("");
const selectedDockCard = ref("");
const drawingDockCard = ref("");
const liftingDockCard = ref("");
const returningDockCard = ref("");
const ripplingDockCard = ref("");
const dockActionPending = ref(false);
const isDarkMap = computed(() => effectiveMapTheme.value === "dark");
let dockHoverClearTimer = null;
let dockSelectionTimer = null;
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

const DOCK_CARD_PREP_MS = 120;
const DOCK_CARD_DRAW_MS = 250;
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
const likesPageSize = 10;
const postsPageSize = 10;
const favoritesPageSize = 10;

const sidebarTab = ref("nearby");
const featuredStories = ref([]);
const announcements = ref([]);

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
    author,
    avatar: firstNonEmptyString(commentUser?.avatar, comment.avatar),
    content: firstNonEmptyString(comment.content),
    createdAt: comment.createdAt || new Date().toISOString(),
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
  handleStoryLike({ storyId, liked: nextLiked, likeCount: nextCount });

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
    });
  } catch (error) {
    console.error("点赞失败:", error);
    storyIsLiked.value = previousLiked;
    storyLikeCount.value = previousCount;
    handleStoryLike({
      storyId,
      liked: previousLiked,
      likeCount: previousCount,
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
    const response = await commentApi.create(storyId, content);
    const data = response?.data ?? response;
    const newComment = normalizeStoryComment({
      ...(data?.data ?? data),
      content,
      user: {
        username: userStore.user?.username,
        avatar: userStore.user?.avatar,
      },
    });

    storyComments.value = [newComment, ...storyComments.value];
    handleStoryComment({ storyId, comment: newComment });
    storyCommentDraft.value = "";
    storyCommentComposerOpen.value = false;
  } catch (error) {
    console.error("评论失败:", error);
    showToast(error.message || "评论失败，请重试", "error");
  } finally {
    storyCommentSubmitting.value = false;
  }
}

async function handleSubmitCommentFromStory({ storyId, content }) {
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
    const response = await commentApi.create(storyId, content);
    const data = response?.data ?? response;
    const newComment = normalizeStoryComment({
      ...(data?.data ?? data),
      content,
      user: {
        username: userStore.user?.username,
        avatar: userStore.user?.avatar,
      },
    });

    storyComments.value = [newComment, ...storyComments.value];
    handleStoryComment({ storyId, comment: newComment });
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
    description: "打开发布面板，把此刻的情绪和位置写进地图里。",
    icon: "✦",
    suit: "♦",
    accent: "#ff7a59",
    accentSoft: "rgba(255, 122, 89, 0.24)",
    ink: isDarkMap.value ? "#eef3ff" : "#432013",
    visible: !showPublishSidebar.value,
    disabled: false,
    handler: handlePublishClick,
  },
  {
    key: "stories",
    tag: "Story Wall",
    title: "附近故事",
    subtitle: "打开故事墙",
    description: "展开右侧故事墙，继续浏览附近故事、精选内容和公告。",
    icon: "✉",
    suit: "♣",
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
    suit: "♠",
    accent: "#f2a93b",
    accentSoft: "rgba(242, 169, 59, 0.24)",
    ink: isDarkMap.value ? "#eef3ff" : "#3e2811",
    visible: true,
    disabled: randomWalking.value,
    handler: handleRandomWalk,
  },
  {
    key: "locate",
    tag: "Position Sync",
    title: "回到我的位置",
    subtitle: "重新对准当前位置",
    description: "使用当前位置重新定位地图，把视角迅速拉回你所在的地方。",
    icon: "◎",
    suit: "♣",
    accent: "#2cb67d",
    accentSoft: "rgba(44, 182, 125, 0.24)",
    ink: isDarkMap.value ? "#eef3ff" : "#123127",
    visible: true,
    disabled: false,
    handler: handleLocate,
  },
  {
    key: "theme",
    tag: "Theme Shift",
    title: effectiveMapTheme.value === "dark" ? "切到浅色地图" : "切到深色地图",
    subtitle: "切换当前场景氛围",
    description:
      effectiveMapTheme.value === "dark"
        ? "把地图切回更明亮的视觉主题。"
        : "切到更沉浸的深色地图主题。",
    icon: effectiveMapTheme.value === "dark" ? "☀" : "☾",
    suit: "♣",
    accent: "#8e6cff",
    accentSoft: "rgba(142, 108, 255, 0.24)",
    ink: isDarkMap.value ? "#eef3ff" : "#241a3f",
    visible: true,
    disabled: false,
    handler: toggleTheme,
  },
  {
    key: "user",
    tag: "Profile",
    title: "我的信息",
    subtitle: "查看个人信息",
    description: "打开个人信息面板，查看头像、点赞、发布记录和账号设置。",
    icon: "◈",
    suit: "♥",
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
    suit: "♠",
    accent: "#e0677f",
    accentSoft: "rgba(224, 103, 127, 0.26)",
    ink: isDarkMap.value ? "#eef3ff" : "#341723",
    visible: true,
    disabled: false,
    handler: handleLogout,
  },
]);

const visibleDockActions = computed(() =>
  dockActions.value.filter((action) => action.visible),
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
    hoveredDockCard.value = "";
    dockHoverClearTimer = null;
    syncDockHoverSelection();
  }, 70);
}

function handleDockCardClick(action) {
  if (isPickingPublishLocation.value) {
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

function getDockLayoutMetrics(index, total, actionKey = "") {
  const visibleCount = Math.max(total, 1);
  const cardWidth = 244;
  const cardStep = 148;
  const cardHeight = 344;
  const compressedStep = 74;
  const gapClearance = 28;
  const stackWidth = cardWidth + (visibleCount - 1) * cardStep;
  const middleIndex = (visibleCount - 1) / 2;
  const distanceFromMiddle = index - middleIndex;
  const maxDistance = Math.max(middleIndex, 1);
  const normalizedDistance =
    maxDistance === 0 ? 0 : Math.abs(distanceFromMiddle) / maxDistance;
  const arcLift = Math.round((1 - Math.pow(normalizedDistance, 1.55)) * 74);
  const baseX = index * cardStep;
  const collapsedX = (stackWidth - cardWidth) / 2 + index * 2;
  const collapsedY = 28 - index * 2;
  const spreadY = Math.round(-10 - arcLift);
  const spreadRotate = distanceFromMiddle * 8.4;
  const gapIndex = dockGapCardIndex.value;
  const hasExtractionGap = gapIndex >= 0;
  let spreadX = baseX;
  let adjustedSpreadRotate = spreadRotate;
  let extractionLaneX = baseX;

  if (hasExtractionGap) {
    const leftCount = gapIndex;
    const rightCount = visibleCount - gapIndex - 1;
    const maxLeftStart = baseX - cardWidth - gapClearance;
    const minRightStart = baseX + cardWidth + gapClearance;
    const leftCompressedStep =
      leftCount > 1
        ? Math.min(compressedStep, Math.max(maxLeftStart / (leftCount - 1), 0))
        : compressedStep;
    const rightCompressedStep =
      rightCount > 1
        ? Math.min(
            compressedStep,
            Math.max(
              (stackWidth - cardWidth - minRightStart) / (rightCount - 1),
              0,
            ),
          )
        : compressedStep;
    const rightStartX =
      stackWidth - cardWidth - (rightCount - 1) * rightCompressedStep;

    // Shift the selected card toward the nearest gap before lifting it out.
    if (index === gapIndex && leftCount > 0 && rightCount > 0) {
      const leftBoundary = (gapIndex - 1) * leftCompressedStep + cardWidth;
      const rightBoundary = rightStartX;
      extractionLaneX = (leftBoundary + rightBoundary) / 2 - cardWidth / 2;
    }

    if (index < gapIndex) {
      spreadX = index * leftCompressedStep;
      adjustedSpreadRotate -= 1.6 + (gapIndex - index - 1) * 0.14;
    } else if (index > gapIndex) {
      spreadX = rightStartX + (index - gapIndex - 1) * rightCompressedStep;
      adjustedSpreadRotate += 1.6 + (index - gapIndex - 1) * 0.14;
    }
  }

  const prepX = baseX + (extractionLaneX - baseX) * 0.84;
  const prepY = spreadY - 24;
  const prepRotate = distanceFromMiddle * 4.1;
  const drawX = extractionLaneX;
  const drawY = spreadY - 116;
  const drawRotate = distanceFromMiddle * 1.75;
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
    "--prep-scale": "1.008",
    "--draw-x": `${drawX}px`,
    "--draw-y": `${drawY}px`,
    "--draw-rotate": `${drawRotate}deg`,
    "--draw-scale": "1.02",
    "--hover-x": `${hoverX}px`,
    "--hover-y": `${hoverY}px`,
    "--hover-rotate": `${hoverRotate}deg`,
    "--hover-scale": "1.02",
    "--card-z": `${total - index}`,
    "--card-accent": action.accent,
    "--card-accent-soft": action.accentSoft,
    "--card-ink": action.ink,
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
  }
});

function closeStoryPanel() {
  showSidebar.value = false;
}

function closeUserPanel() {
  showUserSidebar.value = false;
  showLikesPanel.value = false;
  showPostsPanel.value = false;
  showFavoritesPanel.value = false;
}

function closePublishPanel() {
  isPickingPublishLocation.value = false;
  suggestedPublishLocations.value = [];
  publishPickPrompt.value = null;
  pickedPublishLocation.value = null;
  showPublishSidebar.value = false;
}

function startPublishMapPick() {
  suggestedPublishLocations.value = [];
  publishPickPrompt.value = null;
  pickedPublishLocation.value = null;
  isDockExpanded.value = false;
  isPickingPublishLocation.value = true;
}

function cancelPublishMapPick() {
  publishPickPrompt.value = null;
  suggestedPublishLocations.value = [];
  pickedPublishLocation.value = null;
  isDockExpanded.value = false;
  isPickingPublishLocation.value = false;
}

function restorePublishPanelFromPick() {
  publishPickPrompt.value = null;
  suggestedPublishLocations.value = [];
  pickedPublishLocation.value = null;
  isDockExpanded.value = false;
  isPickingPublishLocation.value = false;
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
  suggestedPublishLocations.value = [];
  publishPickPrompt.value = null;
  pickedPublishLocation.value = null;
  isPickingPublishLocation.value = false;
  isDockExpanded.value = false;
  setTimeout(() => {
    showPublishSidebar.value = true;
  }, 100);
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

function buildLocationAddressLabel(source, latitude, longitude) {
  const districtLabel = buildLocationDistrictLabel(source);
  const rawAddress = firstNonEmptyString(
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
  };
}

function getStoryAuthorName(story) {
  return resolveStoryAuthor(story).username;
}

function getStoryAuthorAvatar(story) {
  return resolveStoryAuthor(story).avatar;
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
  ].includes(value.trim());
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
  const name = pickLocationText([
    overrides.name,
    overrides.address,
    "Map Pick",
  ]);
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
    return fallback;
  }

  const candidates = [
    location.name,
    location.district,
    location.address,
  ].filter((value) => !isGenericLocationPlaceholder(value));

  return pickLocationText(candidates, false) || fallback;
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
    const resolvedLocation = await reverseGeocodeLocationDetail(
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
    const resolvedLocation = await reverseGeocodeLocationDetail(
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
        name: pickLocationText([
          firstPoi?.name,
          regeocode.formattedAddress,
          "Map Pick",
        ]),
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

  const suggestedLocations = buildSuggestedLocations(
    prompt.location,
    prompt.location.nearbyPois || [],
  );
  suggestedPublishLocations.value = suggestedLocations;
  pickedPublishLocation.value = suggestedLocations[0] || prompt.location;
  publishPickPrompt.value = null;
  isPickingPublishLocation.value = false;
}

function rejectPublishNearbySearch() {
  publishPickPrompt.value = null;
  suggestedPublishLocations.value = [];
  pickedPublishLocation.value = null;
  isPickingPublishLocation.value = true;
}

function reverseGeocodePickedLocation(latitude, longitude) {
  return reverseGeocodeLocationDetail(latitude, longitude);
}

async function handlePublishMapClick(point) {
  if (!showPublishSidebar.value || !isPickingPublishLocation.value) {
    return;
  }

  const coords = extractCoordinates(point);
  if (!coords) {
    return;
  }

  suggestedPublishLocations.value = [];
  const pickedLocation = await reverseGeocodePickedLocation(
    coords.latitude,
    coords.longitude,
  );
  pickedPublishLocation.value = pickedLocation;
  publishPickPrompt.value = {
    location: pickedLocation,
    screenX: point?.screenX,
    screenY: point?.screenY,
  };
}

function handleUserClick() {
  if (showPublishSidebar.value) {
    closePublishPanel();
  }
  if (showSidebar.value) {
    closeStoryPanel();
  }
  setTimeout(() => {
    showUserSidebar.value = true;
  }, 100);
  isDockExpanded.value = false;

  if (userStore.isLoggedIn && !userStore.isGuest) {
    userStore.fetchUser().catch((error) => {
      console.error("刷新用户信息失败:", error);
    });
  }
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

  if (showPostsPanel.value && postsList.value.length === 0) {
    loadPostsData();
  }
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
    }

    void hydrateStoryLocations(stories);

    if (stories.length < postsPageSize) {
      postsHasMore.value = false;
    }
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
      });
    } else {
      await favoriteApi.create(story.id);
      handleStoryFavorite({
        storyId: story.id,
        favorited: true,
        favoriteCount: Number(story.favoriteCount ?? 0) + 1,
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

function handleStoryClick(story) {
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
    const index = likesList.value.findIndex(
      (item) => normalizeStoryIdKey(item.id) === normalizeStoryIdKey(story.id),
    );
    if (index > -1) {
      likesList.value.splice(index, 1);
    }

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

    const response = await storyApi.createStory({
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
    });

    const newStory = response.data || response;
    const normalizedNewStory = normalizeStoryForMap(newStory, location);

    console.log("发布故事成功:", newStory);

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

  if (
    storySidebar?.contains(target) ||
    storyTarotShell?.contains(target) ||
    publishModal?.contains(target) ||
    dockContainer?.contains(target)
  ) {
    return;
  }

  closeStoryPanel();
  closePublishPanel();
}

const stories = computed(() => mapStore.stories);

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

    const response = await mapApi.exploreStories(
      center.latitude,
      center.longitude,
      5000,
    );
    console.log("[Map] exploreStories response:", response);

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
      );

      const data = response?.data ?? response;
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

    {
      const response = await mapApi.getClusterData(
        bounds.northEast,
        bounds.southWest,
        currentZoom,
      );

      const data = response?.data ?? response;
      console.log("[Map] cluster API response:", data);
      if (requestToken === activeClusterRequestToken && Array.isArray(data)) {
        clusters.value = data;
        console.log(
          "[Map] clusters loaded:",
          clusters.value.length,
          clusters.value,
        );
      }
      return;
    }

    const paddedBounds = padBounds(bounds) || bounds;
    const response = await mapApi.getClusterData(
      paddedBounds.northEast,
      paddedBounds.southWest,
      currentZoom,
    );

    const data = response?.data ?? response;
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

function handleClusterClick({ cluster, latitude, longitude, count }) {
  console.log("[Map] cluster clicked:", cluster, count);

  const currentZoom = mapStore.zoom;
  const newZoom = Math.min(currentZoom + 2, 18);

  mapStore.updateCenter(latitude, longitude);
  mapStore.updateZoom(newZoom);

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

  clearTimeout(loadTimer);
  loadTimer = setTimeout(() => {
    loadStories();
    loadClusterData();
  }, 500);
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

      const resolvedLocation = await reverseGeocodeLocationDetail(
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

async function handleRandomWalk() {
  randomWalking.value = true;
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
  } catch (error) {
    console.error("随机漫步失败:", error);
    showToast("随机漫步失败，请重试", "error");
  } finally {
    randomWalking.value = false;
  }
  isDockExpanded.value = false;
}

function handlePreviewImage({ index, images }) {
  console.log("预览图片:", index, images);
}

function openFeaturedStory(story) {
  openStoryFromCollection(story);
}

function handleStoryLike({ storyId, liked, likeCount }) {
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

function handleStoryFavorite({ storyId, favorited, favoriteCount }) {
  storyIsFavorited.value = favorited;
  if (typeof favoriteCount === "number") {
    storyFavoriteCount.value = Math.max(0, favoriteCount);
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
  mapTheme.value = theme;
  localStorage.setItem("mapTheme", theme);
  window.dispatchEvent(
    new CustomEvent("map-theme-change", {
      detail: { theme },
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
  getUserLocation();
  loadStories();
  setTimeout(loadClusterData, 1000);
  themeAutoCheckInterval = setInterval(() => {
    minuteTicker.value += 1;
  }, 60000);

  document.addEventListener("click", handleDocumentClick);
  window.addEventListener("resize", scheduleWelcomeTextFit);
  scheduleWelcomeTextFit();
  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleWelcomeTextFit).catch(() => {});
  }
  welcomeOverlayTimer = window.setTimeout(() => {
    showWelcomeOverlay.value = false;
  }, 1100);

  if (userStore.isLoggedIn && !userStore.isGuest) {
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
  max-height: min(90vh, 960px);
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
  overflow-y: auto;
  position: relative;
  z-index: 1;
  padding: 16px 24px 24px;
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
  display: grid;
  gap: 14px;
  padding-bottom: 64px;
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
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.featured-story-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
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
}

.dock-container.show-user-sidebar {
  right: calc(320px + 96px);
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
  transform: translate3d(var(--spread-x), var(--spread-y), 0)
    rotate(var(--spread-rotate));
  transform-origin: center bottom;
  z-index: 12;
}

.dock-card {
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
  will-change: transform, box-shadow, opacity, filter;
  transition:
    transform 0.52s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.52s ease,
    filter 0.52s ease,
    opacity 0.32s ease,
    border-color 0.52s ease;
}

.dock-card-body {
  position: relative;
  height: 100%;
  border-radius: inherit;
  overflow: hidden;
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
  transition-duration: 0.24s, 0.22s, 0.22s, 0.16s, 0.22s;
  transition-timing-function:
    cubic-bezier(0.2, 0.88, 0.24, 1), ease, ease, ease, ease;
  z-index: 116 !important;
}

.dock-menu.expanded .dock-card.active {
  transform: translate3d(var(--hover-x), var(--hover-y), 0)
    rotate(var(--hover-rotate)) scale(var(--hover-scale));
  transition-duration: 0.16s, 0.22s, 0.22s, 0.16s, 0.22s;
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

  .dock-card {
    width: 186px;
    height: 262px;
  }

  .dock-card-icon {
    width: 68px;
    height: 68px;
    font-size: 36px;
  }
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

.publish-modal-enter-from,
.publish-modal-leave-to {
  opacity: 0;
}

.publish-modal-enter-from .publish-modal,
.publish-modal-leave-to .publish-modal {
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
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.publish-modal {
  position: relative;
  width: min(980px, calc(100vw - 48px));
  max-height: min(90vh, 960px);
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
  width: min(420px, calc(100vw - 28px));
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
  max-height: min(90vh, 960px);
  overflow-y: auto;
  padding: 28px;
}

.publish-pick-dock {
  pointer-events: auto;
  width: 100%;
  padding: 16px 18px 18px;
  border: 1px solid rgba(255, 245, 228, 0.22);
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  background: linear-gradient(
    160deg,
    rgba(36, 23, 9, 0.94) 0%,
    rgba(67, 42, 18, 0.96) 100%
  );
  color: #fff8ef;
  box-shadow:
    0 -10px 36px -18px rgba(0, 0, 0, 0.62),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition:
    transform 0.22s ease,
    background 0.22s ease;
}

.publish-pick-dock:hover {
  transform: translateY(-2px);
}

.publish-modal.dark .publish-pick-dock {
  border-color: rgba(198, 219, 255, 0.18);
  background: linear-gradient(
    160deg,
    rgba(10, 17, 33, 0.94) 0%,
    rgba(17, 30, 58, 0.96) 100%
  );
  color: #eef4ff;
}

.pick-dock-handle {
  width: 62px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.46);
  align-self: center;
  margin-bottom: 4px;
}

.publish-pick-dock strong {
  font-size: 16px;
  letter-spacing: 0.02em;
}

.publish-pick-dock span:last-child {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 248, 239, 0.76);
}

.publish-modal.dark .publish-pick-dock span:last-child {
  color: rgba(238, 244, 255, 0.74);
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
  max-height: min(90vh, 960px);
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
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
  position: relative;
  z-index: 1;
  padding: 20px 28px 28px;
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
  display: flex;
  flex-direction: column;
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
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.panel-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateX(-2px);
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
  width: 28px;
  height: 28px;
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

.likes-panel .item-footer,
.posts-panel .item-footer,
.favorites-panel .item-footer {
  justify-content: flex-start;
  gap: 14px;
}

.likes-panel .item-location,
.posts-panel .item-location,
.favorites-panel .item-location {
  flex: 1;
  min-width: 0;
}

.likes-panel .item-likes,
.posts-panel .item-likes,
.favorites-panel .item-likes {
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

.likes-panel .item-action-btn span::before,
.favorites-panel .item-action-btn span::before {
  font-size: 15px;
  line-height: 1;
}

.likes-panel .unlike-btn span::before,
.favorites-panel .unfavorite-btn span::before {
  content: "❌️";
}

.favorites-panel .unfavorite-btn.is-restorable span::before {
  content: "⭐️";
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
    max-height: calc(100vh - 24px);
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

.project-title {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 280px;
  padding: 12px 20px;
  background: linear-gradient(
    90deg,
    rgba(255, 107, 107, 0.2) 0%,
    rgba(255, 165, 0, 0.2) 14.28%,
    rgba(255, 215, 0, 0.2) 28.57%,
    rgba(168, 230, 207, 0.2) 42.85%,
    rgba(102, 126, 234, 0.2) 57.14%,
    rgba(255, 107, 157, 0.2) 71.43%,
    rgba(255, 107, 107, 0.2) 85.71%,
    rgba(255, 107, 107, 0.2) 100%
  );
  background-size: 600% 100%;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 28px;
  font-weight: 700;
  background-clip: padding-box;
  letter-spacing: 2px;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: colorFlow 20s linear infinite;
}

.project-title::before {
  content: "EchoStar";
  background: linear-gradient(
    90deg,
    rgba(0, 148, 148, 1) 0%,
    rgba(0, 90, 255, 1) 14.28%,
    rgba(0, 40, 255, 1) 28.57%,
    rgba(87, 25, 48, 1) 42.85%,
    rgba(153, 129, 21, 1) 57.14%,
    rgba(0, 148, 98, 1) 71.43%,
    rgba(0, 148, 148, 1) 85.71%,
    rgba(0, 148, 148, 1) 100%
  );
  background-size: 600% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: colorFlow 20s linear infinite reverse;
  text-shadow: none;
}

@keyframes colorFlow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 85.71% 50%;
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
</style>
