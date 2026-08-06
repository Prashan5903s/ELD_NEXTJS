````markdown
# 🚛 ELD Frontend

A modern **Next.js** frontend application for the **Electronic Logging Device (ELD)** system. This application provides an intuitive interface for fleet management, driver monitoring, Hours of Service (HOS) compliance, real-time messaging, and administrative operations.

---

## 📌 Features

### 🔐 Authentication
- Secure login using NextAuth
- JWT-based authentication
- Role-based access
- Session management

### 📊 Dashboard
- Driver activity overview
- Fleet statistics
- Live driver status
- HOS summary
- Recent notifications

### 👤 Driver Management
- Driver profiles
- Driver details
- Driver documents
- Driver logs
- Duty status management

### 🚚 Fleet Management
- Vehicle management
- Trailer management
- Company management
- Terminal management

### 💬 Real-Time Messaging
- One-to-one chat
- Group chat
- Live unread message count
- Read receipts
- Live duty status updates
- Force logout notifications
- WebSocket integration

### 🚨 Panic Alerts
- Real-time emergency alerts
- Driver information
- Location details
- Instant notifications

### 📄 Reports
- Driver logs
- HOS reports
- Activity reports
- Compliance reports

---

# 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js | Frontend Framework |
| React | UI Library |
| Material UI | UI Components |
| Bootstrap Icons | Icons |
| Axios | API Communication |
| NextAuth | Authentication |
| WebSocket | Real-time Communication |
| React Hook Form | Forms |
| React Table | Data Tables |

---

# 📂 Project Structure

```
src/
│
├── app/
├── components/
├── hooks/
├── services/
├── utils/
├── contexts/
├── layouts/
├── styles/
├── types/
└── config/
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/<username>/<repository>.git
```

## Install Dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

## Environment Variables

Create a `.env.local` file.

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
```

---

## Run Development Server

```bash
npm run dev
```

Visit:

```
http://localhost:3000
```

---

# 🏗 Build

```bash
npm run build
```

---

# ▶ Start Production

```bash
npm start
```

---

# 🔗 Backend Services

The frontend communicates with:

- Laravel REST API
- Node.js WebSocket Server

### REST API

Used for:

- Authentication
- Dashboard
- Driver Management
- Fleet Management
- Reports
- Documents
- Image Uploads
- Notifications
- Panic Alerts
- User Management

### WebSocket

Used for:

- Authentication
- Real-time chat
- Driver duty status updates
- Force logout
- Read receipts
- Live unread message count
- Online user updates

---

# 🌐 Application Flow

```
User Login
      │
      ▼
NextAuth Authentication
      │
      ▼
JWT Token
      │
      ▼
REST API Calls (Laravel)
      │
      ▼
Dashboard Data
      │
      ▼
WebSocket Authentication
      │
      ▼
Live Events
 ├── Chat
 ├── Duty Status
 ├── Force Logout
 ├── Notifications
 └── Panic Alerts
```

---

# 📦 Available Scripts

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Builds the application for production.

```bash
npm start
```

Runs the production build.

```bash
npm run lint
```

Runs ESLint.

---

# 🔒 Security

- JWT Authentication
- Protected Routes
- Session Management
- Role-Based Authorization
- Secure API Requests
- WebSocket Token Authentication

---

# 📱 Responsive Design

The application is optimized for:

- Desktop
- Tablet
- Mobile

---

# 🚀 Deployment

Deploy using:

- Vercel
- Docker
- Nginx
- Apache

Configure the required environment variables before deployment.

---

# 👨‍💻 Contributors

**Prashant Chaubey**

- Full Stack Developer
- Next.js
- React
- Laravel
- Node.js
- WebSocket
- MySQL

---

# 📄 License

This project is proprietary software developed for the ELD platform. Unauthorized distribution or reproduction is prohibited.
````
