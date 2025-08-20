<template>
  <div class="schedule-container">
    <div class="main-layout">
      <!-- 左侧时间表 -->
      <div class="schedule-grid">
        <div class="schedule-header">
          <div class="header-left">
            <div class="week-title">
              <span class="week-title-text">计划任务</span>
              <span class="week-text">{{ currentWeekText }}</span>
            </div>
          </div>
          <div class="header-right">
            <el-button-group class="nav-buttons">
              <el-button @click="previousWeek" class="nav-button">
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
              <el-button @click="nextWeek" class="nav-button">
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </el-button-group>
          </div>
        </div>

        <!-- 时间表头部 - 显示日期 -->
        <div class="schedule-header-grid">
          <div class="time-column-header">时间</div>
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="day-header"
            :class="{ today: isToday(day.date) }"
          >
            <div class="day-number">{{ day.dayNum }}</div>
            <div class="day-name">{{ day.dayName }}</div>
          </div>
        </div>

        <!-- 时间表主体 -->
        <div class="schedule-body">
          <div
            v-for="timeSlot in timeSlots"
            :key="timeSlot.time"
            class="time-row"
          >
            <!-- 时间列 -->
            <div class="time-cell">{{ timeSlot.display }}</div>

            <!-- 每天的时间格子 -->
            <div
              v-for="day in weekDays"
              :key="`${day.date}-${timeSlot.time}`"
              class="schedule-cell"
              @click="handleCellClick(day.date, timeSlot.time)"
            >
              <div
                v-for="interview in getInterviewsForSlot(
                  day.date,
                  timeSlot.time
                )"
                :key="interview.id"
                class="interview-item interview-bg"
                :class="[
                  getDepartmentClass(interview.department),
                  getStatusClass(interview.status),
                ]"
                @click.stop="showInterviewDetail(interview)"
                :style="getInterviewItemStyle(interview.datetime)"
              >
                <span
                  class="interview-legend-dot"
                  :class="getDepartmentClass(interview.department)"
                ></span>
                <div class="interview-candidate">
                  {{ interview.candidate }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧月历和图例 -->
      <div class="sidebar-panel">
        <div style="display: flex; gap: 12px; margin-bottom: 8px">
          <el-card
            class="add-interview-card"
            :body-style="{ padding: '12px' }"
            @click="showManageTimeDialog = true"
            style="flex: 1; cursor: pointer"
          >
            <div class="add-interview-btn">
              <img :src="AddIcon" alt="add" class="add-icon" />
              <span class="add-text">管理面试时间</span>
            </div>
          </el-card>
          <el-card
            class="add-interview-card"
            :body-style="{ padding: '12px' }"
            @click="showAddDialog = true"
            style="flex: 1; cursor: pointer"
          >
            <div class="add-interview-btn">
              <img :src="AddIcon" alt="add" class="add-icon" />
              <span class="add-text">添加新面试</span>
            </div>
          </el-card>
        </div>
        <!-- 月历 -->
        <el-card class="calendar-card">
          <div class="calendar-header">
            <el-button
              link
              type="primary"
              @click="changeMonth(-1)"
              class="month-nav"
            >
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <span class="month-title">{{ currentMonthText }}</span>
            <el-button
              link
              type="primary"
              @click="changeMonth(1)"
              class="month-nav"
            >
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="mini-calendar">
            <div class="calendar-weeks">
              <div class="week-header">
                <div
                  v-for="day in [
                    '周一',
                    '周二',
                    '周三',
                    '周四',
                    '周五',
                    '周六',
                    '周日',
                  ]"
                  :key="day"
                  class="week-day"
                >
                  {{ day }}
                </div>
              </div>
              <div class="calendar-grid">
                <div
                  v-for="date in calendarDates"
                  :key="date.date"
                  class="calendar-date"
                  :class="{
                    'current-month': date.isCurrentMonth,
                    selected: date.isSelected,
                  }"
                  @click="selectDate(date)"
                >
                  <div class="date-number">{{ date.day }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 部门图例 -->
        <el-card class="legend-card">
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-color tech"></div>
              <span>技术部</span>
            </div>
            <div class="legend-item">
              <div class="legend-color video"></div>
              <span>视频部</span>
            </div>
            <div class="legend-item">
              <div class="legend-color art"></div>
              <span>美工部</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 面试详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="面试详情" width="800px">
      <div v-if="selectedInterview" class="interview-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="候选人">
            {{ selectedInterview.candidate }}
          </el-descriptions-item>
          <el-descriptions-item label="时间">
            {{ formatDateTime(selectedInterview.datetime) }}
          </el-descriptions-item>
          <el-descriptions-item label="面试官">
            {{ selectedInterview.interviewer }}
          </el-descriptions-item>
          <el-descriptions-item label="部门">
            {{ getDepartmentName(selectedInterview.department) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ selectedInterview.notes || "无" }}
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 学生详细信息 -->
        <div class="student-detail-section" style="margin-top: 20px;">
          <el-divider>学生详细信息</el-divider>
          <el-loading v-loading="loadingStudentDetail">
            <div v-if="studentDetail" class="student-info">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="学号">
                  {{ studentDetail.netid }}
                </el-descriptions-item>
                <el-descriptions-item label="姓名">
                  {{ studentDetail.name }}
                </el-descriptions-item>
                <el-descriptions-item label="电话">
                  {{ studentDetail.phone }}
                </el-descriptions-item>
                <el-descriptions-item label="书院">
                  {{ studentDetail.school }}
                </el-descriptions-item>
                <el-descriptions-item label="已掌握技能" span="2">
                  {{ studentDetail.mastered }}
                </el-descriptions-item>
                <el-descriptions-item label="想掌握技能" span="2">
                  {{ studentDetail.tomaster }}
                </el-descriptions-item>
              </el-descriptions>
              
              <!-- 抽到的题目 -->
              <div v-if="studentDetail.queid && studentDetail.queid > 0" class="question-section" style="margin-top: 16px;">
                <el-divider>面试题目</el-divider>
                <div class="question-content">
                  <div v-if="studentDetail.questionContent" class="markdown-content">
                    <div v-html="renderMarkdown(studentDetail.questionContent)"></div>
                  </div>
                  <div v-else class="no-question">
                    题目ID: {{ studentDetail.queid }} (题目内容获取失败)
                  </div>
                  
                  <!-- 如果有题目链接，直接嵌入显示图片/视频 -->
                  <div v-if="studentDetail.questionUrl" class="question-media" style="margin-top: 12px;">
                    <!-- 图片显示 -->
                    <img 
                      v-if="isImageUrl(studentDetail.questionUrl)" 
                      :src="studentDetail.questionUrl" 
                      :alt="'题目图片'" 
                      class="question-image"
                      @error="handleMediaError"
                    />
                    <!-- 视频显示 -->
                    <video 
                      v-else-if="isVideoUrl(studentDetail.questionUrl)" 
                      :src="studentDetail.questionUrl" 
                      controls 
                      class="question-video"
                      @error="handleMediaError"
                    >
                      您的浏览器不支持视频播放
                    </video>
                    <!-- 其他链接显示为可点击链接 -->
                    <div v-else class="question-link">
                      <el-link :href="studentDetail.questionUrl" target="_blank" type="primary">
                        查看题目附件/链接
                      </el-link>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="no-question" style="margin-top: 16px;">
                <el-alert
                  title="该学生尚未抽取题目"
                  type="info"
                  :closable="false">
                </el-alert>
              </div>
            </div>
            
            <div v-else-if="!loadingStudentDetail" class="no-student-detail">
              <el-alert
                title="无法获取学生详细信息"
                type="warning"
                :closable="false">
              </el-alert>
            </div>
          </el-loading>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <el-button type="primary" @click="editInterview" :loading="saving">
            修改时间
          </el-button>
          <el-button type="danger" @click="cancelInterview" :loading="deleting">
            取消面试
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加/编辑面试对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑面试' : '添加面试'"
      width="400px"
    >
      <el-form
        :model="interviewForm"
        :rules="interviewRules"
        ref="interviewFormRef"
        label-width="100px"
      >
        <el-form-item label="面试日期" prop="date">
          <el-date-picker
            v-model="interviewForm.date"
            type="date"
            placeholder="选择面试日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @change="handleInterviewDateChange"
          />
        </el-form-item>
        <el-form-item label="面试时间" prop="datetime">
          <el-select
            v-model="interviewForm.datetime"
            placeholder="请选择时间"
            style="width: 100%"
            :disabled="timeOptions.length === 0"
          >
            <el-option
              v-for="item in timeOptions"
              :key="item.time"
              :label="
                formatTimeLabel(item.time) + (item.disabled ? '（已占用）' : '')
              "
              :value="item.time"
              :disabled="item.disabled"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学号" prop="candidate">
          <el-input
            v-model="interviewForm.candidate"
            placeholder="请输入学号"
          />
        </el-form-item>
        <el-form-item label="面试部门" prop="department">
          <el-select
            v-model="interviewForm.department"
            placeholder="选择部门"
            style="width: 100%"
          >
            <el-option label="技术部" value="tech" />
            <el-option label="视频部" value="video" />
            <el-option label="美工部" value="art" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveInterview" :loading="saving">
            {{ isEdit ? "更新" : "保存" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 管理面试时间对话框 -->
    <el-dialog
      v-model="showManageTimeDialog"
      title="管理面试时间"
      width="400px"
    >
      <el-form :model="manageTimeForm" label-width="90px">
        <el-form-item label="日期">
          <el-date-picker
            v-model="manageTimeForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-picker
            v-model="manageTimeForm.startTime"
            placeholder="选择开始时间"
            format="HH:mm"
            value-format="HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker
            v-model="manageTimeForm.endTime"
            placeholder="选择结束时间"
            format="HH:mm"
            value-format="HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="时间间隔">
          <el-input-number
            v-model="manageTimeForm.interval"
            :min="5"
            :max="180"
            :step="5"
            style="width: 100%"
            placeholder="分钟"
          />
          <span style="margin-left: 8px">分钟</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showManageTimeDialog = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleManageTimeSave"
            :loading="savingTime"
            >保存</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { interviewAPI, studentAPI, handleApiError, questionAPI } from "../api";
import AddIcon from "../assets/Linear - Essentional, UI - Add Circle.svg";
import type { CSSProperties } from "vue";
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

interface ScheduleInterview {
  id: number;
  title: string;
  candidate: string;
  netid: string;
  datetime: string;
  interviewer: string;
  department: string;
  status: string;
  notes?: string;
}

interface StudentDetail {
  id: number;
  netid: string;
  name: string;
  phone: string;
  school: string;
  mastered: string;
  tomaster: string;
  depart: string;
  queid: number;
  questionContent?: string;
  questionUrl?: string;
}

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const showDetailDialog = ref(false);
const showAddDialog = ref(false);
const showManageTimeDialog = ref(false);
const isEdit = ref(false);

// 管理面试时间表单
const manageTimeForm = reactive({
  date: "",
  startTime: "",
  endTime: "",
  interval: 30,
});
const savingTime = ref(false);

const currentWeek = ref(new Date());
const currentMonth = ref(new Date());
const selectedInterview = ref<ScheduleInterview | null>(null);
const studentDetail = ref<StudentDetail | null>(null);
const loadingStudentDetail = ref(false);
const interviews = ref<ScheduleInterview[]>([]);
const interviewDates = ref<InterviewDateInfo[]>([]);

// 表单数据
const interviewForm = reactive({
  date: "", // 新增：面试日期
  datetime: "", // 选中的具体时间
  candidate: "",
  department: "",
});

// 可用/不可用时间段
interface TimeOption {
  time: string;
  disabled: boolean;
}
const timeOptions = ref<TimeOption[]>([]);

// 格式化时间，仅显示 xx:xx:xx
function formatTimeLabel(time: string) {
  if (!time) return "";
  let t = time;
  if (t.includes("T")) {
    t = t.split("T")[1];
    t = t.replace(/([\+\-][0-9:]+|Z)$/i, "");
  } else if (t.includes(" ")) {
    t = t.split(" ")[1];
  }
  const parts = t.split(":");
  if (parts.length >= 2) {
    return parts.slice(0, 3).join(":");
  }
  return t;
}

// 选择日期后获取可用/不可用时间
const handleInterviewDateChange = async (date: string) => {
  interviewForm.datetime = "";
  timeOptions.value = [];
  if (!date) return;
  try {
    // 构造标准格式时间（当天0点，UTC）
    const dateParam = `${date}T00:00:00Z`;
    const res = await interviewAPI.getInterviewsByDate(dateParam);
    if (res.data && res.data.success && res.data.data) {
      const available = Array.isArray(res.data.data.available)
        ? res.data.data.available
        : [];
      const unavailable = Array.isArray(res.data.data.unavailable)
        ? res.data.data.unavailable
        : [];
      // 合并所有时间，available优先
      const allTimes: TimeOption[] = [];
      available.forEach((item: any) => {
        allTimes.push({ time: item.time, disabled: false });
      });
      unavailable.forEach((item: any) => {
        if (!allTimes.some((opt) => opt.time === item.time)) {
          allTimes.push({ time: item.time, disabled: true });
        }
      });
      // 按时间排序
      allTimes.sort((a, b) => a.time.localeCompare(b.time));
      timeOptions.value = allTimes;
    } else {
      timeOptions.value = [];
    }
  } catch (e) {
    timeOptions.value = [];
  }
};

const interviewFormRef = ref();

// 表单验证规则
const interviewRules = {
  date: [{ required: true, message: "请选择面试日期", trigger: "change" }],
  datetime: [{ required: true, message: "请选择面试时间", trigger: "change" }],
  candidate: [{ required: true, message: "请输入候选人学号", trigger: "blur" }],
  department: [
    { required: true, message: "请选择面试部门", trigger: "change" },
  ],
};

// 时间段配置
const timeSlots = [
  { time: "08:00", display: "上午08:00" },
  { time: "09:00", display: "上午09:00" },
  { time: "10:00", display: "上午10:00" },
  { time: "11:00", display: "上午11:00" },
  { time: "12:00", display: "中午12:00" },
  { time: "13:00", display: "下午1:00" },
  { time: "14:00", display: "下午2:00" },
  { time: "15:00", display: "下午3:00" },
  { time: "16:00", display: "下午4:00" },
  { time: "17:00", display: "下午5:00" },
  { time: "18:00", display: "下午6:00" },
  { time: "19:00", display: "下午7:00" },
  { time: "20:00", display: "下午8:00" },
  { time: "21:00", display: "下午9:00" },
  { time: "22:00", display: "下午10:00" },
  { time: "23:00", display: "下午11:00" },
  { time: "24:00", display: "下午12:00" },
];

// 计算属性
const currentWeekText = computed(() => {
  // 获取当前时间
  const now = new Date();
  let currentDay = new Date(now);
  if (now.getHours() < 8) {
    currentDay.setDate(currentDay.getDate());
  }
  const startOfWeek = getStartOfWeek(currentDay);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const year = startOfWeek.getFullYear();
  const month = startOfWeek.getMonth() + 1;
  const weekNum = getWeekNumber(startOfWeek);

  return `${year}年${month}月第${weekNum}周`;
});

const currentMonthText = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth() + 1;
  return `${year}年${month}月`;
});

const weekDays = computed(() => {
  const days = [];
  const startOfWeek = getStartOfWeek(currentWeek.value);
  const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const isoDate = toISODateString(date);
    const dayObj = {
      date: isoDate,
      dayNum: date.getDate(),
      dayName: dayNames[i],
    };
    days.push(dayObj);
  }
  return days;
});

const calendarDates = computed(() => {
  const dates = [];
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();

  // 获取当月第一天
  const firstDay = new Date(year, month, 1);

  // 获取第一周的开始日期（周一）
  const startDate = getStartOfWeek(firstDay);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDayWeek = firstDay.getDay();
  firstDayWeek = firstDayWeek === 0 ? 6 : firstDayWeek - 1;
  const totalDays = firstDayWeek + daysInMonth;
  const weeks = Math.ceil(totalDays / 7);
  const daysToShow = weeks > 5 ? 42 : 35;

  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(startDate.getTime());
    date.setDate(date.getDate() + i);

    const isCurrentMonth = date.getMonth() === month;
    const isToday = formatDate(date) === formatDate(new Date());
    // 生成日历格子的日期字符串
    const calendarDateStr = (() => {
      const d = new Date(date);
      d.setDate(date.getDate() + 1);
      return d.toISOString().split("T")[0];
    })();
    // 选中状态：当前选中的日期
    const isSelected = calendarDateStr === selectedCalendarDate.value;

    let dateStr = date.toISOString().split("T")[0];
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    dateStr = nextDate.toISOString().split("T")[0];

    dates.push({
      date: calendarDateStr,
      day: date.getDate(),
      isCurrentMonth,
      isSelected,
    });
  }

  return dates;
});

// 工具方法
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const result = new Date(d.setDate(diff));
  return result;
};

const getWeekNumber = (date: Date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};

const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN");
};

// 将本地日期对象转为 yyyy-mm-dd 字符串
function toISODateString(dateObj: Date): string {
  const localStr = dateObj.toLocaleDateString("zh-CN");
  const parts = localStr.split(/[\/-]/);
  let yyyy = parts[0];
  let mm = parts[1].padStart(2, "0");
  let dd = parts[2].padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const isToday = (date: string) => {
  const today = new Date();
  const isoDate = toISODateString(today);
  return date === isoDate;
};

const getDepartmentName = (dept: string) => {
  const deptMap: Record<string, string> = {
    tech: "技术部",
    video: "视频部",
    art: "美工部",
  };
  return deptMap[dept] || dept;
};

const getDepartmentClass = (dept: string) => {
  return dept || "tech";
};

const getStatusClass = (status: string) => {
  return "scheduled";
};

// 获取指定时间段的面试（返回该时间段内所有开始的面试）
const getInterviewsForSlot = (date: string, time: string) => {
  // 只返回在该时间格子内开始的面试
  return interviews.value.filter((interview) => {
    const interviewDate = new Date(interview.datetime);
    const interviewDateStr = formatDate(interviewDate);
    const interviewTime =
      interviewDate.getHours().toString().padStart(2, "0") + ":00";
    return interviewDateStr === date && interviewTime === time;
  });
};

// 获取指定日期的面试
const getInterviewsForDate = (date: string) => {
  return interviews.value.filter((interview) => {
    const interviewDate = new Date(interview.datetime);
    const interviewDateStr = formatDate(interviewDate);
    return interviewDateStr === date;
  });
};

// 事件处理方法
const previousWeek = () => {
  const newDate = new Date(currentWeek.value);
  newDate.setDate(newDate.getDate() - 7);
  currentWeek.value = newDate;
  loadInterviews();
};

const nextWeek = () => {
  const newDate = new Date(currentWeek.value);
  newDate.setDate(newDate.getDate() + 7);
  currentWeek.value = newDate;
  loadInterviews();
};

const changeMonth = (direction: number) => {
  const newDate = new Date(currentMonth.value);
  newDate.setMonth(newDate.getMonth() + direction);
  currentMonth.value = newDate;
};

// 日历选中日期
const selectedCalendarDate = ref(toISODateString(new Date()));

const selectDate = (dateInfo: any) => {
  // 选择日期时高亮，并跳转到对应周
  selectedCalendarDate.value = dateInfo.date;
  const selectedDate = new Date(dateInfo.date);
  currentWeek.value = selectedDate;
  loadInterviews();
};

const handleCellClick = (date: string, time: string) => {
  // 点击空白格子时，预填充时间并打开添加对话框
  const datetime = `${date} ${time}:00:00`;
  Object.assign(interviewForm, {
    date: date,
    datetime,
    candidate: "",
    department: "",
  });
  isEdit.value = false;
  showAddDialog.value = true;
};

const showInterviewDetail = async (interview: ScheduleInterview) => {
  selectedInterview.value = interview;
  studentDetail.value = null;
  showDetailDialog.value = true;
  
  // 获取学生详情
  if (interview.netid) {
    await fetchStudentDetail(interview.netid);
  }
};

// 获取学生详情
const fetchStudentDetail = async (netid: string) => {
  try {
    loadingStudentDetail.value = true;
    const response = await studentAPI.getStudentDetail(netid);
    
    if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
      const student = response.data.data[0]; // 取第一个学生对象
      studentDetail.value = {
        id: student.id,
        netid: student.netid,
        name: student.name,
        phone: student.phone,
        school: student.school,
        mastered: student.mastered,
        tomaster: student.tomaster,
        depart: student.depart,
        queid: student.queid || 0,
      };
      
      // 如果学生有题目ID，获取题目内容
      if (student.queid && student.queid > 0) {
        await fetchQuestionDetail(student.queid);
      }
    }
  } catch (error) {
    console.error("获取学生详情失败:", error);
    ElMessage.error("获取学生详情失败: " + handleApiError(error));
  } finally {
    loadingStudentDetail.value = false;
  }
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
        
        if (question && studentDetail.value) {
          studentDetail.value.questionContent = question.question;
          studentDetail.value.questionUrl = question.url;
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

const saveInterview = async () => {
  if (!interviewFormRef.value) return;
  try {
    await interviewFormRef.value.validate();
    saving.value = true;

    if (isEdit.value && selectedInterview.value) {
      // 编辑模式：更新现有面试
      const payload = {
        time: interviewForm.datetime,
        netid: interviewForm.candidate,
        department: interviewForm.department,
      };
      await interviewAPI.updateInterview(selectedInterview.value.id, payload);
      ElMessage.success("面试更新成功");
    } else {
      // 添加模式：创建新面试
      const payload = {
        time: interviewForm.datetime,
        netid: interviewForm.candidate,
        department: interviewForm.department,
      };
      await interviewAPI.createNewInterview(payload);
      ElMessage.success("面试添加成功");
    }

    await loadInterviews();
    showAddDialog.value = false;
    isEdit.value = false;
  } catch (error: any) {
    console.error("保存失败:", error);

    const errorMessage = handleApiError(error);
    ElMessage.error(errorMessage);
  } finally {
    saving.value = false;
  }
};

// 编辑面试 - 打开编辑对话框
const editInterview = () => {
  if (!selectedInterview.value) return;

  // 填充编辑表单
  const datetime = new Date(selectedInterview.value.datetime);
  const dateStr = datetime.toISOString().split("T")[0];
  const timeStr = selectedInterview.value.datetime;

  Object.assign(interviewForm, {
    date: dateStr,
    datetime: timeStr,
    candidate: selectedInterview.value.netid, // 使用学号而不是姓名
    department: selectedInterview.value.department,
  });

  isEdit.value = true;
  showDetailDialog.value = false;
  showAddDialog.value = true;

  // 加载可用时间选项
  handleInterviewDateChange(dateStr);
};

// 取消面试
const cancelInterview = async () => {
  if (!selectedInterview.value) return;

  try {
    await ElMessageBox.confirm(
      "确定要取消这个面试吗？此操作不可恢复。",
      "确认取消",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    deleting.value = true;
    await interviewAPI.deleteInterview(selectedInterview.value.id);
    ElMessage.success("面试已取消");
    await loadInterviews();
    showDetailDialog.value = false;
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("取消面试失败:", error);
      const errorMessage = handleApiError(error);
      ElMessage.error(`取消面试失败: ${errorMessage}`);
    }
  } finally {
    deleting.value = false;
  }
};

const loadInterviews = async () => {
  loading.value = true;
  try {
    // 获取面试日期列表
    await fetchInterviewDates();

    // 获取当前周的面试数据
    const weekStart = getStartOfWeek(currentWeek.value);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // 为当前周的每一天获取面试数据
    const promises = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = toISODateString(currentDate);
      promises.push(fetchInterviewsByDate(dateStr));
    }

    await Promise.all(promises);
  } catch (error) {
    console.error("加载面试数据失败:", error);
    ElMessage.error("加载数据失败");
    // 使用模拟数据
    loadMockData();
  } finally {
    loading.value = false;
  }
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

// 获取某天的面试信息并转换为日程格式
const fetchInterviewsByDate = async (date: string) => {
  try {
    // 构造标准格式的时间参数
    const dateParam = `${date}T00:00:00Z`;
    const response = await interviewAPI.getInterviewsByDate(dateParam);

    if (response.data && response.data.success) {
      const data = response.data.data;

      // 转换为日程格式
      const convertedInterviews: ScheduleInterview[] = [];

      if (data === null) {
        console.log(`${date} 当天没有面试`);
      } else {
        if (data.unavailable && Array.isArray(data.unavailable)) {
          // 并发获取所有学生姓名
          const namePromises = data.unavailable.map(
            async (interview: Interview) => {
              const name = interview.netid
                ? await getStudent(interview.netid)
                : null;
              return {
                id: interview.id,
                title: `面试-${name || interview.netid || "未知学生"}`,
                candidate: name || interview.netid || "未知学生",
                netid: interview.netid || "",
                datetime: interview.time,
                interviewer: interview.interviewer || "面试官",
                department: interview.department || "未知部门",
                status: "scheduled",
                notes: interview.evaluation || "",
              };
            }
          );
          const interviewsWithNames = await Promise.all(namePromises);
          convertedInterviews.push(...interviewsWithNames);
        }
      }

      // 移除该日期的旧数据，添加新数据
      interviews.value = interviews.value.filter((int) => {
        const intDate = new Date(int.datetime).toISOString().split("T")[0];
        return intDate !== date;
      });

      interviews.value = [...interviews.value, ...convertedInterviews];
    }
  } catch (error) {
    console.error("获取面试信息失败:", error);
  }
};

//获取学生姓名
const getStudent = async (netid: string): Promise<string | null> => {
  try {
    const response = await studentAPI.getStudents({ netid }); // 传递学号
    if (
      response.data &&
      response.data.success &&
      Array.isArray(response.data.data) &&
      response.data.data.length > 0
    ) {
      return response.data.data[0].name || null;
    }
  } catch (error) {
    console.error("获取学生数据失败:", error);
  }
  return null;
};

// 计算面试在单元格内的绝对定位样式（30分钟一格，支持分钟精度）
function getInterviewStartRow(datetime: string) {
  const date = new Date(datetime);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // 8:00为第0行，每小时一行
  if (hours < 8) {
    return 0; // 如果时间早于8:00，放在第一行
  }

  const rowFromHours = hours - 8; // 8:00开始计算
  const rowFromMinutes = minutes / 60; // 分钟转换为小数部分
  return rowFromHours + rowFromMinutes;
}
function getInterviewItemStyle(datetime: string): CSSProperties {
  const startRow = getInterviewStartRow(datetime);
  const rowHeight = 120;
  const top = startRow * rowHeight;
  const height = 30;
  return {
    position: "absolute",
    left: "4px",
    right: "4px",
    top: top + "px",
    height: height + "px",
    zIndex: 2,
  };
}

// 管理面试时间保存
const handleManageTimeSave = async () => {
  if (
    !manageTimeForm.date ||
    !manageTimeForm.startTime ||
    !manageTimeForm.endTime ||
    !manageTimeForm.interval
  ) {
    ElMessage.warning("请填写完整信息");
    return;
  }
  savingTime.value = true;
  try {
    const date = manageTimeForm.date;
    const start = `${date}T${manageTimeForm.startTime}+08:00`;
    const end = `${date}T${manageTimeForm.endTime}+08:00`;
    await interviewAPI.createInterview({
      timerange: {
        start,
        end,
      },
      interval: manageTimeForm.interval,
    });
    ElMessage.success("面试时间设置成功");
    showManageTimeDialog.value = false;
  } catch (e) {
    ElMessage.error("保存失败");
  } finally {
    savingTime.value = false;
  }
};

const loadMockData = () => {
  // 模拟面试数据，仅在API调用失败时使用
  interviews.value = [
    {
      id: 1,
      title: "技术面试",
      candidate: "张三",
      netid: "2251234567",
      datetime: "2025-07-07 09:00:00",
      interviewer: "李老师",
      department: "tech",
      status: "scheduled",
      notes: "技术部面试",
    },
    {
      id: 2,
      title: "美工面试",
      candidate: "王五",
      netid: "2251234568",
      datetime: "2025-07-07 10:00:00",
      interviewer: "赵老师",
      department: "art",
      status: "scheduled",
      notes: "美工部面试",
    },
    {
      id: 3,
      title: "视频面试",
      candidate: "刘七",
      netid: "2251234569",
      datetime: "2025-07-07 13:00:00",
      interviewer: "陈老师",
      department: "video",
      status: "scheduled",
      notes: "视频制作面试",
    },
  ];
};

// 生命周期
onMounted(async () => {
  await loadInterviews();
});
</script>

<style scoped>
.schedule-container {
  padding: 20px;
  background-color: #f8f9fa;
}

.add-interview-card {
  cursor: pointer;
  transition: all 0.2s;
  background: #725dff;
  border: none;
  margin-bottom: 8px;
  padding: 0 0 0 0;
  border-radius: 20px;
}

.add-interview-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.add-icon {
  width: 22px;
  height: 22px;
  display: block;
}

.add-text {
  font-size: 16px;
  color: white;
  letter-spacing: 1px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  padding: 24px 24px 12px;
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 24px;
}

.week-title {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.week-title-text {
  padding: 0 10px;
  font-size: 20px;
  color: #1f2937;
  line-height: 1.1;
  border-right: 1px solid #e4e7ed;
}

.week-text {
  font-size: 16px;
  padding: 0 10px;
  color: #725dff;
  background: none;
  padding-left: 2px;
  line-height: 1.2;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-bottom: 0;
  padding-top: 0;
  justify-content: center;
}

.nav-buttons {
  display: flex;
  margin-right: 12px;
  border: 0;
  gap: 12px;
}

.nav-button {
  padding: 8px;
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  height: calc(100vh - 160px);
}

.schedule-grid {
  background: white;
  border-radius: 8px;
  padding: 0 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.schedule-header-grid {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  background: #f8fafc;
}

.time-column-header {
  padding: 12px 12px;
  color: #9aa0a6;
  font-size: 16px;
  background-color: white;
  text-align: center;
}

.day-header {
  padding: 8px;
  text-align: center;
  transition: background-color 0.2s;
  background-color: white;
}

.day-header.today .day-number,
.day-header.today .day-name {
  color: #725dff;
}

.day-number {
  font-size: 16px;
  color: #9aa0a6;
  margin-bottom: 4px;
}

.day-name {
  font-size: 16px;
  color: #9aa0a6;
}

.schedule-body {
  flex: 1;
  overflow-y: auto;
  height: 0;
}

.time-row {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
}

.time-cell {
  padding: 12px 8px;
  font-size: 14px;
  color: #9aa0a6;
  background: white;
  text-align: center;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schedule-cell {
  padding: 4px;
  min-height: 120px;
  border-top: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

/* 绝对定位的日程表列布局 */
.time-rows-absolute {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  position: relative;
  min-height: 2040px;
}
.schedule-day-col {
  position: relative;
  min-height: 2040px;
}

.interview-item {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.3;
  transition: all 0.2s;
  color: #222;
  border-radius: 6px;
  padding: 0 8px;
  background: #f3f4f6;
}

.schedule-cell:hover {
  background-color: #f8fafc;
}

.interview-item {
  background: #ef4444;
  border-radius: 6px;
  padding: 8px;
  margin: 2px 0;
  cursor: pointer;
  font-size: 16px;
  line-height: 1.3;
  transition: all 0.2s;
}

.interview-item:hover {
  transform: translateY(-1px);
}

.interview-item.tech.interview-bg {
  background: #fff5f1;
}
.interview-item.video.interview-bg {
  background: #f1efff;
}
.interview-item.art.interview-bg {
  background: #ebf9ee;
}

.interview-legend-dot {
  display: inline-block;
  width: 12px;
  height: 10px;
  border-radius: 2px;
  vertical-align: middle;
}
.interview-legend-dot.tech {
  background: #ef4444;
}
.interview-legend-dot.video {
  background: #8b5cf6;
}
.interview-legend-dot.art {
  background: #10b981;
}

.interview-candidate {
  font-size: 12px;
  text-align: center;
  width: 100%;
  letter-spacing: 1px;
}

.sidebar-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.calendar-card {
  background: #fff;
  border-radius: 12px;
  border: none;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 0 12px;
  border-bottom: none !important;
}

.month-nav {
  padding: 2px 8px;
  color: #725dff;
  font-size: 18px;
  background: none;
}

.month-title {
  color: #725dff;
  font-size: 16px;
  letter-spacing: 1px;
}

.mini-calendar {
  padding: 8px 8px 12px 8px;
  border-top: none !important;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.week-day {
  text-align: center;
  font-size: 13px;
  color: #b0aef7;
  padding: 6px 0;
  letter-spacing: 1px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  row-gap: 10px;
}

.calendar-date {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s, color 0.2s;
  position: relative;
  min-height: 32px;
  font-size: 14px;
  color: #9aa0a6;
}

.calendar-date:hover {
  background: #edeaff;
}

.calendar-date.current-month {
  color: black;
}

.calendar-date.today {
  background: #725dff;
  color: #fff;
}

.calendar-date.selected {
  background: #725dff;
  color: #fff;
}

.date-number {
  font-size: 14px;
}

.legend-card {
  flex-shrink: 0;
  flex: 1;
  border: none !important;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.tech {
  background: #ef4444;
}

.legend-color.video {
  background: #8b5cf6;
}

.legend-color.art {
  background: #10b981;
}

.interview-detail {
  padding: 10px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-footer .el-button--danger {
  margin-left: auto;
}

/* 学生详情样式 */
.student-detail-section {
  max-height: 400px;
  overflow-y: auto;
}

.student-info .el-descriptions {
  margin-bottom: 0;
}

.question-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

.question-content {
  max-height: 300px;
  overflow-y: auto;
}

.markdown-content {
  line-height: 1.6;
  color: #303133;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content h1 { font-size: 1.5em; }
.markdown-content h2 { font-size: 1.3em; }
.markdown-content h3 { font-size: 1.1em; }

.markdown-content p {
  margin: 0.8em 0;
}

.markdown-content ul,
.markdown-content ol {
  margin: 0.8em 0;
  padding-left: 2em;
}

.markdown-content li {
  margin: 0.2em 0;
}

.markdown-content code {
  background-color: #f1f2f6;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content pre {
  background-color: #f8f8f8;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-content pre code {
  background: none;
  padding: 0;
  border-radius: 0;
}

.markdown-content blockquote {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  margin: 1em 0;
  color: #6a737d;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
  text-align: left;
}

.markdown-content th {
  background-color: #f6f8fa;
  font-weight: 600;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 0.5em 0;
}

.markdown-content video {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 0.5em 0;
}

.no-question {
  text-align: center;
  color: #909399;
  font-style: italic;
}

.question-url {
  text-align: right;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .sidebar-panel {
    margin-top: 20px;
    flex-direction: row;
  }

  .calendar-card {
    flex: 1;
  }

  .legend-card {
    flex: 0 0 200px;
  }
}

/* 滚动条样式 */
.schedule-body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.schedule-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.schedule-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.schedule-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Markdown 内容样式 */
.markdown-content {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e1e4e8;
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.6;
  color: #24292e;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #1f2937;
}

.markdown-content h1:first-child,
.markdown-content h2:first-child,
.markdown-content h3:first-child {
  margin-top: 0;
}

.markdown-content h1 { 
  font-size: 1.5em; 
  border-bottom: 1px solid #e1e4e8;
  padding-bottom: 8px;
}
.markdown-content h2 { 
  font-size: 1.3em; 
  border-bottom: 1px solid #e1e4e8;
  padding-bottom: 6px;
}
.markdown-content h3 { font-size: 1.1em; }

.markdown-content p {
  margin-bottom: 16px;
  color: #374151;
}

.markdown-content ul, 
.markdown-content ol {
  margin-bottom: 16px;
  padding-left: 24px;
}

.markdown-content li {
  margin-bottom: 4px;
}

.markdown-content code {
  padding: 2px 4px;
  background: #f3f4f6;
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875em;
  color: #d73a49;
}

.markdown-content pre {
  padding: 16px;
  background: #f6f8fa;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 16px;
  border: 1px solid #e1e4e8;
}

.markdown-content pre code {
  background: none;
  padding: 0;
  color: inherit;
  font-size: 0.875em;
}

.markdown-content blockquote {
  margin: 16px 0;
  padding-left: 16px;
  border-left: 4px solid #d1d5db;
  color: #6b7280;
  font-style: italic;
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.markdown-content th,
.markdown-content td {
  padding: 8px 12px;
  border: 1px solid #e1e4e8;
  text-align: left;
}

.markdown-content th {
  background: #f6f8fa;
  font-weight: 600;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}

.markdown-content video {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}

.markdown-content a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.question-section {
  margin-top: 20px;
}

.question-content {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
}

.question-url {
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e1e4e8;
}

.no-question {
  padding: 16px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.student-detail-section {
  max-height: 600px;
  overflow-y: auto;
}

.student-info .el-descriptions {
  margin-bottom: 16px;
}

.schedule-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.schedule-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.schedule-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

:deep(.el-card) {
  box-shadow: none !important;
}

/* 学生详情和题目显示样式 */
.student-detail-section {
  max-height: 400px;
  overflow-y: auto;
}

.student-info .question-section {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.question-content {
  max-height: 300px;
  overflow-y: auto;
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
