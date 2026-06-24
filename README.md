# Urban Amenity Analyzer

A powerful spatial analysis web application designed to calculate and visualize walkability metrics and urban accessibility. Built to empower urban planners, researchers, and citizens with data-driven insights into neighborhood infrastructure.

![Urban Amenity Analyzer](https://raw.githubusercontent.com/Nawfatnahin/urban-amenity-analyzer/main/public/images/urban_about_bg.png)

## 🌟 Overview

Great neighborhoods changing the world deserve a metric as powerful as what they've built. Most cities we analyze have hidden walkability potential. The **Urban Amenity Analyzer** allows you to search any neighborhood globally and generate an instant, comprehensive walkability report covering critical infrastructure: schools, healthcare, transit, groceries, parks, and pharmacies.

## 🚀 Key Features

* **Real-time Spatial Analysis:** Instant amenity scoring using live OpenStreetMap (OSM) data.
* **Interactive Radius Control:** Adjust your analysis radius (10-minute, 15-minute, 20-minute walk sheds) and watch accessibility scores recalculate.
* **Dynamic Distance Decay Scoring:** Advanced scoring algorithm applying a linear decay model prioritizing closer amenities.
* **Modern Web Interface:** Built with Next.js and MapLibre GL for smooth, responsive, and beautiful data visualization.
* **Global Support:** Search anywhere in the world with automatic English label translations for international accessibility.

## 🛠️ Technology Stack

* **Frontend:** React, Next.js 15, Tailwind CSS
* **Geospatial & Mapping:** MapLibre GL, react-map-gl, Turf.js
* **Data Sources:** Overpass API (OpenStreetMap), CartoDB Basemaps
* **State Management:** React Query (TanStack Query)
* **Animation:** Framer Motion

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

