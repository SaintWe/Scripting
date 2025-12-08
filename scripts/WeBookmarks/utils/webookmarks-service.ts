import { Color } from 'scripting'
import { createStorageManager } from './storage'
import { name } from '../script.json'

// 储存键名 - 统一管理所有持久化数据
const STORAGE_NAME = `${name}.Settings`

// 创建存储管理器实例
const storageManager = createStorageManager(STORAGE_NAME)

export interface Settings {
  defaultOpenInSafari: boolean
  defaultFullscreen: boolean
  folders: Folder[]
  webookmarks: Webookmarks[]
}

export interface Folder {
  id: string
  name: string
  isDefault?: boolean
}

export interface Webookmarks {
  id: string
  folderId: string
  name: string
  url: string
  color?: Color
  icon?: string
  openInSafari?: boolean
  fullscreen?: boolean
}

/**
 * 默认设置
 */
const DEFAULT_SETTINGS: Settings = {
  defaultOpenInSafari: false,
  defaultFullscreen: false,
  folders: [
    {
      id: 'a1b2c3d4',
      name: '默认文件夹',
      isDefault: true,
    }
  ],
  webookmarks: [
    {
      id: 'e5f6g7h8',
      folderId: 'a1b2c3d4',
      name: '默认书签',
      url: 'https://www.v2ex.com/',
      color: 'systemBlue',
      icon: 'bookmark.fill',
    },
  ],
}

// 存储键 - 用于访问统一存储对象中的具体字段
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  CACHE_DATA: 'cacheData',
  LAST_UPDATE: 'lastUpdate',
  LAST_VERSION: 'lastVersion',
}

/**
 * 生成8位小写短ID
 */
export const generateShortId = (): string => {
  return UUID.string().replace(/-/g, '').slice(0, 8).toLowerCase()
}

/**
 * 获取当前设置
 */
export const getCurrentSettings = () => {
  try {
    const savedSettings = storageManager.storage.get<Settings>(STORAGE_KEYS.SETTINGS)
    if (savedSettings) {
      return { ...DEFAULT_SETTINGS, ...savedSettings }
    }
  } catch (error) {
    console.error('读取设置失败:', error)
  }
  return DEFAULT_SETTINGS
}

/**
 * 保存设置
 */
export const saveSettings = (settings: Settings) => {
  try {
    storageManager.storage.set(STORAGE_KEYS.SETTINGS, settings)
    return true
  } catch (error) {
    console.error('保存设置失败:', error)
    return false
  }
}

/**
 * 提取所有书签文件夹
 */
export const processWebookmarksFolders = () => {
  const settings = getCurrentSettings()
  return settings.folders
}

/**
 * 提取所有书签
 */
export const processWebookmarks = () => {
  const settings = getCurrentSettings()
  return settings.webookmarks
}

/**
 * 提取指定文件夹书签
 */
export const processWebookmarksByFolderId = (folderId: string) => {
  const settings = getCurrentSettings()
  return settings.webookmarks.filter(webookmark => webookmark.folderId === folderId)
}

/**
 * 获取默认分类
 */
export const getDefaultFolder = (): Folder | undefined => {
  const settings = getCurrentSettings()
  return settings.folders.find(folder => folder.isDefault)
}

/**
 * 设置默认分类（同时取消其他分类的默认状态）
 */
export const setDefaultFolder = (folderId: string) => {
  const settings = getCurrentSettings()
  settings.folders = settings.folders.map(folder => ({
    ...folder,
    isDefault: folder.id === folderId
  }))
  saveSettings(settings)
}

/**
 * 根据分类 ID 获取书签，若分类不存在则返回默认分类的书签
 * @param folderId 分类 ID（可选）
 */
export const getBookmarksByFolderIdOrDefault = (folderId?: string): Webookmarks[] => {
  const settings = getCurrentSettings()

  // 如果提供了 folderId，检查该分类是否存在
  if (folderId) {
    const folderExists = settings.folders.some(folder => folder.id === folderId)
    if (folderExists) {
      return settings.webookmarks.filter(webookmark => webookmark.folderId === folderId)
    }
  }

  // 使用默认分类
  const defaultFolder = settings.folders.find(folder => folder.isDefault)
  if (defaultFolder) {
    return settings.webookmarks.filter(webookmark => webookmark.folderId === defaultFolder.id)
  }

  // 如果没有默认分类，返回第一个分类的书签
  if (settings.folders.length > 0) {
    return settings.webookmarks.filter(webookmark => webookmark.folderId === settings.folders[0].id)
  }

  // 没有任何分类，返回空数组
  return []
}

/**
 * 创建书签文件夹
 */
export const createWebookmarkFolder = (name: string) => {
  const settings = getCurrentSettings()
  settings.folders.push({
    id: generateShortId(),
    name: name,
  })
  saveSettings(settings)
}

/**
 * 删除指定书签
 */
export const delWebookmarkById = (id: Webookmarks['id']) => {
  const settings = getCurrentSettings()
  settings.webookmarks = settings.webookmarks.filter(webookmark => webookmark.id !== id)
  saveSettings(settings)
}

/**
 * 保存书签（编辑时保持原位置，新增时添加到末尾）
 */
export const saveWebookmark = (data: Webookmarks) => {
  const settings = getCurrentSettings()
  const existingIndex = settings.webookmarks.findIndex(webookmark => webookmark.id === data.id)

  if (existingIndex !== -1) {
    // 编辑模式：保持原位置
    settings.webookmarks[existingIndex] = data
  } else {
    // 新增模式：添加到末尾
    settings.webookmarks.push(data)
  }

  saveSettings(settings)
}

/**
 * 创建书签
 */
export const createWebookmark = (data: Omit<Webookmarks, 'id'>) => {
  const settings = getCurrentSettings()
  settings.webookmarks.push({
    ...data,
    id: UUID.string()
  })
  saveSettings(settings)
}

/**
 * 重新排序书签（用于拖拽调整顺序）
 * @param folderId 分类 ID
 * @param fromIndices 要移动的书签索引数组
 * @param toOffset 目标位置偏移
 */
export const reorderWebookmarks = (folderId: string, fromIndices: number[], toOffset: number) => {
  const settings = getCurrentSettings()

  // 获取该分类下的书签
  const folderBookmarks = settings.webookmarks.filter(b => b.folderId === folderId)
  const otherBookmarks = settings.webookmarks.filter(b => b.folderId !== folderId)

  // 执行移动操作
  const itemsToMove = fromIndices.map(i => folderBookmarks[i]).filter(Boolean)
  const remainingItems = folderBookmarks.filter((_, i) => !fromIndices.includes(i))

  // 在目标位置插入
  remainingItems.splice(toOffset, 0, ...itemsToMove)

  // 合并保存
  settings.webookmarks = [...otherBookmarks, ...remainingItems]
  saveSettings(settings)
}

/**
 * 重新排序文件夹（用于拖拽调整顺序）
 * @param fromIndices 要移动的文件夹索引数组
 * @param toOffset 目标位置偏移
 */
export const reorderFolders = (fromIndices: number[], toOffset: number) => {
  const settings = getCurrentSettings()

  // 执行移动操作
  const itemsToMove = fromIndices.map(i => settings.folders[i]).filter(Boolean)
  const remainingItems = settings.folders.filter((_, i) => !fromIndices.includes(i))

  // 在目标位置插入
  remainingItems.splice(toOffset, 0, ...itemsToMove)

  settings.folders = remainingItems
  saveSettings(settings)
}

/**
 * 重命名文件夹
 * @param folderId 文件夹 ID
 * @param newName 新名称
 */
export const renameFolder = (folderId: string, newName: string) => {
  const settings = getCurrentSettings()
  const folder = settings.folders.find(f => f.id === folderId)
  if (folder) {
    folder.name = newName
    saveSettings(settings)
  }
}

/**
 * 删除文件夹（会同时删除该文件夹下的所有书签）
 * @param folderId 文件夹 ID
 */
export const deleteFolder = (folderId: string) => {
  const settings = getCurrentSettings()
  settings.folders = settings.folders.filter(f => f.id !== folderId)
  settings.webookmarks = settings.webookmarks.filter(w => w.folderId !== folderId)
  saveSettings(settings)
}
