# Calendar App

A modern, feature-rich calendar application built with Next.js, React, TypeScript, and MongoDB Atlas. This app allows you to create, edit, and manage events with a beautiful and intuitive interface.

## Features

- 📅 **Weekly Calendar View** - Navigate through weeks with keyboard shortcuts
- ✨ **Event Management** - Create, edit, and delete events with ease
- 🎨 **Color-Coded Events** - Organize events with customizable colors
- 💾 **Cloud Storage** - Events stored in MongoDB Atlas for persistence
- ⌨️ **Keyboard Shortcuts** - Quick navigation and actions (Arrow keys, N for new event, etc.)
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🔍 **Search & Filter** - Find events quickly with search functionality
- 🌙 **Modern UI** - Built with Tailwind CSS and shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: MongoDB Atlas
- **State Management**: React Hooks
- **API**: Next.js API Routes

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- MongoDB Atlas account (free tier available)
- Git installed

## Clone and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/dupitydumb/open-calender.git
cd open-calender
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure MongoDB Atlas

Follow the detailed instructions in [MONGODB_SETUP.md](./MONGODB_SETUP.md) to:
- Create a free MongoDB Atlas account
- Set up a cluster
- Get your connection string

### 4. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Then edit `.env.local` and add your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/calendar-app?retryWrites=true&w=majority
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin master
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Add environment variable:
     - Name: `MONGODB_URI`
     - Value: Your MongoDB connection string
   - Click "Deploy"

3. **Your app is live!** Vercel will provide a URL like `https://your-app.vercel.app`

### Deploy to Netlify

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Install Netlify CLI: `npm install -g netlify-cli`
   - Run: `netlify deploy --prod`
   - Follow the prompts
   - Set environment variable `MONGODB_URI` in Netlify dashboard

### Deploy to Your Own Server

1. **Build the production app**:
   ```bash
   npm run build
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Use a process manager** (recommended):
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start the app
   pm2 start npm --name "calendar-app" -- start
   
   # Save the process list
   pm2 save
   
   # Set up PM2 to start on system boot
   pm2 startup
   ```

4. **Configure Nginx** (optional, for reverse proxy):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Set environment variables** on your server:
   ```bash
   export MONGODB_URI="your-mongodb-connection-string"
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |

## Project Structure

```
calendar-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── events/        # Event CRUD operations
│   │   └── migrate/       # Data migration endpoint
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── CalendarApp.tsx   # Main calendar component
│   ├── CalendarGrid.tsx  # Calendar grid view
│   └── ...               # Other components
├── lib/                  # Utility functions
│   ├── mongodb.ts        # MongoDB connection
│   └── utils.ts          # Helper functions
├── models/               # MongoDB models
│   └── Event.ts          # Event schema
├── types/                # TypeScript types
│   └── event.ts          # Event type definitions
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Keyboard Shortcuts

- `←/→` - Navigate between weeks
- `N` - Create new event
- `?` - Show keyboard shortcuts help
- `Esc` - Close dialogs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For detailed MongoDB setup instructions, see [MONGODB_SETUP.md](./MONGODB_SETUP.md).

For issues and questions, please open an issue on GitHub.
