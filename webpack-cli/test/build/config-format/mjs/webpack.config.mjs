import { fileURLToPath } from "url";
import path from "path";

export default {
  mode: "production",
  entry: "./main.js",
  output: {
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "dist"),
    filename: "foo.bundle.js",
  },
};
