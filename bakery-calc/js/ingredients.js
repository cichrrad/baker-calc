import { getNumericSize, formatCurrency } from "./utils.js";

export function createIngredientSlice() {
  return {
    ingredients: [],
    searchOpen: false,
    searchQuery: "",
    managerSearch: "",
    results: [],
    fuse: null,

    // New Ingredient Form State
    newIngredientModalOpen: false,
    newIngredientMode: "manual",
    newIngredientForm: {
      name: "",
      price: "",
      size: "",
      unit: "g",
      url: "",
      rohlik_id: null,
    },

    // --- Actions ---
    async loadIngredients() {
      try {
        const savedData = localStorage.getItem("bakery_ingredients");
        if (savedData) {
          this.ingredients = JSON.parse(savedData);
        } else {
          await this.fetchIngredientsSource();
        }
        this.initFuse();
      } catch (error) {
        console.error("Error loading ingredients:", error);
        this.showToast("Chyba při načítání surovin");
      }
    },

    async fetchIngredientsSource() {
      const response = await fetch("./ingredients.json");
      this.ingredients = await response.json();
    },

    async resetToDefaults() {
      if (!confirm("Opravdu obnovit ceny ze serveru?")) return;
      localStorage.removeItem("bakery_ingredients");
      await this.fetchIngredientsSource();
      this.initFuse();
      this.showToast("Ceny obnoveny");
    },

    // --- Search Logic ---
    initFuse() {
      const options = { keys: ["name", "search_term"], threshold: 0.3 };
      this.fuse = new Fuse(this.ingredients, options);
    },

    startSearch() {
      this.searchOpen = true;
      this.searchQuery = "";
      this.results = [];
      this.$nextTick(() => this.$refs.searchInput?.focus());
    },

    performSearch() {
      if (!this.searchQuery) {
        this.results = [];
        return;
      }
      this.results = this.fuse.search(this.searchQuery);
    },

    selectTopResult() {
      if (this.results.length > 0) {
        this.addToRecipe(this.results[0].item);
      }
    },

    cancelSearch() {
      this.searchOpen = false;
      this.searchQuery = "";
      this.results = [];
    },

    // --- Computed / Helpers ---
    filteredIngredients() {
      if (!this.managerSearch) return this.ingredients;
      return this.ingredients.filter((i) =>
        i.name.toLowerCase().includes(this.managerSearch.toLowerCase())
      );
    },

    getBenchmarkPrice(item) {
      const size = getNumericSize(item);
      const price = parseFloat(item.package_price) || 0;
      if (!size || !price) return "---";

      if (item.unit === "ks") {
        return formatCurrency(price / size) + " / ks";
      }
      const pricePerUnit = price / size;
      return formatCurrency(pricePerUnit * 100) + " / 100" + item.unit;
    },

    // --- New Ingredient Logic ---
    openNewIngredientModal() {
      this.newIngredientForm = {
        name: "",
        price: "",
        size: "",
        unit: "g",
        url: "",
        rohlik_id: null,
      };
      this.newIngredientMode = "manual";
      this.newIngredientModalOpen = true;
    },

    switchNewIngredientMode(mode) {
      this.newIngredientMode = mode;
    },

    async handleRohlikPaste(event) {
      await this.$nextTick();
      const url = this.newIngredientForm.url;
      const idMatch = url.match(/(\d{6,})/);
      if (!idMatch) return;
      this.showToast("ID nalezeno: " + idMatch[1]);
    },

    saveNewIngredient() {
      const price = parseFloat(this.newIngredientForm.price);

      const newItem = {
        id: "temp_" + Date.now(),
        category: "Vlastní",
        name: this.newIngredientForm.name,
        unit: this.newIngredientForm.unit,
        source: this.newIngredientMode === "rohlik" ? "rohlik" : "manual",
        package_price: price,
        package_size: this.newIngredientForm.size + this.newIngredientForm.unit,
        price_per_unit: 0,
        auto_price: null,
      };

      const sizeVal = parseFloat(this.newIngredientForm.size);
      if (sizeVal > 0) newItem.price_per_unit = newItem.package_price / sizeVal;

      this.ingredients.push(newItem);
      localStorage.setItem(
        "bakery_ingredients",
        JSON.stringify(this.ingredients)
      );
      this.initFuse();
      this.newIngredientModalOpen = false;
      this.showToast("Surovina uložena!");
    },

    updateItemDetails(item, field, value) {
      if (field === "package_size_val") {
        const currentUnit =
          item.package_size.replace(/[0-9.]/g, "") || item.unit;
        item.package_size = value + currentUnit;
      } else if (field === "unit") {
        const currentVal = parseFloat(item.package_size) || 0;
        item.unit = value;
        item.package_size = currentVal + value;
      } else {
        item[field] = value;
      }

      const sizeVal = parseFloat(item.package_size) || 1;
      item.price_per_unit = item.package_price / sizeVal;

      localStorage.setItem(
        "bakery_ingredients",
        JSON.stringify(this.ingredients)
      );
      this.initFuse();
    },

    downloadJson() {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(this.ingredients, null, 2));
      const el = document.createElement("a");
      el.setAttribute("href", dataStr);
      el.setAttribute("download", "ingredients_updated.json");
      document.body.appendChild(el);
      el.click();
      el.remove();
    },
  };
}
