import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    // fall through to index.html if the file doesn't exist
    app.use("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    console.warn(`Static directory not found at ${distPath}. Skipping static serving.`);
  }
}

