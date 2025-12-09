import { getSetting } from "../components/setting"

const schema: JSONSchemaObject = {
  type: "object",
  properties: {
    code: {
      type: "string",
      required: true,
      description: "取餐码、取件码"
    },
    seller: {
      type: "string",
      required: false,
      description: "商家名称、商店名称、门店名称、服务商"
    },
    items: {
      type: "array",
      items: {
        type: "string",
        description: "商品名称、产品名称、快递地址"
      },
      required: false,
      description: "商品名称、产品名称、快递地址"
    }
  },
  description: ""
}

function validateAssistantResp(
  data: Record<string, any>
) {
  if (typeof data !== "object" || data == null) {
    throw Error(`validateAssistantResp: Invalid value type, ${typeof data}`)
  }

  for (const [sk, sv] of Object.entries(schema.properties)) {
    const val = data[sk]
    if (sv.required && (val == null || val === "")) {
      throw Error(`validateAssistantResp: Missing required value, ${JSON.stringify(data)}`)
    }
  }
}

/**
 * 自定义 API 请求，兼容 OpenAI API 格式
 */
async function requestCustomApi(input: string | UIImage): Promise<Record<string, any>> {
  const baseUrl = getSetting("customApiBaseUrl") as string
  const apiKey = getSetting("customApiKey") as string
  const modelId = getSetting("customApiModelId") as string
  const systemPrompt = getSetting("customApiPrompt") as string

  if (!baseUrl || !apiKey || !modelId) {
    throw Error("自定义 API 配置不完整，请在设置中填写 API 地址、Key 和模型 ID")
  }

  // 构建请求 URL
  const url = baseUrl.endsWith("/")
    ? `${baseUrl}chat/completions`
    : `${baseUrl}/chat/completions`

  // 构建消息内容
  // system: 完整的系统提示词
  // user: 实际内容（文本或图片）
  let messages: any[]

  if (typeof input === "string") {
    // 纯文本输入
    messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: input
      }
    ]
  } else {
    // 图片输入（使用 OpenAI Vision API 格式）
    const base64Data = input.toJPEGBase64String(0.5)
    messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Data}`
            }
          }
        ]
      }
    ]
  }

  // 发送请求
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.1,
      max_tokens: 1024
    }),
    signal: AbortSignal.timeout(60000)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw Error(`API 请求失败 (${response.status}): ${errorText}`)
  }

  const result = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }

  // 解析响应
  const content = result?.choices?.[0]?.message?.content
  if (!content) {
    throw Error("API 响应格式错误：无法获取内容")
  }

  // 尝试解析 JSON
  try {
    // 移除可能的 markdown 代码块标记
    let jsonStr = content.trim()
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7)
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3)
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3)
    }
    jsonStr = jsonStr.trim()

    return JSON.parse(jsonStr)
  } catch (e) {
    throw Error(`API 响应解析失败，无法解析为 JSON: ${content}`)
  }
}

export async function requestAssistant(input: string | UIImage) {
  let data: Record<string, any>
  const prompt = getSetting("modelPrompt")
  const useCustomApi = getSetting("useCustomApi") as boolean

  // 判断是否使用自定义 API
  if (useCustomApi) {
    data = await requestCustomApi(input)
    validateAssistantResp(data)
    return data
  }

  // 使用 PRO 功能的 Assistant 接口
  // 构建 options
  let options: { provider: any; modelId?: string } | undefined = undefined
  if (getSetting("isModelDefault") === false) {
    const providerType = getSetting("modelProvider")
    let provider: any

    if (providerType === "custom") {
      // 自定义提供商使用 {custom: "名称"} 格式
      const customName = getSetting("customProviderName")
      provider = { custom: customName }
    } else {
      // 内置提供商直接使用字符串
      provider = providerType
    }

    options = {
      provider,
      modelId: getSetting("modelId") || undefined
    }
  }

  if (typeof input === "string") {
    data = await Assistant.requestStructuredData(
      `${prompt}\n${input}`,
      schema,
      options
    )
  } else {
    const base64Data = input.toJPEGBase64String(0.5)
    const base64Image = `data:image/jpeg;base64,${base64Data}`
    data = await Assistant.requestStructuredData(
      prompt,
      [base64Image],
      schema,
      options
    )
  }
  validateAssistantResp(data)
  return data
}