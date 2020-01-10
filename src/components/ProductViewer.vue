<template>
    <div class='full-container'>
        <Renderer />
        <div class='aside'>
            <el-card>
                <div slot="header">
                    <span><b>Chair Configurator</b></span>
                </div>
                <div>
                    <el-tabs v-model="activeName">
                        <el-tab-pane type="card"
                                     v-for="component in model.components"
                                     :key="component.name"
                                     :label="component.name"
                                     :name="component.name">
                            Material
                            <el-select v-model="model.components[model.components.indexOf(component)].material" placeholder="Material">
                                <el-option v-for="option in component.options"
                                           :key="option"
                                           :label="option"
                                           :value="option" />
                            </el-select>
                        </el-tab-pane>
                    </el-tabs>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script>
    import Renderer from "@/components/Renderer";

    export default {
        name: "ProductViewer",
        components: {
            Renderer
        },
        data: () => {
            return {
                activeName: 'Back',
                model: {
                    name: 'Chair',
                    filetype: 'obj',
                    components: [
                        {
                            name: 'Back',
                            material: 'wood_1',
                            options: [ 'wood_1', 'wood_2' ]
                        },
                        {
                            name: 'Legs',
                            material: 'wood_2',
                            options: [ 'wood_1', 'wood_2']
                        },
                        {
                            name: 'Support',
                            material: 'wood_1',
                            options: [ 'wood_1', 'wood_2']
                        },
                        {
                            name: 'Foam',
                            material: 'fabric',
                            options: [ 'fabric' ]
                        }
                    ],
                    materials: [
                        { name: 'wood_1', filetype: 'png' },
                        { name: 'wood_2', filetype: 'png' },
                        { name: 'fabric', filetype: 'jpg' },
                    ]
                }
            }
        },

        methods: {}
    }
</script>

<style scoped>

    .full-container{
        width: 100%;
        height: 100%;

    }

    .aside {
        position: absolute;
        right: 20px;
        top: 20px;

    }

</style>