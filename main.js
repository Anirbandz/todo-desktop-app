const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const User = require('./models/User');
const fs = require('fs');
const os = require('os');
const { autoUpdater } = require('electron-updater');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const indexRoutes = require('./routes/index');

// Import models
const Todo = require('./models/Todo');

// Import middleware
const auth = require('./middleware/auth');
const adminAuth = require('./middleware/adminAuth');

let mainWindow;
let server;
let updateWindow;

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Set update server URL for GitHub releases
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'Anirbandz',
  repo: 'todo-desktop-app',
  private: false
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'TaskFlow'
  });

  // Load the app
  mainWindow.loadURL('http://localhost:3000');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createUpdateWindow() {
  updateWindow = new BrowserWindow({
    width: 400,
    height: 200,
    modal: true,
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Update Available',
    resizable: false,
    minimizable: false,
    maximizable: false
  });

  updateWindow.loadURL('data:text/html,<html><body><h2>Update Available</h2><p>Downloading update...</p></body></html>');
}

function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));

  // Serve user profile pictures from user data directory
  const userDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'TaskFlow', 'uploads', 'profile-pics');
  app.use('/profile-pics', express.static(userDataDir));

  app.use(session({
    secret: process.env.SESSION_SECRET || 'yGOCSPX-lX7AwmU-2Ln_lplSjsCQE9y-LvTc',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));
  
  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // View engine setup
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layout');

  // Passport configuration - Google OAuth removed for security

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Routes
  app.use('/', indexRoutes);
  app.use('/auth', authRoutes);
  app.use('/dashboard', dashboardRoutes);

  // Database connection
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow')
    .then(() => {
      console.log('Connected to MongoDB');
      server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
    });
}

// App event handlers
app.whenReady().then(() => {
  startServer();
  
  // Initialize auto-updater
  autoUpdater.checkForUpdatesAndNotify();
  
  // Wait for server to start before creating window
  setTimeout(() => {
    createWindow();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});

// IPC handlers for desktop-specific functionality
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-name', () => {
  return app.getName();
});

function getUserDataPath(email) {
  const userDataDir = app.getPath('userData');
  // Sanitize email for filename
  const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  return path.join(userDataDir, `user-${safeEmail}.json`);
}

function saveUserData(email, data) {
  const filePath = getUserDataPath(email);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadUserData(email) {
  const filePath = getUserDataPath(email);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
}

function clearUserSession(email) {
  const filePath = getUserDataPath(email);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    delete data.session;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

ipcMain.handle('save-user-data', async (event, email, data) => {
  try {
    const filePath = getUserDataPath(email);
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving user data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-user-data', async (event, email) => {
  try {
    const filePath = getUserDataPath(email);
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
});

ipcMain.handle('clear-user-session', async (event, email) => {
  try {
    const filePath = getUserDataPath(email);
    await fs.promises.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error clearing user session:', error);
    return { success: false, error: error.message };
  }
});

// Auto-updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error downloading update:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking' });
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'available', 
      version: info.version,
      releaseNotes: info.releaseNotes 
    });
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('No updates available');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'not-available' });
  }
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'error', 
      error: err.message 
    });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log('Download progress:', progressObj);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloading', 
      progress: progressObj 
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloaded', 
      version: info.version 
    });
  }
  
  // Show dialog to user
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'A new version has been downloaded. Restart the application to apply the update.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
}); 