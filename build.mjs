import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { minify } from "terser";

const src = readFileSync("src/index.html", "utf8");
const LIMIT = 3072;

let out = "";

for (const part of src.split(/(<script>[\s\S]*?<\/script>|<style>[\s\S]*?<\/style>)/)) {

  if (part.startsWith("<script>")) {
    const js = part.slice(8, -9);

    const { code } = await minify(js, {
      toplevel: true,
      compress: { passes: 3 }
    });

    out += "<script>" + code + "</script>";

  } else if (part.startsWith("<style>")) {

    out += part
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{};:,>])\s*/g, "$1")
      .replace(/;}/g, "}");

  } else {

    out += part
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\s+/g, " ")
      .replace(/>\s+</g, "><")
      .trim();
  }
}

const uri =
  "data:text/html," +
  out.replace(/%/g, "%25")
     .replace(/#/g, "%23")
     .replace(/\n/g, "%0A");

mkdirSync("dist", { recursive: true });

writeFileSync("dist/index.html", out);
writeFileSync("dist/uri.txt", uri);

const size = Buffer.byteLength(uri);

console.log(
  `${size} / ${LIMIT} bytes — ` +
  (size <= LIMIT
    ? `${LIMIT - size} left`
    : `${size - LIMIT} over`)
);