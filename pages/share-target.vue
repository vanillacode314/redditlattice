<script lang="ts" setup>
const route = useRoute();
navigateTo(`/r/${route.query.q}`);
</script>

<template></template>
