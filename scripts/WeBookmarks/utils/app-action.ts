import { Script } from "scripting"

export const genActionURL = (scriptName: string, action: string, date: any) => {
    return Script.createRunURLScheme(
        scriptName,
        {
            action: action,
            ...date
        }
    )
}

export const genOpenCurrentScriptAction = (action: string, date: any) => {
    return genActionURL(Script.name, action, date)
}

/**
 * 生成打开 URL 的 action URL
 * @param url 要打开的 URL
 * @param openInSafari 是否用 Safari 打开: true=Safari, false=app内, undefined=跟随默认
 * @param fullscreen 是否全屏显示: true=全屏, false=非全屏, undefined=跟随默认
 */
export const genOpenCurrentScriptURL = (url: string, openInSafari?: boolean, fullscreen?: boolean) => {
    return genOpenCurrentScriptAction(
        'open-url',
        {
            url: url,
            openInSafari: openInSafari !== undefined ? (openInSafari ? 'true' : 'false') : undefined,
            fullscreen: fullscreen !== undefined ? (fullscreen ? 'true' : 'false') : undefined
        }
    )
}

export const appInOpenURL = () => {
    return Script.queryParameters.action !== undefined && Script.queryParameters.action === 'open-url' && Script.queryParameters.url !== undefined
}

