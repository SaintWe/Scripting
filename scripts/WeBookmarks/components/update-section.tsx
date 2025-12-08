/**
 * 更新信息区组件
 * 显示横幅图片、版本信息、更新日志按钮
 */
import { Button, Image, Section, Text, VStack } from 'scripting'
import { useEffect, useState } from 'scripting'
import { fetchBannerImage, getChangelog, getCurrentVersion, getLocalVersionInfo, markUpdateLogDismissed, shouldShowUpdateLog, VersionInfo } from '../utils/version-service'
import scriptConfig from '../script.json'

interface UpdateSectionProps {
    /** 初始化时自动检查更新 */
    autoCheckUpdate?: boolean
}

/**
 * 更新信息区组件
 */
export const UpdateSection = ({ autoCheckUpdate = true }: UpdateSectionProps) => {
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
    const [hasCheckedUpdate, setHasCheckedUpdate] = useState(false)
    const [showChangelogSheet, setShowChangelogSheet] = useState(false)
    const [changelogContent, setChangelogContent] = useState<string>('')
    const [updateTitle, setUpdateTitle] = useState<string>('')
    const [bannerImageUrl, setBannerImageUrl] = useState<string>('')

    // 加载版本信息
    const loadVersionInfo = () => {
        try {
            const info = getLocalVersionInfo()
            setVersionInfo(info)
        } catch (error) {
            console.error('加载版本信息失败:', error)
        }
    }

    // 加载横幅图片
    const loadBannerImage = async () => {
        try {
            const bannerUrl = await fetchBannerImage()
            if (bannerUrl) {
                setBannerImageUrl(bannerUrl)
            }
        } catch (error) {
            console.error('加载横幅图片失败:', error)
        }
    }

    // 检查并显示更新提醒
    const checkAndShowUpdateAlert = async () => {
        try {
            if (hasCheckedUpdate) return

            const shouldShow = await shouldShowUpdateLog()
            console.log('是否需要显示更新提醒:', shouldShow)

            if (shouldShow) {
                const changelog = getChangelog()
                const currentVersion = getCurrentVersion()

                let changelogText = '暂无更新内容'
                if (Array.isArray(changelog) && changelog.length > 0) {
                    changelogText = changelog.map((item: string, index: number) => `${index + 1}. ${item}`).join('\n')
                }

                setChangelogContent(changelogText)
                setUpdateTitle(`脚本更新 - ${currentVersion}`)
                setShowChangelogSheet(true)
            }

            setHasCheckedUpdate(true)
        } catch (error) {
            console.error('检查更新失败:', error)
            setHasCheckedUpdate(true)
        }
    }

    // 处理更新提醒确认
    const handleUpdateDismiss = () => {
        markUpdateLogDismissed()
        setShowChangelogSheet(false)
    }

    // 显示更新日志
    const showChangelogAlert = () => {
        try {
            let targetVersionInfo = versionInfo

            if (!targetVersionInfo) {
                console.log('本地没有版本信息，获取本地信息')
                targetVersionInfo = getLocalVersionInfo()
            }

            if (!targetVersionInfo || !targetVersionInfo.changelog || !targetVersionInfo.changelog.length) {
                setChangelogContent('暂无更新日志信息')
                setUpdateTitle('更新日志')
                setShowChangelogSheet(true)
                return
            }

            console.log('准备显示更新日志:', targetVersionInfo.changelog)

            const changelogText = targetVersionInfo.changelog.map((item: string, index: number) => `${index + 1}. ${item}`).join('\n')

            setChangelogContent(changelogText || '暂无更新日志')
            setUpdateTitle(`更新日志 - ${targetVersionInfo.version || '未知版本'}`)
            setShowChangelogSheet(true)
        } catch (error) {
            console.error('显示更新日志失败:', error)
            setChangelogContent('获取更新日志失败')
            setUpdateTitle('错误')
            setShowChangelogSheet(true)
        }
    }

    // 初始加载
    useEffect(() => {
        const initialize = async () => {
            loadVersionInfo()
            await loadBannerImage()

            if (autoCheckUpdate) {
                setTimeout(() => {
                    checkAndShowUpdateAlert()
                }, 1000)
            }
        }
        initialize()
    }, [])

    return (
        <Section
            footer={
                <VStack spacing={10} alignment="leading">
                    {bannerImageUrl ? (
                        <Image imageUrl={bannerImageUrl} resizable scaleToFit />
                    ) : null}
                    <Text font="footnote" foregroundStyle="secondaryLabel">
                        {scriptConfig.name} 小组件 v{getCurrentVersion()}
                        {'\n'}
                        淮城一只猫© - 更多小组件请关注微信公众号「组件派」
                    </Text>
                </VStack>
            }
        >
            <Button
                title="更新日志"
                action={showChangelogAlert}
                sheet={{
                    isPresented: showChangelogSheet,
                    onChanged: setShowChangelogSheet,
                    content: (
                        <VStack presentationDragIndicator="visible" presentationDetents={['medium', 'large']} spacing={20} padding={20}>
                            <Text font="title2" foregroundStyle="label">
                                {updateTitle}
                            </Text>
                            <Text font="body" foregroundStyle="label" padding={10}>
                                {changelogContent}
                            </Text>
                            {updateTitle.includes('脚本更新') ? (
                                <Button title="我已知晓" action={handleUpdateDismiss} />
                            ) : (
                                <Button title="确定" action={() => setShowChangelogSheet(false)} />
                            )}
                        </VStack>
                    )
                }}
            />
        </Section>
    )
}
