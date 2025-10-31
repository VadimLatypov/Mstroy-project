import type { TreeItem } from '../types/index';
import type { TreeStore } from '../tree-store';

// Интерфейс для элемента с путем (для AgGrid Tree Data)
export interface TreeDataItem extends TreeItem {
    path: (number | string)[];
    rowNumber?: number;
    category?: string;
}

// конвертация данных из TreeStore в формат для AgGrid Tree Data
export function convertToTreeData(tree_store: TreeStore): TreeDataItem[] {
    const allItems = tree_store.getAll();
    const result: TreeDataItem[] = [];

    // Кэш для путей
    const pathCache = new Map<number | string, (number | string)[]>();

    // Путь от корня до элемента
    const buildPath = (item: TreeItem): (number | string)[] => {
        if (pathCache.has(item.id)) {
            return pathCache.get(item.id)!;
        }

        if (item.parent === null) {
            const path = [item.id];
            pathCache.set(item.id, path);
            return path;
        }

        const parents = tree_store.getAllParents(item.id);
        
        const path_from_root: (number | string)[] = [];
        for (let i = parents.length - 1; i >= 0; i--) {
            path_from_root.push(parents[i].id);
        }

        pathCache.set(item.id, path_from_root);
        return path_from_root;
    };

    for (const item of allItems) {
        const path = buildPath(item);
        
        const children = tree_store.getChildren(item.id);
        const category = children.length > 0 ? 'Группа' : 'Элемент';

        result.push({
            ...item,
            path,
            category
        });
    }

    return result;
}