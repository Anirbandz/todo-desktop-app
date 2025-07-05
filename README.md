# TaskFlow Desktop App

A modern desktop todo application built with Electron and Express with Google OAuth authentication.

## Features

- **Cross-platform**: Works on Windows, macOS, and Linux
- **Modern UI**: Clean and intuitive interface with dark/light theme support
- **User Authentication**: Google OAuth integration for secure login
- **User-Specific Tasks**: Each user sees only their own tasks
- **Task Management**: Create, edit, complete, and delete tasks
- **Profile Management**: Update profile picture, name, and theme preferences
- **Calendar Integration**: View tasks in calendar format
- **Responsive Design**: Adapts to different screen sizes
- **Real-time Updates**: Tasks update instantly across the app

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or cloud instance)
- Google OAuth credentials (for authentication)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd todo-desktop-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/taskflow
SESSION_SECRET=your-super-secret-session-key
PORT=3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

4. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/auth/google/callback` to authorized redirect URIs
   - Copy Client ID and Client Secret to your `.env` file

5. Start the development server:
```bash
npm run dev
```

6. Build the desktop app:
```bash
npm run build
```

## Features in Detail

### Authentication
- **Google OAuth**: Secure login with Google account
- **Session Management**: Persistent login sessions
- **Logout**: Secure logout functionality

### Task Management
- **Create Tasks**: Add new tasks with title, description, priority, and due date
- **Complete Tasks**: Mark tasks as completed with visual feedback
- **Delete Tasks**: Remove tasks with confirmation
- **User-Specific**: Each user only sees their own tasks
- **Real-time Updates**: Changes reflect immediately

### Profile Management
- **Profile Picture**: Upload and change profile pictures
- **Name Updates**: Change display name
- **Theme Preferences**: Switch between light and dark themes
- **Settings Persistence**: All settings saved to database

### UI/UX Features
- **Dark/Light Theme**: Toggle between themes
- **Responsive Design**: Works on all screen sizes
- **Modern Interface**: Clean, intuitive design
- **Visual Feedback**: Loading states and success messages

## Development

- `npm run dev` - Start development server
- `npm run electron` - Start Electron app
- `npm run build` - Build desktop app
- `npm run dist` - Create distributable packages

## Project Structure

```
todo-desktop-app/
├── main.js              # Electron main process
├── preload.js           # Preload script for security
├── package.json         # Project configuration
├── views/               # EJS templates
│   ├── layout.ejs       # Main layout template
│   ├── auth/            # Authentication pages
│   └── dashboard/       # Dashboard pages
├── public/              # Static assets
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript files
│   └── images/          # Images and icons
├── routes/              # Express routes
│   ├── auth.js          # Authentication routes
│   ├── dashboard.js     # Dashboard routes
│   └── index.js         # Main routes
├── models/              # MongoDB models
│   ├── User.js          # User model with OAuth support
│   └── Todo.js          # Task model
├── middleware/          # Express middleware
└── config/              # Configuration files
```

## API Endpoints

### Authentication
- `GET /auth/login` - Login page
- `GET /auth/signup` - Signup page
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/logout` - Logout

### Dashboard
- `GET /dashboard` - Main dashboard
- `GET /dashboard/tasks` - Tasks page
- `GET /dashboard/calendar` - Calendar page
- `GET /dashboard/settings` - Settings page

### Tasks
- `POST /dashboard/tasks` - Create new task
- `POST /dashboard/tasks/:id/toggle` - Toggle task completion
- `DELETE /dashboard/tasks/:id` - Delete task

### Settings
- `POST /dashboard/settings/profile` - Update profile
- `POST /dashboard/settings/theme` - Update theme
- `POST /dashboard/settings/profile-picture` - Upload profile picture

## Technologies Used

- **Electron**: Desktop app framework
- **Express**: Web server
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **Passport.js**: Authentication middleware
- **Google OAuth 2.0**: Authentication provider
- **EJS**: Template engine
- **CSS3**: Styling with dark/light themes
- **JavaScript**: Frontend logic
- **Font Awesome**: Icons

## Security Features

- **OAuth 2.0**: Secure authentication
- **Session Management**: Secure session handling
- **User Isolation**: Users can only access their own data
- **Input Validation**: Server-side validation
- **CSRF Protection**: Built-in Express protection

## Troubleshooting

### Common Issues

1. **Google OAuth not working**:
   - Ensure Google+ API is enabled
   - Check redirect URI matches exactly
   - Verify Client ID and Secret are correct

2. **Tasks not showing**:
   - Make sure you're logged in
   - Check MongoDB connection
   - Verify user authentication

3. **DMG build fails**:
   - Ensure all dependencies are installed
   - Check for conflicting processes
   - Try running `npm run build` again

## License

MIT License 