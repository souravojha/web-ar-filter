/* Copyright 2023 The MediaPipe Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  FilesetResolver,
  FaceLandmarker,
  PoseLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

/**
 * Returns the world-space dimensions of the viewport at `depth` units away from
 * the camera.
 */
function getViewportSizeAtDepth(camera, depth) {
  const viewportHeightAtDepth =
    2 * depth * Math.tan(THREE.MathUtils.degToRad(0.5 * camera.fov));
  const viewportWidthAtDepth = viewportHeightAtDepth * camera.aspect;
  return new THREE.Vector2(viewportWidthAtDepth, viewportHeightAtDepth);
}

/**
 * Creates a `THREE.Mesh` which fully covers the `camera` viewport, is `depth`
 * units away from the camera and uses `material`.
 */
function createCameraPlaneMesh(camera, depth, material) {
  if (camera.near > depth || depth > camera.far) {
    console.warn("Camera plane geometry will be clipped by the `camera`!");
  }
  const viewportSize = getViewportSizeAtDepth(camera, depth);
  const cameraPlaneGeometry = new THREE.PlaneGeometry(
    viewportSize.width,
    viewportSize.height
  );
  cameraPlaneGeometry.translate(0, 0, -depth);

  return new THREE.Mesh(cameraPlaneGeometry, material);
}

class BasicScene {
  lastTime = 0;
  callbacks = [];

  constructor() {
    this.height = window.innerHeight; // Initialize the canvas with the same aspect ratio as the video input
    // this.width = (this.height * 1280) / 720;
    this.width = window.innerWidth;
    this.scene = new THREE.Scene();  // Set up the Three.js scene, camera, and renderer
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      0.01,
      5000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    THREE.ColorManagement.legacy = false;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(this.renderer.domElement);

    // Set up the basic lighting for the scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    this.scene.add(directionalLight);

    // Set up the camera position and controls
    this.camera.position.z = 0;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    let orbitTarget = this.camera.position.clone();
    orbitTarget.z -= 5;
    this.controls.target = orbitTarget;
    this.controls.update();

    // Add a video background
    const video = document.getElementById("video");
    const inputFrameTexture = new THREE.VideoTexture(video);
    if (!inputFrameTexture) {
      throw new Error("Failed to get the 'input_frame' texture!");
    }
    inputFrameTexture.encoding = THREE.sRGBEncoding;
    const inputFramesDepth = 500;
    const inputFramesPlane = createCameraPlaneMesh(
      this.camera,
      inputFramesDepth,
      new THREE.MeshBasicMaterial({ map: inputFrameTexture })
    );
    this.scene.add(inputFramesPlane);

    // Render the scene
    this.render();

    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderer.render(this.scene, this.camera);
  }

  render(time = this.lastTime) {
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;
    // Call all registered callbacks with deltaTime parameter
    for (const callback of this.callbacks) {
      callback(delta);
    }
    // Render the scene
    this.renderer.render(this.scene, this.camera);
    // Request next frame
    requestAnimationFrame((t) => this.render(t));
  }
}

class Avatar {
  loader = new GLTFLoader();
  morphTargetMeshes = [];

  constructor(url, scene) {
    this.url = url;
    this.scene = scene;
    this.loadModel(this.url);
  }

  loadModel(url) {
    this.url = url;
    this.loader.load(  // URL of the model you want to load
      url, // Callback when the resource is loaded
      (gltf) => {
        if (this.gltf) {  // Reset GLTF and morphTargetMeshes if a previous model was loaded.
          this.gltf.scene.remove();
          this.morphTargetMeshes = [];
        }
        this.gltf = gltf;
        this.scene.add(gltf.scene);
        this.init(gltf);
      }, // Called while loading is progressing
      (progress) =>
        console.log(
          "Loading model...",
          100.0 * (progress.loaded / progress.total),
          "%"
        ), // Called when loading has errors
      (error) => console.error(error)
    );
  }

  // Get all the Bones in Array from the model if they have bones
  getBones() {
    const bones = [];
    if (this.root) {
      this.root.traverse((object) => {
        if (object.isBone) {
          bones.push(object);
        }
      });
    }
    return bones;
  }

  //For leftShoulder movement using the poseLandmark data
  moveLeftShoulderWithPoseLandmarks(landmarks) {
    const leftShoulderIndex = 11; // Index for the left shoulder landmark, adjust if needed
    if (landmarks && landmarks.length > 0 && landmarks[0].length > leftShoulderIndex) {
      const leftShoulderLandmark = landmarks[0][leftShoulderIndex];
      const avatarBones = this.getBones();
      const leftShoulderBone = avatarBones.find(bone => bone.name === 'LeftShoulder');

      if (leftShoulderLandmark && leftShoulderBone) {
        // Calculate the new position for the left shoulder bone based on the landmark
        const newPosition = new THREE.Vector3(
          leftShoulderLandmark.x,  // X coordinate of the landmark
          leftShoulderLandmark.y,  // Y coordinate of the landmark
          leftShoulderLandmark.z   // Z coordinate of the landmark
        );

        // Set the new position of the left shoulder bone
        leftShoulderBone.position.copy(newPosition);
      }
    }
  }
  //For leftShoulder movement using the poseLandmark data
  moveRightShoulderWithPoseLandmarks(landmarks) {
    const rightShoulderIndex = 12; // Index for the RIght shoulder landmark, adjust if needed
    if (landmarks && landmarks.length > 0 && landmarks[0].length > rightShoulderIndex) {
      const RightShoulderLandmark = landmarks[0][rightShoulderIndex];
      const avatarBones = this.getBones();
      const RightShoulderBone = avatarBones.find(bone => bone.name === 'RightShoulder');

      if (RightShoulderLandmark && RightShoulderBone) {
        // Calculate the new position for the left shoulder bone based on the landmark
        const newPosition = new THREE.Vector3(
          RightShoulderLandmark.x,  // X coordinate of the landmark
          RightShoulderLandmark.y,  // Y coordinate of the landmark
          RightShoulderLandmark.z   // Z coordinate of the landmark
        );

        // Set the new position of the left shoulder bone
        RightShoulderBone.position.copy(newPosition);
      }
    }
  }

  init(gltf) {
    gltf.scene.traverse((object) => {
      // Register first bone found as the root
      if (object.isBone && !this.root) {
        this.root = object;
        console.log(object);
      }
      // Return early if no mesh is found.
      if (!object.isMesh) {
        console.warn(`No mesh found`);
        return;
      }          

      const mesh = object;
      // Reduce clipping when model is close to camera.
      mesh.frustumCulled = false;

      // Return early if mesh doesn't include morphable targets
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
        // console.warn(`Mesh ${mesh.name} does not have morphable targets`);
        return;
      }
      this.morphTargetMeshes.push(mesh);
    });
  }

  updateBlendshapes(blendshapes) {
    for (const mesh of this.morphTargetMeshes) {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
        // console.warn(`Mesh ${mesh.name} does not have morphable targets`);
        continue;
      }
      for (const [name, value] of blendshapes) {
        if (!Object.keys(mesh.morphTargetDictionary).includes(name)) {
          // console.warn(`Model morphable target ${name} not found`);
          continue;
        }

        const idx = mesh.morphTargetDictionary[name];
        mesh.morphTargetInfluences[idx] = value;
      }
    }
  }

  /**
   * Apply a position, rotation, scale matrix to current GLTF.scene
   * @param matrix
   * @param matrixRetargetOptions
   * @returns
   */
  applyMatrix(matrix, matrixRetargetOptions) {
    const { decompose = false, scale = 1 } = matrixRetargetOptions || {};
    if (!this.gltf) {
      return;
    }
    // Three.js will update the object matrix when it render the page
    // according the object position, scale, rotation.
    // To manually set the object matrix, you have to set autoupdate to false.
    matrix.scale(new THREE.Vector3(scale, scale, scale));
    this.gltf.scene.matrixAutoUpdate = false;
    // Set new position and rotation from matrix
    this.gltf.scene.matrix.copy(matrix);
  }

  /**
   * Takes the root object in the avatar and offsets its position for retargetting.
   * @param offset
   * @param rotation
   */
  offsetRoot(offset, rotation) {
    if (this.root) {
      this.root.position.copy(offset);
      if (rotation) {
        let offsetQuat = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rotation.x, rotation.y, rotation.z)
        );
        this.root.quaternion.copy(offsetQuat);
      }
    }
  }
}

/* Function for calculating the distance between two shoulder points */
function calculateDistance(point1, point2) {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  const dz = point2[2] - point1[2];

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}


let faceLandmarker;
let poseLandmarker;
let video;
const videoHeight = "360px";
const videoWidth = "480px";

const Scene = new BasicScene();
// "https://assets.codepen.io/9177687/raccoon_head.glb",
const avatar = new Avatar(
  // "/raccoon_head.glb",
  "/Model-Detailing.glb",
  Scene.scene
);

function detectFaceLandmarks(time) {
  if (!faceLandmarker) {
    return;
  }
  //For face landmarks
  const landmarks = faceLandmarker.detectForVideo(video, time);

  // Apply transformation
  const transformationMatrices = landmarks.facialTransformationMatrixes;
  if (transformationMatrices && transformationMatrices.length > 0) {
    let matrix = new THREE.Matrix4().fromArray(transformationMatrices[0].data);
    // Example of applying matrix directly to the avatar
    avatar.applyMatrix(matrix, { scale: 40 });
  }

  // Apply Blendshapes
  const blendshapes = landmarks.faceBlendshapes;
  if (blendshapes && blendshapes.length > 0) {
    const coefsMap = retarget(blendshapes);
    avatar.updateBlendshapes(coefsMap);
  }
}
const createCube = (coordinate = { x: 0, y: 0, z: 10 }, name) => {
  console.log("coordinate", coordinate);
  const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial); // Cube mesh
  cube.position.set(coordinate.x, coordinate.y, coordinate.z);
  cube.name = name;
  Scene.scene.add(cube);
};

const maxY = -5.5,
  minY = 5.5;
const maxX = 10,
  minX = -10;

createCube(
  {
    x: deNormalize(0),
    y: deNormalize(0, minY, maxY),
    z: deNormalize(0, minY, maxY),
  },
  "left-cube"
);
createCube(
  {
    x: deNormalize(1),
    y: deNormalize(1, minY, maxY),
    z: deNormalize(1, minY, maxY),
  },
  "right-cube"
);

/* Accessing all  the bones */
// const bones = avatar.getBones();
// for (const bone of bones) {
//   console.log("Bone Name : ", bone.name);
// }

//Function for Cube place
function placeCubeOnShoulder(shoulderLandmark, name) {
  const cube = Scene.scene.getObjectByName(name); // Get the cube mesh

  if (!cube) {
    console.log("Cube not found", name);
    return;
  }

  cube.position.set(
    deNormalize(shoulderLandmark.x, minX, maxX),
    deNormalize(shoulderLandmark.y, minY, maxY),
    deNormalize(shoulderLandmark.z, minX, minY)
  );

  console.log("cube.position", name, cube.position, shoulderLandmark);
}

//Function for Pose detection
function detectPoseLandmarks(time) {
  if (!poseLandmarker) {
    console.log("Wait for poseLandmarker to load before clicking!");
    return;
  }

  // Accessing all  the bones
  const bones = avatar.getBones();
  for (const bone of bones) {
    console.log("Bone Name : ", bone.name);
  }

  // Assuming poseLandmarker.detectForVideo is a valid function call
  poseLandmarker.detectForVideo(video, time, (result) => {
    const landmarks = result.landmarks;

    /* Try to move the shoulder but not moving but detecting the 3D model shoulder*/
    // if (landmarks) {
    //   avatar.moveLeftShoulderWithPoseLandmarks(landmarks);
    //   console.log("moving");
    // }

    if (landmarks && landmarks.length > 0) {
      const leftShoulder = landmarks[0][11]; // Adjust the index if needed
      const rightShoulder = landmarks[0][12]; // Adjust the index if needed

      /* Try to scale the model depending upon the Shoulder position*/
      // if (leftShoulder && rightShoulder) {
      //   const shoulderDistance = calculateDistance(leftShoulder, rightShoulder);
      //   const scaleFactor = shoulderDistance * 0.01; // Adjust the factor as needed
      //   avatar.scaleModel(scaleFactor);
      // }

      if (leftShoulder) {
        // Call the function to place the cube on the shoulder
        placeCubeOnShoulder(leftShoulder, "left-cube");

        // Move the LeftShoulder bone using pose landmark data
        avatar.moveLeftShoulderWithPoseLandmarks(landmarks);
      }
      if (rightShoulder) {
        // Call the function to place the cube on the shoulder
        placeCubeOnShoulder(rightShoulder, "right-cube");

        // Move the LeftShoulder bone using pose landmark data
        avatar.moveRightShoulderWithPoseLandmarks(landmarks);
      } else {
        console.log("Left shoulder landmark not detected.");
      }
    } else {
      console.log("No landmarks detected.");
    }
  });
}

function retarget(blendshapes) {
  const categories = blendshapes[0].categories;
  let coefsMap = new Map();
  for (let i = 0; i < categories.length; ++i) {
    const blendshape = categories[i];
    // Adjust certain blendshape values to be less prominent.
    switch (blendshape.categoryName) {
      case "browOuterUpLeft":
        blendshape.score *= 1.2;
        break;
      case "browOuterUpRight":
        blendshape.score *= 1.2;
        break;
      case "eyeBlinkLeft":
        blendshape.score *= 1.2;
        break;
      case "eyeBlinkRight":
        blendshape.score *= 1.2;
        break;
      default:
    }
    coefsMap.set(categories[i].categoryName, categories[i].score);
  }
  return coefsMap;
}

function onVideoFrame(time) {
  detectPoseLandmarks(time); //detectFaceLandmarks(time);
  video.requestVideoFrameCallback(onVideoFrame); // Re-register the callback to be notified about the next frame.
}

// Stream webcam into landmarker loop (and also make video visible)
async function streamWebcamThroughFaceLandmarker() {
  video = document.getElementById("video");

  function onAcquiredUserMedia(stream) {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
    };
  }

  try {
    const evt = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: 1280,
        height: 720,
      },
    });
    onAcquiredUserMedia(evt);
    video.requestVideoFrameCallback(onVideoFrame);
  } catch (e) {
    console.error(`Failed to acquire camera feed: ${e}`);
  }
}

async function runDemo() {
  await streamWebcamThroughFaceLandmarker();
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  //For face
  faceLandmarker = await FaceLandmarker.createFromModelPath(
    vision,
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
  );
  await faceLandmarker.setOptions({
    baseOptions: {
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  });

  //For Pose
  poseLandmarker = await PoseLandmarker.createFromModelPath(
    vision,
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
  );

  await poseLandmarker.setOptions({
    baseOptions: {
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    // outputSegmentationMasks: true,
  });

  console.log("Finished Loading MediaPipe Model.");
}

runDemo();

function normalize(value, min = -10, max = 10) {
  return (value - min) / (max - min);
}

function normalizeRotation(value, min = -180, max = 180) {
  return (value - min) / (max - min);
}

function deNormalize(value, min = -10, max = 10) {
  return value * (max - min) + min;
} 