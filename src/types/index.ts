// Интерфейс для элемента дерева
export interface TreeItem {
    id: number | string;
    parent: number | string | null;
    [key: string]: any;
}

