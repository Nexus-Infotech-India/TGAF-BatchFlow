import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { 
  Database, 
  Layers, 
  ClipboardCheck, 
  BookOpen, 
  LineChart, 
  BarChart4, 
  FileSpreadsheet,
  CheckSquare,
  Workflow,
  EyeOffIcon as Flask
} from "lucide-react";

const HomeIllustration = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Grid particles for the background
  const gridItems = Array.from({ length: 40 }, (_, i) => i);
  
  // Floating icons that represent batch management operations
  const floatingIcons = [
    { Icon: Database, delay: 0, position: { x: "10%", y: "15%" } },
    { Icon: Layers, delay: 1, position: { x: "85%", y: "20%" } },
    { Icon: ClipboardCheck, delay: 0.5, position: { x: "25%", y: "75%" } },
    { Icon: BookOpen, delay: 2, position: { x: "75%", y: "65%" } },
    { Icon: LineChart, delay: 1.5, position: { x: "20%", y: "30%" } },
    { Icon: BarChart4, delay: 0.7, position: { x: "80%", y: "80%" } },
    { Icon: FileSpreadsheet, delay: 1.2, position: { x: "40%", y: "90%" } },
    { Icon: CheckSquare, delay: 0.3, position: { x: "90%", y: "40%" } },
    { Icon: Workflow, delay: 1.8, position: { x: "15%", y: "60%" } },
    { Icon: Flask, delay: 0.9, position: { x: "60%", y: "25%" } },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Animated gradient orb that follows mouse */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-30 blur-3xl"
        animate={{
          x: mousePosition.x - 400,
          y: mousePosition.y - 400,
        }}
        transition={{
          type: "spring",
          damping: 50,
          stiffness: 100,
          mass: 3
        }}
      />

      {/* Grid background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute inset-0 grid grid-cols-10 gap-8">
          {gridItems.map((item) => (
            <motion.div
              key={item}
              className="aspect-square rounded-full bg-white/20"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0.8, 1],
                opacity: [0, 0.5, 0.3, 0.5]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: item * 0.1, 
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Flowing line connections */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <motion.path
          d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 C1150,200 1350,0 1500,100 C1650,200 1850,0 2000,100"
          fill="none"
          stroke="white"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 0.5,
            strokeDashoffset: [0, -1000]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "linear" 
          }}
        />
        <motion.path
          d="M0,300 C150,400 350,200 500,300 C650,400 850,200 1000,300 C1150,400 1350,200 1500,300 C1650,400 1850,200 2000,300"
          fill="none"
          stroke="rgba(147, 197, 253, 0.8)"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 0.5,
            strokeDashoffset: [0, -1000]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "linear",
            delay: 1
          }}
        />
        <motion.path
          d="M0,500 C150,600 350,400 500,500 C650,600 850,400 1000,500 C1150,600 1350,400 1500,500 C1650,600 1850,400 2000,500"
          fill="none"
          stroke="rgba(196, 181, 253, 0.8)"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 0.5,
            strokeDashoffset: [0, -1000]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            ease: "linear",
            delay: 2
          }}
        />
      </svg>

      {/* Data points / particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute w-1.5 h-1.5 bg-blue-200 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0.5, 1, 0.5],
              opacity: [0.2, 0.8, 0.2],
              y: ["-10px", "10px", "-10px"]
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Floating icons with pulses */}
      {floatingIcons.map(({ Icon, delay, position }, index) => (
        <motion.div
          key={index}
          className="absolute text-white/70"
          style={{ left: position.x, top: position.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.7, 0.5, 0.7], 
            scale: [0, 1, 0.95, 1],
            y: [0, -10, 0, 10, 0]
          }}
          transition={{
            opacity: { duration: 3, repeat: Infinity, delay },
            scale: { duration: 1, delay },
            y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay }
          }}
        >
          <div className="relative">
            <Icon size={28} />
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-400/20"
              animate={{
                scale: [1, 2],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: delay + Math.random()
              }}
            />
          </div>
        </motion.div>
      ))}

      {/* Digital data stream particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 15 }).map((_, index) => {
          const size = 1 + Math.random() * 3;
          return (
            <motion.div
              key={`stream-${index}`}
              className="absolute bg-blue-300 rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `-20px`,
              }}
              animate={{
                y: ['0vh', '100vh'],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                y: {
                  duration: 10 + Math.random() * 15,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 10
                },
                opacity: {
                  duration: 10 + Math.random() * 15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.1, 1],
                  delay: Math.random() * 10
                }
              }}
            />
          );
        })}
      </div>

      {/* Connectivity web lines */}
      <div className="absolute inset-0">
        {floatingIcons.map((_, sourceIndex) => (
          <React.Fragment key={`web-${sourceIndex}`}>
            {floatingIcons.slice(sourceIndex + 1, sourceIndex + 3).map((_, targetIndex) => {
              const actualTargetIndex = sourceIndex + targetIndex + 1;
              if (actualTargetIndex < floatingIcons.length) {
                return (
                  <motion.div
                    key={`connection-${sourceIndex}-${actualTargetIndex}`}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ opacity: 0.2 }}
                  >
                    <svg width="100%" height="100%" className="absolute top-0 left-0">
                      <motion.line
                        x1={floatingIcons[sourceIndex].position.x}
                        y1={floatingIcons[sourceIndex].position.y}
                        x2={floatingIcons[actualTargetIndex].position.x}
                        y2={floatingIcons[actualTargetIndex].position.y}
                        stroke="white"
                        strokeWidth="0.5"
                        strokeDasharray="5,5"
                        animate={{
                          strokeDashoffset: [0, -20]
                        }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    </svg>
                  </motion.div>
                );
              }
              return null;
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default HomeIllustration;