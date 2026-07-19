import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const createInvoiceTool: FunctionDeclaration = {
  name: "createInvoice",
  description: "Create a new invoice or estimate.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerName: { type: Type.STRING, description: "Full name of the customer" },
      customerPhone: { type: Type.STRING, description: "Phone number" },
      customerEmail: { type: Type.STRING, description: "Email address" },
      type: { type: Type.STRING, enum: ["invoice", "estimate"], description: "Invoice or estimate" },
      date: { type: Type.STRING, description: "Date of the invoice in YYYY-MM-DD format. Support backdating if requested (e.g. yesterday, last Tuesday)." },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            brandName: { type: Type.STRING },
            modelName: { type: Type.STRING },
            serviceName: { type: Type.STRING },
            price: { type: Type.NUMBER },
            quantity: { type: Type.NUMBER }
          },
          required: ["serviceName", "price"]
        }
      },
      paymentMethod: { type: Type.STRING, enum: ["Cash", "Card", "Bank Transfer", "Other"] }
    },
    required: ["customerName", "items"]
  }
};

const createExpenseTool: FunctionDeclaration = {
  name: "createExpense",
  description: "Log a new business expense.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: "What was the expense for?" },
      amount: { type: Type.NUMBER, description: "Total amount spent (inclusive of tax)" },
      date: { type: Type.STRING, description: "Date of the expense in YYYY-MM-DD format. Support backdating (e.g. last month, last Monday)." },
      category: { 
        type: Type.STRING, 
        enum: ["Shop Rent", "Ads", "Electricity", "Insurance", "ADT Security", "Phone Orders", "Supplier Payment", "Tools", "Staff", "Marketing", "Other"],
        description: "Category of expense" 
      },
      paymentMethod: { type: Type.STRING, enum: ["Cash", "Card", "Bank Transfer"], description: "How was it paid?" },
      supplier: { type: Type.STRING, description: "Who was the supplier?" }
    },
    required: ["description", "amount", "category"]
  }
};

const updateCatalogTool: FunctionDeclaration = {
  name: "updateCatalog",
  description: "Add or remove a brand or model from the device catalog.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      brandName: { type: Type.STRING, description: "Brand name (e.g. Apple)" },
      modelName: { type: Type.STRING, description: "Model name (e.g. iPhone 15 Pro Max)" },
      action: { type: Type.STRING, enum: ["add_brand", "add_model", "remove_brand", "remove_model"], description: "Specific action to perform on the catalog" }
    },
    required: ["brandName", "action"]
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  let firebaseApp;
  if (!admin.apps.length) {
    const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId
      });
      console.log("[Firebase] Initialized with Service Account JSON key.");
    } else {
      firebaseApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log("[Firebase] Initialized with Application Default Credentials.");
    }
  } else {
    firebaseApp = admin.apps[0];
  }

  const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
    ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
    : getFirestore(firebaseApp);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

  /**
   * Reinstated Google Gemini Customer Intake Parser Endpoint
   * Consumes unstructured chat / transcript messages and returns structured JSON fields.
   */
  app.post("/api/ai/intake", async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing required 'text' parameter in request body." });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const config = {
      systemInstruction: "You are an expert customer intake technician for a device repair shop (smartphones, laptops, consoles). Your sole job is to parse unstructured chat messages, dictations, or voice transcripts and return clean, structured JSON output matching the target schema.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          customerName: { type: Type.STRING, description: "Customer's name. Use 'Walk-in Customer' if absent." },
          deviceBrand: { type: Type.STRING, description: "Device brand. Capitalize cleanly (e.g., Apple, Samsung, Nintendo)." },
          deviceModel: { type: Type.STRING, description: "Device model name (e.g., iPhone 15 Pro, Switch OLED, MacBook Air 13 M2)." },
          issueDescription: { type: Type.STRING, description: "Unbiased technical summary of the complaint or issue." },
          repairService: { type: Type.STRING, description: "Primary service name (e.g. Screen Replacement, Battery Repair, Liquid Damage Assessment)." },
          priceEstimation: { type: Type.NUMBER, description: "Anticipated or suggested price value as a clean float. Default to 0 if not mentioned." },
          requiresFollowUp: { type: Type.BOOLEAN, description: "Set true if water damage, motherboard, or complex troubleshooting is required, otherwise false." }
        },
        required: [
          "customerName", 
          "deviceBrand", 
          "deviceModel", 
          "issueDescription", 
          "repairService", 
          "priceEstimation", 
          "requiresFollowUp"
        ]
      }
    };

    try {
      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash", 
          contents: text,
          config
        });
      } catch (firstError: any) {
        console.warn("[Intake Agent First-Attempt Error, Retrying with gemini-3.1-pro-preview]:", firstError.message);
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview", 
            contents: text,
            config
          });
        } catch (secondError: any) {
          console.warn("[Intake Agent Second-Attempt Error, Retrying with gemini-3.5-flash]:", secondError.message);
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash", 
            contents: text,
            config
          });
        }
      }

      const jsonOutput = JSON.parse(response.text || "{}");
      res.json({ success: true, data: jsonOutput });
    } catch (error: any) {
      console.error("[Intake Agent API Error]:", error);
      res.status(500).json({ 
        error: "Failed to parse intake details", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  /**
   * Universal Server-side Shop Assistant Co-pilot
   * Processes technician chat triggers and executes function calling with Gemini models.
   */
  app.post("/api/ai/assistant", async (req, res) => {
    const { prompt, settings, brands, recentInvoices, expenses, leads } = req.body;

    try {
      // Determine the API Key: use custom settings Key if supplied, or default to the backend process.env key
      const usingCustomKey = !!(settings?.geminiApiKey && settings.geminiApiKey.trim());
      const apiKey = usingCustomKey ? settings.geminiApiKey.trim() : process.env.VITE_GEMINI_API_KEY;

      const assistant_ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Slice arrays to prevent any Payload Too Large (413) issues
      const topInvoices = (recentInvoices || []).slice(0, 20);
      const topExpenses = (expenses || []).slice(0, 20);
      const topLeads = (leads || []).slice(0, 20);

      const invoicesContext = topInvoices.length > 0
        ? `Recent Invoices: ${JSON.stringify(topInvoices.map((inv: any) => ({
            number: inv.invoiceNumber,
            customer: inv.customerName,
            total: inv.total,
            status: inv.status,
            date: inv.date,
            paymentMethod: inv.paymentMethod || 'Cash'
          })))}`
        : "No recent invoices found.";

      const expensesContext = topExpenses.length > 0
        ? `Recent Expenses: ${JSON.stringify(topExpenses.map((exp: any) => ({
            description: exp.description,
            amount: exp.amount,
            category: exp.category,
            date: exp.date,
            paymentMethod: exp.paymentMethod || 'Cash'
          })))}`
        : "No recent expenses found.";

      const leadsContext = topLeads.length > 0
        ? `Recent Leads/CRM: ${JSON.stringify(topLeads.map((lead: any) => ({
            customer: lead.customerName,
            type: lead.type,
            status: lead.status,
            date: lead.createdAt,
            brand: lead.metadata?.brand,
            model: lead.metadata?.model,
            company: lead.metadata?.companyName
          })))}`
        : "No leads found.";

      // Use gemini-3.5-flash as default, or fallback to user settings
      let modelName = (settings?.geminiModel || "gemini-3.5-flash").trim();

      // Strip common prefixes like 'publishers/google/models/' or 'models/'
      if (modelName.startsWith("publishers/google/models/")) {
        modelName = modelName.substring("publishers/google/models/".length);
      }
      if (modelName.startsWith("models/")) {
        modelName = modelName.substring("models/".length);
      }

      // Map any custom or legacy model names to modern, supported versions automatically
      if (usingCustomKey) {
        // Custom keys: map to standard, public-facing models to prevent "unexpected model name format" on Google's public endpoints
        if (
          !modelName ||
          modelName.includes("1.5-flash") ||
          modelName.includes("2.0-flash") ||
          modelName.includes("3.1-flash-lite") ||
          modelName.includes("3.1-flash") ||
          modelName.includes("3.5-flash") ||
          modelName.includes("2.5-flash")
        ) {
          modelName = "gemini-2.5-flash";
        } else if (
          modelName.includes("1.5-pro") ||
          modelName.includes("2.0-pro") ||
          modelName.includes("3-pro") ||
          modelName.includes("3.1-pro") ||
          modelName.includes("2.5-pro")
        ) {
          modelName = "gemini-2.5-pro";
        } else {
          modelName = "gemini-2.5-flash";
        }
      } else {
        // Platform keys: map to platform-supported models
        if (
          !modelName ||
          modelName.includes("1.5-flash") ||
          modelName.includes("2.0-flash") ||
          modelName.includes("3-flash") ||
          modelName.includes("3.1-flash-lite") ||
          modelName.includes("3.5-flash") ||
          modelName.includes("2.5-flash")
        ) {
          modelName = "gemini-3.5-flash";
        } else if (
          modelName.includes("1.5-pro") ||
          modelName.includes("2.0-pro") ||
          modelName.includes("3-pro") ||
          modelName.includes("3.1-pro") ||
          modelName.includes("2.5-pro")
        ) {
          modelName = "gemini-3.1-pro-preview";
        } else {
          modelName = "gemini-3.5-flash";
        }
      }

      const systemInstruction = `You are an advanced AI business assistant for RepairBill Studio.
            You process technical dictations into structured business actions and provide insights.

            CONTEXT:
            - Current Date: ${new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            - ISO Today: ${new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')}
            - Currency: AUD
            - Tax Rate: ${settings?.taxRate || 10}%
            - Existing Brands: ${(brands || []).map((b: any) => b.name).join(", ")}

            ${invoicesContext}
            ${expensesContext}
            ${leadsContext}

            CAPABILITIES:
            1. MULTI-ACTION HANDLING: You can process complex, multi-sentence instructions in a single turn.
               Example: "Create an invoice for John for $100 today, and log a $50 expense for last Tuesday rent."
               In this case, call BOTH tools.

            2. MIXED DATE RESOLUTION: Always accurately resolve relative dates.
               - "Yesterday" = ${new Date(Date.now() - 86400000).getFullYear() + '-' + String(new Date(Date.now() - 86400000).getMonth() + 1).padStart(2, '0') + '-' + String(new Date(Date.now() - 86400000).getDate()).padStart(2, '0')}
               - "Last Month" (general) = The month before ${new Date().toLocaleDateString('en-AU', { month: 'long' })}
               - If a user says "last month rent", set the date to the 1st of the previous month unless specified otherwise.
               - "This month bill" = Current month (${new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0')}-01 or current day).

            3. BULK OPERATIONS: If the user says "add 3 invoices for today", generate 3 separate tool calls.

            4. CATALOG MANAGEMENT: You can add and REMOVE items.
               Example: "Stop supporting Huawei" -> action: 'remove_brand', brandName: 'Huawei'.
               Example: "Add iPhone 16 to Apple" -> action: 'add_model', brandName: 'Apple', modelName: 'iPhone 16'.

            CONSTRAINTS:
            - For catalog updates containing both branding and pricing changes, prefer invoking separate actions.

            TOOLS:
            - createInvoice: For sales/quotes.
            - createExpense: For outgoings/bills.
            - updateCatalog: For inventory/brands/models.

            DATA INTEGRITY:
            - Extract exact prices.
            - Default Customer: "Walk-in Customer".
            - Default Supplier: "Generic Supplier".

            Tone: Professional, efficient shop manager.`;

      let response;
      try {
        response = await assistant_ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: [createInvoiceTool, createExpenseTool, updateCatalogTool] }],
          }
        });
      } catch (firstError: any) {
        console.warn("[Assistant AI First-Attempt Error]:", firstError.message || firstError);
        
        // Treat as auth / fallback candidate if there's any key suspension / format / unknown model or configuration errors
        const isAuthError = usingCustomKey && (
          String(firstError.message || firstError).toLowerCase().includes("suspended") ||
          String(firstError.message || firstError).toLowerCase().includes("permission") ||
          String(firstError.message || firstError).toLowerCase().includes("key") ||
          String(firstError.message || firstError).toLowerCase().includes("403") ||
          String(firstError.message || firstError).toLowerCase().includes("invalid") ||
          String(firstError.message || firstError).toLowerCase().includes("denied") ||
          String(firstError.message || firstError).toLowerCase().includes("unexpected") ||
          String(firstError.message || firstError).toLowerCase().includes("format") ||
          String(firstError.message || firstError).toLowerCase().includes("not found")
        );

        if (isAuthError && process.env.VITE_GEMINI_API_KEY) {
          console.log("[Assistant AI Fallback] Custom key failed authorization/unsupported-model. Falling back to platform backend API key...");
          try {
            const fallback_ai = new GoogleGenAI({
              apiKey: process.env.VITE_GEMINI_API_KEY,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
            });
            response = await fallback_ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: prompt,
              config: {
                systemInstruction,
                tools: [{ functionDeclarations: [createInvoiceTool, createExpenseTool, updateCatalogTool] }],
              }
            });
          } catch (fallbackError: any) {
            console.error("[Assistant AI System fallback client also failed]:", fallbackError.message || fallbackError);
            throw fallbackError;
          }
        } else {
          // Normal model retry flow using current assistant_ai client
          const retryModel = usingCustomKey ? "gemini-2.5-pro" : "gemini-3.1-pro-preview";
          console.warn(`[Assistant AI Retrying with ${retryModel}]:`, firstError.message || firstError);
          try {
            response = await assistant_ai.models.generateContent({
              model: retryModel,
              contents: prompt,
              config: {
                systemInstruction,
                tools: [{ functionDeclarations: [createInvoiceTool, createExpenseTool, updateCatalogTool] }],
              }
            });
          } catch (secondError: any) {
            const nextLashResortModel = usingCustomKey ? "gemini-2.5-flash" : "gemini-3.5-flash";
            console.warn(`[Assistant AI Second-Attempt Error, Retrying with ${nextLashResortModel}]:`, secondError.message || secondError);
            try {
              response = await assistant_ai.models.generateContent({
                model: nextLashResortModel,
                contents: prompt,
                config: {
                  systemInstruction,
                  tools: [{ functionDeclarations: [createInvoiceTool, createExpenseTool, updateCatalogTool] }],
                }
              });
            } catch (thirdError: any) {
              // As an ultimate last resort, if custom key failed with any other error
              if (usingCustomKey && process.env.VITE_GEMINI_API_KEY) {
                console.log("[Assistant AI Last-Resort Fallback] Custom key entirely failed. Retrying one final time with backup platform key...");
                const fallback_ai = new GoogleGenAI({
                  apiKey: process.env.VITE_GEMINI_API_KEY,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });
                response = await fallback_ai.models.generateContent({
                  model: "gemini-3.5-flash",
                  contents: prompt,
                  config: {
                    systemInstruction,
                    tools: [{ functionDeclarations: [createInvoiceTool, createExpenseTool, updateCatalogTool] }],
                  }
                });
              } else {
                throw thirdError;
              }
            }
          }
        }
      }

      res.json({ 
        success: true, 
        response: {
          candidates: response.candidates,
          text: response.text,
          functionCalls: response.functionCalls
        }
      });
    } catch (error: any) {
      console.error("[Assistant API Error]:", error);
      res.status(500).json({
        error: "AI Assistant processing failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
