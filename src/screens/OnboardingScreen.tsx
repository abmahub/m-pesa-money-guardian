import { useState } from 'react';
import { Shield, Zap, MessageCircle, ArrowRight, Lock, ChevronRight } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const steps = [
  {
    step: '01 / 03',
    title: ['Track your daily ', <em key="s" className="not-italic text-primary">spending</em>, ' automatically'],
    description: "Experience precision financial monitoring without lifting a finger. Our digital vault organizes your life's flow in real-time.",
  },
  {
    step: '02 / 03',
    title: ['Smart budgets that ', <em key="p" className="not-italic text-primary">protect</em>, ' your money'],
    description: 'Set spending limits per category and get instant alerts when you\'re close. Never overspend again.',
  },
  {
    step: '03 / 03',
    title: ['Insights that help you ', <em key="g" className="not-italic text-primary">grow</em>],
    description: 'Understand your spending patterns with beautiful charts and AI-powered recommendations.',
  },
];

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPermission, setShowPermission] = useState(false);

  if (showPermission) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top section */}
        <div className="flex-1 px-6 pt-16 pb-8">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Security First</p>
          <h1 className="text-4xl font-bold text-foreground mt-4 leading-tight">
            Financial <span className="text-primary">Clarity</span> starts with access.
          </h1>
          <p className="text-base text-muted-foreground mt-4 leading-relaxed">
            To build your "Digital Vault," PesaGuard requires a one-time permission to organize your financial footprint.
          </p>

          <div className="mt-8 space-y-5">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">End-to-End Privacy</p>
                <p className="text-sm text-muted-foreground mt-0.5">Your transaction data stays on your device. We never sell your personal information.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Instant Insights</p>
                <p className="text-sm text-muted-foreground mt-0.5">Automated categorization of M-Pesa spend patterns in real-time.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Card */}
        <div className="bg-muted rounded-t-3xl px-6 py-8 border-t-4 border-primary">
          <div className="w-14 h-14 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
            <MessageCircle className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground text-center">Allow SMS Access</h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            We only read <strong className="text-foreground">M-Pesa messages</strong> to track your spending. No data is sent without your permission.
          </p>
          <button
            onClick={onComplete}
            className="w-full mt-6 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2"
          >
            Allow Access <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onComplete}
            className="w-full mt-3 py-3 rounded-2xl bg-card text-foreground font-semibold text-sm border border-border"
          >
            Not Now
          </button>
          <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-4 tracking-widest uppercase">
            <Lock className="w-3 h-3" /> Bank-Level Encryption
          </p>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 safe-top">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">PG</span>
          </div>
          <span className="font-bold text-foreground">PesaGuard</span>
        </div>
        <button onClick={() => setShowPermission(true)} className="text-sm font-semibold text-muted-foreground">Skip</button>
      </div>

      {/* Illustration area */}
      <div className="mx-6 mt-4 h-56 rounded-3xl flex items-center justify-center" style={{ background: 'var(--gradient-dark)' }}>
        <div className="text-center">
          <div className="bg-card/20 backdrop-blur rounded-2xl p-4 inline-block">
            <p className="text-primary-foreground/70 text-xs font-semibold">TOTAL BALANCE</p>
            <p className="text-primary-foreground text-2xl font-bold">$12,450.00</p>
            <p className="text-income text-xs mt-1">↗ +2.4%</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
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

      {/* Content */}
      <div className="px-6 mt-4 flex-1">
        <h1 className="text-4xl font-bold text-foreground leading-tight">{step.title}</h1>
        <p className="text-base text-muted-foreground mt-4 leading-relaxed">{step.description}</p>
      </div>

      {/* Bottom */}
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
          © 2026 PesaGuard. Secure Financial Precision.
        </p>
      </div>
    </div>
  );
};

export default OnboardingScreen;
