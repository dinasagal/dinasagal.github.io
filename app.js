
let currentUser = null;
let currentRole = null;

function populateAssignList() {
  const select = document.getElementById("assignTo");
  select.innerHTML = `<option value="">Assign to...</option>`;

  getUsers()
    .filter(u => u.role === "child")
    .forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.name;
      opt.innerText = u.name;
      select.appendChild(opt);
    });
}

function login() {
  const username = document.getElementById("username").value;
  const role = document.getElementById("role").value;

  if (!username) return;

  currentUser = username;
  currentRole = role;

  let users = getUsers();
  if (!users.find(u => u.name === username)) {
    users.push({ name: username, role });
    saveUsers(users);
  }
  document.getElementById("resetBtn").hidden = currentRole !== "parent";

  document.getElementById("login").hidden = true;
  document.getElementById("app").hidden = false;

  document.getElementById("assignTo").hidden = role !== "parent";
  document.getElementById("newTaskBtn").hidden = false;
  document.getElementById("welcome").innerText =
  currentRole === "child"
    ? `👋 Hi ${username}!`
    : `Welcome ${username}`;
  if (currentRole === "parent") {
  populateAssignList();
}

  renderTasks();
}

function logout() {
  currentUser = null;
  currentRole = null;

  document.getElementById("app").hidden = true;
  document.getElementById("login").hidden = false;

  // Optional cleanup
  document.getElementById("username").value = "";
  document.getElementById("role").value = "child";

  // Clear task lists
  document.getElementById("taskList").innerHTML = "";
  document.getElementById("archiveList").innerHTML = "";

  localStorage.setItem(
  "session",
  JSON.stringify({ user: currentUser, role: currentRole })
   );

   localStorage.removeItem("session");

}



function getTasks() {
  return JSON.parse(localStorage.getItem("tasks") || "[]");
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
  const title = document.getElementById("taskTitle").value;
  const content = document.getElementById("taskContent").value;
  const categorySelect = document.getElementById("taskCategory");
  const category = categorySelect.value;
  const color = categorySelect.selectedOptions[0].dataset.color;
  const due = document.getElementById("taskDue").value;
  const assignedUser =
  currentRole === "parent"
    ? document.getElementById("assignTo").value || currentUser
    : currentUser;

  if (!title) return;

  const tasks = getTasks();
  tasks.push({
  id: Date.now(),
  title,
  content,
  category,
  color,
  due,
  assignedTo: assignedUser, // NEW
  createdBy: currentUser,
  done: false
  });

  saveTasks(tasks);
  clearForm();
  toggleTaskForm();
  renderTasks();
}

function clearForm() {
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskContent").value = "";
  document.getElementById("taskDue").value = "";
}


function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);

  if (
    currentRole === "child" &&
    task.assignedTo !== currentUser
  ) {
    return; // child cannot modify others' tasks
  }

  task.done = !task.done;
  saveTasks(tasks);
  renderTasks();
}

function deleteTask(id) {
  if (currentRole !== "parent") return;

  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks();
}

function toggleTaskForm() {
  const form = document.getElementById("taskForm");
  form.hidden = !form.hidden;
}

function toggleArchive() {
  const archiveList = document.getElementById("archiveList");
  const header = document.querySelector("h3[onclick='toggleArchive()']");
  archiveList.hidden = !archiveList.hidden;
  header.innerText = archiveList.hidden ? "DONE ▼" : "DONE ▲";
}


function renderTasks() {
  const activeList = document.getElementById("taskList");
  const archiveList = document.getElementById("archiveList");

  activeList.innerHTML = "";
  archiveList.innerHTML = "";
  archiveList.hidden = true; // Start hidden
  const header = document.querySelector("h3[onclick='toggleArchive()']");
  header.innerText = "DONE ▼";

  const tasks = getTasks().filter(task =>
  currentRole === "parent"
    ? true
    : task.assignedTo === currentUser
);

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task";
    li.style.borderLeft = `6px solid ${task.color}`;

    li.innerHTML = `
      <div class="task-header">
        <strong>${task.title}</strong>
        <span>${task.category}</span>
      </div>
      <p>${task.content || ""}</p>
      <small> Assigned to: <strong>${task.assignedTo === currentUser ? "Me" : task.assignedTo}</strong> </small><br/>
      <small>Due: ${task.due || "No date"}</small>
      <button onclick="toggleTask(${task.id})">
        ${task.done ? "Restore" : "Done"}
      </button>
      ${
  currentRole === "parent"
    ? `<button onclick="deleteTask(${task.id})">Delete</button>`
    : ""
}
    `;

    if (task.done) {
      archiveList.appendChild(li);
    } else {
      activeList.appendChild(li);
    }
  });
}



function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function resetAppData() {
  localStorage.removeItem("tasks");
  localStorage.removeItem("users");
  localStorage.removeItem("session");
  location.reload();
}

// Register Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

window.addEventListener("load", () => {
  const session = JSON.parse(localStorage.getItem("session"));
  if (!session) return;

  currentUser = session.user;
  currentRole = session.role;

  document.getElementById("login").hidden = true;
  document.getElementById("app").hidden = false;

  document.getElementById("welcome").innerText =
    `Hello ${currentUser} (${currentRole})`;

  if (currentRole === "parent") {
    document.getElementById("assignTo").hidden = false;
    populateAssignList();
  }

  renderTasks();
});

