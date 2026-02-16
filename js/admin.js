// Admin Portal Logic

document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }
        // In a real app, you would check if user.uid is in an 'admins' list
        // For now, we allow any logged-in user to view for demo purposes
        loadDashboardStats();
        loadRecentUsers();
    });
});

function loadDashboardStats() {
    // Count Users
    database.ref('users').once('value', (snapshot) => {
        const count = snapshot.numChildren();
        document.getElementById('statTotalUsers').textContent = count.toLocaleString();
        // Mock active users (random 40-60% of total)
        document.getElementById('statActiveUsers').textContent = Math.floor(count * 0.6).toLocaleString();
    });

    // Count Posts
    database.ref('posts').once('value', (snapshot) => {
        document.getElementById('statTotalPosts').textContent = snapshot.numChildren().toLocaleString();
    });

    // Count Reports
    database.ref('reports').orderByChild('status').equalTo('pending').once('value', (snapshot) => {
        const count = snapshot.numChildren();
        document.getElementById('statReports').textContent = count;
        document.getElementById('reportCount').textContent = count;
        if(count > 0) {
            document.getElementById('reportCount').classList.remove('hidden');
        }
    });
}

function loadRecentUsers() {
    const tableBody = document.getElementById('recentUsersTable');
    
    // Get last 10 users
    database.ref('users').limitToLast(10).once('value', (snapshot) => {
        const users = [];
        snapshot.forEach(child => {
            users.push({ id: child.key, ...child.val() });
        });
        
        // Reverse to show newest first
        users.reverse();

        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const tr = document.createElement('tr');
            const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
            
            tr.innerHTML = `
                <td>
                    <div class="flex items-center gap-3">
                        <img src="${user.avatar || 'https://i.pravatar.cc/150'}" class="w-8 h-8 rounded-full bg-slate-700">
                        <span class="font-medium text-white">${user.displayName || 'User'}</span>
                    </div>
                </td>
                <td class="text-slate-400">${user.email}</td>
                <td>${joinedDate}</td>
                <td><span class="badge badge-success">Active</span></td>
                <td>
                    <button class="text-slate-400 hover:text-white mr-2" title="View Profile" onclick="window.open('../profile.html?id=${user.id}', '_blank')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    <button class="text-red-400 hover:text-red-300" title="Ban User" onclick="banUser('${user.id}')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    });
}

function banUser(uid) {
    if(confirm('Are you sure you want to ban this user?')) {
        alert('This is a demo. In a real app, this would disable the account.');
    }
}