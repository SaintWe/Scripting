import { Path } from "scripting"
import { getCurrentSettings } from "./utils/skinPacker-service"


/**
 * 生成 Skin 文件
 */
export const genSkin = async (path: string, extname: string): Promise<void> => {
    const dirName = Path.basename(path)
    const zipFileName = dirName + '.' + extname
    console.log(zipFileName)

    const tempPath = Path.join(FileManager.scriptsDirectory, '..', 'tempfiles')
    console.log(tempPath)

    const tempDirPath = Path.join(tempPath, dirName)
    console.log(tempDirPath)

    const outputZipPath = Path.join(tempPath, zipFileName)
    console.log(outputZipPath)

    try {
        if (await FileManager.isDirectory(tempDirPath)) {
            console.log('删除临时目录')
            await FileManager.remove(tempDirPath)
        }
        await FileManager.createDirectory(tempDirPath, true)
        await FileManager.copyFile(path, tempDirPath + '/')
        console.log(`拷贝完成`)

        const pathRegex = getCurrentSettings().pathRegex

        const compiledRegexes = pathRegex
            .filter(r => r && r.trim() !== '')
            .map(r => {
                try {
                    return new RegExp(r)
                } catch (e) {
                    console.error(`无效的正则: ${r}`, e)
                    return null
                }
            })
            .filter(r => r !== null) as RegExp[]

        // 递归删除匹配文件
        const cleanDirectory = async (dirPath: string) => {
            const files = await FileManager.readDirectory(dirPath)
            console.log(`开始循环`)
            for (const file of files) {
                const filePath = dirPath + '/' + file
                console.log(`当前路径：${filePath}`)
                if (await FileManager.isFile(filePath)) {
                    console.log(`是文件`)
                    if (compiledRegexes.some((regex) => regex.test(filePath))) {
                        console.log(`匹配删除`)
                        await FileManager.remove(filePath)
                        console.log(`已删除`)
                    }
                } else if (await FileManager.isDirectory(filePath)) {
                    console.log(`递归处理子目录: ${filePath}`)
                    await cleanDirectory(filePath)
                    const cleanDir = await FileManager.readDirectory(filePath)
                    if (cleanDir.length === 0) {
                        console.log(`空目录删除: ${filePath}`)
                        await FileManager.remove(filePath)
                    }
                }
            }
        }

        console.log(`开始清理`)
        await cleanDirectory(tempDirPath)

        if (await FileManager.isFile(outputZipPath)) {
            await FileManager.remove(outputZipPath)
            console.log(`删除旧的 zip: ${outputZipPath}`)
        }

        console.log(`Zip: ${outputZipPath}`)
        await FileManager.zip(tempDirPath, outputZipPath, true)
        console.log(`Zip 创建成功`)

        await QuickLook.previewURLs([outputZipPath])

    } catch (error) {
        console.error(`生成失败: ${error}`)
        throw error
    } finally {
        if (await FileManager.isDirectory(tempDirPath)) {
            await FileManager.remove(tempDirPath)
            console.log(`清理临时文件夹: ${tempDirPath}`)
        }
        await FileManager.remove(outputZipPath)
        console.log(`清理临时 ZIP 文件: ${outputZipPath}`)
    }
}

