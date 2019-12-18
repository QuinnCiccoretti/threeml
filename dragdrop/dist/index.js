"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = __importStar(require("three"));
var raycaster = new THREE.Raycaster();
function setupRaycasting(camera, scene, obj_list) {
    var parent;
    // actually onclick lmao
    function getIntersections() {
        var cam_mat = new THREE.Matrix4();
        cam_mat.identity().extractRotation(camera.matrixWorld);
        raycaster.ray.origin.setFromMatrixPosition(camera.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(cam_mat);
        return raycaster.intersectObjects(obj_list);
    }
    var onMouseDown = function () {
        var intersections = getIntersections();
        if (intersections.length > 0) {
            var intersection = intersections[0];
            var tempMatrix = new THREE.Matrix4();
            tempMatrix.getInverse(camera.matrixWorld);
            var object = intersection.object;
            parent = object.parent;
            console.log("parent");
            console.log(parent);
            console.log("v4");
            if (parent) {
                var parMatrix = new THREE.Matrix4();
                parMatrix.getInverse(parent.matrixWorld);
                parent.remove(object);
                // scene.add(object);
                object.matrix.premultiply(parMatrix).premultiply(tempMatrix);
            }
            object.matrix.decompose(object.position, object.quaternion, object.scale);
            camera.add(object);
            camera.userData.selected = object;
        }
    };
    // actually onmouseup lmao
    var onMouseUp = function () {
        if (camera.userData.selected) {
            var object = camera.userData.selected;
            object.matrix.premultiply(camera.matrixWorld);
            object.matrix.decompose(object.position, object.quaternion, object.scale);
            camera.remove(object); //remove from camera
            if (parent) {
                scene.add(object);
                parent.add(object); //add back to scene
                parent = null;
            }
            camera.userData.selected = null;
        }
    };
    document.body.addEventListener('mousedown', onMouseDown, false);
    document.body.addEventListener('mouseup', onMouseUp, false);
}
exports.setupRaycasting = setupRaycasting;
