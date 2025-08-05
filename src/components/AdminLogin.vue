<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <div class="login-header">
          <img src="../assets/Logo.svg" alt="Logo" />
          <p>Courses.</p>
        </div>
        <p v-if="!isRegisterMode">请登录您的挑战账户</p>
        <p v-else-if="!isAdminLoggedForRegister">
          请先用管理员账号登录以创建新账户
        </p>
        <p v-else>创建新的管理员账户</p>
      </div>

      <el-form
        :model="isAdminLoggedForRegister ? newAdminForm : loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="netid">
          <el-input
            v-if="isAdminLoggedForRegister"
            v-model="newAdminForm.netid"
            placeholder="请输入新账号(10位数字)"
            prefix-icon="User"
            size="large"
          />
          <el-input
            v-else
            v-model="loginForm.netid"
            placeholder="请输入账号"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item v-if="isAdminLoggedForRegister" prop="name">
          <el-input
            v-model="newAdminForm.name"
            placeholder="请输入姓名"
            prefix-icon="UserFilled"
            size="large"
            outocomplete="new-name"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-if="isAdminLoggedForRegister"
            v-model="newAdminForm.password"
            type="password"
            placeholder="请输入新密码"
            prefix-icon="Lock"
            size="large"
            autocomplete="new-password"
            show-password
          />
          <el-input
            v-else
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item v-if="isAdminLoggedForRegister" prop="level">
          <el-select
            v-model="newAdminForm.level"
            placeholder="请选择权限级别"
            size="large"
            style="width: 100%"
          >
            <el-option label="普通管理员" value="normal" />
            <el-option label="超级管理员" value="super" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            {{
              isAdminLoggedForRegister
                ? "创建账户"
                : isRegisterMode
                ? "管理员登录"
                : "登录"
            }}
          </el-button>
        </el-form-item>

        <el-form-item v-if="!isRegisterMode" class="forgot-password-item">
          <el-button
            link
            type="primary"
            size="small"
            @click="handleForgotPassword"
            class="forgot-password-button"
          >
            忘记密码？
          </el-button>
        </el-form-item>

        <el-form-item class="register-item">
          <el-button
            link
            type="primary"
            size="small"
            @click="toggleMode"
            class="register-button"
          >
            {{ isRegisterMode ? "已有账号？去登录" : "没有账号？去注册" }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { adminAPI } from "../api";

const emit = defineEmits<{
  loginSuccess: [];
}>();

const loading = ref(false);
const loginFormRef = ref();
const isRegisterMode = ref(false);
const isAdminLoggedForRegister = ref(false);

const loginForm = reactive({
  netid: "",
  password: "",
});

const newAdminForm = reactive({
  netid: "",
  name: "",
  password: "",
  level: "normal",
});

const loginRules = {
  netid: [
    { required: true, message: "请输入NetID", trigger: "blur" },
    {
      min: 10,
      max: 10,
      message: "NetID长度为10位数字",
      trigger: "blur",
    },
    {
      pattern: /^\d{10}$/,
      message: "NetID必须为10位数字",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
  ],
  name: [
    { required: true, message: "请输入姓名", trigger: "blur" },
    { min: 2, message: "姓名长度不能少于2位", trigger: "blur" },
  ],
  level: [{ required: true, message: "请选择权限级别", trigger: "change" }],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    loading.value = true;

    if (isAdminLoggedForRegister.value) {
      // 创建新管理员账户
      try {
        const response = await adminAPI.register(newAdminForm);

        if (response.data.success) {
          ElMessage.success("新管理员账户创建成功，正在自动登录...");
          // 自动登录新账号
          try {
            const loginRes = await adminAPI.login({
              netid: newAdminForm.netid,
              password: newAdminForm.password,
            });
            if (loginRes.data.success) {
              localStorage.setItem("is_logged_in", "true");
              localStorage.setItem(
                "admin_info",
                JSON.stringify(loginRes.data.data)
              );
              ElMessage.success("登录成功");
              emit("loginSuccess");
              window.location.href = "/";
            } else {
              ElMessage.error("自动登录失败，请手动登录");
            }
          } catch (e) {
            ElMessage.error("自动登录失败，请手动登录");
          }
        } else {
          if (response.data.message?.includes("管理员已存在")) {
            ElMessage.error("管理员已存在");
          } else {
            ElMessage.error("创建账户失败");
          }
        }
      } catch (error: any) {
        console.error("创建账户失败:", error);
      }
    } else if (isRegisterMode.value) {
      // 管理员登录以进行注册操作
      try {
        const response = await adminAPI.login(loginForm);

        if (response.data.success) {
          const adminInfo = response.data.data;

          if (adminInfo.level === "super") {
            ElMessage.success("超级管理员登录成功，现在可以创建新账户");
            isAdminLoggedForRegister.value = true;
            // 清空表单用于输入新账户信息
            loginForm.netid = "";
            loginForm.password = "";
            newAdminForm.netid = "";
            newAdminForm.name = "";
            newAdminForm.password = "";
            newAdminForm.level = "normal";
            if (loginFormRef.value) {
              loginFormRef.value.clearValidate();
            }
          } else {
            ElMessage.error("只有超级管理员才能创建新账户");
          }
        } else {
          ElMessage.error("管理员登录失败");
        }
      } catch (error: any) {
        console.error("管理员登录失败:", error);
      }
    } else {
      // 普通登录
      try {
        const response = await adminAPI.login(loginForm);

        if (response.data.success) {
          localStorage.setItem("is_logged_in", "true");
          localStorage.setItem(
            "admin_info",
            JSON.stringify(response.data.data)
          );
          ElMessage.success("登录成功");
          emit("loginSuccess");
        } else {
          ElMessage.error("登录失败");
        }
      } catch (error: any) {
        console.error("登录失败:", error);

        // 模拟登录验证（用于开发测试）
        if (
          loginForm.netid === "0123456789" &&
          loginForm.password === "123456"
        ) {
          const mockAdmin = {
            netid: loginForm.netid,
            name: "系统管理员",
            level: "super",
          };

          localStorage.setItem("is_logged_in", "true");
          localStorage.setItem("admin_info", JSON.stringify(mockAdmin));

          ElMessage.success("登录成功（模拟模式）");
          emit("loginSuccess");
        } else {
          ElMessage.error("用户名或密码错误");
        }
      }
    }
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    loading.value = false;
  }
};

const handleForgotPassword = () => {
  ElMessage.info("如有需要，请联系管理员重置密码");
};

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  isAdminLoggedForRegister.value = false;

  // 切换模式时清空所有表单
  loginForm.netid = "";
  loginForm.password = "";
  newAdminForm.netid = "";
  newAdminForm.name = "";
  newAdminForm.password = "";
  newAdminForm.level = "normal";

  if (loginFormRef.value) {
    loginFormRef.value.clearValidate();
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f8f9fa;
}

.login-card {
  width: 400px;
  margin: 0 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header .login-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.login-header .login-header img {
  height: 40px;
  width: auto;
}

.login-header .login-header p {
  margin: 0;
  font-size: 30px;
  color: #303133;
}

.login-header p {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.login-form {
  padding: 0 20px;
}

.login-button {
  width: 100%;
  background-color: #725dff;
}

.forgot-password-button {
  color: #909399;
  font-size: 12px;
}

.forgot-password-button:hover {
  color: #409eff;
}

.forgot-password-item :deep(.el-form-item__content) {
  display: flex;
  justify-content: flex-end;
}

.register-item :deep(.el-form-item__content) {
  display: flex;
  justify-content: center;
}

.register-button {
  color: #725dff;
  font-size: 12px;
}

.register-button:hover {
  color: #634cff;
}

:deep(.el-card__body) {
  padding: 40px 30px;
}
</style>
