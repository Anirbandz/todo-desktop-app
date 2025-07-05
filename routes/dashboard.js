const express = require("express")
const router = express.Router()
const Todo = require('../models/Todo')
const auth = require('../middleware/auth')
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const User = require('../models/User');

// Get user data directory for uploads
function getUserDataPath() {
  const homeDir = os.homedir();
  const appDataDir = path.join(homeDir, 'Library', 'Application Support', 'TaskFlow');
  const uploadsDir = path.join(appDataDir, 'uploads', 'profile-pics');
  
  // Create directories if they don't exist
  fs.mkdirSync(uploadsDir, { recursive: true });
  
  return uploadsDir;
}

// Multer setup for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = getUserDataPath();
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user._id + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// Dashboard main page - requires authentication
router.get("/", auth, async (req, res) => {
  try {
    let tasks = [];
    let user = req.user;
    
    // Only show tasks for authenticated users, no mock data
    tasks = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.render("dashboard/index", {
      title: "Dashboard - TaskFlow",
      page: "dashboard",
      tasks: tasks,
      user: user
    })
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render("dashboard/index", {
      title: "Dashboard - TaskFlow",
      page: "dashboard",
      tasks: [],
      user: req.user
    })
  }
})

// Tasks page - requires authentication
router.get("/tasks", auth, async (req, res) => {
  try {
    let tasks = [];
    let user = req.user;
    
    // Only show tasks for authenticated users, no mock data
    tasks = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.render("dashboard/tasks", {
      title: "Tasks - TaskFlow",
      page: "tasks",
      tasks: tasks,
      user: user
    })
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).render("dashboard/tasks", {
      title: "Tasks - TaskFlow",
      page: "tasks",
      tasks: [],
      user: req.user
    })
  }
})

// Calendar page - requires authentication
router.get("/calendar", auth, async (req, res) => {
  try {
    let events = [];
    let user = req.user;
    
    // Get user's tasks as calendar events
    const tasks = await Todo.find({ user: req.user._id, dueDate: { $exists: true, $ne: null } });
    events = tasks.map(task => ({
      id: task._id,
      title: task.title,
      date: task.dueDate,
      description: task.description,
      priority: task.priority,
      completed: task.completed
    }));
    
    res.render("dashboard/calendar", {
      title: "Calendar - TaskFlow",
      page: "calendar",
      events: events,
      user: user
    })
  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).render("dashboard/calendar", {
      title: "Calendar - TaskFlow",
      page: "calendar",
      events: [],
      user: req.user
    })
  }
})

// Get calendar events (API endpoint)
router.get("/calendar/events", auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    let query = { user: req.user._id };
    
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Query for tasks that have either dueDate or createdAt within the range
      query.$or = [
        { 
          dueDate: { 
            $gte: startDate, 
            $lte: endDate 
          } 
        },
        { 
          createdAt: { 
            $gte: startDate, 
            $lte: endDate 
          } 
        }
      ];
    }
    
    const tasks = await Todo.find(query).sort({ createdAt: -1 });
    const events = tasks.map(task => {
      // Use dueDate if available, otherwise use createdAt
      const displayDate = task.dueDate || task.createdAt;
      
      return {
        id: task._id,
        title: task.title,
        date: displayDate,
        createdAt: task.createdAt,
        dueDate: task.dueDate,
        description: task.description,
        priority: task.priority,
        completed: task.completed
      };
    });
    
    res.json(events);
  } catch (error) {
    console.error('Calendar events error:', error);
    res.status(500).json({ error: 'Failed to load calendar events' });
  }
})

// Settings page - requires authentication
router.get("/settings", auth, (req, res) => {
  res.render("dashboard/settings", {
    title: "Settings - TaskFlow",
    page: "settings",
    user: req.user
  })
})

// Update profile
router.post("/settings/profile", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please login to update profile" });
    }
    
    const { name, email } = req.body;
    
    req.user.name = name;
    req.user.email = email;
    await req.user.save();
    
    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
})

// Update theme
router.post("/settings/theme", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please login to update theme" });
    }
    
    const { theme } = req.body;
    
    req.user.theme = theme;
    await req.user.save();
    
    res.json({ success: true, message: "Theme updated successfully" });
  } catch (error) {
    console.error('Theme update error:', error);
    res.status(500).json({ success: false, message: "Error updating theme" });
  }
})

// Upload profile picture
router.post("/settings/profile-picture", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please login to upload picture" });
    }
    
    // For now, we'll use a placeholder URL
    // In a real app, you'd upload to cloud storage
    const profilePicture = "https://via.placeholder.com/100x100/667eea/ffffff?text=" + req.user.name.charAt(0).toUpperCase();
    
    req.user.profilePicture = profilePicture;
    await req.user.save();
    
    res.json({ success: true, profilePicture: profilePicture });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ success: false, message: "Error uploading profile picture" });
  }
})

// Add task
router.post("/tasks", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please login to create tasks" });
    }
    
    const { title, description, priority, dueDate } = req.body;
    
    // Create the task with current timestamp
    const newTask = new Todo({
      user: req.user._id,
      title,
      description: description || '',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(), // Explicitly set current date
      completed: false
    });
    
    await newTask.save();
    res.redirect("/dashboard/tasks");
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ success: false, message: "Error creating task" });
  }
})

// Toggle task completion
router.post("/tasks/:id/toggle", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please login to update tasks" });
    }
    
    const task = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    
    task.completed = !task.completed;
    await task.save();
    
    res.json({ success: true, completed: task.completed });
  } catch (error) {
    console.error('Task toggle error:', error);
    res.status(500).json({ success: false, message: "Error updating task" });
  }
})

// Delete task
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    
    await Todo.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, message: "Error deleting task" });
  }
})

// Profile page (GET)
router.get('/profile', auth, (req, res) => {
  res.render('dashboard/profile', {
    title: 'Profile - TaskFlow',
    page: 'profile',
    user: req.user
  });
});

// Update profile picture
router.post('/profile/picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Create a file URL that can be served by Express
    const fileUrl = '/profile-pics/' + req.file.filename;
    req.user.profilePicture = fileUrl;
    await req.user.save();
    
    res.json({ success: true, profilePicture: req.user.profilePicture });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading profile picture' });
  }
});

// Update name
router.post('/profile/name', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    req.user.name = name;
    await req.user.save();
    res.json({ success: true, name });
  } catch (error) {
    console.error('Name update error:', error);
    res.status(500).json({ success: false, message: 'Error updating name' });
  }
});

// Update password
router.post('/profile/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    req.user.password = newPassword;
    await req.user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ success: false, message: 'Error updating password' });
  }
});

// Update theme
router.post('/profile/theme', auth, async (req, res) => {
  try {
    const { theme } = req.body;
    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({ success: false, message: 'Invalid theme' });
    }
    req.user.theme = theme;
    await req.user.save();
    res.json({ success: true, theme });
  } catch (error) {
    console.error('Theme update error:', error);
    res.status(500).json({ success: false, message: 'Error updating theme' });
  }
});

// Update task
router.put("/tasks/:id", auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    
    const task = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    
    // Update task fields
    task.title = title;
    task.description = description || '';
    task.priority = priority || 'medium';
    task.dueDate = dueDate ? new Date(dueDate) : null;
    task.updatedAt = new Date();
    
    await task.save();
    res.redirect("/dashboard/tasks");
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ success: false, message: "Error updating task" });
  }
})

// Serve profile pictures from user data directory
router.get('/profile-pics/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(getUserDataPath(), filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Profile picture serve error:', error);
    res.status(500).json({ error: 'Error serving file' });
  }
});

module.exports = router
