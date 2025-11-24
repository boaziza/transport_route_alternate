# Rwanda Transport Route Planner
---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [API Documentation](#api-documentation)
- [Local Setup](#local-setup)
- [Deployment Guide](#deployment-guide)
- [Testing](#testing)
- [Challenges & Solutions](#challenges--solutions)
- [Credits](#credits)

---

## Overview

A web-based route planning application specifically designed for Rwanda's transportation network. The application integrates OpenRouteService API to provide intelligent geocoding, route calculation, and interactive map visualization for users planning journeys within Rwanda.

**Purpose:** This application addresses the practical need for accurate route planning in Rwanda, helping users:
- Find optimal routes between any two locations
- Compare different transport modes (driving, cycling, walking)
- Visualize routes on an interactive map
- Get accurate distance and time estimates

**Value Proposition:** Unlike generic route planners, this application is optimized for Rwanda's geography and provides localized search results within the country.

---

## Features

### Core Functionality
- **Intelligent Location Search**
  - Autocomplete geocoding with dropdown suggestions
  - Handles ambiguous location names
  - Shows multiple matches for user selection
  - Rwanda-specific search optimization

- **Multi-Modal Route Planning**
  - Driving (Car)
  - Driving (Heavy Goods Vehicle)
  - Cycling
  - Walking

- **Route Preferences**
  - Fastest route
  - Shortest distance
  - Recommended (balanced)

- **Interactive Map Visualization**
  - Real-time route rendering using Leaflet.js
  - Custom markers for start (green) and destination (red)
  - Automatic map centering and zoom
  - Route polyline with distance/duration overlay

### User Interaction Features
- **Search & Filter:** Type-ahead location search with 500ms debouncing
- **Selection:** Click-to-select from geocoding results
- **Visualization:** Interactive map with pan and zoom capabilities
- **Data Display:** Clear presentation of route distance and estimated duration

---

## 🛠️ Technology Stack

### Backend
```javascript
{
  "runtime": "Node.js v18.x",
  "framework": "Express.js v4.18",
  "dependencies": {
    "axios": "^1.6.0",        // HTTP client for API calls
    "cors": "^2.8.5",          // Cross-origin resource sharing
    "@mapbox/polyline": "^1.2.0", // Geometry decoding
    "dotenv": "^16.3.1"        // Environment variable management
  }
}
```

### Frontend
```javascript
{
  "mapping": "Leaflet.js v1.9",
  "styling": "Custom CSS with responsive design",
  "scripting": "Vanilla JavaScript (ES6+)"
}
```

### Deployment Infrastructure
- **Web Servers:**
- **Process Manager:** 
- **Load Balancer:** 

---

## 🔌 API Documentation

### OpenRouteService API v2

**Official Documentation:** https://openrouteservice.org/dev/

**Endpoints Used:**

1. **Geocode Search API**
   - **Endpoint:** `GET /geocode/search`
   - **Purpose:** Convert location names to coordinates
   - **Rate Limit:** 1000 requests/day (free tier)
   - **Parameters:**
     - `api_key`: Authentication token
     - `text`: Search query
     - `size`: Number of results (5)
   
2. **Directions API v2**
   - **Endpoint:** `POST /v2/directions/{profile}`
   - **Purpose:** Calculate routes between coordinates
   - **Rate Limit:** 2000 requests/day (free tier)
   - **Profiles:** driving-car, driving-hgv, cycling-regular, foot-walking
   - **Preferences:** fastest, shortest, recommended

**API Key Management:**
- Stored in `.env` file (not committed to repository)
- Accessed via `process.env.ORS_API_KEY`
- Never exposed in frontend code

**Attribution:**
> This application uses the OpenRouteService API. OpenRouteService is maintained by HeiGIT at Heidelberg University. For more information visit: https://openrouteservice.org/

---

## 💻 Local Setup

### Prerequisites
```bash
# Required software:
- Node.js >= 18.x
- npm >= 9.x
- Git
```

### Installation Steps

1. **Clone Repository**
```bash
git clone https://github.com/boaziza/transport_route_alternate.git
cd transport_route_alternate
```

2. **Install Dependencies**
```bash
# Backend dependencies
npm install
```

3. **Configure Environment Variables**
```bash
# Create .env file in root directory
touch .env

# Add your OpenRouteService API key:
echo "PORT=3000" >> .env
echo "ORS_API_KEY=your_api_key_here" >> .env
echo "NODE_ENV=development" >> .env
```

**To get an API key:**
1. Visit https://openrouteservice.org/dev/
2. Sign up for a free account
3. Navigate to Dashboard → API Keys
4. Copy your key and paste in `.env`

4. **Start the Application**
```bash
# Development mode
node server.js

# Application will run on http://localhost:3000
```

5. **Access the Application**
- Open browser: `http://localhost:3000`
- Enter locations and plan your route!

---

## 🚀 Deployment Guide

### Architecture Overview
```
Internet
    ↓
Load Balancer (Nginx on Lb01)
    ↓
   ┌──────┴──────┐
   ↓             ↓
Web01          Web02
(Backend)      (Backend)
Port 3000      Port 3000
```

### Server Information
- **Web02:** 34.227.160.138
- **Load Balancer:** [Lb01 IP]

### Deployment Process

#### Step 1: Web Server Setup (Web02)

**1.1 Connect to Server**
```bash
ssh ubuntu@34.227.160.138
```

**1.2 System Update**
```bash
sudo apt update && sudo apt upgrade -y
```

**1.3 Install Node.js**
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install Node.js and npm
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x or higher
npm --version   # Should show v9.x or higher
```

**1.4 Create Application Directory**
```bash
sudo mkdir -p /var/www/ors-app
sudo chown -R ubuntu:ubuntu /var/www/ors-app
cd /var/www/ors-app
```

**1.5 Deploy Application Files**
```bash
# Clone repository
git clone https://github.com/boaziza/transport_route_alternate.git .

# Or use SCP from local machine:
# scp -r * ubuntu@34.227.160.138:/var/www/ors-app/
```

**1.6 Configure Environment**
```bash
# Create .env file
nano .env
```

Add the following:
```env
PORT=3000
ORS_API_KEY=your_actual_api_key_here
NODE_ENV=production
SERVER_NAME=WEB02
```

**1.7 Install Dependencies**
```bash
npm install
```

**1.8 Install PM2 Process Manager**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start server.js --name ors-app

# Save PM2 configuration
pm2 save

# Configure auto-start on server reboot
pm2 startup
# Copy and execute the command it outputs
```

**1.9 Configure Firewall**
```bash
# Allow application port
sudo ufw allow 3000/tcp

# Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status
```

**1.10 Verify Deployment**
```bash
# Check PM2 status
pm2 status

# Test endpoint locally
curl http://localhost:3000/api/geocode/search?query=Kigali

# Expected output: JSON with Kigali location results
```

#### Step 2: Load Balancer Configuration (Lb01)

**2.1 Connect to Load Balancer**
```bash
ssh ubuntu@3.87.59.198
```

**2.2 Install Nginx**
```bash
sudo apt update
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

**2.3 Create Load Balancer Configuration**
```bash
sudo nano /etc/nginx/sites-available/ors-loadbalancer
```

Add configuration:
```nginx
upstream ors_backend {
    # Backend servers
    server 34.227.160.138:3000 max_fails=3 fail_timeout=30s;
    # Web01 would be added here when available
}

server {
    listen 80;
    server_name 3.87.59.198;

    # Increase timeouts for API calls
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://ors_backend;
        proxy_http_version 1.1;
        
        # Forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**2.4 Enabled Configuration**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ors-loadbalancer /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If successful, reload Nginx
sudo systemctl reload nginx
```

**2.5 Configure Firewall**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## Testing

### Local Testing (What I did)

**Tested Backend:**
```bash
# Test geocoding
curl "http://localhost:3000/api/geocode/search?query=Kigali"

# Test routing
curl "http://localhost:3000/api/route?fromLon=30.06&fromLat=-1.95&toLon=29.87&toLat=-2.61&fromName=Kigali&toName=Huye"
```

**Tested Frontend:**
**Steps I took**
1. Open browser: `http://localhost:3000`
2. Type "Kigali" in FROM field
3. Select from dropdown
4. Type "Huye" in TO field
5. Select from dropdown
6. Click "Search Route"
7. Verify route displays on map

### Production Testing (deployment testing)

**Tested individual server:**
```bash
curl http://34.227.160.138:3000/api/geocode/search?query=Kigali
```

**Tested Load Balancer:**
```bash
# Multiple requests to verify distribution
for i in {1..10}; do
  curl http://[LB_IP]/api/geocode/search?query=Kigali
  echo "---"
done
```

**Tested in Browser:**
- Navigated to `http://3.87.59.198`
- Performed route search
- Checked browser console for errors
- Verified map renders correctly

### Test Results

**Backend Endpoints:**
- `/api/geocode/search` - Working
- `/api/route` - Working
- Error handling - Implemented

**Frontend:**
- Location autocomplete - Working
- Map visualization - Working
- Route rendering - Working
- Responsive design - Working

**Deployment:**
- Web02 deployed and running
- Web01 deployment pending (access issue)
- Load balancer configured
- Full redundancy not yet achieved

---

## Challenges & Solutions

### Challenge 1: Geocoding API Rate Limits

**Problem:** Initial implementation made API calls on every keystroke, quickly exhausting rate limits.

**Solution:** Implemented 500ms debouncing to reduce API calls:
```javascript
let searchTimeout;
input.addEventListener('input', function() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performGeocodeSearch(query);
  }, 500);
});
```

**Result:** Reduced API calls by ~80%, improved user experience.

### Challenge 2: Coordinate Format Mismatch

**Problem:** OpenRouteService returns coordinates as `[lon, lat]` but Leaflet expects `[lat, lon]`.

**Solution:** Implemented coordinate conversion in rendering:
```javascript
const latLngs = coords.map(c => [c[1], c[0]]);
```

**Result:** Routes now render correctly on map.

### Challenge 3: Polyline Encoding

**Problem:** Route geometry returned as encoded polyline string, not coordinates array.

**Solution:** Used `@mapbox/polyline` library to decode:
```javascript
const decodedGeometry = polyline.decode(route.geometry);
const coordinates = decodedGeometry.map(coord => [coord[1], coord[0]]);
```

**Result:** Smooth route visualization on map.

### Challenge 4: CORS Issues During Development

**Problem:** Frontend couldn't access backend API due to CORS restrictions.

**Solution:** Configured CORS middleware in Express:
```javascript
const cors = require('cors');
app.use(cors());
```

**Result:** Frontend-backend communication works seamlessly.

### Challenge 5: Web01 Server Access

**Problem:** Unable to establish SSH connection to Web01 server for deployment.

**Attempted Solutions:**
1. Verified credentials from assignment portal
2. Tested connection from multiple networks
3. Contacted technical support

**Current Status:** 
- Documented issue with evidence
- Proceeded with Web02 deployment
- Awaiting resolution from facilitator

**Impact:** 
- Unable to fully demonstrate load balancing capabilities
- 50% of intended server deployment incomplete

---

## 📚 What I Learned

### Technical Skills
1. **API Integration:** Understanding rate limits, authentication, and data format handling
2. **Load Balancing:** Nginx configuration for traffic distribution
3. **Process Management:** PM2 for production Node.js deployments
4. **Deployment:** Server provisioning, security, and configuration management

### Problem-Solving
- Debugging coordinate system mismatches
- Optimizing API usage with debouncing
- Managing environment variables securely

---

## Credits & Attribution

### APIs & Services
- **OpenRouteService:** Route calculation and geocoding  
  https://openrouteservice.org/  
  © HeiGIT at Heidelberg University

### Libraries & Frameworks
- **Express.js:** Backend framework - https://expressjs.com/
- **Axios:** HTTP client - https://axios-http.com/
- **Leaflet.js:** Interactive maps - https://leafletjs.com/
- **PM2:** Process manager - https://pm2.keymetrics.io/

### Resources
- **OpenStreetMap:** - https://www.openstreetmap.org/
- **Node.js Documentation:** https://nodejs.org/
- **Nginx Documentation:** https://nginx.org/

---

## Repository & Video

**GitHub Repository:** https://github.com/boaziza/transport_route_alternate  
**Demo Video:** [Your Video Link Here]

---

## 📄 License

This project is created for educational purposes as part of [Course Name].  
All API usage complies with respective terms of service.