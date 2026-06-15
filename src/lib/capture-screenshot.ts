/** html2canvas cannot parse Tailwind v4 lab()/oklch() colors — strip stylesheets on clone */
const LAYOUT_PROPS = [
  "display",
  "flexDirection",
  "flexWrap",
  "alignItems",
  "justifyContent",
  "alignSelf",
  "gap",
  "gridTemplateColumns",
  "gridTemplateRows",
  "gridColumn",
  "gridRow",
  "width",
  "maxWidth",
  "minWidth",
  "height",
  "minHeight",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "textAlign",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "color",
  "background",
  "backgroundColor",
  "border",
  "borderRadius",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "boxSizing",
  "overflow",
  "verticalAlign",
] as const;

function inlineComputedStyles(source: HTMLElement, target: HTMLElement) {
  const computed = window.getComputedStyle(source);
  for (const prop of LAYOUT_PROPS) {
    const value = computed[prop];
    if (value) {
      target.style.setProperty(
        prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
        value
      );
    }
  }
}

function cloneWithInlineStyles(source: HTMLElement, target: HTMLElement) {
  inlineComputedStyles(source, target);
  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  for (let i = 0; i < sourceChildren.length; i++) {
    const srcChild = sourceChildren[i];
    const tgtChild = targetChildren[i];
    if (srcChild instanceof HTMLElement && tgtChild instanceof HTMLElement) {
      cloneWithInlineStyles(srcChild, tgtChild);
    }
  }
}

export async function captureElementToCanvas(element: HTMLElement, scale = 2) {
  const html2canvas = (await import("html2canvas")).default;

  return html2canvas(element, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
        node.remove();
      });
      const root = clonedDoc.body.querySelector("[data-ticket-export]") as HTMLElement | null;
      const sourceRoot = element.closest("[data-ticket-export]") ?? element;
      if (root && sourceRoot instanceof HTMLElement) {
        root.style.background = "#ffffff";
        root.style.color = "#0f172a";
        root.style.fontFamily = "system-ui, -apple-system, sans-serif";
        root.style.width = `${sourceRoot.offsetWidth}px`;
        cloneWithInlineStyles(sourceRoot, root);
      }
    },
  });
}
