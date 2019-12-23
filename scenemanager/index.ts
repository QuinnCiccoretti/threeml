import * as THREE from "three";
import {createCube, NodeCube} from 'threeml';
import {setupRaycasting, updateSelectedArrows} from 'dragdrop'

export class SceneManager extends THREE.Scene{
    constructor(tf_json:any){
        super();
        this.tf_json = tf_json;
        this.obj_list = [];
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
        this.camera.position.z = 5;
        
         //add reticle
        this.reticleMat = new THREE.MeshBasicMaterial({ color: ~0x0, opacity: 0.5 });
        var reticle = new THREE.Mesh(
          new THREE.RingBufferGeometry(0.005, 0.01, 15),
          this.reticleMat
        );
        reticle.position.z = -0.5;
        this.camera.add(reticle);
        this.groundMat = new THREE.MeshLambertMaterial( { color: 0xededed } );

        this.createDirLight( new THREE.Vector3(0,6,0) );
        this.createFloor();
        this.updateSkyColor("#ffffff");
        this.make_cubes();
        setupRaycasting(this.camera,this,this.obj_list);

    }
    obj_list:NodeCube[];
    reticleMat:THREE.MeshBasicMaterial;
    groundMat:THREE.MeshLambertMaterial;
    camera:THREE.Camera;
    tf_json:any;
    //some of these may be arbitrarily decided symbols, nothing more
    //assumes all end in .png
    name_to_path:Record<string,string> = {
        "google_compute_instance.vm_instance":"Compute/Compute_Engine",
        "google_compute_network.vpc_network":"Networking/Virtual_Private_Cloud",
        "provider.google":"Extras/Google_Cloud_Platform",
        "google_project.my_project":"Cloud_AI/Cloud_Natural_Language_API"
    }

    createDirLight(position:THREE.Vector3){
        var light = new THREE.DirectionalLight( 0xffffff );
        light.position.copy( position );
        light.castShadow = true;
        var shadow_range = 40;
        light.shadow.camera.top = shadow_range;
        light.shadow.camera.bottom = -shadow_range;
        light.shadow.camera.right = shadow_range;
        light.shadow.camera.left = -shadow_range;
        light.shadow.mapSize.set( 4096, 4096 );
        this.add( light );
    }
    createFloor(){
        //floor plane
        var floorsize = 100;
        var groundGeo = new THREE.PlaneBufferGeometry( floorsize, floorsize );
        var ground = new THREE.Mesh( groundGeo, this.groundMat );
        ground.position.y = -1.6;
        ground.rotation.x = - Math.PI / 2;
        ground.receiveShadow = true;
        this.add(ground);

        var gridHelper = new THREE.GridHelper( 10, 10 );
        gridHelper.position.set(0,-1.6,0);
        this.add( gridHelper );
   
    }
    updateScene(){
        updateSelectedArrows(this.camera);
    }
    path_to_all_icons:string = "img/gcp_icons/";
    get_iconpath_from_resourcename(name:string): string{
        name = name.trim();
        var iconpath:string = this.name_to_path[name];
        if(iconpath && name){
            return this.path_to_all_icons + iconpath + ".png"
        }
        else if(name){
            return this.path_to_all_icons + "Extras/Generic_GCP.png"
        }
        return "";
    }
    updateSkyColor(color:string){
        this.background = new THREE.Color( color );
        var hexcolor = parseInt(color.replace(/^#/, ''), 16);
        this.reticleMat.color.setHex(~hexcolor);
    }
    updateGroundColor(color:string){
        var hexcolor = parseInt(color.replace(/^#/, ''), 16);
        this.groundMat.color.setHex(hexcolor);
    }
    async make_cubes(){
        var name_to_cube:Record<string,NodeCube> = {};
        var gvid_to_cube:Record<number,NodeCube> = {};

        // gvid_to_cube[
        const resource_list = this.tf_json.objects;
        //start at one to skip root node
        for(var i = 1; i < resource_list.length; i++){
            var curr_resource = resource_list[i];
            var resource_name = curr_resource.name.replace("[root]",'').trim();

            var icon_path:string = this.get_iconpath_from_resourcename(resource_name);
            var cube = await createCube(icon_path);
            cube.position.set(Math.random()*10, Math.random()*10, Math.random()*10);
            this.add(cube);
            this.obj_list.push(cube); //insert into our "graph"
            name_to_cube[resource_name] = cube;
            gvid_to_cube[curr_resource._gvid] = cube;

        }
        const edges = this.tf_json.edges;
        for(const edge of edges){
            var tail_cube = gvid_to_cube[edge.tail];
            var head_cube = gvid_to_cube[edge.head];
            tail_cube.edges_out.push(head_cube);
            head_cube.edges_in.push(tail_cube);
            //draw the edge
            var cubepos = tail_cube.position;
            var npos = head_cube.position;
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
            this.add(arrow);
            tail_cube.arrows_out.push(arrow);
            head_cube.arrows_in.push(arrow);
                            
        }
        var josh = "https://scontent-iad3-1.xx.fbcdn.net/v/t31.0-8/28701384_611205672553420_861063517891691345_o.jpg?_nc_cat=108&_nc_oc=AQkES19skZE56YmLT3a6H6U8xRKrLBB6h_hPjjlzvx8aED3WbZfB5bocBSZMHjgs1T0&_nc_ht=scontent-iad3-1.xx&oh=40bcd73e3df92eb235b5f4e05e5e7beb&oe=5E7A74A1";
        var joshcube = await createCube(josh);
        joshcube.position.set(0,2,0);
        joshcube.castShadow = true;
        this.add(joshcube);
        this.obj_list.push(joshcube);
        

    }

}