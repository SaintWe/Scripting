import { HStack, Image, Link, Path, Script, Spacer, Text, VStack, Widget } from 'scripting'
import type { V2exData, V2exItem } from './utils/v2ex-service'
import { fetchV2exTopics, getCurrentSettings, getDynamicTextColor, isAppInOpen } from './utils/v2ex-service'
import { genOpenCurrentScriptURL } from './utils/app-action'

// 全局数据变量
let v2exData: V2exData | null = null

/**
 * 获取背景图片路径
 */
const getWidgetBackgroundImagePath = (settings: any) => {
  return settings.bgPath
  return settings.bgPath && Widget.parameter ? Path.join(settings.bgPath, Widget.parameter) : undefined
}

/**
 * 生成背景样式
 */
const generateWidgetBackground = (settings: any) => {
  // 如果开启了颜色背景，优先使用颜色背景
  if (settings.enableColorBackground && settings.backgroundColors && settings.backgroundColors.length > 0) {
    const colors = settings.backgroundColors

    if (colors.length === 1) {
      // 单个颜色，使用纯色背景
      return colors[0]
    } else {
      // 多个颜色，使用渐变背景
      return {
        gradient: colors.map((color: any, index: number) => ({
          color: color,
          location: index / (colors.length - 1)
        })),
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      }
    }
  }

  return undefined
}

/**
 * 项目组件
 * @param props 组件属性
 * @param props.key 索引下标
 * @param props.item 新闻项目
​ * @param props.size 组件尺寸，影响字体大小
 * @param props.alignment 文本对齐方式
 */
const V2exItemComponent = ({
  key,
  item,
  size = 'large',
  alignment = 'leading'
}: {
  key: number
  item: V2exItem
  showTime?: boolean
  size?: 'small' | 'medium' | 'large'
  alignment?: 'leading' | 'center'
}) => {
  // 获取动态字体颜色
  const textColor = getDynamicTextColor()

  const settings = getCurrentSettings()
  const widget_setting = settings[`${size}_widget`];
  const url = isAppInOpen() ? genOpenCurrentScriptURL(item.url) : item.url

  return (
    <Link key={item.id} buttonStyle='plain' url={url}>
      <HStack frame={{ maxWidth: 'infinity' }} alignment='center'>
        <Text
          styledText={{
            bold: true,
            foregroundColor: item.id > 3 ? '#f5c94c' : '#fe4f67',
            font: widget_setting.postNoFontSize,
            monospaced: true,
            content: item.id < 10 ? item.id.toString() + ' ' : item.id.toString()
          }}
        />
        <Text
          lineLimit={1}
          truncationMode="tail"
          styledText={{
            foregroundColor: widget_setting.postTitleColor,
            font: widget_setting.postTitleFontSize,
            content: item.title
          }}
        />
        <Spacer />
        <Text
          styledText={{
            foregroundColor: widget_setting.repliesColor,
            font: widget_setting.repliesFontSize,
            content: item.replies.toString()
          }}
        />
      </HStack>
    </Link>
  )
}

/**
 * 加载数据的异步函数
 * @returns 数据Promise
 */
const loadV2exData = async (): Promise<V2exData> => {
  if (!v2exData) {
    try {
      v2exData = await fetchV2exTopics(Script.widgetParameter || 'hot')
    } catch (error) {
      console.error('加载数据失败:', error)
      // 返回默认数据
      v2exData = {
        items: [
          {
            id: 1,
            title: '网络连接失败，请稍后重试',
            replies: 0,
            url: 'https://v2ex.com',
          }
        ],
        lastUpdated: new Date().toLocaleString(),
        source: new Date().toLocaleString()
      }
    }
  }
  return v2exData
}

/**
 * Widget视图 - 根据不同尺寸显示不同布局
 * @param props 组件属性
 * @param props.data 新闻数据
 */
const WidgetView = ({ data }: { data: V2exData }) => {
  // 获取动态字体颜色和背景图片设置
  const textColor = getDynamicTextColor()
  const settings = getCurrentSettings()

  // 获取背景图片路径和背景样式
  const getWidgetBg = getWidgetBackgroundImagePath(settings)
  const widgetBackground = generateWidgetBackground(settings)

  const outList = (items: V2exData['items'], size: "large" | "medium" | "small", max: number) => {
    let data = []
    for (let index = 0; index < max; index++) {
      if (items[index]) {
        data.push(
          <V2exItemComponent key={index} item={items[index]} showTime={false} size={size} />
        )
      } else {
        data.push(
          <HStack frame={{ maxWidth: 'infinity' }} alignment='center'>
            <Text font={14} fontWeight="bold" foregroundStyle={textColor}>
              ㅤ
            </Text>
          </HStack>
        )
      }
    }
    return data;
  }



  switch (Widget.family) {
    case 'systemSmall': {
      // 小号小组件 - 显示1条新闻
      const newsToShow = data.items.slice(0, 2)

      return (
        <VStack
          padding={{ horizontal: 12, vertical: 10 }}
          background={!settings.enableColorBackground && getWidgetBg ? <Image filePath={getWidgetBg} resizable={true} scaleToFill={true} /> : undefined}
          widgetBackground={widgetBackground}
        >
          <HStack spacing={4}>
            <Image
              imageUrl='https://www.v2ex.com/static/img/icon_rayps_64.png'
              frame={{ width: 14, height: 14 }}
              resizable
            />
            <Text font={14} fontWeight="bold" foregroundStyle={textColor}>
              央广头条
            </Text>
            <Spacer />
            <Text font={10} foregroundStyle="secondaryLabel">
              {data.lastUpdated}
            </Text>
          </HStack>

          <Spacer />

          <VStack spacing={4} alignment="leading">
            {newsToShow.map((item, index) => (
              <V2exItemComponent key={index} item={item} size="small" />
            ))}
          </VStack>

          <Spacer />

          <Text font={10} foregroundStyle="secondaryLabel">
            {data.lastUpdated}
          </Text>
        </VStack>
      )
    }

    case 'systemMedium': {
      // 中号小组件 - 显示4条新闻
      const newsToShow = data.items.slice(0, 4)

      return (
        <VStack
          padding={{ horizontal: 12, vertical: 12 }}
          background={!settings.enableColorBackground && getWidgetBg ? <Image filePath={getWidgetBg} resizable={true} scaleToFill={true} /> : undefined}
          widgetBackground={widgetBackground}
        >
          <HStack spacing={4}>
            <Image
              imageUrl='https://www.v2ex.com/static/img/icon_rayps_64.png'
              frame={{ width: 14, height: 14 }}
              resizable
            />
            <Text font="body" fontWeight="bold" foregroundStyle={textColor}>
              央广头条
            </Text>
            <Spacer />
            <Text font="caption2" foregroundStyle="secondaryLabel">
              {data.lastUpdated}
            </Text>
          </HStack>

          <Spacer />

          <VStack spacing={1} alignment="leading">
            {newsToShow.map((item, index) => (
              <V2exItemComponent key={index} item={item} size="medium" />
            ))}
          </VStack>
        </VStack>
      )
    }

    case 'systemLarge':
    case 'systemExtraLarge': {
      // 大号小组件 - 显示8条新闻
      const newsToShow = data.items.slice(0, 13)

      return (
        <VStack
          padding={{ horizontal: 14, vertical: 20 }}
          background={!settings.enableColorBackground && getWidgetBg ? <Image filePath={getWidgetBg} resizable={true} scaleToFill={true} /> : undefined}
          widgetBackground={widgetBackground}
        >
          <HStack padding={{ horizontal: 5 }} spacing={4} alignment="top">
            <Image
              imageUrl='https://www.v2ex.com/static/img/icon_rayps_64.png'
              frame={{ width: 14, height: 14, alignment: 'top' }}
              resizable
            />
            <Text font={12} bold={true} foregroundStyle={textColor}>
              V2ex / 头条
            </Text>
            <Spacer />
            <Text font="caption2" foregroundStyle="secondaryLabel">
              {data.lastUpdated}
            </Text>
          </HStack>

          {/* <Spacer/> */}

          {/* <VStack spacing={4} alignment="leading">
            {newsToShow.map((item, index) => (
              <V2exItemComponent key={index} item={item} showTime={false} size="large" />
            ))}
          </VStack> */}

          <VStack padding={{ top: 5 }} spacing={6} alignment="leading">
            {outList(newsToShow, 'large', 13)}
          </VStack>




        </VStack>
      )
    }

    default:
      return (
        <VStack spacing={8} alignment="center" padding={16}>
          <Image systemName="newspaper.fill" font="title" foregroundStyle="systemRed" />
          <Text font="body" foregroundStyle={textColor}>
            央广头条小组件
          </Text>
          <Text font="caption" foregroundStyle={textColor}>
            {data.lastUpdated}
          </Text>
        </VStack>
      )
  }
}

/**
 * 主函数 - 异步加载数据并呈现Widget
 */
const main = async (): Promise<void> => {
  try {
    const data = await loadV2exData()
    const settings = getCurrentSettings()

    if (settings.autoRefresh) {
      // 计算下次刷新时间
      const refreshIntervalMs = settings.refreshInterval * 60 * 1000 // 转换为毫秒
      const nextRefreshDate = new Date(Date.now() + refreshIntervalMs)

      console.log(`组件设置自动刷新，间隔: ${settings.refreshInterval}分钟，下次刷新: ${nextRefreshDate.toLocaleString()}`)

      // 使用定时刷新策略
      Widget.present(<WidgetView data={data} />, {
        policy: 'after',
        date: nextRefreshDate
      })
    } else {
      // 禁用自动刷新时使用默认策略
      console.log('组件禁用自动刷新，使用默认刷新策略')
      Widget.present(<WidgetView data={data} />)
    }
  } catch (error) {
    console.error('Widget加载失败:', error)

    // 获取动态字体颜色以便在错误显示时也能自动适配颜色模式
    const errorTextColor = getDynamicTextColor()

    // 显示错误信息
    Widget.present(
      <VStack spacing={8} alignment="center" padding={16}>
        <Image systemName="exclamationmark.triangle.fill" font="title" foregroundStyle="systemRed" />
        <Text font="body" foregroundStyle={errorTextColor}>
          数据加载失败
        </Text>
        <Text font="caption" foregroundStyle={errorTextColor}>
          请检查网络连接
        </Text>
      </VStack>
    )
  }
}

// 执行主函数
main()




// import {
//   Button,
//   HStack,
//   Image,
//   Link,
//   Script,
//   Spacer,
//   Text,
//   VStack,
//   Widget,
//   useMemo,
// } from 'scripting'
// import { IntentOpenSearch } from './app_intents'
// import { fetchV2exTopicsAuto, V2ex } from './apis/v2ex'
// import { Client, SetInit, Settings, STORAGE_KEYS, storageManager } from './utils/setting'

// function WidgetView({ list }: { list: V2ex.HotSearchItem[] }) {
//   const { height } = Widget.displaySize

//   const settings: Omit<Settings, "token"> =  {
//     client: storageManager.storage.get<Client>(STORAGE_KEYS.CLIENT) || SetInit.client,
//     fontSize: storageManager.storage.get<number>(STORAGE_KEYS.FONT_SIZE) || SetInit.fontSize,
//     color: storageManager.storage.get<Settings['color']>(STORAGE_KEYS.COLOR) || SetInit.color,
//     timeColor: storageManager.storage.get<Settings['timeColor']>(STORAGE_KEYS.TIME_COLOR) || SetInit.timeColor,
//     gap: storageManager.storage.get<number>(STORAGE_KEYS.GAP) || SetInit.gap,
//     logoSize: storageManager.storage.get<number>(STORAGE_KEYS.LOGO_SIZE) || SetInit.logoSize,
//     background: storageManager.storage.get<Settings['background']>(STORAGE_KEYS.BACKGROUND) || SetInit.background,
//   }

//   const count = Math.floor(
//     (height - 10 * 2 + settings.gap) / (settings.fontSize + settings.gap),
//   )
//   const logoLines = settings.logoSize
//     ? Math.ceil(settings.logoSize / (settings.fontSize + settings.gap))
//     : 0
//   const iconSize = useMemo(() => {
//     const size = (settings.fontSize * 12) / 14
//     return { width: size, height: size }
//   }, [settings.fontSize])
//   const now = new Date()

//   return (
//     <VStack padding={12} spacing={0} widgetBackground={settings.background}>
//       {list.slice(0, count - logoLines).map((item, i) => (
//         <Link key={item.id} buttonStyle='plain' url={item.url}>
//           <HStack alignment='top'>
//             <HStack
//               key={item.id}
//               frame={{ height: settings.fontSize + settings.gap }}
//               alignment='center'
//             >
//               <Text
//                 font={settings.fontSize}
//                 fontWeight='bold'
//                 foregroundStyle={item.id > 3 ? '#f5c94c' : '#fe4f67'}
//               >
//                 {item.id}
//               </Text>
//               <Text font={settings.fontSize} foregroundStyle={settings.color}>
//                 {item.title}
//               </Text>
//               <Spacer />
//             </HStack>
//             {i === 0 ? (
//               <Button buttonStyle='plain' intent={IntentOpenSearch(item)}>
//                 <HStack spacing={2}>
//                   <Image
//                     systemName='clock.arrow.circlepath'
//                     font={settings.fontSize * 0.7}
//                     foregroundStyle={settings.timeColor}
//                   />
//                   <Text
//                     font={settings.fontSize * 0.7}
//                     foregroundStyle={settings.timeColor}
//                   >
//                     {`${now.getHours()}`.padStart(2, '0')}:
//                     {`${now.getMinutes()}`.padStart(2, '0')}
//                   </Text>
//                 </HStack>
//               </Button>
//             ) : null}
//           </HStack>
//         </Link>
//       ))}
//       <HStack alignment='bottom'>
//         <VStack spacing={0}>
//           {list.slice(count - logoLines, count).map((item, i) => (
//             <Link key={item.id} buttonStyle='plain' url={item.url}>
//               <HStack
//                 key={item.id}
//                 frame={{ height: settings.fontSize + settings.gap }}
//                 alignment='center'
//               >
//                 <Text
//                   font={settings.fontSize}
//                   fontWeight='bold'
//                   foregroundStyle={item.id > 3 ? '#f5c94c' : '#fe4f67'}
//                 >
//                   {item.id}
//                 </Text>
//                 <Text font={settings.fontSize} foregroundStyle={settings.color}>
//                   {item.title}
//                 </Text>
//                 <Spacer />
//               </HStack>
//             </Link>
//           ))}
//         </VStack>
//         <Link url={'https://www.sinaimg.cn'}>
//           <Image
//             imageUrl='https://www.sinaimg.cn/blog/developer/wiki/LOGO_64x64.png'
//             frame={{ width: settings.logoSize, height: settings.logoSize }}
//             resizable
//           />
//         </Link>
//       </HStack>
//     </VStack>
//   )
// }

// ;(async () => {
//   const data = await fetchV2exTopicsAuto(Script.widgetParameter || 'hot')
//   Widget.present(<WidgetView list={data} />)
// })()









