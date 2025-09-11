"use client";

import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

export type EmotionType = 'neutral' | 'happy' | 'sad' | 'angry';

interface CyberFaceProps {
  emotion?: EmotionType;
  isActive?: boolean;
}

const CyberFace: React.FC<CyberFaceProps> = ({ 
  emotion = 'neutral', 
  isActive = true 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const faceGroupRef = useRef<THREE.Group>();
  const animationIdRef = useRef<number | undefined>();
  const clockRef = useRef(new THREE.Clock());
  
  // Emotion transition state
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>(emotion);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Performance monitoring
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);
  const [fps, setFps] = useState(60);
  const [qualityLevel, setQualityLevel] = useState(1); // 0.5 = low, 1 = normal, 1.5 = high

  // Create holographic material
  const createHolographicMaterial = useMemo(() => {
    return (color: string = '#00ffff', opacity: number = 0.8) => {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(color) },
          opacity: { value: opacity },
          glitchIntensity: { value: 0.1 }
        },
        vertexShader: `
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec2 vUv;
          uniform float time;
          uniform float glitchIntensity;
          
          void main() {
            vPosition = position;
            vNormal = normal;
            vUv = uv;
            
            vec3 pos = position;
            
            // Add subtle glitch effect
            float glitch = sin(time * 10.0 + position.y * 20.0) * glitchIntensity * 0.01;
            pos.x += glitch;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color;
          uniform float opacity;
          uniform float glitchIntensity;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec2 vUv;
          
          void main() {
            // Base holographic effect
            float fresnel = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
            fresnel = pow(1.0 - fresnel, 2.0);
            
            // Scan lines effect
            float scanline = sin(vPosition.y * 50.0 + time * 5.0) * 0.1 + 0.9;
            
            // Interference pattern
            float interference = sin(time * 8.0 + vPosition.x * 30.0) * 0.05 + 1.0;
            
            // Glitch effect
            float glitch = step(0.95, sin(time * 50.0)) * glitchIntensity;
            
            vec3 finalColor = color * (fresnel + 0.3) * scanline * interference;
            finalColor += vec3(glitch * 0.5, glitch, glitch * 0.5);
            
            gl_FragColor = vec4(finalColor, opacity * (fresnel + 0.4));
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      
      return material;
    };
  }, []);

  // Create realistic face geometry based on human facial anatomy
  const createRealisticFaceGeometry = () => {
    const group = new THREE.Group();

    // Base head shape using more anatomically correct proportions
    const createHeadMesh = () => {
      // Create a more realistic head shape using modified sphere
      const headGeometry = new THREE.SphereGeometry(1, 32, 24);
      const vertices = headGeometry.attributes.position.array;
      
      // Modify vertices to create more realistic head shape
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
        
        // Create oval head shape (narrower at top, wider at cheeks)
        const angle = Math.atan2(z, x);
        const verticalPos = y;
        
        // Narrow forehead and top of head
        if (verticalPos > 0.3) {
          const factor = 1 - (verticalPos - 0.3) * 0.3;
          vertices[i] *= factor;
          vertices[i + 2] *= factor;
        }
        
        // Widen cheek area
        if (verticalPos > -0.3 && verticalPos < 0.3) {
          const factor = 1 + Math.cos(verticalPos * Math.PI) * 0.1;
          vertices[i] *= factor;
          vertices[i + 2] *= factor;
        }
        
        // Narrow chin
        if (verticalPos < -0.4) {
          const factor = 1 - (Math.abs(verticalPos + 0.4)) * 0.4;
          vertices[i] *= factor;
          vertices[i + 2] *= factor;
        }
        
        // Flatten back of head slightly
        if (z < -0.5) {
          vertices[i + 2] *= 0.8;
        }
      }
      
      headGeometry.attributes.position.needsUpdate = true;
      headGeometry.computeVertexNormals();
      
      const headMaterial = createHolographicMaterial('#00ffff', 0.7);
      return new THREE.Mesh(headGeometry, headMaterial);
    };

    // Create realistic eyes
    const createEye = (side = 1) => {
      const eyeGroup = new THREE.Group();
      
      // Eye socket (orbital cavity)
      const socketGeometry = new THREE.SphereGeometry(0.18, 16, 16);
      const socketMaterial = createHolographicMaterial('#004466', 0.3);
      const socket = new THREE.Mesh(socketGeometry, socketMaterial);
      socket.scale.set(1.2, 0.8, 0.6);
      eyeGroup.add(socket);
      
      // Eyeball
      const eyeballGeometry = new THREE.SphereGeometry(0.12, 16, 16);
      const eyeballMaterial = createHolographicMaterial('#ffffff', 0.9);
      const eyeball = new THREE.Mesh(eyeballGeometry, eyeballMaterial);
      eyeball.position.z = 0.05;
      eyeGroup.add(eyeball);
      
      // Iris
      const irisGeometry = new THREE.RingGeometry(0.02, 0.06, 16);
      const irisMaterial = createHolographicMaterial('#00aaff', 1.0);
      const iris = new THREE.Mesh(irisGeometry, irisMaterial);
      iris.position.z = 0.12;
      eyeGroup.add(iris);
      
      // Pupil
      const pupilGeometry = new THREE.CircleGeometry(0.02, 16);
      const pupilMaterial = createHolographicMaterial('#000044', 1.0);
      const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      pupil.position.z = 0.121;
      eyeGroup.add(pupil);
      
      // Eyelids (upper and lower)
      const createEyelid = (isUpper = true) => {
        const curve = new THREE.EllipseCurve(0, 0, 0.15, 0.08);
        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: '#00ffff', 
          transparent: true, 
          opacity: 0.8 
        });
        const line = new THREE.Line(geometry, material);
        line.rotation.z = isUpper ? 0 : Math.PI;
        line.position.z = 0.13;
        return line;
      };
      
      eyeGroup.add(createEyelid(true));  // Upper eyelid
      eyeGroup.add(createEyelid(false)); // Lower eyelid
      
      return eyeGroup;
    };

    // Create nose
    const createNose = () => {
      const noseGroup = new THREE.Group();
      
      // Nose bridge
      const bridgeGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.4);
      const bridgeMaterial = createHolographicMaterial('#00ccff', 0.8);
      const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
      bridge.rotation.x = Math.PI / 2;
      bridge.position.y = 0.1;
      bridge.position.z = 0.85;
      noseGroup.add(bridge);
      
      // Nose tip
      const tipGeometry = new THREE.SphereGeometry(0.06, 12, 12);
      const tipMaterial = createHolographicMaterial('#00ccff', 0.9);
      const tip = new THREE.Mesh(tipGeometry, tipMaterial);
      tip.position.y = -0.1;
      tip.position.z = 0.9;
      tip.scale.set(1, 0.8, 1.2);
      noseGroup.add(tip);
      
      // Nostrils
      const nostrilGeometry = new THREE.SphereGeometry(0.02, 8, 8);
      const nostrilMaterial = createHolographicMaterial('#002244', 0.9);
      
      const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
      leftNostril.position.set(-0.03, -0.12, 0.88);
      leftNostril.scale.set(0.8, 1, 1.5);
      noseGroup.add(leftNostril);
      
      const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
      rightNostril.position.set(0.03, -0.12, 0.88);
      rightNostril.scale.set(0.8, 1, 1.5);
      noseGroup.add(rightNostril);
      
      return noseGroup;
    };

    // Create mouth
    const createMouth = () => {
      const mouthGroup = new THREE.Group();
      
      // Lips (upper and lower)
      const createLip = (isUpper = true) => {
        const lipCurve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-0.12, isUpper ? 0.02 : -0.02, 0),
          new THREE.Vector3(0, isUpper ? 0.04 : -0.04, 0.02),
          new THREE.Vector3(0.12, isUpper ? 0.02 : -0.02, 0)
        );
        
        const lipGeometry = new THREE.TubeGeometry(lipCurve, 20, 0.015, 8);
        const lipMaterial = createHolographicMaterial('#ff0088', 1.0);
        return new THREE.Mesh(lipGeometry, lipMaterial);
      };
      
      const upperLip = createLip(true);
      const lowerLip = createLip(false);
      
      mouthGroup.add(upperLip);
      mouthGroup.add(lowerLip);
      
      // Mouth opening (when speaking)
      const mouthOpenGeometry = new THREE.PlaneGeometry(0.2, 0.05);
      const mouthOpenMaterial = createHolographicMaterial('#220022', 0.8);
      const mouthOpen = new THREE.Mesh(mouthOpenGeometry, mouthOpenMaterial);
      mouthOpen.position.z = -0.01;
      mouthOpen.name = 'mouthOpening';
      mouthGroup.add(mouthOpen);
      
      return mouthGroup;
    };

    // Create eyebrows
    const createEyebrow = (side = 1) => {
      const browCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.15 * side, 0, 0),
        new THREE.Vector3(0, 0.03, 0.02),
        new THREE.Vector3(0.15 * side, 0, 0)
      );
      
      const browGeometry = new THREE.TubeGeometry(browCurve, 20, 0.008, 6);
      const browMaterial = createHolographicMaterial('#00ffaa', 0.9);
      return new THREE.Mesh(browGeometry, browMaterial);
    };

    // Create cheekbones
    const createCheekbone = (side = 1) => {
      const cheekGeometry = new THREE.SphereGeometry(0.08, 12, 12);
      const cheekMaterial = createHolographicMaterial('#0088cc', 0.4);
      const cheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
      cheek.scale.set(1.5, 0.6, 0.8);
      return cheek;
    };

    // Create jawline
    const createJawline = () => {
      const jawPoints = [];
      for (let i = 0; i <= 20; i++) {
        const angle = (i / 20) * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * 0.8;
        const y = -0.6 + Math.sin(angle) * 0.2;
        const z = 0.6;
        jawPoints.push(new THREE.Vector3(x, y, z));
      }
      
      const jawCurve = new THREE.CatmullRomCurve3(jawPoints);
      const jawGeometry = new THREE.TubeGeometry(jawCurve, 40, 0.01, 8);
      const jawMaterial = createHolographicMaterial('#00aaff', 0.8);
      return new THREE.Mesh(jawGeometry, jawMaterial);
    };

    // Assemble the face
    const head = createHeadMesh();
    head.name = 'head';
    group.add(head);

    // Add eyes
    const leftEye = createEye(-1);
    leftEye.position.set(-0.25, 0.15, 0.7);
    leftEye.name = 'leftEye';
    group.add(leftEye);

    const rightEye = createEye(1);
    rightEye.position.set(0.25, 0.15, 0.7);
    rightEye.name = 'rightEye';
    group.add(rightEye);

    // Add nose
    const nose = createNose();
    nose.name = 'nose';
    group.add(nose);

    // Add mouth
    const mouth = createMouth();
    mouth.position.set(0, -0.3, 0.75);
    mouth.name = 'mouth';
    group.add(mouth);

    // Add eyebrows
    const leftBrow = createEyebrow(-1);
    leftBrow.position.set(-0.25, 0.35, 0.8);
    leftBrow.name = 'leftBrow';
    group.add(leftBrow);

    const rightBrow = createEyebrow(1);
    rightBrow.position.set(0.25, 0.35, 0.8);
    rightBrow.name = 'rightBrow';
    group.add(rightBrow);

    // Add cheekbones
    const leftCheek = createCheekbone(-1);
    leftCheek.position.set(-0.4, -0.1, 0.6);
    leftCheek.name = 'leftCheek';
    group.add(leftCheek);

    const rightCheek = createCheekbone(1);
    rightCheek.position.set(0.4, -0.1, 0.6);
    rightCheek.name = 'rightCheek';
    group.add(rightCheek);

    // Add jawline
    const jawline = createJawline();
    jawline.name = 'jawline';
    group.add(jawline);

    // Add facial wireframe overlay for cyber effect
    const wireframeGeometry = new THREE.SphereGeometry(1.08, 24, 24);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: '#00ffff',
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    wireframe.name = 'wireframe';
    group.add(wireframe);

    // Add holographic scan lines
    const addScanLines = () => {
      for (let i = 0; i < 10; i++) {
        const lineGeometry = new THREE.RingGeometry(0.8 + i * 0.05, 0.81 + i * 0.05, 64);
        const lineMaterial = createHolographicMaterial('#00ffff', 0.1 + Math.sin(i) * 0.05);
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.position.y = (i - 5) * 0.2;
        line.rotation.x = Math.PI / 2;
        line.name = `scanLine${i}`;
        group.add(line);
      }
    };

    addScanLines();

    return group;
  };

  // Update the main createFaceGeometry function to use realistic face
  const createFaceGeometry = () => {
    return createRealisticFaceGeometry();
  };

  // Update emotion expression for realistic face
  const updateEmotion = (targetEmotion: EmotionType) => {
    if (!faceGroupRef.current || isTransitioning) return;

    setIsTransitioning(true);
    
    const leftEye = faceGroupRef.current.getObjectByName('leftEye') as THREE.Group;
    const rightEye = faceGroupRef.current.getObjectByName('rightEye') as THREE.Group;
    const leftBrow = faceGroupRef.current.getObjectByName('leftBrow') as THREE.Mesh;
    const rightBrow = faceGroupRef.current.getObjectByName('rightBrow') as THREE.Mesh;
    const mouth = faceGroupRef.current.getObjectByName('mouth') as THREE.Group;
    const head = faceGroupRef.current.getObjectByName('head') as THREE.Mesh;
    const wireframe = faceGroupRef.current.getObjectByName('wireframe') as THREE.Mesh;

    if (!leftEye || !rightEye || !mouth || !head) return;

    // Define realistic emotion parameters
    const emotions = {
      neutral: {
        eyeScaleY: 1.0,
        eyePositionY: 0.15,
        browRotation: 0,
        browPositionY: 0.35,
        mouthPositionY: -0.3,
        mouthScale: 1.0,
        mouthCurve: 0, // 0 = straight, positive = smile, negative = frown
        headColor: '#00ffff',
        wireframeOpacity: 0.3,
        glitchIntensity: 0.1,
        scanlineSpeed: 1.0
      },
      happy: {
        eyeScaleY: 0.7, // Squinted eyes from smiling
        eyePositionY: 0.18,
        browRotation: -0.1, // Slightly raised
        browPositionY: 0.37,
        mouthPositionY: -0.25, // Raised mouth
        mouthScale: 1.3,
        mouthCurve: 0.15, // Upward curve for smile
        headColor: '#00ff88',
        wireframeOpacity: 0.4,
        glitchIntensity: 0.05,
        scanlineSpeed: 1.5
      },
      sad: {
        eyeScaleY: 1.2, // Droopy eyes
        eyePositionY: 0.12,
        browRotation: 0.15, // Angled down
        browPositionY: 0.32,
        mouthPositionY: -0.35, // Lowered mouth
        mouthScale: 0.8,
        mouthCurve: -0.1, // Downward curve for frown
        headColor: '#0088ff',
        wireframeOpacity: 0.2,
        glitchIntensity: 0.15,
        scanlineSpeed: 0.7
      },
      angry: {
        eyeScaleY: 0.8, // Narrowed eyes
        eyePositionY: 0.18,
        browRotation: -0.25, // Furrowed brow
        browPositionY: 0.30,
        mouthPositionY: -0.28,
        mouthScale: 1.1,
        mouthCurve: -0.05, // Slight downward curve
        headColor: '#ff0088',
        wireframeOpacity: 0.5,
        glitchIntensity: 0.3,
        scanlineSpeed: 2.0
      }
    };

    const target = emotions[targetEmotion];
    const duration = 1500; // 1.5 seconds transition
    const startTime = Date.now();

    // Store initial values for smooth interpolation
    const initialValues = {
      leftEyeScaleY: leftEye.scale.y,
      rightEyeScaleY: rightEye.scale.y,
      leftEyeY: leftEye.position.y,
      rightEyeY: rightEye.position.y,
      leftBrowRotation: leftBrow?.rotation.z || 0,
      rightBrowRotation: rightBrow?.rotation.z || 0,
      leftBrowY: leftBrow?.position.y || 0.35,
      rightBrowY: rightBrow?.position.y || 0.35,
      mouthY: mouth.position.y,
      mouthScale: mouth.scale.x,
      wireframeOpacity: wireframe?.material ? (wireframe.material as THREE.MeshBasicMaterial).opacity : 0.3
    };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      // Animate eyes - realistic blinking and squinting
      if (leftEye && rightEye) {
        leftEye.scale.y = THREE.MathUtils.lerp(initialValues.leftEyeScaleY, target.eyeScaleY, easeProgress);
        rightEye.scale.y = THREE.MathUtils.lerp(initialValues.rightEyeScaleY, target.eyeScaleY, easeProgress);
        
        leftEye.position.y = THREE.MathUtils.lerp(initialValues.leftEyeY, target.eyePositionY, easeProgress);
        rightEye.position.y = THREE.MathUtils.lerp(initialValues.rightEyeY, target.eyePositionY, easeProgress);
      }

      // Animate eyebrows - emotional expressions
      if (leftBrow && rightBrow) {
        leftBrow.rotation.z = THREE.MathUtils.lerp(initialValues.leftBrowRotation, target.browRotation, easeProgress);
        rightBrow.rotation.z = THREE.MathUtils.lerp(initialValues.rightBrowRotation, -target.browRotation, easeProgress);
        
        leftBrow.position.y = THREE.MathUtils.lerp(initialValues.leftBrowY, target.browPositionY, easeProgress);
        rightBrow.position.y = THREE.MathUtils.lerp(initialValues.rightBrowY, target.browPositionY, easeProgress);
      }

      // Animate mouth - realistic expression changes
      if (mouth) {
        mouth.position.y = THREE.MathUtils.lerp(initialValues.mouthY, target.mouthPositionY, easeProgress);
        mouth.scale.setScalar(THREE.MathUtils.lerp(initialValues.mouthScale, target.mouthScale, easeProgress));
        
        // Apply mouth curve by rotating the mouth group slightly
        mouth.rotation.z = THREE.MathUtils.lerp(0, target.mouthCurve, easeProgress);
      }

      // Update head material properties
      const headMaterial = head.material as THREE.ShaderMaterial;
      if (headMaterial.uniforms) {
        headMaterial.uniforms.color.value.lerp(new THREE.Color(target.headColor), easeProgress * 0.05);
        headMaterial.uniforms.glitchIntensity.value = THREE.MathUtils.lerp(
          headMaterial.uniforms.glitchIntensity.value,
          target.glitchIntensity,
          easeProgress * 0.05
        );
      }

      // Update wireframe opacity based on emotion
      if (wireframe && wireframe.material) {
        const wireframeMaterial = wireframe.material as THREE.MeshBasicMaterial;
        wireframeMaterial.opacity = THREE.MathUtils.lerp(
          initialValues.wireframeOpacity,
          target.wireframeOpacity,
          easeProgress
        );
      }

      // Update scan lines speed and intensity
      for (let i = 0; i < 10; i++) {
        const scanLine = faceGroupRef.current?.getObjectByName(`scanLine${i}`) as THREE.Mesh;
        if (scanLine && scanLine.material) {
          const scanMaterial = scanLine.material as THREE.ShaderMaterial;
          if (scanMaterial.uniforms?.time) {
            // Modify scan line animation based on emotion
            const speedMultiplier = THREE.MathUtils.lerp(1.0, target.scanlineSpeed, easeProgress);
            scanMaterial.uniforms.time.value *= speedMultiplier;
          }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsTransitioning(false);
        setCurrentEmotion(targetEmotion);
      }
    };

    animate();
  };

  // Performance monitoring
  const updatePerformance = () => {
    frameCountRef.current++;
    const now = performance.now();
    
    if (now - lastFpsUpdateRef.current > 1000) {
      const currentFps = frameCountRef.current;
      setFps(currentFps);
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
      
      // Auto-adjust quality based on FPS
      if (currentFps < 30 && qualityLevel > 0.5) {
        setQualityLevel(prev => Math.max(prev - 0.25, 0.5));
      } else if (currentFps > 55 && qualityLevel < 1.5) {
        setQualityLevel(prev => Math.min(prev + 0.25, 1.5));
      }
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });

    renderer.setSize(400, 400);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Camera position
    camera.position.z = 3;

    // Create face
    const faceGroup = createFaceGeometry();
    faceGroup.scale.setScalar(0.618); // Golden ratio scale
    scene.add(faceGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    faceGroupRef.current = faceGroup;

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [createHolographicMaterial, qualityLevel]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (!isActive) {
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsedTime = clockRef.current.getElapsedTime();
      
      if (faceGroupRef.current) {
        // Idle animations
        const idleIntensity = 0.02;
        faceGroupRef.current.rotation.y = Math.sin(elapsedTime * 0.5) * idleIntensity;
        faceGroupRef.current.rotation.x = Math.sin(elapsedTime * 0.3) * idleIntensity;
        
        // Update shader uniforms
        faceGroupRef.current.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
            if (child.material.uniforms?.time) {
              child.material.uniforms.time.value = elapsedTime;
            }
          }
        });
      }

      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      updatePerformance();
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isActive]);

  // Update emotion when prop changes
  useEffect(() => {
    if (emotion !== currentEmotion) {
      updateEmotion(emotion);
    }
  }, [emotion, currentEmotion]);

  return (
    <div 
      ref={mountRef}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-10"
      style={{
        filter: isActive ? 'none' : 'blur(2px) opacity(0.5)',
        transition: 'filter 0.5s ease'
      }}
    >
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 text-green-400 text-xs font-mono">
          FPS: {fps} | Quality: {qualityLevel.toFixed(1)}x | Emotion: {currentEmotion}
        </div>
      )}
    </div>
  );
};

export default CyberFace;