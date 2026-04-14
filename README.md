# 🌍 Energy Consumption under Changing Weather  
### A Machine Learning Case Study of French Energy Demand  

**Authors:** Anahí Reyes Miguel and Robert Campbell Powers

This project builds machine learning models to predict **daily regional electricity consumption per capita in France** using weather, demographic, and calendar data.  
It evaluates multiple models to understand the **non-linear relationship between weather patterns and energy demand** and to support energy planning in a renewable-transition context.

---

## Overview

Accurate electricity demand forecasting is essential for modern power grid management.  
With renewable energy production highly dependent on weather conditions, understanding how weather affects consumption is critical for grid stability, planning, and policy.

This project uses statistical learning methods to estimate regional electricity demand in France based on observed weather conditions.

Main objective:  
Predict **daily electricity consumption per capita** at the regional level using weather and demographic data.

---

## Dataset

The final dataset combines three sources:

### Electricity consumption  
**Source:** Opendata Réseaux-Énergies (ODRÉ)  
- Half-hourly regional consumption  
- Aggregated to daily totals  
- Metropolitan France (excluding Corsica)  
- Period used: 2014–2021  

### Weather data  
**Source:** Météo-France  
- 3,900+ weather stations  
- 200+ meteorological variables  
- Aggregated to daily regional averages  

### Population statistics  
**Source:** INSEE  
- Regional population (2014–2024)  
- Used to compute per-capita consumption  
- Population density constructed as additional feature  

---

## Final modeling dataset

- Unit: region × day  
- Rows: ~57,000  
- Features after cleaning: 29  
- Target: electricity consumption per capita  

Cleaning steps:
- Removed variables with >20% missing values  
- Removed multicollinearity using VIF threshold  
- Aggregated weather stations to regional averages  
- Constructed per-capita consumption  

---

## Repository Structure
```
Energy_Weather_France/
│
├── data/
│   ├── france_energy_meteo_daily.csv
│   ├── POPULATION_MUNICIPALE_REGION_FRANCE.xlsx
│   └── energy_source_with_predictions.csv
│
├── notebooks
│   ├── 01_data_cleaning.ipynb
│   ├── 02_modeling.ipynb
│   └── 03_visualizations.ipynb
│
├── docs/
│   └── index.html
│
├── output/
└── README.md
```

### Notebooks

**notebooks/01_data_cleaning.ipynb**
- Merge datasets  
- Feature engineering  
- Cleaning and preprocessing  

**notebooks/02_modeling.ipynb**
- Model training  
- Hyperparameter tuning  
- Evaluation and visualization  

**notebooks/03_visualizations.ipynb**
- Generate plots and figures  
- Model comparison visuals  
- Data storytelling outputs  

---

## Methodology

We use a supervised regression framework to predict daily electricity consumption per capita.

### Models implemented
- Linear Regression (baseline)
- Decision Tree
- Random Forest
- Support Vector Regressor (RBF kernel)
- Multilayer Perceptron (MLP neural network)

### Pipeline

1. Merge weather, energy, and population data  
2. Create per-capita consumption target  
3. Train/test split (80/20 random split)  
4. Feature scaling for SVM and MLP  
5. Hyperparameter tuning using GridSearchCV  
6. Evaluation using:
   - MAE  
   - RMSE  
   - R²  

---

## Results

### Model Performance

| Model                | MAE  | RMSE | R²    |
|---------------------|------|------|-------|
| Linear Regression   | 4.088 | 5.126 | 0.712 |
| Decision Tree       | 2.209 | 2.982 | 0.902 |
| SVR (RBF)           | 2.280 | 2.991 | 0.902 |
| Random Forest       | **1.706** | 2.315 | 0.941 |
| Neural Network (MLP)| 1.735 | **2.269** | **0.944** |

### Key Insights

- All non-linear models substantially outperform the linear baseline, confirming a strong **non-linear relationship between weather variables and electricity demand**.
- The **Random Forest** achieves the lowest MAE, making it the most accurate in absolute prediction error.
- The **MLP Neural Network** achieves the best overall fit (highest R² and lowest RMSE), slightly outperforming Random Forest.
- Tree-based and kernel-based models (Decision Tree, SVR) already capture most of the predictive structure, suggesting that non-linearity is a dominant feature of the data.

### Interpretation

While the MLP provides the best predictive performance, the Random Forest remains a strong candidate due to its balance between **accuracy and interpretability**, making it more suitable for policy-oriented applications.

---

## Data Storytelling                                                                                                                
                                                                                                                                   
An interactive data storytelling page is available at ([docs/index.html](https://anahirm.github.io/Energy_Weather_France/docs/index.html)).                                         
                                                                                                                                  
**Title:** *Predicting energy consumption in France: when the model is right on average but wrong where it matters*                 
                                                                                                                                   
It is built with D3.js and structured around the following narrative sections:                                                      
                                                                                                                                   
1. **The model** — Choosing the right architecture (model comparison)                                                               
2. **Spatial heterogeneity** — Average performance conceals critical regional differences                                           
3. **Spatial analysis** — Where does the model struggle?                                                                            
4. **Interpretation** — Why are some regions harder to predict?                                                                     
5. **Conclusion** — Understanding where models fail is as important as their average performance                                    
6. **Data Sources & References**                                                                                                    
                                                                                                                                     
## How to Run

### Clone repository
```bash
git clone https://github.com/AnahiRM/Energy_Weather_France
cd Energy_Weather_France
