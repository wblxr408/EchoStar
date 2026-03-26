<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore } from './stores/user';

const userStore = useUserStore();

// 启动时获取用户信息
onMounted(async () => {
  if (userStore.isLoggedIn) {
    try {
      await userStore.fetchUser();
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }
});
</script>

<style>
@import './styles/global.scss';
</style>
