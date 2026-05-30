import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const leadData = {
      customerName: "Test Lead",
      customerEmail: "test@example.com",
      message: "Testing lead submission",
      type: "quote",
      status: "new",
      createdAt: new Date().toISOString()
    };
    
    console.log("Adding doc...");
    const docRef = await addDoc(collection(db, 'users', 'testUID', 'leads'), leadData);
    console.log("Success! Doc ID:", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}
run();
