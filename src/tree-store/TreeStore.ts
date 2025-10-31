import type { TreeItem } from '../types/index';

export class TreeStore {
    private items: TreeItem[];
    private items_map: Map<number | string, TreeItem>;
    private children_map: Map<number | string | null, TreeItem[]>;

    constructor(items: TreeItem[]) {
        this.items = [...items];
        this.items_map = new Map();
        this.children_map = new Map();

        this._buildIndexes();
    }

    // Построение индексов для быстрого поиска
    private _buildIndexes(): void {
        this.items_map.clear();
        this.children_map.clear();

        for (const item of this.items) {
            this.items_map.set(item.id, item);

            const parent_id = item.parent;

            if (!this.children_map.has(parent_id)) {
                this.children_map.set(parent_id, []);
            }

            const children = this.children_map.get(parent_id);

            if (children) {
                children.push(item);
            }
        }
    }

    getAll(): TreeItem[] {
        return [...this.items];
    }

    getItem(id: number | string): TreeItem | undefined {
        return this.items_map.get(id);
    }

    getChildren(parent_id: number | string): TreeItem[] {
        const children = this.children_map.get(parent_id);

        return children ? [...children] : [];
    }

    getAllChildren(id: number | string): TreeItem[] {
        const res: TreeItem[] = [];

        // рекурсия для сбора всех дочерних элементов
        const collectChildren = (parent_id: number | string): void => {
            const children = this.children_map.get(parent_id);

            if (children && children.length > 0) {
                for (const child of children) {
                    res.push(child);

                    collectChildren(child.id);
                }
            }
        };

        collectChildren(id);
        return res;
    }

    getAllParents(id: number | string): TreeItem[] {
        const res: TreeItem[] = [];

        let current_item = this.items_map.get(id);

        if (!current_item) {
            return res;
        }

        res.push(current_item);

        while (current_item.parent !== null) {
            const parent_id = current_item.parent;
            const parent = this.items_map.get(parent_id);

            if (!parent) {
                break;
            }

            res.push(parent);
            current_item = parent;
        }

        return res;
    }

    addItem(item: TreeItem): void {
        if (this.items_map.has(item.id)) {
            throw new Error(`Элемент с id ${item.id} уже существует`);
        }

        if (item.parent !== null) {
            if (!this.items_map.has(item.parent)) {
                throw new Error(`Родительский элемент с id ${item.parent} не найден`);
            }
        }

        this.items.push(item);
        this._buildIndexes();
    }

    removeItem(id: number | string): void {
        const all_children = this.getAllChildren(id);

        const ids_for_remove = new Set<number | string>();
        ids_for_remove.add(id);

        for (const child of all_children) {
            ids_for_remove.add(child.id);
        }

        this.items = this.items.filter(item => !ids_for_remove.has(item.id));

        this._buildIndexes();
    }

    updateItem(item: TreeItem): void {
        const existingItem = this.items_map.get(item.id);

        if (!existingItem) {
            throw new Error(`Элемент с id ${item.id} не найден`);
        }

        if (item.parent !== null) {
            if (!this.items_map.has(item.parent)) {
                throw new Error(`Родительский элемент с id ${item.parent} не найден`);
            }

            const all_children = this.getAllChildren(item.id);
            const children_ids = new Set(all_children.map(child => child.id));
            
            if (children_ids.has(item.parent)) {
                throw new Error(`Нельзя установить родителем элемент, который является потомком`);
            }
        }

        const index = this.items.findIndex(i => i.id === item.id);

        if (index !== -1) {
            this.items[index] = { ...item };
            this._buildIndexes();
        }
    }
}

