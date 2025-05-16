import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const HomeIllustration = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  useEffect(() => {
    if (!canvasRef.current || !inView) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrame: number;
    
    // Factory elements
    const conveyorBelts: ConveyorBelt[] = [];
    const batches: Batch[] = [];
    const processors: Processor[] = [];
    
    // Constants for visualization
    const BELT_HEIGHT = 20;
    const BATCH_SIZE = 30;
    const PROCESSOR_SIZE = 60;
    
    // Classes for different elements
    interface Batch {
      x: number;
      y: number;
      size: number;
      speed: number;
      color: string;
      beltIndex: number;
      stage: number;
      rotation: number;
      pulseEffect: number;
      pulseDirection: number;
    }

    interface ConveyorBelt {
      x: number;
      y: number;
      width: number;
      height: number;
      speed: number;
      direction: number;
      pattern: number;
    }

    interface Processor {
      x: number;
      y: number;
      size: number;
      type: string;
      rotation: number;
      connectsFrom: number;
      connectsTo: number;
      processTime: number;
      currentProcess: number;
      pulseEffect: number;
      pulseDirection: number;
    }
    
    // Setup canvas and elements
    const setupCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Clear existing elements
      conveyorBelts.length = 0;
      batches.length = 0;
      processors.length = 0;
      
      // Create main horizontal conveyor belts (3 levels)
      const beltOffset = canvas.height / 5;
      for (let i = 1; i <= 3; i++) {
        conveyorBelts.push({
          x: 0,
          y: beltOffset * i,
          width: canvas.width,
          height: BELT_HEIGHT,
          speed: 0.5,
          direction: i % 2 === 0 ? -1 : 1,
          pattern: 0
        });
      }
      
      // Create vertical connecting conveyors
      for (let i = 0; i < 2; i++) {
        const xPos = canvas.width / 3 * (i + 1);
        conveyorBelts.push({
          x: xPos - BELT_HEIGHT/2,
          y: beltOffset * 1,
          width: BELT_HEIGHT,
          height: beltOffset,
          speed: 0.3,
          direction: 1, // downward
          pattern: 0
        });
      }
      
      // Create processors (machines)
      const processorTypes = ['quality', 'mixing', 'packaging'];
      for (let i = 0; i < 3; i++) {
        // Horizontal belt processors
        processors.push({
          x: canvas.width / 4 * (i + 1),
          y: beltOffset * 1 - PROCESSOR_SIZE/2,
          size: PROCESSOR_SIZE,
          type: processorTypes[i % processorTypes.length],
          rotation: 0,
          connectsFrom: 0,
          connectsTo: 0,
          processTime: 100 + Math.random() * 200,
          currentProcess: 0,
          pulseEffect: 0,
          pulseDirection: 1
        });
        
        // Add second row processors
        processors.push({
          x: canvas.width / 5 * (i + 1),
          y: beltOffset * 2 - PROCESSOR_SIZE/2,
          size: PROCESSOR_SIZE,
          type: processorTypes[(i+1) % processorTypes.length],
          rotation: 0,
          connectsFrom: 0,
          connectsTo: 0,
          processTime: 100 + Math.random() * 200,
          currentProcess: 0,
          pulseEffect: 0,
          pulseDirection: 1
        });
        
        // Add third row processors
        processors.push({
          x: canvas.width / 4 * (i + 1) - 50,
          y: beltOffset * 3 - PROCESSOR_SIZE/2,
          size: PROCESSOR_SIZE,
          type: processorTypes[(i+2) % processorTypes.length],
          rotation: 0,
          connectsFrom: 0,
          connectsTo: 0,
          processTime: 100 + Math.random() * 200,
          currentProcess: 0,
          pulseEffect: 0,
          pulseDirection: 1
        });
      }
      
      // Create initial batches
      for (let i = 0; i < 15; i++) {
        createNewBatch();
      }
    };
    
    // Create a new batch
    const createNewBatch = () => {
      // Randomly select which belt to place the batch on
      const beltIndex = Math.floor(Math.random() * 3);
      const belt = conveyorBelts[beltIndex];
      
      // Determine position (either start or end based on belt direction)
      let xPos = belt.direction > 0 ? -BATCH_SIZE : belt.width + BATCH_SIZE;
      
      // Create different types of batches (colors represent different products)
      const batchColors = [
        'rgba(79, 70, 229, 0.8)',  // Indigo
        'rgba(59, 130, 246, 0.8)',  // Blue
        'rgba(16, 185, 129, 0.8)',  // Green
        'rgba(245, 158, 11, 0.8)',  // Amber
        'rgba(239, 68, 68, 0.8)'    // Red
      ];
      
      batches.push({
        x: xPos,
        y: belt.y - BATCH_SIZE/2 + BELT_HEIGHT/2,
        size: BATCH_SIZE,
        speed: 0.5 + Math.random() * 0.5,
        color: batchColors[Math.floor(Math.random() * batchColors.length)],
        beltIndex: beltIndex,
        stage: 0,
        rotation: 0,
        pulseEffect: 0,
        pulseDirection: 1
      });
    };
    
    // Draw a conveyor belt
    const drawConveyorBelt = (belt: ConveyorBelt) => {
      // Main belt body
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.fillRect(belt.x, belt.y, belt.width, belt.height);
      
      // Belt pattern (moving dashes)
      ctx.fillStyle = 'rgba(203, 213, 225, 0.6)';
      
      // Update pattern position for animation
      belt.pattern = (belt.pattern + belt.speed * belt.direction) % 40;
      
      // Horizontal belt
      if (belt.width > belt.height) {
        for (let x = belt.pattern; x < belt.width; x += 40) {
          ctx.fillRect(belt.x + x, belt.y + belt.height/2 - 1, 20, 2);
        }
      } 
      // Vertical belt
      else {
        for (let y = belt.pattern; y < belt.height; y += 40) {
          ctx.fillRect(belt.x + belt.width/2 - 1, belt.y + y, 2, 20);
        }
      }
      
      // Add subtle glow effect
      ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.strokeRect(belt.x, belt.y, belt.width, belt.height);
      ctx.shadowBlur = 0;
    };
    
    // Draw a processor machine
    const drawProcessor = (processor: Processor) => {
      const { x, y, size, type } = processor;
      
      // Update pulse effect
      processor.pulseEffect += 0.02 * processor.pulseDirection;
      if (processor.pulseEffect > 1) processor.pulseDirection = -1;
      if (processor.pulseEffect < 0) processor.pulseDirection = 1;
      
      // Base machine shape with rotation
      ctx.save();
      ctx.translate(x + size/2, y + size/2);
      ctx.rotate(processor.rotation);
      
      // Create gradient for processor base
      const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
      gradient.addColorStop(0, 'rgba(30, 41, 59, 0.9)');
      gradient.addColorStop(1, 'rgba(51, 65, 85, 0.9)');
      
      // Draw main body
      ctx.fillStyle = gradient;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(-size/2, -size/2, size, size, 10);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Draw processing indicator 
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, size/3, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw progress
      if (processor.currentProcess > 0) {
        const progress = processor.currentProcess / processor.processTime;
        ctx.strokeStyle = getColorForProcessorType(type);
        ctx.beginPath();
        ctx.arc(0, 0, size/3, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * progress);
        ctx.stroke();
      }
      
      // Draw processor type indicator in center
      ctx.fillStyle = getColorForProcessorType(type, processor.pulseEffect);
      ctx.beginPath();
      
      // Different shapes for different processor types
      if (type === 'quality') {
        // Shield shape for quality
        ctx.arc(0, 0, size/5, 0, Math.PI * 2);
      } else if (type === 'mixing') {
        // Circular mixing symbol
        drawStarShape(ctx, 0, 0, size/5, 8);
      } else {
        // Square for packaging
        ctx.roundRect(-size/8, -size/8, size/4, size/4, 5);
      }
      
      ctx.fill();
      ctx.restore();
      
      // Draw connections between processors and conveyors using bezier curves
      if (processor.connectsFrom >= 0 || processor.connectsTo >= 0) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw connections here if needed
      }
    };
    
    // Draw star shape for mixer
    const drawStarShape = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, points: number) => {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? size : size/2;
        const angle = (i * Math.PI) / points;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };
    
    // Get color based on processor type
    const getColorForProcessorType = (type: string, pulseEffect: number = 0) => {
      switch(type) {
        case 'quality':
          return `rgba(59, 130, 246, ${0.8 + pulseEffect * 0.2})`; // Blue
        case 'mixing':
          return `rgba(16, 185, 129, ${0.8 + pulseEffect * 0.2})`; // Green
        case 'packaging':
          return `rgba(245, 158, 11, ${0.8 + pulseEffect * 0.2})`; // Amber
        default:
          return `rgba(79, 70, 229, ${0.8 + pulseEffect * 0.2})`; // Indigo
      }
    };
    
    // Draw a batch
    const drawBatch = (batch: Batch) => {
      ctx.save();
      ctx.translate(batch.x, batch.y);
      ctx.rotate(batch.rotation);
      
      // Pulse effect animation
      batch.pulseEffect += 0.05 * batch.pulseDirection;
      if (batch.pulseEffect > 1) batch.pulseDirection = -1;
      if (batch.pulseEffect < 0) batch.pulseDirection = 1;
      
      // Draw batch with glow effect
      ctx.shadowColor = batch.color;
      ctx.shadowBlur = 10 + batch.pulseEffect * 5;
      
      // Create different batch visuals based on stage
      if (batch.stage === 0) {
        // Raw materials (square)
        ctx.fillStyle = batch.color;
        ctx.fillRect(-batch.size/2, -batch.size/2, batch.size, batch.size);
      } else if (batch.stage === 1) {
        // Processed (rounded square)
        ctx.fillStyle = batch.color;
        ctx.beginPath();
        ctx.roundRect(-batch.size/2, -batch.size/2, batch.size, batch.size, 10);
        ctx.fill();
      } else {
        // Finished (circle)
        ctx.fillStyle = batch.color;
        ctx.beginPath();
        ctx.arc(0, 0, batch.size/2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw batch identifier
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const batchId = `B-${Math.floor(Math.random() * 1000)}`;
      ctx.fillText(batchId, 0, 0);
      
      ctx.shadowBlur = 0;
      ctx.restore();
    };
    
    // Check for collision between batch and processor
    const checkProcessorCollisions = () => {
      batches.forEach(batch => {
        processors.forEach(processor => {
          const dx = batch.x - (processor.x + processor.size/2);
          const dy = batch.y - (processor.y + processor.size/2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < batch.size/2 + processor.size/2) {
            // Start processing if processor is idle
            if (processor.currentProcess === 0) {
              processor.currentProcess = 1;
              batch.stage = (batch.stage + 1) % 3; // Advance batch stage
              
              // Temporarily hide the batch during processing
              batch.x = -100;
              
              // After processing time, return batch to conveyor
              setTimeout(() => {
                if (processor.currentProcess > 0) {
                  processor.currentProcess = 0;
                  
                  // Place batch back onto conveyor after processing
                  const belt = conveyorBelts[batch.beltIndex];
                  batch.x = processor.x;
                  batch.y = belt.y - batch.size/2 + belt.height/2;
                  
                  // Add visual effects to show processing complete
                  batch.pulseEffect = 1;
                  batch.pulseDirection = -1;
                }
              }, processor.processTime);
            }
          }
        });
      });
    };
    
    // Update batch positions
    const updateBatches = () => {
      batches.forEach((batch, index) => {
        const belt = conveyorBelts[batch.beltIndex];
        
        // Move batch along conveyor
        batch.x += batch.speed * belt.direction;
        
        // Rotate batch
        batch.rotation += 0.002 * belt.direction;
        
        // Remove batches that have gone off-screen
        if ((belt.direction > 0 && batch.x > belt.width + batch.size) || 
            (belt.direction < 0 && batch.x < -batch.size)) {
          // Remove this batch
          batches.splice(index, 1);
          
          // Create a new batch to replace it
          setTimeout(createNewBatch, Math.random() * 1000);
        }
      });
      
      // Check for processor interactions
      checkProcessorCollisions();
      
      // Randomly add new batches
      if (Math.random() < 0.01 && batches.length < 25) {
        createNewBatch();
      }
    };
    
    // Update processor states
    const updateProcessors = () => {
      processors.forEach(processor => {
        // Update processor if currently processing
        if (processor.currentProcess > 0 && processor.currentProcess < processor.processTime) {
          processor.currentProcess++;
          
          // Spin animation during processing
          processor.rotation += 0.01;
        }
      });
    };
    
    // Main animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw conveyor belts
      conveyorBelts.forEach(drawConveyorBelt);
      
      // Draw processors
      processors.forEach(drawProcessor);
      
      // Draw batches
      batches.forEach(drawBatch);
      
      // Update positions and states
      updateBatches();
      updateProcessors();
      
      // Continue animation loop
      animationFrame = requestAnimationFrame(animate);
    };
    
    // Initialize
    setupCanvas();
    animate();
    
    // Handle resize
    const handleResize = () => {
      setupCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [inView]);
  
  return (
    <motion.div 
      ref={ref}
      className="relative w-full h-full min-h-[600px]"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Canvas for factory animation */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
      ></canvas>
      
      {/* Optional overlay gradient for better text contrast if needed */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-indigo-50/80 pointer-events-none"></div>
    </motion.div>
  );
};

export default HomeIllustration;