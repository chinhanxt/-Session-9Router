# 🚀 Codex 9Router Converter

<div align="center">

[![Vite](https://img.shields.io/badge/Vite-5.4.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A high-performance, secure, and intuitive utility designed to convert ChatGPT Auth Sessions into Codex Provider Connections for 9Router.**

[Key Features](#-key-features) • [How to Use](#-how-to-use) • [Format Examples](#-format-examples) • [Local Development](#%EF%B8%8F-local-development) • [Security & Privacy](#-security--privacy)

</div>

---

## 📖 Introduction

**9Router** is an extremely powerful multi-provider routing gateway. To seamlessly integrate ChatGPT sessions into 9Router as a customized Codex provider connection, you need to transform raw browser-auth or app-auth sessions into the exact schema that 9Router expects.

**Codex 9Router Converter** is a premium developer tool that bridges this gap. It parses your ChatGPT Auth Session JSON, automatically computes appropriate token lifetimes, formats provider-specific metadata, and outputs a drop-in JSON configuration. It also features a "Full Backup" wrapper generation, enabling you to import your new connection directly into 9Router with a single click.

---

## ✨ Key Features

- **🔄 Instant Client-Side Conversion:** Parses and transforms complex session structures in milliseconds.
- **⚙️ Configurable Priority Control:** Fine-tune the route priority level of each injected connection for failover order optimization.
- **📋 Dual Copy Operations:** 
  - **Copy Connection:** Copies only the specific `CodexConnection` block.
  - **Copy Full Backup:** Generates and copies a complete 9Router backup structure, allowing instant direct import without manual file merging.
- **🛡️ 100% Client-Side & Private:** Your sensitive tokens and sessions never leave your browser. Zero tracking, zero telemetry.
- **🎨 Premium Dark Theme:** Beautifully crafted modern UI featuring responsive layout, crisp Lucide-react icons, and smooth interactive micro-transitions.

---

## 🚀 How to Use

### Step 1: Obtain your ChatGPT Session JSON
Obtain your ChatGPT Auth Session JSON from your login tool or upstream session manager. It typically looks like this:
```json
{
  "user": {
    "id": "user-abcdefgh",
    "email": "example@domain.com"
  },
  "account": {
    "id": "account-123456",
    "planType": "plus"
  },
  "accessToken": "eyJhbGciOiJSUzI1Ni...",
  "sessionToken": "your-session-token-refresh"
}
```

### Step 2: Perform the Conversion
1. Paste the raw ChatGPT session JSON into the **ChatGPT Auth Session** (left/top) panel.
2. Set your desired connection **Priority** (e.g., `1` for top priority).
3. Click the **Chuyen doi** (Convert) button.

### Step 3: Integrate with 9Router
* **Option A (Append):** Click **Copy** to copy the formatted Codex Connection object and append it into the `providerConnections` array inside your existing `9router` backup JSON file.
* **Option B (Direct Import):** Click **Copy Full Backup** to copy a complete 9Router backup structure containing your new provider. Go to your 9Router dashboard and import this JSON block directly.

---

## 📋 Format Examples

### 📥 Sample ChatGPT Auth Session (Input)
```json
{
  "user": {
    "id": "user-u8yvTq8d4",
    "email": "developer@9router.io"
  },
  "account": {
    "id": "account-plus-plan",
    "planType": "plus"
  },
  "accessToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "sessionToken": "sess-abcd-1234-xyz"
}
```

### 📤 Sample 9Router Codex Connection (Output)
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "refreshToken": "sess-abcd-1234-xyz",
  "expiresAt": "2026-06-04T14:20:00.000Z",
  "testStatus": "active",
  "expiresIn": 864000,
  "providerSpecificData": {
    "chatgptAccountId": "account-plus-plan",
    "chatgptPlanType": "plus"
  },
  "id": "c1f73602-5be2-4bc7-a16f-df6f9e2b1095",
  "provider": "codex",
  "authType": "oauth",
  "name": "developer@9router.io",
  "email": "developer@9router.io",
  "priority": 1,
  "isActive": true,
  "createdAt": "2026-05-25T14:20:00.000Z",
  "updatedAt": "2026-05-25T14:20:00.000Z"
}
```

---

## 🛠️ Local Development

Follow these steps to run the application locally or build it for deployment.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher is recommended).

### 1. Clone the repository
```bash
git clone <repository-url>
cd codex9router
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```
The application will be accessible at [http://localhost:5173/](http://localhost:5173/).

### 4. Build for production
```bash
npm run build
```
This command compiles the project and generates optimized production assets inside the `dist` directory.

---

## ⚙️ Tech Stack & Design

- **Framework:** [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) for lightning-fast speeds and reliable type checking.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) using modern semantic variables and smooth hover state transitions.
- **Icons:** [Lucide React](https://lucide.dev/) for crisp, scalable vector graphics.
- **Core Architecture:** Clean single-page state handling with highly focused layout structuring.

---

## 🔒 Security & Privacy

We take privacy extremely seriously:
* **Strictly Local Processing:** All JSON parsing, key mappings, UUID generations, and backup structuring are performed in-memory inside the user's browser.
* **No Server Interactivity:** The application does not communicate with external servers. No data is stored, cached, or transmitted.
* **Open Source:** Feel free to audit the source code in `src/App.tsx` to verify data safety.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute it as needed.
