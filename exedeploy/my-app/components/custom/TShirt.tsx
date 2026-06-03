"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Decal, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const DEFAULT_SHIRT_URL = '/models/shirt_baked.glb';

// Preload the default shirt model
useGLTF.preload(DEFAULT_SHIRT_URL);

// Procedural PBR textures for realistic cotton fabric rendering (CLO3D / Marvelous Designer style)
const createRealisticCottonTextures = () => {
  if (typeof window === 'undefined') {
    return { normalMap: null, aoMap: null, roughnessMap: null, displacementMap: null };
  }

  const size = 1024; // 1024x1024 for sharp, high-end details

  // Set up noise generator
  const noiseSize = 256;
  const noiseData = new Float32Array(noiseSize * noiseSize);
  for (let i = 0; i < noiseSize * noiseSize; i++) {
    noiseData[i] = Math.random();
  }

  const getNoise = (x: number, y: number) => {
    const xi = Math.floor(x) % noiseSize;
    const yi = Math.floor(y) % noiseSize;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    const idx = (yy: number, xx: number) => {
      const yVal = (yy + noiseSize) % noiseSize;
      const xVal = (xx + noiseSize) % noiseSize;
      return noiseData[yVal * noiseSize + xVal];
    };

    const aa = idx(yi, xi);
    const ab = idx(yi, xi + 1);
    const ba = idx(yi + 1, xi);
    const bb = idx(yi + 1, xi + 1);

    return aa * (1 - u) * (1 - v) +
      ab * u * (1 - v) +
      ba * (1 - u) * v +
      bb * u * v;
  };

  const fbm = (x: number, y: number, octaves = 4) => {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1.0;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * getNoise(x * frequency, y * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  };

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext('2d');
  if (!normalCtx) return { normalMap: null, aoMap: null, roughnessMap: null, displacementMap: null };
  const normalImg = normalCtx.createImageData(size, size);
  const normalData = normalImg.data;

  const aoCanvas = document.createElement('canvas');
  aoCanvas.width = size;
  aoCanvas.height = size;
  const aoCtx = aoCanvas.getContext('2d');
  if (!aoCtx) return { normalMap: null, aoMap: null, roughnessMap: null, displacementMap: null };
  const aoImg = aoCtx.createImageData(size, size);
  const aoData = aoImg.data;

  const roughnessCanvas = document.createElement('canvas');
  roughnessCanvas.width = size;
  roughnessCanvas.height = size;
  const roughnessCtx = roughnessCanvas.getContext('2d');
  if (!roughnessCtx) return { normalMap: null, aoMap: null, roughnessMap: null, displacementMap: null };
  const roughnessImg = roughnessCtx.createImageData(size, size);
  const roughnessData = roughnessImg.data;

  const displacementCanvas = document.createElement('canvas');
  displacementCanvas.width = size;
  displacementCanvas.height = size;
  const displacementCtx = displacementCanvas.getContext('2d');
  if (!displacementCtx) return { normalMap: null, aoMap: null, roughnessMap: null, displacementMap: null };
  const displacementImg = displacementCtx.createImageData(size, size);
  const displacementData = displacementImg.data;

  // Height function defining folds, wrinkles, and micro-imperfections
  const getHeight = (u: number, v: number) => {
    let h = 0;

    // Low-frequency drape folds (gentle waves)
    h += Math.sin(u * 7.5 + v * 4.5) * 0.035;
    h += Math.cos(u * 12.0 - v * 20.0) * 0.025;
    h += Math.sin(u * 4.0) * Math.sin(v * 2.5) * 0.015;

    // Mid-frequency wrinkles / creases
    h += fbm(u * 22, v * 22, 2) * 0.012;

    // High-frequency surface noise for cotton organic texture
    h += fbm(u * 75, v * 75, 2) * 0.004;

    return h;
  };

  // High-frequency thread weave normal pattern (warp & weft threads)
  const weaveFreq = 750;
  const weaveStrength = 0.06;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const u = x / size;
      const v = y / size;

      const eps = 0.0015;
      const hCenter = getHeight(u, v);
      const hRight = getHeight(u + eps, v);
      const hUp = getHeight(u, v + eps);

      const dh_du = (hRight - hCenter) / eps;
      const dh_dv = (hUp - hCenter) / eps;

      const wrinkleScale = 0.07;
      const nxWrinkle = -dh_du * wrinkleScale;
      const nyWrinkle = -dh_dv * wrinkleScale;

      const weaveX = Math.sin(u * weaveFreq) * Math.cos(v * weaveFreq);
      const weaveY = Math.cos(u * weaveFreq) * Math.sin(v * weaveFreq);
      const microNoise = (Math.random() - 0.5) * 0.03;

      let nx = nxWrinkle + (weaveX + microNoise) * weaveStrength;
      let ny = nyWrinkle + (weaveY + microNoise) * weaveStrength;
      let nz = 1.0;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      // Normal map
      normalData[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      normalData[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      normalData[idx + 3] = 255;

      // Ambient Occlusion
      const hClamped = Math.max(-1.0, Math.min(1.0, hCenter));
      const aoVal = Math.floor((0.55 + 0.45 * ((hClamped + 1) / 2)) * 255);
      aoData[idx] = aoVal;
      aoData[idx + 1] = aoVal;
      aoData[idx + 2] = aoVal;
      aoData[idx + 3] = 255;

      // Roughness Map
      const rNoise = fbm(u * 80, v * 80, 2);
      const roughVal = Math.floor((0.85 + rNoise * 0.08) * 255);
      roughnessData[idx] = roughVal;
      roughnessData[idx + 1] = roughVal;
      roughnessData[idx + 2] = roughVal;
      roughnessData[idx + 3] = 255;

      // Displacement Map
      const dispVal = Math.floor(((hClamped + 1.0) / 2.0) * 255);
      displacementData[idx] = dispVal;
      displacementData[idx + 1] = dispVal;
      displacementData[idx + 2] = dispVal;
      displacementData[idx + 3] = 255;
    }
  }

  normalCtx.putImageData(normalImg, 0, 0);
  aoCtx.putImageData(aoImg, 0, 0);
  roughnessCtx.putImageData(roughnessImg, 0, 0);
  displacementCtx.putImageData(displacementImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;

  const aoMap = new THREE.CanvasTexture(aoCanvas);
  aoMap.wrapS = THREE.RepeatWrapping;
  aoMap.wrapT = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  const displacementMap = new THREE.CanvasTexture(displacementCanvas);
  displacementMap.wrapS = THREE.RepeatWrapping;
  displacementMap.wrapT = THREE.RepeatWrapping;

  return { normalMap, aoMap, roughnessMap, displacementMap };
};

// Model-specific fitting presets to avoid clipping on different body shapes
const FIT_PRESETS = {
  male: {
    position: [0, 1.25, -0.015] as [number, number, number], // Perfect alignment for the realistic male avatar
    scale: [0.99, 0.985, 0.99] as [number, number, number]
  },
  female: {
    position: [0, 1.21, -0.012] as [number, number, number], // Perfect alignment for the realistic female avatar
    scale: [0.91, 0.93, 0.92] as [number, number, number]
  },
  mannequin: {
    position: [0, 1.238, 0.012] as [number, number, number],  // Centered position to balance front collarbone and back neck coverage
    scale: [1.135, 1.115, 1.14] as [number, number, number]   // Slightly wider and deeper to clear the shoulders and front chest
  }
};

interface TShirtProps {
  weight?: number;
  size?: number;
  customModelUrl?: string | null;
  color?: string;
  textureUrl?: string | null;
  backTextureUrl?: string | null;
  onLoadError?: (error: string) => void;
  gender?: string;
}

export default function TShirt({
  weight = 1.0,
  size = 1.0,
  customModelUrl = null,
  color = '#ffffff',
  textureUrl = null,
  backTextureUrl = null,
  onLoadError,
  gender = 'male'
}: TShirtProps) {
  const shirtRef = useRef<THREE.Group>(null);
  const [meshes, setMeshes] = useState<THREE.Mesh[]>([]);
  const [mainMesh, setMainMesh] = useState<THREE.Mesh | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [backTexture, setBackTexture] = useState<THREE.Texture | null>(null);

  // Load either the custom or default shirt model
  const activeShirtUrl = customModelUrl || DEFAULT_SHIRT_URL;
  const { scene } = useGLTF(activeShirtUrl);

  // Memoize PBR cotton textures for performance, only on client
  const pbrTextures = useMemo(() => createRealisticCottonTextures(), []);

  // Retrieve fit preset for the active avatar base
  const preset = FIT_PRESETS[gender as keyof typeof FIT_PRESETS] || FIT_PRESETS.male;
  const scaleMultiplier = preset.scale;

  // Process mesh hierarchy
  useEffect(() => {
    if (!scene) return;

    const foundMeshes: THREE.Mesh[] = [];
    let largest: THREE.Mesh | null = null;
    let maxVolume = 0;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        foundMeshes.push(mesh);

        // Find the main torso mesh (highest volume) for placing the decal
        if (!mesh.geometry.boundingBox) {
          mesh.geometry.computeBoundingBox();
        }
        const box = mesh.geometry.boundingBox;
        if (box) {
          const s = new THREE.Vector3();
          box.getSize(s);
          const volume = s.x * s.y * s.z;
          if (volume > maxVolume) {
            maxVolume = volume;
            largest = mesh;
          }
        }
      }
    });

    setMeshes(foundMeshes);
    setMainMesh(largest);
  }, [scene, activeShirtUrl]);

  // Load uploaded image texture for front logo
  useEffect(() => {
    if (!textureUrl) {
      setTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.error('Error loading decal texture:', err);
      }
    );
  }, [textureUrl]);

  // Load uploaded image texture for back logo
  useEffect(() => {
    if (!backTextureUrl) {
      setBackTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      backTextureUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setBackTexture(tex);
      },
      undefined,
      (err) => {
        console.error('Error loading back decal texture:', err);
      }
    );
  }, [backTextureUrl]);

  // Sync breathing animation scale and position scaling with the avatar model in useFrame
  useFrame((state) => {
    if (!shirtRef.current) return;

    // Exact matching breathe pulsation
    const breath = Math.sin(state.clock.elapsedTime * 1.8) * 0.0035;

    const scaleX = weight * size * scaleMultiplier[0] + breath;
    const scaleY = size * scaleMultiplier[1] + breath * 0.5;
    const scaleZ = weight * size * scaleMultiplier[2] + breath;

    shirtRef.current.scale.set(scaleX, scaleY, scaleZ);

    // Dynamically adjust position based on height (size) and thickness (weight) scaling
    const posX = preset.position[0];
    const posY = preset.position[1] * size;
    const posZ = preset.position[2] * (weight * size);

    shirtRef.current.position.set(posX, posY, posZ);
  });

  return (
    <group
      ref={shirtRef}
      position={preset.position}
    >
      {meshes.map((mesh, idx) => {
        const isTorso = mesh === mainMesh;
        return (
          <mesh
            key={idx}
            geometry={mesh.geometry}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial
              color={color}
              roughness={0.92}
              roughnessMap={pbrTextures.roughnessMap || undefined}
              metalness={0.0}
              clearcoat={0.0} // Ensure matte fabric finish
              normalMap={pbrTextures.normalMap || undefined}
              normalScale={new THREE.Vector2(0.65, 0.65)} // Soft, realistic normal folds
              aoMap={pbrTextures.aoMap || undefined}
              aoMapIntensity={1.2}
              sheen={0.4} // Soft fuzzy highlight
              sheenColor={new THREE.Color('#666666')} // Subtle fiber reflection
              sheenRoughness={0.9}
              side={THREE.DoubleSide}
            />
            {isTorso && texture && (
              <Decal
                position={[0, 0.04, 0.15]}
                rotation={[0, 0, 0]}
                scale={[0.36, 0.54, 0.08]} // Tỷ lệ 2:3 (0.36x0.54) khớp chính xác với kích thước Canvas 500x750
              >
                <meshBasicMaterial
                  map={texture}
                  transparent
                  polygonOffset
                  polygonOffsetFactor={-20} // push projection forward to avoid z-fighting
                  depthWrite={false}
                />
              </Decal>
            )}
            {isTorso && backTexture && (
              <Decal
                position={[0, 0.04, -0.12]} // Z âm để ra sát mặt sau
                rotation={[0, Math.PI, 0]}  // Xoay 180 độ quanh Y để hướng decal ra ngoài
                scale={[0.36, 0.54, 0.12]} // Tỷ lệ 2:3 (0.36x0.54) khớp chính xác với kích thước Canvas 500x750
              >
                <meshBasicMaterial
                  map={backTexture}
                  transparent
                  polygonOffset
                  polygonOffsetFactor={-20} // push projection forward to avoid z-fighting
                  depthWrite={false}
                />
              </Decal>
            )}
          </mesh>
        );
      })}
    </group>
  );
}
