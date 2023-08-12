// canonical-face-model.obj source:
// https://github.com/google/mediapipe/tree/master/mediapipe/modules/face_geometry/data
//
// this script parse the model data. To run: node face-data-generator.js

import * as fs from "fs";
const text = fs.readFileSync("./canonical-full0body-mesh.obj", "utf8");
const textByLine = text.split("\n")

const positions = [];
const uvs = [];
const faces = [];
const uvIndexes = [];

textByLine.forEach((line) => {
  const ss = line.split(" ");
  if (ss[0] === 'f') {
    for (let i = 1; i <= 3; i++) {
      const [index, uvIndex] = ss[i].split("/");
      uvIndexes[parseInt(uvIndex)-1] = parseInt(index)-1;
    }
  }
});

let uvCount = 0;
textByLine.forEach((line) => {
  const ss = line.split(" ");
  if (ss[0] === 'v') {
    positions.push([ parseFloat(ss[1]),parseFloat(ss[2]),parseFloat(ss[3]) ]);
  } else if (ss[0] === 'vt') {
    uvs[uvIndexes[uvCount++]] = [ parseFloat(ss[1]),parseFloat(ss[2]) ];
  } else if (ss[0] === 'f') {
    faces.push(parseInt(ss[1].split("/")[0]-1),parseInt(ss[2].split("/")[0]-1),parseInt(ss[3].split("/")[0])-1);
  }
});

// important landmarks for computing transformation
// pairs of [positionIndex, weight]

// how to compute the landmark basis:
// 1. compute the average position of the landmark
// 2. compute the average position of the face
// 3. compute the vector from the face center to the landmark
// 4. normalize the vector
// 5. compute the dot product of the vector and the face normal
// 6. if the dot product is negative, flip the vector
// 7. compute the distance from the face center to the landmark
// 8. normalize the vector
// 9. multiply the vector by the distance
// 10. the vector is the landmark basis


const landmarkBasis = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]

let output = "";
output += "//This is a generated file\n";
output += "const positions=" + JSON.stringify(positions) + ";\n";
output += "const uvs=" + JSON.stringify(uvs) + ";\n";
output += "const faces=" + JSON.stringify(faces) + ";\n";
output += "const landmarkBasis=" + JSON.stringify(landmarkBasis) + ";\n";

output += `
export {
  positions, uvs, faces, landmarkBasis
}
`

fs.writeFileSync("./face-data.js", output);
