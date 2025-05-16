import { motion } from "framer-motion";
import HomeIllustration from "../layout/illustration";

const Home = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0">
        <HomeIllustration />
      </div>
      
      {/* Content Layer - REDUCED BLUR FROM backdrop-blur-sm to backdrop-blur-[2px] */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen bg-gradient-to-t from-indigo-900/60 to-transparent backdrop-blur-[2px]">
        <motion.div
          className="text-center p-8 max-w-3xl rounded-2xl backdrop-blur-[3px] bg-white/5"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 mb-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Welcome to TGAF
          </motion.h1>
          
          <motion.p 
            className="text-xl text-white mb-10 text-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Streamline your batch management workflows with powerful tools for standards, 
            units, and quality control.
          </motion.p>
          
          <motion.div
            className="flex flex-wrap gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <motion.a
              href="/login"
              className="px-8 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.a>
            
            <motion.a
              href="/dashboard"
              className="px-8 py-3 text-lg font-medium text-white border border-white/30 bg-white/10 rounded-lg shadow-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(255, 255, 255, 0.2)" }}
              whileTap={{ scale: 0.95 }}
            >
              Explore Demo
            </motion.a>
          </motion.div>
        </motion.div>
        
        <motion.div
          className="absolute bottom-10 left-0 right-0 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="flex gap-2 items-center text-white/70">
            <span>Scroll to learn more</span>
            <motion.svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              animate={{ y: [0, 5, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
            >
              <path d="M12 5v14M19 12l-7 7-7-7"></path>
            </motion.svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;