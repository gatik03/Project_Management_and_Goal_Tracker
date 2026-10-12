import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const blocks = [
  css.match(/:root\s*\{([^}]+)\}/)?.[1],
  css.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/)?.[1],
];
function channels(value) {
  const raw = value.slice(1);
  const hex =
    raw.length === 3 ? [...raw].map((char) => char + char).join("") : raw;
  return [0, 2, 4]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
}
function luminance(value) {
  const [r, g, b] = channels(value);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
for (const [index, block] of blocks.entries()) {
  assert.ok(block, `Theme ${index} exists`);
  const tokens = Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[\da-fA-F]{3,6})\s*;/g)].map(
      ([, name, value]) => [name, value],
    ),
  );
  const theme = index ? "dark" : "light";
  for (const foreground of ["ink", "muted", "signal", "ok", "warn", "danger"])
    for (const background of ["paper", "surface", "sunken"])
      assert.ok(
        ratio(tokens[foreground], tokens[background]) >= 4.5,
        `${theme} ${foreground}/${background} text contrast is ${ratio(tokens[foreground], tokens[background]).toFixed(2)}:1`,
      );
  assert.ok(
    ratio(tokens["signal-ink"], tokens.signal) >= 4.5,
    `${theme} primary button text contrast`,
  );
  assert.ok(
    ratio(tokens.control, tokens.surface) >= 3,
    `${theme} control edge contrast`,
  );
}
console.log(
  "Light and dark text/background pairs meet 4.5:1; control edges meet 3:1.",
);
