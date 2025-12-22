import { formatCurrency } from "./utils.js";

export function createRecipeSlice() {
  return {
    savedRecipes: [],
    recipe: [],
    currentRecipeName: "",
    portionCount: 1,
    showRecipeList: false,

    // --- Actions ---
    loadSavedRecipes() {
      const savedRecs = localStorage.getItem("bakery_saved_recipes");
      if (savedRecs) {
        this.savedRecipes = JSON.parse(savedRecs);
      }
    },

    addToRecipe(item) {
      this.recipe.push({ ...item, quantity: 0 });
      this.cancelSearch();
      this.$nextTick(() => {
        this.openNumpad(this.recipe.length - 1);
      });
    },

    removeRow(index) {
      this.recipe.splice(index, 1);
    },

    saveRecipe() {
      if (this.recipe.length === 0)
        return this.showToast("Nelze uložit prázdný recept.");
      if (!this.currentRecipeName)
        return this.showToast("Zadejte název receptu.");

      const newRecipe = {
        id: Date.now(),
        name: this.currentRecipeName,
        items: JSON.parse(JSON.stringify(this.recipe)),
        portionCount: this.portionCount,
      };

      this.savedRecipes.push(newRecipe);
      localStorage.setItem(
        "bakery_saved_recipes",
        JSON.stringify(this.savedRecipes)
      );
      this.showToast("Recept uložen!");
    },

    loadRecipe(savedItem) {
      if (this.recipe.length > 0 && !confirm("Přepsat aktuální recept?"))
        return;

      let loadedItems = JSON.parse(JSON.stringify(savedItem.items));
      loadedItems = loadedItems.map((recipeItem) => {
        const masterItem = this.ingredients.find((i) => i.id === recipeItem.id);
        if (masterItem) {
          recipeItem.price_per_unit = masterItem.price_per_unit;
          recipeItem.package_price = masterItem.package_price;
        }
        return recipeItem;
      });

      this.recipe = loadedItems;
      this.currentRecipeName = savedItem.name;
      this.portionCount = savedItem.portionCount || 1;
      this.showRecipeList = false;
      this.showToast("Recept načten");
      this.cancelSearch();
    },

    deleteRecipe(index) {
      if (!confirm("Opravdu smazat?")) return;
      this.savedRecipes.splice(index, 1);
      localStorage.setItem(
        "bakery_saved_recipes",
        JSON.stringify(this.savedRecipes)
      );
      this.showToast("Recept smazán");
    },

    // --- Computed ---
    // CHANGED: Removed 'get' keywords
    totalBatchCost() {
      return this.recipe.reduce(
        (sum, item) => sum + item.quantity * item.price_per_unit,
        0
      );
    },

    pricePerPortion() {
      return this.portionCount > 0
        ? this.totalBatchCost() / this.portionCount
        : 0;
    },
  };
}