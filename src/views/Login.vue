<template>
  <div class="login-page">
    <AdminLogin @login-success="handleLoginSuccess" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import AdminLogin from "../components/AdminLogin.vue";

const router = useRouter();

const handleLoginSuccess = () => {
  // 登录成功后跳转到仪表板
  router.push("/dashboard");
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
