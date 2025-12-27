try {
    const { default: app } = await import("../server/app.js");
    export default app;
} catch (error: any) {
    console.error("Critical boot error:", error);
    // Export a minimal error-reporting app for Vercel
    const express = (await import("express")).default;
    const crashApp = express();
    crashApp.all("*", (req, res) => {
        res.status(500).json({
            error: "FUNCTION_BOOT_FAILED",
            message: error.message,
            stack: error.stack,
        });
    });
    export default crashApp;
}
