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
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      const baseScale = isEnergized ? 1.5 : (hovered ? 1.3 : 1);
      const pulse = isActive ? Math.sin(state.clock.elapsedTime * 3) * 0.2 : 0;
      meshRef.current.scale.setScalar(baseScale + pulse);
      
      if (isEnergized) {
        meshRef.current.rotation.y += 0.05;
        meshRef.current.rotation.x += 0.03;
      }
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial
        color={isEnergized ? "#00ffff" : (isActive ? "#667eea" : "#4a5568")}
        emissive={isEnergized ? "#00ffff" : (isActive ? "#667eea" : "#2d3748")}
        emissiveIntensity={isEnergized ? 2 : (isActive ? 1.5 : 0.5)}
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
        if (distance < 5) {
          conns.push({ start: nodes[i], end: nodes[j], distance, startIdx: i, endIdx: j });
        }
      }
    }
    return conns;
  }, [nodes]);

  useFrame(() => {
    if (linesRef.current && energyProgress > 0) {
      linesRef.current.children.forEach((line, idx) => {
        const material = line.material;
        const conn = connections[idx];
        
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
          material.color.setHex(0x667eea);
          material.opacity = 0.15;
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

// Energy Particle traveling through nodes
function EnergyParticle({ nodes, path, progress }) {
  const particleRef = useRef();
  const trailPositions = useRef([]);
  
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
        
        // Create trail effect
        trailPositions.current.push(newPos.clone());
        if (trailPositions.current.length > 20) {
          trailPositions.current.shift();
        }
      }
    }
  });

  return (
    <>
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={3}
          toneMapped={false}
        />
        <pointLight color="#00ffff" intensity={5} distance={3} />
      </mesh>
      
      {/* Trail effect */}
      {trailPositions.current.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <sphereGeometry args={[0.1 * (idx / Math.max(trailPositions.current.length, 1)), 8, 8]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={idx / Math.max(trailPositions.current.length, 1)}
          />
        </mesh>
      ))}
    </>
  );
}

// Main Scene
function LoginScene({ isAnimating }) {
  const [energyProgress, setEnergyProgress] = useState(0);
  const groupRef = useRef();
  
  // Rotate entire network slowly
  useFrame(() => {
    if (groupRef.current && !isAnimating) {
      groupRef.current.rotation.y += 0.002;
    }
  });
  
  const nodes = useMemo(() => {
    const nodePositions = [];
    const layers = 4;
    const nodesPerLayer = 8;
    
    for (let layer = 0; layer < layers; layer++) {
      const radius = 3 + layer * 1.5;
      const yPos = (layer - layers / 2) * 2;
      
      for (let i = 0; i < nodesPerLayer; i++) {
        const angle = (i / nodesPerLayer) * Math.PI * 2 + layer * 0.3;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        nodePositions.push(new THREE.Vector3(x, yPos, z));
      }
    }
    
    return nodePositions;
  }, []);

  const energyPath = useMemo(() => {
    // Create a path that visits multiple nodes
    const path = [0];
    const visited = new Set([0]);
    
    while (path.length < Math.min(20, nodes.length)) {
      const current = path[path.length - 1];
      const currentPos = nodes[current];
      
      let nearest = -1;
      let minDist = Infinity;
      
      for (let i = 0; i < nodes.length; i++) {
        if (!visited.has(i)) {
          const dist = currentPos.distanceTo(nodes[i]);
          if (dist < minDist && dist < 5) {
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
      setEnergyProgress((prev) => Math.min(prev + delta * 0.4, 1));
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

  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#667eea" />
      
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
        toast.success('Login successful! Connecting to network...');
        
        // Start energy animation
        setIsAnimating(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3500);
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

  return (
    <div className={`login-page ${isAnimating ? 'animating' : ''}`}>
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 12], fov: 75 }}>
          <LoginScene isAnimating={isAnimating} />
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

      {isAnimating && (
        <div className="connection-status">
          <div className="status-text">Establishing connection...</div>
          <div className="status-bar">
            <div className="status-progress"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
