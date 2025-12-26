# MongoDB Compass Guide

## Connecting to the Local MongoDB Instance

1. **Start the MongoDB Container** (if not already running):
   ```powershell
   docker start sok-research-mongodb-local
   ```

2. **Open MongoDB Compass** and connect to:
   ```
   mongodb://localhost:27017
   ```

3. **The database should appear** once it contains at least one document in a user collection.

## Why the Database Might Not Appear

MongoDB Compass only displays databases that:
- Have at least one document in a non-system collection
- Are not empty

If the `sok_research` database doesn't appear:

### Solution 1: Populate the Database

Run the seed script to populate the database with initial data:

```powershell
cd backend
npm run seed-papers
```

This will:
- Create tags and threat models
- Create papers with proper associations
- Make the database visible in Compass

### Solution 2: Refresh Compass

1. Click the **refresh button** (circular arrow) in MongoDB Compass
2. Or press **F5** to refresh
3. The database should appear in the left sidebar

### Solution 3: Check Database Status

In MongoDB Compass Shell (mongosh), you can verify:

```javascript
// List all databases
show dbs

// Use the database
use sok_research

// List collections
show collections

// Count documents in a collection
db.papers.countDocuments()
db.users.countDocuments()
db.tags.countDocuments()
db.threatmodels.countDocuments()
```

### Solution 4: Manually Create a Document

If you need to make the database visible immediately, you can insert a test document:

```javascript
use sok_research
db.papers.insertOne({ 
  title: "Test Paper", 
  authors: "Test Author",
  createdByUserId: null,
  createdAt: new Date() 
})
```

Then refresh Compass.

## Expected Collections

Once populated, the `sok_research` database should contain:

- `papers` - Research papers
- `users` - User accounts
- `tags` - Paper tags
- `threatmodels` - Threat models
- `notes` - User notes on papers
- `audit_logs` - System audit logs

## Troubleshooting

**Database appears in `show dbs` but not in Compass sidebar:**
- Refresh Compass (F5 or refresh button)
- Make sure there's at least one document in a collection
- Collections starting with `_` or `__` might not count as user collections

**Can't connect:**
- Verify the Docker container is running: `docker ps | findstr mongodb`
- Check connection string: `mongodb://localhost:27017`
- Try reconnecting in Compass
