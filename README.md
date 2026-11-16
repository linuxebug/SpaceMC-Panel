# SpaceMC Panel

Premium Minecraft server hosting panel with a dark forest-green gradient design inspired by NookTheme.

## Features

- **Premium Dark Forest-Green UI** — NookTheme-inspired design with `#07110B` background, forest-green gradient buttons, and premium server cards
- **Server Dashboard** — CPU, RAM, Disk, Network usage graphs, uptime, and power controls
- **Console** — Real-time terminal with live logs, command execution, and server power controls
- **File Manager** — Browse, upload, edit, and manage server files
- **Server Management** — Start, stop, restart, kill servers; edit properties, plugins, mods
- **Authentication** — Login, register, forgot password, change password/username
- **Admin Panel** — Manage servers, users, branding, features, runtime, and system settings
- **Playit Tunnel Integration** — Expose local servers to the internet
- **Responsive Design** — Works on desktop, laptop, tablet, and mobile

## Branding

- Panel Name: **SpaceMC Panel**
- Primary Color: Forest Green Gradient (`#22C55E` → `#16A34A` → `#4ADE80`)
- Background: `#07110B` (Dark Forest)

## Quick Automated Setup (Recommended)

Run the automated management script:

```bash
bash install.sh
```

Menu Options:
1. **Initialize Main Panel** — Production Mode (:6969)
2. **Initialize Dev Panel** — Developer Mode (:3000)
3. **Update & Auto-Repair** — Self-Healing Requirement Check
4. **Create / Reset Owner** — Setup Administrator Account
5. **System & Service Status** — Live Port, RAM & Health Monitor
6. **Uninstall SpaceMC Panel** — Clean Removal & Service Wipe
0. **Exit Installer**

## Manual Installation

### Requirements
- Node.js >= 20
- Docker (for Minecraft server containers)
- PM2 (process manager)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/linuxebug/SpaceMC-Panel.git
   cd SpaceMC-Panel
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Create an admin user:
   ```bash
   npm run createuser
   ```

5. Start the server (Port 6969):
   ```bash
   PORT=6969 npm run start
   ```

Access the panel at `http://your-server-ip:6969`

### Docker Deployment

```bash
docker compose -f docker-compose.yml up -d
```

Access at `http://your-server-ip:6969`

## Project Structure

```
src/
├── pages/          # Frontend pages (Login, Register, Dashboard, ServerView, etc.)
├── components/     # Reusable UI components (Sidebar, Layout, ServerConsole, etc.)
├── context/        # React contexts (Auth, Settings, Upload)
├── hooks/          # Custom hooks (useDashboardData)
├── server/         # Backend (routes, controllers, middleware, services)
│   ├── routes/     # API route definitions
│   ├── controllers/# Route controllers
│   ├── middleware/ # Auth middleware
│   └── services/   # Docker, local, SFTP, DB services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Main app with routing
├── index.css       # Forest-green Tailwind theme
└── main.tsx        # Entry point

server.ts           # Express + Socket.io server entry
install.sh          # Automated installer with online hosting option
package.json        # Dependencies & scripts
```

## API Endpoints

- `POST /api/auth/login` — User login
- `POST /api/auth/register` — User registration
- `POST /api/auth/forgot-password` — Password reset request
- `GET /api/auth/me` — Get current user
- `GET /api/servers` — List all servers
- `POST /api/servers` — Create a server
- `GET /api/servers/:id` — Get server details
- `POST /api/servers/:id/start|stop|restart|kill` — Server power actions
- `POST /api/servers/:id/command` — Send console command
- `GET /api/servers/:id/stats` — Server resource stats
- `GET /api/servers/:id/logs` — Server console logs
- `GET /api/system/stats` — System statistics
- `GET /api/settings` — Panel settings
- `GET /api/health` — Health check

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run createuser` | Create owner user |
| `npm run lint` | TypeScript type check |

## License

ISC
