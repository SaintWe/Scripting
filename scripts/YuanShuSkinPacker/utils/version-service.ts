/**
 * 版本管理服务
 * 处理版本信息、更新检测、横幅图片等功能
 */
import { createStorageManager } from './storage'
import scriptConfig from '../script.json'

// 远程资源URL
const remoteResourceUrl = 'https://joiner.i95.me/scripting/joiner.json'

// 创建存储管理器实例
const storageManager = createStorageManager('version')

// 存储键
const STORAGE_KEYS = {
    LAST_VERSION: 'last_version'
}

/**
 * 版本信息类型
 */
export interface VersionInfo {
    name: string
    desc: string
    version: string
    changelog: string[]
}

/**
 * 版本信息管理
 */
export const VersionManager = {
    /** 获取当前版本号 */
    getCurrentVersion: (): string => scriptConfig.version,

    /** 获取本地版本信息 */
    getLocalVersionInfo: (): VersionInfo => ({
        name: scriptConfig.name,
        desc: scriptConfig.description,
        version: scriptConfig.version,
        changelog: (scriptConfig as any).changelog || []
    }),

    /** 获取更新日志 */
    getChangelog: (): string[] => (scriptConfig as any).changelog || []
}

/**
 * 更新日志管理
 */
export const UpdateLogManager = {
    /** 检查是否需要显示更新日志 */
    shouldShowUpdateLog: async (): Promise<boolean> => {
        try {
            const currentLocalVersion = scriptConfig.version
            const cachedVersion = storageManager.storage.get<string>(STORAGE_KEYS.LAST_VERSION)
            return cachedVersion !== currentLocalVersion
        } catch (error) {
            console.error('检查更新日志失败:', error)
            return false
        }
    },

    /** 标记更新日志已确认 */
    markUpdateLogDismissed: (): void => {
        storageManager.storage.set(STORAGE_KEYS.LAST_VERSION, scriptConfig.version)
    }
}

/**
 * 获取远程横幅图片URL
 */
export const fetchBannerImage = async (): Promise<string | null> => {
    try {
        const response = await fetch(remoteResourceUrl)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = (await response.json()) as any
        return data.bannerImage || null
    } catch (error) {
        console.error('获取横幅图片失败:', error)
        return null
    }
}

// 便捷导出
export const getCurrentVersion = VersionManager.getCurrentVersion
export const getLocalVersionInfo = VersionManager.getLocalVersionInfo
export const getChangelog = VersionManager.getChangelog
export const shouldShowUpdateLog = UpdateLogManager.shouldShowUpdateLog
export const markUpdateLogDismissed = UpdateLogManager.markUpdateLogDismissed
