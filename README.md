//chay frontend

cd frontend

npm run dev 

//cap nhat lai du lieu db

docker compose down -v

docker compose up -d

docker compose up db -d  -> chay database bang docker
