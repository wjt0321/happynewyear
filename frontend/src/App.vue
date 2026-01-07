<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #ff6b9d 100%);
  min-height: 100vh;
}

#app {
  width: 100%;
  min-height: 100vh;
}

:root {
  --primary-color: #ff4757;
  --secondary-color: #ff6b81;
  --accent-color: #ffd700;
  --text-color: #2d3436;
  --text-light: #636e72;
  --bg-gradient: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #ff6b9d 100%);
  --card-bg: rgba(255, 255, 255, 0.95);
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.2);
}
</style>
