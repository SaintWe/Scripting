import { Button, NavigationStack, Text, List, Section, TextField, Toggle, Picker, ColorPicker, useObservable, HStack, useContext, Script, SecureField } from "scripting"
import { headerStyle, settingModelFooter, settingPromptFooter, settingDebugFooter, settingCustomApiFooter, settingCustomApiVisionTip } from "../components/constant"
import { clearHistoryFully, clearHistoryInactive } from "../components/storage"
import { RunContext, updateActivityValue } from "../components/main"
import { getSetting, saveSetting } from "../components/setting"
import { removeDebugStorage } from "../helper/debug"
import { haptic } from "../helper/haptic"

export function SettingView() {
  const isRunWhenStarted = useObservable<boolean>(getSetting("isRunWhenStarted"))
  const runType = useObservable<string>(getSetting("runType"))
  const systemColor = useObservable<any>(getSetting("systemColor"))
  const isModelDefault = useObservable<boolean>(getSetting("isModelDefault"))
  const modelProvider = useObservable<any>(getSetting("modelProvider"))
  const customProviderName = useObservable<string>(getSetting("customProviderName"))
  const modelID = useObservable<string>(getSetting("modelId"))
  const modelCheck = useObservable<boolean>(true)
  const modelPrompt = useObservable<string>(getSetting("modelPrompt"))
  const isDebug = useObservable<boolean>(getSetting("isDebug"))
  const showToast = useObservable<boolean>(false)
  const toastMsg = useObservable<string>("")

  // 自定义 API 配置
  const useCustomApi = useObservable<boolean>(getSetting("useCustomApi"))
  const customApiName = useObservable<string>(getSetting("customApiName"))
  const customApiBaseUrl = useObservable<string>(getSetting("customApiBaseUrl"))
  const customApiKey = useObservable<string>(getSetting("customApiKey"))
  const customApiModelId = useObservable<string>(getSetting("customApiModelId"))
  const customApiPrompt = useObservable<string>(getSetting("customApiPrompt"))
  const customApiCheck = useObservable<boolean>(true)

  // PRO 权限判断
  const hasProAccess = Script.hasFullAccess()

  // activitys: context as history list setter
  const { activitys } = useContext(RunContext)

  const colorOptions = [
    { tag: "systemPink", text: "systemPink" },
    { tag: "systemRed", text: "systemRed" },
    { tag: "systemBlue", text: "systemBlue" },
    { tag: "systemYellow", text: "systemYellow" },
    { tag: "systemOrange", text: "systemOrange" },
    { tag: "systemPurple", text: "systemPurple" },
    { tag: "systemBrown", text: "systemBrown" },
    { tag: "systemCyan", text: "systemCyan" },
    { tag: "systemGreen", text: "systemGreen" },
    { tag: "systemIndigo", text: "systemIndigo" },
    { tag: "systemMint", text: "systemMint" },
    { tag: "systemTeal", text: "systemTeal" },
    { tag: "custom", text: "自定义" },
  ]

  const runTypeOptions = [
    { tag: "latest", text: "最新照片" },
    { tag: "pick", text: "相册挑选" }
  ]

  const modelProviderOptions = [
    { tag: "openai", text: "OpenAI" },
    { tag: "gemini", text: "Google Gemini" },
    { tag: "deepseek", text: "DeepSeek" },
    { tag: "anthropic", text: "Anthropic" },
    { tag: "openrouter", text: "OpenRouter" },
    { tag: "custom", text: "自定义" }
  ]

  function updateIsDebug(value: boolean) {
    saveSetting("isDebug", value)
    isDebug.setValue(value)
    if (value === false) {
      // 清除历史日志
      removeDebugStorage()
    }
  }

  function updateIsRunWhenStarted(value: boolean) {
    saveSetting("isRunWhenStarted", value)
    isRunWhenStarted.setValue(value)
  }

  function updateRunType(value: string) {
    saveSetting("runType", value)
    runType.setValue(value)
    haptic("select")
  }

  function updateSystemColor(value: string) {
    if (value === "custom") value = "rgba(0, 0, 0, 1.00)"
    systemColor.setValue(value)
    saveSetting("systemColor", value)
    haptic("select")
  }

  function updateModelDefault(value: boolean) {
    isModelDefault.setValue(value)
    saveSetting("isModelDefault", value)
  }

  function updateModelProvider(value: string) {
    modelProvider.setValue(value)
    saveSetting("modelProvider", value)
  }

  function updateCustomProviderName(value: string) {
    customProviderName.setValue(value)
    saveSetting("customProviderName", value)
  }

  function updateModelId(value: string) {
    modelID.setValue(value)
    saveSetting("modelId", value)
  }

  async function checkModelAvailable() {
    const schema: JSONSchemaObject = {
      type: "object",
      properties: {
        text: {
          type: "string",
          required: true,
          description: ""
        }
      },
      description: ""
    }
    modelCheck.setValue(false)

    // 构建 options，支持自定义提供商
    let options: { provider: any; modelId?: string } | undefined = undefined
    if (!isModelDefault.value) {
      let provider: any
      if (modelProvider.value === "custom") {
        provider = { custom: customProviderName.value }
      } else {
        provider = modelProvider.value
      }
      options = {
        provider,
        modelId: modelID.value || undefined
      }
    }

    let message = ""
    try {
      const resp = await Assistant.requestStructuredData(
        "请返回「检查成功！」并随机附上一段很美的句子",
        schema,
        options
      ) as Record<string, string>
      message = resp?.text
    }
    catch (e) {
      message = String(e)
    }
    toastMsg.setValue(message)
    showToast.setValue(true)
    modelCheck.setValue(true)
    haptic("select")
  }

  // 自定义 API 配置更新函数
  function updateUseCustomApi(value: boolean) {
    useCustomApi.setValue(value)
    saveSetting("useCustomApi", value)
  }

  function updateCustomApiName(value: string) {
    customApiName.setValue(value)
    saveSetting("customApiName", value)
  }

  function updateCustomApiBaseUrl(value: string) {
    customApiBaseUrl.setValue(value)
    saveSetting("customApiBaseUrl", value)
  }

  function updateCustomApiKey(value: string) {
    customApiKey.setValue(value)
    saveSetting("customApiKey", value)
  }

  function updateCustomApiModelId(value: string) {
    customApiModelId.setValue(value)
    saveSetting("customApiModelId", value)
  }

  async function checkCustomApiAvailable() {
    customApiCheck.setValue(false)

    const baseUrl = customApiBaseUrl.value
    const apiKey = customApiKey.value
    const modelId = customApiModelId.value

    if (!baseUrl || !apiKey || !modelId) {
      toastMsg.setValue("请先填写完整的 API 配置")
      showToast.setValue(true)
      customApiCheck.setValue(true)
      return
    }

    const url = baseUrl.endsWith("/")
      ? `${baseUrl}chat/completions`
      : `${baseUrl}/chat/completions`

    let message = ""
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: "user",
              content: "请返回「连接成功！」"
            }
          ],
          temperature: 0.1,
          max_tokens: 100
        }),
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        const errorText = await response.text()
        message = `请求失败 (${response.status}): ${errorText}`
      } else {
        const result = await response.json() as {
          choices?: Array<{ message?: { content?: string } }>
        }
        const content = result?.choices?.[0]?.message?.content
        message = content || "连接成功！"
      }
    } catch (e) {
      message = `连接失败: ${String(e)}`
    }

    toastMsg.setValue(message)
    showToast.setValue(true)
    customApiCheck.setValue(true)
    haptic("select")
  }

  function updateModelPrompt() {
    const value = modelPrompt.value
    saveSetting("modelPrompt", value)
    toastMsg.setValue("已完成")
    showToast.setValue(true)
    haptic("select")
  }

  function resetModelPrompt() {
    saveSetting("modelPrompt", null)
    const value = getSetting("modelPrompt")
    modelPrompt.setValue(value)
    toastMsg.setValue("已完成")
    showToast.setValue(true)
    haptic("select")
  }

  function updateCustomApiPrompt() {
    const value = customApiPrompt.value
    saveSetting("customApiPrompt", value)
    toastMsg.setValue("已完成")
    showToast.setValue(true)
    haptic("select")
  }

  function resetCustomApiPrompt() {
    saveSetting("customApiPrompt", null)
    const value = getSetting("customApiPrompt")
    customApiPrompt.setValue(value)
    toastMsg.setValue("已完成")
    showToast.setValue(true)
    haptic("select")
  }

  async function clearHistoryLight() {
    await clearHistoryInactive()
    updateActivityValue(activitys)
    toastMsg.setValue("已清除")
    showToast.setValue(true)
    haptic("select")
  }

  async function clearHistoryDeep() {
    await clearHistoryFully()
    updateActivityValue(activitys)
    toastMsg.setValue("已清除")
    showToast.setValue(true)
    haptic("select")
  }

  return <NavigationStack
    toast={{
      isPresented: showToast,
      message: toastMsg.value,
      position: "center",
    }}
  >
    <List
      navigationTitle={"Settings"}
      navigationBarTitleDisplayMode={"inline"}
      scrollDismissesKeyboard={"immediately"}
    >
      <Section
        header={
          <Text
            font={headerStyle.font}
            fontWeight={headerStyle.fontWeight}
            foregroundStyle={headerStyle.foregroundStyle}
          >
            {"通用配置"}
          </Text>
        }
      >
        <Toggle
          value={isRunWhenStarted.value}
          onChanged={updateIsRunWhenStarted}
          title={"启动后立即执行"}
          tint={systemColor.value}
        />
        {isRunWhenStarted.value && (
          <Picker
            value={runType.value}
            onChanged={updateRunType}
            pickerStyle={"menu"}
            title={"默认执行方式"}
            tint={systemColor.value}
          >
            {runTypeOptions.map(type => (
              <Text tag={type.tag}>
                {type.text}
              </Text>
            ))}
          </Picker>)}
        <Picker
          value={systemColor.value}
          onChanged={updateSystemColor}
          pickerStyle={"menu"}
          title={"主题色"}
          tint={systemColor.value}
        >
          {colorOptions.map(color => (
            <Text tag={color.tag}>
              {color.text}
            </Text>
          ))}
        </Picker>
        {systemColor.value.includes("rgb") && (
          <ColorPicker
            title="自定义"
            value={systemColor.value}
            onChanged={updateSystemColor}
            supportsOpacity={false}
          />
        )}
      </Section>
      <Section
        header={
          <Text
            font={headerStyle.font}
            fontWeight={headerStyle.fontWeight}
            foregroundStyle={headerStyle.foregroundStyle}
          >
            {"API 模式"}
          </Text>
        }
        footer={
          <Text>
            {useCustomApi.value ? settingCustomApiFooter : (hasProAccess ? settingModelFooter : "您没有 PRO 权限，请使用自定义 API 模式")}
          </Text>
        }
      >
        <Toggle
          value={useCustomApi.value}
          onChanged={updateUseCustomApi}
          title={"使用自定义 API（免 PRO）"}
          tint={systemColor.value}
        />
        {useCustomApi.value && (
          <Text foregroundStyle={"systemOrange"}>
            {settingCustomApiVisionTip}
          </Text>
        )}
      </Section>
      {useCustomApi.value && (
        <Section
          header={
            <Text
              font={headerStyle.font}
              fontWeight={headerStyle.fontWeight}
              foregroundStyle={headerStyle.foregroundStyle}
            >
              {"自定义 API 配置"}
            </Text>
          }
        >
          <HStack>
            <Text>{"名称"}</Text>
            <TextField
              multilineTextAlignment={"trailing"}
              title={"配置名称（可选）"}
              value={customApiName.value}
              onChanged={updateCustomApiName}
            />
          </HStack>
          <HStack>
            <Text>{"API 地址"}</Text>
            <TextField
              multilineTextAlignment={"trailing"}
              title={"如 https://api.openai.com/v1"}
              value={customApiBaseUrl.value}
              onChanged={updateCustomApiBaseUrl}
              keyboardType={"URL"}
            />
          </HStack>
          <HStack>
            <Text>{"API Key"}</Text>
            <SecureField
              multilineTextAlignment={"trailing"}
              title={"sk-..."}
              value={customApiKey.value}
              onChanged={updateCustomApiKey}
            />
          </HStack>
          <HStack>
            <Text>{"模型 ID"}</Text>
            <TextField
              multilineTextAlignment={"trailing"}
              title={"如 gpt-4o"}
              value={customApiModelId.value}
              onChanged={updateCustomApiModelId}
            />
          </HStack>
          <Button
            title={"测试连接"}
            tint={systemColor.value}
            disabled={!customApiCheck.value}
            action={checkCustomApiAvailable}
          />
        </Section>
      )}
      {!useCustomApi.value && hasProAccess && (
        <Section
          header={
            <Text
              font={headerStyle.font}
              fontWeight={headerStyle.fontWeight}
              foregroundStyle={headerStyle.foregroundStyle}
            >
              {"PRO 模型配置"}
            </Text>
          }
        >
          <Toggle
            value={isModelDefault.value}
            onChanged={updateModelDefault}
            title={"使用 App 默认设置"}
            tint={systemColor.value}
          />
          {!isModelDefault.value && (
            <Picker
              value={modelProvider.value}
              onChanged={updateModelProvider}
              pickerStyle={"menu"}
              title={"提供商"}
              tint={systemColor.value}
            >
              {modelProviderOptions.map(opt => (
                <Text tag={opt.tag}>
                  {opt.text}
                </Text>
              ))}
            </Picker>
          )}
          {!isModelDefault.value && modelProvider.value === "custom" && (
            <HStack>
              <Text>{"提供商名称"}</Text>
              <TextField
                multilineTextAlignment={"trailing"}
                title={"在 App 设置中配置的名称"}
                value={customProviderName.value}
                onChanged={updateCustomProviderName}
              />
            </HStack>
          )}
          {!isModelDefault.value && (
            <HStack>
              <Text>{"模型"}</Text>
              <TextField
                multilineTextAlignment={"trailing"}
                title={"如 gemini-2.0-flash"}
                value={modelID.value}
                onChanged={updateModelId}
              />
            </HStack>
          )}
          <Button
            title={"检查模型可用性"}
            tint={systemColor.value}
            disabled={!modelCheck.value}
            action={checkModelAvailable}
          />
        </Section>
      )}
      {useCustomApi.value ? (
        <Section
          header={
            <Text
              font={headerStyle.font}
              fontWeight={headerStyle.fontWeight}
              foregroundStyle={headerStyle.foregroundStyle}
            >
              {"自定义 API 提示词"}
            </Text>
          }
          footer={
            <Text>
              {settingPromptFooter}
            </Text>
          }
        >
          <TextField
            title={"Prompt"}
            value={customApiPrompt.value}
            onChanged={val => { customApiPrompt.setValue(val) }}
            axis={"vertical"}
            lineLimit={{ min: 8, max: 50 }}
          />
          <Button
            title={"确认修改"}
            tint={systemColor.value}
            action={updateCustomApiPrompt}
          />
          <Button
            title={"恢复默认"}
            tint={systemColor.value}
            action={resetCustomApiPrompt}
          />
        </Section>
      ) : (
        <Section
          header={
            <Text
              font={headerStyle.font}
              fontWeight={headerStyle.fontWeight}
              foregroundStyle={headerStyle.foregroundStyle}
            >
              {"PRO 模式提示词"}
            </Text>
          }
          footer={
            <Text>
              {settingPromptFooter}
            </Text>
          }
        >
          <TextField
            title={"Prompt"}
            value={modelPrompt.value}
            onChanged={val => { modelPrompt.setValue(val) }}
            axis={"vertical"}
            lineLimit={{ min: 8, max: 50 }}
          />
          <Button
            title={"确认修改"}
            tint={systemColor.value}
            action={updateModelPrompt}
          />
          <Button
            title={"恢复默认"}
            tint={systemColor.value}
            action={resetModelPrompt}
          />
        </Section>
      )}
      <Section
        header={
          <Text
            font={headerStyle.font}
            fontWeight={headerStyle.fontWeight}
            foregroundStyle={headerStyle.foregroundStyle}
          >
            {"调试"}
          </Text>
        }
        footer={
          <Text>
            {settingDebugFooter}
          </Text>
        }
      >
        <Toggle
          value={isDebug.value}
          onChanged={updateIsDebug}
          title={"开启 Debug"}
          tint={systemColor.value}
        />
        <Button
          title={"清除不活跃缓存"}
          tint={systemColor.value}
          action={clearHistoryLight}
        />
        <Button
          title={"清除所有历史缓存"}
          tint={systemColor.value}
          action={clearHistoryDeep}
        />
      </Section>
    </List>
  </NavigationStack>
}