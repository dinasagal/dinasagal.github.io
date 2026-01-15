# Family Task Manager 🏡✅

A **Progressive Web App (PWA)** that helps families manage daily tasks together. The app supports **parent and child roles**, task assignment, task tracking, and works across devices using **Firebase Authentication and Firestore**.

This project was built as a learning and portfolio project to demonstrate front-end development, role-based logic, and cloud data management.

---

## 🚀 Features

### 👨‍👩‍👧 User Roles

**Parent**

* Log in / log out
* Create tasks
* Assign tasks to any family member
* View all tasks
* Mark tasks as done / undone
* Delete tasks
* Reset app data (admin-only)

**Child**

* Log in / log out
* Create their own tasks
* View only tasks assigned to them
* Mark their own tasks as done / undone

---

## 🧠 Key Concepts Demonstrated

* Role-based UI and permissions
* Firebase Authentication (email/password)
* Firestore CRUD operations
* Firestore queries and filters
* Server timestamps (`serverTimestamp()`)
* Progressive Web App (PWA) structure
* Clean separation of logic and UI
* Defensive UI rendering for async data

---

## 🛠 Tech Stack

* **HTML5**
* **CSS3** (child-friendly UI)
* **Vanilla JavaScript (ES Modules)**
* **Firebase Authentication**
* **Firebase Firestore**
* **PWA Manifest & Service Worker**

---

## 📦 Data Model (Firestore)

### Users Collection: `users`

```js
{
  email: string,
  role: "parent" | "child"
}
```

### Tasks Collection: `tasks`

```js
{
  title: string,
  content: string,
  category: string | null,
  dueDate: string | null,
  assignedTo: userId,
  createdBy: userId,
  createdAt: serverTimestamp,
  done: boolean
}
```

---

## 🔐 Authentication Flow

1. User enters email and selects role
2. App attempts login using Firebase Auth
3. If user does not exist, account is created automatically
4. User role is stored in Firestore
5. UI updates based on role permissions

---

## 📱 Progressive Web App (PWA)

* Installable on desktop and mobile
* Works as a standalone app
* Uses a manifest file
* Designed for future offline support

---

## 🧩 Project Structure

```
/
├── index.html      # App UI & Firebase initialization
├── app.js          # Application logic
├── style.css       # Styling (child-friendly design)
├── manifest.json   # PWA manifest
└── README.md       # Project documentation
```

---

## ⚠️ Notes
* Firestore security rules should be tightened for production
* App currently requires internet access

---

## 🔮 Future Improvements

* Role-based Firestore security rules
* Offline Firestore caching
* Task notifications
* Multiple families / groups
* Task sorting and filtering

---

## 🎯 Why This Project

This project demonstrates:

* Practical Firebase usage
* Real-world role-based permissions
* Async data handling
* Clean UI logic separation
* Ability to design and explain a full app

It is intended to be presented as part of a **junior front-end / full-stack developer portfolio**.

---

## 👩‍💻 Author

Built by a junior developer as a learning and interview project.
