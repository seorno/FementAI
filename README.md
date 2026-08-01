# FermentAI

FermentAI is an advanced ML-driven tool that predicts fermentation outcomes (flavor profile, ABV/acidity, timing, off-flavor risk) for small-scale fermented-food producers. It moves beyond treating fermentation as a black box by modeling the **microbial community** driving the fermentation, offering explainable predictions and biological insights.

## Project Structure

- **`backend/`**: FastAPI application, ML pipeline (Scikit-learn/XGBoost), SQLite database, and synthetic data generators.
- **`frontend/`**: Next.js 14 application with Tailwind CSS, Recharts for fermentation curves, and Cytoscape.js for microbial network visualization.
- **`docs/`**: Detailed documentation on data methodology and architecture.
  - `data_sources.md`: Information on curated literature, dataset parsing, and synthetic generation.
  - `methodology.md`: Explanation of ML models, feature engineering, and network construction.

## Limitations & Data Provenance
*Important context regarding the predictive models:*
- **Literature Data (Real):** The primary models for predicting acidity and alcohol content are trained directly on real-world data points extracted from published fermentation studies (e.g., Barbosa et al., 2021; Suhre et al., 2021; Jung et al., 2011). Because these datasets are highly curated and small ($N < 10$), the model utilizes Leave-One-Out Cross-Validation.
- **Simulated Data (Synthetic):** For certain edge cases or targets where no negative real-world examples exist in literature (e.g., severe off-flavor risk), the system falls back to a biologically constrained synthetic data generator. 
- **Transparency:** Any prediction powered by a synthetic model is explicitly and visibly labeled as **"Simulated / demo data"** in the UI to prevent misleading users. FermentAI serves as a powerful explainability prototype for microbial fermentation, but is not yet a validated production system for commercial use without your own facility data.

## Quick Start (Local Development)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the data ingestion and model training pipeline (generates synthetic data and trains models):
   ```bash
   PYTHONPATH=. python3 scripts/train_models.py
   ```
5. Start the FastAPI server:
   ```bash
   PYTHONPATH=. uvicorn api.main:app --host 0.0.0.0 --port 8000
   ```
   *The API will be available at http://localhost:8000*

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The web application will be available at http://localhost:3000*

## Deployment

### Backend (Render)
The backend is designed to be easily deployed on Render as a Web Service.
1. Connect your repository to Render.
2. Build Command: `pip install -r backend/requirements.txt`
3. Start Command: `cd backend && PYTHONPATH=. uvicorn api.main:app --host 0.0.0.0 --port $PORT`
4. Set the Environment Variable `DATABASE_URL` to your permanent PostgreSQL database (e.g., Neon or Supabase).
5. Set `FERMENTAI_CORS_ORIGINS` to your frontend production URL.

### Frontend (Vercel)
The Next.js frontend can be deployed on Vercel with zero-config.
1. Import the repository in Vercel.
2. Set the Root Directory to `frontend`.
3. Add the Environment Variable `NEXT_PUBLIC_API_URL` pointing to your deployed Render backend URL.
4. Deploy!

## Model Retraining
The Render deployment pipeline **does not** automatically retrain the machine learning models. Instead, the pre-trained model artifacts (`.joblib` files) are tracked in the Git repository and loaded instantly on startup. 

When you acquire new real-world data and want to update the models, you must manually run the training script locally and commit the resulting artifacts:
```bash
# From the backend directory:
PYTHONPATH=. python scripts/train_models.py
git add models/trained/
git commit -m "Update models with new data"
git push
```
The Render web service will automatically pull the new branch and restart the API with the fresh models.

## Core Features
- **Predictive ML**: Forecast acidity, alcohol percentage, and off-flavor risk based on initial parameters (temperature, pH, substrate, duration).
- **Microbial Network Analysis**: Interactive Cytoscape graphs revealing co-occurrence and competitive dynamics.
- **SHAP Explanations**: Understand exactly *why* a model made its prediction through transparent feature importance.
