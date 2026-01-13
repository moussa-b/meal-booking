# Meal Booking

A meal booking application built with Next.js.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Docker Setup

This document provides instructions for building and running the Meal Booking application using Docker.

### Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)

### Building the Docker Image

#### Option 1: Using Docker directly

Build the image:
```bash
docker build -t meal-booking:latest .
```

Run the container:
```bash
docker run -p 3000:3000 meal-booking:latest
```

#### Option 2: Using Docker Compose (Recommended)

Build and start the container:
```bash
docker-compose up -d
```

Stop the container:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f
```

Rebuild after changes:
```bash
docker-compose up -d --build
```

#### Option 3: Using Docker Compose with Production Configuration

To run the application using the production docker-compose file:

Start the container:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

Stop the container:
```bash
docker-compose -f docker-compose.prod.yml down
```

View logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Note:** The production configuration (`docker-compose.prod.yml`) uses a pre-built image from a container registry and is configured for production environments with `NODE_ENV=production` and automatic restart policy. The `platform: linux/amd64` setting ensures compatibility when running on ARM-based systems (like Apple Silicon Macs) by using emulation.

#### Option 4: Using Docker Compose for MySQL Only

To run only the MySQL 9.5.0 database container:

Start the MySQL container:
```bash
docker-compose -f docker-compose-mysql.yml up -d
```

Stop the MySQL container:
```bash
docker-compose -f docker-compose-mysql.yml down
```

View MySQL logs:
```bash
docker-compose -f docker-compose-mysql.yml logs -f
```

Check MySQL health status:
```bash
docker-compose -f docker-compose-mysql.yml ps
```

**MySQL Configuration:**
- **Version:** MySQL 9.5.0
- **Port:** 3306 (mapped to host port 3306)
- **Root Password:** `rootpassword`
- **Database:** `meal_booking`
- **User:** `mealuser`
- **Password:** `mealpassword`
- **Data Persistence:** Data is stored in a Docker volume named `mysql_data`

**Connecting to MySQL:**
You can connect to the MySQL instance using:
```bash
mysql -h 127.0.0.1 -P 3306 -u mealuser -pmealpassword meal_booking
```

Or using the root user:
```bash
mysql -h 127.0.0.1 -P 3306 -u root -prootpassword
```

**Note:** For production use, it's recommended to change the default passwords by setting environment variables or using a `.env` file. The MySQL container includes a health check to ensure it's ready before other services depend on it.

### Deleting Docker Images

To remove the built Docker images:

#### Option 1: Using Docker directly

Delete the image by name:
```bash
docker rmi meal-booking:latest
```

If the image is in use or has multiple tags, force delete:
```bash
docker rmi -f meal-booking:latest
```

#### Option 2: Using Docker Compose

Stop and remove containers, networks, and images:
```bash
docker-compose down --rmi all
```

To remove only the image (keep containers):
```bash
docker-compose down --rmi local
```

#### Additional Cleanup Commands

List all images to find the image ID:
```bash
docker images
```

Delete by image ID:
```bash
docker rmi <image-id>
```

Remove all unused images (dangling images):
```bash
docker image prune
```

Remove all unused images (including tagged ones):
```bash
docker image prune -a
```

### Accessing the Application

Once the container is running, access the application at:
```
http://localhost:3000
```

### Multi-Stage Build

The Dockerfile uses a multi-stage build process for optimization:

1. **deps**: Installs dependencies
2. **builder**: Builds the Next.js application
3. **runner**: Creates the final production image

This approach results in a smaller, more secure production image.

### Environment Variables

You can pass environment variables by:

#### Using docker run:
```bash
docker run -p 3000:3000 -e ENV_VAR=value meal-booking:latest
```

#### Using docker-compose.yml:
Add them to the `environment` section in `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
  - NEXT_PUBLIC_API_URL=https://api.example.com
```

Or use an `.env` file:
```yaml
env_file:
  - .env.production
```

### Troubleshooting

#### Port already in use
If port 3000 is already in use, change the port mapping:
```bash
docker run -p 8080:3000 meal-booking:latest
```

#### Build fails
Make sure you have enough disk space and that all dependencies in `package.json` are correct.

#### Container exits immediately
Check the logs:
```bash
docker logs meal-booking-app
```

### Production Deployment

For production deployment:

1. Tag your image appropriately:
```bash
docker build -t your-registry/meal-booking:v1.0.0 .
```

2. Push to your container registry:
```bash
docker push your-registry/meal-booking:v1.0.0
```

3. Deploy to your container orchestration platform (Kubernetes, ECS, etc.)
