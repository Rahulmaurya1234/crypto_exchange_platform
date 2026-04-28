# Cryptians Vultr Deployment Guide

This repo has 3 deployable parts:

- `client` -> public frontend
- `admin` -> admin frontend
- `server` -> backend API + Socket.IO

Recommended production domains:

- `cryptians.store` -> client
- `admin.cryptians.store` -> admin
- `api.cryptians.store` -> server

Recommended production layout:

```text
Cloudflare
  -> Host Nginx on Vultr (SSL termination)
    -> 127.0.0.1:8080 -> Docker gateway -> client
    -> 127.0.0.1:8081 -> Docker gateway -> admin
    -> 127.0.0.1:5000 -> Docker server container
```

This guide matches the current repo after the production config cleanup:

- `docker-compose.prod.yml`
- `nginx/nginx.conf`
- `client/Dockerfile`
- `admin/Dockerfile`
- `server/Dockerfile`
- `.deploy.env.example`

## Important Corrections

The old guide had a few deployment-breaking issues:

1. It included real server credentials and IP details. Those must not be stored in docs.
2. It relied on public port `81` for admin. That is not a good Cloudflare-facing setup.
3. It assumed Vite envs were available at runtime. In this repo they must be injected at image build time.
4. It sent API traffic through the frontend gateway in places where direct API proxying is cleaner.
5. It did not persist Redis data or set a Redis password.

## 1. Create the Vultr Server

Use Ubuntu LTS. Prefer `22.04 LTS` or `24.04 LTS`.

Minimum:

- 2 vCPU
- 4 GB RAM
- 60+ GB SSD/NVMe

After the VPS is ready:
IP Address:
65.20.84.33 
IPv6 Address:
2401:c080:2400:20b7:5400:06ff:fe00:61f1 
Username:
root
Password:
#9RfH%raw.j]Wm[a
vCPU/s:
2 vCPUs
RAM:
4096.00 MB
Storage:
100 GB NVMe
Bandwidth:
0 GB
Label:
Cryptians
OS:
Ubuntu 25.10 x64
Auto Backups:
Not Enabled
```bash
ssh root@YOUR_SERVER_IP
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
su - deploy
```

## 2. Install Docker and Nginx

```bash
sudo apt install -y ca-certificates curl gnupg nginx
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy
newgrp docker

sudo systemctl enable nginx
sudo systemctl enable docker
```

Optional firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Do not expose Docker ports publicly. Only host Nginx should be reachable from the internet.

## 3. Cloudflare DNS

Create these records:

| Type | Name | Value | Proxy |
| --- | --- | --- | --- |
| A | `@` | `YOUR_VPS_IP` | On |
| A | `admin` | `YOUR_VPS_IP` | On |
| A | `api` | `YOUR_VPS_IP` | On |

Cloudflare SSL mode:

- `Full (strict)`
- `Always Use HTTPS` = On

Create a Cloudflare Origin Certificate for:

- `cryptians.store`
- `*.cryptians.store`

Store it on the server:

```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/cert.pem
sudo nano /etc/ssl/cloudflare/key.pem
sudo chmod 644 /etc/ssl/cloudflare/cert.pem
sudo chmod 600 /etc/ssl/cloudflare/key.pem
```

## 4. Upload the Repo

On the VPS:

```bash
cd /home/deploy
git clone YOUR_REPO_URL cryptians
cd cryptians
```

If the repo is already there:

```bash
cd /home/deploy/cryptians
git pull
```

## 5. Create the Two Production Env Files

This setup uses two different env files:

- `server/.env` -> backend secrets and runtime config
- `.deploy.env` -> compose-time values like frontend API origin and localhost port bindings

### 5.1 Create `.deploy.env`

```bash
cp .deploy.env.example .deploy.env
nano .deploy.env
```

Example:

```env
PUBLIC_API_ORIGIN=https://api.cryptians.store
CLIENT_GATEWAY_PORT=8080
ADMIN_GATEWAY_PORT=8081
SERVER_PORT=5000
```

### 5.2 Create `server/.env`

```bash
nano server/.env
```

Example template:

```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://cryptians.store,https://admin.cryptians.store

MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net
DBNAME=cryptians_prod

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_TO_A_LONG_RANDOM_VALUE

JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_VALUE
REFRESH_JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_VALUE
REFRESH_COOKIE_SECURE=true
REFRESH_COOKIE_SAME_SITE=none

R2_ACCOUNT_ID=YOUR_R2_ACCOUNT_ID
R2_ACCESS_KEY_ID=YOUR_R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY=YOUR_R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME=cryptians
R2_PUBLIC_URL=https://YOUR_PUBLIC_BUCKET_URL

SENDGRID_API_KEY=YOUR_SENDGRID_KEY
SENDGRID_FROM_EMAIL=noreply@cryptians.store

TWILIO_ACCOUNT_SID=YOUR_TWILIO_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_TOKEN
TWILIO_VERIFY_SERVICE_SID=YOUR_TWILIO_VERIFY_SID
TWILIO_PHONE_NUMBER=YOUR_TWILIO_NUMBER
```

Do not commit either file.

## 6. Build and Start the Containers

```bash
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml build
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml up -d
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml ps
```

Useful checks:

```bash
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml logs -f server
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml logs -f client
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml logs -f admin
curl http://127.0.0.1:5000/health
```

## 7. Configure Host Nginx

Create three host-level Nginx configs.

### 7.1 `cryptians.store`

```bash
sudo nano /etc/nginx/sites-available/cryptians.store
```

```nginx
server {
    listen 80;
    server_name cryptians.store www.cryptians.store;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cryptians.store www.cryptians.store;

    ssl_certificate     /etc/ssl/cloudflare/cert.pem;
    ssl_certificate_key /etc/ssl/cloudflare/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.2 `admin.cryptians.store`

```bash
sudo nano /etc/nginx/sites-available/admin.cryptians.store
```

```nginx
server {
    listen 80;
    server_name admin.cryptians.store;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.cryptians.store;

    ssl_certificate     /etc/ssl/cloudflare/cert.pem;
    ssl_certificate_key /etc/ssl/cloudflare/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.3 `api.cryptians.store`

```bash
sudo nano /etc/nginx/sites-available/api.cryptians.store
```

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name api.cryptians.store;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.cryptians.store;

    ssl_certificate     /etc/ssl/cloudflare/cert.pem;
    ssl_certificate_key /etc/ssl/cloudflare/key.pem;

    client_max_body_size 16M;

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable them:

```bash
sudo ln -sf /etc/nginx/sites-available/cryptians.store /etc/nginx/sites-enabled/cryptians.store
sudo ln -sf /etc/nginx/sites-available/admin.cryptians.store /etc/nginx/sites-enabled/admin.cryptians.store
sudo ln -sf /etc/nginx/sites-available/api.cryptians.store /etc/nginx/sites-enabled/api.cryptians.store
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Validate the Deployment

From your local machine:

```bash
curl -I https://cryptians.store
curl -I https://admin.cryptians.store
curl https://api.cryptians.store/health
```

Also test:

- client registration/login
- admin login
- file upload flow
- Socket.IO connections

## 9. Update Flow

When you change code:

```bash
cd /home/deploy/cryptians
git pull
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml build
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml up -d
```

Full rebuild without cache:

```bash
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml build --no-cache
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml up -d
```

## 10. Troubleshooting

### 502 Bad Gateway

Check:

```bash
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml ps
docker compose --env-file ./.deploy.env -f docker-compose.prod.yml logs -f server
sudo journalctl -u nginx -n 100 --no-pager
```

### Frontend loads but API calls fail

Check:

- `PUBLIC_API_ORIGIN` in `.deploy.env`
- `CLIENT_URL` in `server/.env`
- `https://api.cryptians.store/health`

### Socket.IO not connecting

Check:

- host Nginx has `Upgrade` and `Connection` headers on `api.cryptians.store`
- Cloudflare WebSockets is enabled
- browser console is hitting `https://api.cryptians.store`

### MongoDB connection timeout

Whitelist the VPS IP in MongoDB Atlas Network Access.

### Redis auth failure

Make sure `REDIS_PASSWORD` in `server/.env` matches the one Redis starts with inside compose.

## 11. Notes About This Repo

- The frontend Docker images build static assets, so API envs must be present during `docker compose build`.
- `client` and `admin` are static Vite apps served by Nginx containers.
- `server` is the only runtime API process and listens on port `5000`.
- The internal Docker gateway remains useful for frontend delivery, but API traffic is cleaner through direct proxying to `127.0.0.1:5000`.
