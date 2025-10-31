import { TreeStore } from './TreeStore';
import type { TreeItem } from '../types/index';

export const items: TreeItem[] = [
    { id: 1, parent: null, label: 'Айтем 1' },
    { id: '91064cee', parent: 1, label: 'Айтем 2' },
    { id: 3, parent: 1, label: 'Айтем 3' },
    { id: 4, parent: '91064cee', label: 'Айтем 4' },
    { id: 5, parent: '91064cee', label: 'Айтем 5' },
    { id: 6, parent: '91064cee', label: 'Айтем 6' },
    { id: 7, parent: 4, label: 'Айтем 7' },
    { id: 8, parent: 4, label: 'Айтем 8' }
];

// Тестирование TreeStore
export const testTreeStore = () => {
    const store = new TreeStore(items);

    console.log('getAll', store.getAll());
    console.log('getItem', store.getItem(1));
    console.log('getChildren', store.getChildren(1));
    console.log('getAllChildren', store.getAllChildren(1));
    console.log('getAllParents', store.getAllParents(8));

    return store;
};