import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import React, { useRef, useState, Suspense, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, SpotLight, ContactShadows, useProgress } from '@react-three/drei';
import { Battery, WifiOff, Clock, Map, Navigation, Users, ShieldCheck, Zap, ArrowRight, Package, User, MousePointer2 } from 'lucide-react';
import * as THREE from 'three';

interface NeuralConstellationParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  pulse: number;
  speed: number;
}
// ═══════════════════════════════════════════════════════════
// NEURAL CONSTELLATION — The Living Hero Background
// ═══════════════════════════════════════════════════════════
function NeuralConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current as (HTMLCanvasElement & { _particles?: NeuralConstellationParticle[] }) | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const W = canvas.width;
    const H = canvas.height;
    
    // Performance optimization: skip heavy O(N^2) calculations if scrolled out of view
    if (window.scrollY > window.innerHeight * 1.5) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const t = performance.now() * 0.001;

    // Clear with deep void
    ctx.fillStyle = '#010409';
    ctx.fillRect(0, 0, W, H);

    // ── Aurora Blobs (morphing gradient orbs) ──
    const blobs = [
      { x: W * 0.2 + Math.sin(t * 0.3) * W * 0.1, y: H * 0.3 + Math.cos(t * 0.2) * H * 0.1, r: W * 0.35, color: [0, 40, 80] },
      { x: W * 0.8 + Math.cos(t * 0.25) * W * 0.08, y: H * 0.6 + Math.sin(t * 0.35) * H * 0.08, r: W * 0.3, color: [0, 60, 120] },
      { x: W * 0.5 + Math.sin(t * 0.15) * W * 0.12, y: H * 0.5 + Math.cos(t * 0.4) * H * 0.05, r: W * 0.25, color: [0, 100, 140] },
    ];
    blobs.forEach(b => {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      grad.addColorStop(0, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, 0.06)`);
      grad.addColorStop(0.5, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, 0.02)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });

    // ── Particle System ──
    if (!canvas._particles) {
      canvas._particles = [];
      const count = Math.min(180, Math.floor(W * H / 8000));
      for (let i = 0; i < count; i++) {
        canvas._particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          pulse: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.5 + 0.5,
        });
      }
    }

    const particles = canvas._particles;
    const mx = mouseRef.current.x * W;
    const my = mouseRef.current.y * H;

    // Update & draw particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Mouse interaction — particles gently repel
      const dx = p.x - mx;
      const dy = p.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const force = (200 - dist) / 200 * 0.15;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      p.vx *= 0.995;
      p.vy *= 0.995;

      // Wrap edges
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      // Pulsing glow
      const pulse = Math.sin(t * p.speed + p.pulse) * 0.5 + 0.5;
      const alpha = 0.15 + pulse * 0.4;
      const sz = p.size * (0.8 + pulse * 0.4);

      // Glow halo
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 4);
      glow.addColorStop(0, `rgba(123, 162, 144, ${alpha * 0.3})`);
      glow.addColorStop(1, 'rgba(123, 162, 144, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(p.x - sz * 4, p.y - sz * 4, sz * 8, sz * 8);

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 230, 255, ${alpha})`;
      ctx.fill();
    });

    // ── Neural Connections ──
    const connectionDist = W * 0.1;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const ddx = particles[i].x - particles[j].x;
        const ddy = particles[i].y - particles[j].y;
        const d = ddx * ddx + ddy * ddy;
        if (d < connectionDist * connectionDist) {
          const a = (1 - Math.sqrt(d) / connectionDist) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 180, 255, ${a})`;
          ctx.stroke();
        }
      }
    }

    // ── Slow Horizontal Scan Line ──
    const scanY = (t * 40) % H;
    const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    scanGrad.addColorStop(0, 'rgba(123, 162, 144, 0)');
    scanGrad.addColorStop(0.5, 'rgba(123, 162, 144, 0.03)');
    scanGrad.addColorStop(1, 'rgba(123, 162, 144, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 30, W, 60);

    // ── Faint Grid Overlay ──
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.012)';
    ctx.lineWidth = 0.5;
    const gridSize = 80;
    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      (canvas as any)._particles = undefined;
    };

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouse);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}

// Smooth easing functions
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

// Showroom Platform
function ShowroomPlatform() {
  return (
    <group position={[0, -3.48, 0]}>
      {/* Main platform disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[8, 8, 0.08, 64]} />
        <meshStandardMaterial
          color="#0a0e18"
          metalness={0.9}
          roughness={0.15}
          envMapIntensity={0.5}
        />
      </mesh>
      {/* Glowing edge ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <torusGeometry args={[8, 0.02, 8, 128]} />
        <meshStandardMaterial
          color="#00d2ff"
          emissive="#00d2ff"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      {/* Subtle inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <torusGeometry args={[5, 0.01, 8, 128]} />
        <meshStandardMaterial
          color="#00d2ff"
          emissive="#00d2ff"
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

let globalHeroStartTime: number | null = null;

function Hero3DScene({ isReady }: { isReady: boolean }) {
  const tokenflow = useGLTF('/models/FINAL_TOKENFLOW_MODEL-v1.glb');
  const hospital = useGLTF('/models/FINAL_HOSPITAL-v1.glb');
  const restaurant = useGLTF('/models/FINAL_RESTAURANT-v1.glb');

  const tokenRef = useRef<THREE.Group>(null);
  const hospitalRef = useRef<THREE.Group>(null);
  const restaurantRef = useRef<THREE.Group>(null);
  const sweepLightRef = useRef<THREE.SpotLight>(null);
  const rimLightRef = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    if (!isReady) return; // Wait until loading screen is fully gone
    
    if (globalHeroStartTime === null) {
      globalHeroStartTime = performance.now() / 1000;
    }
    
    const t = (performance.now() / 1000) - globalHeroStartTime;

    // Quintic ease-out — ultra smooth, no abrupt deceleration
    const ease5 = (x: number) => 1 - Math.pow(1 - x, 5);

    // ═══ TokenFlow rises from below — continuous blend into idle ═══
    if (tokenRef.current) {
      const p = ease5(clamp01((t - 0.3) / 3.5));
      tokenRef.current.position.x = 0;
      tokenRef.current.position.z = -1;
      tokenRef.current.position.y = -11 + p * 8 + p * Math.sin(t * 0.5) * 0.06;
      tokenRef.current.rotation.y = p * Math.sin(t * 0.3) * 0.03;
    }

    // ═══ Hospital from left — slow, smooth, no stuck feeling ═══
    if (hospitalRef.current) {
      const raw = clamp01((t - 1.5) / 5);
      const p = 1 - Math.pow(1 - raw, 3);
      hospitalRef.current.position.x = -18 + p * 13;
      hospitalRef.current.position.z = -1.5;
      hospitalRef.current.position.y = -3 + p * Math.sin(t * 0.4 + 1) * 0.06;
      hospitalRef.current.rotation.y = p * (Math.PI / 4);
    }

    // ═══ Restaurant from right — slow, smooth, no stuck feeling ═══
    if (restaurantRef.current) {
      const raw = clamp01((t - 1.5) / 5);
      const p = 1 - Math.pow(1 - raw, 3);
      restaurantRef.current.position.x = 18 - p * 13;
      restaurantRef.current.position.z = -1.5;
      restaurantRef.current.position.y = -3 + p * Math.sin(t * 0.4 + 2) * 0.06;
      restaurantRef.current.rotation.y = -p * (Math.PI / 4);
    }

    // ═══ LIGHTS — smooth continuous fade ═══
    if (rimLightRef.current) {
      rimLightRef.current.intensity = ease5(clamp01(t / 3)) * 10;
    }

    if (sweepLightRef.current) {
      const sweepP = clamp01(t / 7);
      const easedSweep = sweepP < 0.5 ? 2 * sweepP * sweepP : 1 - Math.pow(-2 * sweepP + 2, 2) / 2;
      sweepLightRef.current.position.x = -12 + easedSweep * 24 + (sweepP >= 1 ? Math.sin(t * 0.3) * 3 : 0);
      sweepLightRef.current.intensity = ease5(clamp01(t / 1.5)) * 2.2 + (sweepP >= 1 ? Math.sin(t * 0.4) * 0.3 : 0);
    }
  });

  return (
    <>
      <Environment preset="city" environmentIntensity={0.6} environmentRotation={[0, Math.PI / 2, 0]} />

      {/* Ambient — crisp base illumination so dark models never disappear */}
      <ambientLight intensity={0.4} color="#ffffff" />

      {/* Dramatic backlight rim (the signature car-ad look) */}
      <spotLight
        ref={rimLightRef}
        position={[0, 6, -8]}
        angle={0.7}
        penumbra={1}
        intensity={0}
        color="#c0e0ff"
        castShadow
      />



      {/* Key light — centered overhead */}
      <directionalLight position={[0, 11, 6]} intensity={1.3} color="#ffffff" />
      {/* Soft left fill light */}
      <directionalLight position={[-8, 7, 3]} intensity={0.5} color="#dce8f8" />
      {/* Right light — removed as requested */}


      {/* ── TokenFlow (Center, slightly back) ── */}
      <primitive ref={tokenRef} object={tokenflow.scene.clone()} position={[0, -11, -1]} scale={5} />

      {/* ── Hospital (Slides from left) ── */}
      <primitive ref={hospitalRef} object={hospital.scene.clone()} position={[-20, -3, -1.5]} scale={4.5} rotation={[0, 0, 0]} />

      {/* ── Restaurant (Slides from right) ── */}
      <primitive ref={restaurantRef} object={restaurant.scene.clone()} position={[20, -3, -1.5]} scale={4.5} rotation={[0, 0, 0]} />

      {/* Contact shadows for grounding */}
      <ContactShadows
        position={[0, -3.5, 0]}
        opacity={0.7}
        scale={25}
        blur={2.5}
        far={5}
        resolution={1024}
        color="#000000"
      />

    </>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        style={{ fontSize: '3rem', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '1rem', textTransform: 'uppercase' }}
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}
      >
        {subtitle}
      </motion.p>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem 1rem', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-accent-primary)', marginBottom: '0.5rem', lineHeight: '1' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', wordWrap: 'break-word', whiteSpace: 'normal', lineHeight: '1.3', maxWidth: '100%' }}>{label}</div>
    </div>
  );
}

function ShowcaseModel({ path, scale, position }: { path: string; scale: number; position: [number, number, number] }) {
  const gltf = useGLTF(path);
  return <primitive object={gltf.scene.clone()} scale={scale} position={position} />;
}

interface ProductShowcaseProps {
  industry: string;
  title: string;
  description: string;
  metrics: Array<{ value: string; label: string }>;
  reverse: boolean;
  image?: string;
  model?: string;
  modelPosition?: [number, number, number];
}

function ProductShowcase({ industry, title, description, metrics, reverse, image, model, modelPosition }: ProductShowcaseProps) {
  const textAlignment = reverse ? 'flex-start' : 'flex-end';
  const canvasPosition = reverse 
    ? { right: '-50%', width: '150%' } 
    : { left: '-50%', width: '150%' };
  const mPos = modelPosition || [0, -6.5, 0];
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { margin: "200px" });
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (inView) setHasMounted(true);
  }, [inView]);

  return (
    <div ref={sectionRef} style={{ position: 'relative', minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center' }}>

      {/* Immersive 3D Background - Offset to place model on left/right seamlessly */}
      {model && hasMounted && (
        <div style={{ position: 'absolute', top: 0, bottom: 0, ...canvasPosition, zIndex: 0, cursor: 'grab' }}>
          <Canvas
            frameloop={inView ? 'always' : 'demand'}
            camera={{ position: [0, 0, 18], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true }}
          >
            <Environment preset="studio" environmentIntensity={0.4} environmentRotation={[0, Math.PI / 2, 0]} />
            <ambientLight intensity={0.35} color="#ffffff" />
            <directionalLight position={[-5, 7, 5]} intensity={0.8} color="#e6f0ff" />
            {/* Right side light — removed as requested */}
            <Suspense fallback={null}>
              <ShowcaseModel path={model} scale={10} position={mPos} />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} target={[0, 0, 0]} />
          </Canvas>
        </div>
      )}

      {/* Foreground Content */}
      <div className="container" style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: textAlignment, pointerEvents: 'none' }}>
        <motion.div 
          style={{ width: '45%', pointerEvents: 'auto' }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-20%" }}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } }
          }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }} style={{ color: 'var(--color-accent-primary)', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {industry}
          </motion.div>
          <motion.h3 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }} style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
            {title}
          </motion.h3>
          <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }} style={{ fontSize: '1.15rem', color: 'var(--color-text-secondary)', lineHeight: '1.7', marginBottom: '3rem' }}>
            {description}
            <span style={{ display: 'flex', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--color-accent-primary)', opacity: 0.85, fontStyle: 'italic', alignItems: 'center', gap: '0.5rem' }}>
              <MousePointer2 size={16} /> Feel free to grab and rotate the 3D model to look around!
            </span>
          </motion.p>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }} style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem' }}>
            {metrics.map((m, i) => (
              <MetricCard key={i} value={m.value} label={m.label} />
            ))}
          </motion.div>

          <motion.a 
            whileHover={{ x: 5, color: 'var(--color-accent-primary)' }} 
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            href="https://hanbee.in/enquiry-form" target="_blank" rel="noreferrer" 
            style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--color-accent-primary)', paddingBottom: '4px' }}
          >
            Book a demo <ArrowRight size={18} />
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}

function StepCard({ number, title, description, subtitle }: { number: string; title: string; description: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.01, y: -2, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.08)' }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="glass-panel"
      style={{ padding: '3rem', flex: 1, display: 'flex', flexDirection: 'column', cursor: 'default' }}
    >
      <div style={{ fontSize: '4rem', fontWeight: '800', color: 'rgba(255,255,255,0.1)', lineHeight: '1', marginBottom: '1.5rem' }}>{number}</div>
      <h4 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>{title}</h4>
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: '2rem', flex: 1 }}>{description}</p>
      <div style={{ color: 'var(--color-accent-primary)', fontWeight: '600', fontSize: '0.9rem' }}>{subtitle}</div>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <motion.div 
      className="glass-panel" 
      whileHover={{ scale: 1.02, y: -2, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.08)' }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', cursor: 'default' }}
    >
      <div style={{ background: 'var(--color-accent-glow)', padding: '1rem', borderRadius: '12px', color: 'var(--color-accent-primary)' }}>
        <Icon size={24} />
      </div>
      <div>
        <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>{title}</h4>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>{description}</p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOADING SCREEN — Minimal three-dot animation, waits for real model load
// ═══════════════════════════════════════════════════════════
const MODEL_PATHS = [
  '/models/FINAL_HOSPITAL-v1.glb',
  '/models/FINAL_RESTAURANT-v1.glb',
  '/models/FINAL_TOKENFLOW_MODEL-v1.glb'
];

// Preload models so they begin downloading immediately 
MODEL_PATHS.forEach(path => useGLTF.preload(path));

function LoadingScreen({ onFinished }: { onFinished: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const { progress, active, loaded, total } = useProgress();

  // Prevent scrolling while loading
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    // When 3D assets finish loading
    const isDone = (progress === 100 && !active) || (total > 0 && loaded >= total && !active);
    
    if (isDone) {
      const minDelay = setTimeout(() => {
        setFadeOut(true);
        setTimeout(onFinished, 700);
      }, 500);
      return () => clearTimeout(minDelay);
    }
  }, [progress, active, loaded, total, onFinished]);

  // Fallback ONLY for the fully-cached case where useProgress never registers any active loading
  // because the preload finished instantly from the browser cache before this component mounted.
  useEffect(() => {
    const cacheFallback = setTimeout(() => {
      if (total === 0 && !active) {
        setFadeOut(true);
        setTimeout(onFinished, 700);
      }
    }, 1500);
    return () => clearTimeout(cacheFallback);
  }, [total, active, onFinished]);

  return (
    <motion.div
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#010409',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '2.5rem',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* HANBEE text */}
      <div style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 700,
        fontSize: '1.4rem', letterSpacing: '0.35em',
        color: '#ffffff',
      }}>
        HANBEE
      </div>

      {/* Three bouncing dots with subtle olive glow */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: '#7ba290',
                boxShadow: '0 0 10px rgba(123, 162, 144, 0.5)',
              }}
            />
          ))}
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          color: 'var(--color-text-secondary, #8b949e)',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          {progress > 0 ? `Loading 3D Models • ${Math.round(progress)}%` : 'Loading 3D Experience'}
        </div>
      </div>
    </motion.div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const handleLoadingFinished = useCallback(() => setIsLoading(false), []);
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { margin: "200px" });

  return (
    <div className="app-container" style={{ overflowX: 'hidden' }}>
      {isLoading && <LoadingScreen onFinished={handleLoadingFinished} />}
      {/* Navigation */}
      <nav style={{ padding: '1.5rem 2rem', position: 'fixed', width: '100%', top: 0, zIndex: 100, background: 'linear-gradient(to bottom, rgba(1,4,9,0.9), transparent)', backdropFilter: 'blur(8px)', maskImage: 'linear-gradient(to bottom, black 60%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Deltha', sans-serif", fontSize: '1.5rem', letterSpacing: '0.15em', color: 'var(--color-text-primary)' }}>
            HANBEE
          </div>
          <div style={{ display: 'flex', gap: '2.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>
            <motion.a whileHover={{ color: '#ffffff' }} href="#healthcare" style={{ transition: 'color 0.3s', textDecoration: 'none', color: 'inherit' }}>Healthcare</motion.a>
            <motion.a whileHover={{ color: '#ffffff' }} href="#hospitality" style={{ transition: 'color 0.3s', textDecoration: 'none', color: 'inherit' }}>Hospitality</motion.a>
            <motion.a 
              whileHover={{ scale: 1.03, boxShadow: '0 5px 15px rgba(255, 255, 255, 0.1)' }} 
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              href="https://hanbee.in/enquiry-form" target="_blank" rel="noreferrer" className="glass-panel" 
              style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', color: '#fff', textDecoration: 'none' }}
            >
              Book Demo
            </motion.a>
          </div>
        </div>
      </nav>

      <main>
        {/* Cinematic Hero Section */}
        <section ref={heroRef} style={{ height: '100vh', width: '100vw', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#010409' }}>
          
          {/* Giant HANBEE Background Text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            width: '100vw',
            transform: 'translateY(-50%)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '24vw',
            fontWeight: '900',
            fontFamily: "'Inter', sans-serif",
            color: 'transparent',
            zIndex: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.01) 75%, rgba(255,255,255,0) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'blur(8.5px)',
            margin: 0,
            padding: 0,
            lineHeight: 1
          }}>
            <span style={{ marginLeft: '-0.03em' }}>H</span>
            <span>A</span>
            <span>N</span>
            <span>B</span>
            <span>E</span>
            <span style={{ marginRight: '-0.03em' }}>E</span>
          </div>

          {/* 3D Showroom Canvas */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            <Canvas
              frameloop={heroInView ? 'always' : 'demand'}
              camera={{ position: [0, 1, 6], fov: 55 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
            >
              <Suspense fallback={null}>
                <Hero3DScene isReady={!isLoading} />
              </Suspense>
            </Canvas>
          </div>

          {/* Bottom gradient fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%', zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to top, #010409 0%, transparent 100%)' }} />
        </section>

        {/* Where HANBEE Works */}
        <section style={{ padding: '8rem 0', background: 'rgba(255,255,255,0.01)' }}>
          <div className="container">
            <SectionHeading
              title="Where HANBEE works."
              subtitle="One robot. Six industries. Deployed across the spaces where people work, heal, and live."
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', maxWidth: '800px', margin: '0 auto' }}>
              {['Healthcare', 'Hospitality', 'Retail', 'Warehousing', 'Education', 'Corporate'].map(ind => (
                <div key={ind} className="glass-panel" style={{ padding: '1rem 2rem', borderRadius: '30px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                  {ind}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Industry Sections */}
        <section id="healthcare">
          <ProductShowcase
            industry="HEALTHCARE"
            title="Free your nurses. HANBEE handles the rest."
            description="Medicine rounds, lab sample transport, linen delivery - HANBEE takes on the routine so your staff can focus entirely on patient care."
            model="/models/FINAL_HOSPITAL-v1.glb"
            metrics={[
              { value: "40%", label: "Less workload" },
              { value: "9 hr", label: "Battery/shift" },
              { value: "Zero", label: "Contamination" }
            ]}
            reverse={false}
          />
        </section>

        <section id="hospitality">
          <ProductShowcase
            industry="HOSPITALITY"
            title="Five-star service. Without the five-star cost."
            description="Room service, amenity delivery, lobby assistance - HANBEE works silently around the clock, adding a premium touch to every guest interaction."
            model="/models/FINAL_RESTAURANT-v1.glb"
            metrics={[
              { value: "3×", label: "Faster delivery" },
              { value: "24/7", label: "Non-stop" },
              { value: "60%", label: "Fewer delays" }
            ]}
            reverse={true}
          />
        </section>

        <section id="tokenflow">
          <ProductShowcase
            industry="QUEUE MANAGEMENT"
            title="TokenFlow Lite. Smart Queue. Simple Solution."
            description="Eliminate waiting area chaos. TokenFlow seamlessly directs customers and instantly orchestrates HANBEE robot deployment based on live queue data."
            model="/models/FINAL_TOKENFLOW_MODEL-v1.glb"
            modelPosition={[0, -3.5, 0]}
            metrics={[
              { value: "0", label: "Wait confusion" },
              { value: "100%", label: "Automated routing" },
              { value: "Instant", label: "Robot dispatch" }
            ]}
            reverse={false}
          />
        </section>

        {/* How It Works */}
        <section id="how-it-works" style={{ padding: '8rem 0', position: 'relative', background: 'transparent' }}>
          <div className="container">
            <SectionHeading
              title="Simple to deploy. Impossible to live without."
              subtitle="Most automation is complex, expensive, and slow to roll out. HANBEE is the opposite - operational in a single day, with zero disruption to your team."
            />
            <div style={{ display: 'flex', gap: '2rem', marginTop: '4rem' }}>
              <StepCard
                number="01"
                title="We come to you."
                description="Our team delivers, unboxes, and sets up HANBEE at your location. No contractors. No construction. No IT department needed."
                subtitle="Same day delivery available"
              />
              <StepCard
                number="02"
                title="HANBEE learns your space."
                description="In under 60 minutes, HANBEE maps every corridor, corner, and floor of your facility autonomously, with zero input from your staff."
                subtitle="60 min floor mapping"
              />
              <StepCard
                number="03"
                title="Your team takes over."
                description="A 30-minute walkthrough is all it takes. Any staff member regardless of tech experience can assign tasks and run HANBEE confidently."
                subtitle="30 min staff training"
              />
            </div>
          </div>
        </section>

        {/* Built Different Features */}
        <section className="container" style={{ padding: '8rem 2rem' }}>
          <SectionHeading
            title="Not just a robot. A system that thinks with you."
            subtitle="HANBEE doesn't just follow instructions - it navigates, adapts, and works independently so your team never has to babysit it."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            <FeatureCard
              icon={Navigation}
              title="360° obstacle detection"
              description="Moves around people, trolleys, and tight spaces in real time - no collisions, ever."
            />
            <FeatureCard
              icon={Battery}
              title="18-hour battery life"
              description="Works a full double shift without stopping. Charges overnight, ready by morning."
            />
            <FeatureCard
              icon={WifiOff}
              title="Works without internet"
              description="Fully offline capable - no dependency on your network or cloud connectivity."
            />
          </div>
        </section>

        {/* Day One Timeline */}
        <section style={{ padding: '8rem 0', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="container">
            <SectionHeading
              title="From unboxing to operational - before dinner."
              subtitle="DAY ONE TIMELINE"
            />

            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <TimelineItem time="9:00 AM" title="Delivery & setup" description="HANBEE arrives fully assembled. We handle everything." icon={<Package size={20} />} />
              <TimelineItem time="10:00 AM" title="Floor mapping" description="Your entire facility mapped autonomously in 60 minutes." icon={<Map size={20} />} />
              <TimelineItem time="12:00 PM" title="Staff training" description="30-minute walkthrough. Zero tech experience needed." icon={<User size={20} />} />
              <TimelineItem time="2:00 PM" title="First live task" description="HANBEE is on your floor, working, same afternoon." icon={<Zap size={20} />} />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '10rem 0', background: 'radial-gradient(circle at 50% 0%, rgba(123, 162, 144, 0.05) 0%, transparent 60%)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '4rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Your floor. Transformed. <br /><span style={{ color: 'var(--color-text-secondary)' }}>In one day.</span>
            </h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', maxWidth: '700px', margin: '0 auto 4rem auto', lineHeight: '1.6' }}>
              Every day you wait is another day your staff handles work a robot could do. Book a 30-minute demo - we'll show you exactly how HANBEE fits your facility, your team, and your budget.
            </p>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
              <motion.a 
                whileHover={{ scale: 1.02, y: -2, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.08)' }} 
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                href="https://hanbee.in/enquiry-form" target="_blank" rel="noreferrer" className="glass-panel" 
                style={{ padding: '2rem 3rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', minWidth: '260px', textAlign: 'center' }}
              >
                <CalendarIcon size={32} color="var(--color-accent-primary)" />
                <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', wordWrap: 'break-word', whiteSpace: 'normal' }}>Book a demo</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', wordWrap: 'break-word', whiteSpace: 'normal', lineHeight: '1.3' }}>On-site demo available</div>
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.02, y: -2, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.08)' }} 
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                href="https://wa.me/919344477512" target="_blank" rel="noreferrer" className="glass-panel" 
                style={{ padding: '2rem 3rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', minWidth: '260px', textAlign: 'center' }}
              >
                <Users size={32} color="var(--color-accent-primary)" />
                <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', wordWrap: 'break-word', whiteSpace: 'normal' }}>Talk to sales</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', wordWrap: 'break-word', whiteSpace: 'normal', lineHeight: '1.3' }}>Response within 24 hours</div>
              </motion.a>
            </div>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '4rem 0', background: 'var(--color-bg-secondary)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontFamily: "'Deltha', sans-serif", fontSize: '1.5rem', letterSpacing: '0.15em', color: 'var(--color-text-primary)' }}>
            HANBEE
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
            <motion.a whileHover={{ color: '#ffffff' }} href="https://hanbee.in/ai-robotics-company-in-india#about" style={{ color: 'inherit', textDecoration: 'none' }}>About</motion.a>
            <motion.a whileHover={{ color: '#ffffff' }} href="https://hanbee.in/hanbee-technologies-support#contact-us" style={{ color: 'inherit', textDecoration: 'none' }}>Support</motion.a>
            <motion.a whileHover={{ color: '#ffffff' }} href="https://hanbee.in/hanbee-technologies-support#policy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</motion.a>
            <motion.a whileHover={{ color: '#ffffff' }} href="https://hanbee.in/hanbee-technologies-support#policy" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</motion.a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper icons
function CalendarIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

function TimelineItem({ time, title, description, icon }: { time: string; title: string; description: string; icon: string | React.ReactNode }) {
  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ width: '120px', fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-accent-primary)', flexShrink: 0 }}>
        {time}
      </div>
      <div style={{ fontSize: '2.5rem', flexShrink: 0, opacity: 0.8 }}>
        {icon}
      </div>
      <div>
        <h4 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>{title}</h4>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>{description}</p>
      </div>
    </div>
  );
}

export default App;

useGLTF.preload('/models/FINAL_HOSPITAL-v1.glb');
useGLTF.preload('/models/FINAL_RESTAURANT-v1.glb');
useGLTF.preload('/models/FINAL_TOKENFLOW_MODEL-v1.glb');
