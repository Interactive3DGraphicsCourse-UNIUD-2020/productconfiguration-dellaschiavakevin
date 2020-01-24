<template>
    <div class='full-container' id='canvas-container'>
        <canvas id='viewport-canvas'>

        </canvas>
    </div>
</template>

<script>
    import {
        WebGLRenderer,
        Scene,
        PerspectiveCamera,

        TextureLoader,

        Mesh,
        SphereGeometry,

        GridHelper,

        PointLight,

        Object3D,

        ShaderMaterial,
        UniformsLib,
        UniformsUtils,
        PCFSoftShadowMap,

        Vector3,
    } from "three";

    import {
        OrbitControls
    } from 'three/examples/jsm/controls/OrbitControls';

    import {
        PBRTextureSet
    } from '@/classes/PBRTextureSet.js';

    import {
        StudioLights
    } from "@/classes/StudioLights";

    import {
        AssetLoader
    } from "@/classes/AssetLoader";

    import {
        PBRMaterial
    } from "@/classes/PBRMaterial";
    import {LengthDimension} from "@/classes/LengthDimension";

    export default {
        name: "Renderer",

        props: {
            configuration: {
                type: Object,
                required: true
            },
            options: {
                type: Object,
                required: false,
                default: () => ({
                    lights: {
                        intensity: 1,
                        color: 0x404040
                    }
                })
            }
        },

        data: () => {
            return {
                //Configuration data example
                /*
                dataModel: {
                    model: {
                        //Name of the model
                        name: '',
                        filetype: '',
                        //Array of model components and
                        //relative material
                        components: [
                            {
                                //Name of the model component
                                name:'',
                                //Name of the active material
                                //(must be in the options array)
                                material: null,
                                //Names of choiches
                                options: []
                            }
                        ],
                        //All the materials, every component must
                        //reference a material in this array
                        materials:[
                            {
                                name: '', //Name of the material
                                filetype: '', //Filetype of the material textures
                            }
                        ]
                    }
                },
                */


                //Actual model and materials
                //corresponding to the data model
                configuratorModel: {
                    model: {
                        name: '', //Name of the mesh same as in the dataModel
                        mesh: null, //The complete group of meshes
                        shaders: null, //Shaders used in the materials
                        components: [   //Components in the mesh
                            {
                                name: '', //Name of the component same as in dataMesh
                                mesh: null, //Mesh of the component,
                                material: null, //PBRMaterial of the component
                            }
                        ],
                        //Array of PBRMaterials
                        materials: []
                    }
                },

                //Server Side path info
                base_paths: {
                    models: './assets/models/',
                    textures: './assets/textures/',
                    shaders: './assets/shaders/'
                },

                //Rendering data
                renderer: null,
                scene: null,
                camera: null,
                lights: null, //StudioLights instance

                //Camera settings
                camera_settings: {
                    FOV: null,
                    aspectRatio: null,
                    near: null,
                    far: null,
                },

                //Loading stuff settings
                isLoading: false,
                //Error data
                isError: false,
                error: null, //the instance of the error
                errorMessage: '',

                //Components that manages the asset loading
                assetLoader: null,

            }
        },

        methods: {
            animate: function() {
                requestAnimationFrame(this.animate);
                this.renderer.render(this.scene, this.camera);
            },

            onResize: function() {
                //update the renderer width and height
                let canvas = document.querySelector('#viewport-canvas');
                let canvasContainer = document.querySelector('#canvas-container');

                canvas.width = canvasContainer.clientWidth;
                canvas.height = canvasContainer.clientHeight;

                this.camera_settings.aspectRatio = canvasContainer.clientWidth / canvasContainer.clientHeight;
                this.camera.aspectRatio = this.camera_settings.aspectRatio;

                this.renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
            },

            initRendering(){
                let canvas = document.querySelector('#viewport-canvas');
                let canvasContainer = document.querySelector('#canvas-container');

                canvas.width = canvasContainer.clientWidth;
                canvas.height = canvasContainer.clientHeight;

                //Renderer init
                this.renderer = new WebGLRenderer({
                    canvas: canvas,
                    alpha: true,
                    antialias: true,
                });
                this.renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
                this.renderer.setClearColor(0xbdc3c7,0.0);

                //Lights ans shadows
                this.renderer.physicallyCorrectLights = true;
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = PCFSoftShadowMap;

                //Init scene
                this.scene = new Scene();

                //Init camera params
                this.camera_settings.FOV = 75;
                this.camera_settings.aspectRatio = canvasContainer.clientWidth / canvasContainer.clientHeight;
                this.camera_settings.near = 0.1;
                this.camera_settings.far = 1000;

                this.camera = new PerspectiveCamera(this.camera_settings.FOV,
                    this.camera_settings.aspectRatio,
                    this.camera_settings.near,
                    this.camera_settings.far);

                var controls = new OrbitControls(this.camera, canvas);
                controls.enablePan = false;
                this.camera.position.set(2, 2, 2);
                this.camera.lookAt(new Vector3(0,4,0));
                controls.update();
            },

            //Method called when the model in the
            //configuratorModel is ready to be displayed
            readyToDisplay(configuratorModel){
                configuratorModel.model.mesh.scale.set(0.35, 0.35, 0.35);
                configuratorModel.model.mesh.rotateY(180 * Math.PI/180);

                //Set camera to look at the center of the loaded model
                this.scene.add(configuratorModel.model.mesh);
            },

            /*
            initDataModel(){
                return {
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
                                options: [ 'fabric', 'fabric']
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
             */
            initConfiguratorModel(dataModel, model, shaders, materials){
                console.log(model, shaders, materials);

                const PBRMaterials = [];
                materials.forEach((textureSet) => {
                    PBRMaterials.push(
                        new PBRMaterial(
                            textureSet.name,
                            shaders.vertex,
                            shaders.fragment,
                            textureSet.textures
                        )
                    )
                });
                const components = [];

                dataModel.model.components.forEach(
                    (component) => {
                        const fullComponentName = dataModel.model.name + ':' + component.name;

                        const componentMesh = model.getObjectByName(fullComponentName);

                        //Find the material of the component in materials array
                        const componentMaterial = PBRMaterials.find( (material) => material.name === component.material);
                        componentMesh.material = componentMaterial.getShader();

                        components.push({
                            name: component.name,
                            mesh: componentMesh,
                            material: componentMaterial
                        });
                    }
                )

                return {
                    model: {
                        name: dataModel.model.name,
                        mesh: model,
                        shaders: shaders,
                        components: components,
                        //Array of PBRTextureSet to keep track of
                        //material names and
                        materials: PBRMaterials
                    }
                }
            },

            loadDataModelAssets(dataModel, loadUnusedMaterials = false){

                //Create the asset loader
                this.assetLoader = new AssetLoader();

                const modelURL = this.base_paths.models + dataModel.model.name + '.' + dataModel.model.filetype;
                const shadersURL = this.base_paths.shaders + 'CookTorrance/';

                //Load models and shaders
                var promises = [
                    this.assetLoader.loadModel(modelURL)
                        .then(function(model) {
                            return model;
                        })
                        .catch(function(error) {
                            console.log(error);
                        }),
                    this.assetLoader.loadShaders(shadersURL)
                        .then(function([vertexShader, fragmentShader]) {
                            return {
                                vertex: vertexShader,
                                fragment: fragmentShader
                            }
                        })
                        .catch(function(error) {
                            console.log(error);
                        }),
                ];

                var materialsToLoad = [];
                if(loadUnusedMaterials == true){
                    materialsToLoad = dataModel.model.materials;
                }else{
                    const assignedMaterials = [];
                    dataModel.model.components.forEach( (component) => assignedMaterials.push(component.material) );
                    //Get all the assigned materials from the materials array
                    //to get the filetypes
                    dataModel.model.materials.forEach( (material) => {
                            if ( assignedMaterials.includes(material.name) )
                                materialsToLoad.push(material);
                        }
                    );
                }

                const materialPromises = [];
                materialsToLoad.forEach( (material) => {
                    const textureUrl = this.base_paths.textures + material.name + '/';
                    materialPromises.push(
                        this.assetLoader.loadPBRTextures(textureUrl, material.filetype)
                            .then(function([diffuse, roughness, normal]) {
                                const textureSet = new PBRTextureSet(material.name, {
                                    diffuse: diffuse,
                                    roughness: roughness,
                                    normalmap: normal
                                });
                                return textureSet;
                            })
                            .catch(function(error) {
                                console.log(error);
                            })
                    );
                });
                //We want to load all materials in a promise group
                promises.push(Promise.all(materialPromises));

                return Promise.all(promises)
            },

        },

        mounted() {

            this.initRendering();
            //First loading steps:
            //1. Load model
            //2. Load shaders
            //3. Load textures (only those needed)
            //perform 1 to 3 in parallel
            //when every step is finished
            //Attach everything to scene and display

            //this.dataModel = this.initDataModel();
            this.loadDataModelAssets(this.configuration, true).then(
                ([model, shaders, materials]) => {
                    this.configuratorModel = this.initConfiguratorModel(
                        this.configuration,
                        model,
                        shaders,
                        materials);
                    this.readyToDisplay(this.configuratorModel);
                }
            );


            //Create point lights
            this.lights = new StudioLights(
                this.options.lights.color,
                this.options.lights.intensity,
                100,
                2,
                new SphereGeometry(5, 4, 4));
            this.scene.add(this.lights);

            //this.scene.add(new GridHelper(10,10));

            //Setup dimensions
            var dim = new LengthDimension(2, '2m', 0xaaaaaa);
            this.scene.add(dim);

            //Start the rendering
            this.animate();

            //Listen to changes in the component's materials
            for (let i = 0; i < this.configuration.model.components.length; i++){
                const componentName = 'configuration.model.components.' + i + '';
                this.$watch(componentName,
                    function (newVal, oldVal) {
                        //Get the corresponding mesh and the new material
                        const component = this.configuratorModel.model.components.find((comp) => (comp.name === newVal.name));
                        const componentMesh = component.mesh;
                        const componentNewMaterial = this.configuratorModel.model.materials.find( (mat) => (mat.name === newVal.material));

                        componentMesh.material = componentNewMaterial.getShader();
                        componentMesh.material.needsUpdate = true;

                        component.material = componentNewMaterial;

                    }, {deep: true});
            }

            //Listen for window resize event
            window.addEventListener('resize', this.onResize);
        },

        watch: {
            'options.lights.intensity': function (newVal, oldVal) {
                this.lights.setIntensity(newVal);
            },
            'options.lights.color': function (newVal, oldVal) {
                this.lights.setColor(newVal);
            }
        },
        updated() {

        },

        beforeDestroy(){
            window.removeEventListener('resize', this.onResize);
        }

    }
</script>

<style scoped>
    .full-container{
        width: 100%;
        height: 100%;
    }
</style>