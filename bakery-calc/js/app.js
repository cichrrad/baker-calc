import { createIngredientSlice } from './ingredients.js';
import { createRecipeSlice } from './recipes.js';
import { formatCurrency } from './utils.js';

// 1. Define the main function logic
function bakeryApp() {
  return {
    view: "calculator",
    darkMode: false,
    toastVisible: false,
    toastMessage: "",
    toastTimeout: null,
    numpadOpen: false,
    numpadValue: "",
    activeRowIndex: null,

    ...createIngredientSlice(),
    ...createRecipeSlice(),

    async initApp() {
      // Wake Lock
      if ("wakeLock" in navigator) {
        try { await navigator.wakeLock.request("screen"); } catch (e) {}
      }

      // Load Theme
      const savedTheme = localStorage.getItem("bakery_theme");
      if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        this.darkMode = true;
        document.documentElement.classList.add("dark");
      }

      await this.loadIngredients();
      this.loadSavedRecipes();
    },

    toggleTheme() {
      this.darkMode = !this.darkMode;
      localStorage.setItem("bakery_theme", this.darkMode ? "dark" : "light");
      document.documentElement.classList.toggle("dark", this.darkMode);
    },

    showToast(message) {
      this.toastMessage = message;
      this.toastVisible = true;
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => { this.toastVisible = false; }, 3000);
    },

    formatCurrency(val) { return formatCurrency(val); },

    openNumpad(index) {
        this.activeRowIndex = index;
        const currentVal = this.recipe[index].quantity;
        this.numpadValue = currentVal === 0 ? "" : String(currentVal);
        this.numpadOpen = true;
    },
    numpadPress(key) {
        if (key === ".") {
            if (this.numpadValue.includes(".") || this.numpadValue.includes(",")) return;
            if (this.numpadValue === "") { this.numpadValue = "0."; return; }
        }
        this.numpadValue += key;
    },
    numpadDelete() {
        this.numpadValue = this.numpadValue.slice(0, -1);
    },
    numpadConfirm() {
        if (this.activeRowIndex !== null) {
            this.recipe[this.activeRowIndex].quantity = parseFloat(this.numpadValue) || 0;
        }
        this.numpadOpen = false;
        this.activeRowIndex = null;
    }
  };
}

window.bakeryApp = bakeryApp;

document.addEventListener('alpine:init', () => {
    Alpine.data('bakeryApp', bakeryApp);
});