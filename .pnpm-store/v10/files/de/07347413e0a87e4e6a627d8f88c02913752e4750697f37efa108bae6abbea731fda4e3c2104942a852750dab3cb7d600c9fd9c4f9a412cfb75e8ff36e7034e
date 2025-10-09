type HighlightColors = {
    foreground?: string;
    background?: string;
};
type ToolbarColors = {
    border?: string;
} & HighlightColors;
type IconColors = {
    expanded?: string;
    collapsed?: string;
    expandAll?: string;
};
type DataTypeColors = {
    array?: string;
    object?: string;
    boolean?: string;
    date?: string;
    float?: string;
    function?: string;
    integer?: string;
    string?: string;
    nan?: string;
    null?: string;
    undefined?: string;
    regexp?: string;
    background?: string;
};
interface Expandable {
    expanded: boolean;
}
type OnExapandFunc = (value: boolean) => void;
type OnSearchFunc = (value: string | null) => void;
export interface ExpandIconProps extends Expandable {
}
export interface ExpandControlType extends Expandable {
    timestamp: number;
}
export type TypeValueLabelType = "array" | "object" | "boolean" | "date" | "float" | "function" | "integer" | "string" | "nan" | "null" | "undefined" | "regexp" | "background";
export interface ThemeColors {
    background?: string;
    ellipsis?: string;
    brace?: string;
    key?: string;
    index?: string;
    size?: string;
    border?: string;
    highlight: HighlightColors;
    toolbar: ToolbarColors;
    icon: IconColors;
    dataType: DataTypeColors;
}
export interface ThemeContextType {
    colors: ThemeColors;
    searchTerm?: string | null;
    truncate?: number | boolean;
    onExpandAll?: OnExapandFunc;
    onSearch?: OnSearchFunc;
    expanded: number | boolean;
    indentWidth: number;
    expandAll?: ExpandControlType | null;
}
export {};
//# sourceMappingURL=JsonViewer.types.d.ts.map