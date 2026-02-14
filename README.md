# CleanOS AI

A modern Linux desktop application that uses AI to intelligently analyze, organize, and clean your system.

## Features

**AI-Powered Analysis**
- Smart file categorization using AI
- Intelligent duplicate detection
- Importance scoring for files
- Natural language search

**Intelligent Organization**
- One-click auto-organization
- Smart file naming suggestions
- Optimal folder structure recommendations
- Full undo/redo support

**System Cleanup**
- Docker management (images, containers, volumes, cache)
- Package manager cache cleanup (npm, pip, cargo, system)
- Log rotation and management
- Old kernel removal
- Browser cache cleanup

**Storage Insights**
- Interactive storage visualization
- Trend analysis with AI predictions
- Large file identification
- Prioritized cleanup recommendations

**Multi-AI Provider Support**
- OpenAI (GPT-4, GPT-3.5)
- Google Gemini
- Anthropic Claude
- Moonshot AI (Kimi)
- API Keys, OAuth, and Token authentication

## Documentation

- [Product Requirements Document](docs/PRD.md)
- [Architecture Design](docs/ARCHITECTURE.md)
- [Technical Specification](docs/TECHNICAL_SPEC.md)

## Quick Start

### Prerequisites
- Linux (Ubuntu 20.04+, Fedora 34+, Arch)
- Node.js 18+
- Rust toolchain

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cleanos-ai.git
cd cleanos-ai

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Development

### Project Structure
```
cleanos-ai/
├── src/                 # React frontend
├── src-tauri/          # Rust backend
├── docs/               # Documentation
└── tests/              # Test files
```

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Rust + Tauri
- **State**: Zustand
- **Database**: SQLite
- **AI**: Multi-provider REST API clients

## License

MIT License - see LICENSE file for details

## Acknowledgments

Architecture inspired by [OpenCode](https://github.com/anomalyco/opencode)
