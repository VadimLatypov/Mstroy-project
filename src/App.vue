<script setup lang="ts">
import TreeTable from './components/TreeTable.vue';
</script>

<template>
    <div id="app">
        <h1>MStroy Test Task</h1>
        <TreeTable />
    </div>
</template>

<style scoped>
#app {
    width: 100%;
    min-height: 100vh;
}

h1 {
    padding: 20px;
    margin: 0;
    color: #2c3e50;
}
</style>
