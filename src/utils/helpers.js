// --- HELPER FUNCTION to generate a unique device fingerprint ---
export const generateDeviceFingerprint = async () => {
  const components = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: new Date().getTimezoneOffset(),
    platform: navigator.platform,
  };
  const json = JSON.stringify(components);
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(json),
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

export const classNames = (...classes) => classes.filter(Boolean).join(" ");
