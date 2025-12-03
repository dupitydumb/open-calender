# MongoDB Atlas Setup Instructions

This guide will help you set up MongoDB Atlas cloud database for your calendar application.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (no credit card required)
3. Verify your email address

## Step 2: Create a New Cluster

1. After logging in, click **"Build a Database"**
2. Choose **"M0 FREE"** tier (includes 512MB storage)
3. Select your preferred cloud provider and region
4. Click **"Create Cluster"**
5. Wait for the cluster to be created (takes 1-3 minutes)

## Step 3: Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Enter a username (e.g., `calendar-app-user`)
5. Click **"Autogenerate Secure Password"** and **copy the password**
6. Set user privileges to **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Configure Network Access

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - **Note**: For production, restrict to specific IP addresses
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Click **"Drivers"**
4. Select **"Node.js"** and latest version
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Configure Your Application

1. Open the `.env.local` file in your project root
2. Replace the placeholder with your actual connection string:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/calendar-app?retryWrites=true&w=majority
   ```
3. Replace `<username>` with your database username
4. Replace `<password>` with the password you copied
5. Add `/calendar-app` before the query parameters to specify the database name

**Example:**
```env
MONGODB_URI=mongodb+srv://calendar-app-user:MySecurePassword123@cluster0.abc123.mongodb.net/calendar-app?retryWrites=true&w=majority
```

## Step 7: Start Your Application

1. Make sure MongoDB URI is correctly set in `.env.local`
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)
4. The app will automatically connect to MongoDB Atlas

## Step 8: Migrate Existing Data (Optional)

If you have existing events in localStorage, you can migrate them:

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Run this script to migrate your data:
   ```javascript
   fetch('/api/migrate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       events: JSON.parse(localStorage.getItem('calendar-events') || '[]')
     })
   })
   .then(res => res.json())
   .then(data => console.log('Migration result:', data))
   .catch(err => console.error('Migration failed:', err));
   ```
4. Check the console for migration results
5. Refresh the page to see your migrated events

## Verify Connection

To verify your MongoDB connection is working:

1. Check the terminal where `npm run dev` is running
2. Look for the message: **"✅ MongoDB connected successfully"**
3. Create a new event in the calendar app
4. Go to MongoDB Atlas Dashboard → Database → Browse Collections
5. You should see your `calendar-app` database with an `events` collection

## Troubleshooting

### "MongoServerError: bad auth"
- Double-check username and password in connection string
- Ensure password is URL-encoded (replace special characters)
- Verify database user exists in "Database Access"

### "MongooseError: Operation buffering timed out"
- Check that your IP is whitelisted in "Network Access"
- Try adding 0.0.0.0/0 for development
- Verify internet connection

### "Cannot connect to MongoDB"
- Ensure `.env.local` file exists in project root
- Restart the development server after changing `.env.local`
- Check that connection string format is correct

### "Failed to load events"
- Open browser DevTools → Network tab
- Check if `/api/events` request returns 500 error
- Look at terminal for MongoDB connection errors

## Security Best Practices

1. **Never commit `.env.local` to Git** (already in `.gitignore`)
2. **Use environment variables** for production deployment
3. **Restrict IP access** in production (not 0.0.0.0/0)
4. **Rotate passwords** regularly
5. **Use different credentials** for development and production

## Free Tier Limitations

MongoDB Atlas M0 (Free) tier includes:
- 512 MB storage
- Shared RAM
- Suitable for development and small projects
- No credit card required

For production apps with more users, consider upgrading to M10+ paid tiers.

## Next Steps

- ✅ MongoDB Atlas configured
- ✅ Calendar app connected to cloud database
- ✅ Events persist across browser sessions
- ✅ Data accessible from any device with your deployment

Your calendar events are now stored in MongoDB Atlas cloud! 🎉
