import { motion } from "framer-motion";
import { 
  ChevronDown, Clipboard, Calendar, FileCheck, Shield, ArrowRight,
  CheckCircle2, Users, Database, ChartBar, 
  FileCog, BarChart4, ClipboardCheck, Layers,
  TrendingUp, Activity, Target, Zap, Star, Globe, Award
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const Home = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any; }) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-hidden">
      {/* Enhanced Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
        {/* Dynamic background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-600/20 blur-3xl"
            animate={{
              x: mousePosition.x * 0.02,
              y: mousePosition.y * 0.02,
              rotate: [0, 360],
            }}
            transition={{ 
              x: { type: "spring", damping: 50 },
              y: { type: "spring", damping: 50 },
              rotate: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 blur-3xl"
            animate={{
              x: -mousePosition.x * 0.015,
              y: mousePosition.y * 0.015,
              rotate: [360, 0],
            }}
            transition={{ 
              x: { type: "spring", damping: 50 },
              y: { type: "spring", damping: 50 },
              rotate: { duration: 25, repeat: Infinity, ease: "linear" }
            }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-600/10 blur-3xl"
            animate={{
              x: mousePosition.x * 0.01,
              y: -mousePosition.y * 0.01,
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              x: { type: "spring", damping: 50 },
              y: { type: "spring", damping: 50 },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        
        <motion.div
          className="max-w-6xl mx-auto text-center z-10 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Welcome badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-blue-200/50 text-blue-700 font-medium mb-8 shadow-lg"
          >
            <Star className="w-5 h-5 text-yellow-500" />
            Welcome to BatchFlow Management System
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            TGAF BatchFlow
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl lg:text-3xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Advanced enterprise batch management with comprehensive 
            <span className="text-blue-600 font-semibold"> training</span> and 
            <span className="text-indigo-600 font-semibold"> audit</span> solutions for 
            <span className="text-purple-600 font-semibold"> quality-focused</span> organizations.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/login">
              <motion.button
                className="group relative px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-blue-300/50 transition-all overflow-hidden"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3">
                  Get Started <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </div>
              </motion.button>
            </Link>
            
            <motion.button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group px-10 py-5 text-lg font-semibold text-slate-700 bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-white transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <Globe size={20} />
                Explore Features
              </div>
            </motion.button>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <motion.div 
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-100/50 shadow-xl"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clipboard className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Batch Management</h3>
              <p className="text-slate-600 text-sm">Complete batch lifecycle tracking</p>
            </motion.div>

            <motion.div 
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-indigo-100/50 shadow-xl"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <Calendar className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Training Center</h3>
              <p className="text-slate-600 text-sm">Comprehensive training management</p>
            </motion.div>

            <motion.div 
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-100/50 shadow-xl"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <FileCheck className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Audit Control</h3>
              <p className="text-slate-600 text-sm">End-to-end audit management</p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Enhanced scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-0 right-0 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <motion.div 
            className="flex flex-col items-center gap-2 text-blue-600 cursor-pointer group"
            animate={{ y: [0, 8, 0] }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }}
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="text-sm font-medium group-hover:text-blue-700 transition-colors">Discover More</span>
            <motion.div
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200/50 shadow-lg group-hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.1 }}
            >
              <ChevronDown size={20} />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-24 px-4 bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 px-6 py-3 rounded-full border border-blue-200 text-blue-700 font-medium mb-6"
            >
              <Zap className="w-5 h-5" />
              Powerful Enterprise Solutions
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-slate-800 leading-tight">
              Comprehensive <span className="text-blue-600">Management</span> Tools
            </h2>
            <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Our integrated platform streamlines quality control processes with powerful batch management, 
              training coordination, and comprehensive audit tracking capabilities.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Enhanced Feature 1: Batch Creation */}
            <motion.div 
              className="group bg-white p-8 rounded-3xl border border-blue-100 shadow-2xl relative overflow-hidden"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-50"></div>
              
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl inline-flex mb-8 shadow-lg">
                  <Clipboard className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold mb-6 text-slate-800">Batch Management</h3>
                <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                  Comprehensive batch processing with role-based access control, detailed organoleptic 
                  and physical property tracking with advanced workflow automation.
                </p>
                
                <ul className="space-y-4 text-slate-600 mb-8">
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Maker-checker verification workflow</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Complete chemical properties tracking</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Production data management</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Automated email notifications</span>
                  </li>
                </ul>
                
                <motion.div 
                  className="pt-6 border-t border-blue-100 flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <Link to="/batch-creation" className="group/link flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                    Explore Batch Management 
                    <ArrowRight className="group-hover/link:translate-x-1 transition-transform" size={16} />
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Feature 2: Training Calendar */}
            <motion.div 
              className="group bg-white p-8 rounded-3xl border border-indigo-100 shadow-2xl relative overflow-hidden"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-50"></div>
              
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl inline-flex mb-8 shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold mb-6 text-slate-800">Training Management</h3>
                <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                  Centralized training coordination with intelligent scheduling, comprehensive documentation 
                  management, and real-time attendance tracking.
                </p>
                
                <ul className="space-y-4 text-slate-600 mb-8">
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-indigo-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">Automated calendar invitations</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-indigo-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">Training materials repository</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-indigo-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">Participant feedback collection</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-indigo-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">Digital attendance tracking</span>
                  </li>
                </ul>
                
                <motion.div 
                  className="pt-6 border-t border-indigo-100 flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <Link to="/training" className="group/link flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                    Explore Training Center
                    <ArrowRight className="group-hover/link:translate-x-1 transition-transform" size={16} />
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Feature 3: Audit Management */}
            <motion.div 
              className="group bg-white p-8 rounded-3xl border border-purple-100 shadow-2xl relative overflow-hidden"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-50"></div>
              
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl inline-flex mb-8 shadow-lg">
                  <FileCheck className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold mb-6 text-slate-800">Audit Control</h3>
                <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                  Complete audit lifecycle management from creation through follow-up with detailed 
                  reporting, analytics, and automated compliance monitoring.
                </p>
                
                <ul className="space-y-4 text-slate-600 mb-8">
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-purple-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Comprehensive audit workflows</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-purple-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Auto-generated audit reports</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-purple-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Corrective action tracking</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="p-1 bg-purple-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Compliance monitoring</span>
                  </li>
                </ul>
                
                <motion.div 
                  className="pt-6 border-t border-purple-100 flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <Link to="/audit-management" className="group/link flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors">
                    Explore Audit Control
                    <ArrowRight className="group-hover/link:translate-x-1 transition-transform" size={16} />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Enhanced Workflow Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-100/30 rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            className="mb-20"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-100 to-blue-100 px-6 py-3 rounded-full border border-slate-200 text-slate-700 font-medium mb-6"
              >
                <Activity className="w-5 h-5" />
                Streamlined Processes
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 text-slate-800 leading-tight">
                How <span className="text-blue-600">BatchFlow</span> Works
              </h2>
              <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                Our end-to-end solution provides a comprehensive framework for quality management 
                with seamless integration across all modules.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side: Process steps */}
            <motion.div 
              className="lg:col-span-6 space-y-8"
              variants={fadeInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              {/* Step 1 */}
              <motion.div 
                className="group bg-white p-8 rounded-2xl border border-blue-100 shadow-xl relative overflow-hidden"
                whileHover={{ x: 10, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-xl border-4 border-white">
                  1
                </div>
                <div className="ml-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">
                    Standard Definition
                  </h3>
                  <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                    Create measurement standards, set parameters, and define methodologies for batch processing 
                    with customizable templates and validation rules.
                  </p>
                  <div className="flex items-center gap-3 text-blue-700 font-medium">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database size={18} />
                    </div>
                    <span>Forms & Templates</span>
                  </div>
                </div>
              </motion.div>
              
              {/* Step 2 */}
              <motion.div 
                className="group bg-white p-8 rounded-2xl border border-indigo-100 shadow-xl relative overflow-hidden"
                whileHover={{ x: 10, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-xl border-4 border-white">
                  2
                </div>
                <div className="ml-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors">
                    Batch Creation & Verification
                  </h3>
                  <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                    Makers create batches with detailed specifications, checkers review and approve submitted data 
                    with comprehensive validation and approval workflows.
                  </p>
                  <div className="flex items-center gap-3 text-indigo-700 font-medium">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <ClipboardCheck size={18} />
                    </div>
                    <span>Maker-Checker Workflow</span>
                  </div>
                </div>
              </motion.div>
              
              {/* Step 3 */}
              <motion.div 
                className="group bg-white p-8 rounded-2xl border border-purple-100 shadow-xl relative overflow-hidden"
                whileHover={{ x: 10, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-xl border-4 border-white">
                  3
                </div>
                <div className="ml-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-purple-600 transition-colors">
                    Team Training
                  </h3>
                  <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                    Schedule and deliver training sessions with complete documentation, interactive materials, 
                    and comprehensive feedback collection systems.
                  </p>
                  <div className="flex items-center gap-3 text-purple-700 font-medium">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users size={18} />
                    </div>
                    <span>Calendar & Materials</span>
                  </div>
                </div>
              </motion.div>
              
              {/* Step 4 */}
              <motion.div 
                className="group bg-white p-8 rounded-2xl border border-pink-100 shadow-xl relative overflow-hidden"
                whileHover={{ x: 10, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-pink-600 to-red-600 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-xl border-4 border-white">
                  4
                </div>
                <div className="ml-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-pink-600 transition-colors">
                    Audit & Compliance
                  </h3>
                  <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                    Conduct comprehensive audits, document findings, track corrective actions, 
                    and monitor compliance status with automated reporting.
                  </p>
                  <div className="flex items-center gap-3 text-pink-700 font-medium">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <FileCog size={18} />
                    </div>
                    <span>Audit Reporting</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Right side: Enhanced Dashboard preview */}
            <motion.div 
              className="lg:col-span-6 relative"
              variants={fadeInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
                {/* Dashboard mockup */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 h-full min-h-[600px]">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl w-12 h-12 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        B
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-xl">BatchFlow Dashboard</h3>
                        <p className="text-slate-600 text-sm">Real-time system overview</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="h-3 w-3 rounded-full bg-green-500"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      ></motion.div>
                      <div className="h-3 w-3 rounded-full bg-slate-300"></div>
                      <div className="h-3 w-3 rounded-full bg-slate-300"></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <motion.div 
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"
                      whileHover={{ y: -2, scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-blue-100 rounded">
                          <Clipboard size={14} className="text-blue-600" />
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Active Batches</div>
                      </div>
                      <div className="text-2xl font-bold text-slate-800">42</div>
                      <div className="text-xs text-green-600 font-medium">+12% this week</div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"
                      whileHover={{ y: -2, scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-purple-100 rounded">
                          <FileCheck size={14} className="text-purple-600" />
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Pending Audits</div>
                      </div>
                      <div className="text-2xl font-bold text-slate-800">7</div>
                      <div className="text-xs text-orange-600 font-medium">Due this week</div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"
                      whileHover={{ y: -2, scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-indigo-100 rounded">
                          <Calendar size={14} className="text-indigo-600" />
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Training Events</div>
                      </div>
                      <div className="text-2xl font-bold text-slate-800">12</div>
                      <div className="text-xs text-blue-600 font-medium">5 this month</div>
                    </motion.div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-4">
                        <div className="font-medium text-slate-800">Quality Metrics</div>
                        <TrendingUp size={16} className="text-green-500" />
                      </div>
                      <div className="h-32 flex items-end gap-2">
                        {[100, 85, 65, 90, 75, 95, 88].map((height, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                            style={{ height: `${height}%` }}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-4">
                        <div className="font-medium text-slate-800">Compliance Rate</div>
                        <Target size={16} className="text-blue-500" />
                      </div>
                      <div className="flex items-center justify-center h-32">
                        <div className="relative w-24 h-24">
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#E5E7EB"
                              strokeWidth="2"
                            />
                            <motion.path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#3B82F6"
                              strokeWidth="2"
                              strokeDasharray="78, 100"
                              initial={{ strokeDasharray: "0, 100" }}
                              animate={{ strokeDasharray: "78, 100" }}
                              transition={{ duration: 1, delay: 0.5 }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-800">
                            98%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-medium text-slate-800">Recent Activity</div>
                      <BarChart4 size={16} className="text-slate-400" />
                    </div>
                    <div className="space-y-3">
                      {[
                        { icon: CheckCircle2, text: "Batch #4528 approved", color: "green" },
                        { icon: Calendar, text: "New training scheduled", color: "blue" },
                        { icon: FileCheck, text: "Audit #127 completed", color: "purple" }
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + i * 0.2 }}
                        >
                          <div className={`p-1 bg-${item.color}-100 rounded`}>
                            <item.icon size={14} className={`text-${item.color}-600`} />
                          </div>
                          <span className="text-slate-600 text-sm font-medium">{item.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced floating elements */}
              <motion.div 
                className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-blue-100 flex items-center gap-3"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <div className="bg-green-100 p-2 rounded-lg">
                  <ChartBar size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-700">Real-time Analytics</div>
                  <div className="text-xs text-slate-500">Live monitoring</div>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-purple-100 flex items-center gap-3"
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              >
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Shield size={20} className="text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-700">Compliance Reports</div>
                  <div className="text-xs text-slate-500">Automated generation</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 text-white/90 font-medium mb-8"
            >
              <Award className="w-5 h-5" />
              Start Your Quality Journey
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Ready to transform your 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-200">
                quality management?
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
              Join the future of batch management, training coordination, and audit processes 
              with BatchFlow's comprehensive enterprise solution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/login">
                <motion.button
                  className="group relative px-10 py-5 text-lg font-semibold bg-white text-blue-700 rounded-2xl shadow-2xl hover:shadow-white/25 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all overflow-hidden"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    Get Started Now
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </div>
                </motion.button>
              </Link>
              
              <motion.button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group px-10 py-5 text-lg font-semibold border-2 border-white/30 text-white rounded-2xl hover:bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-white/20 transition-all"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <Layers size={20} />
                  Explore Features
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-6">
                  BatchFlow
                </h2>
                <p className="text-slate-300 mb-8 text-lg leading-relaxed max-w-md">
                  Enterprise quality management solutions for pharmaceutical, food, and manufacturing 
                  industries with comprehensive batch tracking and compliance features.
                </p>
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((_, i) => (
                    <motion.a
                      key={i}
                      href="#"
                      className="text-slate-400 hover:text-white transition-colors"
                      whileHover={{ scale: 1.1, y: -2 }}
                    >
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="w-5 h-5 bg-slate-600 rounded"></div>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>
            
            <div>
              <h3 className="font-bold mb-6 text-lg">Platform</h3>
              <ul className="space-y-3">
                {['Batch Management', 'Training Center', 'Audit Control', 'Quality Reports', 'Analytics Dashboard'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-6 text-lg">Company</h3>
              <ul className="space-y-3">
                {['About', 'Support', 'Documentation', 'Training', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <motion.div 
            className="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} BatchFlow. All rights reserved. Built with precision for quality excellence.
            </div>
            <div className="flex gap-6 text-sm">
              {['Privacy Policy', 'Terms of Service', 'Security'].map((item) => (
                <a 
                  key={item}
                  href="#" 
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Home;