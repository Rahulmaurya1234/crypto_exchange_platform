# Deployment Guide - Cryptians P2P Marketplace Backend

This guide covers deployment strategies for the Cryptians backend API across different environments.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Database Configuration](#database-configuration)
- [AWS Deployment](#aws-deployment)
- [Docker Deployment](#docker-deployment)
- [PM2 Process Management](#pm2-process-management)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Scaling Strategies](#scaling-strategies)
- [Rollback Procedures](#rollback-procedures)

## Environment Setup

### 1. Server Requirements

**Minimum Specifications:**
- CPU: 2 vCPUs
- RAM: 4GB
- Storage: 20GB SSD
- Network: 100 Mbps

**Recommended Specifications (Production):**
- CPU: 4+ vCPUs
- RAM: 8GB+
- Storage: 50GB+ SSD
- Network: 1 Gbps

### 2. Software Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x

# Install PM2 globally
sudo npm install -g pm2

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Database Configuration

### MongoDB Atlas Setup

1. **Create Cluster**
   ```
   - Go to https://cloud.mongodb.com
   - Create new project: "Cryptians Production"
   - Create cluster: M10 or higher for production
   - Region: Choose closest to your API server
   ```

2. **Network Access**
   ```
   - Add IP whitelist: Your server's IP
   - Or allow all (0.0.0.0/0) with strong credentials
   ```

3. **Database User**
   ```
   - Username: cryptians_api
   - Password: Generate strong password (min 32 chars)
   - Role: readWrite on cryptians_prod database
   ```

4. **Connection String**
   ```
   MONGO_URI=mongodb+srv://cryptians_api:<password>@cluster.xxxxx.mongodb.net/cryptians_prod?retryWrites=true&w=majority
   ```

### AWS DocumentDB Setup

1. **Create Cluster**
   ```bash
   aws docdb create-db-cluster \
     --db-cluster-identifier cryptians-prod-cluster \
     --engine docdb \
     --master-username admin \
     --master-user-password <strong-password> \
     --vpc-security-group-ids sg-xxxxx \
     --db-subnet-group-name cryptians-subnet-group
   ```

2. **Create Instance**
   ```bash
   aws docdb create-db-instance \
     --db-instance-identifier cryptians-prod-instance \
     --db-instance-class db.r5.large \
     --engine docdb \
     --db-cluster-identifier cryptians-prod-cluster
   ```

3. **Download Certificate**
   ```bash
   wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O ./config/rds-combined-ca-bundle.pem
   ```

4. **Connection String**
   ```
   AWS_DOCUMENTDB_URI=mongodb://admin:<password>@cryptians-prod-cluster.cluster-xxxxx.us-east-1.docdb.amazonaws.com:27017/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
   ```

### Redis Configuration

#### Option 1: AWS ElastiCache

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id cryptians-redis-prod \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --num-cache-nodes 1 \
  --port 6379
```

Environment variables:
```env
REDIS_HOST=cryptians-redis-prod.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=<auth-token>
```

#### Option 2: Redis Cloud

1. Go to https://redis.com/try-free/
2. Create database
3. Copy connection details

## AWS Deployment

### Option 1: EC2 Deployment

#### 1. Launch EC2 Instance

```bash
# Launch instance (Ubuntu 22.04)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name cryptians-prod-key \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Cryptians-API-Prod}]'
```

#### 2. Connect to Instance

```bash
ssh -i cryptians-prod-key.pem ubuntu@<ec2-public-ip>
```

#### 3. Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/your-org/cryptians-backend.git
cd cryptians-backend/server

# Install dependencies
npm ci --only=production

# Create environment file
nano .env.production
# Paste your production environment variables

# Set up logs directory
mkdir -p logs
chmod 755 logs
```

#### 4. Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command that PM2 outputs

# Monitor
pm2 monit
```

#### 5. Configure Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cryptians-api
```

Nginx configuration:
```nginx
upstream cryptians_backend {
    least_conn;
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
    server 127.0.0.1:5003;
}

server {
    listen 80;
    server_name api.cryptians.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.cryptians.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.cryptians.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.cryptians.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/cryptians-access.log;
    error_log /var/log/nginx/cryptians-error.log;

    # Client upload size
    client_max_body_size 16M;

    # Proxy settings
    location / {
        proxy_pass http://cryptians_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://cryptians_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://cryptians_backend;
        access_log off;
    }
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/cryptians-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: ECS (Elastic Container Service)

#### 1. Create ECR Repository

```bash
aws ecr create-repository --repository-name cryptians-api
```

#### 2. Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t cryptians-api:latest .

# Tag image
docker tag cryptians-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/cryptians-api:latest

# Push image
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/cryptians-api:latest
```

#### 3. Create ECS Task Definition

Create `ecs-task-definition.json`:
```json
{
  "family": "cryptians-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "cryptians-api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/cryptians-api:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "5000"}
      ],
      "secrets": [
        {"name": "MONGO_URI", "valueFrom": "arn:aws:secretsmanager:us-east-1:xxx:secret:cryptians/mongo-uri"},
        {"name": "JWT_ACCESS_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:xxx:secret:cryptians/jwt-access"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cryptians-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:
```bash
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

#### 4. Create ECS Service

```bash
aws ecs create-service \
  --cluster cryptians-cluster \
  --service-name cryptians-api-service \
  --task-definition cryptians-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/cryptians-api-tg,containerName=cryptians-api,containerPort=5000"
```

## Docker Deployment

### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/your-org/cryptians-backend.git
cd cryptians-backend/server

# Create production environment file
nano .env.production

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f api

# Scale API instances
docker-compose up -d --scale api=4
```

### Production docker-compose.prod.yml

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  api:
    restart: always
    env_file: .env.production
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    networks:
      - cryptians-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## PM2 Process Management

### Advanced PM2 Configuration

Update `ecosystem.config.js` for production:

```javascript
module.exports = {
    apps: [
        {
            name: "cryptians-api",
            script: "src/index.js",
            instances: "max",
            exec_mode: "cluster",
            env_production: {
                NODE_ENV: "production",
                PORT: 5000,
            },
            error_file: "./logs/pm2-error.log",
            out_file: "./logs/pm2-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            instance_var: "INSTANCE_ID",
            kill_timeout: 5000,
            listen_timeout: 10000,
            shutdown_with_message: true,
            max_restarts: 10,
            min_uptime: "10s",
        },
    ],
};
```

### PM2 Commands

```bash
# Start
pm2 start ecosystem.config.js --env production

# Restart gracefully
pm2 reload ecosystem.config.js

# Stop
pm2 stop cryptians-api

# Delete
pm2 delete cryptians-api

# Monitor
pm2 monit

# Logs
pm2 logs cryptians-api --lines 100

# Flush logs
pm2 flush

# Status
pm2 status

# Info
pm2 info cryptians-api

# Save current process list
pm2 save

# Resurrect saved processes
pm2 resurrect
```

## SSL/TLS Configuration

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d api.cryptians.com

# Auto-renewal
sudo certbot renew --dry-run

# Set up cron job for auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Using AWS Certificate Manager

```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.cryptians.com \
  --validation-method DNS \
  --subject-alternative-names *.cryptians.com

# Validate via DNS
# Add CNAME records to Route53 as instructed

# Attach to Load Balancer
aws elbv2 add-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:...
```

## Monitoring & Logging

### CloudWatch Integration

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json
```

### PM2 Monitoring

```bash
# Install PM2 Plus
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Link to PM2 Plus
pm2 link <secret-key> <public-key>
```

### Log Rotation

Create `/etc/logrotate.d/cryptians`:
```
/home/ubuntu/cryptians-backend/server/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Scaling Strategies

### Horizontal Scaling

#### With PM2
```bash
# Scale to specific number of instances
pm2 scale cryptians-api 8

# Scale up by 2
pm2 scale cryptians-api +2

# Scale down by 1
pm2 scale cryptians-api -1
```

#### With Docker
```bash
# Scale to 6 containers
docker-compose up -d --scale api=6
```

#### With ECS
```bash
# Update service desired count
aws ecs update-service \
  --cluster cryptians-cluster \
  --service cryptians-api-service \
  --desired-count 10
```

### Vertical Scaling

```bash
# Upgrade EC2 instance type
aws ec2 modify-instance-attribute \
  --instance-id i-xxxxx \
  --instance-type t3.xlarge

# Restart instance
aws ec2 stop-instances --instance-ids i-xxxxx
aws ec2 start-instances --instance-ids i-xxxxx
```

### Auto Scaling

#### ECS Auto Scaling
```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/cryptians-cluster/cryptians-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/cryptians-cluster/cryptians-api-service \
  --policy-name cryptians-api-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Rollback Procedures

### PM2 Rollback

```bash
# Keep previous version
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# If rollback needed
git checkout v1.0.0
npm ci --only=production
pm2 reload ecosystem.config.js
```

### Docker Rollback

```bash
# Tag images with versions
docker tag cryptians-api:latest cryptians-api:v1.0.0

# Rollback to previous version
docker pull <ecr-repo>:v1.0.0
docker-compose down
docker-compose up -d
```

### ECS Rollback

```bash
# Update service to use previous task definition revision
aws ecs update-service \
  --cluster cryptians-cluster \
  --service cryptians-api-service \
  --task-definition cryptians-api:5  # Previous revision
```

## Health Checks

### Application Health Check

```bash
# Manual check
curl https://api.cryptians.com/health

# Automated monitoring with cron
*/5 * * * * curl -f https://api.cryptians.com/health || echo "API Down" | mail -s "API Health Check Failed" admin@cryptians.com
```

### Database Health Check

```bash
# MongoDB
mongosh "mongodb+srv://..." --eval "db.adminCommand('ping')"

# Redis
redis-cli -h <host> -p 6379 -a <password> ping
```

## Backup Procedures

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out=/backup/mongodb-$(date +%Y%m%d)

# Upload to S3
aws s3 sync /backup/mongodb-$(date +%Y%m%d) s3://cryptians-backups/mongodb/$(date +%Y%m%d)

# Automate with cron
0 2 * * * /home/ubuntu/scripts/backup-mongodb.sh
```

### Application Backup

```bash
# Backup code and configs
tar -czf /backup/cryptians-app-$(date +%Y%m%d).tar.gz \
  /home/ubuntu/cryptians-backend/server \
  --exclude node_modules \
  --exclude logs

# Upload to S3
aws s3 cp /backup/cryptians-app-$(date +%Y%m%d).tar.gz s3://cryptians-backups/app/
```

## Troubleshooting

### Common Issues

**API not responding**
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs cryptians-api --lines 50

# Restart
pm2 restart cryptians-api
```

**Database connection issues**
```bash
# Test MongoDB connection
mongosh "mongodb://..." --eval "db.runCommand({ping:1})"

# Check network
telnet <db-host> 27017
```

**High memory usage**
```bash
# Check PM2 memory
pm2 monit

# Restart with memory cleanup
pm2 reload cryptians-api
```

**Redis connection issues**
```bash
# Test connection
redis-cli -h <host> -p 6379 -a <password> ping

# Check memory
redis-cli -h <host> -p 6379 -a <password> INFO memory
```

---

## Support

For deployment issues, contact: devops@cryptians.com
