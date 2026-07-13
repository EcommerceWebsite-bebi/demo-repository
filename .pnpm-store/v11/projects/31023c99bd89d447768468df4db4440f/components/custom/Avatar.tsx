"use client";

import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const DEFAULT_AVATARS = {
  mannequin: '/models/mannequin.glb'
};

// Preload assets for instant switching
useGLTF.preload(DEFAULT_AVATARS.mannequin);

interface AvatarProps {
  weight?: number;
  size?: number;
  customModelUrl?: string | null;
  onLoadError?: (error: string) => void;
  gender?: string;
}

export default function Avatar({ 
  weight = 1.0, 
  size = 1.0, 
  customModelUrl = null, 
  onLoadError,
  gender = 'mannequin' 
}: AvatarProps) {
  const avatarRef = useRef<THREE.Group>(null);
  const [customScene, setCustomScene] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(false);

  // Load default models via Drei's useGLTF hook (leveraging caching)
  const defaultModelUrl = DEFAULT_AVATARS.mannequin;
  const defaultGltf = useGLTF(defaultModelUrl);

  // Load custom model if provided
  useEffect(() => {
    if (!customModelUrl) {
      setCustomScene(null);
      return;
    }

    setLoading(true);
    const loader = new GLTFLoader();
    
    loader.load(
      customModelUrl,
      (gltfModel) => {
        gltfModel.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat) => {
                  mat.side = THREE.DoubleSide;
                });
              } else {
                mesh.material.side = THREE.DoubleSide;
              }
            }
          }
        });
        setCustomScene(gltfModel.scene);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading custom GLB avatar:', error);
        setLoading(false);
        if (onLoadError) onLoadError('Failed to load avatar GLB. Please try a valid GLB file.');
      }
    );
  }, [customModelUrl, onLoadError]);

  // Determine active scene
  const activeScene = customScene || defaultGltf.scene;

  // Process node visibilities and PBR properties to prevent clipping
  useEffect(() => {
    if (!activeScene) return;

    activeScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const name = mesh.name.toLowerCase();
        
        // Hide default clothing top meshes to prevent overlapping with our custom shirt
        if (name === 'h_dds_highres') {
          mesh.visible = true;
          if (mesh.material && !Array.isArray(mesh.material)) {
            const material = mesh.material as THREE.MeshStandardMaterial;
            // Clone the material once to prevent shared material cache conflicts
            if (!mesh.userData.isCloned) {
              mesh.material = material.clone();
              mesh.userData.isCloned = true;
            }

            const activeMat = mesh.material as THREE.MeshStandardMaterial;
            activeMat.transparent = true;
            activeMat.depthWrite = true;
            activeMat.side = THREE.DoubleSide;

            activeMat.onBeforeCompile = (shader) => {
              // Vertex Shader modifications
              shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                 varying vec3 vLocalPosition;`
              );
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                 vLocalPosition = position;`
              );

              // Fragment Shader modifications
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                 varying vec3 vLocalPosition;`
              );

              const isFemale = gender === 'female';
              // Vertical bounds for the default shirt torso + sleeves
              const yMin = isFemale ? 0.90 : 0.93;
              const yMax = isFemale ? 1.41 : 1.45;
              const xBody = isFemale ? 0.32 : 0.35;
              const ySleeveMin = isFemale ? 1.10 : 1.14;
              const xSleeveMax = isFemale ? 0.50 : 0.55;

              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
                 float y = vLocalPosition.y;
                 float absX = abs(vLocalPosition.x);
                 
                 // Torso area (excluding neck/hips)
                 bool inTorso = (y > ${yMin.toFixed(4)} && y < ${yMax.toFixed(4)} && absX < ${xBody.toFixed(4)});
                 
                 // Sleeves area (excluding outer hands)
                 bool inSleeves = (y > ${ySleeveMin.toFixed(4)} && y < ${yMax.toFixed(4)} && absX < ${xSleeveMax.toFixed(4)});
                 
                 if (inTorso || inSleeves) {
                   discard;
                 }`
              );
            };
            activeMat.needsUpdate = true;
          }
        } else if (
          name.includes('top') || 
          name.includes('shirt') || 
          name.includes('tshirt') || 
          name.includes('jacket') || 
          name.includes('sweater') || 
          name.includes('outfit_top') ||
          name.includes('outfittop') ||
          name.includes('top_mesh')
        ) {
          mesh.visible = false;
        } else {
          // Make sure everything else is visible
          mesh.visible = true;
        }

        // Set realistic material properties for other meshes
        if (mesh.material && name !== 'h_dds_highres' && !Array.isArray(mesh.material)) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.side = THREE.DoubleSide;
          
          if (gender === 'mannequin' && !customModelUrl) {
            // Apply a premium satin chrome / futuristic finish to the mannequin
            if (!mesh.userData.isCloned) {
              mesh.material = material.clone();
              mesh.userData.isCloned = true;
            }
            const activeMat = mesh.material as THREE.MeshStandardMaterial;
            activeMat.roughness = 0.25;
            activeMat.metalness = 0.8;
            activeMat.color = new THREE.Color('#3f3f46'); // zinc-700
            activeMat.side = THREE.DoubleSide;
            
            activeMat.onBeforeCompile = (shader) => {
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                  // Shrink body mesh under the shirt region
                  float yVal = position.y;
                  float absXVal = abs(position.x);
                  float absZVal = abs(position.z);
                  
                  // Separate bounds for hips/waist (narrow) and shoulders/arms (wide)
                  bool inTorsoRange = (yVal >= 0.65 && yVal < 1.15 && absXVal < 0.40 && absZVal < 0.30);
                  bool inSleevesRange = (yVal >= 1.15 && yVal < 1.52 && absXVal < 0.62 && absZVal < 0.32);
                  
                  if (inTorsoRange || inSleevesRange) {
                    float shrinkAmt = 0.018; // Keep optimal shrink offset
                    if (yVal > 1.45) {
                      shrinkAmt *= (1.52 - yVal) / 0.07; // Smooth fade at collar (neck area)
                    } else if (yVal < 0.74) {
                      shrinkAmt *= (yVal - 0.65) / 0.09; // Smooth fade at bottom hem (below shirt)
                    }
                    transformed -= normal * shrinkAmt;
                  }
                `
              );
            };
            activeMat.needsUpdate = true;
          } else {
            // Standard skin / apparel setting
            if (material.roughness !== undefined) {
              material.roughness = Math.max(material.roughness, 0.6);
            }
            if (material.metalness !== undefined && !name.includes('metal')) {
              material.metalness = Math.min(material.metalness, 0.05);
            }
          }
        }
      }
    });
  }, [activeScene, gender, customModelUrl]);

  // Sync scale animation in useFrame for natural idle breathing
  useFrame((state) => {
    if (!avatarRef.current) return;
    
    // Idle breath pulsation
    const breath = Math.sin(state.clock.elapsedTime * 1.8) * 0.0035;
    
    avatarRef.current.scale.x = weight * size + breath;
    avatarRef.current.scale.y = size + breath * 0.5;
    avatarRef.current.scale.z = weight * size + breath;
  });

  return (
    <group ref={avatarRef} position={[0, 0, 0]}>
      <primitive object={activeScene} />
    </group>
  );
}
