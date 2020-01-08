<template>
  <div id="app" class='full-screen'>
    <ProductViewer />
  </div>
</template>

<script>
import ProductViewer from "@/components/ProductViewer";

export default {
  name: 'app',
  components: {
    ProductViewer
  }
}
</script>

<style>
  .full-screen{
    width: 100vw;
    height: 100vh;
  }
</style>
