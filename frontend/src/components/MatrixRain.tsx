"use client";

import React, { useRef, useEffect } from 'react';

interface MatrixRainProps {
  faceEnabled?: boolean;
}

const MatrixRain: React.FC<MatrixRainProps> = ({ faceEnabled = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to fill the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // The characters to draw
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const characters = katakana + latin + nums;

    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);

    // An array of y-positions for each column
    const drops: number[] = [];
    // Track particle opacity for face interaction
    const particleOpacity: number[] = [];
    
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
      particleOpacity[i] = 1.0;
    }

    let animationFrameId: number;

    // Face interaction parameters
    const faceCenter = {
      x: canvas.width * 0.5,
      y: canvas.height * 0.5
    };
    const faceRadius = canvas.height * 0.15; // Face radius (15% of screen height)
    const faceInfluenceRadius = faceRadius * 2; // Influence area

    const draw = () => {
      // Set a semi-transparent black background to create the fading trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // Calculate distance from face center for interaction
        let opacity = 1.0;
        let color = '#0F0'; // Default green
        
        if (faceEnabled) {
          const distanceFromFace = Math.sqrt(
            Math.pow(x - faceCenter.x, 2) + Math.pow(y - faceCenter.y, 2)
          );
          
          if (distanceFromFace < faceInfluenceRadius) {
            const influenceStrength = 1 - (distanceFromFace / faceInfluenceRadius);
            
            // Create flowing effect around face
            if (distanceFromFace < faceRadius) {
              // Inside face area - create flow-through effect
              opacity = 0.3 + (Math.sin(Date.now() * 0.005 + i * 0.5) * 0.2);
              color = `rgba(0, 255, 255, ${opacity})`; // Cyan color matching face
              
              // Curve the particles around the face
              const angle = Math.atan2(y - faceCenter.y, x - faceCenter.x);
              const curvature = Math.sin(Date.now() * 0.002 + angle * 3) * 20 * influenceStrength;
              ctx.fillStyle = color;
              ctx.fillText(
                characters.charAt(Math.floor(Math.random() * characters.length)),
                x + curvature,
                y
              );
            } else {
              // Outside face but within influence - subtle color shift
              const blueAmount = Math.floor(255 * influenceStrength * 0.5);
              color = `rgb(0, ${255 - blueAmount}, ${blueAmount})`;
              opacity = 0.8 + (influenceStrength * 0.2);
              
              ctx.fillStyle = color;
              ctx.globalAlpha = opacity;
              ctx.fillText(
                characters.charAt(Math.floor(Math.random() * characters.length)),
                x,
                y
              );
              ctx.globalAlpha = 1.0;
            }
          } else {
            // Normal matrix rain outside influence area
            ctx.fillStyle = '#0F0';
            ctx.fillText(
              characters.charAt(Math.floor(Math.random() * characters.length)),
              x,
              y
            );
          }
        } else {
          // Normal matrix rain when face is disabled
          ctx.fillStyle = '#0F0';
          ctx.font = `${fontSize}px monospace`;
          ctx.fillText(
            characters.charAt(Math.floor(Math.random() * characters.length)),
            x,
            y
          );
        }

        // Reset the drop to the top randomly to make the rain uneven
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }

      // Add additional holographic scan lines when face is enabled
      if (faceEnabled) {
        const time = Date.now() * 0.001;
        
        // Horizontal scan lines
        for (let i = 0; i < 5; i++) {
          const y = (Math.sin(time * 2 + i) * 0.5 + 0.5) * canvas.height;
          ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + Math.sin(time * 5 + i) * 0.05})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Vertical scan lines near face
        const verticalLines = 3;
        for (let i = 0; i < verticalLines; i++) {
          const x = faceCenter.x + (i - 1) * 100 + Math.sin(time * 3 + i) * 50;
          if (x > 0 && x < canvas.width) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.05 + Math.sin(time * 4 + i) * 0.02})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Update face center position on resize
      faceCenter.x = canvas.width * 0.5;
      faceCenter.y = canvas.height * 0.5;
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [faceEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-0"
    />
  );
};

export default MatrixRain;
