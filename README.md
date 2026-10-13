# UniPlanner — Academic Planner 🎓

> Modern, responsive, offline-first university academic planner and GPA forecasting application.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vite.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-success.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## 🌟 Key Features

- **📚 Course Management:**
  - Track semester courses, course codes, credit hours, instructors, and status.
  - Configurable course-specific grading category weights (Quizzes, Midterms, Assignments, Finals).

- **📅 Assessment & Deadline Tracking:**
  - Categorized tasks with due dates, maximum marks, and obtained scores.
  - Automatic deadline proximity indicators and completion tracking.

- **📊 Comprehensive Results Analysis:**
  - Real-time mark calculation, category breakdowns, and performance summaries.
  - Category milestone achievements and grade ladders.

- **🎯 Target GPA Forecasting & Calculator:**
  - Semester GPA simulation with credit-hour weighted calculations.
  - Forecasting required final examination scores to achieve targeted course letter grades.

- **⚙️ Flexible Academic Grading Scales:**
  - Standard Bangladesh UGC 4.0 grading system pre-configured.
  - US 4.0 standard grading and full custom boundary configuration support.

- **📴 100% Offline-First PWA:**
  - Installable in 1-click on **Android**, **iOS (Add to Home Screen)**, and **Windows/Mac Desktop**.
  - Service Worker precaching provides complete offline functionality.

- **🔒 Privacy & Device Storage:**
  - All data is safely stored in local browser storage (`localStorage`).
  - One-click JSON backup export and secure restore anytime.

- **📱 Fully Responsive Design:**
  - Optimized for mobile phones with thumb-friendly navigation bar, floating action buttons, and touch-scrolling modals.

---

## 🛠️ Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Bundler:** Vite
- **Icons:** Lucide React
- **Linter:** Oxlint
- **PWA:** Service Worker + Web App Manifest

---

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ekraislam/uniplanner.git

# 2. Navigate to project directory
cd uniplanner

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📦 Production Build & Testing

```bash
# Run linter
npm run lint

# Build production bundle (tsc + vite build)
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Deployment

UniPlanner is ready for instant deployment on any modern hosting provider:

### Vercel
1. Import repository from GitHub.
2. Build Command: `npm run build`
3. Output Directory: `dist`

### Netlify
1. Connect repository.
2. Build command: `npm run build`
3. Publish directory: `dist`

### Cloudflare Pages
1. Select repository.
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).  
Copyright (c) 2026 **Ekra Islam Ohi**.
