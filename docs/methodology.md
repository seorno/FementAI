# FermentAI Methodology

FermentAI predicts fermentation outcomes (like pH, acidity, ABV, and off-flavor risk) by mapping both macro-environmental inputs (temperature, duration) and **microbial community composition** (relative abundances of specific genera) to final outcomes. 

## 1. Machine Learning Architecture
FermentAI utilizes tabular machine learning models built via `scikit-learn` and `xgboost`. 

### Dual-Track Provenance
Because large-scale paired datasets (microbiome + outcomes) are extremely rare in the public domain, we employ a dual-track strategy:
- **Primary Models (Real Literature Data):** We extract precise, paired data points from published literature (e.g., Barbosa 2021 for Kombucha, Lee 2017 for Kimchi). Because sample sizes are very small ($N < 10$ unique literature contexts per product), we train `RandomForestRegressor` models using **Leave-One-Out Cross-Validation (LOOCV)**. 
- **Simulation Models (Synthetic Fallback):** For targets lacking real data (like Off-Flavor Risk) or to provide a robust API fallback when real data cannot produce a valid prediction, we train parallel models on a biologically-constrained synthetic dataset of 500+ batches.

### Validation Results (Real Data)
- **Kombucha Acidity (LOOCV):** RMSE ~ 0.95 g/L | MAE ~ 0.84 g/L
- **Kombucha Alcohol (LOOCV):** RMSE ~ 0.28% ABV | MAE ~ 0.27% ABV
- **Kimchi Acidity (LOOCV):** RMSE ~ 0.21 g/L | MAE ~ 0.16 g/L
*(Note: $R^2$ is not reported for these models as the sample size is too small for it to be a meaningful metric. The earlier $R^2 \approx 0.99$ results were derived from the synthetic generator and served as an internal calibration prototype, not ground-truth.)*

Any API response utilizing the Synthetic models is explicitly flagged (`is_simulated_prediction: true`) and visually labeled in the UI as "Simulated / demo data".

## 2. Feature Engineering & Compositionality
Microbial relative abundances are strictly compositional (they sum to 100%). Using them directly in standard ML models or correlation metrics leads to severe spurious correlations (e.g., if species A grows, species B's relative abundance *must* mathematically decrease, even if its absolute abundance stayed exactly the same).

To solve this, FermentAI applies a **Centered Log-Ratio (CLR)** transformation before building features or constructing networks:
$CLR(x_i) = \ln\left(\frac{x_i}{g(x)}\right)$
where $g(x)$ is the geometric mean of the community composition.

## 3. Explainability (SHAP)
FermentAI doesn't just predict; it explains. We use **TreeExplainer SHAP (SHapley Additive exPlanations)** to break down every prediction.
For example, if the predicted Kombucha ABV is 2.5%, SHAP can isolate that +0.8% of that prediction was driven by an unusually high *Zygosaccharomyces* abundance, while -0.2% was driven by a low fermentation temperature.

## 4. Microbial Interaction Networks
The "Explore" tab visualizes the microbial community as a network graph:
- **Nodes** represent microbial genera (sized by mean abundance).
- **Edges** represent significant co-occurrence or mutual exclusion. These are calculated using Spearman rank correlation on the CLR-transformed abundance matrix across all available batches, filtered by Benjamini-Hochberg FDR correction ($p < 0.05$). Positive edges often indicate cross-feeding or synergy, while negative edges suggest competition or niche exclusion.
