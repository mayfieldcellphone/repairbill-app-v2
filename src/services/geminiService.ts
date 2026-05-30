import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Invoice, InvoiceSettings, Brand } from "../lib/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export async function processInvoiceRequest(
  prompt: string, 
  settings: InvoiceSettings,
  brands: Brand[],
  recentInvoices: Invoice[] = [],
  expenses: any[] = [],
  leads: any[] = []
) {
  try {
    const invoicesContext = recentInvoices.length > 0 
      ? `Recent Invoices: ${JSON.stringify(recentInvoices.map(inv => ({ 
          number: inv.invoiceNumber, 
          customer: inv.customerName, 
          total: inv.total, 
          status: inv.status, 
          date: inv.date,
          paymentMethod: inv.paymentMethod || 'Cash'
        })))}`
      : "No recent invoices found.";

    const expensesContext = expenses.length > 0
      ? `Recent Expenses: ${JSON.stringify(expenses.map(exp => ({
          description: exp.description,
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
          paymentMethod: exp.paymentMethod || 'Cash'
        })))}`
      : "No recent expenses found.";

    const leadsContext = leads.length > 0
      ? `Recent Leads/CRM: ${JSON.stringify(leads.map(lead => ({
          customer: lead.customerName,
          type: lead.type,
          status: lead.status,
          date: lead.createdAt,
          brand: lead.metadata?.brand,
          model: lead.metadata?.model,
          company: lead.metadata?.companyName
        })))}`
      : "No leads found.";

    let retries = 3;
    let delay = 1000;
    
    while (retries > 0) {
      try {
        const response = await ai.models.generateContent({
          // Using gemini-3-flash-preview as explicitly documented in Gemini guidelines
          model: "gemini-3-flash-preview", 
          contents: prompt,
          config: {
            systemInstruction: `You are an advanced AI business assistant for RepairBill Studio.
            You process technical dictations into structured business actions and provide insights.
            
            CONTEXT:
            - Current Date: ${new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            - ISO Today: ${new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')}
            - Currency: AUD
            - Tax Rate: ${settings.taxRate}%
            - Existing Brands: ${brands.map(b => b.name).join(", ")}
            
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
            
            TOOLS:
            - createInvoice: For sales/quotes.
            - createExpense: For outgoings/bills.
            - updateCatalog: For inventory/brands/models.
            
            DATA INTEGRITY:
            - Extract exact prices.
            - Default Customer: "Walk-in Customer".
            - Default Supplier: "Generic Supplier".
            
            Tone: Professional, efficient shop manager.`,
            tools: [{ functionDeclarations: [createInvoiceTool, createExpenseTool, updateCatalogTool] }],
          }
        });

        return response;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error("AI Agent Error (Final):", error);
          throw error;
        }
        console.warn(`AI Agent Error, retrying... (${retries} retries left)`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      }
    }
  } catch (error) {
    console.error("AI Agent Error:", error);
    throw error;
  }
}
