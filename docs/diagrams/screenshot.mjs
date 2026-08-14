import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = [
  "existing-system-workflow.html",
  "existing-system-actors.html",
  "existing-system-dataflow.html",
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

for (const file of files) {
  const htmlPath = path.join(dir, file);
  const pngPath = htmlPath.replace(".html", ".png");
  await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: pngPath, fullPage: true });
  console.log(`Saved ${pngPath}`);
}

await browser.close();
