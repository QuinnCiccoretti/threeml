import * as THREE from "three";
import {createCube} from 'threeml';
import {setupRaycasting, updateSelectedArrows} from 'dragdrop'

var obj_list:THREE.Object3D[] = [];
var reticleMat:THREE.MeshBasicMaterial;
var groundMat:THREE.MeshLambertMaterial;
export function updateScene(camera:THREE.Camera){
	updateSelectedArrows(camera);
}
//some of these may be arbitrarily decided symbols, nothing more
//assumes all end in .png
var name_to_path:Record<string,string> = {
    "google_compute_instance.vm_instance":"Compute/Compute_Engine",
    "google_compute_network.vpc_network":"Networking/Virtual_Private_Cloud",
    "provider.google":"Extras/Google_Cloud_Platform"
}
var path_to_all_icons:string = "img/gcp_icons/";
//return path relative to root dir of a resource icon
function get_iconpath_from_resourcename(name:string): string{
    name = name.trim();
    var iconpath:string = name_to_path[name];

    if(iconpath && name){
        return path_to_all_icons + iconpath + ".png"
        
    }
    else if(name){
        return path_to_all_icons + "Extras/Generic_GCP" + ".png"
    }
    return "";
}

export async function initScene(camera: THREE.Camera,scene: THREE.Scene, terraform_json:any): Promise<any> {
    //create light and floor
    var floorsize = 100;
    createDirLight( scene, 0, 5, 0 );
    var groundGeo = new THREE.PlaneBufferGeometry( floorsize, floorsize );
    groundMat = new THREE.MeshLambertMaterial( { color: 0xededed } );
    var ground = new THREE.Mesh( groundGeo, groundMat );
    ground.position.y = -1.6;
    ground.rotation.x = - Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    var gridHelper = new THREE.GridHelper( 10, 10 );
    gridHelper.position.set(0,-1.6,0);
    scene.add( gridHelper );

    reticleMat = new THREE.MeshBasicMaterial({ color: ~0x0, opacity: 0.5 });
    var reticle = new THREE.Mesh(
      new THREE.RingBufferGeometry(0.005, 0.01, 15),
      reticleMat
    );
    reticle.position.z = -0.5;
    camera.add(reticle);

    updateSkyColor(scene,"#ffffff");

    var name_to_cube:Record<string,THREE.Mesh> = {};
    const resource_list = Object.keys(terraform_json);
    for(var resource_name of resource_list){
        var info:any = terraform_json[resource_name];
        var resourcex:number = parseFloat(info.x);
        var resourcey:number = parseFloat(info.y);
        var dot_to_three_scale = 0.02;
        resourcex *= dot_to_three_scale;
        resourcey *= dot_to_three_scale;

        var icon_path:string = get_iconpath_from_resourcename(resource_name);
        var cube = await createCube(icon_path);
        cube.position.set(resourcex, resourcey/2+3, resourcey)
        scene.add(cube);
        obj_list.push(cube); //insert into our "graph"
        name_to_cube[resource_name] = cube;
        cube.userData.arrows_in = [];
        cube.userData.arrows_out = [];
        cube.userData.edges_in = [];
        cube.userData.edges_out = [];
    }
    
    for(const resource_name of resource_list){
        var cube = name_to_cube[resource_name];
        var neighbors:string[] = terraform_json[resource_name].next;
        if(neighbors){ //if this field exists
            for(const neighbor_name of neighbors){
            	var neighbor_cube = name_to_cube[neighbor_name];
                cube.userData.edges_out.push(neighbor_cube);
                neighbor_cube.userData.edges_in.push(cube);
                //draw the edge
                var cubepos = cube.position;
                var npos = neighbor_cube.position;
                var direction = npos.clone().sub(cubepos);
                var length = direction.length();
                const cone_length = 0.5;
                var arrow = new THREE.ArrowHelper(
                	direction.normalize(),
                	cubepos,
              		length-cone_length,
              		0xff0000,
                    cone_length,
                    cone_length/2
                );
                scene.add(arrow);
                cube.userData.arrows_out.push(arrow);
                neighbor_cube.userData.arrows_in.push(arrow);
            }
        }

    }
    var josh = "https://scontent-iad3-1.xx.fbcdn.net/v/t31.0-8/28701384_611205672553420_861063517891691345_o.jpg?_nc_cat=108&_nc_oc=AQkES19skZE56YmLT3a6H6U8xRKrLBB6h_hPjjlzvx8aED3WbZfB5bocBSZMHjgs1T0&_nc_ht=scontent-iad3-1.xx&oh=40bcd73e3df92eb235b5f4e05e5e7beb&oe=5E7A74A1";
    createCube(josh).then(function(cube){
        cube.position.set(0,2,0);
        cube.castShadow = true;
        scene.add(cube);
        obj_list.push(cube);
    }).catch((error:any)=>{
        console.log(error);
    });

    setupRaycasting(camera,scene,obj_list);

}

export function updateSkyColor(scene:THREE.Scene, color:string){
    scene.background = new THREE.Color( color );
    var hexcolor = parseInt(color.replace(/^#/, ''), 16);
    reticleMat.color.setHex(~hexcolor);
}

export function updateGroundColor(color:string){
    var hexcolor = parseInt(color.replace(/^#/, ''), 16);
    groundMat.color.setHex(hexcolor);
}

function createDirLight(scene:THREE.Scene,x:number,y:number,z:number){
    var light = new THREE.DirectionalLight( 0xffffff );
    var helper = new THREE.DirectionalLightHelper( light, 5 );
    scene.add(helper);
    light.position.set( x, y, z );
    light.castShadow = true;
    var shadow_range = 50;
    light.shadow.camera.top = shadow_range;
    light.shadow.camera.bottom = -shadow_range;
    light.shadow.camera.right = shadow_range;
    light.shadow.camera.left = -shadow_range;
    light.shadow.mapSize.set( 4096, 4096 );
    scene.add( light );
}