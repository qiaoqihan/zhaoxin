// 系统配置文件
export interface SystemConfig {
  // API配置
  api: {
    baseURL: string;
    timeout: number;
  };

  // 分页配置
  pagination: {
    defaultPageSize: number;
    pageSizes: number[];
  };

  // 部门配置
  departments: {
    [key: string]: string;
  };
}

// 开发环境配置
const developmentConfig: SystemConfig = {
  api: {
    baseURL: "",
    timeout: 10000,
  },
  pagination: {
    defaultPageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  departments: {
    tech: "技术部",
    video: "视频部",
    art: "美工部",
    none: "未选择",
  },
};

// 生产环境配置
const productionConfig: SystemConfig = {
  ...developmentConfig,
  api: {
    baseURL: "https://", // 实际的API地址
    timeout: 15000,
  },
};

// 根据环境选择配置
const config: SystemConfig = productionConfig

export default config;

// 导出常用配置
export const API_BASE_URL = config.api.baseURL;
export const API_TIMEOUT = config.api.timeout;
export const DEPARTMENTS = config.departments;
export const PAGINATION_CONFIG = config.pagination;
