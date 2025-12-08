/**
 * 数据管理页面
 * 导入导出书签数据，采用大圆角矩形按钮样式
 */
import { Button, HStack, Image, Navigation, NavigationStack, RoundedRectangle, Text, VStack } from 'scripting'
import { exportToClipboard, exportToFile, importFromClipboard, importFromFile } from '../utils/data-service'

/**
 * 数据管理页面组件
 */
export const DataPage = () => {
    const dismiss = Navigation.useDismiss()

    // 导出到剪贴板
    const handleExportToClipboard = async () => {
        const result = await exportToClipboard()
        HapticFeedback.mediumImpact()
        await Dialog.alert({
            title: result.success ? '导出成功' : '导出失败',
            message: result.message
        })
    }

    // 导出到文件
    const handleExportToFile = async () => {
        const tempPath = await exportToFile()
        await QuickLook.previewURLs([tempPath])
        HapticFeedback.mediumImpact()
    }

    // 从剪贴板导入
    const handleImportFromClipboard = async () => {
        const confirmed = await Dialog.confirm({
            title: '确认导入',
            message: '导入将覆盖现有数据，是否继续？',
            confirmLabel: '导入',
            cancelLabel: '取消'
        })

        if (confirmed) {
            const result = await importFromClipboard()
            HapticFeedback.mediumImpact()
            await Dialog.alert({
                title: result.success ? '导入成功' : '导入失败',
                message: result.message
            })
            if (result.success) {
                dismiss()
            }
        }
    }

    // 从文件导入
    const handleImportFromFile = async () => {
        const files = await DocumentPicker.pickFiles({
            types: ['public.json'],
            allowsMultipleSelection: false
        })

        if (!files || files.length === 0) return

        const confirmed = await Dialog.confirm({
            title: '确认导入',
            message: '导入将覆盖现有数据，是否继续？',
            confirmLabel: '导入',
            cancelLabel: '取消'
        })

        if (confirmed) {
            const result = await importFromFile(files[0])
            HapticFeedback.mediumImpact()
            await Dialog.alert({
                title: result.success ? '导入成功' : '导入失败',
                message: result.message
            })
            if (result.success) {
                dismiss()
            }
        }
    }

    return (
        <NavigationStack>
            <VStack
                navigationTitle="数据管理"
                navigationBarTitleDisplayMode="large"
                toolbar={{
                    cancellationAction: <Button title="关闭" action={dismiss} />
                }}
                padding={16}
                spacing={16}
            >
                {/* 导出区域 */}
                <Text font="headline" foregroundStyle="secondaryLabel" frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                    导出数据
                </Text>
                <HStack spacing={12}>
                    <ActionCard
                        icon="doc.on.clipboard"
                        title="复制到剪贴板"
                        color="systemBlue"
                        onTap={handleExportToClipboard}
                    />
                    <ActionCard
                        icon="square.and.arrow.up"
                        title="导出为文件"
                        color="systemGreen"
                        onTap={handleExportToFile}
                    />
                </HStack>

                {/* 导入区域 */}
                <Text font="headline" foregroundStyle="secondaryLabel" frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
                    导入数据
                </Text>
                <HStack spacing={12}>
                    <ActionCard
                        icon="doc.on.clipboard.fill"
                        title="从剪贴板导入"
                        color="systemOrange"
                        onTap={handleImportFromClipboard}
                    />
                    <ActionCard
                        icon="square.and.arrow.down"
                        title="从文件导入"
                        color="systemPurple"
                        onTap={handleImportFromFile}
                    />
                </HStack>

                {/* 说明 */}
                <Text font="footnote" foregroundStyle="tertiaryLabel" padding={{ top: 16 }}>
                    导出的 JSON 文件包含所有文件夹和书签数据。
                    导入时会覆盖现有数据，请谨慎操作。
                </Text>
            </VStack>
        </NavigationStack>
    )
}

/**
 * 操作卡片组件
 */
const ActionCard = ({
    icon,
    title,
    color,
    onTap
}: {
    icon: string
    title: string
    color: string
    onTap: () => void
}) => {
    return (
        <Button buttonStyle="plain" action={onTap}>
            <RoundedRectangle
                cornerRadius={20}
                fill={{
                    color: color as any,
                    gradient: true
                }}
                frame={{ height: 100 }}
                overlay={
                    <VStack spacing={8} padding={16}>
                        <Image
                            systemName={icon}
                            font="title2"
                            fontWeight="semibold"
                            foregroundStyle="white"
                        />
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
