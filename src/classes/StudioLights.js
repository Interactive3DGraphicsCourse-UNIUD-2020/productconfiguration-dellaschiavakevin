import {
    MeshBasicMaterial,
    Object3D,
    PointLight,
    SphereGeometry,
    Mesh
} from "three";

//Class to create and control
//a group of point lights placed in the scene
export class StudioLights extends Object3D {

    //Create a sphere of lights around the center
    //of the object, the radius specifies the distance
    //between one light and the center
    //every light will have the same color and intensity
    //color: hex
    //intensity: number
    //nOfPoints: number of width and height segment of the reference sphere around
    //           the object center
    constructor(radius, color, intensity, distance, decay, nOfPoints = 4){
        super();

        this.referenceGeometry = new SphereGeometry(radius, nOfPoints, nOfPoints);

        this.lights = {
            color: color,
            intensity: intensity,
            distance: distance,
            decay: decay,

            objects: []
        };

        this.addLightsUsingReferenceGeometry();

        //Mesh added to the object for debug purposes
        this.addedMesh = null;
    }

    addLightsUsingReferenceGeometry(){
        this.referenceGeometry.vertices.forEach(
            (vertex) => {
                const light = new PointLight(this.lights.color,
                    this.lights.intensity,
                    this.lights.distance,
                    this.lights.decay);
                light.position.set(vertex.x, vertex.y, vertex.z);

                this.add(light);
                this.lights.objects.push(light);
            }
        )
    }

    displayReferenceGeometry(){
        var pivot = new Object3D();
        var material = new MeshBasicMaterial({
            color: 0x298ec1,
            transparent: true,
            opacity: 0.3
        });
        var mesh = new Mesh(this.referenceGeometry, material);
        pivot.add(mesh);

        for (let i = 0; i < this.referenceGeometry.vertices.length; i++) {
            var _material = new MeshBasicMaterial({
                color: 0xc61976
            });
            var _mesh = new Mesh(new SphereGeometry(0.05,16, 16), _material);

            _mesh.position.set(this.referenceGeometry.vertices[i].x,
                this.referenceGeometry.vertices[i].y,
                this.referenceGeometry.vertices[i].z);
            pivot.add(_mesh);
        }

        this.addedMesh = pivot;
        this.add(this.addedMesh);
    }

    hideReferenceGeometry(){
        if(this.addedMesh != null){
            this.remove(this.addedMesh);
        }
    }

}