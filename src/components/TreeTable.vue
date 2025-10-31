<template>
    <div class="tree-table-container">
        <div class="toolbar">
            <button @click="openAddModal" class="btn btn-add">Добавить элемент</button>
        </div>
        
        <AgGridVue
            ref="ag_grid_ref"
            :columnDefs="columnDefs"
            :rowData="rowData"
            :defaultColDef="defaultColDef"
            :treeData="true"
            :getDataPath="getDataPath"
            :group_default_expanded="group_default_expanded"
            :suppressAggFuncInHeader="true"
            class="ag-theme-alpine"
            style="height: 600px; width: 100%;"
            @rowDoubleClicked="handleRowDoubleClick"
        />

        <!-- Модальное окно для добавления/редактирования -->
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>{{ modalMode === 'add' ? 'Добавить элемент' : 'Редактировать элемент' }}</h3>
                    <button class="close-btn" @click="closeModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>ID:</label>
                        <input 
                            v-model="form_data.id" 
                            type="text" 
                            :disabled="modalMode === 'edit'"
                            placeholder="Введите ID (число или строка)"
                        />
                    </div>
                    <div class="form-group">
                        <label>Родитель (ID):</label>
                        <select v-model="form_data.parent">
                            <option :value="null">Нет (корневой элемент)</option>
                            <option 
                                v-for="item in availableParents" 
                                :key="item.id" 
                                :value="item.id"
                            >
                                {{ item.label }} (ID: {{ item.id }})
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Наименование:</label>
                        <input 
                            v-model="form_data.label" 
                            type="text" 
                            placeholder="Введите наименование"
                        />
                    </div>
                    <div class="modal-actions">
                        <button @click="closeModal" class="btn btn-cancel">Отмена</button>
                        <button @click="handleSave" class="btn btn-save">Сохранить</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';
import { TreeStore } from '../tree-store';
import { items } from '../tree-store/example';
import { convertToTreeData } from '../utils/treeDataConverter';
import type { TreeDataItem } from '../utils/treeDataConverter';
import type { TreeItem } from '../types/index';

const treeStore = new TreeStore(items);

const rowData = ref<TreeDataItem[]>([]);
const ag_grid_ref = ref();

const group_default_expanded = ref(-1);

const showModal = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const form_data = ref({
    id: '',
    parent: null as number | string | null,
    label: ''
});

const availableParents = computed(() => {
    const allItems = treeStore.getAll();
    
    if (modalMode.value === 'edit' && form_data.value.id) {
        const childrenIds = new Set([form_data.value.id]);
        const allChildren = treeStore.getAllChildren(form_data.value.id);
        allChildren.forEach(child => childrenIds.add(child.id));
        
        return allItems.filter(item => !childrenIds.has(item.id));
    }
    
    return allItems;
});

// Путь элемента
const getDataPath = (data: TreeDataItem) => {
    return data.path;
};

interface AgGridCellParams {
    node: {
        rowPinned?: boolean;
        rowIndex?: number;
        group?: boolean;
        allChildrenCount?: number;
    };
    data?: TreeDataItem;
}

interface AgGridCellRendererParams extends AgGridCellParams {
    data: TreeDataItem;
}

// Порядковый номер строки
const getRowNumber = (params: AgGridCellParams): string | number => {
    if (params.node.rowPinned) {
        return '';
    }
    
    return params.node.rowIndex !== undefined ? params.node.rowIndex + 1 : '';
};

// Категория
const getCategory = (params: AgGridCellParams): string => {
    if (params.node.group || (params.node.allChildrenCount && params.node.allChildrenCount > 0)) {
        return 'Группа';
    }
    
    if (params.data) {
        const children = treeStore.getChildren(params.data.id);
        return children.length > 0 ? 'Группа' : 'Элемент';
    }
    
    return 'Элемент';
};

const deleteAction = (params: AgGridCellRendererParams): void => {
    const itemId = params.data.id;
    const itemLabel = params.data.label || String(itemId);
    
    if (confirm(`Удалить элемент "${itemLabel}" и все его дочерние элементы?`)) {
        try {
            treeStore.removeItem(itemId);
            loadData();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Ошибка при удалении');
        }
    }
};

const columnDefs = ref([
    {
        headerName: '№ п/п',
        field: 'rowNumber',
        width: 100,
        valueGetter: getRowNumber,
        pinned: 'left',
        sortable: false,
        filter: false,
        cellStyle: { textAlign: 'center' }
    },
    {
        headerName: 'Категория',
        field: 'category',
        width: 150,
        valueGetter: getCategory,
    },
    {
        headerName: 'Наименование',
        field: 'label',
        flex: 1,
        cellStyle: { textAlign: 'left' },
        cellRenderer: 'agGroupCellRenderer'
    },
    {
        headerName: 'ID',
        field: 'id',
        width: 150,
        hide: true
    },
    {
        headerName: 'Parent',
        field: 'parent',
        width: 150,
        hide: true
    },
    {
        headerName: 'Действия',
        width: 150,
        pinned: 'right',
        cellRenderer: (params: AgGridCellRendererParams) => {
            const button = document.createElement('button');
            button.className = 'btn btn-delete';
            button.textContent = 'Удалить';
            button.onclick = () => deleteAction(params);
            return button;
        },
        cellStyle: { textAlign: 'center' },
        sortable: false,
        filter: false
    }
]);

const defaultColDef = {
    sortable: true,
    resizable: true,
    filter: true
};

const openAddModal = () => {
    modalMode.value = 'add';
    form_data.value = {
        id: '',
        parent: null,
        label: ''
    };
    showModal.value = true;
};

const openEditModal = (item: TreeItem) => {
    modalMode.value = 'edit';
    form_data.value = {
        id: String(item.id),
        parent: item.parent,
        label: item.label || ''
    };
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    form_data.value = {
        id: '',
        parent: null,
        label: ''
    };
};

// Двойной клик по строке
const handleRowDoubleClick = (params: { data?: TreeDataItem }): void => {
    if (params.data) {
        openEditModal(params.data);
    }
};

const handleSave = (): void => {
    if (!form_data.value.id || form_data.value.id.trim() === '') {
        alert('ID не может быть пустым');
        return;
    }

    if (!form_data.value.label || form_data.value.label.trim() === '') {
        alert('Наименование не может быть пустым');
        return;
    }

    if (modalMode.value === 'edit' && form_data.value.parent !== null) {
        const parentItem = treeStore.getItem(form_data.value.parent);
        if (!parentItem) {
            alert(`Родительский элемент с id ${form_data.value.parent} не найден`);
            return;
        }
    }

    try {
        let processedId: number | string = form_data.value.id.trim();
        const numId = Number(processedId);
        
        if (!isNaN(numId) && processedId === numId.toString()) {
            processedId = numId;
        }

        const newItem: TreeItem = {
            id: processedId,
            parent: form_data.value.parent,
            label: form_data.value.label.trim()
        };

        if (modalMode.value === 'add') {
            treeStore.addItem(newItem);
        } else {
            treeStore.updateItem(newItem);
        }

        loadData();
        closeModal();
    } catch (error) {
        alert(error instanceof Error ? error.message : 'Ошибка при сохранении');
    }
};

const loadData = () => {
    const treeData = convertToTreeData(treeStore);
    rowData.value = treeData;
};

onMounted(() => {
    loadData();
});
</script>

<style scoped lang="scss">
.tree-table-container {
    width: 100%;
}

.toolbar {
    margin-bottom: 15px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;

    &.btn-add {
        background-color: #4CAF50;
        color: white;

        &:hover {
            background-color: #45a049;
        }
    }

    &.btn-save {
        background-color: #2196F3;
        color: white;

        &:hover {
            background-color: #0b7dda;
        }
    }

    &.btn-cancel {
        background-color: #f44336;
        color: white;

        &:hover {
            background-color: #da190b;
        }
    }
}

:deep(.ag-cell .btn-delete) {
    padding: 5px 10px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;

    &:hover {
        background-color: #da190b;
    }
}


.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;

    .modal-content {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;

            h3 {
                margin: 0;
                color: #333;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #999;
                line-height: 1;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;

                &:hover {
                    color: #333;
                }
            }
        }

        .modal-body {
            padding: 20px;

            .form-group {
                margin-bottom: 20px;

                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #333;
                }

                input,
                select {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    box-sizing: border-box;
                }

                input:disabled {
                    background-color: #f5f5f5;
                    cursor: not-allowed;
                }
            }

            .modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }
        }
    }
}
</style>

