# Viewing the Database in MongoDB Compass

## Database Name
Your SoK Research Dashboard uses the database: **`sok_research`**

## Connecting to MongoDB (Running in Docker)

Since MongoDB is running in Docker, you can connect to it directly:

1. **Open MongoDB Compass**
   - Click "New Connection" or use the connection string field

2. **Connection String**
   - Enter: `mongodb://localhost:27017`
   - OR click "Fill in connection fields individually" and use:
     - **Host:** `localhost`
     - **Port:** `27017`
   - Click **"Connect"**

3. **Verify MongoDB is Running**
   ```powershell
   docker ps | Select-String mongo
   ```
   You should see `sok-research-mongodb-local` container running

## How to View the Database

1. **Look for the Database**
   - After connecting, you'll see a list of databases
   - Scroll through the database list
   - Look for **`sok_research`**

2. **If the Database Doesn't Appear**
   - Click the **Refresh** button (circular arrow icon) in MongoDB Compass
   - Make sure your backend server is running (it creates the database on first connection)
   - The database is created automatically when data is first written
   - If you haven't registered any users or added papers yet, the database won't exist

3. **View Collections**
   - Click on **`sok_research`** to expand it
   - You should see these collections:
     - **`users`** - User accounts and authentication data
     - **`papers`** - Research papers
     - **`notes`** - Notes on papers
     - **`audit_logs`** - Audit trail of actions

4. **Browse Data**
   - Click on any collection name to view its documents
   - Use the filter/search bar to query specific data
   - Click on any document to view/edit its JSON

## Connection String Details
The database connection is configured as:
- **Connection:** `mongodb://localhost:27017` (from Docker container)
- **Database:** `sok_research`
- **Full URI:** `mongodb://localhost:27017/sok_research`
- **Docker Container:** `sok-research-mongodb-local` (port 27017 exposed)

## Troubleshooting

**Can't connect to MongoDB?**
- Check if Docker container is running: `docker ps`
- Check if port 27017 is accessible: The container should show `0.0.0.0:27017->27017/tcp`
- Try restarting the container: `docker start sok-research-mongodb-local`

**Database not showing?**
- Ensure your backend server is running (it creates the database on first connection)
- Check backend console logs for "Connected to MongoDB" message
- Refresh MongoDB Compass view (click the refresh button)
- The database is only created when data is first written - register a user or add a paper first

**Can't see collections?**
- Collections are created when first document is inserted
- If you just started the app, you may need to:
  1. Register a user (creates `users` collection)
  2. Add a paper (creates `papers` collection)
  3. Add a note (creates `notes` collection)

