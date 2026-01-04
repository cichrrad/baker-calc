![Use_demo](./bakery-calc-demo.gif)

# 🥐 Bakery Cost Estimator (Kalkulačka Nákladů)

A lightweight, local-first Progressive Web App (PWA) for calculating the cost of baking batches.

I built this for internal use to track production costs for cakes and desserts. It's designed to be simple, fast, and completely offline-capable. It doesn't require a backend server, a database, or a complex build step.

If you find it useful, feel free to use it or fork it.

## ✨ Features

* **Batch Calculator:** Calculate the total cost of a batch and price per portion.
* **Ingredient Database ("Sklad"):** Manage ingredient prices. Supports unit conversions (g, ml, ks).
* **Offline First:** Works fully offline via Service Worker. User data is persisted in `localStorage`.
* **Price Scraper:** Includes a Ruby script to update base ingredient prices from **Rohlik.cz** (Czech online grocery).
* **No-Build Stack:** Built with standard ES Modules. No Webpack, Vite, or node_modules required.

## 🛠 Tech Stack

* **Frontend:** [Alpine.js](https://alpinejs.dev/) (Logic), [Tailwind CSS](https://tailwindcss.com/) (Styling via CDN), [Fuse.js](https://fusejs.io/) (Fuzzy Search).
* **Data:** Static JSON file (`ingredients.json`) for base prices + Browser `localStorage` for user recipes.
* **Automation:** Ruby script for fetching live prices.

## 📂 Project Structure

The project was recently refactored from a single file into ES Modules for maintainability:

```text
/root
  ├── css/
  │    └── style.css       # Custom behavioral styles (animations, resets)
  ├── js/
  │    ├── app.js          # Main entry point, state management, and glue code
  │    ├── ingredients.js  # Inventory logic (Search, Edit, Add)
  │    ├── recipes.js      # Calculator logic (Batches, Saved Recipes)
  │    └── utils.js        # Formatting helpers
  ├── price_update.rb      # Ruby script to scrape/update base prices
  ├── ingredients.json     # The "Database" of base ingredients
  ├── index.html           # Main HTML structure
  └── sw.js                # Service Worker for offline support

```

## 🚀 How to Run

Because this app uses ES Modules (`<script type="module">`), you cannot simply open `index.html` from your file system (CORS errors will occur). You must serve it locally.

1. **Clone the repository**
2. **Start a local server.** If you have Python installed:
```bash
python3 -m http.server

```


3. **Open in Browser:** Go to `http://localhost:8000`.

## 🔄 Updating Prices (The "Backend")

The app comes with a `ingredients.json` file that acts as the source of truth for base ingredient prices. I use a Ruby script to keep these prices fresh without manual entry.

### How it works:

1. Ingredients in `ingredients.json` have a `rohlik_id`.
2. The script `price_update.rb` queries the public API for these IDs.
3. It updates `ingredients.json` with the current price and normalizes units (calculates price per gram/ml).

### To run the update:

```bash
ruby price_update.rb

```

*Note: After running this, commit the updated `ingredients.json` to your repo. The Service Worker is configured to prefer the network version of this file so users get new prices immediately.*

## 💾 Data Persistence

* **Base Ingredients:** Loaded from `ingredients.json`.
* **User Data:** Recipes and custom ingredients are saved in your browser's `localStorage`.
* *Warning:* If you clear your browser cache, you will lose your saved recipes. Use the "Download JSON" feature in the Sklad view to backup your custom ingredient data.



## 📄 License

This project is open source. Feel free to use it, modify it, or bake with it.

---

*Disclaimer: This tool includes a scraper for Rohlik.cz. It is intended for personal/internal use. API endpoints may change at any time.*
