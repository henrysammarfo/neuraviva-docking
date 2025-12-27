import app from "../server/index";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";
import { serveStatic } from "../server/static";

const httpServer = createServer(app);

// Initialize routes and static serving for Vercel
(async () => {
    await registerRoutes(httpServer, app);
    serveStatic(app);
})();

export default app;
