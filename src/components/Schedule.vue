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
        <el-card
          class="add-interview-card"
          :body-style="{ padding: '12px' }"
          @click="showAddDialog = true"
        >
          <div class="add-interview-btn">
            <img :src="AddIcon" alt="add" class="add-icon" />
            <span class="add-text">添加新面试</span>
          </div>
        </el-card>
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
    <el-dialog v-model="showDetailDialog" title="面试详情" width="600px">
      <div v-if="selectedInterview" class="interview-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="编号">
            {{ selectedInterview.code }}
          </el-descriptions-item>
          <el-descriptions-item label="标题">
            {{ selectedInterview.title }}
          </el-descriptions-item>
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
          <el-descriptions-item label="房间">
            {{ selectedInterview.room }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(selectedInterview.status)">
              {{ getStatusName(selectedInterview.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注" span="2">
            {{ selectedInterview.notes || "无" }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <el-button
            type="primary"
            @click="editInterview(selectedInterview!)"
            :disabled="!selectedInterview"
          >
            编辑
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加/编辑面试对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑面试' : '添加面试'"
      width="700px"
    >
      <el-form
        :model="interviewForm"
        :rules="interviewRules"
        ref="interviewFormRef"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面试编号" prop="code">
              <el-input
                v-model="interviewForm.code"
                placeholder="请输入面试编号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试标题" prop="title">
              <el-input
                v-model="interviewForm.title"
                placeholder="请输入面试标题"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="候选人" prop="candidate">
              <el-input
                v-model="interviewForm.candidate"
                placeholder="请输入候选人姓名"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试官" prop="interviewer">
              <el-input
                v-model="interviewForm.interviewer"
                placeholder="请输入面试官姓名"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面试时间" prop="datetime">
              <el-date-picker
                v-model="interviewForm.datetime"
                type="datetime"
                placeholder="选择面试时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
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
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面试房间" prop="room">
              <el-input
                v-model="interviewForm.room"
                placeholder="请输入面试房间"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试状态" prop="status">
              <el-select
                v-model="interviewForm.status"
                placeholder="选择状态"
                style="width: 100%"
              >
                <el-option label="已安排" value="scheduled" />
                <el-option label="进行中" value="ongoing" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="interviewForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { interviewAPI } from "../api";
import AddIcon from "../assets/Linear - Essentional, UI - Add Circle.svg";
import type { CSSProperties } from "vue";

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
  code: string;
  title: string;
  candidate: string;
  datetime: string;
  interviewer: string;
  department: string;
  room: string;
  status: string;
  notes?: string;
}

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const showDetailDialog = ref(false);
const showAddDialog = ref(false);
const isEdit = ref(false);

const currentWeek = ref(new Date());
const currentMonth = ref(new Date());
const selectedInterview = ref<ScheduleInterview | null>(null);
const interviews = ref<ScheduleInterview[]>([]);
const interviewDates = ref<InterviewDateInfo[]>([]);

// 表单数据
const interviewForm = reactive({
  id: 0,
  code: "",
  title: "",
  candidate: "",
  datetime: "",
  interviewer: "",
  department: "",
  room: "",
  status: "scheduled",
  notes: "",
});

const interviewFormRef = ref();

// 表单验证规则
const interviewRules = {
  code: [{ required: true, message: "请输入面试编号", trigger: "blur" }],
  title: [{ required: true, message: "请输入面试标题", trigger: "blur" }],
  candidate: [{ required: true, message: "请输入候选人姓名", trigger: "blur" }],
  datetime: [{ required: true, message: "请选择面试时间", trigger: "change" }],
  interviewer: [
    { required: true, message: "请输入面试官姓名", trigger: "blur" },
  ],
  department: [
    { required: true, message: "请选择面试部门", trigger: "change" },
  ],
  room: [{ required: true, message: "请输入面试房间", trigger: "blur" }],
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

const getStatusName = (status: string) => {
  const statusMap: Record<string, string> = {
    scheduled: "已安排",
    ongoing: "进行中",
    completed: "已完成",
    cancelled: "已取消",
  };
  return statusMap[status] || status;
};

const getStatusTagType = (status: string) => {
  const typeMap: Record<string, string> = {
    scheduled: "primary",
    ongoing: "warning",
    completed: "success",
    cancelled: "danger",
  };
  return typeMap[status] || "primary";
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
    id: 0,
    code: "",
    title: "",
    candidate: "",
    datetime,
    interviewer: "",
    department: "",
    room: "",
    status: "scheduled",
    notes: "",
  });
  isEdit.value = false;
  showAddDialog.value = true;
};

const showInterviewDetail = (interview: ScheduleInterview) => {
  selectedInterview.value = interview;
  showDetailDialog.value = true;
};

const editInterview = (interview: ScheduleInterview) => {
  Object.assign(interviewForm, interview);
  isEdit.value = true;
  showDetailDialog.value = false;
  showAddDialog.value = true;
};

const saveInterview = async () => {
  if (!interviewFormRef.value) return;

  try {
    await interviewFormRef.value.validate();
    saving.value = true;

    if (isEdit.value) {
      // 更新面试
      await interviewAPI.updateInterview(interviewForm.id, interviewForm);
      const index = interviews.value.findIndex(
        (i) => i.id === interviewForm.id
      );
      if (index !== -1) {
        interviews.value[index] = { ...interviewForm };
      }
      ElMessage.success("面试信息更新成功");
    } else {
      // 创建新面试
      const newInterview = { ...interviewForm, id: Date.now() };
      interviews.value.push(newInterview);
      ElMessage.success("面试添加成功");
    }

    showAddDialog.value = false;
  } catch (error) {
    console.error("保存失败:", error);
    ElMessage.error("保存失败，请重试");
  } finally {
    saving.value = false;
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
//姓名暂记为学号信息
const fetchInterviewsByDate = async (date: string) => {
  try {
    // 构造标准格式的时间参数
    const dateParam = `${date}T00:00:00Z`;
    const response = await interviewAPI.getInterviewsByDate(dateParam);

    if (response.data && response.data.success) {
      const data = response.data.data;

      // 转换为日程格式
      const convertedInterviews: ScheduleInterview[] = [];

      // 如果data为null，表示当天没有面试
      if (data === null) {
        console.log(`${date} 当天没有面试`);
      } else {
        if (data.unavailable && Array.isArray(data.unavailable)) {
          data.unavailable.forEach((interview: Interview) => {
            convertedInterviews.push({
              id: interview.id,
              code: `INT-${interview.id}`,
              title: `面试-${interview.netid || "未知学生"}`,
              candidate: interview.netid || "未知学生",
              datetime: interview.time,
              interviewer: interview.interviewer || "面试官",
              department: interview.department || "未知部门",
              room: "面试室",
              status: "scheduled",
              notes: interview.evaluation || "",
            });
          });
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

// 获取指定日期的面试数量
const getInterviewCountForDate = (date: string) => {
  const dateInfo = interviewDates.value.find((d) => d.date === date);
  return dateInfo ? dateInfo.total : 0;
};

// 计算面试在单元格内的绝对定位样式（30分钟一格，支持分钟精度）
function getInterviewStartRow(datetime: string) {
  const date = new Date(datetime);
  // 8:00为第0行
  let row = date.getMinutes() / 60;
  return row;
}
function getInterviewItemStyle(datetime: string): CSSProperties {
  const startRow = getInterviewStartRow(datetime);
  const rowHeight = 60;
  const top = startRow * rowHeight;
  const height = rowHeight / 2;
  return {
    position: "absolute",
    left: "4px",
    right: "4px",
    top: top + "px",
    height: height + "px",
    zIndex: 2,
  };
}

const loadMockData = () => {
  // 模拟面试数据，仅在API调用失败时使用
  interviews.value = [
    {
      id: 1,
      code: "INT-1",
      title: "技术面试",
      candidate: "张三",
      datetime: "2025-07-07 09:00:00",
      interviewer: "李老师",
      department: "tech",
      room: "技术部面试室1",
      status: "scheduled",
      notes: "技术部面试",
    },
    {
      id: 2,
      code: "INT-2",
      title: "美工面试",
      candidate: "王五",
      datetime: "2025-07-07 10:00:00",
      interviewer: "赵老师",
      department: "art",
      room: "美工部面试室1",
      status: "scheduled",
      notes: "美工部面试",
    },
    {
      id: 3,
      code: "INT-3",
      title: "视频面试",
      candidate: "刘七",
      datetime: "2025-07-07 13:00:00",
      interviewer: "陈老师",
      department: "video",
      room: "视频部面试室1",
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
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schedule-cell {
  padding: 4px;
  min-height: 60px;
  border-top: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  top: 50%;
}

/* 绝对定位的日程表列布局 */
.schedule-body {
  position: relative;
  min-height: 600px;
}
.time-rows-absolute {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  position: relative;
  min-height: 600px;
}
.schedule-day-col {
  position: relative;
  min-height: 600px;
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
</style>
