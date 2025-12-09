/**
 * SF Symbol Picker 组件
 * 可复用的 SF Symbol 图标选择器，支持分类浏览和搜索
 * 
 * 使用方式：
 * ```tsx
 * import { SFSymbolPicker } from "./sf-symbol-picker"
 * 
 * // 在需要选择图标时调用
 * await Navigation.present({
 *   element: <SFSymbolPicker onSelect={(name) => { console.log(name) }} />
 * })
 * ```
 */

import {
    Button,
    Navigation,
    NavigationStack,
    NavigationLink,
    List,
    Section,
    HStack,
    Image,
    Text,
    Spacer,
    useObservable,
} from "scripting"
import { sf_symbol } from "./const"

// ============ 类型定义 ============

export interface SFSymbolPickerProps {
    /** 选择图标后的回调 */
    onSelect: (symbolName: string) => void
    /** 取消选择的回调 */
    onCancel?: () => void
    /** 导航栏标题 */
    title?: string
}

// ============ 主组件 ============

/**
 * SF Symbol 选择器主组件
 */
export function SFSymbolPicker({
    onSelect,
    onCancel,
    title = "选择图标",
}: SFSymbolPickerProps) {
    const dismiss = Navigation.useDismiss()

    function handleCancel() {
        if (onCancel) {
            onCancel()
        }
        dismiss()
    }

    function handleSelect(symbolName: string) {
        onSelect(symbolName)
        dismiss()
    }

    return (
        <NavigationStack>
            <CategoryListView
                navigationTitle={title}
                toolbar={{
                    topBarLeading: [
                        <Button title={"取消"} action={handleCancel} />,
                    ],
                }}
                onSelect={handleSelect}
            />
        </NavigationStack>
    )
}

// ============ 分类列表视图 ============

interface CategoryListViewProps {
    onSelect: (symbolName: string) => void
}

function CategoryListView({ onSelect }: CategoryListViewProps) {
    return (
        <List>
            {sf_symbol.map(({ label, icon, content }) => (
                <NavigationLink
                    key={label}
                    destination={
                        <SymbolListView
                            navigationTitle={label}
                            navigationBarTitleDisplayMode={"inline"}
                            symbols={content}
                            onSelect={onSelect}
                        />
                    }
                >
                    <HStack>
                        <Image
                            systemName={icon}
                            frame={{ width: 24 }}
                            foregroundStyle={"accentColor"}
                        />
                        <Text>{label}</Text>
                        <Spacer />
                        <Text foregroundStyle={"secondaryLabel"}>{content.length}</Text>
                    </HStack>
                </NavigationLink>
            ))}
        </List>
    )
}

// ============ 图标列表视图 ============

interface SymbolListViewProps {
    symbols: string[]
    onSelect: (symbolName: string) => void
}

function SymbolListView({ symbols, onSelect }: SymbolListViewProps) {
    const presented = useObservable<boolean>(false)
    const searchText = useObservable<string>("")
    const appearCount = useObservable<number>(50)

    // 过滤图标列表
    const filteredList =
        searchText.value === ""
            ? symbols
            : symbols.filter((s) => s.includes(searchText.value.toLowerCase()))

    // 当前显示的图标（懒加载）
    const displayList = filteredList.slice(
        0,
        Math.min(appearCount.value, filteredList.length)
    )

    return (
        <List
            searchable={{
                value: searchText,
                presented: presented,
            }}
        >
            <Section
                title={presented.value ? `搜索结果 (${filteredList.length})` : `全部 (${filteredList.length})`}
            >
                {displayList.map((symbol, idx) => (
                    <SymbolRow
                        key={symbol}
                        symbol={symbol}
                        onSelect={onSelect}
                        onAppear={
                            idx === appearCount.value - 10
                                ? () => {
                                    appearCount.setValue(appearCount.value + 50)
                                }
                                : undefined
                        }
                    />
                ))}
            </Section>
        </List>
    )
}

// ============ 图标行组件 ============

interface SymbolRowProps {
    symbol: string
    onSelect: (symbolName: string) => void
    onAppear?: () => void
}

function SymbolRow({ symbol, onSelect, onAppear }: SymbolRowProps) {
    return (
        <Button
            action={() => onSelect(symbol)}
            onAppear={onAppear}
        >
            <HStack>
                <Image
                    systemName={symbol}
                    scaleToFit
                    imageScale={'large'}
                    frame={{ width: 40, height: 40 }}
                    symbolRenderingMode={"hierarchical"}
                    foregroundStyle={"accentColor"}
                />
                <Text foregroundStyle={"label"}>{symbol}</Text>
            </HStack>
        </Button>
    )
}
