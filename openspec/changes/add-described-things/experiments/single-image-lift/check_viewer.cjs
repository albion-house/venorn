// Pin the described things to the skull in the viewer and read pictures from the canvas.
//
// Needs the asset set that add_to_assets.py changed, the client served, and
// Playwright with Google Chrome. Playwright is not a client dependency, so
// NODE_PATH points at a node_modules directory that has it:
//
//   NODE_PATH=/path/to/node_modules node check_viewer.cjs http://localhost:5204/ OUT_DIR

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const [url = "http://localhost:5204/", out = "."] = process.argv.slice(2);

async function readCanvas(page, file) {
  const data = await page.evaluate(() => {
    window.venorn.draw(performance.now() / 1000);
    return document.querySelector("#scene").toDataURL("image/png");
  });
  fs.writeFileSync(path.join(out, file), Buffer.from(data.split(",")[1], "base64"));
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("response", (response) => {
    if (response.status() >= 400) console.log(`${response.status()} ${response.url()}`);
  });
  page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
  await page.goto(url);
  await page.waitForFunction(() => window.venorn?.structure, null, { timeout: 120000 });
  await page.evaluate(() => {
    window.venorn.hold(true);
    window.venorn.frontView();
    window.venorn.draw(1);
  });

  const dock = await page.$$eval("#dock button", (buttons) => buttons.map((button) => button.title));
  console.log(`dock: ${dock.join(", ")}`);

  // Spots where the painting has a thing, nearest first to the largest painted butterfly, on the screen.
  const spots = await page.evaluate(() => {
    const { manifest, structure, camera } = window.venorn;
    const size = structure.scale.x;
    const Vector3 = camera.position.constructor;
    const butterflies = manifest.arrangement.filter((entry) => entry.kind === "butterfly");
    const middle = butterflies.sort((a, b) => b.size - a.size)[0];
    return manifest.arrangement
      .map((spot) => ({ spot, away: Math.hypot(spot.x - middle.x, spot.y - middle.y) }))
      .sort((a, b) => a.away - b.away)
      .map(({ spot }) => {
        const at = new Vector3(spot.x * size, spot.y * size, manifest.structure.thickness * size * 0.6).project(camera);
        return { x: ((at.x + 1) / 2) * innerWidth, y: ((1 - at.y) / 2) * innerHeight };
      });
  });

  await page.keyboard.press("6");
  const chosen = await page.evaluate(() => window.venorn.state().category);
  console.log(`key 6 chose category ${chosen}`);
  const variations = await page.evaluate(() => window.venorn.manifest.kinds.at(-1).models.length);
  // Every other spot, so the things do not overlap. A click that misses the skull places nothing.
  let next = 0;
  for (let index = 0; index < variations; index += 1) {
    const before = await page.evaluate(() => window.venorn.placed.length);
    while (next < spots.length) {
      await page.keyboard.press("Escape");
      await page.evaluate((at) => window.venorn.chooseVariation(at), index);
      await page.mouse.click(spots[next].x, spots[next].y);
      next += 2;
      if ((await page.evaluate(() => window.venorn.placed.length)) > before) break;
    }
  }
  await page.keyboard.press("Escape");
  const placed = await page.evaluate(() => window.venorn.placed.map((entry) => entry.thing.criteria.id));
  console.log(`placed: ${placed.join(", ")}`);

  for (let frame = 0; frame < 30; frame += 1) await page.evaluate(() => window.venorn.draw(performance.now() / 1000));
  await readCanvas(page, "viewer-front.png");
  await page.screenshot({ path: path.join(out, "viewer-dock.png") });

  // Closer, and turned a little, so the relief of each thing shows.
  await page.evaluate(() => {
    const { camera, controls, placed } = window.venorn;
    const middle = placed[0].thing.point.clone();
    for (const entry of placed.slice(1)) middle.add(entry.thing.point);
    middle.divideScalar(placed.length);
    controls.target.copy(middle);
    camera.position.sub(middle).multiplyScalar(0.3).add(middle);
    camera.position.x += 0.5;
    camera.position.y += 0.3;
    controls.update();
  });
  for (let frame = 0; frame < 10; frame += 1) await page.evaluate(() => window.venorn.draw(performance.now() / 1000));
  await readCanvas(page, "viewer-close.png");
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
