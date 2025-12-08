import { Button, List, Navigation, NavigationStack, Section, Text, TextField, HStack } from 'scripting'
import { useState } from 'scripting'
import { getCurrentSettings, saveSettings } from '../utils/skinPacker-service'

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

  const [pathRegex, setPathRegex] = useState(currentSettings.pathRegex ?? [''])

  const handlePathRegexChange = (value: string, index: number) => {
    const newPathRegex = [...pathRegex.slice(0, index), value, ...pathRegex.slice(index + 1)]
    setPathRegex(newPathRegex)
    // 删除空字符串的
    const filteredPathRegex = newPathRegex.filter((regex) => regex.trim() !== '')
    updateSettings({ ...currentSettings, pathRegex: filteredPathRegex })
  }

  const handleAddPathRegex = () => {
    setPathRegex([...pathRegex, ''])
  }

  const handleDeletePathRegex = (index: number) => {
    const newPathRegex = [...pathRegex.slice(0, index), ...pathRegex.slice(index + 1)]
    setPathRegex(newPathRegex)
    updateSettings({ ...currentSettings, pathRegex: newPathRegex })
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
          header={<Text font="headline">过滤文件</Text>}
          footer={
            <Text font="footnote" foregroundStyle="secondaryLabel">
              一行一个，正则表达式，匹配的文件不会被打包{'\n'}
              点击按钮添加行，左滑可删除{'\n'}{'\n'}
              示例：{'\n'}
              • 匹配 .DS_Store 文件：{String.raw`.*\.DS_Store$`}{'\n'}
              • 匹配 .yaml 文件：{String.raw`.*\.yaml$`}{'\n'}
              注意：反斜杠 \ 用于转义特殊字符
            </Text>
          }
        >
          {pathRegex.map((value, index) => {
            return (
              <HStack
                trailingSwipeActions={{
                  allowsFullSwipe: true,
                  actions: [
                    <Button
                      title="删除"
                      role="destructive"
                      action={() => { handleDeletePathRegex(index) }}
                    />,
                  ]
                }}
              >
                <TextField
                  key={index}
                  title="正则"
                  value={value}
                  onChanged={(value) => handlePathRegexChange(value, index)}
                  prompt="请输入正则"
                  axis="vertical"
                  lineLimit={{ min: 1, max: 4 }}
                />
              </HStack>
            )
          })}

          <Button
            title="添加"
            systemImage="plus"
            action={handleAddPathRegex}
          />
        </Section>

      </List>
    </NavigationStack>
  )
}
