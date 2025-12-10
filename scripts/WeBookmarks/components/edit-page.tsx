import { Button, Color, ColorPicker, HStack, Image, List, Navigation, NavigationStack, Picker, Script, Section, Text, TextField, VStack } from 'scripting'
import { useEffect, useState } from 'scripting'
import { generateShortId, getCurrentSettings, processWebookmarksFolders, saveWebookmark, Webookmarks } from '../utils/webookmarks-service'
import { ActionButton } from './action-button'
import { ScriptPickerButton, ScriptInfo } from './script-picker'

interface EditPageProps {
  data: Webookmarks | null
  folderId: string | null
  /** 是否从 Intent（分享菜单）启动 */
  isFromIntent?: boolean
  /** Intent 模式下完成时的回调 */
  onComplete?: () => void
}

/**
 * 书签编辑页面组件
 * App 内启动：自动保存机制
 * Intent 启动：底部按钮手动保存/取消
 */
export const EditPage = ({ data = null, folderId = null, isFromIntent = false, onComplete }: EditPageProps) => {
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

  // 选择脚本后填充信息
  const handleSelectScript = (script: ScriptInfo) => {
    const url = Script.createRunURLScheme(script.name)
    setCurrentURL(url)
    setCurrentName(script.name)
    setCurrentIcon(script.icon)
    setCurrentColor(script.color as Color)
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

  // 监听所有字段变化，自动保存（仅 App 内模式）
  useEffect(() => {
    if (isFromIntent) return // Intent 模式不自动保存
    // 延迟保存，避免频繁写入
    const timer = setTimeout(() => {
      autoSave()
    }, 500)
    return () => clearTimeout(timer)
  }, [currentFolderId, currentName, currentURL, currentColor, currentIcon, openMode, fullscreenMode])

  // Intent 模式下的手动保存
  const handleIntentSave = () => {
    if (!currentName.trim() || !currentURL.trim()) {
      Dialog.alert({ title: "提示", message: "请填写名称和 URL" })
      return
    }
    autoSave()
    HapticFeedback.notificationSuccess()
    onComplete?.()
    dismiss()
  }

  // Intent 模式下的取消
  const handleIntentCancel = () => {
    onComplete?.()
    dismiss()
  }

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
        navigationTitle={isFromIntent ? "添加书签" : (data?.id ? "编辑书签" : "新建书签")}
        navigationBarTitleDisplayMode="large"
        toolbar={isFromIntent ? undefined : {
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

          <ColorPicker
            title="卡片颜色"
            value={currentColor}
            onChanged={handleColorChange}
            supportsOpacity={false}
          />

        </Section>

        {/* 图标 */}
        <Section
          header={<Text font="headline">图标</Text>}
          footer={<Text font="caption" foregroundStyle="secondaryLabel">输入 SF Symbol 名称或点击选择按钮浏览图标库</Text>}
        >
          <HStack alignment="center" spacing={8}>
            <Image
              systemName={currentIcon || "questionmark.square.dashed"}
              scaleToFit
              imageScale={'large'}
              frame={{ width: 30, height: 30 }}
              foregroundStyle={currentColor}
              symbolRenderingMode={"hierarchical"}
            />
            <TextField
              title="图标名"
              value={currentIcon}
              onChanged={handleIconChange}
              prompt="bookmark.fill"
              frame={{ maxWidth: "infinity" }}
            />
            <Button
              title="选择"
              buttonStyle="bordered"
              action={async () => {
                const { SFSymbolPicker } = await import("./sf-symbol-picker")
                await Navigation.present({
                  element: (
                    <SFSymbolPicker
                      title="选择图标"
                      onSelect={(symbolName) => {
                        setCurrentIcon(symbolName)
                        HapticFeedback.mediumImpact()
                      }}
                    />
                  )
                })
              }}
            />
          </HStack>
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
          {/* Intent 模式下隐藏脚本选择器 */}
          {!isFromIntent && (
            <ScriptPickerButton
              title="选择脚本启动"
              onSelect={handleSelectScript}
            />
          )}
        </Section>

        {/* Intent 模式下的底部按钮 */}
        {isFromIntent && (
          <HStack spacing={15} listRowBackground={<VStack background="clear" />} listRowInsets={{ top: 0, leading: 0, bottom: 0, trailing: 0 }}>
            <ActionButton
              title="取消"
              icon="xmark"
              color="systemGray5"
              gradient={false}
              cornerRadius={28}
              onTap={handleIntentCancel}
            />
            <ActionButton
              title="保存"
              icon="checkmark"
              color="systemBlue"
              cornerRadius={28}
              onTap={handleIntentSave}
            />
          </HStack>
        )}

      </List>
    </NavigationStack>
  )
}
