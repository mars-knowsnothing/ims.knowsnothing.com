# Cyber Face Website 🤖

A Next.js website featuring a 3D cyber face with matrix-style effects and mouse-tracking interaction.

## Features ✨

- **3D Cyber Face**: Realistic human face geometry with wireframe overlay
- **Interactive Eyes**: Pupils follow mouse cursor movement
- **Breathing Animation**: Subtle pulsing and glow effects
- **Matrix Rain**: Animated Japanese characters background
- **Responsive Design**: Works on desktop and mobile
- **Modern Tech Stack**: Next.js 15 + TypeScript + Tailwind CSS + Three.js

## Quick Start 🚀

### Method 1: Smart Startup (Recommended)
```bash
./start.sh
```
- Checks system requirements
- Handles port conflicts intelligently
- Installs dependencies if needed
- Interactive port selection

### Method 2: Quick Development
```bash
./dev.sh
```
- Kills any existing process on port 3000
- Installs dependencies if needed
- Starts development server immediately

### Method 3: Manual
```bash
yarn install
yarn dev
```

## Stop Server 🛑
```bash
./stop.sh
```

## Project Structure 📁

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   └── page.tsx         # Home page with cyber interface
│   └── components/          # React components
│       ├── CyberFace.tsx    # 3D face with human geometry
│       └── MatrixRain.tsx   # Digital rain background
├── public/                  # Static assets
├── start.sh                 # Smart startup script
├── dev.sh                   # Quick development script
├── stop.sh                  # Server stop script
└── package.json             # Project dependencies
```

## Technology Stack 🛠️

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js, @react-three/fiber, @react-three/drei
- **Package Manager**: Yarn

## Development Features 🔧

- **Hot Reload**: Changes update instantly
- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Turbopack**: Fast bundling (Next.js 15)

## Browser Support 🌐

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with WebGL support

## Performance ⚡

- **Optimized 3D Rendering**: Efficient geometry and materials
- **Memory Management**: Proper cleanup of Three.js resources
- **SSR Compatibility**: No hydration mismatches
- **Responsive Loading**: Adaptive to different screen sizes

## Scripts Explained 📋

- `start.sh` - Full-featured startup with port management
- `dev.sh` - Quick development startup
- `stop.sh` - Clean server shutdown
- `yarn dev` - Standard Next.js development server
- `yarn build` - Production build
- `yarn start` - Production server

## Port Management 🔌

The scripts automatically handle port conflicts on **port 3000**:
- Detects existing processes
- Offers to kill conflicting processes
- Allows custom port selection
- Ensures clean startup

## Troubleshooting 🔍

### Port Already in Use
Run `./stop.sh` first, then `./start.sh`

### Dependencies Issues
```bash
rm -rf node_modules yarn.lock
yarn install
```

### 3D Rendering Issues
Ensure your browser supports WebGL and hardware acceleration is enabled.

## License 📄

This project is open source and available under the MIT License.
