# Energy Consumption under Changing Weather
### French Regional Energy Demand — ML Analysis & Data Storytelling

---

## About this Repository

This repository contains two related but independent projects:

**Part 1 — Machine Learning Analysis**
*Applied Statistical Learning · APM_5ML10_AE · École Polytechnique – ENSAE*
Built with **Anahí Reyes Miguel and Robert Campbell Powers**.
Trains and evaluates regression models to predict daily electricity consumption per capita across 12 French regions using weather, demographic, and calendar data.

**Part 2 — Interactive Data Storytelling**
*Data Storytelling · CSC_5CS17_AE · École Polytechnique – ENSAE · 2026*
Built by **Anahí Reyes Miguel**, reusing the ML findings to investigate a key question: is predictive accuracy uniform across geographic space?

**Live page → [https://anahirm.github.io/Energy_Weather_France/docs/index.html](https://anahirm.github.io/Energy_Weather_France/docs/index.html)**

---

## How to Run Locally

See [`js/README.md`](js/README.md) for full instructions. The quickest way — from the project root:

```bash
python -m http.server 8000
```

Then open: `http://localhost:8000/docs/index.html`

> Opening `index.html` directly by double-clicking will not work due to browser CORS restrictions on local JSON files.

---

## Repository Structure

```
Energy_Weather_France/
├── docs/
│   └── index.html              
├── js/
│   ├── vizB.js                 
│   ├── vizC.js                
│   ├── vizD.js                 
│   ├── vizE.js                 
│   ├── vizANOVA.js             
│   └── d3.v7.min.js
├── data/
│   ├── france_energy_meteo_daily.csv
│   ├── energy_source_with_predictions.csv
│   ├── rf_results.csv
│   ├── region_metrics.json
│   ├── rf_scatter.json
│   ├── anova_results.json
│   ├── violin_data.json
│   └── viz_e_data.json
├── notebooks/
│   ├── 01_data_cleaning.ipynb
│   ├── 02_modeling.ipynb
│   └── 03_visualizations.ipynb 
├── output/
└── README.md
```

---

## Part 1 — ML Analysis

### Dataset

Three publicly available sources combined into a daily region-level panel (2017–2021):

- **Energy:** RTE / data.gouv.fr — *Consommation quotidienne brute régionale*
- **Climate:** Météo-France — 3,900+ weather stations, aggregated to daily regional averages
- **Demographics:** INSEE — regional population used for per-capita normalization

Final dataset: **31,738 observations** (region × day), 12 metropolitan regions, 29 features after cleaning.

### Model Results

| Model | MAE | RMSE | R² |
|:------|----:|-----:|---:|
| Linear Regression | 4.088 | 5.126 | 0.712 |
| Decision Tree | 2.209 | 2.982 | 0.902 |
| SVR (RBF) | 2.280 | 2.991 | 0.902 |
| **Random Forest** (selected) | **1.706** | **2.315** | **0.941** |
| Neural Network (MLP) | 1.735 | 2.269 | 0.944 |

The Random Forest was selected for its best balance of accuracy and interpretability.

---

## Part 2 — Data Storytelling

*Predicting energy consumption in France: when the model is right on average but wrong where it matters*

The story follows a martini-glass narrative structure — author-driven first, then reader-driven exploration:

1. **The model** — five-model benchmark, Random Forest selected
2. **The twist** — ANOVA confirms prediction errors are spatially structured (F = 10.03, p < 0.001)
3. **The map** — choropleth of mean MAPE by region, interactive hover
4. **The explanation** — typological blindness, landlord-tenant problem, hybrid work
5. **Conclusion** — predictive reliability across space matters as much as average accuracy
