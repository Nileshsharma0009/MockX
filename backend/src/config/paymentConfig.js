const requiredValue = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured.`);
  return value;
};

export const getPaymentProductConfig = () => {
  const id = requiredValue("PAYMENT_PRODUCT_ID");
  const name = requiredValue("PAYMENT_PRODUCT_NAME");
  const legacyPriceKey = `PRICE_${id.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase()}`;
  const priceText = process.env.PAYMENT_PRODUCT_PRICE?.trim() || process.env[legacyPriceKey]?.trim();
  if (!priceText) {
    throw new Error(`PAYMENT_PRODUCT_PRICE or ${legacyPriceKey} must be configured.`);
  }
  const currency = requiredValue("PAYMENT_CURRENCY").toUpperCase();
  const price = Number(priceText);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("PAYMENT_PRODUCT_PRICE must be a positive number.");
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("PAYMENT_CURRENCY must be a three-letter ISO currency code.");
  }

  return { id, name, price, currency };
};
