'use client'

import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'

function MaskModel({ modelPath }: { modelPath: string }) {
  const meshRef = useRef<THREE.Group>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [idleRotation, setIdleRotation] = useState({ x: 0, y: 0 })
  const [isMouseActive, setIsMouseActive] = useState(false)
  const idleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const idleAnimationRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Always call the hook - error handling will be done at a higher level
  const { scene } = useGLTF(modelPath)

  // Clone the scene to avoid issues with multiple instances
  const clonedScene = scene.clone()

  // Smooth idle animation function
  const startIdleAnimation = useCallback(() => {
    let startTime = Date.now()
    let startRotation = { x: 0, y: 0 }
    let targetRotation = { x: 0, y: 0 }
    let animationDuration = 2000 // 2 seconds per movement
    let isAnimationComplete = false

    const generateNewTarget = () => {
      startTime = Date.now()
      startRotation = { ...targetRotation }
      isAnimationComplete = false

      // 30 degrees = 0.524 radians, use larger range for more visible movement
      const maxRotation = 0.524 // 30 degrees in radians
      targetRotation = {
        x: (Math.random() - 0.5) * maxRotation,
        y: (Math.random() - 0.5) * maxRotation
      }

      // Random duration between 2-4 seconds for natural variation
      animationDuration = 2000 + Math.random() * 2000
    }

    const scheduleNextAnimation = () => {
      // Clear current interval
      if (idleAnimationRef.current) {
        clearInterval(idleAnimationRef.current)
      }

      // Wait 0.5-1.5 seconds before next movement
      setTimeout(() => {
        generateNewTarget()
        startAnimationLoop()
      }, 500 + Math.random() * 1000)
    }

    const startAnimationLoop = () => {
      const animateFrame = () => {
        const currentTime = Date.now()
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / animationDuration, 1)

        // Use easing function for more natural movement (ease-in-out)
        const easeInOut = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2

        setIdleRotation({
          x: startRotation.x + (targetRotation.x - startRotation.x) * easeInOut,
          y: startRotation.y + (targetRotation.y - startRotation.y) * easeInOut
        })

        // Check if animation is complete
        if (progress >= 1 && !isAnimationComplete) {
          isAnimationComplete = true
          scheduleNextAnimation()
        }
      }

      // 60 FPS for very smooth animation
      idleAnimationRef.current = setInterval(animateFrame, 16)
    }

    // Start first movement
    generateNewTarget()
    startAnimationLoop()
  }, [])

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Get mouse position relative to viewport center
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -((event.clientY / window.innerHeight) * 2 - 1) // Negative to invert Y axis

      // Limit rotation to max 20 degrees (0.349 radians)
      const maxRotation = 0.349 // 20 degrees in radians
      // Horizontal mouse movement affects Z rotation (left-right tilt) - reversed direction
      const rotationZ = -x * maxRotation * 0.5 // Negative to reverse direction
      // Vertical mouse movement affects X rotation (head nodding up/down) - reversed direction
      const rotationX = -y * maxRotation * 0.5 // Negative to reverse direction

      setMousePosition({ x: rotationZ, y: rotationX })
      setIsMouseActive(true)

      // Clear existing timeouts
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
      if (idleAnimationRef.current) clearInterval(idleAnimationRef.current)

      // Set timeout to start idle animation when mouse stops moving
      idleTimeoutRef.current = setTimeout(() => {
        setIsMouseActive(false)
        startIdleAnimation()
      }, 500) // Wait 500ms after mouse stops moving
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
      if (idleAnimationRef.current) clearInterval(idleAnimationRef.current)
    }
  }, [startIdleAnimation])

  // Apply rotation based on mouse position and idle animation
  useEffect(() => {
    if (meshRef.current) {
      if (isMouseActive) {
        // Mouse is active: follow mouse with Z rotation (tilt) and X rotation (nodding)
        meshRef.current.rotation.x = Math.PI / 2 + mousePosition.y // Fixed vertical angle + X rotation (nodding)
        meshRef.current.rotation.y = mousePosition.y * 0.3 // Y axis follows X rotation for natural head movement
        meshRef.current.rotation.z = mousePosition.x // Follow mouse with Z rotation (tilt)
      } else {
        // Mouse is idle: apply base position + idle animation
        meshRef.current.rotation.x = Math.PI / 2 + idleRotation.x // Fixed base + idle vertical
        meshRef.current.rotation.y = idleRotation.y // Idle horizontal
        meshRef.current.rotation.z = 0 // No Z rotation during idle
      }
    }
  }, [mousePosition, idleRotation, isMouseActive])

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      <primitive object={clonedScene} scale={[1, 1, 1]} />
    </group>
  )
}

function PlaceholderMask() {
  const meshRef = useRef<THREE.Group>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [idleRotation, setIdleRotation] = useState({ x: 0, y: 0 })
  const [isMouseActive, setIsMouseActive] = useState(false)
  const idleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const idleAnimationRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Smooth idle animation function
  const startIdleAnimation = useCallback(() => {
    let startTime = Date.now()
    let startRotation = { x: 0, y: 0 }
    let targetRotation = { x: 0, y: 0 }
    let animationDuration = 2000 // 2 seconds per movement
    let isAnimationComplete = false

    const generateNewTarget = () => {
      startTime = Date.now()
      startRotation = { ...targetRotation }
      isAnimationComplete = false

      // 30 degrees = 0.524 radians, use larger range for more visible movement
      const maxRotation = 0.524 // 30 degrees in radians
      targetRotation = {
        x: (Math.random() - 0.5) * maxRotation,
        y: (Math.random() - 0.5) * maxRotation
      }

      // Random duration between 2-4 seconds for natural variation
      animationDuration = 2000 + Math.random() * 2000
    }

    const scheduleNextAnimation = () => {
      // Clear current interval
      if (idleAnimationRef.current) {
        clearInterval(idleAnimationRef.current)
      }

      // Wait 0.5-1.5 seconds before next movement
      setTimeout(() => {
        generateNewTarget()
        startAnimationLoop()
      }, 500 + Math.random() * 1000)
    }

    const startAnimationLoop = () => {
      const animateFrame = () => {
        const currentTime = Date.now()
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / animationDuration, 1)

        // Use easing function for more natural movement (ease-in-out)
        const easeInOut = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2

        setIdleRotation({
          x: startRotation.x + (targetRotation.x - startRotation.x) * easeInOut,
          y: startRotation.y + (targetRotation.y - startRotation.y) * easeInOut
        })

        // Check if animation is complete
        if (progress >= 1 && !isAnimationComplete) {
          isAnimationComplete = true
          scheduleNextAnimation()
        }
      }

      // 60 FPS for very smooth animation
      idleAnimationRef.current = setInterval(animateFrame, 16)
    }

    // Start first movement
    generateNewTarget()
    startAnimationLoop()
  }, [])

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Get mouse position relative to viewport center
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -((event.clientY / window.innerHeight) * 2 - 1) // Negative to invert Y axis

      // Limit rotation to max 20 degrees (0.349 radians)
      const maxRotation = 0.349 // 20 degrees in radians
      // Horizontal mouse movement affects Z rotation (left-right tilt) - reversed direction
      const rotationZ = -x * maxRotation * 0.5 // Negative to reverse direction
      // Vertical mouse movement affects X rotation (head nodding up/down) - reversed direction
      const rotationX = -y * maxRotation * 0.5 // Negative to reverse direction

      setMousePosition({ x: rotationZ, y: rotationX })
      setIsMouseActive(true)

      // Clear existing timeouts
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
      if (idleAnimationRef.current) clearInterval(idleAnimationRef.current)

      // Set timeout to start idle animation when mouse stops moving
      idleTimeoutRef.current = setTimeout(() => {
        setIsMouseActive(false)
        startIdleAnimation()
      }, 500) // Wait 500ms after mouse stops moving
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
      if (idleAnimationRef.current) clearInterval(idleAnimationRef.current)
    }
  }, [startIdleAnimation])

  // Apply rotation based on mouse position and idle animation
  useEffect(() => {
    if (meshRef.current) {
      if (isMouseActive) {
        // Mouse is active: follow mouse with Z rotation (tilt) and X rotation (nodding)
        meshRef.current.rotation.x = mousePosition.y // X rotation (nodding) for placeholder
        meshRef.current.rotation.y = mousePosition.y * 0.3 // Y axis follows X rotation for natural head movement
        meshRef.current.rotation.z = mousePosition.x // Follow mouse with Z rotation (tilt)
      } else {
        // Mouse is idle: apply base position + idle animation
        meshRef.current.rotation.x = idleRotation.x // Idle vertical
        meshRef.current.rotation.y = idleRotation.y // Idle horizontal
        meshRef.current.rotation.z = 0 // No Z rotation during idle
      }
    }
  }, [mousePosition, idleRotation, isMouseActive])

  return (
    <group ref={meshRef}>
      {/* Main mask body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2.5, 0.5]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      {/* Front face */}
      <mesh position={[0, 0, 0.3]}>
        <planeGeometry args={[1.8, 2.3]} />
        <meshStandardMaterial
          color="#D2691E"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      {/* Eye holes */}
      <mesh position={[-0.4, 0.3, 0.31]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.4, 0.3, 0.31]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Mouth - characteristic Guy Fawkes smile */}
      <mesh position={[0, -0.4, 0.31]} rotation={[0, 0, Math.PI]}>
        <ringGeometry args={[0.1, 0.3, 16, 1, 0, Math.PI]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Mustache */}
      <mesh position={[0, -0.1, 0.31]}>
        <boxGeometry args={[0.8, 0.1, 0.02]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Goatee */}
      <mesh position={[0, -0.7, 0.31]}>
        <boxGeometry args={[0.3, 0.4, 0.02]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#666666" />
    </mesh>
  )
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = () => setHasError(true)
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return <PlaceholderMask />
  }

  return <>{children}</>
}

export default function GuyFawkesMask() {
  const [modelExists, setModelExists] = useState<boolean | null>(null)
  const modelPath = '/assets/guy_fawkes_mask_-_v.1_free.glb'

  useEffect(() => {
    // Check if the GLB file exists
    fetch(modelPath, { method: 'HEAD' })
      .then(response => {
        setModelExists(response.ok)
      })
      .catch(() => {
        setModelExists(false)
      })
  }, [modelPath])

  return (
    <div className="w-full h-[600px] relative">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 50,
        }}
        gl={{ antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Environment for better reflections */}
        <Environment preset="studio" />

        {/* The GLB Model with error handling */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            {modelExists === null ? (
              <LoadingFallback />
            ) : modelExists ? (
              <MaskModel modelPath={modelPath} />
            ) : (
              <PlaceholderMask />
            )}
          </Suspense>
        </ErrorBoundary>

        {/* Controls for user interaction - disabled to allow mouse following */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>

      {/* Status overlay */}
      <div className="absolute top-4 left-4 text-green-400 font-mono text-sm">
        {modelExists === null
          ? 'Checking model...'
          : modelExists
            ? 'Guy Fawkes Mask (GLB Model)'
            : 'Guy Fawkes Mask (Placeholder - Add GLB file)'
        }
      </div>
    </div>
  )
}

// Only preload if we know the file exists
// useGLTF.preload('/assets/guy_fawkes_mask_-_v.1_free.glb')