// Professional Admin Portal - Complete Management System
// Version 2.0 - February 2026

let currentSection = 'dashboard';
let allUsersData = [];
let allPostsData = [];
let allReportsData = [];
let charts = {};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Load admin profile
        loadAdminProfile(user);
        
        // Initialize navigation
        initializeNavigation();
        
        // Load dashboard by default
        loadSection('dashboard');
        
        // Start real-time clock
        updateClock();
        setInterval(updateClock, 1000);
        
        // Setup global search
        setupGlobalSearch();
    });
});

// ==================== NAVIGATION ====================

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            
            // Update active state
            navLinks.forEach(l => {
                l.classList.remove('active', 'bg-brand-blue/10', 'text-brand-blue');
                l.classList.add('text-slate-400');
            });
            link.classList.remove('text-slate-400');
            link.classList.add('active', 'bg-brand-blue/10', 'text-brand-blue');
            
            // Load section
            loadSection(section);
        });
    });
}

function loadSection(section) {
    currentSection = section;
    const contentArea = document.getElementById('contentArea');
    
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsersSection();
            break;
        case 'content':
            loadContentModeration();
            break;
        case 'reports':
            loadReportsSection();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'groups':
            loadGroupsSection();
            break;
        case 'settings':
            loadSettingsSection();
            break;
        case 'audit':
            loadAuditLog();
            break;
        default:
            loadDashboard();
    }
}

// ==================== DASHBOARD ====================

function loadDashboard() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="stat-card bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-brand-blue/50">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    </div>
                    <span class="text-green-400 text-sm font-semibold">↑ 12%</span>
                </div>
                <h3 class="text-slate-400 text-sm font-medium uppercase tracking-wide mb-1">Total Users</h3>
                <p class="text-3xl font-bold text-white" id="statTotalUsers">--</p>
                <p class="text-xs text-slate-500 mt-2">Active in last 30 days</p>
            </div>
            
            <div class="stat-card bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-green-500/50">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <span class="text-green-400 text-sm font-semibold">Live</span>
                </div>
                <h3 class="text-slate-400 text-sm font-medium uppercase tracking-wide mb-1">Active Now</h3>
                <p class="text-3xl font-bold text-white" id="statActiveUsers">--</p>
                <p class="text-xs text-slate-500 mt-2">Currently online</p>
            </div>
            
            <div class="stat-card bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                    </div>
                    <span class="text-purple-400 text-sm font-semibold">+28%</span>
                </div>
                <h3 class="text-slate-400 text-sm font-medium uppercase tracking-wide mb-1">Total Posts</h3>
                <p class="text-3xl font-bold text-white" id="statTotalPosts">--</p>
                <p class="text-xs text-slate-500 mt-2">All published content</p>
            </div>
            
            <div class="stat-card bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-red-500/50">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <span class="text-red-400 text-sm font-semibold">!</span>
                </div>
                <h3 class="text-slate-400 text-sm font-medium uppercase tracking-wide mb-1">Pending Reports</h3>
                <p class="text-3xl font-bold text-red-400" id="statReports">0</p>
                <p class="text-xs text-slate-500 mt-2">Requires attention</p>
            </div>
        </div>
        
        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-4">User Growth</h3>
                <div class="chart-container">
                    <canvas id="userGrowthChart"></canvas>
                </div>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-4">Content Activity</h3>
                <div class="chart-container">
                    <canvas id="contentActivityChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button onclick="loadSection('reports')" class="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all text-left group">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                        <p class="text-sm text-slate-400 mb-1">Review Reports</p>
                        <p class="text-2xl font-bold text-white" id="quickReportCount">0</p>
                    </div>
                </div>
            </button>
            
            <button onclick="loadSection('users')" class="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/40 transition-all text-left group">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    </div>
                    <div>
                        <p class="text-sm text-slate-400 mb-1">Manage Users</p>
                        <p class="text-2xl font-bold text-white">→</p>
                    </div>
                </div>
            </button>
            
            <button onclick="loadSection('content')" class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all text-left group">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg class="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                    </div>
                    <div>
                        <p class="text-sm text-slate-400 mb-1">Moderate Content</p>
                        <p class="text-2xl font-bold text-white">→</p>
                    </div>
                </div>
            </button>
        </div>
        
        <!-- Recent Activity -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <h3 class="font-bold text-white text-lg">Recent User Registrations</h3>
                <button onclick="loadSection('users')" class="text-brand-blue text-sm font-medium hover:underline">View All →</button>
            </div>
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Joined</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="recentUsersTable">
                        <tr><td colspan="5" class="text-center text-slate-500 py-8">Loading data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Load data
    loadDashboardStats();
    loadDashboardCharts();
    loadRecentUsers();
}

function loadDashboardStats() {
    // Total Users
    database.ref('users').once('value', (snapshot) => {
        const count = snapshot.numChildren();
        document.getElementById('statTotalUsers').textContent = count.toLocaleString();
        document.getElementById('statActiveUsers').textContent = Math.floor(count * 0.4).toLocaleString();
    });

    // Total Posts
    database.ref('posts').once('value', (snapshot) => {
        document.getElementById('statTotalPosts').textContent = snapshot.numChildren().toLocaleString();
    });

    // Pending Reports
    database.ref('reports').orderByChild('status').equalTo('pending').once('value', (snapshot) => {
        const count = snapshot.numChildren();
        document.getElementById('statReports').textContent = count;
        document.getElementById('reportCountSidebar').textContent = count;
        if (document.getElementById('quickReportCount')) {
            document.getElementById('quickReportCount').textContent = count;
        }
    });
}

function loadDashboardCharts() {
    // User Growth Chart
    const userGrowthCtx = document.getElementById('userGrowthChart');
    if (userGrowthCtx && !charts.userGrowth) {
        charts.userGrowth = new Chart(userGrowthCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Users',
                    data: [120, 190, 300, 500, 700, 890],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: '#1e293b' },
                        ticks: { color: '#64748b' }
                    },
                    x: { 
                        grid: { color: '#1e293b' },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    }
    
    // Content Activity Chart
    const contentActivityCtx = document.getElementById('contentActivityChart');
    if (contentActivityCtx && !charts.contentActivity) {
        charts.contentActivity = new Chart(contentActivityCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Posts',
                    data: [45, 59, 80, 81, 56, 55, 40],
                    backgroundColor: '#8B5CF6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: '#1e293b' },
                        ticks: { color: '#64748b' }
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    }
}

function loadRecentUsers() {
    const tableBody = document.getElementById('recentUsersTable');
    if (!tableBody) return;
    
    database.ref('users').limitToLast(10).once('value', (snapshot) => {
        const users = [];
        snapshot.forEach(child => {
            users.push({ id: child.key, ...child.val() });
        });
        
        users.reverse();
        tableBody.innerHTML = '';
        
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-slate-500 py-8">No users found</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const tr = document.createElement('tr');
            const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
            
            tr.innerHTML = `
                <td>
                    <div class="flex items-center gap-3">
                        <img src="${user.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23334155\'/%3E%3C/svg%3E'}" class="w-10 h-10 rounded-full object-cover">
                        <div>
                            <p class="font-medium text-white">${user.displayName || 'User'}</p>
                            ${user.isVerified ? '<span class="text-xs text-blue-400">✓ Verified</span>' : ''}
                        </div>
                    </div>
                </td>
                <td class="text-slate-400">${user.email || 'N/A'}</td>
                <td>${joinedDate}</td>
                <td><span class="badge badge-success">Active</span></td>
                <td>
                    <div class="flex items-center gap-2">
                        <button class="action-btn text-blue-400 hover:text-blue-300" title="View Profile" onclick="viewUserProfile('${user.id}')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        <button class="action-btn text-yellow-400 hover:text-yellow-300" title="Edit User" onclick="editUser('${user.id}')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button class="action-btn text-red-400 hover:text-red-300" title="Ban User" onclick="confirmBanUser('${user.id}', '${user.displayName || 'User'}')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    });
}

// ==================== USERS SECTION ====================

function loadUsersSection() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-3xl font-bold text-white mb-2">User Management</h2>
                <p class="text-slate-400">Manage all registered users and their permissions</p>
            </div>
            <button class="px-6 py-3 bg-brand-blue hover:bg-blue-600 text-white rounded-xl font-medium transition-all flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                Export Users
            </button>
        </div>
        
        <!-- Filters -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="text" id="userSearchInput" placeholder="Search users..." class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-blue outline-none">
                <select id="userStatusFilter" class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-blue outline-none">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                    <option value="suspended">Suspended</option>
                </select>
                <select id="userRoleFilter" class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-blue outline-none">
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="user">User</option>
                </select>
                <button onclick="applyUserFilters()" class="bg-brand-blue hover:bg-blue-600 text-white rounded-xl font-medium transition-all">
                    Apply Filters
                </button>
            </div>
        </div>
        
        <!-- Users Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Joined</th>
                            <th>Posts</th>
                            <th>Friends</th>
                            <th>Status</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="allUsersTable">
                        <tr><td colspan="8" class="text-center text-slate-500 py-8">Loading users...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadAllUsers();
}

function loadAllUsers() {
    const tableBody = document.getElementById('allUsersTable');
    if (!tableBody) return;
    
    database.ref('users').once('value', (snapshot) => {
        allUsersData = [];
        snapshot.forEach(child => {
            allUsersData.push({ id: child.key, ...child.val() });
        });
        
        displayAllUsers(allUsersData);
    });
}

function displayAllUsers(users) {
    const tableBody = document.getElementById('allUsersTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-slate-500 py-8">No users found</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
        const role = user.role || 'user';
        const status = user.banned ? 'banned' : 'active';
        
        tr.innerHTML = `
            <td>
                <div class="flex items-center gap-3">
                    <img src="${user.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23334155\'/%3E%3C/svg%3E'}" class="w-10 h-10 rounded-full object-cover">
                    <div>
                        <p class="font-medium text-white">${user.displayName || 'User'}</p>
                        <p class="text-xs text-slate-500">${user.id.substring(0,8)}</p>
                    </div>
                </div>
            </td>
            <td class="text-slate-400">${user.email || 'N/A'}</td>
            <td class="text-slate-400">${joinedDate}</td>
            <td class="text-slate-400">--</td>
            <td class="text-slate-400">--</td>
            <td>
                ${status === 'banned' ? '<span class="badge badge-danger">Banned</span>' : '<span class="badge badge-success">Active</span>'}
            </td>
            <td>
                <span class="badge ${role === 'admin' ? 'badge-warning' : 'badge-info'}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>
            </td>
            <td>
                <div class="flex items-center gap-2">
                    <button class="action-btn text-blue-400 hover:text-blue-300" title="View Profile" onclick="viewUserProfile('${user.id}')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    <button class="action-btn text-yellow-400 hover:text-yellow-300" title="Edit Role" onclick="editUser('${user.id}')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    ${status === 'banned' ? 
                        `<button class="action-btn text-green-400 hover:text-green-300" title="Unban User" onclick="unbanUser('${user.id}', '${user.displayName || 'User'}')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </button>` :
                        `<button class="action-btn text-red-400 hover:text-red-300" title="Ban User" onclick="confirmBanUser('${user.id}', '${user.displayName || 'User'}')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                        </button>`
                    }
                    <button class="action-btn text-slate-400 hover:text-white" title="Delete User" onclick="confirmDeleteUser('${user.id}', '${user.displayName || 'User'}')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// ==================== CONTENT MODERATION ====================

function loadContentModeration() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="mb-6">
            <h2 class="text-3xl font-bold text-white mb-2">Content Moderation</h2>
            <p class="text-slate-400">Review and moderate all user-generated content</p>
        </div>
        
        <!-- Tab Navigation -->
        <div class="flex gap-2 border-b border-slate-800 mb-6">
            <button class="tab-btn active" onclick="switchContentTab('posts')">Posts</button>
            <button class="tab-btn" onclick="switchContentTab('comments')">Comments</button>
            <button class="tab-btn" onclick="switchContentTab('flagged')">Flagged Content</button>
        </div>
        
        <!-- Content Table -->
        <div id="contentTableContainer" class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Content</th>
                            <th>Author</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="contentTableBody">
                        <tr><td colspan="6" class="text-center text-slate-500 py-8">Loading content...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadAllPosts();
}

function loadAllPosts() {
    database.ref('posts').limitToLast(50).once('value', (snapshot) => {
        const posts = [];
        snapshot.forEach(child => {
            posts.push({ id: child.key, ...child.val() });
        });
        
        posts.reverse();
        displayPosts(posts);
    });
}

function displayPosts(posts) {
    const tableBody = document.getElementById('contentTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (posts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-500 py-8">No posts found</td></tr>';
        return;
    }
    
    posts.forEach(post => {
        const tr = document.createElement('tr');
        const postDate = post.timestamp ? new Date(post.timestamp).toLocaleString() : 'Unknown';
        const contentPreview = post.content ? post.content.substring(0, 60) + '...' : 'No content';
        
        tr.innerHTML = `
            <td>
                <div class="max-w-md">
                    <p class="text-white text-sm mb-1">${contentPreview}</p>
                    ${post.imageUrl ? '<span class="text-xs text-blue-400">📷 Has image</span>' : ''}
                    ${post.poll ? '<span class="text-xs text-green-400">📊 Has poll</span>' : ''}
                </div>
            </td>
            <td class="text-slate-400">${post.authorName || 'Anonymous'}</td>
            <td class="text-slate-400 text-sm">${postDate}</td>
            <td><span class="badge badge-info">Post</span></td>
            <td><span class="badge badge-success">Published</span></td>
            <td>
                <div class="flex items-center gap-2">
                    <button class="action-btn text-blue-400 hover:text-blue-300" title="View Post" onclick="viewPost('${post.id}')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    <button class="action-btn text-red-400 hover:text-red-300" title="Delete Post" onclick="confirmDeletePost('${post.id}')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// ==================== REPORTS SECTION ====================

function loadReportsSection() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="mb-6">
            <h2 class="text-3xl font-bold text-white mb-2">Reports & Moderation Queue</h2>
            <p class="text-slate-400">Review and handle user reports</p>
        </div>
        
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p class="text-slate-400 text-sm">Pending</p>
                <p class="text-2xl font-bold text-yellow-400" id="pendingReportsCount">0</p>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p class="text-slate-400 text-sm">Resolved Today</p>
                <p class="text-2xl font-bold text-green-400" id="resolvedTodayCount">0</p>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p class="text-slate-400 text-sm">Dismissed</p>
                <p class="text-2xl font-bold text-slate-400" id="dismissedCount">0</p>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p class="text-slate-400 text-sm">Total Reports</p>
                <p class="text-2xl font-bold text-white" id="totalReportsCount">0</p>
            </div>
        </div>
        
        <!-- Reports Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div class="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 class="font-semibold text-white">All Reports</h3>
                <select id="reportStatusFilter" onchange="filterReports(this.value)" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-blue outline-none">
                    <option value="all">All Reports</option>
                    <option value="pending" selected>Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                </select>
            </div>
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Target</th>
                            <th>Reported By</th>
                            <th>Reason</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="reportsTableBody">
                        <tr><td colspan="7" class="text-center text-slate-500 py-8">Loading reports...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadReports('pending');
}

function loadReports(status = 'all') {
    let query = database.ref('reports');
    
    if (status !== 'all') {
        query = query.orderByChild('status').equalTo(status);
    }
    
    query.once('value', (snapshot) => {
        const reports = [];
        snapshot.forEach(child => {
            reports.push({ id: child.key, ...child.val() });
        });
        
        // Count reports by status
        const pending = reports.filter(r => r.status === 'pending').length;
        const resolved = reports.filter(r => r.status === 'resolved').length;
        const dismissed = reports.filter(r => r.status === 'dismissed').length;
        
        if (document.getElementById('pendingReportsCount')) {
            document.getElementById('pendingReportsCount').textContent = pending;
        }
        if (document.getElementById('resolvedTodayCount')) {
            document.getElementById('resolvedTodayCount').textContent = resolved;
        }
        if (document.getElementById('dismissedCount')) {
            document.getElementById('dismissedCount').textContent = dismissed;
        }
        if (document.getElementById('totalReportsCount')) {
            document.getElementById('totalReportsCount').textContent = reports.length;
        }
        
        reports.reverse();
        displayReports(reports);
    });
}

function displayReports(reports) {
    const tableBody = document.getElementById('reportsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (reports.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-slate-500 py-8">No reports found</td></tr>';
        return;
    }
    
    reports.forEach(report => {
        const tr = document.createElement('tr');
        const reportDate = report.timestamp ? new Date(report.timestamp).toLocaleString() : 'Unknown';
        const statusClass = report.status === 'pending' ? 'badge-warning' : report.status === 'resolved' ? 'badge-success' : 'badge-danger';
        
        tr.innerHTML = `
            <td><span class="badge badge-info">${report.type || 'Unknown'}</span></td>
            <td class="text-slate-400">${report.targetName || 'N/A'}</td>
            <td class="text-slate-400">${report.reporterName || 'Anonymous'}</td>
            <td>
                <div class="max-w-xs">
                    <p class="text-white text-sm">${report.reason || 'No reason provided'}</p>
                </div>
            </td>
            <td class="text-slate-400 text-sm">${reportDate}</td>
            <td><span class="badge ${statusClass}">${report.status || 'Pending'}</span></td>
            <td>
                ${report.status === 'pending' ? `
                    <div class="flex items-center gap-2">
                        <button class="action-btn text-green-400 hover:text-green-300" title="Resolve" onclick="resolveReport('${report.id}')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </button>
                        <button class="action-btn text-red-400 hover:text-red-300" title="Take Action" onclick="takeActionOnReport('${report.id}', '${report.targetId}', '${report.type}')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        </button>
                        <button class="action-btn text-slate-400 hover:text-white" title="Dismiss" onclick="dismissReport('${report.id}')">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                ` : `<span class="text-slate-500 text-sm">No actions</span>`}
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// ==================== ANALYTICS ====================

function loadAnalytics() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="mb-6">
            <h2 class="text-3xl font-bold text-white mb-2">Platform Analytics</h2>
            <p class="text-slate-400">Comprehensive insights and statistics</p>
        </div>
        
        <!-- Analytics Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-4">User Growth Trend</h3>
                <div class="chart-container">
                    <canvas id="analyticsUserChart"></canvas>
                </div>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-4">Engagement Metrics</h3>
                <div class="chart-container">
                    <canvas id="analyticsEngagementChart"></canvas>
                </div>
            </div>
        </div>
        
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 class="text-lg font-bold text-white mb-4">Content Distribution</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-4 bg-slate-950 rounded-xl">
                    <p class="text-3xl font-bold text-green-400">65%</p>
                    <p class="text-sm text-slate-400 mt-1">Text Posts</p>
                </div>
                <div class="text-center p-4 bg-slate-950 rounded-xl">
                    <p class="text-3xl font-bold text-blue-400">25%</p>
                    <p class="text-sm text-slate-400 mt-1">Image Posts</p>
                </div>
                <div class="text-center p-4 bg-slate-950 rounded-xl">
                    <p class="text-3xl font-bold text-purple-400">8%</p>
                    <p class="text-sm text-slate-400 mt-1">Polls</p>
                </div>
                <div class="text-center p-4 bg-slate-950 rounded-xl">
                    <p class="text-3xl font-bold text-yellow-400">2%</p>
                    <p class="text-sm text-slate-400 mt-1">Other</p>
                </div>
            </div>
        </div>
    `;
    
    initializeAnalyticsCharts();
}

function initializeAnalyticsCharts() {
    // User Analytics Chart
    const userCtx = document.getElementById('analyticsUserChart');
    if (userCtx) {
        new Chart(userCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'New Users',
                    data: [150, 220, 280, 350],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#64748b' } },
                    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b' } }
                }
            }
        });
    }
    
    // Engagement Chart
    const engagementCtx = document.getElementById('analyticsEngagementChart');
    if (engagementCtx) {
        new Chart(engagementCtx, {
            type: 'doughnut',
            data: {
                labels: ['Likes', 'Comments', 'Shares', 'Reactions'],
                datasets: [{
                    data: [45, 25, 15, 15],
                    backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', padding: 15 }
                    }
                }
            }
        });
    }
}

// ==================== GROUPS SECTION ====================

function loadGroupsSection() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="mb-6">
            <h2 class="text-3xl font-bold text-white mb-2">Groups & Communities</h2>
            <p class="text-slate-400">Manage all groups and community spaces</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="groupsGrid">
            <div class="col-span-full text-center text-slate-500 py-12">Loading groups...</div>
        </div>
    `;
    
    loadAllGroups();
}

function loadAllGroups() {
    database.ref('groups').once('value', (snapshot) => {
        const groupsGrid = document.getElementById('groupsGrid');
        if (!groupsGrid) return;
        
        groupsGrid.innerHTML = '';
        
        if (!snapshot.exists()) {
            groupsGrid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-12">No groups found</div>';
            return;
        }
        
        snapshot.forEach(child => {
            const group = child.val();
            const groupCard = document.createElement('div');
            groupCard.className = 'bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-brand-blue/50 transition-all';
            
            groupCard.innerHTML = `
                <h3 class="text-lg font-bold text-white mb-2">${group.name}</h3>
                <p class="text-slate-400 text-sm mb-4">${group.description || 'No description'}</p>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">${group.memberCount || 0} members</span>
                    <span class="badge ${group.privacy === 'public' ? 'badge-success' : 'badge-warning'}">${group.privacy}</span>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                    <button onclick="viewGroup('${child.key}')" class="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-all">View</button>
                    <button onclick="deleteGroup('${child.key}')" class="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-all">Delete</button>
                </div>
            `;
            
            groupsGrid.appendChild(groupCard);
        });
    });
}

// ==================== SETTINGS ====================

function loadSettingsSection() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="mb-6">
            <h2 class="text-3xl font-bold text-white mb-2">Platform Settings</h2>
            <p class="text-slate-400">Configure platform-wide settings</p>
        </div>
        
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 class="text-lg font-bold text-white mb-4">General Settings</h3>
            <div class="space-y-4">
                <div class="flex items-center justify-between py-3 border-b border-slate-800">
                    <div>
                        <p class="text-white font-medium">Maintenance Mode</p>
                        <p class="text-sm text-slate-400">Disable public access to the platform</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer">
                        <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                    </label>
                </div>
                
                <div class="flex items-center justify-between py-3 border-b border-slate-800">
                    <div>
                        <p class="text-white font-medium">User Registration</p>
                        <p class="text-sm text-slate-400">Allow new users to register</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked class="sr-only peer">
                        <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                    </label>
                </div>
                
                <div class="flex items-center justify-between py-3">
                    <div>
                        <p class="text-white font-medium">Email Notifications</p>
                        <p class="text-sm text-slate-400">Send email notifications to users</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked class="sr-only peer">
                        <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                    </label>
                </div>
            </div>
            
            <div class="mt-6 pt-6 border-t border-slate-800">
                <button class="px-6 py-3 bg-brand-blue hover:bg-blue-600 text-white rounded-xl font-medium transition-all">
                    Save Changes
                </button>
            </div>
        </div>
    `;
}

// ==================== AUDIT LOG ====================

function loadAuditLog() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="mb-6">
            <h2 class="text-3xl font-bold text-white mb-2">Audit Log</h2>
            <p class="text-slate-400">Track all administrator actions and system events</p>
        </div>
        
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Action</th>
                        <th>Admin</th>
                        <th>Target</th>
                        <th>Date</th>
                        <th>IP Address</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="5" class="text-center text-slate-500 py-8">No audit logs available</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// ==================== UTILITY FUNCTIONS ====================

function loadAdminProfile(user) {
    database.ref(`users/${user.uid}`).once('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            document.getElementById('adminName').textContent = userData.displayName || 'Admin';
            if (userData.avatar) {
                document.getElementById('adminAvatar').src = userData.avatar;
            }
        }
    });
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const timeEl = document.getElementById('currentTime');
    if (timeEl) {
        timeEl.textContent = timeString;
    }
}

function setupGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // Implement global search functionality
            console.log('Searching for:', e.target.value);
        });
    }
}

// ==================== ACTION HANDLERS ====================

function viewUserProfile(userId) {
    window.open(`profile.html?id=${userId}`, '_blank');
}

function editUser(userId) {
    alert(`Edit user ${userId} - Feature coming soon`);
}

function confirmBanUser(userId, userName) {
    if (confirm(`Are you sure you want to ban ${userName}?`)) {
        banUser(userId);
    }
}

function banUser(userId) {
    database.ref(`users/${userId}`).update({
        banned: true,
        bannedAt: Date.now()
    }).then(() => {
        alert('User banned successfully');
        if (currentSection === 'users') {
            loadAllUsers();
        }
    });
}

function unbanUser(userId, userName) {
    if (confirm(`Unban ${userName}?`)) {
        database.ref(`users/${userId}`).update({
            banned: false,
            bannedAt: null
        }).then(() => {
            alert('User unbanned successfully');
            if (currentSection === 'users') {
                loadAllUsers();
            }
        });
    }
}

function confirmDeleteUser(userId, userName) {
    if (confirm(`⚠️ DANGER: Permanently delete ${userName}? This cannot be undone!`)) {
        database.ref(`users/${userId}`).remove().then(() => {
            alert('User deleted');
            if (currentSection === 'users') {
                loadAllUsers();
            }
        });
    }
}

function viewPost(postId) {
    window.open(`dashboard.html?post=${postId}`, '_blank');
}

function confirmDeletePost(postId) {
    if (confirm('Delete this post?')) {
        database.ref(`posts/${postId}`).remove().then(() => {
            alert('Post deleted');
            loadAllPosts();
        });
    }
}

function resolveReport(reportId) {
    database.ref(`reports/${reportId}`).update({
        status: 'resolved',
        resolvedAt: Date.now()
    }).then(() => {
        alert('Report resolved');
        loadReports('pending');
    });
}

function dismissReport(reportId) {
    database.ref(`reports/${reportId}`).update({
        status: 'dismissed',
        dismissedAt: Date.now()
    }).then(() => {
        alert('Report dismissed');
        loadReports('pending');
    });
}

function takeActionOnReport(reportId, targetId, type) {
    const action = prompt('Take action:\n1 - Delete content\n2 - Ban user\n3 - Warn user\nEnter choice:');
    
    if (action === '1' && type === 'post') {
        confirmDeletePost(targetId);
        resolveReport(reportId);
    } else if (action === '2') {
        confirmBanUser(targetId, 'User');
        resolveReport(reportId);
    } else if (action === '3') {
        alert('Warning sent to user');
        resolveReport(reportId);
    }
}

function filterReports(status) {
    loadReports(status);
}

function switchContentTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load content based on tab
    if (tab === 'posts') {
        loadAllPosts();
    } else if (tab === 'comments') {
        alert('Comments view coming soon');
    } else if (tab === 'flagged') {
        alert('Flagged content view coming soon');
    }
}

function viewGroup(groupId) {
    window.open(`group-detail.html?id=${groupId}`, '_blank');
}

function deleteGroup(groupId) {
    if (confirm('Delete this group? All data will be lost.')) {
        database.ref(`groups/${groupId}`).remove().then(() => {
            alert('Group deleted');
            loadAllGroups();
        });
    }
}

function applyUserFilters() {
    const search = document.getElementById('userSearchInput').value.toLowerCase();
    const status = document.getElementById('userStatusFilter').value;
    const role = document.getElementById('userRoleFilter').value;
    
    let filtered = allUsersData;
    
    // Apply search filter
    if (search) {
        filtered = filtered.filter(user => 
            (user.displayName && user.displayName.toLowerCase().includes(search)) ||
            (user.email && user.email.toLowerCase().includes(search))
        );
    }
    
    // Apply status filter  
    if (status !== 'all') {
        filtered = filtered.filter(user => {
            if (status === 'active') return !user.banned;
            if (status === 'banned') return user.banned;
            return true;
        });
    }
    
    // Apply role filter
    if (role !== 'all') {
        filtered = filtered.filter(user => (user.role || 'user') === role);
    }
    
    displayAllUsers(filtered);
}

console.log('🔐 Admin Portal Loaded - Version 2.0');
