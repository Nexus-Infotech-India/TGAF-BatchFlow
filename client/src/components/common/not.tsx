import React, { useEffect, useState } from "react";

const NotFound: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation for entrance effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle mouse movement for parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate mouse position as percentage of window
    const x = (clientX / windowWidth - 0.5) * 20;
    const y = (clientY / windowHeight - 0.5) * 20;
    
    setPosition({ x, y });
  };
  
  return (
    <div 
      className="min-h-screen bg-gray-50 flex items-center justify-center overflow-hidden px-4"
      onMouseMove={handleMouseMove}
    >
      <div className="max-w-4xl mx-auto relative z-10">
        {/* 404 Animation */}
        <div className="relative mb-8">
          {/* Animated circles in background */}
          <div className="absolute inset-0 flex justify-center items-center">
            <div 
              className="w-64 h-64 rounded-full bg-teal-100 opacity-60 absolute" 
              style={{ 
                transform: `translate(${position.x * 1.2}px, ${position.y * 1.2}px)`,
                transition: "transform 0.2s ease-out"
              }}
            />
            <div 
              className="w-48 h-48 rounded-full bg-teal-200 opacity-50 absolute" 
              style={{ 
                transform: `translate(${position.x * -0.8}px, ${position.y * -0.8}px)`,
                transition: "transform 0.3s ease-out"
              }}
            />
            <div 
              className="w-32 h-32 rounded-full bg-teal-300 opacity-40 absolute" 
              style={{ 
                transform: `translate(${position.x * 0.5}px, ${position.y * 0.5}px)`,
                transition: "transform 0.4s ease-out"
              }}
            />
          </div>
          
          {/* Main 404 text */}
          <h1 
            className={`text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-500 
              text-center transition-all duration-1000 transform 
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
              relative z-10`}
            style={{ textShadow: "0 10px 20px rgba(0, 250, 200, 0.2)", letterSpacing: "-4px" }}
          >
            404
          </h1>
          
          {/* SVG Illustration */}
          <div className="w-full max-w-lg mx-auto mt-6">
            <svg
              viewBox="0 0 500 200"
              className={`w-full h-auto transition-all duration-1000 delay-300
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ 
                transform: `translate(${position.x * -0.3}px, ${position.y * -0.3}px)`,
                transition: "transform 0.5s ease-out" 
              }}
            >
              <path
                d="M250,20 C350,20 400,60 450,100 C500,140 450,180 350,180 C250,180 200,160 150,100 C100,40 150,20 250,20 Z"
                fill="#e6fcf5"
                stroke="#00fac8"
                strokeWidth="2"
                className="animate-pulse"
                style={{ animationDuration: "3s" }}
              />
              
              <circle cx="300" cy="80" r="10" fill="#00fac8" className="animate-bounce" style={{ animationDuration: "2s" }} />
              <circle cx="350" cy="120" r="8" fill="#00fac8" className="animate-bounce" style={{ animationDuration: "2.3s", animationDelay: "0.3s" }} />
              <circle cx="250" cy="150" r="12" fill="#00fac8" className="animate-bounce" style={{ animationDuration: "1.8s", animationDelay: "0.5s" }} />
              
              <path
                d="M200,100 Q250,60 300,100 Q350,140 400,100"
                fill="transparent"
                stroke="#00fac8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="5,5"
                className="animate-pulse"
                style={{ animationDuration: "4s" }}
              />
            </svg>
          </div>
        </div>
        
        {/* Text content */}
        <div className="text-center space-y-6">
          <h2 
            className={`text-3xl sm:text-4xl font-bold text-gray-800 
              transition-all duration-700 delay-500
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
          >
            Oops! Page not found
          </h2>
          
          <p 
            className={`text-lg text-gray-600 max-w-md mx-auto
              transition-all duration-700 delay-700
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
          >
            The page you're looking for seems to have wandered off or doesn't exist. Let's get you back on track.
          </p>
          
          <div 
            className={`mt-8 transition-all duration-700 delay-900
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
          >
            <button 
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-gradient-to-r from-teal-400 to-teal-500 text-white font-medium rounded-full
                transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg focus:outline-none"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-teal-400 opacity-10"
          style={{ 
            transform: `translate(${position.x * 0.2}px, ${position.y * 0.2}px)`,
            transition: "transform 0.6s ease-out"
          }}
        />
        <div 
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-teal-400 opacity-10"
          style={{ 
            transform: `translate(${position.x * -0.2}px, ${position.y * -0.2}px)`,
            transition: "transform 0.6s ease-out"
          }}
        />
      </div>
    </div>
  );
};

export default NotFound;