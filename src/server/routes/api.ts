import express from "express";
import { readJSON } from "../services/db.js";

const router = express.Router();
import authRoutes from "./auth.js";
import serverRoutes from "./servers.js";
import systemRoutes from "./system.js";
import nodeRoutes from "./nodes.js";

router.use("/auth", authRoutes);
router.use("/servers", serverRoutes);
router.use("/system", systemRoutes);
router.use("/nodes", nodeRoutes);

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    panel: "SpaceMC Panel",
    version: "1.0.0",
    timestamp: Date.now(),
    nodeEnv: process.env.NODE_ENV || "development"
  });
});

router.get("/settings", async (req, res) => {
  const settings = await readJSON("settings.json") || {};
  res.json({ 
    version: "1.0.0",
    panelName: settings.panelName || "SpaceMC Panel",
    panelLogo: settings.panelLogo || "",
    panelBackgroundImage: settings.panelBackgroundImage || "",
    panelBackgroundBlur: settings.panelBackgroundBlur !== undefined ? settings.panelBackgroundBlur : 10,
    enablePlayit: settings.enablePlayit !== undefined ? settings.enablePlayit : false,
    enableTutorial: settings.enableTutorial !== undefined ? settings.enableTutorial : true,
    enableLoginAnimation: settings.enableLoginAnimation !== undefined ? settings.enableLoginAnimation : true,
    enableRegistration: settings.enableRegistration !== undefined ? settings.enableRegistration : true,
    theme: settings.theme || "green",
    enableGoogleLogin: settings.enableGoogleLogin !== undefined ? settings.enableGoogleLogin : false,
    firebaseApiKey: settings.firebaseApiKey || "",
    firebaseAuthDomain: settings.firebaseAuthDomain || "",
    firebaseProjectId: settings.firebaseProjectId || "",
    firebaseStorageBucket: settings.firebaseStorageBucket || "",
    firebaseMessagingSenderId: settings.firebaseMessagingSenderId || "",
    firebaseAppId: settings.firebaseAppId || "",
    defaultRuntime: settings.defaultRuntime || process.env.DEFAULT_RUNTIME || "docker",
    isDevPanel: false,
    panelPort: process.env.PORT || "6969"
  });
});

export default router;

