/**
 * ActionButton - 圆角矩形操作按钮组件
 * 可复用的卡片式按钮，支持图标、文字和渐变背景
 * 
 * 使用方式：
 * ```tsx
 * import { ActionButton } from "./action-button"
 * 
 * <ActionButton
 *   title="保存"
 *   icon="checkmark"
 *   color="systemBlue"
 *   onTap={() => { ... }}
 * />
 * ```
 */

import { Button, HStack, Image, RoundedRectangle, Text, VStack } from "scripting"

export interface ActionButtonProps {
    /** 按钮标题 */
    title: string
    /** SF Symbol 图标名称 */
    icon?: string
    /** 背景颜色（系统颜色名称） */
    color?: string
    /** 是否使用渐变背景 */
    gradient?: boolean
    /** 按钮高度，默认 56 */
    height?: number
    /** 圆角大小，默认 16 */
    cornerRadius?: number
    /** 点击回调 */
    onTap: () => void
}

/**
 * 圆角矩形操作按钮，文字与图标在一行
 */
export const ActionButton = ({
    title,
    icon,
    color = "systemBlue",
    gradient = true,
    height = 56,
    cornerRadius = 16,
    onTap
}: ActionButtonProps) => {
    // 判断是否为浅色背景
    const isLightBg = color === "systemGray5" || color === "systemGray6"
    const textColor = isLightBg ? "label" : "white"
    const iconColor = isLightBg ? "secondaryLabel" : "white"

    return (
        <Button buttonStyle="plain" action={onTap}>
            <RoundedRectangle
                cornerRadius={cornerRadius}
                fill={gradient ? { color: color as any, gradient: true } : (color as any)}
                frame={{ height: height }}
                overlay={
                    <HStack spacing={8}>
                        {icon ? (
                            <Image
                                systemName={icon}
                                font="body"
                                fontWeight="semibold"
                                foregroundStyle={iconColor}
                            />
                        ) : null}
                        <Text
                            font="body"
                            fontWeight="medium"
                            foregroundStyle={textColor}
                        >
                            {title}
                        </Text>
                    </HStack>
                }
            />
        </Button>
    )
}

/**
 * 大卡片操作按钮，类似快捷指令
 */
export const ActionCard = ({
    title,
    icon,
    color = "systemBlue",
    height = 100,
    cornerRadius = 20,
    onTap
}: ActionButtonProps) => {
    return (
        <Button buttonStyle="plain" action={onTap}>
            <RoundedRectangle
                cornerRadius={cornerRadius}
                fill={{
                    color: color as any,
                    gradient: true
                }}
                frame={{ height: height }}
                overlay={
                    <VStack spacing={8} padding={16}>
                        {icon ? (
                            <Image
                                systemName={icon}
                                font="title2"
                                fontWeight="semibold"
                                foregroundStyle="white"
                            />
                        ) : null}
                        <Text
                            font="subheadline"
                            fontWeight="medium"
                            foregroundStyle="white"
                            lineLimit={2}
                            minScaleFactor={0.8}
                        >
                            {title}
                        </Text>
                    </VStack>
                }
            />
        </Button>
    )
}
