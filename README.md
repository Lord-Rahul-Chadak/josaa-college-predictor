# 🎓 JoSAA Intelligent College Predictor & Trend Analytics Dashboard

A production-grade, full-stack predictive engineering utility built to simulate, evaluate, and visualize choice-filling allocations for JoSAA engineering admissions. The platform splits candidate profiles across individual evaluation metrics, applying advanced data sorting pipelines and real-time spatial mapping.

## 🚀 Core Features & Architectural Highlights

- **Dual-Stream Rank Processing Matrix:** Dynamically routes calculations based on examination tracks. Evaluates Indian Institutes of Technology (IITs) strictly via **JEE Advanced Ranks** while processing NITs, IIITs, and GFTIs seamlessly using **JEE Main Ranks** within a single horizontal input layout.
- **Custom Stable Sorting Architecture ($O(n \log n)$):** Implements a native, zero-dependency **Merge Sort algorithm** in the backend data pipeline. Guarantees priority stability while grouping institutional tiers (NITs → IIITs → GFTIs) and prioritizing highly competitive cutoffs ascendingly.
- **Detached Immersive Geospatial Analytics Tab:** Launches an independent web window tracking live coordinate positions of target match sets using **Leaflet.js/OpenStreetMap**. Employs explicit regular expression boundary tokens (`\b`) to eliminate substring mapping leaks (e.g., separating IIIT Una tracking rules cleanly from NIT Arunachal Pradesh data scopes).
- **Non-Destructive Live Search Sub-filtering:** Keeps user views intact using a local state filtering engine. Typing inside keyword bars repositions matched target records at the top of the viewport with custom highlight panels, using fallback warning states instead of blank screen locks if a user makes a typo.
- **Progressive Batch Rendering (UX Optimization):** Implements a client-side progressive disclosure mechanism capped initially at a fast 20 rows per view segment to limit DOM nodes overhead, resetting to baseline groups seamlessly upon category switching.
- **Native Choice Preference Reporter:** Compiles and prints beautifully structured, high-contrast, multi-page candidate choice lists into a physical PDF using pure layout window streaming vectors—completely bypasses external canvas dependency packages.

---

## 🛠️ Technology Stack & Engineering Tools

- **Backend Architecture:** FastAPI (Python), Pandas Dataframe Engines, NumPy Vectorized Array Operations, Uvicorn Web Worker Servers.
- **Frontend Workspace:** React.js, Vite Engine, Vanilla JavaScript Document Style Architectures, Leaflet Spatial GIS Mapping layers.
- **Version Control & Repository:** Git Engine pipeline management hooks.

---

## 📁 Repository Directory Structure

```text
├── app/                  # FastAPI backend web controller routes namespace
│   ├── __init__.py       # Explicit Python package namespace declaration token
│   ├── engine.py         # Prediction math, multipliers, and custom Merge Sort code
│   └── main.py           # FastAPI entry endpoint with CORS routing middleware 
├── data/                 # Data repository layer
│   └── cleaned_josaa_data.csv # Compiled multi-year historical admissions data records
├── frontend/             # Single Page Application React root container workspace
│   ├── src/
│   │   └── App.jsx       # Custom dashboard workspace interface layer 
└── requirements.txt      # Python deployment package specifications sheet