export const formatDate = (date) => {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-CA");
}; // YYYY-MM-DD

export const formatDateTime = (timestamp) => {
  if (!timestamp) return "N/A";
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(d.getTime())) return "Invalid Date";
  return d.toLocaleString("id-ID", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const toDateTimeLocalInput = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (num) => (num < 10 ? "0" : "") + num;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatCurrency = (value, currency = "USD") => {
  const locale = currency === "IDR" ? "id-ID" : "en-US";
  const options = {
    style: "currency",
    currency: currency,
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  };
  if (typeof value !== "number" || isNaN(value)) {
    return new Intl.NumberFormat(locale, options).format(0);
  }
  return new Intl.NumberFormat(locale, options).format(value);
};

export const formatLotSize = (value) => {
  if (typeof value !== "number") return "0.00 LOT";
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LOT`;
};

export const formatDurationMs = (diffMs) => {
  if (typeof diffMs !== "number" || isNaN(diffMs) || diffMs <= 0) return "-";
  const diffMins = Math.floor(diffMs / 60000);
  const days = Math.floor(diffMins / 1440);
  const hours = Math.floor((diffMins % 1440) / 60);
  const mins = diffMins % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  
  return parts.join(" ");
};

export const formatDuration = (entryDate, exitDate) => {
  if (!entryDate || !exitDate) return "-";
  const entry = entryDate instanceof Date ? entryDate : new Date(entryDate);
  const exit = exitDate instanceof Date ? exitDate : new Date(exitDate);
  
  if (isNaN(entry.getTime()) || isNaN(exit.getTime())) return "-";
  
  const diffMs = exit.getTime() - entry.getTime();
  if (diffMs <= 0) return "0m";
  
  return formatDurationMs(diffMs);
};
