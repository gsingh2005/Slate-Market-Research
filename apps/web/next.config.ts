import type { NextConfig } from "next";
const isPagesBuild = process.env.GITHUB_PAGES === "true";
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isPagesBuild ? "/Slate-Market-Research" : "",
  images: { unoptimized: true },
};
export default config;
