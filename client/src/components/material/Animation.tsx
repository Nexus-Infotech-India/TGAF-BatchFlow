import React from "react";
import { motion } from "framer-motion";

const LoginAnimation: React.FC = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Central circle */}
      <motion.div
        className="absolute w-32 h-32 bg-blue-500/20 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Orbiting particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-blue-600 rounded-full"
          initial={{
            x: 0,
            y: 0,
          }}
          animate={{
            x: Math.cos(Math.PI * 2 * (i / 6)) * 80,
            y: Math.sin(Math.PI * 2 * (i / 6)) * 80,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}

      {/* Data visualization animation */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`bar-${i}`}
            className="h-1 bg-blue-400 rounded my-2"
            style={{ width: `${20 + i * 15}px`, opacity: 0.7 - i * 0.1 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 0.8, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Batch flow text */}
      <motion.div
        className="absolute bottom-10 text-blue-600 text-sm font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 1] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Batch Analysis
      </motion.div>
    </div>
  );
};

export default LoginAnimation;