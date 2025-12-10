import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
import { useApp } from '../context/AppContext';
import { initVision } from '../services/vision';

const ThreeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { threeApi, photos } = useApp();

  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;

    // --- CONFIG & STATE ---
    const CONFIG = {
      particles: { count: 1500, dustCount: 2500, treeHeight: 24, treeRadius: 8 },
      interaction: { rotationSpeed: 1.4, grabRadius: 0.55 },
      colors: { bg: 0x000000, champagneGold: 0xffd966, deepGreen: 0x03180a, accentRed: 0x990000 },
    };
    
    const STATE = {
      mode: 'TREE',
      focusTarget: null as THREE.Object3D | null,
      focusType: 0,
      hand: { detected: false, x: 0, y: 0 },
      rotation: { x: 0, y: 0 }
    };

    // --- THREE JS SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.colors.bg);
    scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.01);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.2;
    containerRef.current.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // --- LIGHTS ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const innerLight = new THREE.PointLight(0xffaa00, 2, 20);
    innerLight.position.set(0, 5, 0);
    scene.add(innerLight); // Add to scene, not mainGroup to avoid rotation if desired, but code says mainGroup. Let's stick to scene for stability.

    const spotGold = new THREE.SpotLight(0xffcc66, 1200);
    spotGold.position.set(30, 40, 40);
    spotGold.angle = 0.5; spotGold.penumbra = 0.5;
    scene.add(spotGold);

    const spotBlue = new THREE.SpotLight(0x6688ff, 600);
    spotBlue.position.set(-30, 20, -30);
    scene.add(spotBlue);

    const fillLight = new THREE.DirectionalLight(0xffeebb, 0.8);
    fillLight.position.set(0, 0, 50);
    scene.add(fillLight);

    // --- POST PROCESSING ---
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.7; bloomPass.strength = 0.45; bloomPass.radius = 0.4;
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // --- OBJECTS ---
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    let particleSystem: any[] = [];
    const photoMeshGroup = new THREE.Group();
    mainGroup.add(photoMeshGroup);

    // Helper: Texture Generation
    const createCaneTexture = () => {
      const cvs = document.createElement('canvas'); cvs.width = 128; cvs.height = 128;
      const ctx = cvs.getContext('2d')!;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,128,128);
      ctx.fillStyle = '#880000'; ctx.beginPath();
      for(let i=-128; i<256; i+=32) { ctx.moveTo(i, 0); ctx.lineTo(i+32, 128); ctx.lineTo(i+16, 128); ctx.lineTo(i-16, 0); }
      ctx.fill();
      const tex = new THREE.CanvasTexture(cvs);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 3);
      return tex;
    };
    const caneTexture = createCaneTexture();

    // Helper: Particle Class
    class Particle {
      mesh: THREE.Mesh | THREE.Group;
      type: string;
      isDust: boolean;
      posTree: THREE.Vector3;
      posScatter: THREE.Vector3;
      baseScale: number;
      photoId: string | null;
      spinSpeed: THREE.Vector3;

      constructor(mesh: THREE.Mesh | THREE.Group, type: string, isDust = false) {
        this.mesh = mesh; this.type = type; this.isDust = isDust;
        this.posTree = new THREE.Vector3(); this.posScatter = new THREE.Vector3();
        this.baseScale = mesh.scale.x; 
        this.photoId = null;
        const speedMult = (type === 'PHOTO') ? 0.3 : 2.0;
        this.spinSpeed = new THREE.Vector3((Math.random()-0.5)*speedMult, (Math.random()-0.5)*speedMult, (Math.random()-0.5)*speedMult);
        this.calculatePositions();
      }

      calculatePositions() {
        const h = CONFIG.particles.treeHeight;
        let t = Math.pow(Math.random(), 0.8);
        const y = (t * h) - (h/2);
        let rMax = Math.max(0.5, CONFIG.particles.treeRadius * (1.0 - t));
        const angle = t * 50 * Math.PI + Math.random() * Math.PI;
        const r = rMax * (0.8 + Math.random() * 0.4);
        this.posTree.set(Math.cos(angle) * r, y, Math.sin(angle) * r);

        let rScatter = this.isDust ? (12 + Math.random()*20) : (8 + Math.random()*12);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        this.posScatter.set(rScatter * Math.sin(phi) * Math.cos(theta), rScatter * Math.sin(phi) * Math.sin(theta), rScatter * Math.cos(phi));
      }

      update(dt: number, mode: string, focusTarget: THREE.Object3D | null) {
        let target = this.posTree;
        if (mode === 'SCATTER') target = this.posScatter;
        else if (mode === 'FOCUS') {
          if (this.mesh === focusTarget) {
            let offset = new THREE.Vector3(0, 1, 38);
            if (STATE.focusType === 1) offset.set(-4, 2, 35);
            else if (STATE.focusType === 2) offset.set(3, 0, 32);
            else if (STATE.focusType === 3) offset.set(0, -2.5, 30);
            const invMatrix = new THREE.Matrix4().copy(mainGroup.matrixWorld).invert();
            target = offset.applyMatrix4(invMatrix);
          } else target = this.posScatter;
        }

        const lerpSpeed = (mode === 'FOCUS' && this.mesh === focusTarget) ? 8.0 : 4.0;
        this.mesh.position.lerp(target, lerpSpeed * dt);

        if (mode === 'SCATTER') {
          this.mesh.rotation.x += this.spinSpeed.x * dt;
          this.mesh.rotation.y += this.spinSpeed.y * dt;
          this.mesh.rotation.z += this.spinSpeed.z * dt;
        } else if (mode === 'TREE') {
          this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, dt);
          this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, dt);
          this.mesh.rotation.y += 0.5 * dt;
        }
        
        if (mode === 'FOCUS' && this.mesh === focusTarget) {
          this.mesh.lookAt(camera.position);
          if(STATE.focusType === 1) this.mesh.rotateZ(0.38);
          if(STATE.focusType === 2) this.mesh.rotateZ(-0.15);
          if(STATE.focusType === 3) this.mesh.rotateX(-0.4);
        }

        let s = this.baseScale;
        if (this.isDust) {
          s = this.baseScale * (0.8 + 0.4 * Math.sin(clock.elapsedTime * 4 + this.mesh.id));
          if (mode === 'TREE') s = 0;
        } else if (mode === 'SCATTER' && this.type === 'PHOTO') s = this.baseScale * 2.5;
        else if (mode === 'FOCUS') {
          if (this.mesh === focusTarget) s = (STATE.focusType === 2) ? 3.5 : (STATE.focusType === 3 ? 4.8 : 3.0);
          else s = this.baseScale * 0.8;
        }
        this.mesh.scale.lerp(new THREE.Vector3(s,s,s), 6*dt);
      }
    }

    const createParticles = () => {
      // Clean existing
      particleSystem.filter(p => !p.type.includes('PHOTO')).forEach(p => mainGroup.remove(p.mesh));
      particleSystem = particleSystem.filter(p => p.type.includes('PHOTO')); // Keep photos
      
      const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
      const boxGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
      const curve = new THREE.CatmullRomCurve3([ new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0.1, 0.5, 0), new THREE.Vector3(0.3, 0.4, 0) ]);
      const candyGeo = new THREE.TubeGeometry(curve, 16, 0.08, 8, false);

      const goldMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.champagneGold, metalness: 1.0, roughness: 0.1, envMapIntensity: 2.0, emissive: 0x443300, emissiveIntensity: 0.3 });
      const greenMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.deepGreen, metalness: 0.2, roughness: 0.8, emissive: 0x002200, emissiveIntensity: 0.2 });
      const redMat = new THREE.MeshPhysicalMaterial({ color: CONFIG.colors.accentRed, metalness: 0.3, roughness: 0.2, clearcoat: 1.0, emissive: 0x330000 });
      const candyMat = new THREE.MeshStandardMaterial({ map: caneTexture, roughness: 0.4 });

      for (let i = 0; i < CONFIG.particles.count; i++) {
        const rand = Math.random();
        let mesh, type;
        if (rand < 0.40) { mesh = new THREE.Mesh(boxGeo, greenMat); type = 'BOX'; }
        else if (rand < 0.70) { mesh = new THREE.Mesh(boxGeo, goldMat); type = 'GOLD_BOX'; }
        else if (rand < 0.92) { mesh = new THREE.Mesh(sphereGeo, goldMat); type = 'GOLD_SPHERE'; }
        else if (rand < 0.97) { mesh = new THREE.Mesh(sphereGeo, redMat); type = 'RED'; }
        else { mesh = new THREE.Mesh(candyGeo, candyMat); type = 'CANE'; }

        const s = 0.4 + Math.random() * 0.5;
        mesh.scale.set(s,s,s);
        mesh.rotation.set(Math.random()*6, Math.random()*6, Math.random()*6);
        mainGroup.add(mesh);
        particleSystem.push(new Particle(mesh, type, false));
      }

      // Star
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffaa00, emissiveIntensity: 1.0, metalness: 1.0, roughness: 0 }));
      star.position.set(0, CONFIG.particles.treeHeight/2 + 1.2, 0);
      mainGroup.add(star);
      
      // Dust
      const dustGeo = new THREE.TetrahedronGeometry(0.08, 0);
      const dustMat = new THREE.MeshBasicMaterial({ color: 0xffeebb, transparent: true, opacity: 0.8 });
      for(let i=0; i<CONFIG.particles.dustCount; i++) {
        const m = new THREE.Mesh(dustGeo, dustMat);
        m.scale.setScalar(0.5 + Math.random());
        mainGroup.add(m);
        particleSystem.push(new Particle(m, 'DUST', true));
      }
    };

    const addPhotoToScene = (base64: string, id: string) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        
        const frameGeo = new THREE.BoxGeometry(1.4, 1.4, 0.05);
        const frameMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.champagneGold, metalness: 1.0, roughness: 0.1 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        const photoGeo = new THREE.PlaneGeometry(1.2, 1.2);
        const photoMat = new THREE.MeshBasicMaterial({ map: tex });
        const photo = new THREE.Mesh(photoGeo, photoMat);
        photo.position.z = 0.04;
        const group = new THREE.Group();
        group.add(frame); group.add(photo);
        const s = 0.8; group.scale.set(s,s,s);
        
        photoMeshGroup.add(group);
        const p = new Particle(group, 'PHOTO', false);
        p.photoId = id;
        particleSystem.push(p);
      };
    };

    // --- INITIALIZATION ---
    createParticles();
    
    // Load existing photos
    photos.forEach(p => addPhotoToScene(p.data, p.id));

    // --- LOOP ---
    const clock = new THREE.Clock();
    let animId: number;
    let handLandmarker: any = null;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      // Hand Interaction Logic
      if (STATE.mode === 'SCATTER' && STATE.hand.detected) {
        const threshold = 0.3;
        const speed = CONFIG.interaction.rotationSpeed;
        if (STATE.hand.x > threshold) STATE.rotation.y -= speed * dt * (STATE.hand.x - threshold);
        else if (STATE.hand.x < -threshold) STATE.rotation.y -= speed * dt * (STATE.hand.x + threshold);
        
        if (STATE.hand.y < -threshold) STATE.rotation.x += speed * dt * (-STATE.hand.y - threshold);
        else if (STATE.hand.y > threshold) STATE.rotation.x -= speed * dt * (STATE.hand.y - threshold);
      } else {
        if (STATE.mode === 'TREE') {
          STATE.rotation.y += 0.3 * dt;
          STATE.rotation.x += (0 - STATE.rotation.x) * 2.0 * dt;
        } else {
          STATE.rotation.y += 0.1 * dt;
        }
      }

      mainGroup.rotation.y = STATE.rotation.y;
      mainGroup.rotation.x = STATE.rotation.x;

      particleSystem.forEach(p => p.update(dt, STATE.mode, STATE.focusTarget));
      composer.render();
    };

    // --- VISION SETUP ---
    const startVision = async () => {
      try {
        handLandmarker = await initVision();
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          
          const predictWebcam = () => {
            // Check if video is ready and has valid dimensions to avoid MediaPipe errors
            if (!videoRef.current || 
                videoRef.current.paused || 
                videoRef.current.ended || 
                !videoRef.current.videoWidth || 
                !videoRef.current.videoHeight) {
                // Request next frame to keep checking until ready
                requestAnimationFrame(predictWebcam);
                return;
            }

            const startTime = performance.now();
            try {
              const result = handLandmarker.detectForVideo(videoRef.current, startTime);
              
              // --- GESTURE PROCESSING ---
              const hintEl = document.getElementById('gesture-hint-text');
              const statusEl = document.getElementById('cam-status-dot');

              if (result.landmarks && result.landmarks.length > 0) {
                STATE.hand.detected = true;
                if (statusEl) statusEl.style.backgroundColor = '#00ff00';
                const lm = result.landmarks[0];
                STATE.hand.x = (lm[9].x - 0.5) * 2;
                STATE.hand.y = (lm[9].y - 0.5) * 2;

                const thumb = lm[4]; const index = lm[8]; const wrist = lm[0];
                const pinchDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
                const tips = [lm[8], lm[12], lm[16], lm[20]];
                let openDist = 0; tips.forEach(t => openDist += Math.hypot(t.x - wrist.x, t.y - wrist.y)); openDist /= 4;

                if (pinchDist < 0.05) {
                  if (hintEl) hintEl.innerText = "Active: Grab / Focus";
                  if (STATE.mode !== 'FOCUS') {
                    let closest = null; let minScreenDist = Infinity;
                    STATE.focusType = Math.floor(Math.random() * 4);
                    
                    particleSystem.filter(p => p.type === 'PHOTO').forEach(p => {
                      p.mesh.updateMatrixWorld();
                      const pos = new THREE.Vector3(); p.mesh.getWorldPosition(pos);
                      const screenPos = pos.project(camera);
                      const dist = Math.hypot(screenPos.x, screenPos.y);
                      if (screenPos.z < 1 && dist < CONFIG.interaction.grabRadius && dist < minScreenDist) {
                        minScreenDist = dist; closest = p.mesh;
                      }
                    });
                    if (closest) { STATE.mode = 'FOCUS'; STATE.focusTarget = closest; }
                  }
                } else if (openDist < 0.25) {
                  STATE.mode = 'TREE'; STATE.focusTarget = null;
                  if (hintEl) hintEl.innerText = "State: Tree Form";
                } else if (openDist > 0.4) {
                  STATE.mode = 'SCATTER'; STATE.focusTarget = null;
                  if (hintEl) hintEl.innerText = "State: Galaxy Scatter";
                }
              } else {
                STATE.hand.detected = false;
                if (statusEl) statusEl.style.backgroundColor = '#550000';
                if (hintEl) hintEl.innerText = "Waiting for hands...";
              }
            } catch (e) {
              console.warn("Detection error:", e);
            }

            requestAnimationFrame(predictWebcam);
          };
          predictWebcam();
        }
      } catch (e) {
        console.error("Camera/Vision failed:", e);
      }
    };

    startVision();
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- API EXPOSURE ---
    threeApi.current = {
      addPhotoTexture: addPhotoToScene,
      removePhoto: (id: string) => {
        const p = particleSystem.find(part => part.photoId === id);
        if (p) {
          photoMeshGroup.remove(p.mesh);
          particleSystem = particleSystem.filter(part => part !== p);
        }
      },
      clearPhotos: () => {
        particleSystem.filter(p => p.type === 'PHOTO').forEach(p => photoMeshGroup.remove(p.mesh));
        particleSystem = particleSystem.filter(p => p.type !== 'PHOTO');
      },
      rebuildParticles: (treeCount: number, dustCount: number) => {
        CONFIG.particles.count = treeCount;
        CONFIG.particles.dustCount = dustCount;
        createParticles();
      }
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (containerRef.current) containerRef.current.innerHTML = '';
      if (videoRef.current && videoRef.current.srcObject) {
         (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []); // Run once

  return (
    <>
      <div ref={containerRef} className="w-full h-full" />
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />
    </>
  );
};

export default ThreeCanvas;