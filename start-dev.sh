#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting development environment...${NC}\n"

# Step 1: Start MongoDB and Redis using docker compose
echo -e "${YELLOW}📦 Starting MongoDB and Redis...${NC}"
sudo docker compose up -d mongodb 

# Wait for MongoDB to be healthy
echo -e "${YELLOW}⏳ Waiting for MongoDB to be ready...${NC}"
until sudo docker compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  sleep 1
done
echo -e "${GREEN}✅ MongoDB is ready${NC}\n"

# Initialize replica set (idempotent - won't fail if already initialized)
echo -e "${YELLOW}🔧 Initializing MongoDB replica set...${NC}"
sudo docker compose exec -T mongodb mongosh --eval "
  try {
    rs.status();
  } catch(e) {
    rs.initiate({
      _id: 'rs0',
      members: [{ _id: 0, host: 'localhost:27017' }]
    });
  }
" > /dev/null 2>&1
sleep 2
echo -e "${GREEN}✅ Replica set initialized${NC}\n"

# Step 2: Start Redis locally
echo -e "${YELLOW}🔧 Starting Redis server...${NC}"
redis-server --daemonize yes
sleep 1
if redis-cli ping > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Redis is ready${NC}\n"
else
  echo -e "${YELLOW}⚠️  Redis may not be running. Install with: sudo apt install redis-server${NC}\n"
fi

# Step 3: Seed the database
echo -e "${YELLOW}🌱 Seeding database...${NC}"
cd backend
npm run seed
cd ..
echo -e "${GREEN}✅ Database seeded${NC}\n"

# Step 4: Start backend
echo -e "${YELLOW}🔧 Starting backend server...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Step 5: Start frontend
echo -e "${YELLOW}🎨 Starting frontend server...${NC}"
cd frontend
npm run dev:frontend

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null; redis-cli shutdown 2>/dev/null" EXIT
