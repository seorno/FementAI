import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-800 via-navy-900 to-background"></div>
      <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
        Master Fermentation with <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-cyan">AI Precision</span>
      </h1>
      <p className="text-xl text-gray-400 max-w-2xl mb-10">
        Explore literature-informed fermentation outcomes, optimize parameters, and uncover deep biological insights grounded in published research.
      </p>
      
      <Link href="/predict" className="px-8 py-4 bg-gradient-to-r from-accent-teal to-accent-cyan text-navy-900 font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(6,214,160,0.4)]">
        Start Predicting
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full">
        <div className="glass-card p-6 flex flex-col items-center">
          <h3 className="text-xl font-bold mb-2 text-accent-teal">Outcome Prediction</h3>
          <p className="text-gray-400 text-sm">Forecast pH, acidity, ABV, and off-flavor risks before starting your batch.</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center">
          <h3 className="text-xl font-bold mb-2 text-accent-cyan">Microbial Network</h3>
          <p className="text-gray-400 text-sm">Explore interactive networks of symbiotic and competitive microbial communities.</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center">
          <h3 className="text-xl font-bold mb-2 text-accent-amber">SHAP Explanations</h3>
          <p className="text-gray-400 text-sm">Understand the 'why' behind predictions with feature importance visualization.</p>
        </div>
      </div>

      <div className="mt-20 flex gap-12 text-center border-t border-white/10 pt-10 w-full max-w-4xl justify-center">
        <div>
          <div className="text-4xl font-bold data-value text-accent-teal">2</div>
          <div className="text-gray-500 uppercase text-xs tracking-widest mt-1">Product Types</div>
        </div>
        <div>
          <div className="text-4xl font-bold data-value text-accent-cyan">1000+</div>
          <div className="text-gray-500 uppercase text-xs tracking-widest mt-1">Training Batches</div>
        </div>
        <div>
          <div className="text-4xl font-bold data-value text-accent-amber">15+</div>
          <div className="text-gray-500 uppercase text-xs tracking-widest mt-1">Microbial Species</div>
        </div>
      </div>
    </div>
  );
}
