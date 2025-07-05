// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
    
    // Ensure form inputs are accessible
    ensureFormInputsAccessible();
});

function initApp() {
    // Add smooth scrolling
    addSmoothScrolling();
    
    // Initialize todo functionality if on dashboard
    if (window.location.pathname.includes('/dashboard')) {
        initTodoFunctionality();
    }
    
    // Add mobile menu toggle
    addMobileMenuToggle();
}

function addSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function addMobileMenuToggle() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        // Add mobile menu functionality if needed
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            // Add responsive menu toggle
            const menuToggle = document.createElement('button');
            menuToggle.className = 'menu-toggle';
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            menuToggle.style.display = 'none';
            
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
            
            navbar.appendChild(menuToggle);
            
            // Show/hide menu toggle based on screen size
            function handleResize() {
                if (window.innerWidth <= 768) {
                    menuToggle.style.display = 'block';
                    navLinks.classList.add('mobile-menu');
                } else {
                    menuToggle.style.display = 'none';
                    navLinks.classList.remove('mobile-menu', 'active');
                }
            }
            
            window.addEventListener('resize', handleResize);
            handleResize();
        }
    }
}

function initTodoFunctionality() {
    // Todo form handling
    const todoForm = document.getElementById('todo-form');
    if (todoForm) {
        todoForm.addEventListener('submit', handleTodoSubmit);
    }
    
    // Todo item actions
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-complete')) {
            handleTodoComplete(e.target.dataset.id);
        }
        if (e.target.classList.contains('btn-delete')) {
            handleTodoDelete(e.target.dataset.id);
        }
    });
}

function handleTodoSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate')
    };
    
    const editId = e.target.dataset.editId;
    const url = editId ? `/dashboard/tasks/${editId}` : '/dashboard/tasks';
    const method = editId ? 'PUT' : 'POST';
    
    // Send to server
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url;
        } else {
            return response.json();
        }
    })
    .then(data => {
        if (data && data.success) {
            // Hide modal
            hideAddTaskForm();
            
            // Show success message
            showNotification(editId ? 'Task updated successfully' : 'Task created successfully', 'success');
            
            // Reload page to show updated data
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else if (data && !data.success) {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving task');
    });
}

function handleTodoComplete(todoId) {
    fetch(`/dashboard/todos/${todoId}/complete`, {
        method: 'PUT'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function handleTodoDelete(todoId) {
    if (confirm('Are you sure you want to delete this todo?')) {
        fetch(`/dashboard/todos/${todoId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

// Electron API integration
if (window.electronAPI) {
    // Display app version in footer
    window.electronAPI.getAppVersion().then(version => {
        const footer = document.querySelector('.footer p');
        if (footer) {
            footer.innerHTML += ` | v${version}`;
        }
    });
    
    // Auto-update functionality
    initAutoUpdater();
}

// Auto-updater functionality
function initAutoUpdater() {
    if (!window.electronAPI) return;
    
    // Set up update status listener
    window.electronAPI.onUpdateStatus((event, data) => {
        handleUpdateStatus(data);
    });
    
    // Check for updates on app start (with longer delay to avoid blocking UI)
    setTimeout(() => {
        checkForUpdates();
    }, 30000); // Check 30 seconds after app loads (increased from 5 seconds)
    
    // Check for updates every 24 hours (keep this as is)
    setInterval(() => {
        checkForUpdates();
    }, 24 * 60 * 60 * 1000);
}

// Add a cooldown to prevent spam notifications
let lastUpdateCheck = 0;
const UPDATE_CHECK_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

function checkForUpdates() {
    if (!window.electronAPI) return;
    
    // Check if we've already checked recently
    const now = Date.now();
    if (now - lastUpdateCheck < UPDATE_CHECK_COOLDOWN) {
        console.log('Update check skipped - too recent');
        return;
    }
    
    lastUpdateCheck = now;
    
    window.electronAPI.checkForUpdates().then(result => {
        if (!result.success) {
            console.error('Update check failed:', result.error);
        }
    }).catch(error => {
        console.error('Error checking for updates:', error);
    });
}

function handleUpdateStatus(data) {
    switch (data.status) {
        case 'checking':
            console.log('Checking for updates...');
            break;
            
        case 'available':
            console.log('Update available:', data.version);
            showUpdateNotification(data.version, data.releaseNotes);
            break;
            
        case 'not-available':
            console.log('No updates available');
            break;
            
        case 'downloading':
            console.log('Downloading update:', data.progress);
            showDownloadProgress(data.progress);
            break;
            
        case 'downloaded':
            console.log('Update downloaded:', data.version);
            showUpdateReadyNotification(data.version);
            break;
            
        case 'error':
            console.error('Update error:', data.error);
            showUpdateErrorNotification(data.error);
            break;
    }
}

// Add notification cooldown
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 60 * 60 * 1000; // 1 hour

function showUpdateNotification(version, releaseNotes) {
    // Check if we've shown this notification recently
    const now = Date.now();
    if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        console.log('Update notification skipped - too recent');
        return;
    }
    
    lastNotificationTime = now;
    
    const notification = document.createElement('div');
    notification.className = 'notification notification-info update-notification';
    notification.innerHTML = `
        <div class="update-content">
            <h4>Update Available (v${version})</h4>
            <p>${releaseNotes || 'A new version is available for download.'}</p>
            <div class="update-actions">
                <button class="btn btn-primary btn-small" onclick="downloadUpdate()">Download Now</button>
                <button class="btn btn-secondary btn-small" onclick="this.parentElement.parentElement.parentElement.remove()">Later</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 30000);
}

function showDownloadProgress(progress) {
    let progressNotification = document.querySelector('.download-progress-notification');
    
    if (!progressNotification) {
        progressNotification = document.createElement('div');
        progressNotification.className = 'notification notification-info download-progress-notification';
        document.body.appendChild(progressNotification);
    }
    
    const percent = Math.round(progress.percent || 0);
    progressNotification.innerHTML = `
        <div class="update-content">
            <h4>Downloading Update</h4>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
            <p>${percent}% complete</p>
        </div>
    `;
}

function showUpdateReadyNotification(version) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-success update-ready-notification';
    notification.innerHTML = `
        <div class="update-content">
            <h4>Update Ready (v${version})</h4>
            <p>The update has been downloaded and is ready to install.</p>
            <div class="update-actions">
                <button class="btn btn-primary btn-small" onclick="installUpdate()">Install Now</button>
                <button class="btn btn-secondary btn-small" onclick="this.parentElement.parentElement.parentElement.remove()">Later</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove download progress notification
    const progressNotification = document.querySelector('.download-progress-notification');
    if (progressNotification) {
        progressNotification.remove();
    }
}

function showUpdateErrorNotification(error) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-error';
    notification.innerHTML = `
        <div class="update-content">
            <h4>Update Error</h4>
            <p>Failed to check for updates: ${error}</p>
            <button class="btn btn-secondary btn-small" onclick="this.parentElement.parentElement.remove()">Dismiss</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

function downloadUpdate() {
    if (!window.electronAPI) return;
    
    window.electronAPI.downloadUpdate().then(result => {
        if (!result.success) {
            console.error('Download failed:', result.error);
            showUpdateErrorNotification(result.error);
        }
    }).catch(error => {
        console.error('Error downloading update:', error);
        showUpdateErrorNotification(error.message);
    });
}

function installUpdate() {
    if (!window.electronAPI) return;
    
    window.electronAPI.installUpdate();
}

// Theme management
function changeTheme(theme) {
    // Remove existing theme classes
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(theme + '-theme');
    
    // Update theme selector if it exists
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = theme;
    }
    
    // Save theme preference
    fetch('/dashboard/profile/theme', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: theme })
    }).catch(error => {
        console.error('Error saving theme:', error);
    });
}

// Apply theme on page load
function applyTheme(theme) {
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(theme + '-theme');
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('userTheme') || 'light';
    applyTheme(savedTheme);
    
    // Set up theme selector if it exists
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', function() {
            const newTheme = this.value;
            changeTheme(newTheme);
            localStorage.setItem('userTheme', newTheme);
        });
    }
});

// Profile picture upload
function uploadProfilePicture(input) {
    const file = input.files[0];
    if (file) {
        // Show loading state
        const profilePic = document.getElementById('profilePic');
        const originalSrc = profilePic.src;
        
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        fetch('/dashboard/settings/profile-picture', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update all profile pictures on the page
                const allProfilePics = document.querySelectorAll('#profilePic, .dashboard-profile-pic, .nav-profile-pic');
                allProfilePics.forEach(pic => {
                    pic.src = data.profilePicture + '?t=' + new Date().getTime(); // Add cache buster
                });
                
                // Show success message
                showNotification('Profile picture updated successfully!', 'success');
            } else {
                showNotification('Error updating profile picture: ' + (data.message || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error uploading profile picture:', error);
            showNotification('Error uploading profile picture', 'error');
        });
    }
}

// Profile form submission
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            fetch('/dashboard/settings/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email')
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Profile updated successfully!');
                } else {
                    alert('Error updating profile: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                alert('Error updating profile');
            });
        });
    }
    
    // Task form submission
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const taskData = {
                title: formData.get('title'),
                description: formData.get('description'),
                priority: formData.get('priority'),
                dueDate: formData.get('dueDate')
            };
            
            fetch('/dashboard/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData)
            })
            .then(response => {
                if (response.ok) {
                    window.location.reload();
                } else {
                    throw new Error('Failed to add task');
                }
            })
            .catch(error => {
                console.error('Error adding task:', error);
                alert('Error adding task');
            });
        });
    }
});

// Task management functions
function showAddTaskForm() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideAddTaskForm() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        const form = document.getElementById('addTaskForm');
        if (form) {
            form.reset();
        }
    }
}

function toggleTask(taskId, completed) {
    fetch(`/dashboard/tasks/${taskId}/toggle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: completed })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update the task item appearance
            const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskItem) {
                if (completed) {
                    taskItem.classList.add('completed');
                } else {
                    taskItem.classList.remove('completed');
                }
            }
            
            // Update task counts immediately
            updateTaskCounts();
            
            // Update filter sections if on tasks page
            updateFilterSections();
        } else {
            alert('Error updating task: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating task');
    });
}

function editTask(taskId) {
    // Get the task data from the DOM
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) {
        alert('Task not found');
        return;
    }
    
    const taskTitle = taskElement.querySelector('h4').textContent;
    const taskDescription = taskElement.querySelector('p').textContent;
    const taskPriority = taskElement.querySelector('.priority-high, .priority-medium, .priority-low').textContent;
    
    // Pre-fill the form with the task data
    document.getElementById('taskName').value = taskTitle;
    document.getElementById('taskDescription').value = taskDescription;
    document.getElementById('taskPriority').value = taskPriority;
    
    // Change modal title and form action
    const modalTitle = document.querySelector('#addTaskModal h3');
    modalTitle.textContent = 'Edit Task';
    
    // Add task ID to form for editing
    const form = document.getElementById('addTaskForm');
    form.dataset.editId = taskId;
    
    // Show the modal
    showAddTaskForm();
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        fetch(`/dashboard/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove the task from DOM
                const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskItem) {
                    taskItem.remove();
                }
                
                // Update task counts immediately
                updateTaskCounts();
                
                // Update filter sections if on tasks page
                updateFilterSections();
                
                // Show success message
                showNotification('Task deleted successfully', 'success');
            } else {
                alert('Error deleting task: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting task');
        });
    }
}

function duplicateTask(taskId) {
    // Get the task data from the DOM
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) {
        alert('Task not found');
        return;
    }
    
    const taskTitle = taskElement.querySelector('h4').textContent;
    const taskDescription = taskElement.querySelector('p').textContent;
    const taskPriority = taskElement.querySelector('.priority-high, .priority-medium, .priority-low').textContent;
    
    // Pre-fill the form with the task data
    document.getElementById('taskName').value = taskTitle + ' (Copy)';
    document.getElementById('taskDescription').value = taskDescription;
    document.getElementById('taskPriority').value = taskPriority;
    
    // Reset modal title and remove edit ID
    const modalTitle = document.querySelector('#addTaskModal h3');
    modalTitle.textContent = 'Add New Task';
    const form = document.getElementById('addTaskForm');
    delete form.dataset.editId;
    
    // Show the modal
    showAddTaskForm();
}

function updateTaskCounts() {
    const allTasks = document.querySelectorAll('.task-item');
    const completedTasks = document.querySelectorAll('.task-item.completed');
    const pendingTasks = document.querySelectorAll('.task-item:not(.completed)');
    
    // Update dashboard stats if they exist
    const totalCount = document.getElementById('totalTasks');
    const completedCount = document.getElementById('completedTasks');
    const pendingCount = document.getElementById('pendingTasks');
    
    if (totalCount) totalCount.textContent = allTasks.length;
    if (completedCount) completedCount.textContent = completedTasks.length;
    if (pendingCount) pendingCount.textContent = pendingTasks.length;
    
    // Also update any stat cards on the page
    const statCards = document.querySelectorAll('.stat-card .stat-number');
    if (statCards.length >= 3) {
        statCards[0].textContent = allTasks.length; // Total
        statCards[1].textContent = completedTasks.length; // Completed
        statCards[2].textContent = pendingTasks.length; // Pending
    }
}

function updateFilterSections() {
    // Update the filter buttons to show correct counts
    const filterButtons = document.querySelectorAll('.filter-btn');
    const allTasks = document.querySelectorAll('.task-item');
    const completedTasks = document.querySelectorAll('.task-item.completed');
    const pendingTasks = document.querySelectorAll('.task-item:not(.completed)');
    
    filterButtons.forEach(btn => {
        const filter = btn.dataset.filter;
        let count = 0;
        
        switch(filter) {
            case 'all':
                count = allTasks.length;
                break;
            case 'completed':
                count = completedTasks.length;
                break;
            case 'pending':
                count = pendingTasks.length;
                break;
            case 'today':
                count = getTodayTasks().length;
                break;
            case 'upcoming':
                count = getUpcomingTasks().length;
                break;
        }
        
        // Update button text to show count
        const originalText = btn.textContent.replace(/\(\d+\)/, '');
        btn.textContent = `${originalText} (${count})`;
    });
}

function getTodayTasks() {
    const today = new Date().toDateString();
    return Array.from(document.querySelectorAll('.task-item')).filter(task => {
        const dueDate = task.querySelector('.task-meta');
        if (dueDate && dueDate.textContent.includes('Due:')) {
            const dateText = dueDate.textContent.match(/Due: ([^|]+)/);
            if (dateText) {
                const taskDate = new Date(dateText[1].trim()).toDateString();
                return taskDate === today;
            }
        }
        return false;
    });
}

function getUpcomingTasks() {
    const today = new Date();
    return Array.from(document.querySelectorAll('.task-item')).filter(task => {
        const dueDate = task.querySelector('.task-meta');
        if (dueDate && dueDate.textContent.includes('Due:')) {
            const dateText = dueDate.textContent.match(/Due: ([^|]+)/);
            if (dateText && dateText[1].trim() !== 'No due date') {
                const taskDate = new Date(dateText[1].trim());
                return taskDate > today;
            }
        }
        return false;
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// --- Local Data Storage & Auto-Login ---
async function saveUserDataToLocal(user, tasks, settings, session) {
    if (window.electronAPI && user && user.email) {
        await window.electronAPI.saveUserData(user.email, {
            user,
            tasks,
            settings,
            session
        });
    }
}

async function loadUserDataFromLocal(email) {
    if (window.electronAPI && email) {
        return await window.electronAPI.loadUserData(email);
    }
    return null;
}

async function clearUserSessionLocal(email) {
    if (window.electronAPI && email) {
        await window.electronAPI.clearUserSession(email);
    }
}

// On app start, try to auto-login if session exists in local file
(async function autoLoginIfSessionExists() {
    if (!window.electronAPI) return;
    // Try to get last logged-in user email from localStorage
    const lastEmail = localStorage.getItem('lastUserEmail');
    if (lastEmail) {
        const localData = await loadUserDataFromLocal(lastEmail);
        if (localData && localData.session && localData.user) {
            // Auto-login logic: set session cookie and reload
            document.cookie = localData.session;
            // Optionally, update UI with localData.tasks/settings
            // location.reload(); // Uncomment if you want to force reload
        }
    }
})();

// On login success (after user logs in), save user data and session
async function onLoginSuccess(user, tasks, settings) {
    // Save session cookie
    const sessionCookie = document.cookie;
    await saveUserDataToLocal(user, tasks, settings, sessionCookie);
    localStorage.setItem('lastUserEmail', user.email);
}

// On logout, clear session info in local file
async function onLogout(user) {
    if (user && user.email) {
        await clearUserSessionLocal(user.email);
        localStorage.removeItem('lastUserEmail');
    }
}

// Example usage:
// Call onLoginSuccess(user, tasks, settings) after successful login and data load
// Call onLogout(user) after logout 

// Task filtering functionality
function filterTasks(filter) {
    const taskItems = document.querySelectorAll('.task-item');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Update active filter button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    taskItems.forEach(item => {
        const dueDate = item.querySelector('.task-meta')?.textContent;
        const isCompleted = item.classList.contains('completed');
        
        let show = true;
        
        switch(filter) {
            case 'today':
                if (dueDate) {
                    const taskDate = new Date(dueDate.split('Due: ')[1].split(' |')[0]);
                    taskDate.setHours(0, 0, 0, 0);
                    show = taskDate.getTime() === today.getTime() && !isCompleted;
                } else {
                    show = false;
                }
                break;
            case 'upcoming':
                if (dueDate) {
                    const taskDate = new Date(dueDate.split('Due: ')[1].split(' |')[0]);
                    taskDate.setHours(0, 0, 0, 0);
                    show = taskDate.getTime() > today.getTime() && !isCompleted;
                } else {
                    show = false;
                }
                break;
            case 'completed':
                show = isCompleted;
                break;
            case 'all':
            default:
                show = true;
                break;
        }
        
        item.style.display = show ? 'flex' : 'none';
    });
}

// Calendar functionality
let currentDate = new Date();
let currentView = 'month'; // Only month view

function initCalendar() {
    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) return;
    
    renderCalendar();
}

function navigateCalendar(direction) {
    // Only month navigation since we only have month view
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const calendarDays = document.querySelector('#calendarDays');
    const calendarHeader = document.querySelector('#calendarTitle');
    
    if (!calendarDays || !calendarHeader) return;
    
    // Update header with IST date
    const options = { 
        year: 'numeric', 
        month: 'long'
    };
    calendarHeader.textContent = currentDate.toLocaleDateString('en-IN', options);
    
    // Clear existing days
    calendarDays.innerHTML = '';
    
    // Always render month view
    renderMonthView(calendarDays);
}

function renderMonthView(container) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    
    // Create calendar grid
    for (let week = 0; week < 6; week++) {
        for (let day = 0; day < 7; day++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + (week * 7) + day);
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            if (dayDate.getMonth() !== currentDate.getMonth()) {
                dayDiv.classList.add('other-month');
            }
            
            // Check if it's today using local timezone
            const today = new Date();
            const todayString = today.toDateString();
            if (dayDate.toDateString() === todayString) {
                dayDiv.classList.add('today');
            }
            
            dayDiv.innerHTML = `
                <span class="day-number">${dayDate.getDate()}</span>
                <div class="day-events" data-date="${dayDate.toISOString().split('T')[0]}"></div>
            `;
            
            container.appendChild(dayDiv);
        }
    }
    
    // Load events for this month
    loadEventsForMonth(monthStart, monthEnd);
}

function loadEventsForMonth(monthStart, monthEnd) {
    const endDate = new Date(monthEnd);
    endDate.setHours(23, 59, 59, 999);
    
    fetch(`/dashboard/calendar/events?start=${monthStart.toISOString()}&end=${endDate.toISOString()}`)
        .then(response => response.json())
        .then(events => {
            displayEvents(events, 'day');
            updateEventList(events);
        })
        .catch(error => {
            console.error('Error loading events:', error);
        });
}

function displayEvents(events, containerType) {
    // Clear existing events first
    const existingEvents = document.querySelectorAll('.calendar-event');
    existingEvents.forEach(event => event.remove());
    
    events.forEach(event => {
        if (event.completed) return; // Skip completed events
        
        // Use local timezone for event dates
        const eventDate = new Date(event.date || event.createdAt);
        const dateString = eventDate.toISOString().split('T')[0];
        
        const containers = document.querySelectorAll(`[data-date="${dateString}"]`);
        
        containers.forEach(container => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'calendar-event';
            eventDiv.dataset.eventId = event.id;
            
            eventDiv.innerHTML = `
                <div class="event-content">
                    <div class="event-title">${event.title}</div>
                    <div class="event-priority priority-${event.priority}">${event.priority}</div>
                </div>
                <div class="event-actions">
                    <button class="btn-edit-event" onclick="editEvent('${event.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete-event" onclick="deleteEvent('${event.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(eventDiv);
        });
    });
}

function updateEventList(events) {
    const eventList = document.getElementById('eventList');
    if (!eventList) return;
    
    eventList.innerHTML = '';
    
    // Sort events by IST date
    events.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateA - dateB;
    });
    
    events.forEach(event => {
        if (!event.completed) {
            // Use local timezone for event dates
            const eventDate = new Date(event.date || event.createdAt);
            
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-item';
            eventDiv.innerHTML = `
                <div class="event-date">${eventDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                <div class="event-info">
                    <h4>${event.title}</h4>
                    <p>${event.priority} priority task</p>
                </div>
                <div class="event-actions">
                    <button class="btn-edit-event" onclick="editEvent('${event.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete-event" onclick="deleteEvent('${event.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            eventList.appendChild(eventDiv);
        }
    });
}

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Initialize calendar
    initCalendar();
    
    // Add filter button event listeners
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterTasks(this.dataset.filter);
        });
    });
    
    // Initialize task counts and filter sections
    updateTaskCounts();
    updateFilterSections();
});

function ensureFormInputsAccessible() {
    // Find all input fields in auth forms
    const authInputs = document.querySelectorAll('.auth-form input[type="text"], .auth-form input[type="email"], .auth-form input[type="password"]');
    
    authInputs.forEach(input => {
        // Ensure inputs are not disabled
        input.disabled = false;
        
        // Ensure pointer events are enabled
        input.style.pointerEvents = 'auto';
        input.style.position = 'relative';
        input.style.zIndex = '10';
        
        // Ensure proper text visibility
        input.style.color = '#333333';
        input.style.backgroundColor = '#ffffff';
        input.style.fontWeight = '500';
        input.style.fontSize = '16px';
        
        // Add focus event listener for debugging
        input.addEventListener('focus', function() {
            console.log('Input focused:', this.name);
            this.style.color = '#333333';
            this.style.backgroundColor = '#ffffff';
        });
        
        // Add click event listener for debugging
        input.addEventListener('click', function() {
            console.log('Input clicked:', this.name);
        });
        
        // Add input event listener to ensure text is visible
        input.addEventListener('input', function() {
            console.log('Input changed:', this.name, 'Value:', this.value);
            this.style.color = '#333333';
        });
        
        // Ensure the input is not read-only
        input.readOnly = false;
        
        // Set placeholder color
        input.style.setProperty('--placeholder-color', '#666666', 'important');
    });
    
    // Ensure labels are visible
    const authLabels = document.querySelectorAll('.auth-form label');
    authLabels.forEach(label => {
        label.style.color = '#333333';
        label.style.fontWeight = '600';
        label.style.fontSize = '14px';
    });
    
    console.log('Form inputs accessibility check completed. Found', authInputs.length, 'inputs');
}

function editEvent(eventId) {
    // Redirect to tasks page with edit mode
    window.location.href = `/dashboard/tasks?edit=${eventId}`;
}

function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this task?')) {
        fetch(`/dashboard/tasks/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Refresh calendar
                renderCalendar();
            } else {
                alert('Error deleting task: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting task');
        });
    }
}

// Settings page update functions
function checkForUpdatesFromSettings() {
    const checkBtn = document.getElementById('checkUpdateBtn');
    const statusSpan = document.getElementById('updateStatus');
    const updateInfo = document.getElementById('updateInfo');
    
    if (!checkBtn || !statusSpan) return;
    
    // Update button state
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    statusSpan.textContent = 'Checking for updates...';
    updateInfo.style.display = 'none';
    
    if (!window.electronAPI) {
        statusSpan.textContent = 'Auto-update not available in web mode';
        checkBtn.disabled = false;
        checkBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Check for Updates';
        return;
    }
    
    window.electronAPI.checkForUpdates().then(result => {
        if (!result.success) {
            statusSpan.textContent = 'Failed to check for updates';
            checkBtn.disabled = false;
            checkBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Check for Updates';
        }
    }).catch(error => {
        statusSpan.textContent = 'Error checking for updates';
        checkBtn.disabled = false;
        checkBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Check for Updates';
    });
}

function handleUpdateStatusFromSettings(data) {
    const checkBtn = document.getElementById('checkUpdateBtn');
    const statusSpan = document.getElementById('updateStatus');
    const updateInfo = document.getElementById('updateInfo');
    const latestVersion = document.getElementById('latestVersion');
    const releaseNotes = document.getElementById('releaseNotes');
    const downloadBtn = document.getElementById('downloadUpdateBtn');
    
    if (!checkBtn || !statusSpan) return;
    
    switch (data.status) {
        case 'checking':
            statusSpan.textContent = 'Checking for updates...';
            break;
            
        case 'available':
            statusSpan.textContent = `Update available: v${data.version}`;
            latestVersion.textContent = data.version;
            releaseNotes.innerHTML = data.releaseNotes || 'Bug fixes and improvements.';
            updateInfo.style.display = 'block';
            downloadBtn.style.display = 'inline-block';
            checkBtn.disabled = false;
            checkBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Check for Updates';
            break;
            
        case 'not-available':
            statusSpan.textContent = 'You have the latest version';
            updateInfo.style.display = 'none';
            checkBtn.disabled = false;
            checkBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Check for Updates';
            break;
            
        case 'downloading':
            statusSpan.textContent = 'Downloading update...';
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
            break;
            
        case 'downloaded':
            statusSpan.textContent = 'Update downloaded and ready to install';
            downloadBtn.style.display = 'none';
            checkBtn.disabled = false;
            checkBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Check for Updates';
            break;
            
        case 'error':
            statusSpan.textContent = `Error: ${data.error}`;
            checkBtn.disabled = false;
            checkBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Check for Updates';
            break;
    }
}

// Initialize settings page if we're on it
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Initialize settings page update functionality
    if (window.location.pathname.includes('/dashboard/settings')) {
        // Set up update status listener for settings page
        if (window.electronAPI) {
            window.electronAPI.onUpdateStatus((event, data) => {
                handleUpdateStatusFromSettings(data);
            });
            
            // Display current app version
            window.electronAPI.getAppVersion().then(version => {
                const versionSpan = document.getElementById('appVersion');
                if (versionSpan) {
                    versionSpan.textContent = version;
                }
            });
        }
    }
}); 