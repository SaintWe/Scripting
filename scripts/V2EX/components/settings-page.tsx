import { Button, ColorPicker, HStack, List, Navigation, NavigationStack, Picker, Section, Spacer, Stepper, Text, TextField, Toggle, VStack } from 'scripting'
import { useState } from 'scripting'
import type { Color } from 'scripting'
import { Client, ClientList, getCurrentSettings, refreshIntervalOptions, saveSettings } from '../utils/v2ex-service'

/**
 * 设置页面组件
 */
export const SettingsPage = () => {
  const dismiss = Navigation.useDismiss()
  const [currentSettings, setCurrentSettings] = useState(() => getCurrentSettings())
  const [autoRefresh, setAutoRefresh] = useState(currentSettings.autoRefresh ?? true)

  const [refreshInterval, setRefreshInterval] = useState(currentSettings.refreshInterval ?? 30)
  const [bgPath, setBgPath] = useState<string>(() => currentSettings.bgPath ?? '')
  const [lightModeColor, setLightModeColor] = useState<Color>(() => currentSettings.lightModeColor ?? '#000000')
  const [darkModeColor, setDarkModeColor] = useState<Color>(() => currentSettings.darkModeColor ?? '#FFFFFF')

  // 颜色背景相关状态
  const [enableColorBackground, setEnableColorBackground] = useState<boolean>(() => currentSettings.enableColorBackground ?? true)
  const [backgroundColors, setBackgroundColors] = useState<Color[]>(() => currentSettings.backgroundColors ?? ['#999999', '#444444'])
  const [showAddColorModal, setShowAddColorModal] = useState(false)
  const [newColor, setNewColor] = useState<Color>('#007AFF')

  // 浏览方式
  const [client, setClient] = useState(currentSettings.client ?? Client.AppIn)
  // API TOKEN
  const [v2exApiToken, setV2exApiToken] = useState<string>(() => currentSettings.v2exApiToken ?? '')

  // 更新设置的通用函数
  const updateSettings = (newSettings: any) => {
    setCurrentSettings(newSettings)
    const success = saveSettings(newSettings)
    if (!success) {
      console.error('保存设置失败')
    }
  }

  // 颜色背景管理函数
  const handleEnableColorBackgroundChange = (value: boolean) => {
    setEnableColorBackground(value)
    updateSettings({ ...currentSettings, enableColorBackground: value })
  }

  const handleAddColor = () => {
    const updatedColors = [...backgroundColors, newColor]
    setBackgroundColors(updatedColors)
    updateSettings({ ...currentSettings, backgroundColors: updatedColors })
    setNewColor('#007AFF')
    setShowAddColorModal(false)
  }

  const handleRemoveColor = (index: number) => {
    const updatedColors = backgroundColors.filter((_, i) => i !== index)
    setBackgroundColors(updatedColors)
    updateSettings({ ...currentSettings, backgroundColors: updatedColors })
  }

  const handleCancelAddColor = () => {
    setNewColor('#007AFF')
    setShowAddColorModal(false)
  }

  // 处理背景图片路径变化
  const handleBgPathChange = (path: string) => {
    setBgPath(path)
    const newSettings = { ...currentSettings, bgPath: path }
    updateSettings(newSettings)
  }

  // 处理刷新间隔选择
  const handleRefreshIntervalChange = (value: string) => {
    const interval = parseInt(value)
    setRefreshInterval(interval)
    const newSettings = { ...currentSettings, refreshInterval: interval }
    updateSettings(newSettings)
  }

  // 处理自动刷新选择
  const handleAutoRefreshChange = (value: string) => {
    const autoRefreshValue = value === 'true'
    setAutoRefresh(autoRefreshValue)
    const newSettings = { ...currentSettings, autoRefresh: autoRefreshValue }
    updateSettings(newSettings)
  }

  // 处理浅色模式颜色变化
  const handleLightModeColorChange = (color: Color) => {
    setLightModeColor(color)
    const newSettings = { ...currentSettings, lightModeColor: color }
    updateSettings(newSettings)
  }

  // 处理深色模式颜色变化
  const handleDarkModeColorChange = (color: Color) => {
    setDarkModeColor(color)
    const newSettings = { ...currentSettings, darkModeColor: color }
    updateSettings(newSettings)
  }

  // 处理浏览方式选择
  const handleClientChange = (value: string) => {
    setClient(value as Client)
    const newSettings = { ...currentSettings, client: value }
    updateSettings(newSettings)
  }

  // 处理 API TOKEN 变化
  const handleApiTokenChange = (v: string) => {
    setV2exApiToken(v)
    const newSettings = { ...currentSettings, v2exApiToken: v }
    updateSettings(newSettings)
  }


  const handleIncrement = () => {
    console.log("Incremented")
  }
  const handleDecrement = () => {
    console.log("Decremented")
  }

  return (
    <NavigationStack>
      <List
        navigationTitle="设置"
        navigationBarTitleDisplayMode="large"
        toolbar={{
          cancellationAction: <Button title="完成" action={dismiss} />
        }}
      >
        {/* 透明背景图片 */}
        <Section
          header={<Text font="headline">透明背景图片</Text>}
          footer={
            <Text font="footnote" foregroundStyle="secondaryLabel">
              填空不开启，若要使用需要安装 "透明背景" 脚本组件。{'\n'}关注微信公众号「组件派」获取。
            </Text>
          }
        >
          <VStack>
            <TextField
              title="背景图片路径"
              value={bgPath}
              onChanged={handleBgPathChange}
              prompt="请输入背景图路径"
              axis="vertical"
              lineLimit={{ min: 2, max: 4 }}
            />
          </VStack>
          <Button
            title="选择文件"
            systemImage="folder"
            action={async () => {
              const appPath = '/private/var/mobile/Library/Mobile Documents/iCloud~com~thomfang~Scripting/Documents/'
              const imgs = await DocumentPicker.pickFiles({
                initialDirectory: appPath,
                types: ["public.image"],
                allowsMultipleSelection: false
              })
              if (imgs !== null && imgs.length > 0) {
                if (imgs[0].startsWith(appPath) === false && !/\/Users\/\w+\/Library\/Mobile\sDocuments\/iCloud~com~thomfang~Scripting\/Documents\/.+/.test(imgs[0])) {
                  const confirmed = await Dialog.confirm({
                    title: '文件路径不可用',
                    message: `请选择 Scripting iCloud 目录下的文件，其他目录不可用\n当前路径: ${imgs[0]}\n如你已添加文件书签，请手动填入`,
                    cancelLabel: '知道了',
                    confirmLabel: '拷贝路径手动填入'
                  })
                  if (confirmed) {
                    await Pasteboard.setString(imgs[0])
                  }
                  // await Dialog.alert({
                  //   title: '文件路径不可用',
                  //   message: `请选择 Scripting iCloud 目录下的文件，其他目录不可用\n当前路径: ${imgs[0]}\n如你已添加文件书签，请手动填入`,
                  //   buttonLabel: '知道了'
                  // })
                } else {
                  handleBgPathChange(imgs[0])
                }
              }
            }}
          />
        </Section>

        {/* 颜色背景设置 */}
        <Section
          header={<Text font="headline">颜色背景</Text>}
          footer={
            <Text font="footnote" foregroundStyle="secondaryLabel">
              开启后将强制显示颜色背景，即使设置了透明背景也会被覆盖
            </Text>
          }
        >
          <Toggle title="开启颜色背景" value={enableColorBackground} onChanged={handleEnableColorBackgroundChange} />
        </Section>

        {/* 背景颜色列表设置 */}
        {enableColorBackground ? (
          <Section
            header={<Text font="headline">背景颜色列表</Text>}
            footer={
              <Text font="footnote" foregroundStyle="secondaryLabel">
                单个颜色显示纯色背景，多个颜色显示渐变背景
              </Text>
            }
          >
            {/* 添加颜色按钮 */}
            <Button
              title="添加颜色"
              action={() => setShowAddColorModal(true)}
              sheet={{
                isPresented: showAddColorModal,
                onChanged: setShowAddColorModal,
                content: (
                  <NavigationStack>
                    <List
                      navigationTitle="添加颜色"
                      navigationBarTitleDisplayMode="inline"
                      toolbar={{
                        topBarLeading: <Button title="取消" action={handleCancelAddColor} />,
                        topBarTrailing: <Button title="保存" action={handleAddColor} fontWeight="medium" />
                      }}
                    >
                      <Section>
                        <ColorPicker title="选择颜色" value={newColor} onChanged={setNewColor} supportsOpacity={false} />
                      </Section>
                    </List>
                  </NavigationStack>
                )
              }}
            />

            {/* 显示现有颜色列表 */}
            {backgroundColors && backgroundColors.length > 0 ? (
              backgroundColors.map((color, index) => (
                <VStack key={index} spacing={8}>
                  {/* 颜色信息区域 - 只显示，不可点击 */}
                  <HStack>
                    <VStack spacing={4} alignment="leading">
                      <Text font="body">颜色 {index + 1}</Text>
                      <Text font="caption">{color}</Text>
                    </VStack>
                    <Spacer />
                    {/* 删除按钮区域 - 独立点击区域 */}
                    <Button title="删除" role="destructive" action={() => handleRemoveColor(index)} />
                  </HStack>
                </VStack>
              ))
            ) : (
              <Text font="footnote" foregroundStyle="secondaryLabel">
                暂无颜色，点击"添加颜色"开始设置
              </Text>
            )}
          </Section>
        ) : null}

        {/* 字体颜色优化 */}
        <Section
          header={<Text font="headline">字体个性化</Text>}
          footer={
            <Text font="footnote" foregroundStyle="secondaryLabel">
              设置不同模式下的字体颜色，在各种背景下都清晰可见
            </Text>
          }
        >
          <ColorPicker title="浅色模式" value={lightModeColor} onChanged={handleLightModeColorChange} supportsOpacity={false} />
          <ColorPicker title="深色模式" value={darkModeColor} onChanged={handleDarkModeColorChange} supportsOpacity={false} />
        </Section>

        {/* 自动刷新设置 */}
        <Section
          header={<Text font="headline">自动刷新</Text>}
          footer={
            <Text font="footnote" foregroundStyle="secondaryLabel">
              开启自动刷新后，小组件会定期获取最新的央广网头条新闻
            </Text>
          }
        >
          <Picker title="自动刷新" value={autoRefresh.toString()} onChanged={handleAutoRefreshChange}>
            <Text tag="true" font="body">
              开启
            </Text>
            <Text tag="false" font="body">
              关闭
            </Text>
          </Picker>

          {autoRefresh ? (
            <Picker title="刷新间隔" value={refreshInterval.toString()} onChanged={handleRefreshIntervalChange}>
              {refreshIntervalOptions.map(option => (
                <Text key={option.value} tag={option.value.toString()} font="body">
                  {option.label}
                </Text>
              ))}
            </Picker>
          ) : null}
        </Section>

        {/* 浏览方式设置 */}
        <Section
          header={<Text font="headline">浏览方式</Text>}
          footer={
            <Text font="footnote" foregroundStyle="secondaryLabel">
              设置是使用浏览器打开或是其他方式打开
            </Text>
          }
        >
          <Picker title="浏览客户端" value={client.toString()} onChanged={handleClientChange}>
            {Object.keys(ClientList).map(key => (
              <Text tag={key} font="body">
                {ClientList[key as keyof typeof ClientList]}
                </Text>
              ))}
          </Picker>
        </Section>

        {/* API TOKEN 设置 */}
        <Section
          header={<Text font="headline">API TOKEN</Text>}
          footer={
            <Text font="footnote" foregroundStyle="secondaryLabel">
              V2EX 的 新 API 访问需要 Token 
            </Text>
          }
        >
          <VStack>
            <TextField
              title="API TOKEN"
              value={v2exApiToken}
              onChanged={handleApiTokenChange}
              prompt="请输入 API TOKEN"
              axis="vertical"
              lineLimit={{ min: 1, max: 2 }}
            />
          </VStack>
        </Section>

        {/* Large 组件设置 */}
        <Section
          header={<Text font="headline">Large 组件</Text>}
        >
          <Picker title="自动刷新" value={autoRefresh.toString()} onChanged={handleAutoRefreshChange}>
            <Text tag="true" font="body">
              开启
            </Text>
            <Text tag="false" font="body">
              关闭
            </Text>
          </Picker>
          <ColorPicker title="浅色模式" value={lightModeColor} onChanged={handleLightModeColorChange} supportsOpacity={false} />

          <HStack>
            <Stepper
              title="Adjust Volume"
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
            <Spacer minLength={5} />
            <Text
              padding={{
                trailing: 20,
                leading: 20
              }}
            >{v2exApiToken}</Text>
          </HStack>
        </Section>


      </List>
    </NavigationStack>
  )
}
