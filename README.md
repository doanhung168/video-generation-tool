# 🎬 Video Generation Tool

AI-powered video generation and social media publishing platform.

## Features

- **AI Video Generation** - Create videos using Google Veo3 and Google Flow models
- **Smart Prompting** - AI-enhanced prompts, templates, and agent system
- **Multi-Platform Publishing** - Auto-publish to Facebook, TikTok, YouTube
- **Project Management** - Organize videos into projects with dashboard analytics
- **Template System** - Reusable scripts, prompts, and agent configurations

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python, SQLAlchemy, SQLite |
| AI Models | Google Veo3, Google Flow, Gemini |
| Social APIs | Facebook Graph API, TikTok Content API, YouTube Data API v3 |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Architecture

```
video-generation-tool/
├── frontend/          # Next.js React app
├── backend/           # FastAPI Python server
├── storage/           # Generated videos & assets
└── README.md
```

## API Keys Required

| Service | Purpose | Get Key |
|---------|---------|---------|
| Google AI Studio | Veo3 + Flow + Gemini | [aistudio.google.com](https://aistudio.google.com) |
| Facebook Developer | Page publishing | [developers.facebook.com](https://developers.facebook.com) |
| TikTok Developer | Video posting | [developers.tiktok.com](https://developers.tiktok.com) |
| YouTube Data API | Video uploading | [console.cloud.google.com](https://console.cloud.google.com) |

## License

MIT
