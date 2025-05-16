import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import api from "../../../utils/api";
import { API_ROUTES } from "../../../utils/api";
import LoginAnimation from "../../material/Animation";
import { Lock, Mail, Check } from "lucide-react";

interface LoginResponse {
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface LoginError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  // Check if there are stored credentials
  useEffect(() => {
    const storedEmail = localStorage.getItem("rememberedEmail");
    const isRemembered = localStorage.getItem("rememberMe") === "true";
    
    if (isRemembered && storedEmail) {
      setEmail(storedEmail);
      setRememberMe(true);
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (): Promise<LoginResponse> => {
      const response = await api.post(API_ROUTES.AUTH.LOGIN, { email, password });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.token && data.user) {
        // Store all user details in localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userId", data.user.id || "");
        localStorage.setItem("userEmail", data.user.email || "");
        localStorage.setItem("userName", data.user.name || "");
        localStorage.setItem("userRole", data.user.role || "");
        
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberMe");
        }
        
        // Redirect to the home page
        window.location.href = "/dashboard";
      }
    },
    onError: (err: LoginError) => {
      setError(err.response?.data?.message || "Invalid email or password");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="flex w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden bg-white">
        {/* Animation Panel - Left Side */}
        <motion.div 
          className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center p-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="w-full h-full">
            <div className="text-white mb-8">
              <motion.h1 
                className="text-3xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                TGAF
              </motion.h1>
              <motion.p
                className="text-blue-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                Quality analysis and batch management system
              </motion.p>
            </div>
            <div className="h-64">
              <LoginAnimation />
            </div>
            <motion.div 
              className="mt-8 text-blue-100 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p>Streamline your quality control process</p>
              <p>Track product batches with ease</p>
              <p>Generate comprehensive analysis reports</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Login Form - Right Side */}
        <motion.div
          className="w-full md:w-1/2 p-8 md:p-12"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="text-center mb-10">
            <motion.h2 
              className="text-2xl font-bold text-gray-800"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Welcome Back
            </motion.h2>
            <motion.p
              className="text-gray-500 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Sign in to your account
            </motion.p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <label className="flex items-center text-sm text-gray-600 cursor-pointer group">
                <div className="relative w-5 h-5 mr-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="hidden"
                  />
                  <div className={`w-5 h-5 rounded border transition-colors ${rememberMe ? 'bg-blue-500 border-blue-500' : 'border-gray-300 group-hover:border-blue-400'}`}>
                    {rememberMe && <Check size={14} className="text-white" />}
                  </div>
                </div>
                Remember Me
              </label>
            </motion.div>

            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white font-medium rounded-lg shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loginMutation.isPending}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <motion.div 
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  />
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </motion.button>

            <motion.div 
              className="text-center text-sm text-gray-500 mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
             
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;