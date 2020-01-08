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

        Vector3,
    } from "three";

    import {
        OBJLoader
    } from 'three/examples/jsm/loaders/OBJLoader';

    import {
        OrbitControls
    } from 'three/examples/jsm/controls/OrbitControls';

    import {
        PBRTextureSet
    } from '@/classes/PBRTextureSet.js';

    import {
        StudioLights
    } from "@/classes/StudioLights";

    export default {
        name: "Renderer",

        props: [
            "model",
            "lightsColor",
            "lightsIntensity"
        ],

        data: () => {
            return {
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

                //Components of the mesh that will be displayed
                activeModel: null,
                //Array of texturesets object
                textureSets: [],
                //Active textureset name
                activeTextureSet: null
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
                this.camera.aspectRatio = this.camera_settings.aspectRatio

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

                this.renderer.physicallyCorrectLights = true;

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
                this.camera.position.set(2, 2, 2);
                this.camera.lookAt(new Vector3(0,0,0))
                controls.update();
            },

            loadModel: (modelLink) => {
                return new Promise((resolve, reject) => {
                    var loader = new OBJLoader();

                    loader.load(
                        modelLink,
                        (file) => {
                            resolve(file);
                        },null,
                        (error) => {
                            reject(error);
                        }
                    )
                })
            },

            loadShaders: (folder) => {
                return Promise.all([
                    fetch(folder + 'VertexShader.glsl').then((x) => x.text()),
                    fetch(folder + 'FragmentShader.glsl').then((x) => x.text()),
                ])
            },

            //Base Url + materials folder + name of the material + filetype of the textures
            //Load all the textures required for the pbr shader
            //1. Diffuse
            //2. Specular
            //3. Roughness
            //4. normal
            //TODO: Put this method as a TextureSet method
            loadPBRTextures: (folder, materialName, filetype='jpg') => {
                var textures = [
                    'diffuse',
                    'roughness',
                    'normal'
                ];
                var promises = [];
                textures.forEach((textureName) => {
                    promises.push(new Promise((resolve, reject) => {
                        var loader = new TextureLoader();
                        loader.load(folder + materialName + '/' + textureName + '.' + filetype,
                            (texture) => {resolve(texture);},
                            (error) => {reject(error)}
                        );
                    }))
                });

                return Promise.all(promises);
            },

            swapTextures: (textureSetName) => {
                //Check if texture set has already been downloaded
                for (let textureSet in this.textureSets) {
                    //if the texture set is already downloaded
                    if(textureSet.name() == textureSetName){
                        this.loadTextureSet(textureSet);
                        return ;
                    }
                }

                //If it's not in the textureSets array we need to downloand the textures
                this.loadPBRTextures('./assets/textures/', textureSetName).then(
                    function([diffuse, roughness, normal]){
                        //create and add the texture set to the already downloaded sets
                        const txtSet = new PBRTextureSet(textureSetName, {
                            diffuse: diffuse,
                            roughness: roughness,
                            normalmap: normal
                        });

                        this.textureSets.push(txtSet);
                        this.loadTextureSet(txtSet);
                    }
                ).catch(
                    function(error){
                        console.log(error);
                    }
                )

            },

            loadTextureSet: (textureSet) => {
                const newUniforms = {
                    diffuse: { type: 't', value: textureSet.textures.diffuse } ,
                    roughness: { type: 't', value: textureSet.textures.roughness },
                    normalmap: { type: 't', value: textureSet.textures.normalmap }
                };
                this.activeTextureSet = textureSet.name();
                this.activeMesh.material.uniforms = newUniforms;
                this.activeMesh.material.needsUpdate = true;
            },

            createShaderFrom: (vxShader, fgShader, textures) => {
                //Merge uniforms to enable custom shader to be lit by
                //threejs lights
                const mergedUniforms = UniformsUtils.merge([
                    UniformsLib['lights'],
                    UniformsLib['ambient'],
                    {
                        diffuse: {} ,
                        roughness: {},
                        normalmap: {}
                    }]);
                //Directly merging already assigned textures to the uniform
                //doesn't work per
                //https://github.com/mrdoob/three.js/issues/8016
                mergedUniforms.diffuse = { type: 't', value:textures.diffuse };
                mergedUniforms.roughness = { type: 't', value:textures.roughness };
                mergedUniforms.normalmap = { type: 't', value:textures.normalmap };
                const shader = new ShaderMaterial({
                    vertexShader: vxShader,
                    fragmentShader: fgShader,
                    uniforms: mergedUniforms,
                    lights: true
                });
                return shader;
            }
        },

        mounted() {
            this.initRendering();

            //Create point lights
            this.lights = new StudioLights(5, 0x404040, 1, 100, 2, 4);
            //this.lights.displayReferenceGeometry();
            this.scene.add(this.lights);

            this.scene.add(new GridHelper(10,10))


            //Start the rendering
            this.animate();

            //First loading steps:
            //1. Load model
            //2. Load shaders
            //3. Load textures (only those needed)
            //perform 1 to 3 in parallel, when every step is finished
            //Attach everything to scene and display

            const defaultMaterial = 'concrete';

            Promise.all([
                //Model
                this.loadModel('./assets/models/shaderball/shaderball.obj')
                    .then(function(model) {
                        return model;
                    })
                    .catch(function(error) {
                        console.log(error);
                    }),
                //Shaders
                this.loadShaders('./assets/shaders/CookTorrance/')
                    .then(function([vertexShader, fragmentShader]) {
                        return {
                            vertex: vertexShader,
                            fragment: fragmentShader
                        }
                    })
                    .catch(function(error) {
                        console.log(error);
                    }),
                //Load Textures only for fixed unmutable materials
                //and the one default material
                this.loadPBRTextures('./assets/textures/', defaultMaterial, 'png')
                    .then(function([diffuse, roughness, normal]) {
                        return {
                            diffuse: diffuse,
                            roughness: roughness,
                            normalmap: normal
                        }
                    })
                    .catch(function(error) {
                        console.log(error);
                    }),
                this.loadPBRTextures('./assets/textures/', 'metal_2', 'png')
                    .then(function([diffuse, roughness, normal]) {
                        return {
                            diffuse: diffuse,
                            roughness: roughness,
                            normalmap: normal
                        }
                    })
                    .catch(function(error) {
                        console.log(error);
                    }),
                this.loadPBRTextures('./assets/textures/', 'metal_Rust', 'png')
                    .then(function([diffuse, roughness, normal]) {
                        return {
                            diffuse: diffuse,
                            roughness: roughness,
                            normalmap: normal
                        }
                    })
                    .catch(function(error) {
                        console.log(error);
                    }),
            ]).then(([model, shaders, defaultMaterialTextures, baseOutsideMaterial, baseInsideMaterial]) => {
                //Compose and add to scene
                //Create pbr shader

                var defaultMaterialShader = this.createShaderFrom(shaders.vertex, shaders.fragment, defaultMaterialTextures);
                var baseOutsideShader = this.createShaderFrom(shaders.vertex, shaders.fragment, baseOutsideMaterial);
                var baseInsideShader = this.createShaderFrom(shaders.vertex, shaders.fragment, baseInsideMaterial);

                var components = {
                    prefix: 'ShaderBall',
                    names: [
                        'BaseInside',
                        'BaseOutside',
                        'BallInside',
                        'BallOutside',
                        'Sides'
                    ]
                }

                model.scale.set(0.1,0.1,0.1);
                //Apply material to single meshes
                model.getObjectByName("ShaderBall:BaseInside").material = baseInsideShader;
                model.getObjectByName("ShaderBall:BaseOutside").material = baseOutsideShader;



                //Set loaded mesh as the active mesh
                //Create new TextureSet with textures and add to the array of loaded textures
                this.textureSets = [];
                const textureSet = new PBRTextureSet(defaultMaterial, defaultMaterialTextures);
                this.textureSets.push(textureSet);
                this.activeTextureSet = defaultMaterial;

                this.activeModel = model;
                this.scene.add(model);
            });

            //Listen for window resize event
            window.addEventListener('resize', this.onResize);
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