# FermentAI Data Sources

FermentAI relies on a dual-track data strategy to overcome the scarcity of large-scale paired (microbiome + outcome) datasets in public repositories, utilizing **Real Literature Data** for primary predictions and **Biologically Constrained Synthetic Data** for coverage/fallback logic.

## 1. Real Literature Data (Primary)
Our primary outcome models (acidity, alcohol) are trained exclusively on curated data points extracted from published fermentation studies. These represent ground-truth biological variance.

**Kombucha Sources:**
- *Microbial Community and Physicochemical Characterization of Kombuchas Produced and Marketed in Brazil* (Suhre et al., 2021) — Provides explicit relationships between Komagataeibacter abundance (≥85%), alcohol content, and acidity.
- *Elevated abundance of Komagataeibacter results in a lower pH in kombucha production* (Ohwofasa et al., 2024) — Details the microbial succession driving pH drops.
- *Microbial–physicochemical integrated analysis of kombucha fermentation* (Barbosa et al., 2021) — Tracks community composition vs outcomes over a 12-day fermentation.

**Kimchi Sources:**
- *Metagenomic Analysis of Kimchi, a Traditional Korean Fermented Food* (Jung et al., 2011) — Connects Lactic Acid Bacteria abundance directly to pH stabilization at ~4.2.
- *Large-scale targeted metagenomics analysis of bacterial ecological changes in 88 kimchi samples* (Lee et al., 2017) — Profiles the specific successional shift from *Leuconostoc* to *Lactobacillus* and *Weissella* across varying salt concentrations.

## 2. Synthetic Data Generation (Simulation Mode)
To provide a complete user experience for edge cases, off-flavor risk modeling (which lacks published negative examples), and to build robust clustering and network graphs, we use a custom synthetic generator (`backend/data/ingestion/synthetic/`).

The generator utilizes logistic decay curves parameterized by real-world constraints (e.g., pH dropping faster at 30°C than 20°C, and alcohol peaking depending on yeast/AAB ratios). 

**Provenance Transparency:**
Any prediction powered by a synthetic fallback model is explicitly flagged in the API (`is_simulated_prediction: true`) and visibly badged as **"Simulated / demo data"** in the frontend UI. The synthetic dataset serves as an internal calibration prototype and should not be mistaken for validated ground-truth.
