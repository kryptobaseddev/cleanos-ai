# CleanOS AI - Agent Quick Reference Card

## Mission
Build CleanOS AI desktop app using AI agent orchestration with CLEO RCSD/IVTR protocols.

## Essential References (READ FIRST)
1. `/mnt/projects/cleanos-ai/docs/PRD.md` - Product requirements
2. `/mnt/projects/cleanos-ai/docs/ARCHITECTURE.md` - System design
3. `/mnt/projects/cleanos-ai/docs/TECHNICAL_SPEC.md` - Technical details
4. `/mnt/projects/opencode-reference/` - Architecture patterns

## CLEO Epic
**ID**: T009
**Command**: `cleo orchestrator start --epic T009`

## Protocols
- **RCSD**: Research → Consensus → Specification → Decomposition
- **IVTR**: Implementation → Verification → Test → Release

## Tech Stack
- Tauri (Rust + Web)
- React + TypeScript
- Tailwind CSS
- Zustand
- SQLite
- Multi-AI providers

## Commands
```bash
# Start session
cd /home/keatonhoskins/Downloads
cleo session start --scope epic:T009

# Check status
cleo dash --compact
cleo list --tree

# Ready tasks
cleo orchestrator ready --epic T009

# Spawn agent
cleo orchestrator spawn T00XX --json
```

## Constraints
- Linux only
- Never modify CLEO configs
- All credentials in system keyring
- 80%+ test coverage
- Code provenance tags required

## Success Criteria
- 4 AI providers working
- 100k files scanned in <30s
- >90% AI accuracy
- All tests passing
- Linux packages built
