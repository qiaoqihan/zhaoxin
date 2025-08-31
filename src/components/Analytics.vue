<template>
  <div
    class="analytics-container"
    v-loading="loading"
    element-loading-text="正在加载统计数据..."
  >
    <div class="stats-column">
      <!-- 统计卡片 - 垂直排列 -->
      <div class="stat-item">
        <el-card
          class="stat-card"
          :class="{ 'chart-expanded': activeCharts.gender }"
          @click="toggleChart('gender')"
        >
          <div class="stat-content">
            <div class="stat-label">男女比例</div>
            <div class="stat-data">
              <div class="stat-text-row">
                <span class="stat-item">男生</span>
                <span class="stat-item"></span>
                <span class="stat-item">女生</span>
              </div>
              <div class="stat-number-row">
                <span class="stat-item male-count"
                  >{{ stats.genderStats.male }}人</span
                >
                <span class="stat-item"></span>
                <span class="stat-item female-count"
                  >{{ stats.genderStats.female }}人</span
                >
              </div>
            </div>
          </div>
        </el-card>

        <!-- 男女比例图表 -->
        <transition name="slide-down">
          <el-card v-if="activeCharts.gender" class="chart-card">
            <div ref="genderChartRef" class="chart-container"></div>
          </el-card>
        </transition>
      </div>

      <div class="stat-item">
        <el-card
          class="stat-card"
          :class="{ 'chart-expanded': activeCharts.department }"
          @click="toggleChart('department')"
        >
          <div class="stat-content">
            <div class="stat-label">社团各部分人数</div>
            <div class="stat-data">
              <div class="stat-text-row">
                <span class="stat-item">技术部</span>
                <span class="stat-item">视频部</span>
                <span class="stat-item">美工部</span>
              </div>
              <div class="stat-number-row">
                <span class="stat-item tech-count"
                  >{{ stats.departmentStats.tech }}人</span
                >
                <span class="stat-item video-count"
                  >{{ stats.departmentStats.video }}人</span
                >
                <span class="stat-item design-count"
                  >{{ stats.departmentStats.design }}人</span
                >
              </div>
            </div>
          </div>
        </el-card>

        <!-- 社团部门图表：饼状图和条状图左右分布 -->
        <transition name="slide-down">
          <div v-if="activeCharts.department" class="chart-row">
            <el-card class="chart-card left-chart">
              <div ref="departmentPieChartRef" class="chart-container"></div>
            </el-card>
            <el-card class="chart-card right-chart">
              <div ref="departmentBarChartRef" class="chart-container"></div>
            </el-card>
          </div>
        </transition>
      </div>

      <div class="stat-item">
        <el-card
          class="stat-card"
          :class="{ 'chart-expanded': activeCharts.college }"
          @click="toggleChart('college')"
        >
          <div class="stat-content">
            <div class="stat-label">书院分布</div>
            <div class="stat-data">
              <div class="stat-text-row">&nbsp;</div>
              <div class="stat-number-row">&nbsp;</div>
            </div>
          </div>
        </el-card>

        <!-- 书院分布图表 -->
        <transition name="slide-down">
          <el-card v-if="activeCharts.college" class="chart-card">
            <div ref="collegeChartRef" class="chart-container"></div>
          </el-card>
        </transition>
      </div>

      <div class="stat-item">
        <el-card
          class="stat-card"
          :class="{ 'chart-expanded': activeCharts.region }"
          @click="toggleChart('region')"
        >
          <div class="stat-content">
            <div class="stat-label">地域分布</div>
            <div class="stat-data">
              <div class="stat-text-row">&nbsp;</div>
              <div class="stat-number-row">&nbsp;</div>
            </div>
          </div>
        </el-card>

        <!-- 地域分布图表 -->
        <transition name="slide-down">
          <el-card v-if="activeCharts.region" class="chart-card region-card">
            <div ref="regionChartRef" class="chart-container map-chart"></div>
          </el-card>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from "vue";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import { studentAPI } from "../api";

// ECharts 实例
const genderChartRef = ref();
const departmentPieChartRef = ref();
const departmentBarChartRef = ref();
const collegeChartRef = ref();
const regionChartRef = ref();

let genderChart: echarts.ECharts | null = null;
let departmentPieChart: echarts.ECharts | null = null;
let departmentBarChart: echarts.ECharts | null = null;
let collegeChart: echarts.ECharts | null = null;
let regionChart: echarts.ECharts | null = null;

// 响应式数据
const activeCharts = ref({
  gender: false,
  department: false,
  college: false,
  region: false,
});

// 统计数据
const stats = reactive({
  genderStats: {
    total: 0,
    male: 0,
    female: 0,
  },
  departmentStats: {
    total: 0,
    tech: 0,
    video: 0,
    design: 0,
    techPassed: 0,
    videoPassed: 0,
    designPassed: 0,
  },
  collegeStats: {
    total: 0,
    data: [] as Array<{ name: string; value: number }>,
  },
  regionStats: {
    total: 0,
    data: [] as Array<{ name: string; value: number }>,
  },
});

// 加载状态
const loading = ref(false);

// 标准书院列表
const standardColleges = [
  "彭康书院",
  "仲英书院",
  "崇实书院",
  "文治书院",
  "励志书院",
  "宗濂书院",
  "南洋书院",
  "钱学森书院",
];

// 处理书院数据 - 只显示标准书院
const processCollegeData = (
  rawData: Array<{ name: string; value: number }>
) => {
  const processedData: Array<{ name: string; value: number }> = [];

  // 初始化标准书院数据
  standardColleges.forEach((college) => {
    processedData.push({ name: college, value: 0 });
  });

  // 处理原始数据，忽略无效书院
  rawData.forEach((item) => {
    const collegeName = item.name?.trim();
    if (!collegeName) {
      return;
    }

    // 检查是否为标准书院
    const standardIndex = standardColleges.findIndex(
      (college) =>
        collegeName.includes(college) || college.includes(collegeName)
    );

    if (standardIndex !== -1) {
      processedData[standardIndex].value += item.value;
    }
  });

  // 过滤掉人数为0的书院
  return processedData.filter((item) => item.value > 0);
};

// 切换图表显示
const toggleChart = (chartType: keyof typeof activeCharts.value) => {
  activeCharts.value[chartType] = !activeCharts.value[chartType];
};

// 获取统计数据
const fetchStatistics = async () => {
  loading.value = true;
  try {
    // 获取基础统计数据
    const statResponse = await studentAPI.getStatistics();

    if (statResponse.data.success) {
      const data = statResponse.data.data;

      // 更新性别统计
      stats.genderStats.male = data.gender.male || 0;
      stats.genderStats.female = data.gender.female || 0;
      stats.genderStats.total = data.total || 0;

      // 更新部门统计 - 直接使用后端的部门统计数据
      if (data.depart) {
        stats.departmentStats.tech = data.depart.tech || 0;
        stats.departmentStats.video = data.depart.video || 0;
        stats.departmentStats.design = data.depart.art || 0;
        stats.departmentStats.techPassed = data.depart.tech_pass || 0;
        stats.departmentStats.videoPassed = data.depart.video_pass || 0;
        stats.departmentStats.designPassed = data.depart.art_pass || 0;
        stats.departmentStats.total =
          (data.depart.tech || 0) +
          (data.depart.video || 0) +
          (data.depart.art || 0);
      }

      // 更新书院统计
      const rawCollegeData =
        data.school?.map((item: any) => ({
          name: item.name,
          value: item.number,
        })) || [];

      stats.collegeStats.data = processCollegeData(rawCollegeData);
      stats.collegeStats.total = data.total || 0;

      // 更新地域统计 - 将 province 数据映射到 regionStats
      stats.regionStats.data =
        data.province?.map((item: any) => ({
          name: item.name,
          value: item.number,
        })) || [];
      stats.regionStats.total = data.total || 0;
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
    ElMessage.error("获取统计数据失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

// 初始化男女比例图
const initGenderChart = () => {
  if (!genderChartRef.value) return;

  genderChart = echarts.init(genderChartRef.value);

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} 人({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    series: [
      {
        name: "性别分布",
        type: "pie",
        radius: ["40%", "70%"],
        data: [
          {
            value: stats.genderStats.male,
            name: "男生",
            itemStyle: { color: "#10C9E6" },
          },
          {
            value: stats.genderStats.female,
            name: "女生",
            itemStyle: { color: "#FFCC00" },
          },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  genderChart.setOption(option);
};

// 初始化部门分布饼状图
const initDepartmentPieChart = () => {
  if (!departmentPieChartRef.value) return;
  departmentPieChart = echarts.init(departmentPieChartRef.value);
  const option = {
    title: {
      show: true,
      text: "人数构成饼状图",
      left: "center",
      top: "bottom",
      textStyle: {
        color: "#414D55",
        fontFamily: "PingFangSC-Regular",
        fontSize: 18,
      },
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} 人({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    graphic: {
      type: "text",
      left: "center",
      top: "middle",
      style: {
        text: `${stats.departmentStats.total}\n总人数`,
        textAlign: "center",
        fill: "#333",
        fontSize: 16,
        fontWeight: "bold",
        lineHeight: 22,
      },
    },
    series: [
      {
        name: "部门分布",
        type: "pie",
        radius: ["30%", "50%"],
        center: ["50%", "50%"],
        data: [
          {
            value: stats.departmentStats.tech,
            name: "技术部",
            itemStyle: { color: "#FDCA40" },
          },
          {
            value: stats.departmentStats.video,
            name: "视频部",
            itemStyle: { color: "#6665DD" },
          },
          {
            value: stats.departmentStats.design,
            name: "美工部",
            itemStyle: { color: "#FF715B" },
          },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };
  departmentPieChart.setOption(option);
};

// 初始化部门分布条状图
const initDepartmentBarChart = () => {
  if (!departmentBarChartRef.value) return;
  departmentBarChart = echarts.init(departmentBarChartRef.value);
  const option = {
    title: {
      show: true,
      text: "条状图",
      left: "left",
      top: "top",
      textStyle: {
        color: "#414D55",
        fontWeight: "bold",
        fontFamily: "Poppins",
        fontSize: 18,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params: any) {
        const items = params
          .map(
            (item: any) => `${item.seriesName} - ${item.name}: ${item.value}人`
          )
          .join("<br/>");
        return items;
      },
    },
    legend: {
      data: ["总人数", "通过人数"],
      top: "8%",
    },
    grid: {
      left: "10%",
      right: "10%",
      top: "18%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["技术部", "视频部", "美工部"],
      axisLabel: {
        fontSize: 12,
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      name: "人数",
      axisLabel: {
        fontSize: 12,
      },
    },
    series: [
      {
        name: "总人数",
        type: "bar",
        itemStyle: { color: "#FF715B" },
        data: [
          {
            value: stats.departmentStats.tech,
            itemStyle: { color: "#FF715B" },
          },
          {
            value: stats.departmentStats.video,
            itemStyle: { color: "#FF715B" },
          },
          {
            value: stats.departmentStats.design,
            itemStyle: { color: "#FF715B" },
          },
        ],
        barWidth: "30%",
        barGap: 0,
      },
      {
        name: "通过人数",
        type: "bar",
        itemStyle: { color: "#0B9CF9" },
        data: [
          {
            value: stats.departmentStats.techPassed,
          },
          {
            value: stats.departmentStats.videoPassed,
          },
          {
            value: stats.departmentStats.designPassed,
          },
        ],
        barWidth: "30%",
        barGap: "30%",
      },
    ],
  };
  departmentBarChart.setOption(option);
};

// 初始化书院分布图 - 条状图
const initCollegeChart = () => {
  if (!collegeChartRef.value) return;

  collegeChart = echarts.init(collegeChartRef.value);

  // 计算最大值用于百分比显示
  const maxValue = Math.max(
    ...stats.collegeStats.data.map((item) => item.value)
  );

  // 根据书院数量动态调整整体宽度
  const barWidth = stats.collegeStats.data.length > 6 ? 50 : 60;
  const barGap = 20;
  const dataCount = stats.collegeStats.data.length;
  const totalBarWidth = dataCount * barWidth + (dataCount - 1) * barGap;

  // 动态计算 grid 宽度
  const gridWidth = Math.min(totalBarWidth + 80, 800);
  const gridLeft = dataCount <= 4 ? "30%" : dataCount <= 6 ? "20%" : "10%";
  const gridRight = dataCount <= 4 ? "30%" : dataCount <= 6 ? "20%" : "10%";

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params: any) {
        const item = params[1];
        return `${item.name}: ${item.value}人`;
      },
    },
    grid: {
      left: gridLeft,
      right: gridRight,
      top: "10%",
      bottom: "15%",
      containLabel: true,
      width: gridWidth,
    },
    xAxis: {
      type: "category",
      data: stats.collegeStats.data.map((item) => {
        // 处理书院名称显示，如果名称过长则截断
        const name = item.name && item.name.trim() ? item.name : "未知书院";
        return name.length > 6 ? name.substring(0, 5) + "..." : name;
      }),
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        fontSize: 14,
        margin: 8,
        fontFamily: "Segoe UI",
        interval: 0,
        rotate: stats.collegeStats.data.length > 8 ? 15 : 0, // 当书院数量多时倾斜显示
      },
    },
    yAxis: {
      type: "value",
      show: false,
      max: maxValue,
    },
    series: [
      {
        name: "底色",
        type: "bar",
        data: stats.collegeStats.data.map((item) => ({
          value: maxValue,
          actualValue: item.value,
        })),
        barWidth: barWidth,
        itemStyle: {
          color: "#F4F4F4",
          borderRadius: [12, 12, 12, 12],
        },
        label: {
          show: true,
          position: "top",
          formatter: function (params: any) {
            return params.data.actualValue;
          },
          fontSize: 16,
          color: "#3F3F44",
          fontFamily: "PingFangSC-Regular",
        },
        silent: true,
        animation: false,
        z: 1,
      },
      {
        name: "人数",
        type: "bar",
        data: stats.collegeStats.data.map((item) => ({
          value: item.value,
          itemStyle: {
            color: "#CCEABB",
            borderRadius: [12, 12, 12, 12],
          },
        })),
        barWidth: barWidth,
        animation: false,
        z: 2,
        barGap: "-100%",
      },
    ],
  };

  collegeChart.setOption(option);
};

// 初始化地域分布图
const initRegionChart = async () => {
  if (!regionChartRef.value) return;

  regionChart = echarts.init(regionChartRef.value);

  try {
    let response = await fetch(
      "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
    );

    const chinaJson = await response.json();

    // 注册地图
    echarts.registerMap("china", chinaJson);

    // 转换数据格式
    const mapData = stats.regionStats.data.map((item) => ({
      name: item.name,
      value: item.value,
    }));

    // 计算数值范围用于颜色映射
    const values = mapData.map((item) => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const option = {
      tooltip: {
        trigger: "item",
        formatter: function (params: any) {
          const value = Number(params.value) || 0;
          return `${params.name}<br/>人数: ${value}`;
        },
      },
      visualMap: {
        min: minValue,
        max: maxValue,
        left: "left",
        top: "top",
        orient: "horizontal",
        text: [maxValue.toString(), minValue.toString()],
        calculable: false,
        inRange: {
          color: ["#EFF8E7", "#244B8C"],
        },
      },
      series: [
        {
          name: "人数",
          type: "map",
          map: "china",
          roam: true,
          regions: [
            {
              name: "南海诸岛",
              itemStyle: {
                opacity: 0,
                borderWidth: 0,
              },
              label: {
                show: false,
              },
            },
          ],
          label: {
            show: false,
            fontSize: 10,
          },
          data: mapData,
          emphasis: {
            itemStyle: {
              areaColor: "#389BB7",
              borderWidth: 1,
            },
            label: {
              show: false,
            },
          },
        },
      ],
    };

    regionChart.setOption(option);
  } catch (error) {
    console.error("加载地图数据失败，使用柱状图替代:", error);
    // 加载地图失败时，使用柱状图替代
    initRegionBarChart();
  }
};

// 备用的柱状图实现
const initRegionBarChart = () => {
  if (!regionChartRef.value) return;

  regionChart = echarts.init(regionChartRef.value);

  const option = {
    title: {
      text: "地域分布",
      left: "center",
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}<br/>人数: {c}",
    },
    grid: {
      left: "10%",
      right: "10%",
      top: "15%",
      bottom: "10%",
    },
    xAxis: {
      type: "category",
      data: stats.regionStats.data.map((item) => item.name),
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: {
      type: "value",
      name: "人数",
    },
    series: [
      {
        name: "人数",
        type: "bar",
        data: stats.regionStats.data.map((item) => ({
          value: item.value,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#83bff6" },
              { offset: 0.5, color: "#188df0" },
              { offset: 1, color: "#188df0" },
            ]),
          },
        })),
        barWidth: "60%",
      },
    ],
  };

  regionChart.setOption(option);
};

// 监听各个图表状态变化，初始化对应图表
watch(
  () => activeCharts.value.gender,
  async (isActive) => {
    if (isActive) {
      await nextTick();
      initGenderChart();
    }
  }
);

watch(
  () => activeCharts.value.department,
  async (isActive) => {
    if (isActive) {
      await nextTick();
      initDepartmentPieChart();
      initDepartmentBarChart();
    }
  }
);

watch(
  () => activeCharts.value.college,
  async (isActive) => {
    if (isActive) {
      await nextTick();
      initCollegeChart();
    }
  }
);

watch(
  () => activeCharts.value.region,
  async (isActive) => {
    if (isActive) {
      await nextTick();
      initRegionChart();
    }
  }
);

// 窗口大小变化时重新调整图表
const handleResize = () => {
  genderChart?.resize();
  departmentPieChart?.resize();
  departmentBarChart?.resize();
  collegeChart?.resize();
  regionChart?.resize();
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
  // 获取统计数据
  fetchStatistics();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);

  genderChart?.dispose();
  departmentPieChart?.dispose();
  departmentBarChart?.dispose();
  collegeChart?.dispose();
  regionChart?.dispose();
});
</script>

<style scoped>
.analytics-container {
  padding: 40px 24px;
  background-color: #f8f9fa;
}

.stats-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 20px;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.chart-expanded {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  margin-bottom: 0;
}

.stat-card.chart-expanded:hover {
  transform: none;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.stat-label {
  font-size: 25px;
  font-family: "細明體_HKSCS-ExtB";
  flex-shrink: 0;
  min-width: 100px;
}

.stat-data {
  font-size: 14px;
  text-align: right;
  flex: 0 0 300px;
  min-width: 200px;
}

.stat-text-row {
  display: flex;
  font-size: 12px;
  margin-bottom: 4px;
  justify-content: space-between;
}

.stat-number-row {
  display: flex;
  font-size: 16px;
  justify-content: space-between;
}

.stat-item {
  text-align: left;
}

.male-count {
  color: #10c9e6 !important;
}

.female-count {
  color: #ffcc00 !important;
}

.tech-count {
  color: #fdca40 !important;
}

.video-count {
  color: #6665dd !important;
}

.design-count {
  color: #ff715b !important;
}

.chart-card {
  height: 500px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: -1px;
  border-top: none;
}

.chart-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  margin-top: -1px;
  background-color: white;
}

.left-chart {
  flex: 1 1 0;
  min-width: 0;
  border-right: none;
}
.right-chart {
  flex: 1 1 0;
  min-width: 0;
  border-left: none;
}

.region-card {
  height: 600px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: -1px;
  border-top: none;
}

.chart-container {
  width: 100%;
  height: 460px;
}

.map-chart {
  height: 560px;
}

/* 动画效果 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-card) {
  box-shadow: none !important;
}
</style>
