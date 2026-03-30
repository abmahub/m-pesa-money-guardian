import { useState, useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'done'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 600);
    const t2 = setTimeout(() => setPhase('done'), 2200);
    const t3 = setTimeout(onFinish, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        background: 'linear-gradient(160deg, hsl(155, 40%, 15%) 0%, hsl(160, 60%, 8%) 50%, hsl(155, 35%, 5%) 100%)',
        opacity: phase === 'done' ? 0 : 1,
        pointerEvents: phase === 'done' ? 'none' : 'auto',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-96 h-96 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(152, 60%, 40%) 0%, transparent 70%)',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, hsl(152, 50%, 50%) 0%, transparent 70%)',
            bottom: '30%',
            right: '10%',
          }}
        />
      </div>

      {/* Logo Icon */}
      <div
        className="relative transition-all duration-700 ease-out"
        style={{
          transform: phase === 'logo' ? 'scale(0.8)' : 'scale(1)',
          opacity: phase === 'logo' ? 0.5 : 1,
        }}
      >
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsla(152, 40%, 35%, 0.3), hsla(152, 40%, 25%, 0.15))',
            border: '1px solid hsla(152, 40%, 40%, 0.2)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Shield className="w-12 h-12" style={{ color: 'hsl(152, 50%, 60%)' }} />
        </div>
      </div>

      {/* Text */}
      <div
        className="mt-8 text-center transition-all duration-700 ease-out"
        style={{
          transform: phase !== 'logo' ? 'translateY(0)' : 'translateY(12px)',
          opacity: phase !== 'logo' ? 1 : 0,
        }}
      >
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'hsl(152, 40%, 85%)' }}>
          PesaGuard
        </h1>
        <p className="text-sm mt-2" style={{ color: 'hsl(152, 20%, 55%)' }}>
          Your money, under control
        </p>
      </div>

      {/* Bottom */}
      <div
        className="absolute bottom-12 flex flex-col items-center gap-3 transition-all duration-700"
        style={{ opacity: phase !== 'logo' ? 1 : 0 }}
      >
        {/* Progress bar */}
        <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: 'hsla(152, 20%, 30%, 0.3)' }}>
          <div
            className="h-full rounded-full transition-all duration-[1500ms] ease-out"
            style={{
              width: phase !== 'logo' ? '100%' : '0%',
              background: 'hsl(152, 50%, 50%)',
            }}
          />
        </div>
        <p className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase"
          style={{ color: 'hsl(152, 15%, 45%)' }}
        >
          <Lock className="w-3 h-3" />
          Bank-Grade Encryption
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
