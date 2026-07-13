"use client";

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import Avatar from './Avatar';
import TShirt from './TShirt';
import Loader3D from './Loader3D';

interface FittingCanvasProps {
  weight: number;
  size: number;
  shirtColor: string;
  logoTextureUrl: string | null;
  backLogoTextureUrl?: string | null;
  customAvatarUrl: string | null;
  customShirtUrl: string | null;
  onAvatarLoadError?: (error: string) => void;
  onShirtLoadError?: (error: string) => void;
  gender?: string;
}

export default function FittingCanvas({
  weight,
  size,
  shirtColor,
  logoTextureUrl,
  backLogoTextureUrl = null,
  customAvatarUrl,
  customShirtUrl,
  onAvatarLoadError,
  onShirtLoadError,
  gender = 'mannequin'
}: FittingCanvasProps) {
  return (
    <div className="w-full h-full relative min-h-[450px] md:min-h-[550px] rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-950 to-black border border-white/5 shadow-2xl">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 0.35, 1.8], fov: 40 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true }}
        className="w-full h-full"
      >
        {/* Soft Ambient Light */}
        <ambientLight intensity={0.55} />

        {/* Cinematic Key Light (casts clean shadows) */}
        <directionalLight
          castShadow
          position={[4, 5, 4]}
          intensity={1.8}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.00005}
        />

        {/* Cinematic Rim Light (backlight to create glow silhouette) */}
        <directionalLight
          position={[-4, 3, -3]}
          intensity={2.8}
          color="#a5f3fc" // cyan-blue glow
        />

        {/* Cinematic Fill Light (front-left to soften shadows) */}
        <directionalLight
          position={[-3, 1, 2]}
          intensity={0.65}
          color="#e0e7ff" // indigo-tinted fill
        />

        <Suspense fallback={<Loader3D />}>
          {/* Studio HDR Environment Lighting Map */}
          <Environment preset="studio" />

          {/* Static Mannequin Platform / Stage (Zara/H&M style) */}
          <group position={[0, -0.9, 0]}>
            {/* The circular stage */}
            <mesh position={[0, -0.015, 0]} receiveShadow>
              <cylinderGeometry args={[0.55, 0.6, 0.03, 64]} />
              <meshStandardMaterial 
                color="#0c0c0e" 
                roughness={0.25} 
                metalness={0.85} 
              />
            </mesh>
            {/* Glowing ring under the platform */}
            <mesh position={[0, -0.025, 0]}>
              <cylinderGeometry args={[0.57, 0.57, 0.01, 64]} />
              <meshBasicMaterial 
                color="#6366f1" 
                transparent 
                opacity={0.25} 
              />
            </mesh>

            {/* Avatar Mesh */}
            <Avatar
              weight={weight}
              size={size}
              customModelUrl={customAvatarUrl}
              onLoadError={onAvatarLoadError}
              gender={gender}
            />
            
            {/* T-Shirt Mesh */}
            <TShirt
              weight={weight}
              size={size}
              color={shirtColor}
              textureUrl={logoTextureUrl}
              backTextureUrl={backLogoTextureUrl}
              customModelUrl={customShirtUrl}
              onLoadError={onShirtLoadError}
              gender={gender}
            />
          </group>

          {/* Soft Ground Shadows on the floor */}
          <ContactShadows
            position={[0, -0.94, 0]}
            opacity={0.7}
            scale={4}
            blur={2.0}
            far={1.2}
          />
        </Suspense>

        {/* User Interactive Orbit Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.0}
          maxDistance={3.0}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.85} // Prevents camera from rotating below the platform
          target={[0, 0.15, 0]}         // Focus on chest/waist level
          enableDamping={true}
          dampingFactor={0.05}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
