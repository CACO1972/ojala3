"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getPointMaterial } from "./shaders/pointMaterial";
import { getSimulationMaterial } from "./shaders/simulationMaterial";

const SIZE = 256; // Reducido para mejor performance en móviles

interface ParticlesProps {
  speed?: number;
  focus?: number;
  aperture?: number;
  fov?: number;
  curl?: number;
}

export function Particles({
  speed = 1.0,
  focus = 5.6,
  aperture = 3.0,
  fov = 45,
  curl = 0.2,
}: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null!);
  const simulationMaterialRef = useRef<THREE.ShaderMaterial>(null!);
  
  const { gl, size } = useThree();

  const [positions, uvs] = useMemo(() => {
    const length = SIZE * SIZE;
    const positions = new Float32Array(length * 3);
    const uvs = new Float32Array(length * 2);

    for (let i = 0; i < length; i++) {
      const i3 = i * 3;
      const i2 = i * 2;
      positions[i3] = (i % SIZE) / SIZE;
      positions[i3 + 1] = Math.floor(i / SIZE) / SIZE;
      uvs[i2] = (i % SIZE) / SIZE;
      uvs[i2 + 1] = Math.floor(i / SIZE) / SIZE;
    }

    return [positions, uvs];
  }, []);

  const [target, pointMaterial, simulationMaterial] = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(SIZE, SIZE, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    });

    const simulationMaterial = getSimulationMaterial(SIZE);
    const pointMaterial = getPointMaterial(SIZE);

    return [target, pointMaterial, simulationMaterial];
  }, []);

  // Inicializar posiciones
  useEffect(() => {
    const plane = new THREE.PlaneGeometry(1, 1);
    const quad = new THREE.Mesh(plane, simulationMaterial);
    const scene = new THREE.Scene();
    scene.add(quad);
    gl.setRenderTarget(target);
    gl.render(scene, new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1));
    gl.setRenderTarget(null);
  }, [gl, target, simulationMaterial]);

  useFrame((_, delta) => {
    if (simulationMaterialRef.current) {
      const uniforms = simulationMaterialRef.current.uniforms;
      uniforms.uTime.value += delta * speed;
      uniforms.uSpeed.value = speed;
      uniforms.uCurl.value = curl;
      
      const plane = new THREE.PlaneGeometry(1, 1);
      const quad = new THREE.Mesh(plane, simulationMaterialRef.current);
      const scene = new THREE.Scene();
      scene.add(quad);
      gl.setRenderTarget(target);
      gl.render(scene, new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1));
      gl.setRenderTarget(null);
    }

    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uPositions.value = target.texture;
      material.uniforms.uTime.value += delta;
      material.uniforms.uFocus.value = focus;
      material.uniforms.uAperture.value = aperture;
      material.uniforms.uFov.value = fov;
      material.uniforms.uResolution.value = [size.width, size.height];
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-uv"
          count={uvs.length / 2}
          array={uvs}
          itemSize={2}
        />
      </bufferGeometry>
      <primitive object={pointMaterial} attach="material" />
      <primitive 
        ref={simulationMaterialRef} 
        object={simulationMaterial} 
      />
    </points>
  );
}
