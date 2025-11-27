# Chareli

**Chareli** is a modern, full-stack gaming platform application designed to provide a seamless experience for players and administrators. It features a robust backend for managing games, users, and analytics, coupled with a responsive and dynamic frontend interface.

## 🚀 Overview

The project is structured as a monorepo containing:
- **Client**: A React-based Single Page Application (SPA) built with Vite.
- **Server**: A RESTful API built with Node.js, Express, and TypeScript.

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4, Radix UI (Primitives), Lucide React (Icons)
- **State Management**: Redux Toolkit, React Query (@tanstack/react-query)
- **Forms & Validation**: React Hook Form, Zod, Yup
- **Utilities**: Axios, Date-fns, Socket.io-client

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via TypeORM)
- **Caching/Queues**: Redis (ioredis), BullMQ
- **Storage**: AWS S3 (with CloudFront signed cookies)
- **Documentation**: Swagger (OpenAPI)
- **Testing**: Jest, Supertest

### Infrastructure
- **Containerization**: Docker
- **CI/CD**: GitHub Actions (implied by .github folder)
- **Quality**: SonarQube, ESLint

## ✨ Key Features

- **User Management**: Secure authentication (JWT), registration, password resets, and invitation system.
- **Game Library**: Browse, search, and play games.
- **Admin Dashboard**: Comprehensive tools for managing games, categories, and users.
- **Analytics**: Detailed tracking of user activity, game plays, and signups.
- **Secure Content Delivery**: Games and assets are securely served via AWS CloudFront using signed cookies.
- **Role-Based Access Control**: Granular permissions for Admins, Users, and other roles.

## 📂 Project Structure

```bash
chareli/
├── Client/                 # Frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages (Home, Admin, GamePlay, etc.)
│   │   ├── store/          # Redux state definitions
│   │   └── ...
│   └── ...
├── Server/                 # Backend application
│   ├── src/
│   │   ├── controllers/    # API request handlers
│   │   ├── entities/       # TypeORM database models
│   │   ├── services/       # Business logic (S3, CloudFront, etc.)
│   │   └── ...
│   └── ...
├── TESTING_SETUP.md        # Detailed testing documentation
└── ...
```

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL
- Redis (optional, for background jobs/caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chareli
   ```

2. **Install Backend Dependencies**
   ```bash
   cd Server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../Client
   npm install
   ```

### Configuration

1. **Backend Setup**
   - Navigate to `Server/`
   - Copy `.env.example` to `.env`
   - Update the variables (DB credentials, AWS keys, JWT secrets, etc.)

2. **Frontend Setup**
   - Navigate to `Client/`
   - Copy `.env.example` to `.env`
   - Configure API URL and other client-side settings.

### Running the Application

**Start the Backend (Development)**
```bash
cd Server
npm run dev
```
The server will start on `http://localhost:5000` (default).

**Start the Frontend (Development)**
```bash
cd Client
npm run dev
```
The client will start on `http://localhost:5173` (default).

## 🧪 Testing

We maintain a comprehensive testing strategy covering both unit and integration tests.

- **Frontend**: Uses Vitest and React Testing Library.
- **Backend**: Uses Jest and Supertest.

For detailed instructions on running tests, coverage reports, and our testing philosophy, please refer to [TESTING_SETUP.md](./TESTING_SETUP.md).

```bash
# Run Backend Tests
cd Server && npm test

# Run Frontend Tests
cd Client && npm test
```

## 📚 API Documentation

The backend includes auto-generated Swagger documentation.
Once the server is running, visit:
`http://localhost:5000/api-docs`

## 📄 License

[License Information Here]
