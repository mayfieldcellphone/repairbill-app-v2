import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize Firebase Admin
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  if (!admin.apps.length) {
    const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId
      });
      console.log("[Firebase] Initialized with Service Account JSON key.");
    } else {
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log("[Firebase] Initialized with Application Default Credentials.");
    }
  }

  const db = admin.firestore();

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "RepairBill Web Integration" });
  });

  /**
   * Universal Web Integration Endpoint
   * Used for Quote requests, Bookings, and Contact forms from external websites.
   */
  app.post("/api/web-integration/leads", async (req, res) => {
    // Extract API Key from Authorization header (Bearer token)
    let apiKey = req.headers["authorization"]?.replace("Bearer ", "");
    
    // Fallback to query param for simpler integrations if needed
    if (!apiKey) {
      apiKey = req.query.apiKey as string;
    }

    if (!apiKey) {
      return res.status(401).json({ 
        error: "Missing API Key", 
        message: "Please include your API key in the Authorization header as 'Bearer YOUR_KEY' or as a query parameter 'apiKey=YOUR_KEY'." 
      });
    }

    try {
      // Find user by API Key
      // Note: We use the Enterprise database ID if provided
      const usersRef = db.collection("users");
      const userSnapshot = await usersRef.where("apiKey", "==", apiKey).limit(1).get();
      
      if (userSnapshot.empty) {
        return res.status(401).json({ error: "Invalid API Key" });
      }

      const userDoc = userSnapshot.docs[0];
      const uid = userDoc.id;
      const userData = userDoc.data();

      const { customerName, customerEmail, customerPhone, message, type, metadata } = req.body;

      // Basic validation
      if (!customerName || !message) {
        return res.status(400).json({ error: "Missing required fields: customerName and message are required." });
      }

      // Create the lead ID
      const leadId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const newLead = {
        id: leadId,
        customerName,
        customerEmail: customerEmail || "no-email@provided.com",
        customerPhone: customerPhone || "",
        message,
        type: type || "contact", // contact, quote, booking, corporate
        status: "new",
        createdAt: new Date().toISOString(),
        metadata: {
          source: req.headers["referer"] || "External Website",
          integratedVia: "RepairBill Web API",
          ...metadata
        }
      };

      // Save to user's leads collection
      await db.collection("users").doc(uid).collection("leads").doc(leadId).set(newLead);

      console.log(`[API] New lead created for user ${uid}: ${leadId}`);

      res.status(201).json({ 
        success: true, 
        message: "Lead successfully recorded in your RepairBill inbox.",
        leadId 
      });
    } catch (error) {
      console.error("Web Integration API Error:", error);
      res.status(500).json({ error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Lead Intake: POST http://localhost:${PORT}/api/web-integration/leads`);
  });
}

startServer();
