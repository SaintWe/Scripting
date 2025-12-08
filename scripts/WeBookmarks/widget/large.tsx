import {
    Color,
    HStack,
    Image,
    Link,
    RoundedRectangle,
    Spacer,
    Text,
    VStack,
} from "scripting"
import { getBookmarksByFolderIdOrDefault, Webookmarks } from "../utils/webookmarks-service"
import { genOpenCurrentScriptURL } from "../utils/app-action"

interface ViewProps {
    folderId?: string
}

export function View({ folderId }: ViewProps) {
    const allBookmarks = getBookmarksByFolderIdOrDefault(folderId)
    const items: (Webookmarks | null)[] = [...allBookmarks.slice(0, 8)]
    while (items.length < 8) items.push(null)
    return (
        <VStack padding={8}>
            <HStack>
                <ItemView item={items[0]} />
                <ItemView item={items[1]} />
            </HStack>
            <HStack>
                <ItemView item={items[2]} />
                <ItemView item={items[3]} />
            </HStack>
            <HStack>
                <ItemView item={items[4]} />
                <ItemView item={items[5]} />
            </HStack>
            <HStack>
                <ItemView item={items[6]} />
                <ItemView item={items[7]} />
            </HStack>
        </VStack>
    )
}

function ItemView({ item }: { item: Webookmarks | null }) {
    if (!item)
        return <RoundedRectangle cornerRadius={21} fill={"quaternarySystemFill"} />

    const url = genOpenCurrentScriptURL(item.url, item.openInSafari, item.fullscreen)
    const cardColor: Color = item.color || "systemBlue"
    const iconName = item.icon || "bookmark.fill"

    return (
        <Link url={url} buttonStyle={"plain"}>
            <RoundedRectangle
                fill={{
                    color: cardColor,
                    gradient: true,
                }}
                cornerRadius={21}
                overlay={
                    <VStack padding={11} alignment={"leading"}>
                        <HStack>
                            <Image systemName={iconName} fontWeight={"semibold"} />
                            <Spacer />
                        </HStack>
                        <Spacer />
                        <Text
                            font={"footnote"}
                            fontWeight={"medium"}
                            padding={{ bottom: -1 }}
                            lineLimit={1}
                        >
                            {item.name}
                        </Text>
                    </VStack>
                }
            />
        </Link>
    )
}
