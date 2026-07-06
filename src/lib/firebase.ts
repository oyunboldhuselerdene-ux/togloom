import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test connection as requested by the Firebase Skill Guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connected successfully");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration or network status.", error);
    }
  }
}

testConnection();

export { db };
