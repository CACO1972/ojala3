"use client";

import { Canvas } from "@react-three/fiber";
import { EffectComposer, Vignette } from "@react-three/postprocessing";
import { Particles } from "./particles";
import { Suspense } from "react";

export default function GL() {
  return (
    <div className="webgl-background">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45, near: 0.1, far: 100 }}
        gl={{
          powerPreference: "high-performance",
          antialias: false,
          stencil: false,
          depth: false,
        }}
        dpr={[1, 1.5]} // Limitar DPR para mejor performance
      >
        <Suspense fallback={null}>
          <Particles 
            speed={0.8}
            focus={5.6}
            aperture={3.0}
            fov={45}
            curl={0.15}
          />
          <EffectComposer>
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
