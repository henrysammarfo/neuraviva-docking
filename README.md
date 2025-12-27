# NeuraViva AI Docking Agent

An AI-powered research agent for molecular docking data management and report generation, built on Solana for blockchain-verified data integrity.

## 🎯 Overview

NeuraViva AI Docking Agent addresses two critical needs in computational drug discovery:

1. **Reporting & Visualization Agent**: Automatically generates comprehensive reports detailing docking scores, binding efficiencies, and potential drug efficacy with advanced visualizations.

2. **Data Management Agent**: Organizes vast data from docking simulations with automated categorization, secure blockchain storage, and researcher-friendly access.

## ✨ Key Features

### 📊 Automatic Report Generation
- **AI-Generated Reports**: Powered by Gemini AI to create detailed analysis including executive summaries, binding characteristics, and optimization recommendations
- **Performance Metrics**: Binding energy, ligand efficiency, inhibition constant (Ki), stability scores, and drug-likeness assessment
- **PDF Export**: One-click download of professionally formatted research reports

### 🔬 Advanced Visualizations
- **Binding Affinity Trends**: Real-time area charts showing docking score patterns across simulations
- **Interaction Profile Radar**: Visual representation of molecular interactions (H-bonds, hydrophobic, pi-stacking, salt bridges)
- **Binding Pose Visualization**: 3D molecular structure representations

### 🏷️ Automated Data Categorization
- **Smart Tagging**: AI automatically tags simulations by:
  - Protein family (kinase, protease, etc.)
  - Therapeutic area (oncology, antiviral, cardiovascular)
  - Binding strength classification
  - Drug class identification

### 🔗 Solana Blockchain Integration
- **Data Integrity**: Every report is cryptographically hashed and verified on Solana Devnet
- **Traceability**: Clickable transaction links to Solana Explorer for proof of authenticity
- **Immutable Records**: Blockchain-backed audit trail for research compliance

### 🤖 Autonomous AI Agent
- **Background Processing**: Agent automatically detects and processes pending simulations
- **Real-Time Status**: Watch simulations progress from `pending` → `processing` → `analyzed`
- **Dynamic Insights**: Live recommendations based on actual simulation data

### 📁 User-Friendly Interface
- **Dashboard**: Real-time metrics with 5-second auto-refresh
- **Data Explorer**: Filter, search, and manage simulation data with bulk selection
- **Reports Library**: Browse, preview, and export all generated analyses
- **User Profiles**: Customizable avatars with DiceBear integration

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| AI Engine | Google Gemini 2.5 Flash |
| Blockchain | Solana Web3.js (Devnet) |
| Charts | Recharts |
| Wallet | Solana Wallet Adapter (Phantom, Solflare) |
| Authentication | Passport.js with secure scrypt hashing |
| Storage | Neon (PostgreSQL) with Drizzle ORM |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Solana Devnet wallet (optional, for blockchain verification)
- Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/henrysammarfo/Docking-Reporter.git
cd Docking-Reporter

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your_wallet_private_key_array
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Build for Production

```bash
npm run build
```

## 📖 Usage Guide

### 1. Submit a Docking Simulation
- Click "New Simulation" on the Dashboard
- Enter protein target, ligand name, binding affinity, and RMSD
- The AI agent automatically processes and categorizes your data

### 2. Generate AI Reports
- Navigate to Explorer
- Select a simulation
- Click "Generate AI Report"
- View the complete analysis with binding characteristics and recommendations

### 3. Export & Share
- Download reports as PDF
- Export simulation data as CSV or JSON
- Share Solana verification links for data integrity proof

## 🎯 Bounty Alignment

### Reporting & Visualization Agent ✅
| Requirement | Implementation |
|-------------|----------------|
| Automatic report generation | Gemini AI generates executive summaries and detailed analysis |
| Docking scores & binding efficiencies | Displayed in reports and dashboard metrics |
| Advanced visualization tools | Recharts (Area, Radar, Bar charts) for molecular interactions |
| Integration with research papers | PDF export with professional formatting |

### Data Management Agent ✅
| Requirement | Implementation |
|-------------|----------------|
| Automated data categorization | AI tags by protein family, therapeutic area, binding strength |
| Blockchain-based storage | Solana Devnet for verification hashes |
| Data integrity & traceability | Immutable transaction IDs linked to Solana Explorer |
| User-friendly interface | Dashboard, Explorer, Reports pages with modern UI |

### Framework & Blockchain ✅
| Requirement | Implementation |
|-------------|----------------|
| Agentic framework | Custom DockingAgent class with autonomous polling |
| Solana integration | Web3.js for transaction signing and verification |
| Scalability | Rate limiting, efficient file-based storage |
| Security | scrypt password hashing, session management, CORS |

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages (Dashboard, Explorer, Reports)
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities (PDF export, etc.)
│   └── public/             # Static assets
├── server/                 # Express backend
│   ├── eliza.ts           # AI Agent implementation
│   ├── gemini.ts          # Gemini AI integration
│   ├── solana.ts          # Blockchain verification
│   ├── storage.ts         # Data persistence
│   └── routes.ts          # API endpoints
├── shared/                 # Shared TypeScript schemas
└── storage.json           # Persistent data store
```

## 🔒 Security Features

- **Password Hashing**: scrypt with unique salts
- **Session Management**: Secure HTTP-only cookies
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schema validation on all endpoints
- **Protected Routes**: Authentication middleware on sensitive operations

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

---

**Built for NeuraViva Research** | Accelerating drug discovery through AI-powered molecular docking analysis