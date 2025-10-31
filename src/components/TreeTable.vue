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
                            v-model="formData.id" 
                            type="text" 
                            :disabled="modalMode === 'edit'"
                            placeholder="Введите ID (число или строка)"
                        />
                    </div>
                    <div class="form-group">
                        <label>Родитель (ID):</label>
                        <select v-model="formData.parent">
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
                            v-model="formData.label" 
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
const formData = ref({
    id: '',
    parent: null as number | string | null,
    label: ''
});

const availableParents = computed(() => {
    const allItems = treeStore.getAll();
    
    if (modalMode.value === 'edit' && formData.value.id) {
        const childrenIds = new Set([formData.value.id]);
        const allChildren = treeStore.getAllChildren(formData.value.id);
        allChildren.forEach(child => childrenIds.add(child.id));
        
        return allItems.filter(item => !childrenIds.has(item.id));
    }
    
    return allItems;
});

// Путь элемента
const getDataPath = (data: TreeDataItem) => {
    return data.path;
};

// Порядковый номер строки
const getRowNumber = (params: any) => {
    if (params.node.rowPinned) {
        return '';
    }
    
    return params.node.rowIndex !== undefined ? params.node.rowIndex + 1 : '';
};

// Категория
const getCategory = (params: any) => {
    if (params.node.group || (params.node.allChildrenCount && params.node.allChildrenCount > 0)) {
        return 'Группа';
    }
    
    if (params.data) {
        const children = treeStore.getChildren(params.data.id);
        return children.length > 0 ? 'Группа' : 'Элемент';
    }
    
    return 'Элемент';
};

const deleteAction = (params: any) => {
    const itemId = params.data.id;
    
    if (confirm(`Удалить элемент "${params.data.label}" и все его дочерние элементы?`)) {
        treeStore.removeItem(itemId);
        loadData();
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
        hide: false
    },
    {
        headerName: 'Parent',
        field: 'parent',
        width: 150,
        hide: false
    },
    {
        headerName: 'Действия',
        width: 150,
        pinned: 'right',
        cellRenderer: (params: any) => {
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
    formData.value = {
        id: '',
        parent: null,
        label: ''
    };
    showModal.value = true;
};

const openEditModal = (item: TreeItem) => {
    modalMode.value = 'edit';
    formData.value = {
        id: String(item.id),
        parent: item.parent,
        label: item.label || ''
    };
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    formData.value = {
        id: '',
        parent: null,
        label: ''
    };
};

// Двойной клик по строке
const handleRowDoubleClick = (params: any) => {
    if (params.data) {
        openEditModal(params.data);
    }
};

const handleSave = () => {
    if (!formData.value.id) {
        alert('ID не может быть пустым');
        return;
    }

    if (!formData.value.label) {
        alert('Наименование не может быть пустым');
        return;
    }

    try {
        let processedId: number | string = formData.value.id;
        const numId = Number(formData.value.id);
        if (!isNaN(numId) && formData.value.id.toString() === numId.toString()) {
            processedId = numId;
        }

        const newItem: TreeItem = {
            id: processedId,
            parent: formData.value.parent,
            label: formData.value.label
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

.ag-theme-alpine :deep(.btn-delete) {
    padding: 5px 10px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;

    .btn-delete:hover {
        background-color: #da190b;
    }
}

.ag-theme-alpine :deep(.btn-delete:hover) {
    background-color: #da190b;
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

