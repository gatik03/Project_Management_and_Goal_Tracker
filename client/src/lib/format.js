export function localToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
export function daysUntil(value) {
  return Math.ceil(
    (new Date(`${String(value).slice(0, 10)}T23:59:59`).getTime() -
      Date.now()) /
      86400000,
  );
}
export function formatTarget(goal) {
  const target = String(goal.target ?? "").trim();
  const amount = Number(target.replaceAll(",", ""));
  if (!Number.isFinite(amount) || target === "") return target;
  if (goal.uomType === "PERCENTAGE")
    return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(amount)}%`;
  if (goal.uomType === "CURRENCY") {
    if (Math.abs(amount) >= 10000000)
      return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(amount / 10000000)} Cr`;
    if (Math.abs(amount) >= 100000)
      return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(amount / 100000)} L`;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
    amount,
  );
}
