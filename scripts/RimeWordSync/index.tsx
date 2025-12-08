import { Button, Image, List, Navigation, NavigationStack, RoundedRectangle, Script, Section, Text, VStack } from 'scripting'
import { useEffect, useState } from 'scripting'
import { getCurrentSettings } from './utils/wordEditor-service'
import { SettingsPage } from './components/settings-page'
import { UpdateSection } from './components/update-section'
import scriptConfig from './script.json'
import { WordEditorPage } from './components/word-editor-page'

/**
 * 菜单按钮组件 - 大圆角矩形卡片样式
 */
const MenuButton = ({
  title,
  icon,
  color = 'systemBlue',
  action
}: {
  title: string
  icon: string
  color?: string
  action: () => void
}) => {
  return (
    <Button buttonStyle="plain" action={action}>
      <RoundedRectangle
        cornerRadius={28}
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

/**
 * 主页
 */
const Main = () => {
  const dismiss = Navigation.useDismiss()
  const [defaultOpenEditor] = useState(getCurrentSettings().defaultOpenEditor)

  const handleDefaultOpenEditorChange = async () => {
    const settings = getCurrentSettings()
    if (FileManager.bookmarkExists(settings.iCloudPathBookmark)) {
      const DICT_PATH_CLOUD = FileManager.bookmarkedPath(settings.iCloudPathBookmark) || ''
      if (!await FileManager.isFile(DICT_PATH_CLOUD)) {
        await Dialog.alert({
          title: '提示',
          message: 'iCloud 词库文件不存在',
          buttonLabel: '知道了'
        })
      } else {
        const content = await FileManager.readAsString(DICT_PATH_CLOUD, 'utf-8')
        await Navigation.present({
          element: <WordEditorPage PATH_CLOUD={DICT_PATH_CLOUD} CONTENT_CLOUD={content} />,
          modalPresentationStyle: 'pageSheet'
        })
      }
    } else {
      await Dialog.alert({
        title: '提示',
        message: 'iCloud 文件书签不存在',
        buttonLabel: '知道了'
      })
    }
  }

  // 初始加载 - 默认打开编辑器
  useEffect(() => {
    if (defaultOpenEditor) {
      handleDefaultOpenEditorChange()
    }
  }, [])

  return (
    <NavigationStack>
      <List
        navigationTitle={scriptConfig.name}
        navigationBarTitleDisplayMode="large"
        toolbar={{
          cancellationAction: <Button title="关闭" action={dismiss} />,
          primaryAction: (
            <Button
              title="设置"
              action={async () => {
                await Navigation.present({
                  element: <SettingsPage />,
                  modalPresentationStyle: 'pageSheet'
                })
              }}
            />
          )
        }}
      >
        <Section
          footer={
            <Text font="caption" foregroundStyle="secondaryLabel">
              打开默认的词库，不建议打开超过 2MB 的词库文件，否则会卡顿
            </Text>
          }
        >
          <MenuButton
            title="打开默认词库"
            icon="book.fill"
            color="systemBlue"
            action={async () => {
              await handleDefaultOpenEditorChange()
            }}
          />
        </Section>

        <Section
          footer={
            <Text font="caption" foregroundStyle="secondaryLabel">
              通过文件打开词库，没有保存权限，无法保存，仅可查看或测试
            </Text>
          }
        >
          <MenuButton
            title="通过文件打开词库"
            icon="folder.fill"
            color="systemBlue"
            action={async () => {
              const path = await DocumentPicker.pickFiles({})
              if (path && path.length > 0) {
                const content = await FileManager.readAsString(path[0], 'utf-8')
                await Navigation.present({
                  element: <WordEditorPage CONTENT_CLOUD={content} />,
                  modalPresentationStyle: 'pageSheet'
                })
              }
            }}
          />
        </Section>

        {/* 更新信息区 */}
        <UpdateSection autoCheckUpdate={!defaultOpenEditor} />

      </List>
    </NavigationStack>
  )
}

/**
 * 主函数
 */
const run = async (): Promise<void> => {
  await Navigation.present({
    element: <Main />,
    modalPresentationStyle: 'pageSheet'
  })
  Script.exit()
}

run()

