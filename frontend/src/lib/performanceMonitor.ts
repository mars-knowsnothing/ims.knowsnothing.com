/**
 * Performance monitoring and optimization utilities for the Cyber Face system
 */

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private frameCount = 0;
  private lastTime = 0;
  private fps = 60;
  private cpuUsage = 0;
  private memoryUsage = 0;
  private qualityLevel = 1.0;
  private callbacks: Array<(metrics: PerformanceMetrics) => void> = [];

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private startMonitoring() {
    // FPS monitoring
    const measureFPS = () => {
      this.frameCount++;
      const now = performance.now();
      
      if (now - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
        this.frameCount = 0;
        this.lastTime = now;

        // Auto-adjust quality based on FPS
        this.autoAdjustQuality();
        
        // Measure memory if available
        this.measureMemory();
        
        // Notify callbacks
        this.notifyCallbacks();
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    measureFPS();
  }

  private measureMemory() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
  }

  private autoAdjustQuality() {
    const targetFPS = 30; // Minimum acceptable FPS
    const highFPS = 55; // FPS threshold for quality increase
    
    if (this.fps < targetFPS && this.qualityLevel > 0.25) {
      // Decrease quality
      this.qualityLevel = Math.max(this.qualityLevel - 0.25, 0.25);
      console.log(`🔧 Performance: Quality decreased to ${this.qualityLevel}x (FPS: ${this.fps})`);
    } else if (this.fps > highFPS && this.qualityLevel < 1.5) {
      // Increase quality
      this.qualityLevel = Math.min(this.qualityLevel + 0.25, 1.5);
      console.log(`⚡ Performance: Quality increased to ${this.qualityLevel}x (FPS: ${this.fps})`);
    }
  }

  private notifyCallbacks() {
    const metrics: PerformanceMetrics = {
      fps: this.fps,
      qualityLevel: this.qualityLevel,
      memoryUsage: this.memoryUsage,
      cpuUsage: this.cpuUsage,
      timestamp: Date.now()
    };

    this.callbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Performance callback error:', error);
      }
    });
  }

  // Public methods
  public getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      qualityLevel: this.qualityLevel,
      memoryUsage: this.memoryUsage,
      cpuUsage: this.cpuUsage,
      timestamp: Date.now()
    };
  }

  public onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  public setQualityLevel(level: number) {
    this.qualityLevel = Math.max(0.25, Math.min(level, 2.0));
  }

  public getQualitySettings(): QualitySettings {
    const level = this.qualityLevel;
    
    return {
      particleCount: Math.floor(100 * level),
      renderDistance: 1000 * level,
      shadowQuality: level > 0.5 ? (level > 1.0 ? 'high' : 'medium') : 'low',
      effectIntensity: level,
      animationSmoothing: level > 0.75,
      antialias: level > 0.5,
      postProcessing: level > 1.0
    };
  }

  public getDeviceCapabilities(): DeviceCapabilities {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    if (!gl) {
      return {
        webglSupported: false,
        maxTextureSize: 0,
        maxRenderBufferSize: 0,
        hardwareConcurrency: navigator.hardwareConcurrency || 1,
        devicePixelRatio: window.devicePixelRatio || 1,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        estimatedPerformance: 'low'
      };
    }

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Estimate performance based on device capabilities
    let estimatedPerformance: 'low' | 'medium' | 'high' = 'medium';
    
    if (isMobile || hardwareConcurrency <= 2 || maxTextureSize < 4096) {
      estimatedPerformance = 'low';
    } else if (hardwareConcurrency >= 8 && maxTextureSize >= 8192) {
      estimatedPerformance = 'high';
    }

    return {
      webglSupported: true,
      maxTextureSize,
      maxRenderBufferSize,
      hardwareConcurrency,
      devicePixelRatio,
      isMobile,
      estimatedPerformance
    };
  }

  public optimizeForDevice(): QualitySettings {
    const capabilities = this.getDeviceCapabilities();
    
    // Set initial quality based on device capabilities
    switch (capabilities.estimatedPerformance) {
      case 'low':
        this.qualityLevel = 0.5;
        break;
      case 'medium':
        this.qualityLevel = 1.0;
        break;
      case 'high':
        this.qualityLevel = 1.5;
        break;
    }

    return this.getQualitySettings();
  }
}

export interface PerformanceMetrics {
  fps: number;
  qualityLevel: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: number;
}

export interface QualitySettings {
  particleCount: number;
  renderDistance: number;
  shadowQuality: 'low' | 'medium' | 'high';
  effectIntensity: number;
  animationSmoothing: boolean;
  antialias: boolean;
  postProcessing: boolean;
}

export interface DeviceCapabilities {
  webglSupported: boolean;
  maxTextureSize: number;
  maxRenderBufferSize: number;
  hardwareConcurrency: number;
  devicePixelRatio: number;
  isMobile: boolean;
  estimatedPerformance: 'low' | 'medium' | 'high';
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const monitor = React.useMemo(() => PerformanceMonitor.getInstance(), []);

  React.useEffect(() => {
    const unsubscribe = monitor.onMetricsUpdate(setMetrics);
    
    // Get initial metrics
    setMetrics(monitor.getMetrics());

    // Optimize for current device
    monitor.optimizeForDevice();

    return unsubscribe;
  }, [monitor]);

  return {
    metrics,
    qualitySettings: monitor.getQualitySettings(),
    deviceCapabilities: monitor.getDeviceCapabilities(),
    setQualityLevel: monitor.setQualityLevel.bind(monitor)
  };
};

// Debounced resize handler for performance
export const useOptimizedResize = (callback: () => void, delay = 100) => {
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>();

  React.useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(callback, delay);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, delay]);
};

// Visibility API for performance optimization
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = React.useState<boolean>(!document.hidden);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

// Import React for hooks
import React from 'react';