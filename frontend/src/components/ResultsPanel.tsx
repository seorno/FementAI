import FermentationCurve from './FermentationCurve';
import ShapExplanation from './ShapExplanation';

export default function ResultsPanel({ result }: { result: any }) {
  if (!result) return null;

  return (
    <div className="flex flex-col gap-6">
      {result.is_simulated_prediction && (
        <div className="bg-accent-amber/20 border border-accent-amber text-accent-amber px-4 py-2 rounded-md flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">Simulated / demo data:</span> 
          This prediction is based on synthetic data models because real paired literature data is scarce for this configuration.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex flex-col items-center justify-center">
          <span className="text-sm text-gray-400">Predicted Acidity</span>
          <span className="text-3xl font-bold data-value text-accent-teal">{result.predictedAcidity.toFixed(2)}</span>
        </div>
        <div className="glass-card p-4 flex flex-col items-center justify-center">
          <span className="text-sm text-gray-400">Predicted ABV</span>
          <span className="text-3xl font-bold data-value text-accent-cyan">{result.predictedABV.toFixed(2)}%</span>
        </div>
        <div className="glass-card p-4 flex flex-col items-center justify-center">
          <span className="text-sm text-gray-400">Off-Flavor Risk</span>
          <span className={`text-2xl font-bold ${result.offFlavorRisk === 'High' ? 'text-accent-rose' : 'text-accent-amber'}`}>{result.offFlavorRisk}</span>
        </div>
      </div>
      
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4">Fermentation Curve</h3>
        <FermentationCurve data={result.fermentationCurve} />
      </div>

      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4">Feature Importance (SHAP)</h3>
        <ShapExplanation data={result.shapValues} />
      </div>
    </div>
  );
}
