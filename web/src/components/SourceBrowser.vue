<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useSourceBrowser } from '@/composables/useSourceBrowser'
  import { formatBytes, formatDate } from '@/utils/format'
  import type { DirectoryEntry, DirectorySelection, SourceFile } from '@/types'

  const emit = defineEmits<{
    'select-file': [file: SourceFile | null]
    'select-directory': [directory: DirectorySelection | null]
  }>()

  const { currentPath, rootPath, directories, files, selectedFile, directoryLoading, folderTodbId, canGoUp, error, initialize, openDirectory, goUp, scanCurrentDirectory, selectFile } =
    useSourceBrowser()

  const searchQuery = ref('')
  const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLocaleLowerCase())
  const filteredDirectories = computed(() => {
    if (!normalizedSearchQuery.value) {
      return directories.value
    }
    return directories.value.filter((directory) => directory.name.toLocaleLowerCase().includes(normalizedSearchQuery.value))
  })
  const filteredFiles = computed(() => {
    if (!normalizedSearchQuery.value) {
      return files.value
    }
    return files.value.filter((file) => file.name.toLocaleLowerCase().includes(normalizedSearchQuery.value))
  })

  function handleSelectFile(file: SourceFile) {
    selectFile(file)
  }

  function handleSelectDirectory(directory: DirectoryEntry | DirectorySelection) {
    selectFile(null)
    emit('select-directory', directory)
  }

  watch(selectedFile, (file) => {
    emit('select-file', file)
  })

  watch(currentPath, () => {
    searchQuery.value = ''
  })

  onMounted(() => {
    void initialize()
  })
</script>

<template>
  <aside class="min-w-0 lg:h-full lg:min-h-0 lg:max-h-full lg:overflow-hidden">
    <section class="min-w-0 overflow-hidden rounded-lg border border-line bg-white p-5 shadow-[0_5px_18px_rgb(35_54_64/3.5%)] max-sm:p-[15px] lg:flex lg:h-full lg:min-h-0 lg:max-h-full lg:flex-col">
      <div class="mb-[19px] flex min-w-0 items-center justify-between gap-3.5">
        <div class="min-w-0">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.11em] text-accent">视频文件</span>
          <h2 class="mt-1 truncate text-xl leading-tight text-ink max-sm:text-lg">选择要上传的视频</h2>
        </div>
        <button
          :disabled="directoryLoading"
          class="shrink-0 min-h-[34px] rounded-md border border-line bg-[#f7f9fa] px-[11px] text-xs font-bold text-[#536975] transition hover:border-[#a7cbd3] hover:bg-accent-soft hover:text-accent-dark"
          @click="openDirectory(currentPath)">
          刷新
        </button>
      </div>
      <div class="grid min-w-0 gap-[7px] border-l-[3px] border-[#64a2b1] bg-[#f2f7f8] px-3 py-[11px]">
        <span class="text-xs text-muted">当前目录</span>
        <code class="block min-w-0 max-w-full truncate font-mono text-[11px] text-[#405b66]">{{ currentPath || rootPath || '读取中…' }}</code>
      </div>
      <div class="my-[13px] flex min-w-0 items-center gap-2.5 max-sm:flex-wrap">
        <button
          :disabled="!canGoUp"
          class="min-h-10 rounded-md border border-[#c7dce2] bg-[#f4fafb] px-4 text-[13px] font-bold text-[#245d6d] transition hover:border-[#a4c8d1] hover:bg-accent-soft hover:text-accent-dark"
          @click="goUp">
          上一级
        </button>
        <span v-if="folderTodbId" class="inline-flex w-max items-center rounded-[3px] bg-accent-soft px-[7px] py-1 text-[11px] font-bold text-[#2c6d78]">todb_id {{ folderTodbId }}</span>
        <div class="relative min-w-0 flex-1 max-sm:basis-full">
          <input
            v-model="searchQuery"
            aria-label="搜索当前目录"
            class="min-h-10 w-full rounded-md border border-[#ccdce1] bg-[#fbfdfe] px-3 pr-8 text-[13px] text-ink outline-none focus:border-accent"
            placeholder="搜索当前目录" />
          <button
            v-if="searchQuery"
            aria-label="清除目录搜索"
            class="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-transparent text-[17px] leading-none text-muted hover:bg-accent-soft hover:text-accent-dark"
            type="button"
            @click="searchQuery = ''">
            ×
          </button>
        </div>
      </div>
      <p v-if="error" class="mb-[14px] mt-[-7px] text-xs leading-5 text-danger">{{ error }}</p>
      <div class="source-browser-scroll min-h-0 overscroll-contain [scrollbar-gutter:stable] lg:flex-1 lg:overflow-y-auto lg:pr-1">
        <div class="grid content-start gap-0">
          <div class="flex justify-between border-b border-line-soft pb-2 text-xs font-bold text-muted">
            子目录
            <span class="font-medium text-muted-light">
              {{ filteredDirectories.length }}
              <template v-if="normalizedSearchQuery">/ {{ directories.length }}</template>
            </span>
          </div>
          <div v-if="directoryLoading" class="px-[3px] py-[18px] text-xs text-[#96a5ad]">读取目录中…</div>
          <div v-else-if="filteredDirectories.length === 0" class="px-[3px] py-[18px] text-xs text-[#96a5ad]">{{ normalizedSearchQuery ? '没有匹配的子目录' : '没有子目录' }}</div>
          <div
            v-for="directory in filteredDirectories"
            :key="directory.path"
            class="source-browser-row flex min-h-[47px] min-w-0 items-stretch border-b border-[#e7eef0] focus-within:bg-[#edf6f7] lg:h-[47px] lg:max-h-[47px] max-sm:flex-col max-sm:py-1">
            <button class="flex min-w-0 flex-1 items-center gap-[9px] bg-transparent px-1 py-[7px] text-left text-[#30434c] hover:bg-[#edf6f7] max-sm:w-full" @click="openDirectory(directory.path)">
              <span class="grid size-[21px] shrink-0 place-items-center rounded-[3px] bg-[#e2f0f3] text-[17px] font-extrabold leading-none text-accent">/</span>
              <span :title="directory.name" class="min-w-0 flex-1 truncate text-[13px]">{{ directory.name }}</span>
              <small class="shrink-0 text-[11px] text-muted-light">{{ directory.file_count ?? 0 }} 个视频</small>
            </button>
            <button
              class="my-auto mr-1 ml-2 shrink-0 rounded-[3px] border border-[#bfd8df] bg-accent-soft px-[7px] py-[5px] text-[11px] font-bold text-accent-dark hover:bg-[#d9edf1] max-sm:mb-1 max-sm:ml-auto max-sm:mr-1 max-sm:mt-0"
              @click="handleSelectDirectory(directory)">
              批量匹配
            </button>
          </div>
        </div>
        <div class="mt-[22px] grid content-start gap-0">
          <div class="flex justify-between border-b border-line-soft pb-2 text-xs font-bold text-muted">
            视频文件
            <span class="font-medium text-muted-light">
              {{ filteredFiles.length }}
              <template v-if="normalizedSearchQuery">/ {{ files.length }}</template>
            </span>
          </div>
          <div v-if="filteredFiles.length === 0" class="px-[3px] py-[18px] text-xs text-[#96a5ad]">{{ normalizedSearchQuery ? '没有匹配的视频文件' : '扫描目录后显示视频文件' }}</div>
          <button
            v-for="file in filteredFiles"
            :key="file.id"
            :class="{ 'bg-[#edf6f7]': selectedFile?.id === file.id }"
            class="source-browser-row flex min-h-[47px] w-full items-center gap-[9px] border-b border-[#e7eef0] bg-transparent px-1 py-[7px] text-left text-[#30434c] hover:bg-[#edf6f7] lg:h-[47px] lg:max-h-[47px]"
            @click="handleSelectFile(file)">
            <span class="shrink-0 text-[9px] font-extrabold tracking-[0.05em] text-[#8b675c]">{{ file.name.split('.').pop()?.toUpperCase() || 'VIDEO' }}</span>
            <span class="grid min-w-0 flex-1 gap-[3px]">
              <strong :title="file.name" class="truncate text-xs text-[#30434c]">{{ file.name }}</strong>
              <small class="text-[10px] text-muted-light">{{ formatBytes(file.size) }} · {{ formatDate(file.modified_at) }}</small>
            </span>
          </button>
        </div>
      </div>
    </section>
  </aside>
</template>
