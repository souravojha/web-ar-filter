import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'

//Mediapipe files
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';

// Images
import HXRC from '../static/logos/HXRC_logo.png'
import HandPicture from '../static/handpicture.png'

//Three
import * as THREE from 'three';
import initThreeApp from '../hooks/THREEHooks';

//FBX loaders for model loading
import { FBXLoader } from 'three-stdlib';

// 3D models
import SilverRing from '../static/models/SilverRing.fbx'
import TiffanyRing from '../static/models/TiffanyRing.fbx'
import GoldRing from '../static/models/GoldRing.fbx'
import DetailedRing from '../static/models/DetailedRing.fbx'

//All css files
import '../styles/loading.css'
import '../styles/menuContainer.css';
import '../styles/canvas.css'

const RingTracking = ({ ring }) => {
    const string = ring.ring
    const fingerString = ring.fingerSelected
    const [loaded, setLoaded] = useState(false);
    const [fingerSelected, setFinger] = useState("")
    const [ringInScene, setRing] = useState()
    const [bone, setBone] = useState()
    const [ringSelected, setSelectedRing] = useState()
    const [ringString, setRingString] = useState("")
    const [app, setApp] = useState()

    const calculateDistance = (a, ab, b, ba) => {
        const distance = (Math.sqrt(((a - ab) ** 2) + ((b - ba))) / 5).toFixed(2);
        return distance
    }

    // Add the ring on the finger
    const addRingToFinger = (threeApp, string, model) => {
        if (bone !== undefined) {
            bone.remove(ringInScene)
        }
        console.log("Selected Finger: ", string)
      const hand = threeApp.scene.getObjectByName('Hand')
      console.log("Hand :", hand);
    
      const loader = new FBXLoader()
      loader.load(model, (object)=> {
        object.name = "Ring"
        object.scale.set(.3,.3,.3)
        if(string === "Thumb_TIP") {
          object.rotation.y = -8
        }
        hand.children[1].skeleton.getBoneByName(string).add(object)
        setRing(object)
        setBone(hand.children[1].skeleton.getBoneByName(string))
      })
    }

    //Update the ring on the finger
    const upDateRing = ( RING ) => {
        if(ringInScene !== ringSelected) {
          console.log(fingerSelected, ringSelected)
          addRingToFinger(app, fingerSelected, RING)
        } else {
          console.log("same ring in scene already")
        }
    }
        var finger
        var point

        switch (fingerString) {
            case 'Index_PIP':
                finger = 5
                point = 6
                break
            case 'Middle_PIP':
                finger = 9
                point = 10
                break
            case 'Ring_PIP':
                finger = 13
                point = 14
                break
            case 'Pinky_PIP':
                finger = 17
                point = 18
                break
            case 'Thumb_PIP':
                finger = 2
                point = 3
                break

            default:
                finger = 5
                point = 6
        }

        useEffect(() => {
            window.addEventListener('resize', () => {
                window.location.reload();
            });

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            var videoElement = document.getElementsByClassName('input_video')[0]

            const getVideo = (string) => {
                if (string === "height") {
                    return videoElement.offsetHeight;
                } else if (string === "width") {
                    return videoElement.offsetWidth;
                }
            }
            var threeCanvasElement = document.getElementsByClassName('three_output')[0]
            
            var threeApp;
            const onResults = (results) => {
                if (threeApp === undefined) {
                    threeApp = initThreeApp(threeCanvasElement, getVideo("width"), getVideo("height"), string)
                    return threeApp
                }
                setTimeout(() => {
                    const canvasElement = document.getElementsByClassName('output_canvas')[0]
                    canvasElement.setAttribute("style", "height:" + videoElement.offsetHeight + "px; width:" + videoElement.offsetWidth + "px;")
                    const canvasCtx = canvasElement.getContext('2d')
                    const modelTop = threeApp.scene.getObjectByName('RingTop')
                    const modelBottom = threeApp.scene.getObjectByName('RingBottom')
                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

                    if (results.multiHandLandmarks.length > 0) {
                        if (document.querySelector('.handpicture') !== null) {
                            document.querySelector(".handpicture").style.display = 'none'
                            threeApp.scene.visible = true;
                        }
                    } else if (results.multiHandLandmarks.length === 0) {
                        if (document.querySelector('.handpicture') !== null) {
                            document.querySelector(".handpicture").style.display = 'block'
                            threeApp.scene.visible = false;
                        }
                    }
                    if (results.multiHandLandmarks && results.multiHandedness) {
                        for (let index = 0; index < results.multiHandLandmarks.length; index++) {
                            const classification = results.multiHandedness[index];
                            const isRightHand = classification.label === 'Right';
                            const landmarks = results.multiHandLandmarks[index];

                            for (let i = 0; i < landmarks.length; i++) {
                                landmarks[i].visibility = false;
                            }

                            const { x, y, z } = landmarks[5];

                            const a = landmarks[finger].x
                            const b = landmarks[finger].y

                            const ax = landmarks[17].x

                            const bx = landmarks[point].x
                            const by = landmarks[point].y

                            let vec = new THREE.Vector3()
                            let pos = new THREE.Vector3()

                            vec.set(
                                a * 2 - 1,
                                -((b + by) / 2) * 2 + 1,
                                .5
                            );

                            vec.unproject(threeApp.threeCamera);
                            vec.sub(threeApp.threeCamera.position).normalize();
                            let distance = -threeApp.threeCamera.position.z / vec.z;
                            pos.copy(threeApp.threeCamera.position).add(vec.multiplyScalar(distance));

                            modelTop.position.x = pos.x
                            modelTop.position.y = pos.y

                            modelBottom.position.x = pos.x
                            modelBottom.position.y = pos.y

                            if (x < ax && isRightHand) {
                                modelBottom.visible = true
                                modelTop.visible = false
                                if (modelBottom.scale !== (calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by))) {
                                    modelBottom.scale.set(calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by))
                                }

                            } else if (x > ax && isRightHand) {
                                modelTop.visible = true
                                modelBottom.visible = false
                                if (modelTop.scale !== (calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by))) {
                                    modelTop.scale.set(calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by))
                                }
                            }

                            if (x < ax && !isRightHand) {
                                modelBottom.visible = false
                                modelTop.visible = true
                                if (modelTop.scale !== (calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by))) {
                                    modelTop.scale.set(calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by))
                                }

                            } else if (x > ax && !isRightHand) {
                                modelTop.visible = false
                                modelBottom.visible = true
                                if (modelBottom.scale !== (calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by))) {
                                    modelBottom.scale.set(calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by), calculateDistance(a, bx, b, by))
                                }
                            }


                            drawConnectors(
                                canvasCtx, landmarks, HAND_CONNECTIONS,
                                { color: isRightHand ? '#FFFFFF' : '#00FFF7', lineWidth: 5 });

                            drawLandmarks(canvasCtx, landmarks, {
                                color: isRightHand ? '#FFFFFF' : '#00FFF7',
                                fillColor: isRightHand ? '#00FFF7' : '#FFFFFF',
                                lineWidth: 2
                            });
                        }
                    }
                    canvasCtx.restore();
                }, (1000 / 60))
            }
            const hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            hands.onResults(onResults);
            var camera = new Camera(videoElement, {
                onFrame: async () => {
                    await hands.send({ image: videoElement });
                    setLoaded(true)
                    run();
                },
                facingMode: 'environment',
                height: { ideal: windowHeight },
            });
            const run = async () => {
                threeApp.render()
                requestAnimationFrame(run)
            }
            camera.start();
        }, [string])

        return (
            <>
                <Link className="backButton" to="/">⏮</Link>
                <div className="container">
                    <video className="input_video"></video>
                    <canvas className="output_canvas"></canvas>
                    <canvas className="three_output"></canvas>
                    {loaded && <img className="handpicture" src={HandPicture} alt="handpicture" />}
                </div>
                {!loaded && <img className="loadingLogo" alt="loadingLogo" src={HXRC} />}
            </>

        )
    }

    export default RingTracking