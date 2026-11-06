import { transform } from "@svgr/core";
import jsx from "@svgr/plugin-jsx";
import { transformAsync } from "@babel/core";
import transformReactJsx from "@babel/plugin-transform-react-jsx";

// Keep SVG component imports without the unpatched deepmerge dependency in
// @svgr/webpack's optional SVGO configuration chain. Preserve SVG geometry/IDs.
export default function svgLoader(source) {
  this.cacheable?.();
  const callback = this.async();
  const options = this.getOptions();

  transform(String(source), { ...options, plugins: [jsx] }, {
    filePath: this.resourcePath,
  })
    .then((code) => transformAsync(code, {
      filename: this.resourcePath,
      babelrc: false,
      configFile: false,
      plugins: [transformReactJsx],
    }))
    .then((result) => {
      if (!result?.code) throw new Error("Unable to compile SVG component");
      callback(null, result.code);
    })
    .catch((error) => callback(error));
}
