<template>
    <div class="tree-table-container">
        <AgGridVue
            :columnDefs="columnDefs"
            :rowData="rowData"
            :defaultColDef="defaultColDef"
            class="ag-theme-alpine"
            style="height: 500px; width: 100%;"
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

const treeStore = new TreeStore(items);

const rowData = ref<any[]>([]);
const columnDefs = ref([
    {
        field: 'id',
        headerName: '№ п/п',
        width: 150
    },
    {
        field: 'parent',
        headerName: 'Категория',
        width: 150
    },
    {
        field: 'label',
        headerName: 'Наименование',
        flex: 1
    }
]);

const defaultColDef = {
    sortable: true,
    resizable: true,
    filter: true
};

const loadData = () => {
    const allItems = treeStore.getAll();
    console.log(allItems);

    rowData.value = allItems.map((item, index) => ({
        ...item,
        id: index + 1
    }));
    console.log(rowData.value);
};

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.tree-table-container {
    width: 100%;
    padding: 20px;
}
</style>

