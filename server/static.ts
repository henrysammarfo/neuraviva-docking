import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const root = process.cwd();
  const distPath = path.resolve(root, "public");

  console.log(`[static] Runtime root: ${root}`);
  console.log(`[static] Looking for assets at: ${distPath}`);

  if (fs.existsSync(distPath)) {
    console.log(`[static] Assets found. Serving from ${distPath}`);
    app.use(express.static(distPath));

    // fall through to index.html if the file doesn't exist
    app.use("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    console.warn(`[static] Static directory NOT found at ${distPath}.`);
    // Fallback search
    const fallbackPath = path.resolve(root, "public");
    if (fs.existsSync(fallbackPath)) {
      console.log(`[static] Found fallback assets at ${fallbackPath}`);
      app.use(express.static(fallbackPath));
    }
  }
}

