import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function normalizeSiteUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.origin;
  } catch {
    return "";
  }
}

function siteMetadataPlugin(siteUrl, isBuild) {
  let outputDirectory;
  const publicRoutes = [
    { path: "/", priority: "1.0" },
    { path: "/mock-tests", priority: "0.9" },
    { path: "/result-history", priority: "0.8" },
  ];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...publicRoutes.flatMap(({ path: routePath, priority }) => [
      "  <url>",
      `    <loc>${siteUrl}${routePath}</loc>`,
      `    <priority>${priority}</priority>`,
      "  </url>",
    ]),
    "</urlset>",
    "",
  ].join("\n");
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;

  return {
    name: "mockx-environment-site-metadata",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replaceAll("%VITE_SITE_URL%", siteUrl);
      },
    },
    configResolved(config) {
      outputDirectory = config.build.outDir;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split("?")[0];
        if (requestPath === "/robots.txt") {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(robots);
          return;
        }
        if (requestPath === "/sitemap.xml") {
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          res.end(sitemap);
          return;
        }
        next();
      });
    },
    closeBundle() {
      if (!isBuild) return;
      fs.mkdirSync(outputDirectory, { recursive: true });
      fs.writeFileSync(path.join(outputDirectory, "robots.txt"), robots);
      fs.writeFileSync(path.join(outputDirectory, "sitemap.xml"), sitemap);
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isBuild = command === "build";
  const siteUrl = normalizeSiteUrl(
    env.VITE_SITE_URL || (isBuild ? "" : "http://localhost:5173")
  );

  if (isBuild && !siteUrl) {
    throw new Error("VITE_SITE_URL must be set to the deployed frontend origin for production builds.");
  }

  return {
    plugins: [react(), siteMetadataPlugin(siteUrl, isBuild)],
  };
});