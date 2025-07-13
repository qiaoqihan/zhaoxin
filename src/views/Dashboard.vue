<template>
  <div class="dashboard-layout">
    <el-container>
      <!-- 侧边导航栏 -->
      <el-aside width="320px" class="sidebar">
        <div class="logo">
          <img src="../assets/logo.svg" alt="Logo" />
          <p>Courses.</p>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          @select="handleMenuSelect"
          router
        >
          <div class="menu-label">通用</div>
          <el-menu-item index="/dashboard/interview">
            <el-icon><Document /></el-icon>
            <span>控制面板</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/schedule">
            <el-icon><Calendar /></el-icon>
            <span>时间表</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/questions">
            <el-icon><QuestionFilled /></el-icon>
            <span>面试题目</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/analytics">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据可视化</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container class="main-container">
        <!-- 顶部导航栏 -->
        <el-header class="header">
          <div class="header-container">
            <div class="header-left">
              <p>{{ pageTitle }}</p>
            </div>
            <div class="header-right">
              <el-dropdown @command="handleUserCommand">
                <span class="user-info">
                  <img
                    src="../assets/Profile.svg"
                    alt="Profile"
                    class="profile-icon"
                  />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="logout" divided
                      >退出登录</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>

        <!-- 主内容 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Document,
  Calendar,
  QuestionFilled,
  DataAnalysis,
} from "@element-plus/icons-vue";
import { adminAPI } from "../api";

const router = useRouter();
const route = useRoute();

const adminInfo = reactive({
  netid: "",
  name: "",
  level: "",
});

const activeMenu = ref("/dashboard/interview");

// 页面标题映射
const pageTitleMap: Record<string, string> = {
  "/dashboard/interview": "欢迎回来，挑战！",
  "/dashboard/schedule": "我的时间表",
  "/dashboard/questions": "面试题目",
  "/dashboard/analytics": "数据可视化",
};

const pageTitle = computed(() => {
  return pageTitleMap[route.path] || "面试后台管理系统";
});

// 检查登录状态并获取用户信息
const checkLoginStatus = async () => {
  const isLoggedIn = localStorage.getItem("is_logged_in");
  if (!isLoggedIn) {
    router.push("/login");
    return;
  }

  try {
    // 从后端获取最新的用户信息
    const response = await adminAPI.getProfile();

    if (response.data.success) {
      Object.assign(adminInfo, response.data.data);
      // 更新本地存储
      localStorage.setItem("admin_info", JSON.stringify(response.data.data));
    } else {
      // 后端返回失败，可能是token过期
      localStorage.removeItem("is_logged_in");
      localStorage.removeItem("admin_info");
      ElMessage.error("登录状态已过期，请重新登录");
      router.push("/login");
    }
  } catch (error) {
    console.error("获取用户信息失败:", error);

    // 如果后端请求失败，尝试使用本地存储的信息作为备选
    const savedAdminInfo = localStorage.getItem("admin_info");
    if (savedAdminInfo) {
      try {
        const adminData = JSON.parse(savedAdminInfo);
        Object.assign(adminInfo, adminData);
        ElMessage.warning("网络异常，使用本地缓存信息");
      } catch (parseError) {
        console.error("解析管理员信息失败:", parseError);
        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("admin_info");
        router.push("/login");
      }
    } else {
      // 没有本地存储信息，跳转到登录页
      router.push("/login");
    }
  }
};

// 处理菜单选择
const handleMenuSelect = (index: string) => {
  activeMenu.value = index;
};

// 处理用户操作
const handleUserCommand = async (command: string) => {
  switch (command) {
    case "logout":
      await handleLogout();
      break;
  }
};

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "确认退出", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await logout();
  } catch (error) {
    // 用户取消退出
  }
};

const logout = async () => {
  try {
    // 调用后端退出接口
    await adminAPI.logout();
  } catch (error) {
    console.error("退出登录失败:", error);
  } finally {
    // 清除本地存储
    localStorage.removeItem("is_logged_in");
    localStorage.removeItem("admin_info");

    ElMessage.success("已退出登录");
    router.push("/login");
  }
};

// 监听路由变化，更新活动菜单
watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath;
  },
  { immediate: true }
);

onMounted(() => {
  checkLoginStatus();
});
</script>

<style scoped>
.dashboard-layout {
  height: 100vh;
  width: 100vw;
}

.sidebar {
  background-color: #ffffff;
  padding: 16px;
  min-height: 100vh;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 30px 38px;
  text-align: center;
  min-height: 80px;
}

.logo img {
  height: 32px;
  width: auto;
}

.logo p {
  color: #303133;
  margin: 0;
  font-size: 20px;
}

.menu-label {
  padding: 12px 24px 8px;
  font-size: 12px;
  color: #909399;
  letter-spacing: 0.5px;
}

.sidebar-menu {
  border: none;
  background-color: transparent;
}

:deep(.el-menu-item) {
  color: #606266;
  font-size: 16px;
  height: 64px;
  line-height: 64px;
  margin: 4px 12px;
  border-radius: 24px;
}

:deep(.el-menu-item.is-active) {
  background-color: #f1efff !important;
  color: #725dff;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 8px;
}

.header {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 24px 0;
  box-shadow: none;
}

.header-container {
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  width: 100%;
  height: 80px;
  box-shadow: 0 2px 8px rgba(0, 21, 41, 0.08);
  border: 1px solid #f0f0f0;
}

.header-left {
  margin: 0;
  color: #000000;
  font-size: 28px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s;
  border: none;
  outline: none;
}

.user-info:hover {
  background-color: #f3f4f6;
}

.main-content {
  padding: 8px 24px 24px;
  margin-top: 2px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.main-content::-webkit-scrollbar {
  display: none;
}

:deep(.el-container) {
  height: 100vh;
}

:deep(.el-header) {
  height: 100px !important;
}

:deep(.el-main) {
  padding: 0;
}
</style>
