<template>
  <div class="interview-management">
    <div class="main-layout">
      <!-- 左侧学生列表 -->
      <div class="left-panel">
        <div class="banner-container">
          <img src="../assets/Banner.svg" alt="Banner" class="banner-image" />
        </div>
        <!-- 筛选条件 -->
        <el-card class="filter-card">
          <div class="filter-container">
            <el-row :gutter="20" class="smart-search-row">
              <el-col :span="24">
                <div class="search-wrapper">
                  <span class="search-label">筛选</span>
                  <el-input
                    v-model="smartSearchText"
                    placeholder="请输入学生信息"
                    clearable
                    size="large"
                    @input="handleSmartSearch"
                    @clear="clearSmartSearch"
                    class="search-input"
                  />
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 学生列表卡片 -->
        <el-card class="table-card">
          <div class="student-cards-container" v-loading="loading">
            <div
              v-for="student in paginatedInterviews"
              :key="student.id"
              class="student-card"
              @click="handleRowClick(student)"
            >
              <div
                class="card-main-info-with-icon card-main-info-flex"
                style="position: relative"
              >
                <div class="card-icon-vertical">
                  <img src="../assets/Icon.svg" alt="icon" />
                </div>
                <div class="card-main-content student-info-maxwidth">
                  <h4 class="student-name">{{ student.name }}</h4>
                  <div class="card-detail-info">
                    <div class="info-item">
                      <span class="department-text">
                        {{ getDepartmentName(student.depart) }}
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="time-text" v-if="student.interv">
                        {{ formatMonthDay(student.interv.time) }}
                      </span>
                      <el-tag v-else size="small">待安排</el-tag>
                    </div>
                    <div class="info-item">
                      <span v-if="student.interv">
                        <span
                          class="statue-text"
                          v-if="
                            getInterviewStatus(student.interv.time) === '已面试'
                          "
                          style="color: #f40000"
                        >
                          状态:已面试
                        </span>
                        <span
                          class="statue-text"
                          v-else-if="
                            getInterviewStatus(student.interv.time) === '面试中'
                          "
                          style="color: #a2b405"
                        >
                          状态:面试中
                        </span>
                        <span
                          class="statue-text"
                          v-else-if="
                            getInterviewStatus(student.interv.time) === '未面试'
                          "
                          style="color: #11b405"
                        >
                          状态:未面试
                        </span>
                        <span v-else class="statue-text"> 状态:未安排 </span>
                      </span>
                      <span v-else class="statue-text">状态:未安排</span>
                    </div>
                  </div>
                </div>
                <div class="card-more-options">
                  <img :src="More" alt="更多选项" class="more-icon" />
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              size="small"
              layout="prev, pager, next, slot"
              :total="filteredInterviews.length"
              class="pagination"
            >
              <template #default class="pagination-text">
                共{{ Math.ceil(filteredInterviews.length / pageSize) }}页
              </template>
            </el-pagination>
          </div>
        </el-card>
      </div>

      <!-- 右侧日程表和编辑区域 -->
      <div class="right-panel">
        <!-- 编辑学生信息 -->
        <el-card v-if="editingStudent" class="edit-card">
          <template #header>
            <div class="edit-header">
              <span>面试详情</span>
              <el-button
                link
                type="primary"
                @click="closeEdit"
                class="close-btn"
              >
                <img :src="CloseIcon" alt="关闭" class="close-icon" />
              </el-button>
            </div>
          </template>

          <el-form
            :model="editingStudent"
            ref="studentFormRef"
            label-width="80px"
            label-position="top"
            style="height: calc(100vh - 250px); overflow-y: auto"
          >
            <!-- 基本信息 -->
            <el-card class="form-section" shadow="never">
              <template #header>
                <div class="section-header">基本信息</div>
              </template>
              <el-form-item label="姓名" prop="name">
                <el-input
                  v-model="editingStudent.name"
                  placeholder="请输入姓名"
                />
              </el-form-item>
              <el-form-item label="学号" prop="netid">
                <el-input
                  v-model="editingStudent.netid"
                  placeholder="请输入学号"
                />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input
                  v-model="editingStudent.phone"
                  placeholder="请输入手机号"
                />
              </el-form-item>
              <el-form-item label="书院" prop="school">
                <el-input
                  v-model="editingStudent.school"
                  placeholder="请输入书院"
                />
              </el-form-item>
              <el-form-item label="了解来源" prop="whereknow">
                <el-input
                  v-model="editingStudent.whereknow"
                  placeholder="请输入了解来源"
                  disabled
                />
              </el-form-item>
            </el-card>

            <!-- 技能信息 -->
            <el-card class="form-section" shadow="never">
              <template #header>
                <div class="section-header">技能信息</div>
              </template>
              <el-form-item label="已掌握技能" prop="mastered">
                <el-input
                  v-model="editingStudent.mastered"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入已掌握的技能"
                />
              </el-form-item>
              <el-form-item label="想要学习" prop="tomaster">
                <el-input
                  v-model="editingStudent.tomaster"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入想要学习的内容"
                />
              </el-form-item>
              <el-form-item label="意向部门" prop="depart">
                <el-select
                  v-model="editingStudent.depart"
                  placeholder="请选择意向部门"
                  style="width: 100%"
                >
                  <el-option label="技术部" value="tech" />
                  <el-option label="视频部" value="video" />
                  <el-option label="美工部" value="art" />
                </el-select>
              </el-form-item>
              <el-form-item label="标签" prop="tag">
                <el-input
                  v-model="editingStudent.tag"
                  placeholder="请输入标签"
                  disabled
                />
              </el-form-item>
            </el-card>

            <!-- 面试信息 -->
            <el-card
              v-if="editingStudent.interv"
              class="form-section"
              shadow="never"
            >
              <template #header>
                <div class="section-header">面试信息</div>
              </template>
              <el-form-item label="面试部门">
                <el-select
                  v-model="editingStudent.interv.department"
                  placeholder="请选择面试部门"
                  style="width: 100%"
                >
                  <el-option label="技术部" value="tech" />
                  <el-option label="视频部" value="video" />
                  <el-option label="美工部" value="art" />
                </el-select>
              </el-form-item>
              <el-form-item label="面试星级">
                <el-rate v-model="editingStudent.interv.star" :max="5" />
              </el-form-item>
              <el-form-item label="面试评价">
                <el-input
                  v-model="editingStudent.interv.evaluation"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入面试评价"
                />
              </el-form-item>
              <el-form-item label="是否通过">
                <el-select
                  v-model="editingStudent.interv.pass"
                  placeholder="请选择是否通过"
                  style="width: 100%"
                >
                  <el-option label="通过" :value="1" />
                  <el-option label="未通过" :value="0" />
                </el-select>
              </el-form-item>
            </el-card>

            <!-- 面试题目 -->
            <el-card class="form-section" shadow="never">
              <template #header>
                <div class="section-header">面试题目</div>
              </template>
              <div v-if="editingStudent.queid && editingStudent.queid > 0" class="question-content">
                <div v-if="editingStudent.questionContent" class="markdown-content">
                  <div v-html="renderMarkdown(editingStudent.questionContent)"></div>
                </div>
                <div v-else class="no-question">
                  题目ID: {{ editingStudent.queid }} (题目内容获取中...)
                </div>
                
                <!-- 如果有题目链接，直接嵌入显示图片/视频 -->
                <div v-if="editingStudent.questionUrl" class="question-media" style="margin-top: 12px;">
                  <!-- 图片显示 -->
                  <img 
                    v-if="isImageUrl(editingStudent.questionUrl)" 
                    :src="editingStudent.questionUrl" 
                    :alt="'题目图片'" 
                    class="question-image"
                    @error="handleMediaError"
                  />
                  <!-- 视频显示 -->
                  <video 
                    v-else-if="isVideoUrl(editingStudent.questionUrl)" 
                    :src="editingStudent.questionUrl" 
                    controls 
                    class="question-video"
                    @error="handleMediaError"
                  >
                    您的浏览器不支持视频播放
                  </video>
                  <!-- 其他链接显示为可点击链接 -->
                  <div v-else class="question-link">
                    <el-link :href="editingStudent.questionUrl" target="_blank" type="primary">
                      查看题目附件/链接
                    </el-link>
                  </div>
                </div>
              </div>
              
              <div v-else class="no-question">
                <el-alert
                  title="该学生尚未抽取题目"
                  type="info"
                  :closable="false">
                </el-alert>
              </div>
            </el-card>

            <div class="form-actions">
              <el-button @click="closeEdit">取消</el-button>
              <el-button type="primary" @click="saveStudent" :loading="saving">
                保存
              </el-button>
            </div>
          </el-form>
        </el-card>

        <!-- 日程表 -->
        <el-card v-else class="schedule-card">
          <div class="schedule-content">
            <div class="calendar-container">
              <div class="calendar-header">
                <el-button
                  @click="previousWeeks"
                  size="small"
                  class="arrow-btn"
                >
                  <img :src="ArrowLeftIcon" alt="上一页" class="arrow-icon" />
                </el-button>
                <span class="calendar-title">{{ getCalendarTitle() }}</span>
                <el-button @click="nextWeeks" size="small" class="arrow-btn">
                  <img :src="ArrowRightIcon" alt="下一页" class="arrow-icon" />
                </el-button>
              </div>
              <div class="two-week-calendar">
                <div class="week-header">
                  <div v-for="day in weekDays" :key="day" class="week-day">
                    {{ day }}
                  </div>
                </div>
                <div
                  class="week-row"
                  v-for="(week, weekIndex) in twoWeeks"
                  :key="weekIndex"
                >
                  <div
                    v-for="date in week"
                    :key="date.dateStr"
                    class="calendar-cell"
                    :class="{
                      'has-interviews': hasInterviewsOnDate(date.dateStr),
                      'selected-date': isSelectedDate(date.dateStr),
                      'other-month': !date.isCurrentMonth,
                    }"
                    @click="selectDate(date.dateStr)"
                  >
                    <div class="date-number">{{ date.day }}</div>
                    <div
                      v-if="hasInterviewsOnDate(date.dateStr)"
                      class="interview-dot"
                    >
                      {{ getInterviewCountForDate(date.dateStr) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 选中日期的面试详情 -->
            <div class="daily-schedule">
              <div class="schedule-title">
                <p>当日面试安排</p>
              </div>

              <div v-if="dailyInterviews.length === 0" class="no-interviews">
                <el-empty description="当天没有安排面试" />
              </div>

              <div v-else class="interview-schedule-container">
                <div class="interview-schedule-list">
                  <div
                    v-for="interview in dailyInterviews"
                    :key="interview.id"
                    class="schedule-item"
                    @click="editStudent(interview)"
                  >
                    <div class="schedule-time">
                      {{ formatTime(interview.interv!.time) }}
                    </div>
                    <div class="interview-card">
                      <div class="card-header">
                        <div class="department-tag">
                          {{ getDepartmentName(interview.interv!.department) }}
                        </div>
                        <div class="more-options">
                          <el-icon><MoreFilled /></el-icon>
                        </div>
                      </div>
                      <div class="card-content">
                        <div class="interviewer-info">
                          <span class="label">面试官:</span>
                          <span class="value">{{
                            interview.interv!.interviewer
                          }}</span>
                        </div>
                        <div class="candidate-info">
                          <span class="label">被面试者:</span>
                          <span class="value">{{ interview.name }}</span>
                        </div>
                        <div class="question-info">
                          <span class="label">面试题目序号:</span>
                          <span class="value">{{
                            interview.queid || "未知"
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { MoreFilled } from "@element-plus/icons-vue";
import { studentAPI, interviewAPI, handleApiError, questionAPI } from "../api";
import CloseIcon from "../assets/Outline - Essentional, UI - Close Circle.svg";
import ArrowLeftIcon from "../assets/Outline - Arrows - Alt Arrow Left.svg";
import ArrowRightIcon from "../assets/Outline - Arrows - Alt Arrow Right.svg";
import More from "../assets/More.svg";
import { marked } from "marked";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import "highlight.js/styles/github.css";

// 注册语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);

// 配置marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

// 数据类型定义
interface Student {
  id: number;
  openid: string;
  netid: string;
  name: string;
  phone: string;
  school: string;
  whereknow: string;
  mastered: string;
  tomaster: string;
  depart: string;
  tag: string;
  interv?: Interview;
  message: number;
  queid?: number;
  questionContent?: string;
  questionUrl?: string;
}

interface Interview {
  id: number;
  netid: string | null;
  time: string;
  interviewer: string;
  department: string;
  star: number;
  evaluation: string;
  pass: number;
}

interface InterviewDateInfo {
  date: string;
  total: number;
}

interface InterviewsResponse {
  available: Interview[];
  unavailable: Interview[];
}

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const students = ref<Student[]>([]);
const interviewDates = ref<InterviewDateInfo[]>([]);
const dailyInterviewsData = ref<InterviewsResponse>({
  available: [],
  unavailable: [],
});
const bookedInterviewCounts = ref<Map<string, number>>(new Map()); // 存储每个日期已预约的面试数量
const currentPage = ref(1);
const pageSize = ref(3);

// 智能搜索相关
const smartSearchText = ref("");

// 筛选条件
const filters = reactive({
  name: "",
  department: "",
  interviewer: "",
  passStatus: "",
});

// 统计数据
const statistics = reactive({
  total: 0,
  interviewed: 0,
  passed: 0,
  pending: 0,
});

// 编辑相关
const editingStudent = ref<Student | null>(null);
const selectedDate = ref(new Date().toISOString().split("T")[0]); // 当前日期
const currentWeekStart = ref(new Date()); // 当前显示的两周开始日期

// 周日期标题
const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const studentFormRef = ref();

// 计算属性
const filteredInterviews = computed(() => {
  let result = students.value;

  // 智能搜索
  if (smartSearchText.value.trim()) {
    const searchTerm = smartSearchText.value.toLowerCase();
    result = result.filter((student) => {
      return (
        student.name.toLowerCase().includes(searchTerm) ||
        student.netid.toLowerCase().includes(searchTerm) ||
        student.phone.includes(searchTerm) ||
        student.school.toLowerCase().includes(searchTerm) ||
        getDepartmentName(student.depart).toLowerCase().includes(searchTerm) ||
        student.mastered.toLowerCase().includes(searchTerm) ||
        student.tomaster.toLowerCase().includes(searchTerm) ||
        (student.interv &&
          student.interv.interviewer.toLowerCase().includes(searchTerm))
      );
    });
  }

  // 高级筛选
  if (filters.name) {
    result = result.filter((student) =>
      student.name.toLowerCase().includes(filters.name.toLowerCase())
    );
  }

  if (filters.department) {
    result = result.filter(
      (student) =>
        student.depart === filters.department ||
        (student.interv && student.interv.department === filters.department)
    );
  }

  if (filters.interviewer) {
    result = result.filter(
      (student) =>
        student.interv &&
        student.interv.interviewer
          .toLowerCase()
          .includes(filters.interviewer.toLowerCase())
    );
  }

  if (filters.passStatus) {
    if (filters.passStatus === "pending") {
      result = result.filter((student) => !student.interv);
    } else {
      result = result.filter(
        (student) =>
          student.interv &&
          student.interv.pass.toString() === filters.passStatus
      );
    }
  }

  return result;
});

// 分页后的学生数据
const paginatedInterviews = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredInterviews.value.slice(startIndex, endIndex);
});

// 计算当天的面试安排
const dailyInterviews = computed(() => {
  const available = dailyInterviewsData.value.available || [];
  const unavailable = dailyInterviewsData.value.unavailable || [];

  // 只显示已被预约的面试（不可用时间段）
  const allInterviews = [...unavailable];

  return allInterviews
    .map((interview) => {
      // 查找对应的学生信息
      const student = students.value.find((s) => s.netid === interview.netid);
      if (student) {
        return {
          ...student,
          interv: interview,
        };
      }
      // 如果没有找到学生信息，创建一个基本的学生对象
      return {
        id: interview.id,
        openid: "",
        netid: interview.netid || "",
        name: interview.netid || "未知",
        phone: "",
        school: "",
        whereknow: "",
        mastered: "",
        tomaster: "",
        depart: interview.department,
        tag: "",
        interv: interview,
        message: 0,
        queid: 0,
      };
    })
    .sort((a, b) => {
      // 按时间排序
      const timeA = new Date(a.interv!.time).getTime();
      const timeB = new Date(b.interv!.time).getTime();
      return timeA - timeB;
    });
});

// 计算两周的日期数据
const twoWeeks = computed(() => {
  const weeks = [];
  const startDate = new Date(currentWeekStart.value);

  // 找到周的开始（周一）
  const dayOfWeek = startDate.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周日时为6，其他时候为dayOfWeek-1
  const beforeSetDate = startDate.getDate() - daysFromMonday;
  startDate.setDate(beforeSetDate);

  // 获取标题显示的月份
  const titleMonth = getTitleMonth();

  // 生成两周的数据
  for (let week = 0; week < 2; week++) {
    const weekData = [];
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + week * 7 + day);

      let dateStr = currentDate.toISOString().split("T")[0];
      const isCurrentMonth = currentDate.getMonth() + 1 === titleMonth;
      const hour = currentDate.getHours();
      if (hour < 8) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);
        dateStr = nextDate.toISOString().split("T")[0];
      }

      weekData.push({
        dateStr: dateStr,
        day: currentDate.getDate(),
        isCurrentMonth: isCurrentMonth,
      });
    }
    weeks.push(weekData);
  }
  return weeks;
});

// 获取标题显示的月份
const getTitleMonth = () => {
  const startDate = new Date(currentWeekStart.value);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 13); // 两周后

  const startMonth = startDate.getMonth() + 1;
  const endMonth = endDate.getMonth() + 1;

  if (startMonth === endMonth) {
    return startMonth;
  } else {
    // 计算两周内每个月的天数
    const daysInFirstMonth =
      new Date(startDate.getFullYear(), startMonth, 0).getDate() -
      startDate.getDate() +
      1;
    const daysInSecondMonth = endDate.getDate();

    // 返回天数最多的月份
    return daysInFirstMonth >= daysInSecondMonth ? startMonth : endMonth;
  }
};

// 获取日历标题
const getCalendarTitle = () => {
  const startDate = new Date(currentWeekStart.value);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 13); // 两周后

  const startMonth = startDate.getMonth() + 1;
  const endMonth = endDate.getMonth() + 1;
  const year = startDate.getFullYear();

  if (startMonth === endMonth) {
    return `${year}年${startMonth}月`;
  } else {
    // 计算两周内每个月的天数
    const daysInFirstMonth =
      new Date(year, startMonth, 0).getDate() - startDate.getDate() + 1;
    const daysInSecondMonth = endDate.getDate();

    // 显示天数最多的月份
    const dominantMonth =
      daysInFirstMonth >= daysInSecondMonth ? startMonth : endMonth;
    return `${year}年${dominantMonth}月`;
  }
};

// 上一个两周
const previousWeeks = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() - 14);
  currentWeekStart.value = newDate;
};

// 下一个两周
const nextWeeks = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() + 14);
  currentWeekStart.value = newDate;
};

// 方法
const getDepartmentName = (dept: string) => {
  const deptMap: Record<string, string> = {
    tech: "技术部",
    video: "视频部",
    art: "美工部",
    none: "未选择",
  };
  return deptMap[dept] || dept;
};

// 获取面试状态（基于时间）
const getInterviewStatus = (interviewTime: string) => {
  if (!interviewTime) return "未安排";

  const now = new Date();
  const interviewDate = new Date(interviewTime);
  const diffInMinutes = (now.getTime() - interviewDate.getTime()) / (1000 * 60);

  if (diffInMinutes < -15) {
    // 面试时间还有30分钟以上
    return "未面试";
  } else if (diffInMinutes >= -15 && diffInMinutes <= 30) {
    // 面试时间前30分钟到后60分钟，认为是面试中
    return "面试中";
  } else {
    // 面试结束超过60分钟
    return "已面试";
  }
};

const updateStatistics = () => {
  statistics.total = students.value.length;
  statistics.interviewed = students.value.filter((s) => s.interv).length;
  statistics.passed = students.value.filter(
    (s) => s.interv && s.interv.pass === 1
  ).length;
  statistics.pending = students.value.filter((s) => !s.interv).length;
};

const fetchStudents = async () => {
  loading.value = true;
  try {
    // 调用后端API获取学生数据
    const response = await studentAPI.getStudents();
    if (response.data && response.data.success) {
      students.value = response.data.data || [];
    } else {
      console.log("后端API调用失败，使用模拟数据");
      // 如果API调用失败，使用模拟数据
      loadMockData();
    }
    updateStatistics();
  } catch (error) {
    console.error("获取学生数据失败:", error);
    console.log("使用模拟数据");
    // 使用模拟数据
    loadMockData();
  } finally {
    loading.value = false;
  }
};

// 编辑学生信息相关方法
const handleRowClick = (row: Student) => {
  // 点击行时打开编辑
  editStudent(row);
};

const editStudent = async (student: Student) => {
  editingStudent.value = JSON.parse(JSON.stringify(student));
  
  // 如果学生有题目ID，获取题目内容
  if (editingStudent.value && editingStudent.value.queid && editingStudent.value.queid > 0) {
    await fetchQuestionDetail(editingStudent.value.queid);
  }
};

const closeEdit = () => {
  editingStudent.value = null;
};

// 获取题目详情
const fetchQuestionDetail = async (questionId: number) => {
  try {
    // 由于后端题目API不支持通过ID获取，我们获取所有题目然后筛选
    const response = await questionAPI.getQuestions();
    
    if (response.data && response.data.success && response.data.data) {
      // 检查不同的数据结构
      let questions = null;
      
      if (response.data.data.questions) {
        questions = response.data.data.questions;
      } else if (Array.isArray(response.data.data)) {
        questions = response.data.data;
      } else if (response.data.data.Data) {
        questions = response.data.data.Data;
      }
      
      if (questions && Array.isArray(questions)) {
        const question = questions.find((q: any) => q.id === questionId);
        
        if (question && editingStudent.value) {
          editingStudent.value.questionContent = question.question;
          editingStudent.value.questionUrl = question.url;
        }
      }
    }
  } catch (error) {
    console.error("获取题目详情失败:", error);
  }
};

// 渲染markdown内容
const renderMarkdown = (content: string): string => {
  if (!content) return '';
  try {
    return marked(content) as string;
  } catch (error) {
    console.error('Markdown渲染失败:', error);
    return content;
  }
};

// 判断是否为图片URL
const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // 检查base64数据URL
  if (url.startsWith('data:image/')) {
    return true;
  }
  
  // 检查文件扩展名
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
  return imageExtensions.test(url);
};

// 判断是否为视频URL
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  // 检查base64数据URL
  if (url.startsWith('data:video/')) {
    return true;
  }
  
  // 检查文件扩展名
  const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i;
  return videoExtensions.test(url);
};

// 处理媒体加载错误
const handleMediaError = (event: Event) => {
  console.error('媒体加载失败:', event);
  ElMessage.warning('媒体文件加载失败');
};

const saveStudent = async () => {
  if (!studentFormRef.value || !editingStudent.value) return;

  try {
    await studentFormRef.value.validate();
    saving.value = true;

    // 准备学生基本信息数据（只包含后端支持更新的字段）
    const studentData = {
      netid: editingStudent.value.netid,
      name: editingStudent.value.name,
      phone: editingStudent.value.phone,
      school: editingStudent.value.school,
      mastered: editingStudent.value.mastered,
      tomaster: editingStudent.value.tomaster,
      depart: editingStudent.value.depart,
      queid: editingStudent.value.queid || 0,
    };

    // 更新学生基本信息
    await studentAPI.updateStudent(editingStudent.value.id, studentData);

    // 如果有面试信息，更新面试信息
    if (editingStudent.value.interv) {
      const interviewData = {
        netid: editingStudent.value.netid,
        department: editingStudent.value.interv.department,
        star: editingStudent.value.interv.star,
        pass: editingStudent.value.interv.pass,
        evaluation: editingStudent.value.interv.evaluation,
      };

      await interviewAPI.updateInterview(
        editingStudent.value.interv.id,
        interviewData
      );
    }

    // 只有API调用成功后才更新本地数据
    const studentIndex = students.value.findIndex(
      (s) => s.id === editingStudent.value!.id
    );
    if (studentIndex !== -1) {
      students.value[studentIndex] = { ...editingStudent.value };
      updateStatistics();
    }

    ElMessage.success("学生信息更新成功");
    closeEdit();
  } catch (error) {
    console.error("保存失败:", error);
    const errorMessage = handleApiError(error);
    ElMessage.error(`保存失败: ${errorMessage}`);
  } finally {
    saving.value = false;
  }
};

// 格式化时间（显示几月几日 时:分）
const formatTime = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? "上午" : "下午";
  const displayHours = hours <= 12 ? hours : hours - 12;
  const displayHours12 = displayHours === 0 ? 12 : displayHours;
  return `${period}${displayHours12}:${minutes.toString().padStart(2, "0")}`;
};

const formatMonthDay = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

// 选择日期
const selectDate = async (date: string) => {
  selectedDate.value = date;
  await fetchInterviewsByDate(date);
};

// 获取面试日期列表
const fetchInterviewDates = async () => {
  try {
    const response = await interviewAPI.getInterviewDates();
    if (response.data && response.data.success) {
      interviewDates.value = response.data.data || [];
    }
  } catch (error) {
    console.error("获取面试日期失败:", error);
    // 使用模拟数据
    interviewDates.value = [
      { date: "2025-07-05", total: 1 },
      { date: "2025-07-06", total: 3 },
      { date: "2025-07-07", total: 2 },
    ];
  }
};

// 预加载所有日期的已预约面试数量
const preloadBookedInterviewCounts = async () => {
  // 为每个有面试的日期获取已预约数量
  const loadPromises = interviewDates.value.map(async (dateInfo) => {
    try {
      const dateParam = `${dateInfo.date}T00:00:00Z`;
      const response = await interviewAPI.getInterviewsByDate(dateParam);
      if (response.data && response.data.success) {
        const unavailableCount = response.data.data?.unavailable?.length || 0;
        bookedInterviewCounts.value.set(dateInfo.date, unavailableCount);
      } else {
        bookedInterviewCounts.value.set(dateInfo.date, 0);
      }
    } catch (error) {
      console.error(`获取 ${dateInfo.date} 面试信息失败:`, error);
      bookedInterviewCounts.value.set(dateInfo.date, 0);
    }
  });

  await Promise.all(loadPromises);
};

// 获取某天的面试信息
const fetchInterviewsByDate = async (date: string) => {
  loading.value = true;
  try {
    // 构造标准格式的时间参数
    const dateParam = `${date}T00:00:00Z`;
    const response = await interviewAPI.getInterviewsByDate(dateParam);

    if (response.data && response.data.success) {
      dailyInterviewsData.value = response.data.data || {
        available: [],
        unavailable: [],
      };
      // 更新该日期的已预约面试数量
      const unavailableCount =
        dailyInterviewsData.value.unavailable?.length || 0;
      bookedInterviewCounts.value.set(date, unavailableCount);
    } else {
      dailyInterviewsData.value = { available: [], unavailable: [] };
      bookedInterviewCounts.value.set(date, 0);
    }
  } catch (error) {
    console.error("获取面试信息失败:", error);
    dailyInterviewsData.value = { available: [], unavailable: [] };
  } finally {
    loading.value = false;
  }
};

// 检查某日是否有面试
const hasInterviewsOnDate = (date: string) => {
  return interviewDates.value.some((dateInfo) => dateInfo.date === date);
};

// 检查是否为选中日期
const isSelectedDate = (date: string) => {
  return selectedDate.value === date;
};

// 获取某日的面试数量（已预约的面试）
const getInterviewCountForDate = (date: string) => {
  // 从已预约面试数量映射中获取
  const count = bookedInterviewCounts.value.get(date);
  return count !== undefined ? count : 0;
};

const loadMockData = () => {
  students.value = [
    {
      id: 1,
      openid: "wx123456",
      netid: "test001",
      name: "张三",
      phone: "13800138001",
      school: "新雅书院",
      whereknow: "朋友介绍",
      mastered: "JavaScript, HTML, CSS",
      tomaster: "Vue.js, Node.js",
      depart: "tech",
      tag: "前端开发",
      interv: {
        id: 1,
        netid: "test001",
        time: "2025-07-05 14:00:00",
        interviewer: "李四",
        department: "tech",
        star: 4,
        evaluation: "基础扎实，学习能力强",
        pass: 1,
      },
      message: 7,
      queid: 1,
    },
    {
      id: 2,
      openid: "wx234567",
      netid: "test002",
      name: "王五",
      phone: "13800138002",
      school: "苏世民书院",
      whereknow: "网上看到",
      mastered: "Photoshop, Illustrator",
      tomaster: "After Effects, Premiere",
      depart: "art",
      tag: "设计爱好者",
      message: 3,
      queid: 2,
    },
  ];
  updateStatistics();
};

// 搜索和筛选方法
const handleSmartSearch = (value: string) => {};

const clearSmartSearch = () => {
  smartSearchText.value = "";
};

// 生命周期
onMounted(async () => {
  // 初始化当前周开始日期为本周一
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  currentWeekStart.value = weekStart;

  // 获取数据
  await fetchStudents();
  await fetchInterviewDates();

  // 预加载所有日期的已预约面试数量
  await preloadBookedInterviewCounts();

  // 获取当前日期的面试信息
  await fetchInterviewsByDate(selectedDate.value);
});
</script>

<style scoped>
.interview-management {
  padding: 20px;
  background-color: #f8f9fa;
}

.main-layout {
  display: grid;
  grid-template-columns: 8fr 5fr;
  gap: 20px;
  height: calc(100vh - 135px);
  min-height: 0;
}

.left-panel {
  display: flex;
  flex-direction: column;
}

.banner-container {
  flex-shrink: 0;
  border-radius: 8px;
}

.banner-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 180px);
  min-height: 0;
  overflow: hidden;
}

.filter-card {
  flex-shrink: 0;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

:deep(.filter-card .el-card__body) {
  padding-bottom: 0;
}

.table-card {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: transparent !important;
  height: 100%;
  box-sizing: border-box;
}

:deep(.table-card .el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.student-cards-container {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.student-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: fit-content;
  min-width: 365px;
  margin-bottom: 0;
}

.student-card:hover {
  border-color: #b3d8ff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

:deep(.student-card.el-card) {
  box-shadow: none !important;
}

.card-main-info-with-icon {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 16px;
}

.card-icon-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-width: 40px;
  max-width: 40px;
}
.card-icon-vertical img {
  width: 36px;
  height: 36px;
  display: block;
}

.card-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.student-info-maxwidth {
  max-width: 340px;
  min-width: 0;
  word-break: break-all;
}

.student-card .card-main-info {
  margin-bottom: 12px;
}

.student-card .card-main-info .student-name {
  font-size: 16px;
  color: #303133;
  margin: 0;
  text-align: left;
}

.student-card .card-detail-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.student-card .info-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.student-card .info-item:first-child {
  justify-content: flex-start;
}

.student-card .info-item:last-child {
  justify-content: flex-end;
}

.card-main-info-flex {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  position: relative;
}

.card-more-options {
  position: absolute;
  right: 0;
  bottom: 0;
  margin: 12px 12px 0 0;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  height: 24px;
}

.more-icon {
  width: 18px;
  height: 18px;
  display: block;
}

.student-card .department-text {
  font-size: 14px;
  color: #9aa0a6;
}

.student-card .time-text {
  font-size: 14px;
  color: #9aa0a6;
}

.student-card .statue-text {
  font-size: 14px;
  color: #9aa0a6;
  font-family: "Segoe UI";
}

.table-card .el-table {
  flex: 1;
}

.edit-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.edit-card .el-card__body {
  flex: 1;
  padding: 0;
  border: none;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  padding: 0 !important;
  margin: 0 !important;
}

.close-icon {
  width: 20px;
  height: 20px;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.close-icon:hover {
  opacity: 0.7;
}

.form-section {
  margin-bottom: 15px;
}

.section-header {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  margin-top: auto;
}

.schedule-card {
  height: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.schedule-card .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.schedule-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.no-interviews {
  padding: 60px 0;
  text-align: center;
}

.department-text {
  font-size: 12px;
  color: #9aa0a6;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.time-text {
  font-size: 12px;
  color: #9aa0a6;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.statue-text {
  font-size: 12px;
  color: #9aa0a6;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.interview-card {
  margin-left: 20px;
  flex: 1;
  background: #f1efff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.interview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.student-name {
  padding: 2px 6px;
  font-size: 18px;
  color: #303133;
}

.pagination-container {
  display: flex;
  margin-top: 20px;
  text-align: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 0;
}

.pagination {
  background-color: transparent;
}

:deep(.pagination) {
  color: #9aa0a6 !important;
  gap: 16px;
}

.smart-search-row {
  margin-bottom: 0;
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-label {
  font-size: 30px;
  color: #303133;
  min-width: 40px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  overflow: hidden;
}

:deep(.el-input__wrapper) {
  border-radius: 95px;
  border: 0;
  box-shadow: 0 0 0 0px;
}

.calendar-container {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.calendar-title {
  font-size: 18px;
  color: #303133;
}

.arrow-btn {
  border: none;
  background: transparent;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.arrow-icon {
  width: 20px;
  height: 20px;
  display: block;
}

.two-week-calendar {
  border-radius: 8px;
  overflow: hidden;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.week-day {
  padding: 12px;
  text-align: center;
  color: #bdc1c6;
  font-size: 12px;
}

.week-day:last-child {
  border-right: none;
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.week-row:last-child {
  border-bottom: none;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background-color: white;
}

.calendar-cell:last-child {
  border-right: none;
}

.calendar-cell .date-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.3s ease;
}

.calendar-cell:hover .date-number {
  background-color: #f1efff;
}

.calendar-cell.selected-date .date-number {
  background-color: #725dff;
  color: white;
}

.calendar-cell.has-interviews .date-number {
  background-color: #e8f5e8;
  border: 2px solid #67c23a;
}

.calendar-cell.has-interviews.selected-date .date-number {
  background-color: #409eff;
  color: white;
  border: 2px solid #409eff;
}

.calendar-cell.other-month .date-number {
  color: #c0c4cc;
}

.calendar-cell.other-month:hover .date-number {
  background-color: #f0f0f0;
  color: #c0c4cc;
}

.interview-dot {
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  position: absolute;
  bottom: 4px;
  right: 4px;
}

.calendar-cell.selected-date .interview-dot {
  background-color: white;
  color: #409eff;
}

.calendar-cell.other-month .interview-dot {
  background-color: #c0c4cc;
  color: white;
}

.daily-schedule {
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  height: 100%;
}

.schedule-title {
  font-size: 18px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.interview-schedule-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.interview-schedule-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  max-height: 460px;
  gap: 12px;
  min-height: 0;
}

/* 自定义滚动条样式 */
.interview-schedule-list::-webkit-scrollbar {
  width: 6px;
}

.interview-schedule-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

.interview-schedule-list::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.interview-schedule-list::-webkit-scrollbar-thumb:hover {
  background: #a4a9ae;
}

.schedule-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 8px;
}

.schedule-item:hover {
  background-color: #f8f9fa;
}

.schedule-time {
  min-width: 60px;
  font-size: 14px;
  color: #9aa0a6;
  text-align: left;
  padding: 8px 0;
  display: flex;
  align-items: center;
}

.schedule-item:hover .interview-card {
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  border-color: #b3d8ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.department-tag {
  color: #a192ff;
  font-size: 14px;
}

.more-options {
  color: #c0c4cc;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.more-options:hover {
  color: #409eff;
  background-color: #f0f7ff;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.interviewer-info,
.candidate-info,
.question-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interviewer-info .label,
.candidate-info .label,
.question-info .label {
  font-size: 13px;
  color: #725dff;
  min-width: 80px;
}

.interviewer-info .value,
.candidate-info .value,
.question-info .value {
  font-size: 13px;
  color: #725dff;
  flex: 1;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .right-panel {
    margin-top: 20px;
  }
}

@media (max-width: 1300px) {
  .student-info-maxwidth {
    max-width: 240px;
  }
}
/* 表格行点击效果 */
.el-table .el-table__row {
  cursor: pointer;
}

.el-table .el-table__row:hover {
  background-color: #f5f7fa;
}

:deep(.el-pager li:not(.is-active)) {
  display: none;
}

:deep(.el-pagination .el-pager li) {
  margin: 0 10px;
  background-color: #f6f7f8;
}

:deep(.el-pagination .el-pager li.is-active) {
  color: #9aa0a6;
  background-color: transparent;
}

:deep(.btn-prev, .btn-prev.is-disabled) {
  background-color: transparent !important;
  border: none;
  color: #9aa0a6;
}

:deep(.btn-next, .btn-next.is-disabled) {
  background-color: transparent !important;
  border: none;
  color: #9aa0a6;
}

:deep(.el-card) {
  box-shadow: none !important;
  border: none;
}

/* 题目显示样式 */
.question-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.markdown-content {
  line-height: 1.6;
  color: #333;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: bold;
  color: #2c3e50;
}

.markdown-content :deep(h1) { font-size: 1.8em; }
.markdown-content :deep(h2) { font-size: 1.5em; }
.markdown-content :deep(h3) { font-size: 1.3em; }

.markdown-content :deep(p) {
  margin: 8px 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
}

.markdown-content :deep(blockquote) {
  margin: 16px 0;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
  font-style: italic;
}

.markdown-content :deep(code) {
  background-color: #f1f3f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background-color: #f8f8f8;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin: 16px 0;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}

.markdown-content :deep(video) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(table th) {
  background-color: #f8f9fa;
  font-weight: bold;
}

.no-question {
  color: #666;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

.question-url {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

/* 题目媒体显示样式 */
.question-media {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.question-image {
  max-width: 100%;
  max-height: 400px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.question-image:hover {
  transform: scale(1.02);
}

.question-video {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.question-link {
  text-align: center;
}
</style>
