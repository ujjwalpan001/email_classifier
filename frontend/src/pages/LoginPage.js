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
      const baseScale = isEnergized ? 1.4 : (hovered ? 1.2 : 1);
      const pulse = isActive ? Math.sin(state.clock.elapsedTime * 3) * 0.15 : 0;
      meshRef.current.scale.setScalar(baseScale + pulse);
      
      // Disable rotation to reduce render load
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial
        color={isEnergized ? "#00ffff" : (isActive ? "#667eea" : "#4a5568")}
      />
      {(isEnergized || hovered) && (
        <pointLight 
          color={isEnergized ? "#00ffff" : "#667eea"} 
          intensity={isEnergized ? 2.5 : 1.2} 
          distance={4} 
        />
      )}
    </mesh>
  );
}

// Dynamic Satellite Connection Wires (4 satellites)
function SatelliteWires({ 
  leftBottomRef, rightBottomRef, leftTopRef, rightTopRef, mainWebRef, 
  leftBottomNodes, rightBottomNodes, leftTopNodes, rightTopNodes, mainNodes, 
  isAnimating, energyProgress 
}) {
  const leftBottomWireRef = useRef();
  const rightBottomWireRef = useRef();
  const leftTopWireRef = useRef();
  const rightTopWireRef = useRef();
  
  useFrame(() => {
    // Update left bottom wire
    if (leftBottomWireRef.current && leftBottomRef.current && mainWebRef.current) {
      const start = leftBottomNodes[0].clone();
      start.applyMatrix4(leftBottomRef.current.matrixWorld);
      
      const end = mainNodes[0].clone();
      end.applyMatrix4(mainWebRef.current.matrixWorld);
      
      leftBottomWireRef.current.geometry.setFromPoints([start, end]);
    }
    
    // Update right bottom wire
    if (rightBottomWireRef.current && rightBottomRef.current && mainWebRef.current) {
      const start = rightBottomNodes[0].clone();
      start.applyMatrix4(rightBottomRef.current.matrixWorld);
      
      const end = mainNodes[16].clone();
      end.applyMatrix4(mainWebRef.current.matrixWorld);
      
      rightBottomWireRef.current.geometry.setFromPoints([start, end]);
    }
    
    // Update left top wire
    if (leftTopWireRef.current && leftTopRef.current && mainWebRef.current) {
      const start = leftTopNodes[0].clone();
      start.applyMatrix4(leftTopRef.current.matrixWorld);
      
      const end = mainNodes[8].clone();
      end.applyMatrix4(mainWebRef.current.matrixWorld);
      
      leftTopWireRef.current.geometry.setFromPoints([start, end]);
    }
    
    // Update right top wire
    if (rightTopWireRef.current && rightTopRef.current && mainWebRef.current) {
      const start = rightTopNodes[0].clone();
      start.applyMatrix4(rightTopRef.current.matrixWorld);
      
      const end = mainNodes[24].clone();
      end.applyMatrix4(mainWebRef.current.matrixWorld);
      
      rightTopWireRef.current.geometry.setFromPoints([start, end]);
    }
  });
  
  return (
    <>
      <line ref={leftBottomWireRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color={isAnimating && energyProgress > 0.05 ? "#00ffff" : "#667eea"}
          transparent
          opacity={isAnimating && energyProgress > 0.05 ? 0.8 : 0.3}
        />
      </line>
      <line ref={rightBottomWireRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color={isAnimating && energyProgress > 0.05 ? "#00ffff" : "#667eea"}
          transparent
          opacity={isAnimating && energyProgress > 0.05 ? 0.8 : 0.3}
        />
      </line>
      <line ref={leftTopWireRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color={isAnimating && energyProgress > 0.05 ? "#00ffff" : "#667eea"}
          transparent
          opacity={isAnimating && energyProgress > 0.05 ? 0.8 : 0.3}
        />
      </line>
      <line ref={rightTopWireRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color={isAnimating && energyProgress > 0.05 ? "#00ffff" : "#667eea"}
          transparent
          opacity={isAnimating && energyProgress > 0.05 ? 0.8 : 0.3}
        />
      </line>
    </>
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
    // Skip updates after 85% to reduce lag at the end
    if (linesRef.current && energyProgress > 0 && energyProgress < 0.85) {
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
          material.opacity = 0.8;
        } else {
          material.color.setHex(0x667eea);
          material.opacity = 0.12;
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
  const mainWebRef = useRef();
  const leftBottomSatelliteRef = useRef();
  const rightBottomSatelliteRef = useRef();
  const leftTopSatelliteRef = useRef();
  const rightTopSatelliteRef = useRef();
  const completedRef = useRef(false);
  
  // Rotate each web independently on itself (keep rotating during animation)
  useFrame(() => {
    if (mainWebRef.current) {
      mainWebRef.current.rotation.y += 0.002;
    }
    if (leftBottomSatelliteRef.current) {
      leftBottomSatelliteRef.current.rotation.y += 0.003;
    }
    if (rightBottomSatelliteRef.current) {
      rightBottomSatelliteRef.current.rotation.y -= 0.003;
    }
    if (leftTopSatelliteRef.current) {
      leftTopSatelliteRef.current.rotation.y -= 0.0025;
    }
    if (rightTopSatelliteRef.current) {
      rightTopSatelliteRef.current.rotation.y += 0.0025;
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

  // Left bottom satellite web nodes (smaller, lower position)
  const leftBottomSatelliteNodes = useMemo(() => {
    const nodePositions = [];
    const layers = 2;
    const nodesPerLayer = 4;
    const offsetX = -10; // Position to the left
    const offsetY = -2; // Move down
    
    for (let layer = 0; layer < layers; layer++) {
      const radius = 1.5 + layer * 0.8;
      const yPos = (layer - layers / 2) * 1.5 + offsetY;
      
      for (let i = 0; i < nodesPerLayer; i++) {
        const angle = (i / nodesPerLayer) * Math.PI * 2 + layer * 0.5;
        const x = Math.cos(angle) * radius + offsetX;
        const z = Math.sin(angle) * radius;
        nodePositions.push(new THREE.Vector3(x, yPos, z));
      }
    }
    
    return nodePositions;
  }, []);

  // Right bottom satellite web nodes (smaller, lower position)
  const rightBottomSatelliteNodes = useMemo(() => {
    const nodePositions = [];
    const layers = 2;
    const nodesPerLayer = 4;
    const offsetX = 10; // Position to the right
    const offsetY = -2; // Move down
    
    for (let layer = 0; layer < layers; layer++) {
      const radius = 1.5 + layer * 0.8;
      const yPos = (layer - layers / 2) * 1.5 + offsetY;
      
      for (let i = 0; i < nodesPerLayer; i++) {
        const angle = (i / nodesPerLayer) * Math.PI * 2 + layer * 0.5;
        const x = Math.cos(angle) * radius + offsetX;
        const z = Math.sin(angle) * radius;
        nodePositions.push(new THREE.Vector3(x, yPos, z));
      }
    }
    
    return nodePositions;
  }, []);

  // Left top satellite web nodes (smaller, upper position)
  const leftTopSatelliteNodes = useMemo(() => {
    const nodePositions = [];
    const layers = 2;
    const nodesPerLayer = 4;
    const offsetX = -10; // Position to the left
    const offsetY = 2; // Move up
    
    for (let layer = 0; layer < layers; layer++) {
      const radius = 1.5 + layer * 0.8;
      const yPos = (layer - layers / 2) * 1.5 + offsetY;
      
      for (let i = 0; i < nodesPerLayer; i++) {
        const angle = (i / nodesPerLayer) * Math.PI * 2 + layer * 0.5;
        const x = Math.cos(angle) * radius + offsetX;
        const z = Math.sin(angle) * radius;
        nodePositions.push(new THREE.Vector3(x, yPos, z));
      }
    }
    
    return nodePositions;
  }, []);

  // Right top satellite web nodes (smaller, upper position)
  const rightTopSatelliteNodes = useMemo(() => {
    const nodePositions = [];
    const layers = 2;
    const nodesPerLayer = 4;
    const offsetX = 10; // Position to the right
    const offsetY = 2; // Move up
    
    for (let layer = 0; layer < layers; layer++) {
      const radius = 1.5 + layer * 0.8;
      const yPos = (layer - layers / 2) * 1.5 + offsetY;
      
      for (let i = 0; i < nodesPerLayer; i++) {
        const angle = (i / nodesPerLayer) * Math.PI * 2 + layer * 0.5;
        const x = Math.cos(angle) * radius + offsetX;
        const z = Math.sin(angle) * radius;
        nodePositions.push(new THREE.Vector3(x, yPos, z));
      }
    }
    
    return nodePositions;
  }, []);

  // Connection paths from satellites to main web (removed - now handled by SatelliteWires component)

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

  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#667eea" />
      
      {/* Left bottom satellite web - rotates independently */}
      <group ref={leftBottomSatelliteRef}>
        <Connections nodes={leftBottomSatelliteNodes} energyPath={[0, 1, 2, 3, 4, 5, 6, 7]} energyProgress={0} />
        {leftBottomSatelliteNodes.map((position, idx) => (
          <Node
            key={`left-bottom-${idx}`}
            position={position}
            isActive={!isAnimating}
            isEnergized={isAnimating && energyProgress > 0.1}
          />
        ))}
      </group>
      
      {/* Right bottom satellite web - rotates independently */}
      <group ref={rightBottomSatelliteRef}>
        <Connections nodes={rightBottomSatelliteNodes} energyPath={[0, 1, 2, 3, 4, 5, 6, 7]} energyProgress={0} />
        {rightBottomSatelliteNodes.map((position, idx) => (
          <Node
            key={`right-bottom-${idx}`}
            position={position}
            isActive={!isAnimating}
            isEnergized={isAnimating && energyProgress > 0.1}
          />
        ))}
      </group>
      
      {/* Left top satellite web - rotates independently */}
      <group ref={leftTopSatelliteRef}>
        <Connections nodes={leftTopSatelliteNodes} energyPath={[0, 1, 2, 3, 4, 5, 6, 7]} energyProgress={0} />
        {leftTopSatelliteNodes.map((position, idx) => (
          <Node
            key={`left-top-${idx}`}
            position={position}
            isActive={!isAnimating}
            isEnergized={isAnimating && energyProgress > 0.1}
          />
        ))}
      </group>
      
      {/* Right top satellite web - rotates independently */}
      <group ref={rightTopSatelliteRef}>
        <Connections nodes={rightTopSatelliteNodes} energyPath={[0, 1, 2, 3, 4, 5, 6, 7]} energyProgress={0} />
        {rightTopSatelliteNodes.map((position, idx) => (
          <Node
            key={`right-top-${idx}`}
            position={position}
            isActive={!isAnimating}
            isEnergized={isAnimating && energyProgress > 0.1}
          />
        ))}
      </group>
      
      {/* Dynamic connection wires that follow all rotating satellites */}
      <SatelliteWires
        leftBottomRef={leftBottomSatelliteRef}
        rightBottomRef={rightBottomSatelliteRef}
        leftTopRef={leftTopSatelliteRef}
        rightTopRef={rightTopSatelliteRef}
        mainWebRef={mainWebRef}
        leftBottomNodes={leftBottomSatelliteNodes}
        rightBottomNodes={rightBottomSatelliteNodes}
        leftTopNodes={leftTopSatelliteNodes}
        rightTopNodes={rightTopSatelliteNodes}
        mainNodes={nodes}
        isAnimating={isAnimating}
        energyProgress={energyProgress}
      />
      
      {/* Main web - rotates independently */}
      <group ref={mainWebRef}>
        <Connections nodes={nodes} energyPath={energyPath} energyProgress={energyProgress} />
        
        {/* Main web nodes */}
        {nodes.map((position, idx) => (
          <Node
            key={idx}
            position={position}
            isActive={!isAnimating}
            isEnergized={energizedNodes.has(idx)}
          />
        ))}
      </group>
      
      {/* Energy particles - outside groups so they follow actual node positions */}
      {/* Energy particles from all 4 satellites simultaneously */}
      {isAnimating && energyProgress < 0.15 && (
        <>
          <EnergyParticle
            nodes={[leftBottomSatelliteNodes[0], nodes[0]]}
            path={[0, 1]}
            progress={Math.min(energyProgress / 0.15, 1)}
          />
          <EnergyParticle
            nodes={[rightBottomSatelliteNodes[0], nodes[16]]}
            path={[0, 1]}
            progress={Math.min(energyProgress / 0.15, 1)}
          />
          <EnergyParticle
            nodes={[leftTopSatelliteNodes[0], nodes[8]]}
            path={[0, 1]}
            progress={Math.min(energyProgress / 0.15, 1)}
          />
          <EnergyParticle
            nodes={[rightTopSatelliteNodes[0], nodes[24]]}
            path={[0, 1]}
            progress={Math.min(energyProgress / 0.15, 1)}
          />
        </>
      )}
      
      {/* Main energy particle traveling through all nodes */}
      {isAnimating && energyProgress >= 0.15 && energyProgress < 1 && (
        <EnergyParticle
          nodes={nodes}
          path={energyPath}
          progress={(energyProgress - 0.15) / 0.85}
        />
      )}
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
        <Canvas camera={{ position: [0, 0, 12], fov: 75 }}>
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
