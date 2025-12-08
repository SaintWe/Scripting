import { Button, EditButton, EmptyView, ForEach, HStack, List, Navigation, NavigationStack, Script, Section, Spacer, Text, Widget } from 'scripting'
import { useEffect, useState } from 'scripting'
import { createWebookmarkFolder, delWebookmarkById, Folder, getCurrentSettings, processWebookmarksByFolderId, processWebookmarksFolders, reorderWebookmarks, Webookmarks } from './utils/webookmarks-service'
import { SettingsPage } from './components/settings-page'
import { appInOpenURL } from './utils/app-action'
import scriptConfig from './script.json'
import { EditPage } from './components/edit-page'
import { UpdateSection } from './components/update-section'

/**
 * 主页
 */
const Main = () => {
  const dismiss = Navigation.useDismiss()
  const [folders, setFolders] = useState<Folder[]>([])

  // 加载数据
  const loadData = async () => {
    try {
      const dataF = processWebookmarksFolders()
      setFolders(dataF)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  // 刷新数据和设置
  const refreshData = async () => {
    await loadData()
    Widget.reloadAll()
  }

  // 初始加载
  useEffect(() => {
    loadData()
  }, [])

  // 创建文件夹
  const newFolder = async () => {
    const folder = await Dialog.prompt({
      title: '新文件夹名',
      placeholder: '请输入文件夹名',
      defaultValue: '',
      confirmLabel: '创建',
      cancelLabel: '取消'
    })
    if (folder != null) {
      createWebookmarkFolder(folder)
      HapticFeedback.mediumImpact()
      await refreshData()
    }
  }

  return (
    <NavigationStack>
      <List
        navigationTitle={scriptConfig.name}
        navigationBarTitleDisplayMode="large"
        toolbar={{
          cancellationAction: <Button title="关闭" action={dismiss} />,
          topBarTrailing: [
            <EditButton />,
            <Button title='新文件夹' action={newFolder} />,
          ],
          primaryAction: (
            <Button
              title="设置"
              action={async () => {
                await Navigation.present({
                  element: <SettingsPage />,
                  modalPresentationStyle: 'pageSheet'
                })
                await refreshData()
              }}
            />
          )
        }}
      >

        {folders.map((fItem) => (
          <FolderSection
            key={fItem.id}
            folder={fItem}
            onRefresh={refreshData}
          />
        ))}

        {/* 更新信息区 */}
        <UpdateSection autoCheckUpdate={true} />

      </List>
    </NavigationStack>
  )
}

/**
 * 分类 Section 组件 - 支持拖拽排序
 */
const FolderSection = ({ folder, onRefresh }: { folder: Folder, onRefresh: () => Promise<void> }) => {
  // 使用 useState 管理书签列表
  const [bookmarkList, setBookmarkList] = useState<Webookmarks[]>(() =>
    processWebookmarksByFolderId(folder.id)
  )

  // 重新加载该分类的书签
  const reloadBookmarks = () => {
    setBookmarkList(processWebookmarksByFolderId(folder.id))
  }

  // 处理排序
  const handleMove = (indices: number[], newOffset: number) => {
    reorderWebookmarks(folder.id, indices, newOffset)
    reloadBookmarks()
    onRefresh()
  }

  // 处理删除
  const handleDelete = (indices: number[]) => {
    indices.forEach(index => {
      if (bookmarkList[index]) {
        delWebookmarkById(bookmarkList[index].id)
      }
    })
    reloadBookmarks()
    onRefresh()
  }

  return (
    <Section
      header={<Text font="headline">{folder.name}</Text>}
      footer={<Text>拖拽可排序，左右划动可编辑访问删除</Text>}
    >
      <ForEach
        count={bookmarkList.length}
        itemBuilder={(wIndex: number) => {
          const wItem = bookmarkList[wIndex]
          if (!wItem) return <EmptyView />
          return (
            <HStack
              key={wItem.id}
              frame={{ maxWidth: 'infinity' }}
              alignment='center'
              trailingSwipeActions={{
                allowsFullSwipe: true,
                actions: [
                  <Button
                    title="编辑"
                    tint="accentColor"
                    action={async () => {
                      await Navigation.present({
                        element: <EditPage data={wItem} folderId={null} />,
                        modalPresentationStyle: 'pageSheet'
                      })
                      reloadBookmarks()
                      await onRefresh()
                    }}
                  />,
                  <Button
                    title="删除"
                    role="destructive"
                    action={async () => {
                      delWebookmarkById(wItem.id)
                      reloadBookmarks()
                      await onRefresh()
                    }}
                  />,
                ]
              }}
              leadingSwipeActions={{
                actions: [
                  <Button
                    title="访问"
                    tint="orange"
                    action={() => { Safari.present(wItem.url, false) }}
                  />
                ]
              }}
            >
              <Text
                styledText={{
                  bold: true,
                  foregroundColor: wIndex > 2 ? '#f5c94c' : '#fe4f67',
                  monospaced: true,
                  content: wIndex < 9 ? (wIndex + 1).toString() + ' ' : (wIndex + 1).toString()
                }}
              />
              <Text>{wItem.name}</Text>
              <Spacer />
              <Button
                title="访问 >"
                buttonStyle='bordered'
                action={async () => {
                  // 判断协议，非 http/https 使用 Safari.openURL
                  if (wItem.url.startsWith('http://') || wItem.url.startsWith('https://')) {
                    await Safari.present(wItem.url, false)
                  } else {
                    await Safari.openURL(wItem.url)
                  }
                }}
              />
            </HStack>
          )
        }}
        onMove={handleMove}
        onDelete={handleDelete}
      />
      <Button
        title="添加此文件夹书签"
        frame={{ maxWidth: 'infinity' }}
        action={async () => {
          await Navigation.present({
            element: <EditPage data={null} folderId={folder.id} />,
            modalPresentationStyle: 'pageSheet'
          })
          reloadBookmarks()
          await onRefresh()
        }}
      />
    </Section>
  )
}

/**
 * 主函数
 */
const run = async (): Promise<void> => {
  if (appInOpenURL()) {
    const url = Script.queryParameters.url
    const settings = getCurrentSettings()
    const openInSafariParam = Script.queryParameters.openInSafari
    const fullscreenParam = Script.queryParameters.fullscreen

    const shouldOpenInSafari = openInSafariParam !== undefined
      ? openInSafariParam === 'true'
      : settings.defaultOpenInSafari

    const shouldFullscreen = fullscreenParam !== undefined
      ? fullscreenParam === 'true'
      : settings.defaultFullscreen

    const isHttpUrl = url.startsWith('http://') || url.startsWith('https://')

    if (!isHttpUrl || shouldOpenInSafari) {
      await Safari.openURL(url)
    } else {
      await Safari.present(url, shouldFullscreen)
    }
  } else {
    await Navigation.present({
      element: <Main />,
      modalPresentationStyle: 'pageSheet'
    })
  }
  Script.exit()
}

run()
