const button = document.querySelector<HTMLButtonElement>("#audit");
const frame = document.querySelector<HTMLIFrameElement>("#app");
const result = document.querySelector<HTMLPreElement>("#result");
const viewport = document.querySelector<HTMLSelectElement>("#viewport");
if (!button || !frame || !result || !viewport)
  throw new Error("Missing harness controls.");
viewport.addEventListener("change", () => {
  frame.style.width = viewport.value === "mobile" ? "390px" : "100%";
  frame.style.maxWidth = "100%";
});
button.addEventListener("click", () => {
  result.textContent = "Running axe…";
  frame.contentWindow?.postMessage("planora:run-a11y", window.location.origin);
});
window.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (
    event.origin !== window.location.origin ||
    event.source !== frame.contentWindow ||
    !event.data ||
    typeof event.data !== "object" ||
    !("type" in event.data) ||
    event.data.type !== "planora:a11y-result"
  )
    return;
  result.textContent = JSON.stringify(event.data, null, 2);
});
