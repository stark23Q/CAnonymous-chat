"use client";

import { useEffect, useRef } from "react";

export function ThreeJsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically load Three.js
    const script = document.createElement("script");
    script.src = "https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js";
    script.async = true;
    document.body.appendChild(script);

    let animationFrameId: number;

    script.onload = () => {
      if (!window.THREE || !containerRef.current) return;

      const THREE = window.THREE;
      const container = containerRef.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0x8b4aff, 4, 100);
      pointLight.position.set(15, 15, 15);
      scene.add(pointLight);

      const triangles: any[] = [];
      const triangleCount = 24;
      const colors = [0x8b4aff, 0x0ba3e6, 0x3c3743];

      for (let i = 0; i < triangleCount; i++) {
        const geometry = new THREE.TetrahedronGeometry(Math.random() * 2.5 + 0.5);
        const material = new THREE.MeshPhongMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          transparent: true,
          opacity: 0.5,
          shininess: 120,
          wireframe: Math.random() > 0.7
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30 - 15);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        mesh.userData = { 
            rotationSpeed: (Math.random() - 0.5) * 0.01, 
            floatSpeed: (Math.random() - 0.5) * 0.006, 
            floatOffset: Math.random() * Math.PI * 2,
            parallaxFactor: Math.random() * 0.5 + 0.2
        };
        scene.add(mesh);
        triangles.push(mesh);
      }

      camera.position.z = 25;

      let mouseX = 0, mouseY = 0;

      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 10;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 10;
        
        if (glowRef.current) {
          glowRef.current.style.left = e.clientX + 'px';
          glowRef.current.style.top = e.clientY + 'px';
          glowRef.current.style.opacity = '1';
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        if(e.touches.length > 0) {
            mouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 10;
            mouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 10;
            if (glowRef.current) {
              glowRef.current.style.left = e.touches[0].clientX + 'px';
              glowRef.current.style.top = e.touches[0].clientY + 'px';
              glowRef.current.style.opacity = '1';
            }
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onTouchMove);

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', onResize);

      function animate() {
        animationFrameId = requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        
        triangles.forEach((mesh) => {
          mesh.rotation.x += mesh.userData.rotationSpeed;
          mesh.rotation.y += mesh.userData.rotationSpeed;
          
          // Enhanced Parallax
          const targetX = (Math.cos(time + mesh.userData.floatOffset) * 0.5) + (mouseX * mesh.userData.parallaxFactor);
          const targetY = (Math.sin(time + mesh.userData.floatOffset) * 0.8) - (mouseY * mesh.userData.parallaxFactor);
          
          mesh.position.x += (targetX - mesh.position.x) * 0.02;
          mesh.position.y += (targetY - mesh.position.y) * 0.02;
        });
        
        renderer.render(scene, camera);
      }
      animate();

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('resize', onResize);
        if (containerRef.current?.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    };

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      {/* Interactive Glow Follower */}
      <div ref={glowRef} className="interactive-glow opacity-0 transition-opacity duration-300 pointer-events-none" />
      {/* Three.js Container */}
      <div className="fixed inset-0 w-full h-full bg-transparent z-0 pointer-events-none">
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </>
  );
}

// Add THREE to window object for TypeScript
declare global {
  interface Window {
    THREE: any;
  }
}
