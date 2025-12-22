export function formatCurrency(value) {
  if (isNaN(value)) return "0,00 Kč";
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
  }).format(value);
}

export function getNumericSize(item) {
  return parseFloat(item.package_size) || 0;
}
