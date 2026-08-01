import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-cyan">About FermentAI</h1>
      
      <div className="glass-card p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-accent-teal">What is FermentAI?</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          FermentAI is a free, open-source tool designed to provide <strong>literature-informed fermentation modeling</strong> for small-scale fermented-food producers. 
          Enterprise fermentation-AI tools are often prohibitively expensive and treat the microbial community as a black box. 
          We built FermentAI so that craft producers can access explainable, predictive insights grounded in biological dynamics.
        </p>
        <div className="mt-4 flex gap-4">
          <a href="https://github.com/your-username/FermentAI" target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline">
            View on GitHub
          </a>
        </div>
      </div>

      <div className="glass-card p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-accent-teal">Methodology</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          Rather than predicting with absolute commercial accuracy, FermentAI uses a multi-modal machine learning approach to provide insights grounded in published research. 
          We combine physical parameter data (temperature, pH, duration, salt/substrate concentration) with 
          microbial community profiles using Gradient Boosted Trees and compositional data analysis (CLR transformations).
        </p>
        <p className="text-gray-300 leading-relaxed mb-4">
          To understand our model architecture and constraints in detail, please read our <a href="https://github.com/your-username/FermentAI/blob/main/docs/methodology.md" target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline">Methodology Documentation</a>.
        </p>
      </div>

      <div className="glass-card p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-accent-cyan">Data Sources & Limitations</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          Our primary models are grounded in published research on 5 highly-curated literature studies.
        </p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li><strong>Kombucha:</strong> Grounded in Suhre 2021, Ohwofasa 2024, and Barbosa 2021.</li>
          <li><strong>Kimchi:</strong> Grounded in Jung 2011 and Lee 2017.</li>
        </ul>
        <p className="text-gray-300 leading-relaxed mb-4">
          <strong>Simulation Mode:</strong> Because real paired datasets (microbiome + outcomes) are scarce, edge cases and extreme off-flavor modeling rely on a biologically constrained synthetic generator. Any predictions utilizing these synthetic models are explicitly badged as "Simulated / demo data" in the application to ensure complete transparency.
        </p>
        <p className="text-gray-300 leading-relaxed">
          For full details on our datasets, read our <a href="https://github.com/your-username/FermentAI/blob/main/docs/data_sources.md" target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline">Data Sources Documentation</a>.
        </p>
      </div>
    </div>
  );
}
