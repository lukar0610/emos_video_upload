<script lang="ts" setup>
  import { useTaskQueue } from '@/composables/useTaskQueue'
  import { formatBytes, formatDuration, formatSpeed } from '@/utils/format'
  import type { TaskStatus } from '@/types'

  const {
    tasks,
    taskTotal,
    taskPage,
    taskPageSize,
    loadTaskPage,
    tasksLoading,
    taskError,
    taskSpeed,
    loadTasks,
    retryTask,
    pauseTask,
    resumeTask,
    deleteTask,
    deleteCandidate,
    confirmDeleteTask,
    cancelDeleteTask,
    deleteCompletedTasks,
  } = useTaskQueue()

  function statusLabel(status: string) {
    switch (status) {
      case 'queued':
        return '排队中'
      case 'running':
        return '进行中'
      case 'paused':
        return '已暂停'
      case 'success':
        return '已完成'
      case 'error':
        return '失败'
      default:
        return status
    }
  }

  function targetLabel(task: TaskStatus) {
    if (task.item_type !== 've') {
      return task.video_title || '—'
    }
    if (task.season_number === undefined || task.episode_number === undefined || task.season_number < 0 || task.episode_number <= 0) {
      return task.video_title || '电视剧集'
    }
    return `${task.video_title || '电视剧'} · S${String(task.season_number).padStart(2, '0')}E${String(task.episode_number).padStart(2, '0')}`
  }

  function remainingTime(task: TaskStatus) {
    const speed = taskSpeed(task)
    const remainingBytes = task.total_bytes - task.uploaded_bytes
    if (task.status !== 'running' || speed <= 0 || remainingBytes <= 0) {
      return ''
    }
    return formatDuration(remainingBytes / speed)
  }
</script>

<template>
  <section class="rounded-lg border border-line bg-white p-6 pb-8 shadow-[0_5px_18px_rgb(35_54_64/3.5%)] max-sm:p-[15px] max-sm:pb-10">
    <div class="mb-3 flex items-center justify-between gap-3.5 max-sm:items-stretch max-sm:flex-col">
      <div class="min-w-0">
        <h2 class="m-0 text-xl leading-tight text-ink max-sm:text-lg">上传记录</h2>
      </div>
      <div class="flex items-center gap-2 max-sm:justify-between">
        <button
          :disabled="tasksLoading || !tasks.some((task) => task.status === 'success')"
          class="rounded-md border border-line bg-transparent px-2.5 py-[7px] text-[13px] font-bold text-muted transition hover:text-accent-dark"
          @click="deleteCompletedTasks">
          清空已完成
        </button>
        <button
          :disabled="tasksLoading"
          class="min-h-[34px] rounded-md border border-line bg-[#f7f9fa] px-[11px] text-xs font-bold text-[#536975] transition hover:border-[#a7cbd3] hover:bg-accent-soft hover:text-accent-dark"
          @click="loadTasks()">
          刷新
        </button>
      </div>
    </div>
    <p v-if="taskError" class="m-0 text-xs leading-5 text-danger">{{ taskError }}</p>
    <div v-if="tasks.length === 0" class="min-h-[120px] pb-1 pt-6 text-xs text-[#96a5ad]">还没有上传任务</div>
    <div v-else class="border-t border-line-soft">
      <div
        v-for="task in tasks"
        :key="task.task_id"
        class="grid grid-cols-[minmax(220px,1fr)_minmax(280px,1.5fr)_auto] items-center gap-x-[22px] gap-y-2.5 border-b border-[#e5ecef] py-3.5 max-lg:grid-cols-1 max-lg:gap-[11px]">
        <div class="grid min-w-0 gap-[5px]">
          <div class="flex min-w-0 items-center gap-2">
            <strong class="truncate text-[13px] text-[#354650]">{{ task.file_name || task.task_id }}</strong>
          </div>
          <span class="truncate text-xs text-[#71818a]">
            <span
              :class="{
                'bg-warning-soft text-[#8b5d21]': task.status === 'running' || task.status === 'queued',
                'bg-[#eef2f3] text-[#60717a]': task.status === 'paused',
                'bg-accent-soft text-[#36715a]': task.status === 'success',
                'bg-danger-soft text-danger': task.status === 'error',
              }"
              class="mr-1.5 inline-flex w-max items-center rounded-[3px] px-[7px] py-1 text-[11px] font-bold">
              {{ statusLabel(task.status) }}
            </span>
            {{ targetLabel(task) }} · {{ task.storage || '—' }}
          </span>
        </div>
        <div class="grid min-w-0 gap-[7px] max-lg:col-span-full">
          <div class="flex items-center gap-2.5">
            <div class="h-[7px] flex-1 overflow-hidden rounded bg-[#e5edef]">
              <span :style="{ width: `${Math.min(100, Math.max(0, task.progress))}%` }" class="block h-full rounded bg-[#1c8b72] transition-[width] duration-300"></span>
            </div>
            <strong class="w-9 text-right text-xs text-[#537168]">{{ Math.round(task.progress) }}%</strong>
          </div>
          <div class="flex justify-between gap-2.5 text-xs text-[#71818a] max-sm:flex-col max-sm:items-start max-sm:gap-[3px]">
            <span class="truncate">{{ task.stage }}</span>
            <span v-if="task.status === 'running'" class="truncate">
              {{ formatSpeed(taskSpeed(task)) }}
              <template v-if="remainingTime(task)">· 剩余 {{ remainingTime(task) }}</template>
              · {{ formatBytes(task.uploaded_bytes) }} / {{ formatBytes(task.total_bytes) }}
            </span>
            <span v-else-if="task.total_bytes" class="truncate">{{ formatBytes(task.uploaded_bytes) }} / {{ formatBytes(task.total_bytes) }}</span>
          </div>
        </div>
        <div class="flex justify-end gap-[13px] max-lg:justify-start">
          <button v-if="task.status === 'running' || task.status === 'queued'" class="bg-transparent p-0 text-[13px] font-bold text-accent transition hover:text-accent-dark" @click="pauseTask(task)">
            暂停
          </button>
          <button v-if="task.status === 'paused'" class="bg-transparent p-0 text-[13px] font-bold text-accent transition hover:text-accent-dark" @click="resumeTask(task)">继续</button>
          <button v-if="task.status === 'error'" class="bg-transparent p-0 text-[13px] font-bold text-accent transition hover:text-accent-dark" @click="retryTask(task)">重试</button>
          <button class="bg-transparent p-0 text-[13px] font-bold text-danger transition hover:text-danger/80" @click="deleteTask(task)">删除</button>
        </div>
        <div v-if="task.error" class="col-span-full border-l-[3px] border-danger bg-danger-soft px-2.5 py-2 text-xs leading-5 text-danger">{{ task.error }}</div>
      </div>
    </div>
    <div v-if="taskTotal > taskPageSize">
      <div class="mt-3.5 flex items-center justify-between gap-3 border-t border-line-soft pt-3 text-xs text-muted">
        <span>共 {{ taskTotal }} 条记录 · 第 {{ taskPage }} / {{ Math.ceil(taskTotal / taskPageSize) }} 页</span>
        <div class="flex gap-2">
          <button
            :disabled="tasksLoading || taskPage <= 1"
            class="min-h-8 rounded-md border border-[#c7dce2] bg-[#f4fafb] px-[11px] text-xs font-bold text-[#245d6d] transition hover:border-[#a4c8d1] hover:bg-accent-soft hover:text-accent-dark"
            @click="loadTaskPage(taskPage - 1)">
            上一页
          </button>
          <button
            :disabled="tasksLoading || taskPage >= Math.ceil(taskTotal / taskPageSize)"
            class="min-h-8 rounded-md border border-[#c7dce2] bg-[#f4fafb] px-[11px] text-xs font-bold text-[#245d6d] transition hover:border-[#a4c8d1] hover:bg-accent-soft hover:text-accent-dark"
            @click="loadTaskPage(taskPage + 1)">
            下一页
          </button>
        </div>
      </div>
    </div>
  </section>

  <div v-if="deleteCandidate" class="fixed inset-0 z-20 grid place-items-center bg-slate-900/40 p-6" @click.self="cancelDeleteTask">
    <section aria-labelledby="delete-task-title" aria-modal="true" class="w-full max-w-[420px] rounded-lg border border-line bg-white p-6 shadow-[0_18px_48px_rgb(15_23_42/20%)]" role="dialog">
      <h3 id="delete-task-title" class="m-0 mb-2 text-base text-ink">删除上传任务</h3>
      <p class="m-0 text-[13px] text-muted">
        确定删除“{{ deleteCandidate.file_name || deleteCandidate.task_id }}”吗？
        <template v-if="deleteCandidate.status === 'running'">正在上传的请求会被停止。</template>
      </p>
      <div class="mt-6 flex justify-end gap-2.5">
        <button
          class="min-h-10 rounded-md border border-[#c7dce2] bg-[#f4fafb] px-4 text-[13px] font-bold text-[#245d6d] transition hover:border-[#a4c8d1] hover:bg-accent-soft hover:text-accent-dark"
          @click="cancelDeleteTask">
          取消
        </button>
        <button class="min-h-10 rounded-md bg-danger px-4 text-[13px] font-bold text-white transition hover:bg-[#a04740]" @click="confirmDeleteTask">删除</button>
      </div>
    </section>
  </div>
</template>
