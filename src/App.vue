<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts"></script>

<style>
#app {
  min-height: 100vh;
  background-color: #f8f9fa;
}

body {
  margin: 0;
  padding: 0;
  font-family: "SourceHanSansSCVF-Medium", "Helvetica Neue", Arial,
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

* {
  box-sizing: border-box;
}
</style>
