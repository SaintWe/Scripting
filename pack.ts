/**
 * 基于 GitHub Releases 脚本打包工具
 *
 * ============================================
 * 使用方法
 * ============================================
 *
 * 列出所有脚本:
 *   bun pack.ts --list
 *
 * 发布模式（智能检测变更）:
 *   bun pack.ts --release --prev-hashes hashes.json
 *
 * 强制打包所有脚本:
 *   bun pack.ts --all
 *
 * 打包单个脚本:
 *   bun pack.ts "脚本名"
 *
 * 测试模式（不修改原文件，复制到 .pack-test 目录）:
 *   bun pack.ts --test --release
 *   bun pack.ts --test --list
 *
 * ============================================
 * 版本规则
 * ============================================
 *
 * 1. 仓库中 script.json 的版本 patch 必须为 0
 *    例: 1.0.0、1.1.0、2.0.0
 *
 * 2. 用户可修改 major.minor，patch 由打包流程自动递增
 *    例: 仓库 1.0.0 → 发布 1.0.1 → 1.0.2 → ...
 *        仓库改为 1.1.0 → 发布 1.1.1 → 1.1.2 → ...
 *
 * 3. 如果 patch ≠ 0，该脚本将被跳过（非法状态）
 *
 * ============================================
 * 变更检测逻辑
 * ============================================
 *
 * 1. 首次发布（无 hashes.json）→ 所有脚本发布为 x.y.1
 *
 * 2. 用户升级了 major.minor → 从 patch 1 开始
 *    例: 仓库 1.1.0，上次发布 1.0.5 → 发布 1.1.1
 *
 * 3. 内容有变更（contentHash 不同）→ patch + 1
 *    例: 仓库 1.0.0，上次发布 1.0.3 → 发布 1.0.4
 *
 * 4. 无变更 → 保持原版本和 UUID
 *
 * ============================================
 * 输出文件
 * ============================================
 *
 * dist/
 * ├── 脚本名.scripting    # 打包的脚本文件
 * └── hashes.json         # 版本和 contentHash 记录
 *
 * hashes.json 格式:
 * {
 *   "scripts": [
 *     { "name": "脚本名", "version": "1.0.1", "uuid": "...", "contentHash": "..." }
 *   ],
 *   "generatedAt": "2025-12-08T..."
 * }
 */

import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'

// 工作目录（可通过 --test 切换到测试目录）
let SCRIPTS_DIR = path.resolve('scripts')
let DIST_DIR = path.resolve('dist')
const TEST_DIR = path.resolve('.pack-test')

/**
 * 设置测试模式：复制 scripts 到测试目录
 */
async function setupTestMode(): Promise<void> {
    console.log('🧪 测试模式：复制脚本到临时目录\n')

    // 清理并创建测试目录
    await fs.emptyDir(TEST_DIR)

    // 复制 scripts 到测试目录
    const testScriptsDir = path.join(TEST_DIR, 'scripts')
    await fs.copy(SCRIPTS_DIR, testScriptsDir)

    // 切换工作目录
    SCRIPTS_DIR = testScriptsDir
    DIST_DIR = path.join(TEST_DIR, 'dist')
    await fs.ensureDir(DIST_DIR)

    console.log(`📁 测试目录: ${TEST_DIR}`)
    console.log(`📁 脚本目录: ${SCRIPTS_DIR}`)
    console.log(`📁 输出目录: ${DIST_DIR}\n`)
}

interface ScriptJson {
    name: string
    version: string
    remoteResource?: {
        hash: string
        url: string
        autoUpdateInterval?: number
    }
    [key: string]: any
}

interface ScriptHashInfo {
    name: string
    version: string
    uuid: string
    contentHash: string
}

interface HashesJson {
    scripts: ScriptHashInfo[]
    generatedAt: string
}

/**
 * 解析版本号
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(p => parseInt(p) || 0)
    return {
        major: parts[0] || 0,
        minor: parts[1] || 0,
        patch: parts[2] || 0
    }
}

/**
 * 格式化版本号
 */
function formatVersion(major: number, minor: number, patch: number): string {
    return `${major}.${minor}.${patch}`
}

/**
 * 获取所有脚本目录
 */
async function getAllScripts(): Promise<string[]> {
    const entries = await fs.readdir(SCRIPTS_DIR, { withFileTypes: true })
    return entries
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => entry.name)
}

/**
 * 读取 script.json
 */
async function readScriptJson(scriptName: string): Promise<ScriptJson | null> {
    const jsonPath = path.join(SCRIPTS_DIR, scriptName, 'script.json')
    try {
        return await fs.readJson(jsonPath)
    } catch {
        console.error(`❌ 无法读取 ${scriptName}/script.json`)
        return null
    }
}

/**
 * 保存 script.json
 */
async function saveScriptJson(scriptName: string, data: ScriptJson): Promise<void> {
    const jsonPath = path.join(SCRIPTS_DIR, scriptName, 'script.json')
    await fs.writeJson(jsonPath, data, { spaces: 2 })
}

/**
 * 读取上次的 hashes.json
 */
async function loadPrevHashes(prevHashesPath: string | null): Promise<Map<string, ScriptHashInfo> | null> {
    if (!prevHashesPath) return null

    try {
        const data: HashesJson = await fs.readJson(prevHashesPath)
        const map = new Map<string, ScriptHashInfo>()
        for (const script of data.scripts) {
            map.set(script.name, script)
        }
        return map
    } catch {
        return null
    }
}

/**
 * 计算脚本目录的内容 hash（排除 version 和 uuid）
 */
async function calculateContentHash(scriptName: string): Promise<string> {
    const scriptDir = path.join(SCRIPTS_DIR, scriptName)
    const hash = crypto.createHash('sha256')

    async function processDir(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        entries.sort((a, b) => a.name.localeCompare(b.name))

        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue
            const fullPath = path.join(dir, entry.name)

            if (entry.isDirectory()) {
                hash.update(`dir:${entry.name}`)
                await processDir(fullPath)
            } else {
                let content = await fs.readFile(fullPath)

                // 对于 script.json，排除 version 和 remoteResource.hash
                if (entry.name === 'script.json') {
                    try {
                        const json = JSON.parse(content.toString())
                        delete json.version
                        if (json.remoteResource) {
                            delete json.remoteResource.hash
                        }
                        content = Buffer.from(JSON.stringify(json, Object.keys(json).sort()))
                    } catch { }
                }

                hash.update(`file:${entry.name}:${content.length}:`)
                hash.update(content)
            }
        }
    }

    await processDir(scriptDir)
    return hash.digest('hex').substring(0, 16)
}

/**
 * 生成 UUID
 */
function generateUUID(): string {
    return crypto.randomUUID().toUpperCase()
}

interface PackResult {
    name: string
    version: string
    uuid: string
    contentHash: string
    status: 'updated' | 'unchanged' | 'skipped'
}

/**
 * 处理单个脚本的打包
 */
async function processScript(
    scriptName: string,
    prevInfo: ScriptHashInfo | null,
    forceUpdate: boolean
): Promise<PackResult | null> {
    const scriptJson = await readScriptJson(scriptName)
    if (!scriptJson) return null

    const repoVersion = parseVersion(scriptJson.version)

    // 检查 patch 是否为 0
    if (repoVersion.patch !== 0) {
        console.log(`⚠️ ${scriptName}: 跳过（版本 ${scriptJson.version} 的 patch 不为 0）`)
        return { name: scriptName, version: scriptJson.version, uuid: '', contentHash: '', status: 'skipped' }
    }

    const contentHash = await calculateContentHash(scriptName)

    let newVersion: string
    let newUUID: string
    let status: 'updated' | 'unchanged'

    if (!prevInfo || forceUpdate) {
        // 首次发布或强制更新
        newVersion = formatVersion(repoVersion.major, repoVersion.minor, 1)
        newUUID = generateUUID()
        status = 'updated'
        console.log(`📦 ${scriptName}: 新发布 → ${newVersion}`)
    } else {
        const prevVersion = parseVersion(prevInfo.version)

        // 检查用户是否手动升级了 major.minor
        if (repoVersion.major > prevVersion.major ||
            (repoVersion.major === prevVersion.major && repoVersion.minor > prevVersion.minor)) {
            // 用户升级了版本，从 patch 1 开始
            newVersion = formatVersion(repoVersion.major, repoVersion.minor, 1)
            newUUID = generateUUID()
            status = 'updated'
            console.log(`📦 ${scriptName}: 版本升级 ${prevInfo.version} → ${newVersion}`)
        } else if (contentHash !== prevInfo.contentHash) {
            // 内容有变更，patch +1
            newVersion = formatVersion(prevVersion.major, prevVersion.minor, prevVersion.patch + 1)
            newUUID = generateUUID()
            status = 'updated'
            console.log(`📦 ${scriptName}: 内容更新 ${prevInfo.version} → ${newVersion}`)
        } else {
            // 无变更，保持原样
            newVersion = prevInfo.version
            newUUID = prevInfo.uuid
            status = 'unchanged'
            console.log(`📦 ${scriptName}: ${newVersion} (无变更)`)
        }
    }

    // 更新 script.json
    scriptJson.version = newVersion
    if (!scriptJson.remoteResource) {
        scriptJson.remoteResource = { hash: '', url: '' }
    }
    scriptJson.remoteResource.hash = newUUID
    await saveScriptJson(scriptName, scriptJson)

    // 打包
    const scriptDir = path.join(SCRIPTS_DIR, scriptName)
    const outputFile = path.join(DIST_DIR, `${scriptName}.scripting`)

    try {
        execSync(`cd "${scriptDir}" && zip -r "${outputFile}" . -x '*.DS_Store' -x '__MACOSX/*'`, { stdio: 'pipe' })
    } catch (error) {
        console.error(`❌ 打包失败: ${scriptName}`)
        return null
    }

    return {
        name: scriptName,
        version: newVersion,
        uuid: newUUID,
        contentHash: contentHash,
        status: status
    }
}

/**
 * 生成 hashes.json
 */
async function generateHashesJson(results: PackResult[]): Promise<void> {
    const hashFilePath = path.join(DIST_DIR, 'hashes.json')

    const validResults = results.filter(r => r.status !== 'skipped')

    const data: HashesJson = {
        scripts: validResults.map(r => ({
            name: r.name,
            version: r.version,
            uuid: r.uuid,
            contentHash: r.contentHash
        })),
        generatedAt: new Date().toISOString()
    }

    await fs.writeJson(hashFilePath, data, { spaces: 2 })
    console.log(`\n📄 hashes.json 已生成`)
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2)

    // --test: 测试模式（复制到临时目录）
    if (args.includes('--test')) {
        await setupTestMode()
    }

    // --list: 列出所有脚本
    if (args.includes('--list')) {
        const scripts = await getAllScripts()
        console.log('📋 可用脚本:')
        for (const s of scripts) {
            const json = await readScriptJson(s)
            const v = parseVersion(json?.version || '0.0.0')
            const patchStatus = v.patch === 0 ? '✅' : '⚠️ (patch≠0)'
            console.log(`  - ${s} (v${json?.version || '?'}) ${patchStatus}`)
        }
        return
    }

    // --release: 发布模式
    if (args.includes('--release')) {
        const allScripts = await getAllScripts()

        const prevHashesIndex = args.indexOf('--prev-hashes')
        const prevHashesPath = prevHashesIndex !== -1 ? args[prevHashesIndex + 1] : null

        console.log('🚀 发布模式\n')

        const prevHashes = await loadPrevHashes(prevHashesPath)
        if (!prevHashes) {
            console.log('⚠️ 未找到上次的 hashes.json，所有脚本将作为首次发布\n')
        }

        await fs.emptyDir(DIST_DIR)

        const results: PackResult[] = []
        let updated = 0, unchanged = 0, skipped = 0

        for (const script of allScripts) {
            const prevInfo = prevHashes?.get(script) || null
            const result = await processScript(script, prevInfo, false)
            if (result) {
                results.push(result)
                if (result.status === 'updated') updated++
                else if (result.status === 'unchanged') unchanged++
                else if (result.status === 'skipped') skipped++
            }
        }

        if (results.filter(r => r.status !== 'skipped').length > 0) {
            await generateHashesJson(results)
        }

        console.log(`\n✅ 完成! 更新: ${updated}, 无变更: ${unchanged}, 跳过: ${skipped}`)
        return
    }

    // --all: 打包所有脚本（强制更新）
    if (args.includes('--all')) {
        const allScripts = await getAllScripts()

        console.log('📦 强制打包所有脚本\n')
        await fs.emptyDir(DIST_DIR)

        const results: PackResult[] = []

        for (const script of allScripts) {
            const result = await processScript(script, null, true)
            if (result) results.push(result)
        }

        if (results.filter(r => r.status !== 'skipped').length > 0) {
            await generateHashesJson(results)
        }

        console.log(`\n✅ 完成! 共打包 ${results.filter(r => r.status !== 'skipped').length} 个脚本`)
        return
    }

    // 单个脚本
    const scriptName = args[0]
    if (scriptName) {
        console.log(`📦 打包单个脚本: ${scriptName}\n`)
        await fs.ensureDir(DIST_DIR)

        const result = await processScript(scriptName, null, true)
        if (result && result.status !== 'skipped') {
            await generateHashesJson([result])
            console.log('\n✅ 完成!')
        }
        return
    }

    // 帮助信息
    console.log(`
使用方法:
  bun pack.ts --release --prev-hashes hashes.json   # 发布模式
  bun pack.ts --all                                  # 强制打包所有
  bun pack.ts "脚本名"                                # 打包单个脚本
  bun pack.ts --list                                 # 列出所有脚本

测试模式（不修改原文件）:
  bun pack.ts --test --release                       # 在临时目录测试发布流程
  bun pack.ts --test --list                          # 查看测试目录状态

版本规则:
  - 仓库中 script.json 的版本 patch 必须为 0（如 1.0.0）
  - 用户可修改 major.minor，patch 由打包流程自动递增
  - 如果 patch ≠ 0，该脚本将被跳过
`)
}

main().catch(console.error)
