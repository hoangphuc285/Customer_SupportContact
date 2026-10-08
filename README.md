# Database
Nếu cần reset toàn bộ dữ liệu Database:
docker compose down -v
docker compose up -d

docker compose up db -d

# Backend
cd backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm install
npm run dev

Sau đó import workflow n8n vào n8n và activate workflow.
