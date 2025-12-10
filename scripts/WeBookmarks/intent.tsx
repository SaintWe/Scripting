/**
 * WeBookmarks Intent - 通过 iOS 分享菜单添加书签
 * 
 * 支持的输入类型：URL
 * 使用方式：从浏览器点击分享 -> 选择 Scripting -> 选择此脚本
 * 功能：将分享的 URL 添加到默认书签文件夹
 */

import { Intent, Script, Navigation, Text, VStack, Button, Image } from "scripting"
import { EditPage } from "./components/edit-page"
import { getDefaultFolder, Webookmarks } from "./utils/webookmarks-service"

/**
 * 从 URL 中提取网站域名作为默认名称
 */
const extractTitleFromUrl = (url: string): string => {
    try {
        const urlObj = new URL(url)
        return urlObj.hostname.replace(/^www\./, '')
    } catch {
        return "新书签"
    }
}

/**
 * 无 URL 输入时的提示界面
 */
function NoUrlView() {
    const dismiss = Navigation.useDismiss()

    return (
        <VStack
            padding={20}
            spacing={16}
            frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
            background={"systemBackground"}
        >
            <Image
                systemName="exclamationmark.triangle"
                foregroundStyle={"systemOrange"}
                font={"largeTitle"}
            />
            <Text font={"title3"} fontWeight={"bold"}>
                未检测到 URL
            </Text>
            <Text
                font={"subheadline"}
                foregroundStyle={"secondaryLabel"}
                multilineTextAlignment={"center"}
            >
                请从浏览器或其他应用的分享菜单中分享 URL
            </Text>
            <Button
                title="关闭"
                buttonStyle="bordered"
                action={() => {
                    dismiss()
                    Script.exit()
                }}
            />
        </VStack>
    )
}

/**
 * 主入口
 */
async function run() {
    // 获取分享的 URL
    const urls = Intent.urlsParameter

    if (urls && urls.length > 0) {
        const url = urls[0]
        const defaultFolder = getDefaultFolder()

        // 构造预填充的书签数据
        const prefilledData: Webookmarks = {
            id: "", // 空 ID 表示新建模式
            folderId: defaultFolder?.id || "",
            name: extractTitleFromUrl(url),
            url: url,
            icon: "bookmark.fill",
            color: "systemBlue"
        }

        // 直接复用编辑页面，传入 Intent 模式标记
        await Navigation.present({
            element: (
                <EditPage
                    data={prefilledData}
                    folderId={defaultFolder?.id || null}
                    isFromIntent={true}
                    onComplete={() => Script.exit()}
                />
            ),
            modalPresentationStyle: "pageSheet"
        })
    } else {
        // 无 URL 输入，显示提示
        await Navigation.present({
            element: <NoUrlView />,
            modalPresentationStyle: "formSheet"
        })
    }

    Script.exit()
}

run()
