import * as THREE from 'three';
import { FBXLoader } from 'three-stdlib';

import RingTop from '../static/models/Ring_Top_fixed.fbx'
import RingBottom from '../static/models/Ring_Bottom.fbx'
import SRingTop from '../static/models/SilverRing1.fbx'
import SRingBottom from '../static/models/SilverRing2.fbx'
import DRingTop from '../static/models/DetailedRing1.fbx'
import DRingBottom from '../static/models/DetailedRing2.fbx'
import NRingTop from '../static/models/NiceRing1.fbx'
import NRingBottom from '../static/models/NiceRing2.fbx'
import Ring2Top from '../static/models/Ring_2Top.fbx'
import Ring2Bottom from '../static/models/Ring_2Bottom.fbx'
import Ring3Top from '../static/models/Ring_3Top.fbx'
import Ring3Bottom from '../static/models/Ring_3Bottom.fbx'
import Ring4Top from '../static/models/Ring_4Top.fbx'
import Ring4Bottom from '../static/models/Ring_4Bottom.fbx'
import Ring5Top from '../static/models/Ring_5Top.fbx'
import Ring5Bottom from '../static/models/Ring_5Bottom.fbx'

import HAND from '../static/models/FixedAgainHand.fbx'


const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0));
}

let down, up, move

const setUp = () => {

    if(isTouchDevice()) {
        down = 'touchstart'
        up = 'touchend'
        move = 'touchmove'
    } else if (!isTouchDevice()) {
        down = 'mousedown'
        up = 'mouseup'
        move = 'mousemove'
    }
}

setUp()

const initThreeApp = (canvas, w, h, string) => {
    const renderer = new THREE.WebGLRenderer({
        canvas, 
        aplha: true,
        antialias: true,
    })

    const fov = 75
    const near = 0.01
    const far = 1000
    const threeCamera = new THREE.PerspectiveCamera(fov, w/h, near, far)
    threeCamera.position.z = 2;

    const scene = new THREE.Scene()

    const resize = () => {
        const width = w
        const height = h 

        renderer.setSize(width, height)
        renderer.setPixelRatio(window.pixelRatio)
        renderer.setClearColor( 0x000000, 0);

        if(threeCamera.isPerspectiveCamera) {
            threeCamera.aspect = width / height
        }
        threeCamera.updateProjectionMatrix()
    }

    const render = () => {
        renderer.render(scene, threeCamera)
    }
    
    resize()
    render()

    //light 
    const color = 0xFFFFFF
    const intensity = 1
    const light = new THREE.DirectionalLight(color, intensity)
    light.position.set(-1, 2, 4)
    scene.add(light)

    const loader = new FBXLoader()

    if(string === 'GoldRing') {
        loader.load(RingTop, (object) => {
        scene.add(object)
        object.name = 'RingTop'
        object.scale.set(.05,.05,.05)
        })

        loader.load(RingBottom, (object) => {
        scene.add(object)
        object.name = 'RingBottom'
        object.scale.set(.05,.05,.05)
        })
    } else if (string === 'SilverRing') {
        loader.load(SRingTop, (object) => {
            scene.add(object)
            object.name = 'RingTop'
            object.scale.set(.05,.05,.05)
            })
    
            loader.load(SRingBottom, (object) => {
            scene.add(object)
            object.name = 'RingBottom'
            object.scale.set(.05,.05,.05)
            })
    }
    else if (string === 'TiffanyRing') {
        loader.load(SRingTop, (object) => {
            scene.add(object)
            object.name = 'RingTop'
            object.scale.set(.05,.05,.05)
            })
    
            loader.load(SRingBottom, (object) => {
            scene.add(object)
            object.name = 'RingBottom'
            object.scale.set(.05,.05,.05)
            })
    } else if (string === 'DetailedRing') {
            loader.load(DRingTop, (object) => {
                scene.add(object)
                object.name = "RingTop"
                object.scale.set(.05, .05, .05)

            loader.load(DRingBottom, (object) => {
                scene.add(object)
                object.name = 'RingBottom'
                object.scale.set(.05,.05,.05)
                })
        })

    }else if (string === 'NiceRing') {    // NiceRing Model Start
        loader.load(NRingTop, (object) => {
            scene.add(object)
            object.name = "RingTop"
            object.scale.set(.05, .05, .05)

        loader.load(NRingBottom, (object) => {
            scene.add(object)
            object.name = 'RingBottom'
            object.scale.set(.05,.05,.05)
            })
        })
    }else if (string === 'Ring_2') {    // Ring2 Model Start
        loader.load(Ring2Top, (object) => {
            scene.add(object)
            object.name = "RingTop"
            object.scale.set(.05, .05, .05)

        loader.load(Ring2Bottom, (object) => {
            scene.add(object)
            object.name = 'RingBottom'
            object.scale.set(.05,.05,.05)
            })
        })
    }else if (string === 'Ring_3') {    // Ring3 Model Start
        loader.load(Ring3Top, (object) => {
            scene.add(object)
            object.name = "RingTop"
            object.scale.set(.05, .05, .05)

        loader.load(Ring3Bottom, (object) => {
            scene.add(object)
            object.name = 'RingBottom'
            object.scale.set(.05,.05,.05)
            })
        })
    }else if (string === 'Ring_4') {    // Ring4 Model Start
        loader.load(Ring4Top, (object) => {
            scene.add(object)
            object.name = "RingTop"
            object.scale.set(.05, .05, .05)

        loader.load(Ring4Bottom, (object) => {
            scene.add(object)
            object.name = 'RingBottom'
            object.scale.set(.05,.05,.05)
            })
        })
    }else if (string === 'Ring_5') {    // Ring5 Model Start
        loader.load(Ring5Top, (object) => {
            scene.add(object)
            object.name = "RingTop"
            object.scale.set(.05, .05, .05)

        loader.load(Ring5Bottom, (object) => {
            scene.add(object)
            object.name = 'RingBottom'
            object.scale.set(.05,.05,.05)
            })
        })
    }
    else if(string === 'hand') {
        loader.load(HAND, (object) => {
            scene.add(object)
            object.name = 'Hand'
            console.log(object)
            object.scale.set(.1, .1, .1)
            let skeleton = new THREE.SkeletonHelper(object);
            skeleton.visible = true;
            scene.add(skeleton);
        })
    }

    var mouseDown = false,
        mouseX = 0;

    const onMouseMove = (evt) => {
        if(!mouseDown) {
            return
        }

        evt.preventDefault()
        
        if(!isTouchDevice()) {
           var deltaX = evt.clientX - mouseX;
            mouseX = evt.clientX
            rotateModel(deltaX)
        } else if (isTouchDevice()) {
            deltaX = evt.touches[0].clientX - mouseX;
            mouseX = evt.touches[0].clientX
            if(!isNaN(deltaX))
            rotateModel(deltaX)
        }
    }

    const onMouseDown = (evt) => {
        evt.preventDefault()

        mouseDown = true
        if(isTouchDevice()) {
            mouseX = evt.clientX
        } else if (isTouchDevice()) {
            console.log("touchDown")
            mouseX = evt.touches[0].clientX
        }
        
    }

    const onMouseUp = (evt) => {
        evt.preventDefault()

        mouseDown = false
    }

    const addMouseHandler = (canvas) => {
        canvas.addEventListener(move, (e) => {
            onMouseMove(e)
        }, false)
        canvas.addEventListener(down, (e) => {
            onMouseDown(e)
        }, false)
        canvas.addEventListener(up, (e) => {
            onMouseUp(e)
        }, false)
    }


    const rotateModel = (deltaX) => {
        const handModel = scene.getObjectByName('Hand')
        handModel.rotation.y += deltaX / 100
    }

    addMouseHandler(canvas)

    return {
        renderer,
        threeCamera,
        scene,
        resize,
        render,
    }
}

export default initThreeApp;