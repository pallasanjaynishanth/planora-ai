import "../src/main";
import axe from "axe-core";
window.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (
    event.origin !== window.location.origin ||
    event.source !== window.parent ||
    event.data !== "planora:run-a11y"
  )
    return;
  void axe
    .run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    })
    .then((report) => {
      window.parent.postMessage(
        {
          type: "planora:a11y-result",
          report: {
            engine: `axe-core ${axe.version}`,
            testedAt: new Date().toISOString(),
            viewportWidth: window.innerWidth,
            heading: document.querySelector("h1")?.textContent,
            section:
              document.querySelector('[aria-current="page"]')?.textContent ??
              "Landing or form",
            horizontalOverflow:
              document.documentElement.scrollWidth > window.innerWidth,
            violations: report.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
              })),
            })),
            passedRules: report.passes.length,
            incompleteRules: report.incomplete.length,
          },
        },
        window.location.origin,
      );
    })
    .catch((error: unknown) =>
      window.parent.postMessage(
        {
          type: "planora:a11y-result",
          error: error instanceof Error ? error.message : "Audit failed",
        },
        window.location.origin,
      ),
    );
});
