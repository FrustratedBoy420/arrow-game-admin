# Arrow Escape - Game Admin Dashboard

This is a premium, web-based admin control panel for the Arrow Escape game. It allows you to monitor multiplayer lobbies, edit level designs, verify level assets, and customize soundtracks and logo icons dynamically.

---

## 🎨 Features

1. **Live Multiplayer Arena**:
   - Real-time display of currently online players and active rooms.
   - Live status tracking (`Lobby`, `Playing`, `Finished`), supporting player specific failure tags (such as `'failed_lives'` for players who lost all 3 hearts).
   - Terminate active room keys directly in Redis.
   - Server-side 1-hour expiration auto-cleanup of idle or long-running room sessions.
2. **Levels Manager**:
   - Grid view showing IDs, grid columns/rows, difficulty ratings, and arrow counts.
   - Create, Edit, or Delete levels dynamically.
   - Interactive JSON editor with instant format verification.
   - Level validator ensuring arrows fit inside grid boundaries.
   - One-click backup of all levels configurations to the clipboard.
3. **Music & Theme Config**:
   - Customize background music, correct move sound, wrong move sound, victory tone, and out of move sound using hosted MP3/WAV links.
   - Customize the Home Screen character/accent icon dynamically with real-time UI preview.

---

## 🚀 Setup & Usage

### 1. Start the Backend API Server
First, run the backend server. Make sure you are in the `Arrow-Game-Backend` directory:
```bash
node local-server.js
```

### 2. Launch the Admin Panel
Open `index.html` directly in any web browser.

### 3. Connect to the Server
- In the top right navbar config:
  - **Server URL**: Enter `http://localhost:3000` (or your staging/production API URL).
  - **Admin Secret**: Enter your credentials secret password if you set `ADMIN_SECRET` in `.env` (otherwise leave it blank).
- Click **Connect**.
- You will see a success toast notification and `Connected (API OK)` status in the sidebar.
