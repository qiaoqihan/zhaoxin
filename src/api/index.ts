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
    // 检查后端返回的 success 字段
    if (response?.data && response.data.success === false) {
      if (response.data.code === 6) {
        // 登录过期的特殊处理
        if (!hasShownLoginExpired) {
          hasShownLoginExpired = true;
          localStorage.removeItem("is_logged_in");
          localStorage.removeItem("admin_info");
          ElMessage.error("登录过期，请重新登录");
          router.replace("/login");
        }
        return Promise.reject(new Error("登录过期"));
      } else {
        // 其他错误情况
        const error = new Error(response.data.message || "操作失败");
        (error as any).response = response;
        return Promise.reject(error);
      }
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

// 通用错误处理函数
export const handleApiError = (error: any): string => {
  if (error?.response?.data) {
    const { data } = error.response;

    // 优先使用后端返回的具体错误信息
    if (data.message && typeof data.message === "string") {
      // 清理错误信息中的换行符和多余空格
      return data.message.replace(/\n/g, "").trim();
    }

    // 根据后端错误代码返回对应的错误信息
    switch (data.code) {
      case 3:
        return "输入参数有误，请检查输入信息";
      case 4:
        return "系统错误，请稍后重试";
      case 5:
        return "操作失败，请检查输入信息";
      case 6:
        return "登录已过期，请重新登录";
      case 7:
        return "权限不足，无法执行此操作";
      case 8:
        return "记录不存在，请检查输入信息";
      case 9:
        return "存在冲突，请检查时间安排";
      case 10:
        return "密码错误，请重新输入";
      default:
        return "操作失败，请重试";
    }
  }

  // 处理HTTP状态码错误
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        return "请求参数错误，请检查输入信息";
      case 401:
        return "登录已过期，请重新登录";
      case 403:
        return "权限不足，无法执行此操作";
      case 404:
        return "请求的资源不存在";
      case 500:
        return "服务器内部错误，请稍后重试";
      case 502:
        return "服务器网关错误，请稍后重试";
      case 503:
        return "服务不可用，请稍后重试";
      default:
        return `服务器错误 (${error.response.status})，请稍后重试`;
    }
  }

  // 处理网络错误
  if (error?.code) {
    switch (error.code) {
      case "ECONNREFUSED":
      case "NETWORK_ERROR":
        return "网络连接失败，请检查网络连接";
      case "ECONNABORTED":
        return "请求超时，请稍后重试";
      default:
        return "网络错误，请检查网络连接";
    }
  }

  return "未知错误，请重试";
};

export const studentAPI = {
  // 获取学生列表
  getStudents: (params?: any) => axios.get("/api/admin/stu", { params }),

  // 获取单个学生详情 (使用现有接口通过netid参数获取)
  getStudentDetail: (netid: string) =>
    axios.get("/api/admin/stu", { params: { netid } }),

  // 获取学生统计数据
  getStatistics: () => axios.get("/api/admin/stat"),

  // 更新学生信息
  updateStudent: (id: number, data: any) => {
    const requestData = {
      netid: data.netid,
      name: data.name,
      phone: data.phone,
      school: data.school,
      mastered: data.mastered,
      tomaster: data.tomaster,
      depart: data.depart,
      queid: data.queid || 0,
      tag: data.tag,
      whereknow: data.whereknow,
    };
    return axios.put(`/api/admin/stu${id}`, requestData);
  },
};

export const interviewAPI = {
  // 创建面试安排
  createInterview: (data: any) => axios.post("/api/interv", data),

  //创建新面试
  createNewInterview: (data: any) => axios.post("/api/interv/create", data),

  // 更新面试信息
  updateInterview: (id: number, data: any) =>
    axios.put("/api/interv", { ...data, id }),

  // 取消面试安排
  cancelInterview: (id: number) => axios.put("/api/interv/cancel", { id }),

  // 删除面试安排 (暂未使用)
  deleteInterview: (id: number) =>
    axios.delete("/api/interv", { data: { id: [id] } }),

  // 获取面试统计数据
  getStatistics: () => axios.get("/api/admin/stat"),

  // 获取某天的面试信息
  getInterviewsByDate: (date: string) =>
    axios.get("/api/interv/", { params: { date } }),

  // 获取所有面试日期
  getInterviewDates: () => axios.get("/api/interv/date"),
};

export const questionAPI = {
  // 获取题目列表
  getQuestions: (params?: any) => axios.get("/api/que/", { params }),

  // 根据ID获取单个题目
  getQuestionById: (id: number) => axios.get(`/api/que/${id}`),

  // 上传问题的图片或视频文件
  uploadQuestionFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axios.post("/api/que/data", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // 创建题目
  createQuestion: (data: any) =>
    axios.post("/api/que/", {
      list: [data],
    }),

  // 更新题目信息
  updateQuestion: (id: number, data: any) =>
    axios.put("/api/que/", { id, ...data }),

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

  // 设置可查询面试时间
  setInterviewTime: (data: any) => axios.post("/api/admin/settime", data),

  // 给学生发送面试结果
  sendInterviewResult: () => axios.get("/api/admin/send"),

  // 阿里云发送短信
  sendAliyunSms: () => axios.get("/api/admin/aliyun"),

  // 退出登录
  logout: () => axios.delete("/api/admin/"),
};

export default axios;
