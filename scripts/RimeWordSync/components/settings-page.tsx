import { Button, List, Navigation, NavigationStack, Section, Text, TextField, HStack, Toggle } from 'scripting'
import { useState } from 'scripting'
import { getCurrentSettings, saveSettings } from '../utils/wordEditor-service'

/**
 * 设置页面组件
 */
export const SettingsPage = () => {
  const dismiss = Navigation.useDismiss()
  const [currentSettings, setCurrentSettings] = useState(() => getCurrentSettings())

  // 更新设置的通用函数
  const updateSettings = (newSettings: any) => {
    setCurrentSettings(newSettings)
    const success = saveSettings(newSettings)
    if (!success) {
      console.error('保存设置失败')
    }
  }

  const [iCloudPathBookmark, setiCloudPathBookmark] = useState(currentSettings.iCloudPathBookmark ?? '')
  const [saveAfterDeploy, setSaveAfterDeploy] = useState(currentSettings.saveAfterDeploy ?? false)
  const [deployURL, setDeployURL] = useState(currentSettings.deployURL ?? '')
  const [defaultOpenEditor, setDefaultOpenEditor] = useState(currentSettings.defaultOpenEditor ?? false)

  const handleiCloudPathBookmarkChange = (value: string) => {
    setiCloudPathBookmark(value)
    updateSettings({ ...currentSettings, iCloudPathBookmark: value })
  }

  const handleSaveAfterDeployChange = (value: boolean) => {
    setSaveAfterDeploy(value)
    updateSettings({ ...currentSettings, saveAfterDeploy: value })
  }

  const handleDeployURLChange = (value: string) => {
    setDeployURL(value)
    updateSettings({ ...currentSettings, deployURL: value })
  }

  const handleDefaultOpenEditorChange = (value: boolean) => {
    setDefaultOpenEditor(value)
    updateSettings({ ...currentSettings, defaultOpenEditor: value })
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

        <Section
          header={<Text font="headline">运行脚本自动打开编辑器</Text>}
        >
          <Toggle title="运行脚本自动打开编辑器" value={defaultOpenEditor} onChanged={handleDefaultOpenEditorChange} />
        </Section>

        <Section
          header={<Text font="headline">iCloud书签名</Text>}
          footer={
            <Text font="footnote" foregroundStyle="secondaryLabel">
              在应用内『工具 -〉文件书签 -〉添加文件』{"\n"}
              书签名填写在这里，默认打开此文件
            </Text>
          }
        >
          <HStack>
            <TextField
              key={'path'}
              title="iCloud路径书签名"
              value={iCloudPathBookmark}
              onChanged={(value) => handleiCloudPathBookmarkChange(value)}
              prompt="请输入iCloud路径书签名"
              axis="vertical"
              lineLimit={1}
            />
          </HStack>
        </Section>

        <Section
          header={<Text font="headline">保存后执行部署</Text>}
        >
          <Toggle title="保存后执行部署" value={saveAfterDeploy} onChanged={handleSaveAfterDeployChange} />
          <HStack>
            <TextField
              key={'deploy'}
              title="部署 URL"
              value={deployURL}
              onChanged={(value) => handleDeployURLChange(value)}
              prompt="请输入部署 URL"
              axis="vertical"
              lineLimit={{ min: 1, max: 4 }}
            />
          </HStack>
        </Section>

      </List>
    </NavigationStack>
  )
}
