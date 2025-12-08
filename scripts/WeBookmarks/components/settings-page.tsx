import { Button, EditButton, EmptyView, ForEach, HStack, List, Navigation, NavigationStack, Picker, Section, Spacer, Text, VStack } from 'scripting'
import { useState } from 'scripting'
import { deleteFolder, getCurrentSettings, processWebookmarksFolders, renameFolder, reorderFolders, saveSettings, setDefaultFolder, Folder } from '../utils/webookmarks-service'
import { DataPage } from './data-page'

/**
 * 设置页面组件
 */
export const SettingsPage = () => {
  const dismiss = Navigation.useDismiss()
  const [currentSettings, setCurrentSettings] = useState(() => getCurrentSettings())

  // 分类列表状态
  const [folders, setFolders] = useState<Folder[]>(() => processWebookmarksFolders())

  // 更新设置的通用函数
  const updateSettings = (newSettings: any) => {
    setCurrentSettings(newSettings)
    const success = saveSettings(newSettings)
    if (!success) {
      console.error('保存设置失败')
    }
  }

  // 刷新文件夹列表
  const reloadFolders = () => {
    setFolders(processWebookmarksFolders())
  }

  // 处理设置默认分类
  const handleSetDefaultFolder = (folderId: string) => {
    setDefaultFolder(folderId)
    reloadFolders()
    HapticFeedback.mediumImpact()
  }

  // 复制分类 ID 到剪贴板
  const handleCopyFolderId = async (folderId: string) => {
    await Pasteboard.setString(folderId)
    HapticFeedback.lightImpact()
  }

  // 处理文件夹排序
  const handleFolderMove = (fromIndices: number[], toOffset: number) => {
    reorderFolders(fromIndices, toOffset)
    reloadFolders()
  }

  // 处理文件夹删除
  const handleFolderDelete = async (indices: number[]) => {
    for (const index of indices) {
      const folder = folders[index]
      if (folder) {
        deleteFolder(folder.id)
      }
    }
    reloadFolders()
  }

  // 处理文件夹重命名
  const handleRenameFolder = async (folderId: string, currentName: string) => {
    const newName = await Dialog.prompt({
      title: '重命名文件夹',
      placeholder: '请输入新名称',
      defaultValue: currentName,
      confirmLabel: '确定',
      cancelLabel: '取消'
    })
    if (newName != null && newName.trim() !== '') {
      renameFolder(folderId, newName.trim())
      reloadFolders()
      HapticFeedback.mediumImpact()
    }
  }

  return (
    <NavigationStack>
      <List
        navigationTitle="设置"
        navigationBarTitleDisplayMode="large"
        toolbar={{
          cancellationAction: <Button title="完成" action={dismiss} />,
          topBarTrailing: [
            <EditButton />,
            <Button
              title="数据"
              action={async () => {
                await Navigation.present({
                  element: <DataPage />,
                  modalPresentationStyle: 'pageSheet'
                })
                // 刷新数据
                reloadFolders()
                setCurrentSettings(getCurrentSettings())
              }}
            />
          ]
        }}
      >

        {/* 分类管理 */}
        <Section
          header={<Text font="headline">分类管理</Text>}
          footer={
            <Text font="footnote" foregroundStyle="secondaryLabel">
              拖拽排序，左右滑动可重命名或删除{'\n'}
              复制 ID 用于小组件参数配置，可以配置显示不同的文件夹的书签
            </Text>
          }
        >
          <ForEach
            count={folders.length}
            itemBuilder={(index: number) => {
              const folder = folders[index]
              if (!folder) return <EmptyView />
              return (
                <HStack
                  key={folder.id}
                  trailingSwipeActions={{
                    allowsFullSwipe: true,
                    actions: [
                      <Button
                        title="重命名"
                        tint="accentColor"
                        action={() => handleRenameFolder(folder.id, folder.name)}
                      />,
                      <Button
                        title="删除"
                        role="destructive"
                        action={async () => {
                          const confirmed = await Dialog.confirm({
                            title: '删除文件夹',
                            message: `确定删除文件夹「${folder.name}」及其所有书签吗？`,
                            confirmLabel: '删除',
                            cancelLabel: '取消'
                          })
                          if (confirmed) {
                            deleteFolder(folder.id)
                            reloadFolders()
                            HapticFeedback.mediumImpact()
                          }
                        }}
                      />,
                    ]
                  }}
                  leadingSwipeActions={{
                    actions: [
                      <Button
                        title="复制ID"
                        tint="orange"
                        action={() => handleCopyFolderId(folder.id)}
                      />,
                      !folder.isDefault ? (
                        <Button
                          title="设默认"
                          tint="systemGreen"
                          action={() => handleSetDefaultFolder(folder.id)}
                        />
                      ) : null
                    ].filter(Boolean) as any
                  }}
                >
                  <VStack spacing={4} alignment="leading">
                    <HStack spacing={6}>
                      <Text font="body">{folder.name}</Text>
                      {folder.isDefault ? (
                        <Text font="caption" foregroundStyle="systemGreen">默认</Text>
                      ) : null}
                    </HStack>
                    <Text font="caption2" foregroundStyle="tertiaryLabel">{folder.id}</Text>
                  </VStack>
                  <Spacer />
                </HStack>
              )
            }}
            onMove={handleFolderMove}
            onDelete={handleFolderDelete}
          />
        </Section>

        {/* 默认打开方式 */}
        <Section
          header={<Text font="headline">默认打开方式</Text>}
          footer={
            <Text font="footnote" foregroundStyle="secondaryLabel">
              新建书签时默认使用此设置，单个书签可覆盖此设置
            </Text>
          }
        >
          <Picker
            title="打开方式"
            value={currentSettings.defaultOpenInSafari ? 'safari' : 'inapp'}
            onChanged={(value: string) => {
              const newSettings = { ...currentSettings, defaultOpenInSafari: value === 'safari' }
              updateSettings(newSettings)
            }}
          >
            <Text tag="inapp" font="body">App 内打开</Text>
            <Text tag="safari" font="body">Safari 打开</Text>
          </Picker>

          <Picker
            title="全屏显示"
            value={currentSettings.defaultFullscreen ? 'yes' : 'no'}
            onChanged={(value: string) => {
              const newSettings = { ...currentSettings, defaultFullscreen: value === 'yes' }
              updateSettings(newSettings)
            }}
          >
            <Text tag="no" font="body">非全屏显示</Text>
            <Text tag="yes" font="body">全屏显示</Text>
          </Picker>
        </Section>

      </List>
    </NavigationStack>
  )
}
