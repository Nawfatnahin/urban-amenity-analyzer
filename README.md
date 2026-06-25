# Urban Amenity Analyzer

A powerful spatial analysis web application designed to calculate and visualize walkability metrics and urban accessibility. Built to empower urban planners, researchers, and citizens with data-driven insights into neighborhood infrastructure.

This project was developed with the assistance of advanced artificial intelligence technologies to enhance efficiency, innovation and overall development quality.

**🌍 Live Website:** - https://urban-amenity-analyzer.scholar-atlas.workers.dev/

![Urban Amenity Analyzer](https://raw.githubusercontent.com/Nawfatnahin/urban-amenity-analyzer/main/public/images/urban_about_bg.png)

## 🌟 Overview

Great neighborhoods changing the world deserve a metric as powerful as what they've built. Most cities we analyze have hidden walkability potential. The **Urban Amenity Analyzer** allows you to search any neighborhood globally and generate an instant, comprehensive walkability report covering critical infrastructure: schools, healthcare, transit, groceries, parks, and pharmacies.

## 🚀 Key Features

* **Real-time Spatial Analysis:** Instant amenity scoring using live OpenStreetMap (OSM) data.
* **Interactive Radius Control:** Adjust your analysis radius (10-minute, 15-minute, 20-minute walk sheds) and watch accessibility scores recalculate.
* **Dynamic Distance Decay Scoring:** Advanced scoring algorithm applying a linear decay model prioritizing closer amenities.
* **Modern Web Interface:** Built with Next.js and MapLibre GL for smooth, responsive, and beautiful data visualization.
* **Global Support:** Search anywhere in the world with automatic English label translations for international accessibility.

## 🛠️ Technology Stack & Architecture

This project is built using modern web technologies and public geographic APIs. **Security Note: The application is entirely client-side and open-source. It does not require any private API keys, secure database credentials, or paid services to run.**

* **Frontend Framework:** **Next.js 15** (React) configured for static export, ensuring blazing-fast load times on GitHub Pages.
* **Styling & UI:** **Tailwind CSS** for modern, responsive glassmorphism styling, paired with **Framer Motion** for smooth UI transitions and micro-animations.
* **Geospatial Visualization:** **MapLibre GL JS** and `react-map-gl` render the high-performance WebGL interactive map.
* **Map Basemaps:** Uses **CartoDB Dark Matter** tiles for a sleek aesthetic that makes data pop, with english labels enforced globally.
* **Spatial Analysis Engine:** **Turf.js** handles complex geographic calculations, dynamic radius bounding boxes, and distance modeling directly in the browser.
* **Live Amenity Data:** Queries the public **Overpass API (OpenStreetMap)** to fetch real-time, global locations of schools, hospitals, transit stops, and parks.
* **State Management:** **React Query (TanStack Query)** manages the asynchronous Overpass API calls, handling caching, error states, and loading overlays seamlessly.

## 🚦 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗺️ Methodology

The app utilizes a specialized methodology to calculate walkability scores:
1. **Network Distance Proxy:** We use a dynamic friction coefficient applied to straight-line distances to approximate true walking paths.
2. **Scoring Model:** We employ a distance-based linear decay function where closer amenities contribute significantly more points than distant ones.
3. **Thresholding:** Points are capped within categories to ensure a balanced score, preventing an overabundance of one amenity (e.g., cafes) from masking a lack of another (e.g., healthcare).

---

