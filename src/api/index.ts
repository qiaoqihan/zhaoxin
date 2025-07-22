import axios from "axios";
import { ElMessage } from "element-plus";
import { API_BASE_URL, API_TIMEOUT } from "../config";

let hasShownLoginExpired = false;

// 配置axios默认设置
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = API_TIMEOUT;

// 请求拦截器
axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
import router from "../router";

axios.interceptors.response.use(
  (response) => {
    if (
      response?.data &&
      response.data.success === false &&
      response.data.code === 6
    ) {
      if (!hasShownLoginExpired) {
        hasShownLoginExpired = true;
        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("admin_info");
        ElMessage.error("登录过期，请重新登录");
        router.replace("/login");
      }
      return Promise.reject(new Error("登录过期"));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (!hasShownLoginExpired) {
        hasShownLoginExpired = true;
        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("admin_info");
        ElMessage.error("登录已过期，请重新登录");
        router.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

// API接口定义
export const studentAPI = {
  // 获取学生列表
  getStudents: (params?: any) => axios.get("/api/admin/stu", { params }),

  // 获取学生统计数据
  getStatistics: () => axios.get("/api/admin/stat"),
};

export const interviewAPI = {
  // 创建面试安排
  createInterview: (data: any) => axios.post("/api/interv", data),

  //创建新面试
  createNewInterview: (data: any) => axios.post("/api/interv/create", data),

  // 更新面试信息
  updateInterview: (id: number, data: any) =>
    axios.put("/api/interv", { ...data, id }),

  // 删除面试安排
  deleteInterview: (id: number) =>
    axios.delete("/api/interv", { data: { id } }),

  // 获取面试统计数据
  getStatistics: () => axios.get("/api/admin/stat"),

  // 获取某天的面试信息
  getInterviewsByDate: (date: string) =>
    axios.get("/api/stu/interv", { params: { date } }),

  // 获取所有面试日期
  getInterviewDates: () => axios.get("/api/stu/date"),
};

export const questionAPI = {
  // 获取题目列表
  getQuestions: (params?: any) => axios.get("/api/que", { params }),

  // 创建题目
  createQuestion: (data: any) =>
    axios.post("/api/que", {
      list: [data],
    }),

  // 更新题目信息
  updateQuestion: (id: number, data: any) =>
    axios.put("/api/que", { id, ...data }),

  // 删除题目
  deleteQuestion: (id: number) =>
    axios.delete("/api/que/", {
      data: { ids: [id] },
    }),
};

export const adminAPI = {
  // 管理员登录
  login: (credentials: { netid: string; password: string }) => {
    hasShownLoginExpired = false;
    return axios.post("/api/admin/", credentials);
  },

  // 管理员注册
  register: (credentials: {
    netid: string;
    name: string;
    password: string;
    level: string;
  }) => axios.post("/api/admin/register", credentials),

  // 获取管理员信息
  getProfile: () => axios.get("/api/"),

  // 退出登录
  logout: () => axios.delete("/api/admin/"),
};

export default axios;
