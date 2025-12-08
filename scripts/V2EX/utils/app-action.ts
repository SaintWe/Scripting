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

export const genOpenCurrentScriptURL = (url: string) => {
    return genOpenCurrentScriptAction(
        'open-url',
        {
            url: url,
        }
    )
}

export const appInOpenURL = () => {
    return Script.queryParameters.action !== undefined && Script.queryParameters.action === 'open-url' && Script.queryParameters.url !== undefined
}

