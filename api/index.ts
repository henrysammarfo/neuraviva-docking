import express from "express";

let app: any;

try {
    // Attempt to import the actual app
    const module = await import("../server/app.js");
    app = module.default;
} catch (error: any) {
    console.error("Critical boot error:", error);

    // Create a fall-back diagnostic app
    app = express();
    app.all("*", (req: express.Request, res: express.Response) => {
        res.status(500).json({
            error: "FUNCTION_BOOT_FAILED",
            message: error.message,
            stack: error.stack,
        });
    });
}

export default app;
