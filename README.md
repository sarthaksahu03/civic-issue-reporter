# 📢 Public Grievance Reporter

A real-time civic-tech web application that enables citizens to report public grievances, track their status, and receive instant notifications when updates occur. Built using **React**, **Node.js**, and **WebSockets** for live updates.

---

## ✨ Features

- 📝 **Report Grievances** – Submit complaints about civic issues (e.g., potholes, street lights, garbage collection).
- 📊 **Track Status** – View live updates on grievance progress.
- 🔔 **Real-Time Notifications** – Get instant alerts when an admin updates or resolves your complaint.
- 📂 **Media Uploads** – Attach photos or videos as proof.
- 🔐 **User Authentication** – Secure login & role-based access (citizens/admins).
- 🌐 **Responsive UI** – Works on desktop and mobile.

---

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (or MySQL)
- **Real-Time:** WebSockets / Socket.IO
- **Authentication:** JWT
- **Notifications:** Browser Push API + Local Storage

---

## 📦 Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/brijesh216/public-grievance-reporter.git
cd public-grievance-reporter
```
### 2️⃣ Install Dependencies
For frontend:
```bash
cd client
npm install
```
For backend:
```bash
cd ../server
npm install
```
### 3️⃣ Set Environment Variables
Create a .env file in the server directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```
### 4️⃣ Start the Application
Run backend:
```bash
cd server
npm run dev
```
Run frontend:
```bash
cd client
npm start
```
🚀 Usage Guide

1. Sign Up / Login as a user or admin.

2. Submit a Grievance with title, description, and optional image.

3. Track Your Grievance status in the dashboard.

4. Receive Notifications when the status changes.

5. Admins can manage, update, and close grievances.

📸 Screenshots </br>

Homepage

<img width="1899" height="862" alt="image" src="https://github.com/user-attachments/assets/e2017ee7-3482-4be1-bc0e-d62d4839df14" />

Complaints Dashboard

<img width="1896" height="858" alt="image" src="https://github.com/user-attachments/assets/0332839b-6bb0-4c56-b11d-47926ff8f128" />

Admin Dashboard

<img width="1896" height="860" alt="image" src="https://github.com/user-attachments/assets/e602c27b-9b25-4498-bef1-0dea56d266ae" />


## 💡 Author

**Brijesh Prasad**  
📧 Email: brijeshprasad2160@gmail.com  
🔗 [LinkedIn](https://www.linkedin.com/in/brijesh216) | [GitHub](https://github.com/brijesh216)



