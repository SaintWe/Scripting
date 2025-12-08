import { Button, Color, ColorPicker, HStack, Image, List, Navigation, NavigationStack, Path, Picker, ProgressView, Script, Section, Spacer, Text, TextField, VStack } from 'scripting'
import { useEffect, useState } from 'scripting'
import { generateShortId, getCurrentSettings, processWebookmarksFolders, saveWebookmark, Webookmarks } from '../utils/webookmarks-service'

// 脚本信息类型
interface ScriptInfo {
  name: string
  icon: string
  color: string
}

/**
 * 书签编辑页面组件
 * 采用自动保存机制，编辑内容会自动保存
 */
export const EditPage = ({ data = null, folderId = null }: { data: Webookmarks | null, folderId: string | null }) => {
  const dismiss = Navigation.useDismiss()

  const folders = processWebookmarksFolders()
  const settings = getCurrentSettings()

  const [currentFolderId, setCurrentFolderId] = useState<string>(data?.folderId || folderId || '0')
  const [currentName, setCurrentName] = useState<string>(data?.name || '')
  const [currentURL, setCurrentURL] = useState<string>(data?.url || '')
  const [currentColor, setCurrentColor] = useState<Color>(data?.color || 'systemBlue')
  const [currentIcon, setCurrentIcon] = useState<string>(data?.icon || 'bookmark.fill')
  // 打开方式: 'default' = 跟随全局设置, 'safari' = Safari打开, 'inapp' = app内打开
  const [openMode, setOpenMode] = useState<string>(() => {
    if (data?.openInSafari === undefined) return 'default'
    return data.openInSafari ? 'safari' : 'inapp'
  })
  // 全屏模式: 'default' = 跟随全局设置, 'yes' = 全屏, 'no' = 非全屏
  const [fullscreenMode, setFullscreenMode] = useState<string>(() => {
    if (data?.fullscreen === undefined) return 'default'
    return data.fullscreen ? 'yes' : 'no'
  })

  // 创建模式下的书签 ID（仅在首次保存时生成）
  const [createdId, setCreatedId] = useState<string | null>(null)

  // 脚本选择器状态
  const [showScriptPicker, setShowScriptPicker] = useState(false)
  const [scriptList, setScriptList] = useState<ScriptInfo[]>([])
  const [loadingScripts, setLoadingScripts] = useState(false)

  // 加载脚本列表
  const loadScripts = async () => {
    setLoadingScripts(true)
    try {
      const root = FileManager.scriptsDirectory
      const dirs = await FileManager.readDirectory(root)
      const scripts: ScriptInfo[] = []
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
      setScriptList(scripts)
    } catch (e) {
      console.error('加载脚本列表失败:', e)
    }
    setLoadingScripts(false)
  }

  // 选择脚本后填充信息
  const handleSelectScript = (script: ScriptInfo) => {
    const url = Script.createRunURLScheme(script.name)
    setCurrentURL(url)
    setCurrentName(script.name)
    setCurrentIcon(script.icon)
    setCurrentColor(script.color as Color)
    setShowScriptPicker(false)
    HapticFeedback.mediumImpact()
  }

  // 自动保存函数
  const autoSave = () => {
    // 确保名称和 URL 不为空才保存
    if (!currentName.trim() || !currentURL.trim()) return

    const bookmarkData: Omit<Webookmarks, 'id'> = {
      name: currentName,
      url: currentURL,
      folderId: currentFolderId,
      color: currentColor,
      icon: currentIcon,
      openInSafari: openMode === 'default' ? undefined : openMode === 'safari',
      fullscreen: fullscreenMode === 'default' ? undefined : fullscreenMode === 'yes'
    }

    if (data !== null) {
      // 编辑模式
      saveWebookmark({ id: data.id, ...bookmarkData })
    } else if (createdId) {
      // 创建模式但已有 ID（后续保存）
      saveWebookmark({ id: createdId, ...bookmarkData })
    } else {
      // 创建模式首次保存
      const newId = generateShortId()
      setCreatedId(newId)
      saveWebookmark({ id: newId, ...bookmarkData })
    }
  }

  // 监听所有字段变化，自动保存
  useEffect(() => {
    // 延迟保存，避免频繁写入
    const timer = setTimeout(() => {
      autoSave()
    }, 500)
    return () => clearTimeout(timer)
  }, [currentFolderId, currentName, currentURL, currentColor, currentIcon, openMode, fullscreenMode])

  const handleFolderIdChange = (id: string) => {
    setCurrentFolderId(id)
  }

  const handleNameChange = (name: string) => {
    setCurrentName(name)
  }

  const handleURLChange = (url: string) => {
    setCurrentURL(url)
  }

  const handleColorChange = (color: Color) => {
    setCurrentColor(color)
  }

  const handleIconChange = (icon: string) => {
    setCurrentIcon(icon)
  }

  const handleOpenModeChange = (mode: string) => {
    setOpenMode(mode)
  }

  return (
    <NavigationStack>
      <List
        navigationTitle={data ? "编辑书签" : "新建书签"}
        navigationBarTitleDisplayMode="large"
        toolbar={{
          cancellationAction: <Button title="完成" action={dismiss} />
        }}
      >

        {/* 文件夹 */}
        <Section
          footer={<Text font="caption" foregroundStyle="secondaryLabel">
            默认设置：{settings.defaultOpenInSafari ? 'Safari 打开' : 'App 内打开'}，{settings.defaultFullscreen ? '全屏显示' : '非全屏显示'}
            {'\n'}非 http/https 协议的 URL 将强制使用 Safari 打开
          </Text>}
        >
          <Picker title="文件夹" value={currentFolderId} onChanged={handleFolderIdChange}>
            {folders.map((item) => (
              <Text tag={item.id} font="body">
                {item.name}
              </Text>
            ))}
          </Picker>

          <Picker title="打开方式" value={openMode} onChanged={handleOpenModeChange}>
            <Text tag="default" font="body">跟随默认设置</Text>
            <Text tag="inapp" font="body">App 内打开</Text>
            <Text tag="safari" font="body">Safari 打开</Text>
          </Picker>

          <Picker title="全屏显示" value={fullscreenMode} onChanged={setFullscreenMode}>
            <Text tag="default" font="body">跟随默认设置</Text>
            <Text tag="yes" font="body">全屏显示</Text>
            <Text tag="no" font="body">非全屏显示</Text>
          </Picker>
        </Section>

        {/* SF 图标 */}
        <Section
          header={<Text font="headline">图标</Text>}
          footer={<Text font="caption" foregroundStyle="secondaryLabel">输入 SF Symbol 图标名称，如 bookmark.fill、globe、star.fill 等</Text>}
        >
          <TextField
            title="SF Symbol 图标名"
            value={currentIcon}
            onChanged={handleIconChange}
            prompt="bookmark.fill"
          />
        </Section>

        {/* 小组件卡片颜色 */}
        <Section
          header={<Text font="headline">小组件颜色</Text>}
          footer={<Text font="caption" foregroundStyle="secondaryLabel">选择此书签在小组件上显示的卡片颜色</Text>}
        >
          <ColorPicker
            title="卡片颜色"
            value={currentColor}
            onChanged={handleColorChange}
            supportsOpacity={false}
          />
        </Section>

        {/* 名称 */}
        <Section
          header={<Text font="headline">名称</Text>}
        >
          <VStack>
            <TextField
              title="名称"
              value={currentName}
              onChanged={handleNameChange}
              prompt="请输入名称"
            />
          </VStack>
        </Section>

        {/* URL */}
        <Section
          header={<Text font="headline">URL</Text>}
          footer={<Text font="caption" foregroundStyle="secondaryLabel">
            支持网页 URL 或脚本启动链接
          </Text>}
        >
          <VStack>
            <TextField
              title="URL"
              value={currentURL}
              onChanged={handleURLChange}
              prompt="请输入 URL"
              axis="vertical"
              lineLimit={{ min: 2, max: 6 }}
            />
          </VStack>
          <Button
            title="选择脚本启动"
            action={() => {
              loadScripts()
              setShowScriptPicker(true)
            }}
            sheet={{
              isPresented: showScriptPicker,
              onChanged: setShowScriptPicker,
              content: (
                <NavigationStack>
                  <List
                    navigationTitle="选择脚本"
                    navigationBarTitleDisplayMode="inline"
                    toolbar={{
                      cancellationAction: <Button title="取消" action={() => setShowScriptPicker(false)} />
                    }}
                  >
                    <Section
                      footer={<Text font="caption" foregroundStyle="secondaryLabel">
                        选择脚本后将自动填充 URL、名称、图标和颜色
                      </Text>}
                    >
                      {loadingScripts ? (
                        <ProgressView />
                      ) : scriptList.length === 0 ? (
                        <Text foregroundStyle="secondaryLabel">暂无可用脚本</Text>
                      ) : (
                        scriptList.map((script, idx) => (
                          <Button
                            key={idx}
                            buttonStyle="plain"
                            action={() => handleSelectScript(script)}
                          >
                            <HStack spacing={12}>
                              <Image
                                systemName={script.icon}
                                foregroundStyle={script.color as Color}
                                font="title3"
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
            }}
          />
        </Section>

      </List>
    </NavigationStack>
  )
}
