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

export async function requestAssistant(input: string | UIImage) {
  let data: Record<string, any>
  const prompt = getSetting("modelPrompt")

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