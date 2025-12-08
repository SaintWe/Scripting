import { Color, fetch } from 'scripting'
import scriptConfig from '../script.json'
import { createStorageManager } from './storage'
import { name } from '../script.json'

// 储存键名 - 统一管理所有持久化数据
const STORAGE_NAME = `${name}.Settings`

// 创建存储管理器实例
const storageManager = createStorageManager(STORAGE_NAME)

/**
 * 数据接口
 */
export interface V2exItem {
  id: number
  title: string
  replies: number
  url: string
}

/**
 * V2EX 数据响应接口
 */
export interface V2exData {
  items: V2exItem[]
  lastUpdated: string
  source: string
}

export const enum Client {
  /** 网页版 */
  H5 = 'h5',
  /** 应用内 */
  AppIn = 'AppIn'
}

export const ClientList = {
  /** 网页版 */
  h5: '默认浏览器',
  /** 应用内 */
  AppIn: '应用内'
}

export interface WidgetSettings {
  node: string
  titleColor: Color
  postNoFontSize: number
  postNoColor: Color
  postTitleFontSize: number
  postTitleColor: Color
  repliesFontSize: number
  repliesColor: Color
  largeLineSpacing: number
}

type WidgetMap = {
  [K in `${"large" | "medium" | "small"}_widget`]: WidgetSettings
}

export interface Settings extends WidgetMap {
  bgPath: string
  autoRefresh: boolean
  refreshInterval: number
  lightModeColor: Color
  darkModeColor: Color
  enableColorBackground: boolean
  backgroundColors: Color[]
  //
  v2exApiToken: string
  client: Client
}

/**
 * 默认设置
 */
const DEFAULT_SETTINGS: Settings = {
  bgPath: '',                   // 透明背景图片路径
  autoRefresh: true,            // 自动刷新开关
  refreshInterval: 30,          // 刷新间隔（分钟）
  lightModeColor: '#000000',    // 浅色模式字体颜色
  darkModeColor: '#FFFFFF',     // 深色模式字体颜色
  enableColorBackground: false, // 开启颜色背景
  backgroundColors: [],         // 背景颜色列表
  //
  v2exApiToken: '',             // v2ex api token
  client: Client.AppIn,         // 客户端
  //
  large_widget: {
    node: "latest",
    titleColor: "#d6d6d6",
    postNoFontSize: 14,
    postNoColor: "#ff8648",
    postTitleFontSize: 13,
    postTitleColor: "#f55fff",
    repliesFontSize: 10,
    repliesColor: "#999999",
    largeLineSpacing: 6,
  },
  medium_widget: {
    node: "latest",
    titleColor: "#d6d6d6",
    postNoFontSize: 14,
    postNoColor: "#ff8648",
    postTitleFontSize: 13,
    postTitleColor: "#ffffff",
    repliesFontSize: 10,
    repliesColor: "#999999",
    largeLineSpacing: 6,
  },
  small_widget: {
    node: "latest",
    titleColor: "#d6d6d6",
    postNoFontSize: 14,
    postNoColor: "#ff8648",
    postTitleFontSize: 13,
    postTitleColor: "#ffffff",
    repliesFontSize: 10,
    repliesColor: "#999999",
    largeLineSpacing: 6,
  },
}

// 存储键 - 用于访问统一存储对象中的具体字段
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  CACHE_DATA: 'cacheData',
  LAST_UPDATE: 'lastUpdate',
  LAST_VERSION: 'lastVersion',
}

/**
 * 刷新间隔选项（分钟）
 */
export const refreshIntervalOptions = [
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '1小时', value: 60 },
  { label: '2小时', value: 120 },
  { label: '6小时', value: 360 }
]

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
 * 获取动态字体颜色
 */
export const getDynamicTextColor = () => {
  const settings = getCurrentSettings()
  return {
    light: settings.lightModeColor,
    dark: settings.darkModeColor
  }
}

/**
 * 获取 V2EX API TOKEN
 */
export const getV2exApiToken = () => {
  const settings = getCurrentSettings()
  return settings.v2exApiToken
}

/**
 * 获取 V2EX API TOKEN
 */
export const isAppInOpen = () => {
  const settings = getCurrentSettings()
  return settings.client === Client.AppIn
}

/**
 * 解析URL参数的简单函数
 * @param url URL字符串
 * @returns 参数对象
 */
const parseUrlParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {}
  const queryString = url.split('?')[1]
  if (queryString) {
    const pairs = queryString.split('&')
    for (const pair of pairs) {
      const [key, value] = pair.split('=')
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value)
      }
    }
  }
  return params
}

/**
 * 获取V2EX主题列表，自动切换API
 * @param {string} nodeName 节点名，如 'hot'、'latest'、'python' 等
 * @param {number} page 页码，默认1
 * @returns {Promise<any[]>} 主题数组
 */
const processV2exTopics = async (nodeName: string, page: number = 1): Promise<any[]> => {
  // 最热和最新用v1 API
  if (nodeName === 'hot' || nodeName === 'latest') {
    const result = await fetch(`https://www.v2ex.com/api/topics/${nodeName}.json`).then((resp) => resp.json())
    if (nodeName === 'hot') {
      function compare<T extends Record<string, number>>(p: keyof T) {
        // 比较函数
        return function (m: T, n: T): number {
          const a = m[p]
          const b = n[p]
          return b - a // 降序
        }
      }
      return result.sort(compare("replies"))
    }
    return result
  } else {
    // 其它节点用v2 API
    const { v2exApiToken } = getCurrentSettings()

    const { result } = await fetch(
      `https://www.v2ex.com/api/v2/nodes/${encodeURIComponent(nodeName)}/topics?p=${page}`,
      {
        headers: {
          Authorization: 'Bearer ' + v2exApiToken,
          'Content-Type': 'application/json'
        }
      }
    ).then((resp) => resp.json())

    return result
  }
}

/**
 * 从对象数组中提取部分字段并生成带自增 id 的新数组
 * @param data 原始对象数组
 */
function extractItems<T>(
  data: T[],
): V2exItem[] {
  return data.map((item: any, index: number) => {
    return {
      id: index + 1, // id 自增
      title: item.title,
      replies: item.replies,
      url: item.url
    }
  })
}

/**
 * 获取V2EX主题列表，自动切换API
 * @param {string} nodeName 节点名，如 'hot'、'latest'、'python' 等
 * @param {number} page 页码，默认1
 * @returns {Promise<V2exData>} 主题数组
 */
export const fetchV2exTopics = async (nodeName: string, page: number = 1): Promise<V2exData> => {
  try {
    const V2exItems = extractItems(await processV2exTopics(nodeName, page))

    if (V2exItems.length === 0) {
      throw new Error('未获取到数据')
    }
    const V2exData: V2exData = {
      items: V2exItems,
      lastUpdated: new Date().toLocaleString(),
      source: '央广网'
    }
    // 缓存数据
    storageManager.storage.set(STORAGE_KEYS.CACHE_DATA, V2exData)
    storageManager.storage.set(STORAGE_KEYS.LAST_UPDATE, Date.now())

    return V2exData

  } catch (error) {
    console.error('获取数据失败:', error)

    // 尝试使用缓存数据
    const cachedData = storageManager.storage.get<V2exData>(STORAGE_KEYS.CACHE_DATA)
    if (cachedData) {
      console.log('使用缓存的数据')
      return cachedData
    }

    // 返回默认数据
    return {
      items: [{
        id: 1,
        title: '网络连接失败，请稍后重试',
        replies: 0,
        url: 'https://v2ex.com',
      }],
      lastUpdated: new Date().toLocaleString(),
      source: '央广网'
    }
  }
}






/**
 * 版本管理相关类型定义
 */
export interface VersionInfo {
  name: string
  desc: string
  version: string
  changelog: string[]
}

/**
 * 版本信息管理工具
 */
export const VersionManager = {
  /** 获取当前版本号 */
  getCurrentVersion: (): string => scriptConfig.version,

  /** 获取本地版本信息 */
  getLocalVersionInfo: (): VersionInfo => ({
    name: scriptConfig.name,
    desc: scriptConfig.description,
    version: scriptConfig.version,
    changelog: scriptConfig.changelog || []
  }),

  /** 获取更新日志 */
  getChangelog: (): string[] => scriptConfig.changelog || []
}

/**
 * 更新日志管理工具
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
 * 手动设置数据（用于测试或从外部数据源更新）
 * @param rawNewsData 原始数据
 */
export const setNewsData = (rawNewsData: V2exData): void => {
  try {
    // 处理链接格式
    const processedData = rawNewsData

    // 保存到存储
    storageManager.storage.set(STORAGE_KEYS.CACHE_DATA, processedData)
    storageManager.storage.set(STORAGE_KEYS.LAST_UPDATE, Date.now())

    console.log(`已设置 ${processedData.items.length} 条数据`)
  } catch (error) {
    console.error('设置数据失败:', error)
  }
}

/**
 * 获取远程横幅图片URL
 * @returns 横幅图片URL Promise
 */
export const fetchBannerImage = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://joiner.i95.me/scripting/joiner.json')
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

// 保持向后兼容的导出
export const getCurrentVersion = VersionManager.getCurrentVersion
export const getLocalVersionInfo = VersionManager.getLocalVersionInfo
export const getChangelog = VersionManager.getChangelog
export const shouldShowUpdateLog = UpdateLogManager.shouldShowUpdateLog
export const markUpdateLogDismissed = UpdateLogManager.markUpdateLogDismissed









// /**
//  * 获取V2EX主题列表，自动切换API
//  * @param {string} nodeName 节点名，如 'hot'、'latest'、'python' 等
//  * @param {number} page 页码，默认1
//  * @returns {Promise<V2exItem[]>} 主题数组
//  */
// export async function fetchV2exTopics(nodeName: string, page: number = 1): Promise<V2exItem[]> {
//   // 最热和最新用v1 API
//   if (nodeName === 'hot' || nodeName === 'latest') {
//     const result = await fetch(`https://www.v2ex.com/api/topics/${nodeName}.json`).then((resp) => resp.json())
//     if (nodeName === 'hot') {
//       function compare<T extends Record<string, number>>(p: keyof T) {
//         // 比较函数
//         return function (m: T, n: T): number {
//           const a = m[p]
//           const b = n[p]
//           return b - a // 降序
//         }
//       }
//       return extractItems<Record<string, any>>(result.sort(compare("replies")))
//     }
//     return extractItems<Record<string, any>>(result)
//   } else {
//     // 其它节点用v2 API
//     const token = storageManager.storage.get<string>(STORAGE_KEYS.TOKEN) || ''

//     const { result } = await fetch(
//       `https://www.v2ex.com/api/v2/nodes/${encodeURIComponent(nodeName)}/topics?p=${page}`,
//       {
//         headers: {
//           Authorization: 'Bearer ' + token,
//           'Content-Type': 'application/json'
//         }
//       }
//     ).then((resp) => resp.json())

//     return extractItems<Record<string, any>>(result)
//   }




//     const newsData: NewsData = {
//       items: newsItems,
//       lastUpdated: new Date().toLocaleString(),
//       source: '央广网'
//     }

//     // 缓存新闻数据
//     storageManager.storage.set(STORAGE_KEYS.NEWS_DATA, newsData)
//     storageManager.storage.set(STORAGE_KEYS.LAST_UPDATE, Date.now())

// }
