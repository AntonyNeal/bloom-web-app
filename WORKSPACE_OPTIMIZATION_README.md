# 🚀 Bloom Web App - Optimized VS Code Workspace

## Overview

This workspace configuration optimizes GitHub Copilot performance by reducing enabled tools from **131 to ~28-30 essential tools** while maintaining full functionality for React + Azure development.

## 📊 Tool Optimization Summary

### ✅ **KEPT (28-30 tools total)**

#### **Core Development (6 tools)**

- File operations, terminal, git, search
- Workspace management, error diagnostics

#### **React/TypeScript (8 tools)**

- TypeScript tools, React tools, Vite tools
- ESLint, Prettier, Tailwind CSS
- Package.json tools, Node.js tools

#### **Azure Services (8 tools)**

- Azure best practices & documentation
- Architecture & resource management
- Activity logs, deployment tools
- Container & monitoring (essential only)

#### **Microsoft Documentation (4 tools)**

- Docs search & fetch
- Code sample search
- Repository file access

#### **Git Tools (2 tools)**

- Version control operations
- Issue management

### ❌ **DISABLED (100+ tools removed)**

#### **Database Tools**

- MSSQL tools (using Azure SQL via REST API)
- Cosmos DB, MySQL, PostgreSQL direct access

#### **Specialized Azure Services**

- Key Vault, Event Grid, Event Hubs, Service Bus
- Communication Services, SignalR, Speech Services
- Azure Workbooks, Load Testing, AI Foundry
- Confidential Ledger

#### **Infrastructure as Code**

- Bicep tools (using Azure Portal/CLI currently)
- Terraform tools

#### **Other Specialized Services**

- GitKraken workspace tools

## 🛠️ Workspace Features

### **Multi-Folder Structure**

```
🌸 Bloom Web App (main frontend)
⚡ API Functions (Azure Functions backend)
```

### **Pre-configured Tasks**

- `🚀 Dev Server` - Start Vite development server
- `🏗️ Build Frontend` - Production build
- `🔍 Lint` - ESLint checking
- `🎨 Format Code` - Prettier formatting
- `⚡ Build API` - Compile Azure Functions
- `🖥️ Start API` - Run Functions locally
- `🔄 Watch API` - TypeScript watch mode
- `🌐 Full Development` - Start both frontend & API
- `📦 Install Dependencies` - Install packages
- `🧹 Clean All` - Remove build artifacts

### **Debug Configurations**

- `🌐 Launch Chrome` - Debug in browser
- `🔍 Debug Frontend` - Full React debugging
- `⚡ Debug API Functions` - Azure Functions debugging

### **Performance Optimizations**

- Excluded `node_modules`, `dist`, build folders from search
- File watcher exclusions for better performance
- Optimized TypeScript settings

### **Language Settings**

- Auto-formatting on save for TS/TSX/JS/JSX
- ESLint auto-fix on save
- Prettier as default formatter
- Tailwind CSS IntelliSense
- Emmet support for React

## 🚀 How to Use

### **Option 1: Open as Workspace**

1. Open VS Code
2. File → Open Workspace from File
3. Select `react-azure-optimized-workspace.code-workspace`

### **Option 2: Set as Default**

1. Open the workspace file
2. Save your current workspace (if needed)
3. This becomes your new default setup

### **Quick Start Development**

1. Open workspace
2. Run task: `🌐 Full Development` (Ctrl+Shift+P → Tasks: Run Task)
3. Both frontend (localhost:5173) and API will start
4. Begin coding with optimized Copilot performance!

## 📈 Expected Performance Improvements

### **GitHub Copilot**

- **Tools**: 131 → ~28-30 (78% reduction)
- **Response Time**: Faster due to fewer tool evaluations
- **Suggestion Quality**: Better focus on relevant tools
- **Memory Usage**: Reduced tool loading overhead

### **VS Code Performance**

- **Search Speed**: Faster due to exclusions
- **File Watching**: Reduced overhead
- **IntelliSense**: Optimized for your tech stack

## 🎯 Tech Stack Optimized For

### **Frontend**

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6.0
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **State**: Redux Toolkit + React Query
- **Auth**: Azure AD B2C (MSAL)

### **Backend**

- **Platform**: Azure Functions v4
- **Runtime**: Node.js 18 + TypeScript
- **Database**: Azure SQL Database
- **Storage**: Azure Blob Storage

### **Development**

- **Linting**: ESLint + TypeScript ESLint
- **Formatting**: Prettier
- **Git**: Advanced GitLens integration
- **Debugging**: Chrome DevTools + Node debugging

## 🔧 Customization

### **Add More Tools**

Edit the `mcp.servers` section in the workspace file:

```json
"your_tool_name": {
  "enabled": true,
  "priority": "medium"
}
```

### **Adjust Priorities**

- `"high"` - Critical for development
- `"medium"` - Helpful but not essential
- `"low"` - Occasionally useful

### **Add Extensions**

Add to `extensions.recommendations`:

```json
"publisher.extension-name"
```

## 🆘 Troubleshooting

### **Tool Not Working**

1. Check if it's enabled in `mcp.servers`
2. Verify priority level
3. Restart VS Code after changes

### **Performance Still Slow**

1. Close unused tabs/windows
2. Disable more specialized tools
3. Check VS Code extension count
4. Clear VS Code cache

### **Missing Functionality**

1. Review disabled tools list
2. Enable specific tool if needed
3. Update priority to "high" for critical tools

## 📝 Notes

- **Backup**: Save your current settings before applying
- **Gradual**: You can enable/disable tools incrementally
- **Monitor**: Watch Copilot performance after changes
- **Adjust**: Fine-tune based on your specific needs

---

**Created**: October 24, 2025
**Optimized for**: React + TypeScript + Azure + Vite
**Tool Reduction**: 131 → ~30 tools (78% reduction)
**Performance Target**: GitHub Copilot sub-128 tool limit
