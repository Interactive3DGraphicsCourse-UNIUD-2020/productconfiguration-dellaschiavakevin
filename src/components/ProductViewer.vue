<template>
    <div class='full-container'>
        <Renderer :lightsColor="lightsColor" :lightsIntensity="lightsIntensity"/>
        <div class='aside'>

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
                lightsColor: '',
                lightsIntensity: 1,

                materials: [
                    'planks',
                    'metal'
                ],
                selectedMaterial: 'planks',


                slideroptions: {
                    min: 1,
                    max: 10
                }
            }
        },

        methods: {
            updateColor: function(event){
                this.lightsColor = event;
            },
            updateIntensity: function(event){
                this.lightsColor = event;
            }
        }
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