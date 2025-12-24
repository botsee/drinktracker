import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyC-wckgmcP-UN7wq_jIBO_VxGl-Alu6gSo",
  authDomain: "drink-tracker-ae8e0.firebaseapp.com",
  projectId: "drink-tracker-ae8e0",
  storageBucket: "drink-tracker-ae8e0.firebasestorage.app",
  messagingSenderId: "320329429504",
  appId: "1:320329429504:web:4bf18deb3eb9776b8b9ee5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const usersRef = collection(db, "users");
const metaRef = doc(db, "meta", "drinks");

const usersEl = document.getElementById("users");
const newUser = document.getElementById("newUser");
const addUserBtn = document.getElementById("addUserBtn");
const newDrink = document.getElementById("newDrink");
const addDrinkBtn = document.getElementById("addDrinkBtn");

let drinks = [];

/* INIT */
async function init() {
  const snap = await getDoc(metaRef);
  if (!snap.exists()) {
    drinks = ["beer", "palinka", "jager", "whisky"];
    await setDoc(metaRef, { list: drinks });
  } else {
    drinks = snap.data().list;
  }
  render();
}

/* ADD USER */
addUserBtn.onclick = async () => {
  const name = newUser.value.trim();
  if (!name) return;

  const drinkObj = {};
  drinks.forEach(d => drinkObj[d] = 0);

  await addDoc(usersRef, { name, drinks: drinkObj });
  newUser.value = "";
  render();
};

/* ADD DRINK */
addDrinkBtn.onclick = async () => {
  const name = newDrink.value.trim().toLowerCase();
  if (!name || drinks.includes(name)) return;

  drinks.push(name);
  await updateDoc(metaRef, { list: drinks });

  const users = await getDocs(usersRef);
  users.forEach(async u => {
    await updateDoc(doc(db, "users", u.id), {
      [`drinks.${name}`]: 0
    });
  });

  newDrink.value = "";
  render();
};

/* RENDER */
async function render() {
  usersEl.innerHTML = "";
  const snap = await getDocs(usersRef);

  snap.forEach(u => {
    const data = u.data();
    const card = document.createElement("div");
    card.className = "user-card";

    const header = document.createElement("div");
    header.className = "user-header";
    header.innerHTML = `<span>${data.name}</span>`;
    const del = document.createElement("button");
    del.textContent = "🗑";
    del.onclick = async () => {
      await deleteDoc(doc(db, "users", u.id));
      render();
    };
    header.appendChild(del);
    card.appendChild(header);

    const drinksDiv = document.createElement("div");
    drinksDiv.className = "drinks";

    drinks.forEach(d => {
      const row = document.createElement("div");
      row.className = "drink";
      row.innerHTML = `
        <span>${d}</span>
        <button>-</button>
        <span>${data.drinks[d] ?? 0}</span>
        <button>+</button>
      `;
      const btns = row.querySelectorAll("button");
      btns[0].onclick = () => updateDrink(u.id, d, -1);
      btns[1].onclick = () => updateDrink(u.id, d, 1);
      drinksDiv.appendChild(row);
    });

    card.appendChild(drinksDiv);
    usersEl.appendChild(card);
  });
}

async function updateDrink(userId, drink, diff) {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  const val = snap.data().drinks[drink] || 0;

  await updateDoc(ref, {
    [`drinks.${drink}`]: Math.max(0, val + diff)
  });

  render();
}

init();
