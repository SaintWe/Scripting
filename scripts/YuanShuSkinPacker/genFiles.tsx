import { Path } from "scripting"
import { getCurrentSettings } from "./utils/skinPacker-service"

/**
 * 编译正则表达式列表
 */
const compileRegexes = (patterns: string[]): RegExp[] => {
    return patterns
        .filter(p => p?.trim())
        .map(p => {
            try {
                return new RegExp(p)
            } catch {
                console.error(`无效的正则: ${p}`)
                return null
            }
        })
        .filter((r): r is RegExp => r !== null)
}

/**
 * 递归清理目录中匹配正则的文件
 */
const cleanDirectory = async (dirPath: string, regexes: RegExp[]): Promise<void> => {
    const files = await FileManager.readDirectory(dirPath)

    for (const file of files) {
        const filePath = Path.join(dirPath, file)

        if (await FileManager.isFile(filePath)) {
            // 检查文件是否匹配任一正则
            if (regexes.some(regex => regex.test(filePath))) {
                await FileManager.remove(filePath)
            }
        } else if (await FileManager.isDirectory(filePath)) {
            // 递归处理子目录
            await cleanDirectory(filePath, regexes)
            // 删除空目录
            const remaining = await FileManager.readDirectory(filePath)
            if (remaining.length === 0) {
                await FileManager.remove(filePath)
            }
        }
    }
}

/**
 * 安全删除文件或目录
 */
const safeRemove = async (path: string): Promise<void> => {
    try {
        if (await FileManager.exists(path)) {
            await FileManager.remove(path)
        }
    } catch (e) {
        console.error(`删除失败: ${path}`, e)
    }
}

/**
 * 生成 Skin 文件
 * @param path 源目录路径
 * @param extname 输出文件扩展名
 */
export const genSkin = async (path: string, extname: string): Promise<void> => {
    const dirName = Path.basename(path)
    const zipFileName = `${dirName}.${extname}`
    const tempPath = Path.join(FileManager.scriptsDirectory, '..', 'tempfiles')
    const tempDirPath = Path.join(tempPath, dirName)
    const outputZipPath = Path.join(tempPath, zipFileName)

    try {
        // 1. 准备临时目录
        await safeRemove(tempDirPath)
        await FileManager.createDirectory(tempDirPath, true)

        // 2. 复制源文件
        await FileManager.copyFile(path, Path.join(tempDirPath, ''))

        // 3. 清理匹配正则的文件
        const pathRegex = getCurrentSettings().pathRegex
        const compiledRegexes = compileRegexes(pathRegex)
        await cleanDirectory(tempDirPath, compiledRegexes)

        // 4. 生成 ZIP 文件
        await safeRemove(outputZipPath)
        await FileManager.zip(tempDirPath, outputZipPath, true)

        // 5. 预览结果
        await QuickLook.previewURLs([outputZipPath])

    } catch (error) {
        console.error(`生成失败: ${error}`)
        throw error
    } finally {
        // 清理临时文件
        await safeRemove(tempDirPath)
        await safeRemove(outputZipPath)
    }
}
