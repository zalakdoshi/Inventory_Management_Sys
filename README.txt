============================================
  INVENTORY MANAGEMENT SYSTEM
  On-Premise Local Deployment Guide
  (Zero Install Database — 100% Offline)
============================================

REQUIREMENTS (install once on the server machine):
  1. Node.js v18+           → https://nodejs.org
  
  * Note: Unlike previous versions, you do NOT need to install MongoDB! 
    The database runs completely on SQLite via a local file (database.db).

--------------------------------------------
HOW TO START
--------------------------------------------
Just double-click:  start.bat

This will automatically:
  - Install npm packages (first time only)
  - Start the backend on http://localhost:5000
  - Start the frontend on http://localhost:5173
  - Open your browser to the login page

--------------------------------------------
DEFAULT LOGIN CREDENTIALS
--------------------------------------------
We have seeded a default administrator user for your first login:
  - Email: admin@vardhman.com
  - Password: admin123
  - Role: Admin

* Once logged in, you can create other users (admin, purchaser, salesman) from the Users page.

--------------------------------------------
FOLDER STRUCTURE
--------------------------------------------
deploy/
  client/        → React frontend source code
  server/        → Node.js backend source code
  server/database.db -> Created automatically (all data stored here)
  start.bat      → One-click startup script
  README.txt     → This file

--------------------------------------------
DATABASE & BACKUP (100% LOCAL)
--------------------------------------------
  - Uses SQLite database stored as a single file: deploy/server/database.db
  - NO internet or cloud databases required.
  - Your data NEVER leaves your machine.

  To backup your database:
  Simply copy the "database.db" file in deploy/server/ to an external drive.

  To restore:
  Copy your backup "database.db" file back to deploy/server/.

--------------------------------------------
RUNNING ON OTHER MACHINES (Same Network)
--------------------------------------------
To let other computers on your office network access the app:

1. Find this machine's IP address:
   Open Command Prompt (CMD) → type: ipconfig
   Look for "IPv4 Address" e.g. 192.168.1.10

2. Update client/.env:
   VITE_API_URL=http://192.168.1.10:5000/api

3. Update server/.env:
   FRONTEND_URL=http://192.168.1.10:5173

4. Rebuild the frontend:
   Open CMD in the client/ folder → run: npm run build

5. Other computers can open their browser and navigate to: http://192.168.1.10:5173

--------------------------------------------
STOPPING THE SERVER
--------------------------------------------
  Close the "Backend" and "Frontend" command prompt windows.

============================================
