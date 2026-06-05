# QuantVest: AI-Driven Mutual Fund Copilot

**QuantVest** is an intelligent, explainable decision-support system for retail investors in India. It started as a smart mutual fund portfolio tracker and analytics app and now extends into an AI copilot that provides automated portfolio drift analysis, risk-aligned recommendations, and data-backed investment insights.

With real-time NAV updates, SIP calculators, performance insights, and explainable recommendations, QuantVest helps both new and seasoned investors make smarter, traceable decisions.

---

## Key Capabilities

- **Track Your Portfolio** — Add mutual fund investments with historical NAV-based buy tracking.
- **Live NAV Updates** — Get the latest NAV for each fund via `mftool` / APIs.
- **P&L Calculations** — Automatically calculate profit & loss for each holding.
- **AI-Driven Suitability** — Map user risk profiles to optimized allocations using rules-based and ML engines.
- **Explainable Recommendations** — Translate fund metrics into human-readable, auditable insights.
- **Portfolio Health Monitoring** — Track drift, overlap, performance, and goal alignment.

---

## Technical Architecture 

| Tier | Tech | 
| :--- | :--- | 
| Frontend | React.js |
| API |FastAPI (Python) |
| Database | MongoDB |
| ML Engine | scikit-learn (MLflow pipelines) |
| Data Source | Mftool / MF APIs | 

---

## MVP Roadmap
1. **Data Layer**: Automated NAV and metadata ingestion via `mfapi.in` (or `mftool` for now).
2. **ML Brain**: Sklearn-compatible ranking model using rolling returns, volatility, and expense ratios.
3. **Explainability**: LLM-integrated summary layer grounded in system-calculated features.
4. **Auditability**: Full log of recommendation history and user suitability answers for compliance.

---

## Governance & Ethics
QuantVest adheres to core principles for AI in Indian finance:

- **Transparency**: No black-box models; recommendations are traceable to feature scores.
- **Human-in-the-Loop**: Designed as a recommendation tool, not for autonomous execution.
- **Data Integrity**: Built for auditability and compliance with SEBI-aligned disclosure standards.

---

## Local Development

Backend (Python, Flask):

```bash
python -m venv .venv
pip install -r requirements.txt
cd backend
python main.py
```

Frontend (React):

```bash
cd frontend
npm install
npm run dev
```

---


