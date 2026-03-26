# JHCIS Central Hub

ระบบรวบรวมข้อมูล JHCIS จากโรงพยาบาลส่งเสริมสุขภาพชุมชนทั่วประเทศ

## โครงสร้าง

```
jhcis-central-hub/
├── api-backend/          # Node.js API Server
├── dashboard/            # Frontend Dashboard
├── database/              # SQL Schema
├── nginx/                 # Nginx Configuration
├── deploy/                # Deployment Scripts
├── docker-compose.yml     # Docker Compose
└── docs/                  # Documentation
```

## การ Deploy

ดูรายละเอียดใน [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) หรือ [docs/QUICKSTART.md](docs/QUICKSTART.md)

### Quick Deploy (Windows)

```powershell
cd C:\fullstack\jhcis-central-hub
deploy\package.bat
```

### Quick Deploy (Linux)

```bash
ssh user@ubonlocal.phoubon.in.th
cd /opt/jhcis-central-hub
./deploy/deploy.sh
```

## Endpoints

| Endpoint | รายละเอียด |
|----------|------------|
| `/api/v1/sync` | Sync API |
| `/api/v1/import/upload` | Import ZIP |
| `/api/v1/dashboard` | Dashboard |
| `/api/v1/queries` | Query Management |

## การพัฒนา

### Requirements
- Node.js 20+
- MySQL 8.0+
- Docker & Docker Compose

### Local Development

```bash
# Install dependencies
cd api-backend
npm install

# Create .env file
cp .env.example .env

# Start MySQL
docker-compose up -d mysql

# Start API
npm run dev

# Run tests
npm test
```

## License

MIT