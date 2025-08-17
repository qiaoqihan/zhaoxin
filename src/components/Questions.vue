<template>
  <div class="questions-container">
    <div class="questions-layout">
      <!-- 左侧部门分类 -->
      <div class="questions-left">
        <el-card class="left-card">
          <!-- 搜索框 -->
          <div class="search-section">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索问题"
              clearable
              @input="debounceSearch"
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <div class="search-divider"></div>
          </div>

          <!-- 部门分类 -->
          <div class="department-sections" @click="clearSelection">
            <div
              v-for="dept in departments"
              :key="dept.value"
              class="department-section"
            >
              <div class="department-header">
                <div class="department-info">
                  <img :src="PinIcon" class="department-icon" alt="Pin" />
                  <span class="department-label">
                    {{ dept.label }}
                  </span>
                </div>
              </div>
              <div class="questions-list">
                <div
                  v-for="(question, index) in getDepartmentQuestions(
                    dept.value
                  )"
                  :key="question.id"
                  class="question-item"
                  :class="{ active: selectedQuestion?.id === question.id }"
                  @click="selectQuestion(question, $event)"
                >
                  <div class="question-content-wrapper">
                    <span class="question-number">{{ index + 1 }}.</span>
                    <div class="question-title">{{ question.title }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧题目详情 -->
      <div class="questions-right">
        <el-card class="right-card">
          <div v-if="selectedQuestion" class="question-detail-content">
            <!-- 媒体文件部分 - 仅在有图片或视频时显示 -->
            <div v-if="selectedQuestion.url" class="detail-section">
              <div class="media-section">
                <div class="question-media-container">
                  <!-- 如果是视频文件 -->
                  <video
                    v-if="isVideoFile(selectedQuestion.url)"
                    :src="selectedQuestion.url"
                    class="question-video"
                    controls
                    @error="handleMediaError"
                  >
                    您的浏览器不支持视频播放
                  </video>
                  <!-- 如果是图片文件 -->
                  <img
                    v-else
                    :src="selectedQuestion.url"
                    :alt="selectedQuestion.title"
                    class="question-image"
                    @error="handleMediaError"
                  />
                </div>
              </div>
            </div>

            <!-- 题目内容部分 -->
            <div class="detail-section content-wrapper">
              <!-- 编辑模式下的题目内容 -->
              <div v-if="isEditingMode" class="edit-mode-content">
                <div
                  class="editable-field content-field"
                  contenteditable="true"
                  @blur="updateEditForm('title', $event)"
                  @keydown="handleKeydown"
                  ref="editContentRef"
                  v-text="editForm.title"
                ></div>
              </div>
              <!-- 显示题目内容 -->
              <div v-else class="content-section">
                <div
                  class="question-content"
                  v-html="renderedMarkdown(selectedQuestion.title)"
                ></div>
              </div>
            </div>

            <div class="detail-actions">
              <div class="action-delete">
                <el-button
                  link
                  type="primary"
                  @click="deleteSelectedQuestion"
                  class="delete-btn"
                >
                  删除
                </el-button>
              </div>
              <div class="action-edit">
                <el-button
                  v-if="!isEditingMode"
                  link
                  type="primary"
                  @click="startEditMode"
                  class="edit-btn"
                >
                  编辑
                </el-button>
                <div v-else class="edit-mode-actions">
                  <el-button
                    link
                    type="primary"
                    @click="saveAllChanges"
                    :loading="saving"
                    class="save-btn"
                  >
                    保存
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-question">
            <div class="no-question-text">
              <div class="line1">暂无题目</div>
              <div class="line2">快去出题吧!!</div>
            </div>
            <div class="go-create-btn">
              <el-button link type="primary" @click="showAddDialog = true">
                去出题>
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑题目' : '添加题目'"
      width="800px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        :model="questionForm"
        :rules="questionRules"
        ref="questionFormRef"
        label-width="100px"
      >
        <el-form-item label="部门" prop="department">
          <el-select
            v-model="questionForm.department"
            placeholder="选择部门"
            style="width: 100%"
          >
            <el-option label="技术部" value="tech" />
            <el-option label="视频部" value="video" />
            <el-option label="美工部" value="art" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目内容" prop="title">
          <el-input
            v-model="questionForm.title"
            type="textarea"
            :rows="4"
            placeholder="请输入题目内容"
          />
        </el-form-item>
        <el-form-item label="媒体文件" prop="url">
          <el-upload
            ref="uploadRef"
            class="media-uploader"
            action="#"
            :show-file-list="false"
            :before-upload="beforeMediaUpload"
            :http-request="handleMediaUpload"
            :on-exceed="handleExceed"
            :auto-upload="true"
            :limit="1"
            accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/webm,video/ogg,video/avi,video/mov"
          >
            <!-- 视频预览 -->
            <video
              v-if="questionForm.url && isVideoFile(questionForm.url)"
              :src="questionForm.url"
              class="uploaded-video"
              controls
            >
              您的浏览器不支持视频播放
            </video>
            <!-- 图片预览 -->
            <img
              v-else-if="questionForm.url && !isVideoFile(questionForm.url)"
              :src="questionForm.url"
              class="uploaded-image"
            />
            <!-- 上传占位符 -->
            <div v-else class="upload-placeholder">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <div class="upload-text">点击选择图片或视频</div>
            </div>
          </el-upload>
          <div class="upload-tips">
            支持 JPG、PNG、GIF、MP4、WebM、OGG 等格式，文件大小不超过 10MB
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetForm">取消</el-button>
        <el-button type="primary" @click="saveQuestion" :loading="saving">
          {{ isEdit ? "更新" : "添加" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { marked } from "marked";
// markdown渲染函数
function renderedMarkdown(content: string) {
  if (!content) return "暂无题目内容";
  return marked.parse(content);
}
import { ElMessage, ElMessageBox, ElUpload } from "element-plus";
import { Plus, Search, Edit } from "@element-plus/icons-vue";
import { questionAPI } from "../api/index";
import PinIcon from "../assets/Outline - Essentional, UI - Pin.svg";

// 定义接口
interface QuestionItem {
  id: string;
  title: string;
  content: string;
  department: string;
  useCount: number;
  url?: string;
}

// 后端返回的数据结构
interface BackendQuestionItem {
  id: number;
  question: string;
  department: string;
  url?: string; // 图片信息
  times: number;
}

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const showAddDialog = ref(false);
const isEdit = ref(false);
const questionFormRef = ref();
const uploadRef = ref();

const searchKeyword = ref("");

const allQuestions = ref<QuestionItem[]>([]);
const selectedQuestion = ref<QuestionItem | null>(null);

// 编辑模式状态
const isEditingMode = ref(false);

// 编辑表单数据
const editForm = reactive({
  title: "",
  department: "",
  url: "",
});

// 编辑模式下的数据备份
const editModeBackup = ref<{
  title: string;
  department: string;
  url: string;
} | null>(null);

// 部门配置
const departments = ref([
  { label: "技术部", value: "tech" },
  { label: "视频部", value: "video" },
  { label: "美工部", value: "art" },
]);

// 表单数据
const questionForm = reactive({
  id: "",
  title: "",
  department: "",
  url: "",
  useCount: 0,
});

// 表单验证规则
const questionRules = {
  title: [{ required: true, message: "请输入题目内容", trigger: "blur" }],
  department: [{ required: true, message: "请选择部门", trigger: "change" }],
};

// 计算属性 - 过滤后的题目列表
const filteredQuestions = computed(() => {
  let result = [...allQuestions.value];

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword)
    );
  }

  return result;
});

// 获取部门下的题目列表
const getDepartmentQuestions = (department: string) => {
  return filteredQuestions.value.filter((q) => q.department === department);
};

// 选择题目
const selectQuestion = (question: QuestionItem, event?: Event) => {
  // 阻止事件冒泡，防止触发清除选择
  if (event) {
    event.stopPropagation();
  }

  // 如果当前处于编辑模式，阻止切换到其他题目
  if (isEditingMode.value) {
    ElMessage.warning("请先保存当前编辑的内容");
    return;
  }

  selectedQuestion.value = question;
};

// 清除选择
const clearSelection = () => {
  // 如果当前处于编辑模式，阻止清除选择
  if (isEditingMode.value) {
    ElMessage.warning("请先保存当前编辑的内容");
    return;
  }

  selectedQuestion.value = null;
};

// 从后端获取题目数据
const loadQuestions = async () => {
  loading.value = true;
  try {
    const response = await questionAPI.getQuestions();

    if (response.data && response.data.success) {
      const backendData = response.data.data;

      // 将后端数据转换为前端数据结构
      allQuestions.value = (backendData.questions || []).map(
        (item: BackendQuestionItem) => ({
          id: item.id.toString(),
          title: item.question,
          content: "", // 由于后端只有question字段，content留空避免重复
          department: item.department,
          useCount: item.times,
          url: item.url,
        })
      );
    } else {
      ElMessage.error(response.data?.message || "获取题目列表失败");
    }
  } catch (error) {
    console.error("获取题目列表失败:", error);
    ElMessage.error("获取题目列表失败");
  } finally {
    loading.value = false;
  }
};

// 删除选中的题目
const deleteSelectedQuestion = async () => {
  if (!selectedQuestion.value) return;

  try {
    await ElMessageBox.confirm("确定要删除这个题目吗？", "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 调用后端API删除题目
    const response = await questionAPI.deleteQuestion(
      Number(selectedQuestion.value.id)
    );

    if (response.data && response.data.success) {
      // 从本地数据中删除
      const index = allQuestions.value.findIndex(
        (q: QuestionItem) => q.id === selectedQuestion.value?.id
      );
      if (index >= 0) {
        allQuestions.value.splice(index, 1);
      }

      selectedQuestion.value = null;
      ElMessage.success("删除成功");
    } else {
      ElMessage.error(response.data?.message || "删除失败");
    }
  } catch (error) {
    if (error === "cancel") {
      return;
    }
    console.error("删除失败:", error);
    ElMessage.error("删除失败");
  }
};

// 防抖搜索
let searchTimer: NodeJS.Timeout;
const debounceSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    // 如果当前处于编辑模式，阻止重置选中状态
    if (isEditingMode.value) {
      ElMessage.warning("请先保存当前编辑的内容");
      return;
    }
    selectedQuestion.value = null;
  }, 500);
};

// 编辑模式相关方法
const startEditMode = () => {
  if (!selectedQuestion.value) return;

  // 保存当前数据作为备份
  editModeBackup.value = {
    title: selectedQuestion.value.title,
    department: selectedQuestion.value.department,
    url: selectedQuestion.value.url || "",
  };
  editForm.title = selectedQuestion.value.title;
  editForm.department = selectedQuestion.value.department;

  // 进入编辑模式
  isEditingMode.value = true;
};

const saveAllChanges = async () => {
  if (!selectedQuestion.value) return;

  try {
    saving.value = true;

    const response = await questionAPI.updateQuestion(
      Number(selectedQuestion.value.id),
      {
        question: editForm.title,
        department: editForm.department,
        times: selectedQuestion.value.useCount,
      }
    );

    if (response.data && response.data.success) {
      // 更新本地数据
      selectedQuestion.value.title = editForm.title;
      selectedQuestion.value.department = editForm.department;

      // 更新allQuestions中的数据
      const index = allQuestions.value.findIndex(
        (q: QuestionItem) => q.id === selectedQuestion.value?.id
      );
      if (index >= 0) {
        allQuestions.value[index].title = editForm.title;
        allQuestions.value[index].department = editForm.department;
      }

      ElMessage.success("保存成功");
      isEditingMode.value = false;
      editModeBackup.value = null;
    } else {
      ElMessage.error(response.data?.message || "保存失败");
    }
  } catch (error) {
    console.error("保存失败:", error);
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

// 处理键盘事件，允许回车换行
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    return;
  }
  return;
};

// 更新编辑表单数据
const updateEditForm = (field: keyof typeof editForm, event: Event) => {
  const target = event.target as HTMLElement | HTMLSelectElement;
  if (target) {
    if (field === "title" || field === "url") {
      editForm[field] = target.innerText || target.textContent || "";
    }
  }
};

// 处理媒体文件加载错误
const handleMediaError = (event: Event) => {
  const media = event.target as HTMLImageElement | HTMLVideoElement;
  if (media) {
    media.style.display = "none";
    console.warn("媒体文件加载失败:", media.src);
  }
};

// 判断是否为视频文件
const isVideoFile = (url: string): boolean => {
  if (!url) return false;

  // 检查文件扩展名
  const videoExtensions = [
    ".mp4",
    ".webm",
    ".ogg",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".mkv",
  ];
  const lowercaseUrl = url.toLowerCase();

  // 检查是否包含视频文件扩展名
  const hasVideoExtension = videoExtensions.some((ext) =>
    lowercaseUrl.includes(ext)
  );

  // 检查MIME类型（如果是base64）
  const isVideoMime = url.startsWith("data:video/");

  return hasVideoExtension || isVideoMime;
};

// 处理图片加载错误（保持向后兼容）
const handleImageError = handleMediaError;

// 媒体文件上传前的验证
const beforeMediaUpload = (file: File) => {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isLt10M = file.size / 1024 / 1024 < 10;

  if (!isImage && !isVideo) {
    ElMessage.error("只能上传图片或视频文件!");
    return false;
  }
  if (!isLt10M) {
    ElMessage.error("文件大小不能超过 10MB!");
    return false;
  }
  return true;
};

// 处理媒体文件上传
const handleMediaUpload = (options: any) => {
  return new Promise((resolve, reject) => {
    const file = options.file;

    // 创建 FileReader 来读取文件并转换为 base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      questionForm.url = result;

      const fileType = file.type.startsWith("video/") ? "视频" : "图片";
      ElMessage.success(`${fileType}上传成功`);

      options.onSuccess?.(result);
      resolve(result);
    };
    reader.onerror = (error) => {
      ElMessage.error("文件读取失败");
      options.onError?.(error);
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

// 上传文件数量超出限制时的处理
const handleExceed = () => {
  ElMessage.warning("只能上传一个文件，请先删除已上传的文件");
};

// 图片上传前的验证（保持向后兼容）
const beforeImageUpload = beforeMediaUpload;

// 处理图片上传（保持向后兼容）
const handleImageUpload = handleMediaUpload;

// 保存题目
const saveQuestion = async () => {
  if (!questionFormRef.value) return;

  try {
    await questionFormRef.value.validate();
    saving.value = true;

    if (isEdit.value) {
      // 更新现有记录
      const response = await questionAPI.updateQuestion(
        Number(questionForm.id),
        {
          question: questionForm.title,
          department: questionForm.department,
          url: questionForm.url || "",
          times: questionForm.useCount,
        }
      );

      if (response.data && response.data.success) {
        // 更新本地数据
        const index = allQuestions.value.findIndex(
          (q: QuestionItem) => q.id === questionForm.id
        );
        if (index >= 0) {
          Object.assign(allQuestions.value[index], {
            title: questionForm.title,
            department: questionForm.department,
            url: questionForm.url,
            useCount: questionForm.useCount,
          });
          // 如果当前选中的是被编辑的题目，更新选中状态
          if (selectedQuestion.value?.id === questionForm.id) {
            selectedQuestion.value = allQuestions.value[index];
          }
        }
        ElMessage.success("更新成功");
      } else {
        ElMessage.error(response.data?.message || "更新失败");
      }
    } else {
      // 添加新记录
      const response = await questionAPI.createQuestion({
        question: questionForm.title,
        department: questionForm.department,
        url: questionForm.url || "",
      });

      if (response.data && response.data.success) {
        // 重新加载数据以获取新的ID
        await loadQuestions();
        ElMessage.success("添加成功");
      } else {
        ElMessage.error(response.data?.message || "添加失败");
      }
    }

    resetForm();
    showAddDialog.value = false;
  } catch (error) {
    console.error("保存失败:", error);
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

// 重置表单
const resetForm = () => {
  Object.assign(questionForm, {
    id: "",
    title: "",
    department: "",
    url: "",
    useCount: 0,
  });
  isEdit.value = false;
  showAddDialog.value = false;

  if (questionFormRef.value) {
    questionFormRef.value.resetFields();
    questionFormRef.value.clearValidate();
  }

  // 清除上传组件的状态
  if (uploadRef.value) {
    uploadRef.value.clearFiles?.();
    uploadRef.value.$refs?.uploadInner?.$refs?.input?.setAttribute("value", "");
  }
};

// 对话框关闭处理
const handleDialogClose = () => {
  // 延迟执行重置，确保对话框完全关闭后再重置
  setTimeout(() => {
    resetForm();
  }, 100);
};

onMounted(() => {
  // 加载题目数据
  loadQuestions();
});
</script>

<style scoped>
.questions-container {
  padding: 24px;
  height: 100%;
  background-color: #f8f9fa;
}

.questions-layout {
  display: flex;
  gap: 0;
  height: 100%;
}

.questions-left {
  width: 40%;
  min-width: 400px;
}

.questions-right {
  flex: 1;
}

.left-card {
  height: 100%;
  border-radius: 12px 0 0 12px;
}

.right-card {
  height: 100%;
  background: #f1efff;
  border-radius: 0 12px 12px 0;
}

.right-card :deep(.el-card__body) {
  background: #f1efff;
}

.left-header,
.right-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-section {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  height: 40px;
}

.search-divider {
  height: 1px;
  background: #e8e8e8;
  margin-top: 16px;
}

.department-sections {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.department-sections::-webkit-scrollbar {
  display: none;
}

.department-section {
  margin-bottom: 24px;
}

.department-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
}

.department-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.department-icon {
  width: 16px;
  height: 16px;
  color: #409eff;
}

.department-label {
  color: #bdc1c6;
  font-size: 14px;
}

.question-count {
  font-size: 12px;
  color: #909399;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-item {
  padding-top: 2px;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0.65;
}

.question-item.active {
  background: #f1efff;
  opacity: 0.48;
}

.question-content-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.question-number {
  color: #bdc1c6;
  font-size: 14px;
  min-width: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.question-title {
  font-size: 14px;

  color: #303133;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  flex: 1;
}

.question-detail-content {
  padding: 0 4px;
  max-width: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-section {
  margin-bottom: 24px;
  max-width: 100%;
  width: 100%;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}

.content-section {
  max-width: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}

.question-content,
.question-answer,
.question-tips {
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  width: 100%;
  text-align: left;
  font-size: 25px;

  margin: 0;
}

.no-content {
  color: #909399;
  font-style: italic;
}

.question-url {
  color: #409eff;
  text-decoration: none;
  word-break: break-all;
}

.question-url:hover {
  text-decoration: underline;
}

.editable-title {
  cursor: pointer;
  position: relative;
  padding-right: 30px;
}

.editable-title:hover {
  color: #409eff;
}

.title-section {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-icon {
  color: #909399;
  cursor: pointer;
  font-size: 14px;
}

.edit-icon:hover {
  color: #409eff;
}

.edit-title-section,
.edit-url-section {
  margin-bottom: 12px;
}

.edit-mode-actions {
  display: flex;
  gap: 8px;
}

.media-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.question-media-container {
  width: 80%;
  max-width: 80%;
  height: 35vh;
  margin-bottom: 8px;
  background: #725dff;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.question-image,
.question-video {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  object-fit: contain;
  transition: all 0.3s ease;
}

.question-video {
  background: #000;
}

.question-stats {
  display: flex;
  gap: 24px;
  color: #909399;
  font-size: 14px;
}

.detail-actions {
  position: relative;
  height: 60px;
  margin-top: auto;
  flex-shrink: 0;
}

.action-delete {
  position: absolute;
  left: 0;
  bottom: 0;
}

.action-edit {
  position: absolute;
  right: 0;
  bottom: 0;
}

.delete-btn {
  font-size: 14px !important;
  color: #f56c6c !important;
  padding: 4px 8px !important;
  border: none !important;
  background: none !important;
  transition: all 0.3s ease !important;
}

.delete-btn:hover {
  color: #f78989 !important;
}

.edit-btn {
  font-size: 22px !important;
  color: #fff !important;
  padding: 14px 28px !important;
  border: none !important;
  background: #725dff !important;
  border-radius: 24px !important;
  transition: all 0.3s ease !important;
  min-width: 100px !important;
  text-align: center !important;
  height: 50px !important;
}

.edit-btn:hover {
  background: #a08aff !important;
  color: #fff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(114, 93, 255, 0.18) !important;
}

.save-btn {
  font-size: 22px !important;
  color: #fff !important;
  padding: 14px 28px !important;
  border: none !important;
  background: #725dff !important;
  border-radius: 24px !important;
  transition: all 0.3s ease !important;
  min-width: 100px !important;
  text-align: center !important;
  height: 50px !important;
}

.save-btn:hover {
  background: #a08aff !important;
  color: #fff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(114, 93, 255, 0.18) !important;
}

.no-question {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  height: 100%;
  position: relative;
  padding: 40px 20px;
}

.no-question-text {
  margin-bottom: 40px;
  text-align: left;
}

.no-question-text .line1 {
  font-size: 62px;
  margin-bottom: 8px;
  font-family: "Tw Cen MT";
}

.no-question-text .line2 {
  font-size: 62px;
  font-family: "Tw Cen MT";
}

.go-create-btn {
  position: absolute;
  bottom: 24px;
  right: 24px;
}

.go-create-btn :deep(.el-button) {
  font-size: 16px;

  padding: 10px 20px;
  border-radius: 8px;
  transition: color 0.3s ease;
  background: transparent;
  border: none;
  color: #409eff;
}

.go-create-btn :deep(.el-button:hover) {
  color: #337ecc;
  background: transparent;
}

.go-create-btn :deep(.el-button:active) {
  color: #337ecc;
  background: transparent;
}

.go-create-btn :deep(.el-button.is-text) {
  border: none;
  background: transparent;
}

.go-create-btn :deep(.el-button.is-text:hover) {
  color: #337ecc;
  background: transparent;
  border: none;
}

:deep(.el-card__body) {
  height: calc(100% - 57px);
  display: flex;
  flex-direction: column;
}

:deep(.left-card .el-card__body) {
  padding: 20px;
}

:deep(.right-card .el-card__body) {
  padding: 20px;
  overflow-y: auto;
}

.edit-mode-section {
  margin-bottom: 16px;
}

.edit-mode-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}

.editable-field {
  background: transparent;
  border: none;
  outline: none;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
  min-height: 20px;
}

.editable-field:focus {
  background: transparent;
  border: none;
}

.editable-field:hover {
  background: transparent;
}

.title-field {
  font-size: 20px;
  color: #303133;
  line-height: 1.4;
  display: block;
  width: 100%;
}

.content-field {
  font-size: 25px;
  color: #303133;
  line-height: 1.6;
  display: block;
  width: 100%;
  min-height: 60px;
  padding: 12px;
  border: none;
  border-radius: 4px;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  max-width: 100%;
  text-align: left;
  background: transparent;
  outline: none;
}

/* 保持向后兼容的样式类名 */
.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.image-uploader:hover {
  border-color: #409eff;
}

.uploaded-image,
.uploaded-video {
  width: 200px;
  height: 150px;
  object-fit: cover;
  display: block;
}

.uploaded-video {
  background: #000;
}

.upload-placeholder {
  width: 200px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
  font-size: 14px;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 8px;
}

.upload-text {
  color: #8c939d;
  font-size: 14px;
}

.upload-tips {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

:deep(.el-upload) {
  border: none;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
</style>
