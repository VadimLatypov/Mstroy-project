<template>
    <div class="tree-table-container">
        <AgGridVue
            :columnDefs="columnDefs"
            :rowData="rowData"
            :defaultColDef="defaultColDef"
            :treeData="true"
            :getDataPath="getDataPath"
            :group_default_expanded="group_default_expanded"
            :suppressAggFuncInHeader="true"
            class="ag-theme-alpine"
            style="height: 600px; width: 100%;"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';
import { TreeStore } from '../tree-store';
import { items } from '../tree-store/example';
import { convertToTreeData } from '../utils/treeDataConverter';
import type { TreeDataItem } from '../utils/treeDataConverter';

const treeStore = new TreeStore(items);

const rowData = ref<TreeDataItem[]>([]);

// Разворачиваем все группы по умолчанию (все уровни)
const group_default_expanded = ref(-1);

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
    }
]);

const defaultColDef = {
    sortable: true,
    resizable: true,
    filter: true
};

const loadData = () => {

    const treeData = convertToTreeData(treeStore);
    rowData.value = treeData;
};

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.tree-table-container {
    width: 100%;
}
</style>

