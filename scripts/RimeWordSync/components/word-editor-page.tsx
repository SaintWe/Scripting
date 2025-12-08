import { Button, List, Navigation, NavigationStack, Section, Text, TextField, HStack, Spacer, LazyVStack, ScrollView } from 'scripting'
import { useState } from 'scripting'
import { getCurrentSettings } from '../utils/wordEditor-service'

/**
 * 设置页面组件
 */
export const WordEditorPage = ({ PATH_CLOUD, CONTENT_CLOUD }: { PATH_CLOUD?: string, CONTENT_CLOUD: string }) => {
  const dismiss = Navigation.useDismiss()

  const [currentContent, setCurrentContent] = useState<string[]>(CONTENT_CLOUD.split('\n').reverse())
  const [settings] = useState(getCurrentSettings())
  const [saveAfterDeploy] = useState(settings.saveAfterDeploy)
  const [deployURL] = useState(settings.deployURL)
  const [defaultOpenEditor] = useState(settings.defaultOpenEditor)

  const handleAddContent = () => {
    setCurrentContent(["\t\t1", ...currentContent])
  }

  const handleAddComment = () => {
    setCurrentContent(["", ...currentContent])
  }

  const handleChangeContent = (index: number, tabIndex: number, value: string) => {
    const newContent = [...currentContent]
    const splitText = newContent[index].split('\t')
    splitText[tabIndex] = value
    newContent[index] = splitText.join('\t')
    setCurrentContent(newContent)
  }

  const handleChangeComment = (index: number, value: string) => {
    const newContent = [...currentContent]
    newContent[index] = value
    setCurrentContent(newContent)
  }

  const handleDeleteContent = (index: number) => {
    const newContent = [...currentContent]
    newContent.splice(index, 1)
    setCurrentContent(newContent)
  }

  const handleSaveFile = async () => {
    const content = currentContent.reverse().join('\n')
    if (PATH_CLOUD && await FileManager.isFile(PATH_CLOUD)) {
      await FileManager.writeAsString(PATH_CLOUD, content, 'utf-8')
    }
    if (saveAfterDeploy) {
      if (deployURL) {
        Safari.openURL(deployURL)
      }
    }
    dismiss()
  }

  return (
    <NavigationStack>
      <List
        navigationTitle="编辑词库内容"
        navigationBarTitleDisplayMode="large"
        toolbar={{
          cancellationAction: <Button title="返回" action={dismiss} />
        }}
      >
        {PATH_CLOUD ? (
          <Section>
            <Button
              title="保存文件"
              systemImage="square.and.arrow.down"
              action={handleSaveFile}
            />
          </Section>
        ) : null}

        <Section>
          <Button
            title="添加词库"
            systemImage="plus"
            action={handleAddContent}
          />
        </Section>
        <Section>
          <Button
            title="添加注释"
            systemImage="plus"
            action={handleAddComment}
          />
        </Section>

        <Section
          header={
            <Text font="headline">
              一行一个，点击按钮添加行，左滑可删除{"\n"}
              词库为反向排序
            </Text>
          }
        >
          <ScrollView axes="vertical">
            <LazyVStack spacing={8}>
              {currentContent.map((value, index) => {
                // 判断当前行是否存在两个TAB
                const splitText = value.split('\t')
                const tabCount = splitText.length
                if (tabCount === 3) {
                  return (
                    <HStack
                      trailingSwipeActions={{
                        allowsFullSwipe: true,
                        actions: [
                          <Button
                            title="删除"
                            role="destructive"
                            action={() => handleDeleteContent(index)}
                          />,
                        ]
                      }}
                    >
                      <TextField
                        key={`${index}0`}
                        title="词语"
                        value={splitText[0]}
                        onChanged={(v) => handleChangeContent(index, 0, v)}
                        prompt="请输入词语"
                        axis="vertical"
                        lineLimit={{ min: 1, max: 4 }}
                      />
                      <Spacer />
                      <TextField
                        key={`${index}1`}
                        title="短语"
                        value={splitText[1]}
                        onChanged={(v) => handleChangeContent(index, 1, v)}
                        prompt="请输入短语"
                        axis="vertical"
                        lineLimit={{ min: 1, max: 4 }}
                      />
                      <Spacer />
                      <TextField
                        key={`${index}2`}
                        title="优先级"
                        value={splitText[2]}
                        onChanged={(v) => handleChangeContent(index, 2, v)}
                        prompt="请输入优先级"
                        axis="vertical"
                        lineLimit={{ min: 1, max: 4 }}
                      />
                    </HStack>
                  )
                } else {
                  return (
                    <HStack
                      trailingSwipeActions={{
                        allowsFullSwipe: true,
                        actions: [
                          <Button
                            title="删除"
                            role="destructive"
                            action={() => handleDeleteContent(index)}
                          />,
                        ]
                      }}
                    >
                      <TextField
                        key={index}
                        title="备注/注释"
                        value={value}
                        onChanged={(value) => handleChangeComment(index, value)}
                        prompt="请输入备注/注释"
                        axis="vertical"
                        lineLimit={{ min: 1, max: 4 }}
                      />
                    </HStack>
                  )
                }
              })}
            </LazyVStack>
          </ScrollView>
        </Section>

      </List>
    </NavigationStack >
  )
}
