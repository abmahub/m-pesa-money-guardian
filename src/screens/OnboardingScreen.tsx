import { useState } from 'react';
import { Shield, Zap, MessageCircle, ArrowRight, Lock } from 'lucide-react';
import { smsService } from '@/services/capacitorSms';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const steps = [
  {
    step: '01 / 03',
    title: ['Track your daily ', <em key="s" className="not-italic text-primary">spending</em>, ' automatically'],
    description: "PesaGuard reads your M-Pesa messages to automatically track every transaction — no manual entry needed.",
  },
  {
    step: '02 / 03',
    title: ['Smart budgets that ', <em key="p" className="not-italic text-primary">protect</em>, ' your money'],
    description: 'Set spending limits per category and get instant alerts when you\'re close. Never overspend again.',
  },
  {
    step: '03 / 03',
    title: ['Insights that help you ', <em key="g" className="not-italic text-primary">grow</em>],
    description: 'Understand your spending patterns with beautiful charts and actionable recommendations.',
  },
];

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPermission, setShowPermission] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setRequesting(true);
    if (smsService.isAvailable()) {
      // Triggers the REAL Android system permission dialog
      await smsService.requestPermission();
    }
    // Complete onboarding regardless of permission result
    onComplete();
  };

  if (showPermission) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 px-6 pt-16 pb-8">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Security First</p>
          <h1 className="text-4xl font-bold text-foreground mt-4 leading-tight">
            Financial <span className="text-primary">Clarity</span> starts with access.
          </h1>
          <p className="text-base text-muted-foreground mt-4 leading-relaxed">
            PesaGuard needs SMS access to read your M-Pesa transaction messages. Your data stays on your device.
          </p>

          <div className="mt-8 space-y-5">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">End-to-End Privacy</p>
                <p className="text-sm text-muted-foreground mt-0.5">Your transaction data stays on your device. Nothing is uploaded or shared.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">M-Pesa Only</p>
                <p className="text-sm text-muted-foreground mt-0.5">We only read messages from M-Pesa. All other SMS are completely ignored.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Card */}
        <div className="bg-muted rounded-t-3xl px-6 py-8 border-t-4 border-primary">
          <div className="w-14 h-14 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
            <MessageCircle className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground text-center">Grant SMS Permission</h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Tapping below will open the <strong className="text-foreground">Android system permission dialog</strong>. This is required to read M-Pesa messages.
          </p>
          <button
            onClick={handleRequestPermission}
            disabled={requesting}
            className="w-full mt-6 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {requesting ? 'Requesting...' : 'Grant SMS Access'} <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onComplete}
            className="w-full mt-3 py-3 rounded-2xl bg-card text-foreground font-semibold text-sm border border-border"
          >
            Skip for Now
          </button>
          <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-4 tracking-widest uppercase">
            <Lock className="w-3 h-3" /> Data stays on your device
          </p>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-6 py-4 safe-top">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">PG</span>
          </div>
          <span className="font-bold text-foreground">PesaGuard</span>
        </div>
        <button onClick={() => setShowPermission(true)} className="text-sm font-semibold text-muted-foreground">Skip</button>
      </div>

      <div className="mx-6 mt-4 h-56 rounded-3xl flex items-center justify-center" style={{ background: 'var(--gradient-dark)' }}>
        <div className="text-center">
          <div className="bg-card/20 backdrop-blur rounded-2xl p-4 inline-block">
            <p className="text-primary-foreground/70 text-xs font-semibold">M-PESA TRACKING</p>
            <p className="text-primary-foreground text-2xl font-bold">Automatic</p>
            <p className="text-primary/80 text-xs mt-1">Real-time insights</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 flex items-center gap-3">
        <span className="text-[10px] font-semibold tracking-widest text-accent-foreground bg-accent px-2 py-1 rounded-full uppercase">
          Step {step.step}
        </span>
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-8 bg-primary' : 'w-4 bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="px-6 mt-4 flex-1">
        <h1 className="text-4xl font-bold text-foreground leading-tight">{step.title}</h1>
        <p className="text-base text-muted-foreground mt-4 leading-relaxed">{step.description}</p>
      </div>

      <div className="px-6 pb-8">
        <button
          onClick={() => {
            if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
            else setShowPermission(true);
          }}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base"
        >
          Next <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-[10px] text-muted-foreground mt-4 tracking-widest text-center uppercase">
          © 2026 PesaGuard. Your data stays on your device.
        </p>
      </div>
    </div>
  );
};

export default OnboardingScreen;
