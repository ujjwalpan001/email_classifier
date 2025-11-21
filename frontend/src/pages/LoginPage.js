import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import './LoginPage.css';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Node Component
function Node({ position, isActive, isEnergized }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);
  const floatOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  
  useFrame((state) => {
    if (meshRef.current) {
      const baseScale = isEnergized ? 1.5 : (hovered ? 1.3 : 1);
      const pulse = isActive ? Math.sin(state.clock.elapsedTime * 2 + floatOffset) * 0.12 : 0;
      meshRef.current.scale.setScalar(baseScale + pulse);
      
      // Subtle floating animation
      const float = Math.sin(state.clock.elapsedTime * 0.5 + floatOffset) * 0.1;
      meshRef.current.position.y = position.y + float;
    }
    
    // Pulsing glow effect
    if (glowRef.current && (isEnergized || isActive)) {
      const glowPulse = Math.sin(state.clock.elapsedTime * 4) * 0.3 + 0.7;
      glowRef.current.scale.setScalar((isEnergized ? 2.5 : 2) * glowPulse);
    }
  });

  return (
    <group>
      <mesh 
        ref={meshRef} 
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={isEnergized ? "#00ffff" : (isActive ? "#667eea" : "#4a5568")}
          emissive={isEnergized ? "#00ffff" : (isActive ? "#667eea" : "#1a1a1a")}
          emissiveIntensity={isEnergized ? 1.5 : 0.5}
          metalness={0.8}
          roughness={0.2}
        />
        {(isEnergized || hovered) && (
          <pointLight 
            color={isEnergized ? "#00ffff" : "#667eea"} 
            intensity={isEnergized ? 3 : 1.5} 
            distance={5} 
          />
        )}
      </mesh>
      
      {/* Outer glow sphere */}
      {(isEnergized || isActive) && (
        <mesh ref={glowRef} position={position}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial
            color={isEnergized ? "#00ffff" : "#667eea"}
            transparent
            opacity={isEnergized ? 0.3 : 0.15}
          />
        </mesh>
      )}
    </group>
  );
}

// Connection Lines Component
function Connections({ nodes, energyPath, energyProgress }) {
  const linesRef = useRef();
  
  const connections = useMemo(() => {
    const conns = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = nodes[i].distanceTo(nodes[j]);
        if (distance < 5.5) {
          conns.push({ start: nodes[i], end: nodes[j], distance, startIdx: i, endIdx: j });
        }
      }
    }
    return conns;
  }, [nodes]);

  useFrame(() => {
    // Skip updates after 85% to reduce lag at the end
    if (linesRef.current && energyProgress > 0 && energyProgress < 0.85) {
      linesRef.current.children.forEach((line, idx) => {
        const material = line.material;
        const conn = connections[idx];
        
        // Distance-based opacity for depth effect
        const baseOpacity = Math.max(0.08, 0.25 - conn.distance * 0.03);
        
        // Check if this connection is in the energy path
        let isInPath = false;
        for (let i = 0; i < energyPath.length - 1; i++) {
          if ((energyPath[i] === conn.startIdx && energyPath[i + 1] === conn.endIdx) ||
              (energyPath[i] === conn.endIdx && energyPath[i + 1] === conn.startIdx)) {
            isInPath = true;
            break;
          }
        }
        
        if (isInPath && energyProgress > 0) {
          material.color.setHex(0x00ffff);
          material.opacity = 0.9;
        } else {
          // Vary colors based on distance for depth
          const colorMix = conn.distance / 5.5;
          material.color.setRGB(
            0.4 + colorMix * 0.2,
            0.5 + colorMix * 0.3,
            0.9
          );
          material.opacity = baseOpacity;
        }
      });
    }
  });

  return (
    <group ref={linesRef}>
      {connections.map((conn, idx) => {
        const points = [conn.start, conn.end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <line key={idx} geometry={geometry}>
            <lineBasicMaterial
              attach="material"
              color="#667eea"
              transparent
              opacity={0.15}
            />
          </line>
        );
      })}
    </group>
  );
}

// Floating ambient particles
function FloatingParticle({ initialPosition, speed, phase, color }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime * speed;
      meshRef.current.position.x = initialPosition.x + Math.sin(time + phase) * 0.5;
      meshRef.current.position.y = initialPosition.y + Math.cos(time * 0.7 + phase) * 0.5;
      meshRef.current.position.z = initialPosition.z + Math.sin(time * 0.5 + phase) * 0.5;
      
      // Fade based on distance from center
      const distance = meshRef.current.position.length();
      const opacity = Math.max(0.1, 0.5 - distance * 0.02);
      meshRef.current.material.opacity = opacity;
    }
  });
  
  return (
    <mesh ref={meshRef} position={initialPosition}>
      <sphereGeometry args={[0.03, 4, 4]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

// Energy Particle traveling through nodes
function EnergyParticle({ nodes, path, progress }) {
  const particleRef = useRef();
  const trailPositions = useRef([]);
  const frameCount = useRef(0);
  
  useFrame(() => {
    if (progress >= 1) {
      return;
    }
    
    if (particleRef.current && path.length > 1) {
      const totalSegments = path.length - 1;
      const currentProgress = progress * totalSegments;
      const currentSegment = Math.floor(currentProgress);
      const segmentProgress = currentProgress - currentSegment;
      
      if (currentSegment < totalSegments) {
        const start = nodes[path[currentSegment]];
        const end = nodes[path[currentSegment + 1]];
        
        const newPos = new THREE.Vector3();
        newPos.lerpVectors(start, end, segmentProgress);
        particleRef.current.position.copy(newPos);
        
        // Stop trail updates after 85% to reduce lag at the end
        if (progress < 0.85) {
          // Update trail only every 3 frames to reduce overhead
          frameCount.current++;
          if (frameCount.current % 3 === 0) {
            trailPositions.current.push(newPos.clone());
            if (trailPositions.current.length > 6) {
              trailPositions.current.shift();
            }
          }
        } else if (progress > 0.92) {
          // Clear trail near end to reduce render load
          trailPositions.current = [];
        }
      }
    }
  });

  return (
    <>
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial
          color="#00ffff"
        />
        <pointLight color="#00ffff" intensity={4} distance={2.5} />
      </mesh>
      
      {/* Optimized trail effect with minimal geometry */}
      {progress < 0.9 && trailPositions.current.map((pos, idx) => {
        const opacity = idx / Math.max(trailPositions.current.length, 1);
        const size = 0.08 * opacity;
        return (
          <mesh key={idx} position={pos}>
            <sphereGeometry args={[size, 4, 4]} />
            <meshBasicMaterial
              color="#00ffff"
              transparent
              opacity={opacity * 0.7}
            />
          </mesh>
        );
      })}
    </>
  );
}

// Main Scene
function LoginScene({ isAnimating, onComplete }) {
  const [energyProgress, setEnergyProgress] = useState(0);
  const groupRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const coreRef = useRef();
  const completedRef = useRef(false);
  
  // Rotate entire network slowly
  useFrame((state) => {
    if (groupRef.current && !isAnimating) {
      groupRef.current.rotation.y += 0.002;
    }
    
    // Rotate rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += 0.01;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= 0.008;
    }
    
    // Pulse central core
    if (coreRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
      coreRef.current.scale.setScalar(pulse);
    }
  });
  
  const nodes = useMemo(() => {
    const nodePositions = [];
    const layers = 5;
    const nodesPerLayer = 16;
    
    for (let layer = 0; layer < layers; layer++) {
      const radius = 2.5 + layer * 1.8;
      const yPos = (layer - layers / 2) * 2.5;
      
      for (let i = 0; i < nodesPerLayer; i++) {
        const angle = (i / nodesPerLayer) * Math.PI * 2 + layer * 0.4;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        // Add slight random variation for organic feel
        const randomOffset = (Math.random() - 0.5) * 0.3;
        nodePositions.push(new THREE.Vector3(
          x + randomOffset * 0.5,
          yPos + randomOffset,
          z + randomOffset * 0.5
        ));
      }
    }
    
    return nodePositions;
  }, []);

  const energyPath = useMemo(() => {
    // Create a path that visits ALL nodes for complete connection
    const path = [0];
    const visited = new Set([0]);
    
    // Visit all nodes, not just 20
    while (path.length < nodes.length) {
      const current = path[path.length - 1];
      const currentPos = nodes[current];
      
      let nearest = -1;
      let minDist = Infinity;
      
      for (let i = 0; i < nodes.length; i++) {
        if (!visited.has(i)) {
          const dist = currentPos.distanceTo(nodes[i]);
          if (dist < minDist) {
            minDist = dist;
            nearest = i;
          }
        }
      }
      
      if (nearest === -1) break;
      path.push(nearest);
      visited.add(nearest);
    }
    
    return path;
  }, [nodes]);

  useFrame((state, delta) => {
    if (isAnimating && energyProgress < 1) {
      const newProgress = Math.min(energyProgress + delta * 0.4, 1);
      setEnergyProgress(newProgress);
      
      // Navigate immediately when animation completes
      if (newProgress >= 1 && !completedRef.current) {
        completedRef.current = true;
        if (onComplete) {
          onComplete();
        }
      }
    }
  });

  const energizedNodes = useMemo(() => {
    const energized = new Set();
    const currentIndex = Math.floor(energyProgress * energyPath.length);
    for (let i = 0; i <= currentIndex && i < energyPath.length; i++) {
      energized.add(energyPath[i]);
    }
    return energized;
  }, [energyProgress, energyPath]);

  // Floating particles for atmosphere
  const particles = useMemo(() => {
    const particlePositions = [];
    for (let i = 0; i < 150; i++) {
      particlePositions.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 35,
          (Math.random() - 0.5) * 35,
          (Math.random() - 0.5) * 35
        ),
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }
    return particlePositions;
  }, []);

  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#667eea" />
      <pointLight position={[0, 15, 0]} intensity={0.4} color="#00ffff" />
      
      {/* Central energy core */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#667eea"
          emissive="#667eea"
          emissiveIntensity={isAnimating ? 2.5 : 1.2}
          transparent
          opacity={0.4}
        />
        <pointLight color="#667eea" intensity={isAnimating ? 3 : 2} distance={10} />
      </mesh>
      
      {/* Outer rotating rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.02, 16, 100]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[2.5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#667eea" transparent opacity={0.4} />
      </mesh>
      
      {/* Ambient floating particles */}
      {particles.map((particle, idx) => (
        <FloatingParticle
          key={`particle-${idx}`}
          initialPosition={particle.position}
          speed={particle.speed}
          phase={particle.phase}
          color={idx % 3 === 0 ? "#00ffff" : idx % 3 === 1 ? "#667eea" : "#764ba2"}
        />
      ))}
      
      <group ref={groupRef}>
        <Connections nodes={nodes} energyPath={energyPath} energyProgress={energyProgress} />
        
        {nodes.map((position, idx) => (
          <Node
            key={idx}
            position={position}
            isActive={!isAnimating}
            isEnergized={energizedNodes.has(idx)}
          />
        ))}
        
        {isAnimating && energyProgress < 1 && (
          <EnergyParticle
            nodes={nodes}
            path={energyPath}
            progress={energyProgress}
          />
        )}
      </group>
    </>
  );
}

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Login failed');
        }
        
        localStorage.setItem('token', data.access_token);
        
        // Start energy animation - will navigate immediately when complete
        setIsAnimating(true);
      } else {
        const response = await fetch(`${API_URL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            username: formData.username
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Signup failed');
        }
        
        toast.success('Account created! Please login.');
        setIsLogin(true);
        setFormData({ email: '', password: '', username: '' });
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleAnimationComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className={`login-page ${isAnimating ? 'animating' : ''}`}>
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
          <fog attach="fog" args={['#0a0a0a', 10, 30]} />
          <LoginScene isAnimating={isAnimating} onComplete={handleAnimationComplete} />
        </Canvas>
      </div>

      <div className={`login-container ${isAnimating ? 'fade-out' : ''}`}>
        <div className="login-card">
          <h2 className="login-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="login-subtitle">
            {isLogin ? 'Connect to the network' : 'Join the network'}
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="form-group">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <button type="submit" className="login-button" disabled={isAnimating}>
              <span>{isLogin ? 'Connect' : 'Create Account'}</span>
            </button>
          </form>

          <p className="toggle-text">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign Up' : 'Login'}
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}

export default LoginPage;
