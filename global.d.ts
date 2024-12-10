// global.d.ts

// Type declaration for 'canvas-confetti'
declare module 'canvas-confetti' {
    interface ConfettiOptions {
      particleCount?: number; // Number of confetti particles
      angle?: number; // Angle in degrees for confetti launch
      spread?: number; // Spread angle in degrees
      startVelocity?: number; // Starting velocity of particles
      decay?: number; // Decay rate of particle velocity
      gravity?: number; // Gravity affecting particles
      origin?: { x: number; y: number }; // Origin point of confetti [0, 1]
      colors?: string[]; // Array of colors for particles
      ticks?: number; // Lifetime of particles in ticks
    }
  
    interface ConfettiFunction {
      (options?: ConfettiOptions): Promise<void>;
    }
  
    const confetti: ConfettiFunction;
    export default confetti;
  }
  