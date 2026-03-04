import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB9xJ5-xThgrxWsF8snyRaBkDiMvTbYDxU",
  authDomain: "gestao-ong-agm.firebaseapp.com",
  projectId: "gestao-ong-agm",
  storageBucket: "gestao-ong-agm.firebasestorage.app",
  messagingSenderId: "1008313826768",
  appId: "1:1008313826768:web:28d24d5a4caa7abc05cdd5",
  measurementId: "G-GJD46KNSFG"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // Importante para salvar dados da ONG