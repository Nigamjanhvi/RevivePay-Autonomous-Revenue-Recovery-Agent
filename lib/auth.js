const MERCHANT_SESSION_KEY = "revivepay_merchant_session";

function safeReadSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(MERCHANT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredMerchant() {
  return safeReadSession();
}

export function signInMerchant({ name, email, password }) {
  const trimmedName = (name || "Merchant").trim() || "Merchant";
  const trimmedEmail = (email || "").trim();
  const trimmedPassword = (password || "").trim();

  if (!trimmedEmail || !trimmedPassword) {
    throw new Error("Merchant email and password are required.");
  }

  const merchant = {
    id: `merchant-${Date.now()}`,
    name: trimmedName,
    email: trimmedEmail,
    password: trimmedPassword,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(MERCHANT_SESSION_KEY, JSON.stringify(merchant));
  }

  return merchant;
}

export function signOutMerchant() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(MERCHANT_SESSION_KEY);
  }
}
