import { Script, Widget, Text } from "scripting"
import { View as SystemSmallView } from "./widget/small"
import { View as SystemMediumView } from "./widget/medium"
import { View as SystemLargeView } from "./widget/large"

/**
 * 解析小组件参数
 * 格式: folderId|reserved1|reserved2...
 * - 下标 0: 分类 ID
 * - 下标 1 及以后: 保留字段
 */
const parseWidgetParameter = (): { folderId?: string; reserved: string[] } => {
  const param = Script.widgetParameter || ""
  if (!param) {
    return { folderId: undefined, reserved: [] }
  }

  const parts = param.split("|").map(p => p.trim())
  const folderId = parts[0] || undefined
  const reserved = parts.slice(1)

  return { folderId, reserved }
};

(async () => {
  const { folderId } = parseWidgetParameter()

  switch (Widget.family) {
    case "systemSmall":
      Widget.present(<SystemSmallView folderId={folderId} />)
      break
    case "systemMedium":
      Widget.present(<SystemMediumView folderId={folderId} />)
      break
    case "systemLarge":
      Widget.present(<SystemLargeView folderId={folderId} />)
      break
    default:
      throw new Error("Unsupported widget size")
  }
})().catch((e) => {
  Widget.present(<Text>{String(e)}</Text>)
})
