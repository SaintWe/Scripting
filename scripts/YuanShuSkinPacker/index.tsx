import { Button, HStack, Image, List, Navigation, NavigationStack, RoundedRectangle, Script, Section, Text, VStack } from 'scripting'
import { SettingsPage } from './components/settings-page'
import { UpdateSection } from './components/update-section'
import scriptConfig from './script.json'
import { genSkin } from './genFiles'

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
          footer={<Text font="caption" foregroundStyle="secondaryLabel">选择皮肤的目录，打包为 ZIP 格式的文件</Text>}
        >
          <HStack spacing={15} listRowBackground={<VStack background="clear" />} listRowInsets={{ top: 0, leading: 0, bottom: 0, trailing: 0 }}>
            <MenuButton
              title="打包为仓输入法皮肤"
              icon="shippingbox.fill"
              color="systemBlue"
              action={async () => {
                const path = await DocumentPicker.pickDirectory()
                if (path) {
                  await genSkin(path, 'hskin')
                }
              }}
            />
            <MenuButton
              title="打包为元书输入法皮肤"
              icon="shippingbox.fill"
              color="systemIndigo"
              action={async () => {
                const path = await DocumentPicker.pickDirectory()
                if (path) {
                  await genSkin(path, 'cskin')
                }
              }}
            />
          </HStack>
        </Section>

        {/* 更新信息区 */}
        <UpdateSection autoCheckUpdate={true} />

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

