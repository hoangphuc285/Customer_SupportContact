# Database
Nếu cần reset toàn bộ dữ liệu Database:
docker compose down -v
docker compose up -d

docker compose up -d mysql (database)
docker compose up -d phpmyadmin (phpmyadmin)

# Backend
cd backend
./gradlew bootRun

# Frontend
cd frontend
npm install
npm run dev

Sau đó import workflow n8n vào n8n và activate workflow.

# Chạy toàn bộ hệ thống bằng Docker Compose
```bash
cp .env.example .env
docker compose up -d --build
```

# CI/CD (GitHub Actions + Docker Hub + Web Deploy)
1. **CI (`.github/workflows/ci.yml`)**: Tự động chạy khi `push` hoặc tạo `pull_request` vào `main` (test & build Backend Gradle + MySQL service, typecheck & build Frontend Next.js).
2. **CD (`.github/workflows/cd.yml`)**: Tự động chạy sau khi CI thành công trên `main`, build và push Docker images lên Docker Hub, sau đó deploy lên server qua SSH (`git pull` + `docker compose pull` + `docker compose up -d`).

## GitHub Secrets cần cấu hình (Settings -> Secrets and variables -> Actions)
- `DOCKERHUB_USERNAME`: Tên tài khoản Docker Hub
- `DOCKERHUB_TOKEN`: Access Token của Docker Hub
- *(Tùy chọn - nếu auto deploy lên VPS)* `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH`, `SERVER_PORT` (mặc định 22)

# Khởi tạo Qdrant
docker run -d --name qdrant \
  -p 6333:6333 -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# Chạy Qdrant
docker start qdrant
