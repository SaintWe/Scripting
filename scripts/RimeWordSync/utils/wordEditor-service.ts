import { createStorageManager } from './storage'
import { name } from '../script.json'

// 储存键名 - 统一管理所有持久化数据
const STORAGE_NAME = `${name}.Settings`

// 创建存储管理器实例
const storageManager = createStorageManager(STORAGE_NAME)

export type Settings = {
  defaultOpenEditor: boolean,
  iCloudPathBookmark: string,
  saveAfterDeploy: boolean,
  deployURL: string,
  otherPathBookmarks: string[],
}

/**
 * 默认设置
 */
const DEFAULT_SETTINGS: Settings = {
  defaultOpenEditor: false,
  iCloudPathBookmark: 'DICT-PATH-iCloud',
  saveAfterDeploy: true,
  deployURL: 'hamster3://com.ihsiao.apps.hamster3/rime?action=deploy',
  otherPathBookmarks: [
  ],
}

// 存储键 - 用于访问统一存储对象中的具体字段
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  CACHE_DATA: 'cacheData',
  LAST_UPDATE: 'lastUpdate',
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
