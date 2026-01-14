import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = window.auth;
const db = window.db;

let currentUser = null;
let currentRole = null;
let currentEmail = null;
let allUsers = [];

/*-----------filter tasks by category-----------*/
let selectedUserFilter = "all";
let selectedCategoryFilter = "all";
let openDropdown = null;

/* ---------- LOGIN ---------- */
async function login() {
  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user.uid;

    // Load role from Firestore
    const userSnap = await getDocs(
      query(collection(db, "users"), where("email", "==", email))
    );

    if (userSnap.empty) {
      alert("User role not found. Contact admin.");
      await signOut(auth);
      return;
    }

    const userData = userSnap.docs[0].data();
    currentRole = userData.role;
    currentEmail = email;

    document.getElementById("login").hidden = true;
    document.getElementById("app").hidden = false;
    document.getElementById("welcome").innerText = `Hello ${email} (${currentRole})`;

   document.getElementById("assignTo").hidden = currentRole !== "parent";
   document.getElementById("resetBtn").hidden = currentRole !== "parent";

   document.getElementById("newUserBtn").hidden = currentRole !== "parent";
   document.getElementById("adminCreateUser").hidden = true;


    await loadUsers();
    await renderTasks();
  } catch (error) {
    alert("Login failed: " + error.message);
  }
}

window.login = login;


/* ---------- USERS ---------- */
async function loadUsers() {
  try {
    const snap = await getDocs(collection(db, "users"));
    allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Populate assignTo dropdown
    const assignToSelect = document.getElementById("assignTo");
    assignToSelect.innerHTML = '<option value="">Assign to...</option>';
    allUsers.forEach(u => {
      assignToSelect.innerHTML += `<option value="${u.id}">${u.email} (${u.role})</option>`;
    });
  } catch (error) {
    console.error("Error loading users:", error);
  }
  // populate user filter dropdown
  const userFilter = document.getElementById("userFilter");
userFilter.innerHTML = `<div onclick="setUserFilter('all')">All Users</div>`;

allUsers.forEach(u => {
  userFilter.innerHTML += `
    <div onclick="setUserFilter('${u.id}')">
      ${u.email} (${u.role})
    </div>
  `;
});

}

async function createUser() {
  if (currentRole !== "parent") {
    alert("Only admin can create users");
    return;
  }

  const email = document.getElementById("newUserEmail").value;
  const password = document.getElementById("newUserPassword").value;
  const role = document.getElementById("newUserRole").value;

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  try {
    // Create auth user
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Save role in Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      role
    });

    alert("✅ User created");

   document.getElementById("newUserEmail").value = "";
   document.getElementById("newUserPassword").value = "";
  document.getElementById("adminCreateUser").hidden = true;

    await loadUsers();
  } catch (error) {
    alert("Failed to create user: " + error.message);
  }
}

window.createUser = createUser;


/* ---------- TASKS ---------- */
async function addTask() {
  const title = document.getElementById("taskTitle").value;
  const content = document.getElementById("taskContent").value;
  const category = document.getElementById("taskCategory").value;
  const dueDate = document.getElementById("taskDue").value;

  if (!title) {
    alert("Please enter a task title");
    return;
  }

  let assignedTo = currentUser;
  if (currentRole === "parent") {
    assignedTo = document.getElementById("assignTo").value || currentUser;
  }

  await addDoc(collection(db, "tasks"), {
    title,
    content,
    category: category || null,
    dueDate: dueDate || null,
    assignedTo,
    createdBy: currentUser,
    createdAt: new Date().toISOString(),
    done: false
  });

  document.getElementById("taskTitle").value = "";
  document.getElementById("taskContent").value = "";
  document.getElementById("assignTo").value = "";
  document.getElementById("taskDue").value = "";

  toggleTaskForm();
  await renderTasks();
}

window.addTask = addTask;

async function getTasks() {
  try {
    const q =
      currentRole === "parent"
        ? collection(db, "tasks")
        : query(collection(db, "tasks"), where("assignedTo", "==", currentUser));

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting tasks:", error);
    return [];
  }
}

async function toggleTask(id, done) {
  try {
    await updateDoc(doc(db, "tasks", id), { done: !done });
    await renderTasks();
  } catch (error) {
    console.error("Error toggling task:", error);
    alert("Failed to update task: " + error.message);
  }
}
window.toggleTask = toggleTask;

async function deleteTask(id) {
  if (currentRole !== "parent") return;
  try {
    await deleteDoc(doc(db, "tasks", id));
    await renderTasks();
  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Failed to delete task: " + error.message);
  }
}
window.deleteTask = deleteTask;

/* ---------- RENDER ---------- */
async function renderTasks() {
  const taskList = document.getElementById("taskList");
  const archiveList = document.getElementById("archiveList");
  
  taskList.innerHTML = "";
  archiveList.innerHTML = "";
  archiveList.hidden = true;

  let tasks = await getTasks();

tasks = tasks.filter(t => {
  const userMatch =
    selectedUserFilter === "all" || t.assignedTo === selectedUserFilter;

  const categoryMatch =
    selectedCategoryFilter === "all" || t.category === selectedCategoryFilter;

  return userMatch && categoryMatch;
});


  if (tasks.length === 0) {
    taskList.innerHTML = "<li>No tasks yet</li>";
    return;
  }

  tasks.forEach(t => {
    // Find user emails for display
    const assignedUser = allUsers.find(u => u.id === t.assignedTo);
    const createdByUser = allUsers.find(u => u.id === t.createdBy);
    
    const assignedEmail = assignedUser ? assignedUser.email : "Unknown";
    const createdByEmail = createdByUser ? createdByUser.email : "Unknown";
    const createdDate = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "N/A";
    const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date";
    

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="task-card ${t.category ? t.category.toLowerCase() : ''}">
        <strong>${t.title}</strong>
        ${t.category ? `<span class="task-category" data-category="${t.category}">${t.category}</span>` : ""}
        <small>Due: ${dueDate}</small>
        ${t.content ? `<p>${t.content}</p>` : ""}
        <div class="task-meta">
          <small>Assigned to: ${assignedEmail}</small>
          <small>Created by: ${createdByEmail}</small>
          <small>Created: ${createdDate}</small>
        </div>
        <div class="task-actions">
          <button onclick="toggleTask('${t.id}', ${t.done})">
            ${t.done ? "Undo" : "Done"}
          </button>
          ${currentRole === "parent" ? `<button onclick="deleteTask('${t.id}')">Delete</button>` : ""}
        </div>
      </div>
    `;
    (t.done ? archiveList : taskList).appendChild(li);
  });

  if (archiveList.children.length > 0) {
    archiveList.hidden = false;
  }
}

/* ---------- UI HELPERS ---------- */
function toggleTaskForm() {
  const taskForm = document.getElementById("taskForm");
  taskForm.hidden = !taskForm.hidden;
}
window.toggleTaskForm = toggleTaskForm;

function toggleNewUser() {
  const userForm = document.getElementById("adminCreateUser");
  const taskForm = document.getElementById("taskForm");

  userForm.hidden = !userForm.hidden;

  // Close task form if open
  if (!userForm.hidden) {
    taskForm.hidden = true;
  }
}
window.toggleNewUser = toggleNewUser;


function toggleArchive() {
  const archiveList = document.getElementById("archiveList");
  archiveList.hidden = !archiveList.hidden;
}
window.toggleArchive = toggleArchive;

/*-----------reset app data-----------*/
async function resetAppData() {
  if (currentRole !== "parent") {
    alert("Only parents can reset the app");
    return;
  }

  const confirmed = confirm(
    "⚠️ This will DELETE ALL tasks and users from the database.\nThis action cannot be undone.\n\nContinue?"
  );

  if (!confirmed) return;

  try {
    // 🔥 Delete all tasks
    const tasksSnap = await getDocs(collection(db, "tasks"));
    for (const docSnap of tasksSnap.docs) {
      await deleteDoc(doc(db, "tasks", docSnap.id));
    }

    // 🔥 Delete all users
    const usersSnap = await getDocs(collection(db, "users"));
    for (const docSnap of usersSnap.docs) {
      await deleteDoc(doc(db, "users", docSnap.id));
    }

    alert("✅ App reset completed. Logging out...");

    await signOut(auth);
    localStorage.clear();
    location.reload();
  } catch (error) {
    console.error("Reset failed:", error);
    alert("Reset failed: " + error.message);
  }
}

window.resetAppData = resetAppData;

function toggleDropdown(id) {
  if (openDropdown && openDropdown !== id) {
    document.getElementById(openDropdown).classList.remove("show");
  }

  const dropdown = document.getElementById(id);
  dropdown.classList.toggle("show");
  openDropdown = dropdown.classList.contains("show") ? id : null;
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".filter")) {
    document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("show"));
    openDropdown = null;
  }
});
 window.toggleDropdown = toggleDropdown;

/* ----------Filter setters--------------*/
function setUserFilter(userId) {
  selectedUserFilter = userId;
  closeDropdowns();
  renderTasks();
}
window.setUserFilter = setUserFilter;

function setCategoryFilter(category) {
  selectedCategoryFilter = category;
  closeDropdowns();
  renderTasks();
}
window.setCategoryFilter = setCategoryFilter;

function closeDropdowns() {
  document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("show"));
  openDropdown = null;
}





/* ---------- LOGOUT ---------- */
async function logout() {
  try {
    await signOut(auth);
    currentUser = null;
    currentRole = null;
    document.getElementById("login").hidden = false;
    document.getElementById("app").hidden = true;
    document.getElementById("username").value = "";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Failed to logout: " + error.message);
  }
}
window.logout = logout;
