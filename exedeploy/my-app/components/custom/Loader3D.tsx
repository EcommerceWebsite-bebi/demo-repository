"use client";

import React from 'react';
import { useProgress, Html } from '@react-three/drei';

export default function Loader3D() {
  const { active, progress, item } = useProgress();
  
  if (!active) return null;

  return (
    <Html center style={{ pointerEvents: 'none' }}>
      <div className="flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-2xl min-w-[220px] transition-all-custom">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
          {/* Inner pulsating dot */}
          <div className="w-6 h-6 rounded-full bg-indigo-500/40 animate-pulse"></div>
        </div>
        
        <div className="text-white font-medium tracking-wide text-sm mb-1">
          Loading 3D Assets
        </div>
        <div className="text-cyan-400 font-mono text-xs mb-3 font-semibold">
          {Math.round(progress)}%
        </div>
        
        {/* Progress Bar */}
        <div className="w-40 bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {item && (
          <div className="text-gray-500 text-[10px] mt-2 max-w-[180px] truncate text-center">
            {item.split('/').pop()}
          </div>
        )}
      </div>
    </Html>
  );
}
