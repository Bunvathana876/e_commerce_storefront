import assert from "node:assert/strict";
import { it } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import svgLoader from "../../../scripts/svg-loader.mjs";

function compile(source) {
  return new Promise((resolve, reject) => {
    svgLoader.call({
      resourcePath: "/fixtures/blue-panda.svg",
      cacheable() {},
      getOptions: () => ({}),
      async: () => (error, code) => error ? reject(error) : resolve(code),
    }, source);
  });
}

it("SVG imports render as React components with geometry, IDs, and passed props", async () => {
  const code = await compile('<svg viewBox="0 0 24 24"><defs><linearGradient id="panda"/></defs><path d="M0 0h24v24H0z" fill="url(#panda)"/></svg>');
  // Resolve the generated React import before loading the isolated ESM fixture.
  const moduleCode = code.replace('"react"', JSON.stringify(import.meta.resolve("react")));
  const { default: Icon } = await import(`data:text/javascript;base64,${Buffer.from(moduleCode).toString("base64")}`);
  const html = renderToStaticMarkup(createElement(Icon, { className: "icon", "aria-label": "Panda" }));
  assert.match(html, /viewBox="0 0 24 24"/);
  assert.match(html, /class="icon"/);
  assert.match(html, /aria-label="Panda"/);
  assert.match(html, /id="panda"/);
  assert.match(html, /fill="url\(#panda\)"/);
  assert.match(html, /d="M0 0h24v24H0z"/);
});

it("invalid SVG fails compilation instead of producing a broken component", async () => {
  await assert.rejects(compile("<svg><path></svg>"));
});

it("Webpack loads the ESM SVG loader and bundles an SVG component import", async () => {
  const require = createRequire(import.meta.url);
  const { webpack } = require("next/dist/compiled/webpack/webpack");
  const directory = await mkdtemp(join(tmpdir(), "blue-panda-svg-"));
  try {
    await writeFile(join(directory, "icon.svg"), '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>');
    await writeFile(join(directory, "entry.js"), 'export { default } from "./icon.svg";');
    await new Promise((resolve, reject) => {
      const compiler = webpack({
        mode: "production",
        target: "node",
        entry: join(directory, "entry.js"),
        output: { path: directory, filename: "bundle.cjs", library: { type: "commonjs2" } },
        externals: { react: "commonjs react" },
        optimization: { minimize: false },
        module: { rules: [{ test: /\.svg$/i, use: [{ loader: fileURLToPath(new URL("../../../scripts/svg-loader.mjs", import.meta.url)) }] }] },
      });
      compiler.run((error, stats) => {
        compiler.close((closeError) => {
          if (error || closeError) return reject(error || closeError);
          if (stats.hasErrors()) return reject(new Error(stats.toString({ all: false, errors: true })));
          resolve();
        });
      });
    });
    // The bundle lives in a temporary directory; resolve its React external here.
    const { readFile } = await import("node:fs/promises");
    const code = await readFile(join(directory, "bundle.cjs"), "utf8");
    const result = { exports: {} };
    new Function("require", "module", "exports", code)(require, result, result.exports);
    const html = renderToStaticMarkup(createElement(result.exports.default, { "aria-label": "Bundled panda" }));
    assert.match(html, /aria-label="Bundled panda"/);
    assert.match(html, /viewBox="0 0 24 24"/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
