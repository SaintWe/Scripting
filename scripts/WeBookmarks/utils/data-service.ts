/**
 * 数据导入导出服务
 * 处理书签数据的导入导出功能
 */
import { getCurrentSettings, saveSettings, Folder, Webookmarks } from './webookmarks-service'

/**
 * 导出数据接口
 */
export interface ExportData {
    version: string
    exportTime: string
    folders: Folder[]
    webookmarks: Webookmarks[]
}

/**
 * 导入结果接口
 */
export interface ImportResult {
    success: boolean
    message: string
}

/**
 * 导出书签数据为 JSON 字符串
 */
export const exportDataToJson = (): string => {
    const settings = getCurrentSettings()
    const exportData: ExportData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        folders: settings.folders,
        webookmarks: settings.webookmarks
    }
    return JSON.stringify(exportData, null, 2)
}

/**
 * 从 JSON 字符串导入书签数据
 * @param jsonString JSON 字符串
 * @returns 导入结果
 */
export const importDataFromJson = (jsonString: string): ImportResult => {
    try {
        const importData = JSON.parse(jsonString) as ExportData

        // 验证数据格式
        if (!importData.folders || !Array.isArray(importData.folders)) {
            return { success: false, message: '数据格式错误：缺少 folders 字段' }
        }
        if (!importData.webookmarks || !Array.isArray(importData.webookmarks)) {
            return { success: false, message: '数据格式错误：缺少 webookmarks 字段' }
        }

        // 验证文件夹数据
        for (const folder of importData.folders) {
            if (!folder.id || !folder.name) {
                return { success: false, message: '文件夹数据格式错误' }
            }
        }

        // 验证书签数据
        for (const bookmark of importData.webookmarks) {
            if (!bookmark.id || !bookmark.folderId || !bookmark.name || !bookmark.url) {
                return { success: false, message: '书签数据格式错误' }
            }
        }

        // 保存导入的数据
        const settings = getCurrentSettings()
        settings.folders = importData.folders
        settings.webookmarks = importData.webookmarks
        saveSettings(settings)

        return {
            success: true,
            message: `成功导入 ${importData.folders.length} 个文件夹，${importData.webookmarks.length} 条书签`
        }
    } catch (error) {
        console.error('导入数据失败:', error)
        return { success: false, message: `JSON 解析失败: ${error}` }
    }
}

/**
 * 导出到剪贴板
 */
export const exportToClipboard = async (): Promise<ImportResult> => {
    try {
        const jsonData = exportDataToJson()
        await Pasteboard.setString(jsonData)
        return { success: true, message: '数据已复制到剪贴板' }
    } catch (error) {
        return { success: false, message: `导出失败: ${error}` }
    }
}

/**
 * 导出到文件
 */
export const exportToFile = async (): Promise<string> => {
    const jsonData = exportDataToJson()
    const fileName = `WeBookmarks_${new Date().toISOString().slice(0, 10)}.json`
    const tempPath = FileManager.temporaryDirectory + '/' + fileName
    FileManager.writeAsString(tempPath, jsonData)
    return tempPath
}

/**
 * 从剪贴板导入
 */
export const importFromClipboard = async (): Promise<ImportResult> => {
    const jsonData = await Pasteboard.getString()
    if (!jsonData) {
        return { success: false, message: '剪贴板为空' }
    }
    return importDataFromJson(jsonData)
}

/**
 * 从文件导入
 */
export const importFromFile = async (filePath: string): Promise<ImportResult> => {
    try {
        const jsonData = await FileManager.readAsString(filePath)
        if (!jsonData) {
            return { success: false, message: '文件读取失败' }
        }
        return importDataFromJson(jsonData)
    } catch (error) {
        return { success: false, message: `文件读取失败: ${error}` }
    }
}
