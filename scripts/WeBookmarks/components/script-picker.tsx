/**
 * ScriptPicker - 脚本选择器组件
 * 可复用的脚本选择器，方便迁移到其他脚本中使用
 * 
 * 使用方式：
 * ```tsx
 * import { ScriptPicker, ScriptInfo } from "./script-picker"
 * 
 * <ScriptPicker
 *   isPresented={showPicker}
 *   onChanged={setShowPicker}
 *   onSelect={(script) => {
 *     console.log(script.name, script.icon, script.color)
 *   }}
 * />
 * ```
 */

import {
    Button,
    Color,
    HStack,
    Image,
    List,
    NavigationStack,
    Path,
    ProgressView,
    Section,
    Spacer,
    Text
} from "scripting"
import { useEffect, useState } from "scripting"

/**
 * 脚本信息类型
 */
export interface ScriptInfo {
    /** 脚本名称 */
    name: string
    /** 脚本图标（SF Symbol 名称） */
    icon: string
    /** 脚本颜色 */
    color: string
}

export interface ScriptPickerProps {
    /** 是否显示选择器 */
    isPresented: boolean
    /** 显示状态变化回调 */
    onChanged: (value: boolean) => void
    /** 选择脚本后的回调 */
    onSelect: (script: ScriptInfo) => void
    /** 自定义标题 */
    title?: string
    /** 自定义说明文字 */
    footer?: string
}

/**
 * 加载设备上已安装的脚本列表
 */
export const loadScriptList = async (): Promise<ScriptInfo[]> => {
    const scripts: ScriptInfo[] = []
    try {
        const root = FileManager.scriptsDirectory
        const dirs = await FileManager.readDirectory(root)

        for (const dir of dirs) {
            const configPath = Path.join(root, dir, 'script.json')
            if (await FileManager.exists(configPath)) {
                try {
                    const content = await FileManager.readAsString(configPath)
                    const config = JSON.parse(content)
                    if (config.name) {
                        scripts.push({
                            name: config.name,
                            icon: config.icon || 'app.fill',
                            color: config.color || 'systemBlue'
                        })
                    }
                } catch (e) {
                    console.error('读取脚本配置失败:', dir, e)
                }
            }
        }
    } catch (e) {
        console.error('加载脚本列表失败:', e)
    }
    return scripts
}

/**
 * 脚本选择器 Sheet 内容组件
 */
export const ScriptPickerContent = ({
    onSelect,
    onCancel,
    title = "选择脚本",
    footer = "选择脚本后将自动填充相关信息"
}: {
    onSelect: (script: ScriptInfo) => void
    onCancel: () => void
    title?: string
    footer?: string
}) => {
    const [scripts, setScripts] = useState<ScriptInfo[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadScriptList().then(list => {
            setScripts(list)
            setLoading(false)
        })
    }, [])

    const handleSelect = (script: ScriptInfo) => {
        onSelect(script)
        HapticFeedback.mediumImpact()
    }

    return (
        <NavigationStack>
            <List
                navigationTitle={title}
                navigationBarTitleDisplayMode="inline"
                toolbar={{
                    cancellationAction: <Button title="取消" action={onCancel} />
                }}
            >
                <Section
                    footer={<Text font="caption" foregroundStyle="secondaryLabel">{footer}</Text>}
                >
                    {loading ? (
                        <ProgressView />
                    ) : scripts.length === 0 ? (
                        <Text foregroundStyle="secondaryLabel">暂无可用脚本</Text>
                    ) : (
                        scripts.map((script, idx) => (
                            <Button
                                key={idx}
                                buttonStyle="plain"
                                action={() => handleSelect(script)}
                            >
                                <HStack spacing={12}>
                                    <Image
                                        systemName={script.icon}
                                        foregroundStyle={script.color as Color}
                                        font="title3"
                                        frame={{ width: 28 }}
                                    />
                                    <Text font="body">{script.name}</Text>
                                    <Spacer />
                                    <Image systemName="chevron.right" foregroundStyle="tertiaryLabel" />
                                </HStack>
                            </Button>
                        ))
                    )}
                </Section>
            </List>
        </NavigationStack>
    )
}

/**
 * 脚本选择器按钮组件（包含 Sheet）
 */
export const ScriptPickerButton = ({
    onSelect,
    title = "选择脚本启动",
    pickerTitle = "选择脚本",
    footer = "选择脚本后将自动填充 URL、名称、图标和颜色"
}: {
    onSelect: (script: ScriptInfo) => void
    title?: string
    pickerTitle?: string
    footer?: string
}) => {
    const [isPresented, setIsPresented] = useState(false)

    return (
        <Button
            title={title}
            action={() => setIsPresented(true)}
            sheet={{
                isPresented: isPresented,
                onChanged: setIsPresented,
                content: (
                    <ScriptPickerContent
                        title={pickerTitle}
                        footer={footer}
                        onSelect={(script) => {
                            onSelect(script)
                            setIsPresented(false)
                        }}
                        onCancel={() => setIsPresented(false)}
                    />
                )
            }}
        />
    )
}
