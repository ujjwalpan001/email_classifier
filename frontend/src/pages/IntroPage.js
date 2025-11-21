import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import './IntroPage.css';

// Sun Component with realistic glow and animation
function Sun({ onClick, isHovered, setIsHovered }) {
  const sunRef = useRef();
  const glowRef = useRef();
  
  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.001;
      
      // Pulsating effect
      const scale = isHovered ? 1.15 : 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      sunRef.current.scale.set(scale, scale, scale);
      
      if (glowRef.current) {
        glowRef.current.scale.set(scale * 1.2, scale * 1.2, scale * 1.2);
      }
    }
  });

  return (
    <group>
      {/* Outer Glow */}
      <Sphere ref={glowRef} args={[2.8, 64, 64]}>
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={isHovered ? 0.5 : 0.3}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Sun */}
      <Sphere
        ref={sunRef}
        args={[2.2, 64, 64]}
        onClick={onClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <meshStandardMaterial
          emissive="#ff6600"
          emissiveIntensity={isHovered ? 2.5 : 2}
          color="#ffaa00"
        />
      </Sphere>

      {/* Point light from sun */}
      <pointLight position={[0, 0, 0]} intensity={3} distance={100} color="#ffffff" />
      <pointLight position={[0, 0, 0]} intensity={2} distance={50} color="#ffaa00" />
    </group>
  );
}

// Planet Component with realistic orbit and rotation
function Planet({ 
  distance, 
  size, 
  color, 
  orbitSpeed, 
  rotationSpeed, 
  emissive = '#000000',
  hasRing = false,
  onClick,
  onHover,
  isHovered = false
}) {
  const planetRef = useRef();
  const orbitRef = useRef();

  useFrame((state) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += orbitSpeed;
    }
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed;
      
      // Scale effect on hover
      const targetScale = isHovered ? 1.15 : 1;
      planetRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  return (
    <group ref={orbitRef}>
      <group position={[distance, 0, 0]}>
        <Sphere 
          ref={planetRef} 
          args={[size, 32, 32]}
          onClick={onClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
            if (onHover) onHover(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
            if (onHover) onHover(false);
          }}
        >
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={isHovered ? 0.5 : 0.2}
            roughness={0.8}
            metalness={0.3}
          />
        </Sphere>
        
        {hasRing && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size * 1.5, size * 2, 64]} />
            <meshStandardMaterial
              color="#d4af37"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Orbit path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[distance - 0.02, distance + 0.02, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Asteroid Belt
function AsteroidBelt() {
  const asteroids = useRef([]);
  const groupRef = useRef();

  // Generate random asteroids
  React.useMemo(() => {
    asteroids.current = Array.from({ length: 200 }, () => ({
      distance: 15 + Math.random() * 2,
      angle: Math.random() * Math.PI * 2,
      size: 0.02 + Math.random() * 0.05,
      speed: 0.0001 + Math.random() * 0.0002,
    }));
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <group ref={groupRef}>
      {asteroids.current.map((asteroid, i) => (
        <Sphere
          key={i}
          args={[asteroid.size, 8, 8]}
          position={[
            Math.cos(asteroid.angle) * asteroid.distance,
            (Math.random() - 0.5) * 0.5,
            Math.sin(asteroid.angle) * asteroid.distance,
          ]}
        >
          <meshStandardMaterial color="#888888" roughness={1} />
        </Sphere>
      ))}
    </group>
  );
}

// Main Solar System Scene
function SolarSystemScene({ onSunClick, setIsHovered, onPlanetHover }) {
  const [localIsHovered, setLocalIsHovered] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);

  const handleHover = (hovered) => {
    setLocalIsHovered(hovered);
    if (setIsHovered) setIsHovered(hovered);
    if (hovered) {
      handlePlanetHover('sun', true);
    } else if (hoveredPlanet === 'sun') {
      handlePlanetHover(null, false);
    }
  };
  
  const handlePlanetHover = (planetName, hovered) => {
    if (hovered) {
      setHoveredPlanet(planetName);
      if (onPlanetHover) onPlanetHover(planetName);
    } else {
      setHoveredPlanet(null);
      if (onPlanetHover) onPlanetHover(null);
    }
  };

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.1} />
      <Stars radius={300} depth={60} count={7000} factor={7} saturation={0} fade speed={1} />
      
      <Sun onClick={onSunClick} isHovered={localIsHovered} setIsHovered={handleHover} />
      
      {/* Mercury */}
      <Planet 
        distance={4} 
        size={0.4} 
        color="#b5a393" 
        orbitSpeed={0.008} 
        rotationSpeed={0.01} 
        emissive="#8c7853"
        onClick={() => handlePlanetHover('mercury', true)}
        onHover={(hovered) => handlePlanetHover('mercury', hovered)}
        isHovered={hoveredPlanet === 'mercury'}
      />
      
      {/* Venus */}
      <Planet 
        distance={6} 
        size={0.65} 
        color="#ffd700" 
        orbitSpeed={0.006} 
        rotationSpeed={0.008} 
        emissive="#ffb700"
        onClick={() => handlePlanetHover('venus', true)}
        onHover={(hovered) => handlePlanetHover('venus', hovered)}
        isHovered={hoveredPlanet === 'venus'}
      />
      
      {/* Earth */}
      <Planet 
        distance={8} 
        size={0.7} 
        color="#5aa5ff" 
        orbitSpeed={0.005} 
        rotationSpeed={0.02}
        emissive="#3a7ac8"
        onClick={() => handlePlanetHover('earth', true)}
        onHover={(hovered) => handlePlanetHover('earth', hovered)}
        isHovered={hoveredPlanet === 'earth'}
      />
      
      {/* Mars */}
      <Planet 
        distance={10} 
        size={0.5} 
        color="#e57373" 
        orbitSpeed={0.004} 
        rotationSpeed={0.018} 
        emissive="#cd5c5c"
        onClick={() => handlePlanetHover('mars', true)}
        onHover={(hovered) => handlePlanetHover('mars', hovered)}
        isHovered={hoveredPlanet === 'mars'}
      />
      
      {/* Asteroid Belt */}
      <AsteroidBelt />
      
      {/* Jupiter */}
      <Planet 
        distance={18} 
        size={1.4} 
        color="#d4a054" 
        orbitSpeed={0.002} 
        rotationSpeed={0.04}
        emissive="#a67c3a"
        onClick={() => handlePlanetHover('jupiter', true)}
        onHover={(hovered) => handlePlanetHover('jupiter', hovered)}
        isHovered={hoveredPlanet === 'jupiter'}
      />
      
      {/* Saturn */}
      <Planet 
        distance={22} 
        size={1.2} 
        color="#f5c288" 
        orbitSpeed={0.0015} 
        rotationSpeed={0.035}
        hasRing={true}
        emissive="#d4a054"
        onClick={() => handlePlanetHover('saturn', true)}
        onHover={(hovered) => handlePlanetHover('saturn', hovered)}
        isHovered={hoveredPlanet === 'saturn'}
      />
      
      {/* Uranus */}
      <Planet 
        distance={26} 
        size={0.85} 
        color="#6fe5f5" 
        orbitSpeed={0.001} 
        rotationSpeed={0.025} 
        emissive="#4fd0e0"
        onClick={() => handlePlanetHover('uranus', true)}
        onHover={(hovered) => handlePlanetHover('uranus', hovered)}
        isHovered={hoveredPlanet === 'uranus'}
      />
      
      {/* Neptune */}
      <Planet 
        distance={30} 
        size={0.85} 
        color="#5a8fff" 
        orbitSpeed={0.0008} 
        rotationSpeed={0.022} 
        emissive="#4169e1"
        onClick={() => handlePlanetHover('neptune', true)}
        onHover={(hovered) => handlePlanetHover('neptune', hovered)}
        isHovered={hoveredPlanet === 'neptune'}
      />

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={60}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

function IntroPage() {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);

  const planetQuotes = {
    sun: {
      icon: '☀️',
      name: 'Sun',
      quote: 'Central Mail Server — everything eventually lands here, even the stuff you regret sending.'
    },
    mercury: {
      icon: '🌑',
      name: 'Mercury',
      quote: 'Fastest Email Delivery — hits your inbox before you even finish typing.'
    },
    venus: {
      icon: '🌕',
      name: 'Venus',
      quote: 'Overheated Mailbox — full of unread messages and emotional emails.'
    },
    earth: {
      icon: '🌍',
      name: 'Earth',
      quote: 'User Inbox — organized chaos, spam included.'
    },
    mars: {
      icon: '🔴',
      name: 'Mars',
      quote: 'Promotions Tab — looks exciting, but you rarely open it.'
    },
    jupiter: {
      icon: '🪐',
      name: 'Jupiter',
      quote: 'Spam Filter — massive, powerful, and blocks everything suspicious.'
    },
    saturn: {
      icon: '🪐',
      name: 'Saturn',
      quote: 'Drafts Folder — beautiful rings, unfinished emails.'
    },
    uranus: {
      icon: '🌀',
      name: 'Uranus',
      quote: "The 'Unread' Section — tilted, ignored, and growing every day."
    },
    neptune: {
      icon: '🧊',
      name: 'Neptune',
      quote: 'Archive Folder — deep, cold, and emails vanish forever.'
    }
  };

  const handleSunClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };
  
  const handlePlanetHover = (planet) => {
    setHoveredPlanet(planet);
  };

  return (
    <div className={`intro-page ${isTransitioning ? 'transitioning' : ''}`}>
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 35], fov: 60 }}
          gl={{ antialias: true, alpha: false }}
        >
          <SolarSystemScene 
            onSunClick={handleSunClick} 
            setIsHovered={setIsHovered}
            onPlanetHover={handlePlanetHover}
          />
        </Canvas>
      </div>
      
      <div className="intro-content">
        <h1 className="title">Email Classifier</h1>
        <p className="subtitle">AI-Powered Email Organization System</p>
      </div>

      {hoveredPlanet && planetQuotes[hoveredPlanet] && !isTransitioning && (
        <div className="planet-tooltip">
          <div className="tooltip-icon">{planetQuotes[hoveredPlanet].icon}</div>
          <div className="tooltip-content">
            <div className="tooltip-name">{planetQuotes[hoveredPlanet].name}</div>
            <div className="tooltip-quote">{planetQuotes[hoveredPlanet].quote}</div>
          </div>
        </div>
      )}

      {isHovered && !isTransitioning && !hoveredPlanet && (
        <div className="sun-hint">
          <span className="pulse-dot"></span>
          Click the Sun
        </div>
      )}

      {isTransitioning && (
        <div className="transition-overlay">
          <div className="transition-circle"></div>
        </div>
      )}
    </div>
  );
}

export default IntroPage;
