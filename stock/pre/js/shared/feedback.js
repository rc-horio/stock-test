export function flashElement(el) {
  if (!el) return;
  el.classList.add("flashAdd");
  setTimeout(() => el.classList.remove("flashAdd"), 600);
}
