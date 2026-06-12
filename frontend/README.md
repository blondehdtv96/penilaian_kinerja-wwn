# Merit-Misconduct Frontend

Frontend aplikasi Merit-Misconduct System menggunakan Vue.js 3 + Ionic Vue + TailwindCSS.

## Tech Stack

- **Framework**: Vue.js 3 (Composition API)
- **UI Framework**: Ionic Vue 7
- **State Management**: Pinia
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **Real-Time**: Socket.IO Client
- **Build Tool**: Vite
- **Language**: TypeScript

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test:unit

# Lint code
npm run lint
```

## Project Structure

```
src/
├── assets/          # Static assets & styles
├── components/      # Reusable Vue components
├── pages/           # Page components
│   ├── auth/       # Login & authentication
│   ├── operators/  # Operator management
│   ├── merit/      # Merit events
│   ├── misconduct/ # Misconduct events
│   ├── blockchain/ # Blockchain explorer
│   ├── reports/    # Reports
│   └── admin/      # Admin pages
├── router/          # Vue Router configuration
├── services/        # API services
│   ├── api.ts
│   ├── auth.service.ts
│   ├── operator.service.ts
│   ├── merit.service.ts
│   ├── misconduct.service.ts
│   ├── blockchain.service.ts
│   ├── dashboard.service.ts
│   └── report.service.ts
├── stores/          # Pinia stores
│   ├── auth.ts
│   └── socket.ts
├── App.vue
└── main.ts
```

## Features

### Authentication
- JWT-based login
- Auto token refresh
- Role-based navigation

### Real-Time Updates
- Socket.IO integration
- Live merit/misconduct notifications
- Real-time dashboard updates

### Operator Management
- View operator list
- Operator details & performance
- QR Code scanning

### Merit & Misconduct
- Create events
- Approval workflow
- History tracking

### Blockchain Explorer
- View blockchain
- Verify chain integrity
- Block details

### Dashboard & Reports
- KPI dashboard
- Performance charts
- Export reports

## Ionic Components

Menggunakan Ionic Vue components:
- IonPage, IonHeader, IonToolbar
- IonContent, IonList, IonItem
- IonButton, IonInput, IonCard
- IonModal, IonAlert, IonToast
- IonIcon (Ionicons)

## TailwindCSS

Utility-first CSS framework untuk styling:
- Responsive design
- Custom color palette
- Flexbox & Grid utilities

## Build & Deploy

```bash
# Build for production
npm run build

# Output akan ada di folder dist/
# Deploy ke web server (Apache, Nginx, dll)
```

## Mobile Build (Optional)

Untuk build native mobile app dengan Capacitor:

```bash
# Install Capacitor
npm install @capacitor/cli @capacitor/core

# Initialize Capacitor
npx cap init

# Add platforms
npx cap add android
npx cap add ios

# Build & sync
npm run build
npx cap sync

# Open in native IDE
npx cap open android
npx cap open ios
```

## License

MIT License - PT Bridgestone Tire Indonesia
