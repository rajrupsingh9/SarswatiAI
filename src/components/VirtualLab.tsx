import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sphere, MeshDistortMaterial, PerspectiveCamera, Text } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, RotateCcw, Info, Settings, MousePointer2 } from 'lucide-react';

interface LabProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: string;
}

const AtomSimulation = ({ speed = 1 }: { speed?: number }) => {
  return (
    <group>
      {/* Nucleus */}
      <Sphere args={[0.3, 32, 32]}>
        <meshStandardMaterial color="#FF3366" emissive="#FF3366" emissiveIntensity={0.5} />
      </Sphere>
      
      {/* Electron Orbits */}
      <group rotation={[Math.PI / 4, 0, 0]}>
        <mesh>
          <torusGeometry args={[2, 0.02, 16, 100]} />
          <meshStandardMaterial color="#33ccff" transparent opacity={0.3} />
        </mesh>
        <Float speed={5 * speed} rotationIntensity={2} floatIntensity={2}>
          <mesh position={[2, 0, 0]}>
            <sphereGeometry args={[0.08]} />
            <meshStandardMaterial color="#33ccff" emissive="#33ccff" />
          </mesh>
        </Float>
      </group>

      <group rotation={[-Math.PI / 4, Math.PI / 3, 0]}>
        <mesh>
          <torusGeometry args={[1.5, 0.02, 16, 100]} />
          <meshStandardMaterial color="#FFD700" transparent opacity={0.3} />
        </mesh>
        <Float speed={4 * speed} rotationIntensity={1.5} floatIntensity={1.5}>
          <mesh position={[-1.5, 0, 0]}>
            <sphereGeometry args={[0.08]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" />
          </mesh>
        </Float>
      </group>
    </group>
  );
};

const PendulumSimulation = ({ gravity = 1 }: { gravity?: number }) => {
  const [rotation, setRotation] = useState(0);
  
  React.useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame += 0.05 * Math.sqrt(gravity);
      setRotation(Math.sin(frame) * (Math.PI / 4));
      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [gravity]);

  return (
    <group position={[0, 2, 0]}>
      {/* Ceiling */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      
      {/* Rod & Bob */}
      <group rotation={[0, 0, rotation]}>
        <mesh position={[0, -2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 4]} />
          <meshStandardMaterial color="#888" />
        </mesh>
        <mesh position={[0, -4, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#FF3366" />
        </mesh>
      </group>
    </group>
  );
};

const SolarSimulation = ({ orbitSpeed = 1 }: { orbitSpeed?: number }) => {
  return (
    <group>
      {/* Sun */}
      <Sphere args={[1, 32, 32]}>
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} />
      </Sphere>
      
      {/* Planets */}
      <group>
        <Float speed={2 * orbitSpeed} rotationIntensity={1} floatIntensity={1}>
          <group position={[3, 0, 0]}>
            <Sphere args={[0.3, 32, 32]}>
              <meshStandardMaterial color="#33ccff" />
            </Sphere>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.5, 0.01, 16, 100]} />
              <meshStandardMaterial color="#fff" transparent opacity={0.2} />
            </mesh>
          </group>
        </Float>
      </group>
    </group>
  );
};

const OpticsSimulation = ({ prismAngle = 0 }: { prismAngle?: number }) => {
  return (
    <group position={[0, -1, 0]} rotation={[0, prismAngle, 0]}>
      {/* Prism */}
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 3, 3]} />
        <meshStandardMaterial color="#33ccff" transparent opacity={0.3} />
      </mesh>
      
      {/* Incident White Ray */}
      <mesh position={[-3, 0, 0]} rotation={[0, 0, Math.PI / 10]}>
        <boxGeometry args={[4, 0.05, 0.05]} />
        <meshStandardMaterial color="white" emissive="white" />
      </mesh>

      {/* Dispersed Rays (VIBGYOR) */}
      {['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'].map((color, i) => (
        <mesh key={color} position={[2.5, (i - 3) * 0.2, 0]} rotation={[0, 0, -Math.PI / 12 + (i * 0.02)]}>
          <boxGeometry args={[4, 0.02, 0.02]} />
          <meshStandardMaterial color={color} emissive={color} />
        </mesh>
      ))}
    </group>
  );
};

const ElectromagnetismSimulation = ({ current = 1 }: { current?: number }) => {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Coil */}
      <mesh>
        <torusGeometry args={[2, 0.2, 16, 100, Math.PI * 1.8]} />
        <meshStandardMaterial color="#b87333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Magnetic Field Lines */}
      {[1, 1.5, 2, 2.5].map((rad) => (
        <mesh key={rad} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[rad, 0.01, 16, 100]} />
          <meshStandardMaterial color="#33ccff" transparent opacity={0.2 * current} />
        </mesh>
      ))}

      {/* Flowing Electrons */}
      <Float speed={10 * current} rotationIntensity={0} floatIntensity={0}>
        <mesh position={[2, 0, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="#33ccff" emissive="#33ccff" />
        </mesh>
      </Float>
    </group>
  );
};

const OrganicChemistrySimulation = ({ rotationSpeed = 1 }: { rotationSpeed?: number }) => {
  return (
    <Float speed={2 * rotationSpeed} rotationIntensity={1} floatIntensity={1}>
      <group>
        {/* Carbon (Central) */}
        <Sphere args={[0.5, 32, 32]}>
          <meshStandardMaterial color="#333" roughness={0.3} />
        </Sphere>

        {/* Hydrogens - Tetrahedral arrangement (approx) */}
        {[
          [1, 1, 1],
          [-1, -1, 1],
          [1, -1, -1],
          [-1, 1, -1]
        ].map((pos, i) => (
          <group key={i}>
            {/* Bond */}
            <mesh position={[pos[0] * 0.7, pos[1] * 0.7, pos[2] * 0.7]} rotation={[Math.atan2(pos[1], pos[0]), 0, Math.acos(pos[2] / Math.sqrt(3))]}>
              <cylinderGeometry args={[0.08, 0.08, 1.5]} />
              <meshStandardMaterial color="#888" />
            </mesh>
            {/* Hydrogen Atom */}
            <mesh position={[pos[0] * 1.4, pos[1] * 1.4, pos[2] * 1.4]}>
              <sphereGeometry args={[0.25]} />
              <meshStandardMaterial color="white" />
            </mesh>
          </group>
        ))}
      </group>
    </Float>
  );
};

const HeartSimulation = ({ heartRate = 1 }: { heartRate?: number }) => {
  return (
    <Float speed={2 * heartRate} rotationIntensity={0.5} floatIntensity={1}>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color="#FF3366"
          speed={3 * heartRate}
          distort={0.4}
          radius={1}
        />
      </mesh>
      {/* Arteries / Pulse effect */}
      <group>
        <mesh position={[0.5, 1, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 1]} />
          <meshStandardMaterial color="#FF3366" />
        </mesh>
      </group>
    </Float>
  );
};

const MathGraphSimulation = ({ curvature = 1 }: { curvature?: number }) => {
  return (
    <group position={[0, -2, 0]}>
      {/* Grid Floor */}
      <gridHelper args={[10, 10, '#33ccff', '#222']} />
      
      {/* 3D Paraboloid (Approximated with segments) */}
      <group>
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh key={i} position={[0, i * 0.3 * curvature, 0]}>
            <torusGeometry args={[(i + 1) * 0.25, 0.05, 16, 50]} />
            <meshStandardMaterial color="#nyra-primary" transparent opacity={0.5} />
          </mesh>
        ))}
      </group>

      <Text position={[0, 5, 0]} fontSize={0.5} color="white">
        z = x² + y²
      </Text>
    </group>
  );
};

export const VirtualLab: React.FC<LabProps> = ({ isOpen, onClose, initialType = 'atom' }) => {
  const [type, setType] = useState(initialType);
  const [config, setConfig] = useState<Record<string, number>>({
    atom_speed: 1,
    pendulum_gravity: 1,
    solar_speed: 1,
    optics_angle: 0,
    electro_current: 1,
    organic_rotation: 1,
    heart_rate: 1,
    math_curvature: 1
  });

  const updateConfig = (key: string, val: number) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-4 md:inset-10 z-[100] bg-nyra-panel rounded-3xl border border-nyra-border shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Sidebar / Controls */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-nyra-border p-6 flex flex-col bg-slate-900/50">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-nyra-primary/20 flex items-center justify-center border border-nyra-primary/30">
                <Settings className="w-5 h-5 text-nyra-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg leading-tight">3D Virtual Lab</h2>
                <span className="text-[10px] text-nyra-secondary uppercase tracking-[0.2em] font-bold">Experimental Mode</span>
              </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {[
                { id: 'atom', label: 'Atomic Structure', desc: "Bohr's Model" },
                { id: 'pendulum', label: 'Simple Pendulum', desc: 'SHM Simulation' },
                { id: 'solar', label: 'Gravity & Orbit', desc: 'Planetary Motion' },
                { id: 'optics', label: 'Optics: Prism', desc: 'Light Dispersion' },
                { id: 'electro', label: 'Electromagnetism', desc: 'Magnetic Fields' },
                { id: 'organic', label: 'Organic Chem', desc: 'Molecule Structure' },
                { id: 'heart', label: 'Human Heart', desc: 'Biology Simulation' },
                { id: 'math', label: 'Math: 3D Graph', desc: 'Geometry Visual' }
              ].map((lab) => (
                <button 
                  key={lab.id}
                  onClick={() => setType(lab.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    type === lab.id ? 'bg-nyra-primary/20 border-nyra-primary/50 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="font-bold text-xs">{lab.label}</div>
                  <div className="text-[10px] opacity-70">{lab.desc}</div>
                </button>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-nyra-border">
              <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                <MousePointer2 className="w-3 h-3" />
                <span>Drag to Rotate • Scroll to Zoom</span>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative bg-slate-950">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-500 transition-all backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-6 left-6 z-10 bg-slate-900/80 border border-slate-700 p-4 rounded-2xl backdrop-blur-md max-w-xs">
               <div className="flex items-center gap-2 mb-2">
                 <Info className="w-4 h-4 text-nyra-primary" />
                 <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Concept Deep-Dive</span>
               </div>
               <div className="text-[11px] text-slate-300 leading-relaxed">
                 {type === 'atom' && "Bohr's model explains how electrons occupy specific energy levels around the nucleus. Essential for IIT-JEE Quantum Mechanics."}
                 {type === 'pendulum' && "Simple Harmonic Motion (SHM). The period only depends on the length of the string and gravity, not the mass of the bob!"}
                 {type === 'solar' && "Kepler's Laws and Universal Law of Gravitation. See how bodies attract according to the inverse-square law."}
                 {type === 'optics' && "Dispersion of light through a prism. White light breaks into VIBGYOR due to different refractive indices for each wavelength."}
                 {type === 'electro' && "Faraday's Law & Electromagnetism. Moving charges create magnetic fields. Notice the field lines around the coil."}
                 {type === 'organic' && "Tetrahedral geometry of Methane (CH₄). Bond angle is approximately 109.5°, critical for Organic Chemistry basics."}
                 {type === 'heart' && "Anatomy & Rhythm. The heart is a muscular pump. See the pulsating distortion reflecting the cardiac cycle."}
                 {type === 'math' && "Three-dimensional visualization of functions. Paraboloids help understand local minima/maxima in Calculus."}
               </div>
            </div>

            <div className="absolute top-6 left-6 z-10 space-y-3">
              {type === 'atom' && (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl backdrop-blur-md w-48 shadow-xl">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Electron Speed</label>
                  <input 
                    type="range" min="0.1" max="3" step="0.1" 
                    value={config.atom_speed} 
                    onChange={(e) => updateConfig('atom_speed', parseFloat(e.target.value))}
                    className="w-full accent-nyra-primary"
                  />
                </div>
              )}
              {type === 'pendulum' && (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl backdrop-blur-md w-48 shadow-xl">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Gravity Strength</label>
                  <input 
                    type="range" min="0.1" max="5" step="0.1" 
                    value={config.pendulum_gravity} 
                    onChange={(e) => updateConfig('pendulum_gravity', parseFloat(e.target.value))}
                    className="w-full accent-nyra-primary"
                  />
                </div>
              )}
              {type === 'solar' && (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl backdrop-blur-md w-48 shadow-xl">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Orbit Velocity</label>
                  <input 
                    type="range" min="0.1" max="4" step="0.1" 
                    value={config.solar_speed} 
                    onChange={(e) => updateConfig('solar_speed', parseFloat(e.target.value))}
                    className="w-full accent-nyra-primary"
                  />
                </div>
              )}
              {type === 'optics' && (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl backdrop-blur-md w-48 shadow-xl">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Prism Rotation</label>
                  <input 
                    type="range" min={-Math.PI} max={Math.PI} step={0.1} 
                    value={config.optics_angle} 
                    onChange={(e) => updateConfig('optics_angle', parseFloat(e.target.value))}
                    className="w-full accent-nyra-primary"
                  />
                </div>
              )}
              {type === 'electro' && (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl backdrop-blur-md w-48 shadow-xl">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Coil Current (I)</label>
                  <input 
                    type="range" min="0" max="2" step="0.1" 
                    value={config.electro_current} 
                    onChange={(e) => updateConfig('electro_current', parseFloat(e.target.value))}
                    className="w-full accent-nyra-primary"
                  />
                </div>
              )}
              {type === 'organic' && (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl backdrop-blur-md w-48 shadow-xl">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Rotation Speed</label>
                  <input 
                    type="range" min="0" max="4" step="0.1" 
                    value={config.organic_rotation} 
                    onChange={(e) => updateConfig('organic_rotation', parseFloat(e.target.value))}
                    className="w-full accent-nyra-primary"
                  />
                </div>
              )}
              {type === 'heart' && (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl backdrop-blur-md w-48 shadow-xl">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Heart Rate (BPM)</label>
                  <input 
                    type="range" min="0.5" max="4" step="0.1" 
                    value={config.heart_rate} 
                    onChange={(e) => updateConfig('heart_rate', parseFloat(e.target.value))}
                    className="w-full accent-nyra-primary"
                  />
                </div>
              )}
              {type === 'math' && (
                <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-2xl backdrop-blur-md w-48 shadow-xl">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Graphic Curvature</label>
                  <input 
                    type="range" min="0.1" max="2" step="0.1" 
                    value={config.math_curvature} 
                    onChange={(e) => updateConfig('math_curvature', parseFloat(e.target.value))}
                    className="w-full accent-nyra-primary"
                  />
                </div>
              )}
            </div>

            <Canvas shadows gl={{ preserveDrawingBuffer: true }} id="virtual-lab-canvas">
              <PerspectiveCamera makeDefault position={[0, 0, 8]} />
              <color attach="background" args={['#020617']} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} castShadow />
              <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
              
              <Suspense fallback={null}>
                {type === 'atom' && <AtomSimulation speed={config.atom_speed} />}
                {type === 'pendulum' && <PendulumSimulation gravity={config.pendulum_gravity} />}
                {type === 'solar' && <SolarSimulation orbitSpeed={config.solar_speed} />}
                {type === 'optics' && <OpticsSimulation prismAngle={config.optics_angle} />}
                {type === 'electro' && <ElectromagnetismSimulation current={config.electro_current} />}
                {type === 'organic' && <OrganicChemistrySimulation rotationSpeed={config.organic_rotation} />}
                {type === 'heart' && <HeartSimulation heartRate={config.heart_rate} />}
                {type === 'math' && <MathGraphSimulation curvature={config.math_curvature} />}
              </Suspense>

              <OrbitControls enableDamping dampingFactor={0.05} />
            </Canvas>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
