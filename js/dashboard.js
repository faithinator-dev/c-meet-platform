// Dashboard Functionality

let currentUser = null;
let allRooms = [];
let currentFilter = "all";
let currentView = "feed"; // feed, rooms, pages, friends
window.userSettings = {}; // Global settings object

// Check authentication
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  // Get user data from database
  const userSnapshot = await database.ref("users/" + user.uid).once("value");
  const userData = userSnapshot.val();

  // Initialize settings
  window.userSettings = userData || {};
  if (typeof applyTheme === "function")
    applyTheme(userData.theme, userData.accentColor);

  // Set user avatar in create post card
  if (document.getElementById("userAvatarSmall")) {
    document.getElementById("userAvatarSmall").src =
      userData.avatar ||
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E";
  }
  if (document.getElementById("postUserAvatar")) {
    document.getElementById("postUserAvatar").src =
      userData.avatar ||
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E";
  }
  if (document.getElementById("postUserName")) {
    document.getElementById("postUserName").textContent =
      userData.displayName || userData.name || "User";
  }

  // Request notification permission
  if (typeof requestNotificationPermission === "function") {
    requestNotificationPermission();
  }

  // Initialize browser notifications
  if (typeof initializeNotifications === "function") {
    initializeNotifications(user.uid);
  }

  // Listen for private messages
  if (typeof listenForPrivateMessages === "function") {
    listenForPrivateMessages(user.uid);
  }

  // Display friend requests in right sidebar
  if (typeof displayFriendRequests === "function") {
    displayFriendRequests();
  }
  
  // Load friend requests for badge count (even if not on Friends view)
  if (typeof loadFriendRequestsMain === "function") {
    loadFriendRequestsMain();
  }

  // Load feed by default
  loadPostsFeed();

  // Load online friends
  loadOnlineFriends();

  // Load Discovery Features
  if (typeof loadTrendingTopics === "function") loadTrendingTopics();
  if (typeof loadProfileVisitors === "function") loadProfileVisitors();
  if (typeof loadDiscovery === "function") loadDiscovery();

  // Listen for notifications
  listenForNotifications();

  // Initialize user search and private messaging
  if (typeof initializeUserSearch === "function") {
    initializeUserSearch();
  }
  if (typeof initializePrivateMessaging === "function") {
    initializePrivateMessaging();
  }
});

// Make sure profile and message features are initialized after page load
document.addEventListener("DOMContentLoaded", () => {
  // Tab switching
  setupTabSwitching();

  // Setup mobile navigation
  setupMobileNavigation();

  // Create menu dropdown
  setupCreateMenu();

  // Search functionality
  setupGlobalSearch();

  // Check for hash parameters (e.g., #settings, #messages)
  const hash = window.location.hash.substring(1);
  if (hash === "settings" && typeof openSettings === "function") {
    openSettings();
  }

  // Ensure all modals can be closed with click outside
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  });
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await auth.signOut();
    window.location.href = "index.html";
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
});

// Load Rooms
async function loadRooms() {
  const roomsRef = database.ref("rooms");
  roomsRef.on("value", (snapshot) => {
    allRooms = [];
    const roomsGrid = document.getElementById("roomsGrid");
    roomsGrid.innerHTML = "";

    snapshot.forEach((childSnapshot) => {
      const room = {
        id: childSnapshot.key,
        ...childSnapshot.val(),
      };
      allRooms.push(room);
    });

    // Sort by creation date (newest first)
    allRooms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    displayRooms(allRooms);
  });
}

// Display Rooms
function displayRooms(rooms) {
  const roomsGrid = document.getElementById("roomsGrid");
  roomsGrid.innerHTML = "";

  const filteredRooms =
    currentFilter === "all"
      ? rooms
      : rooms.filter((room) => room.category === currentFilter);

  if (filteredRooms.length === 0) {
    roomsGrid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 40px;">No rooms found. Create one!</p>';
    return;
  }

  filteredRooms.forEach((room) => {
    const memberCount = room.members ? Object.keys(room.members).length : 0;

    const roomCard = document.createElement("div");
    roomCard.className = "room-card";
    roomCard.innerHTML = `
            <img src="${room.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23334155'/%3E%3C/svg%3E"}" 
                 alt="${room.name}" class="room-card-image">
            <div class="room-card-content">
                <div class="room-card-header">
                    <h3 class="room-card-title">${room.name}</h3>
                    <span class="room-card-category">${room.category}</span>
                </div>
                <p class="room-card-description">${room.description}</p>
                <div class="room-card-footer">
                    <div class="room-members-count">
                        <svg width="16" height="16" fill="currentColor">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2 1c-1.105 0-2 .895-2 2v3h4v-3c0-1.105-.895-2-2-2zm-6 0c-1.105 0-2 .895-2 2v3h4v-3c0-1.105-.895-2-2-2zm2-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                        </svg>
                        ${memberCount} members
                    </div>
                    <span style="color: var(--text-light); font-size: 12px;">
                        ${new Date(room.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        `;

    roomCard.addEventListener("click", () => {
      joinRoom(room.id);
    });

    roomsGrid.appendChild(roomCard);
  });
}

// Join Room
async function joinRoom(roomId) {
  try {
    // Add user to room members
    await database.ref(`rooms/${roomId}/members/${currentUser.uid}`).set({
      name: currentUser.displayName,
      joinedAt: new Date().toISOString(),
    });

    // Redirect to room
    window.location.href = `room.html?id=${roomId}`;
  } catch (error) {
    alert("Failed to join room: " + error.message);
  }
}

// Search Rooms
document.getElementById("searchRooms").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = allRooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm) ||
      room.description.toLowerCase().includes(searchTerm),
  );
  displayRooms(filtered);
});

// Filter Tags
document.querySelectorAll(".tag").forEach((tag) => {
  tag.addEventListener("click", function () {
    document
      .querySelectorAll(".tag")
      .forEach((t) => t.classList.remove("active"));
    this.classList.add("active");
    currentFilter = this.getAttribute("data-filter");
    displayRooms(allRooms);
  });
});

// Create Room Modal
const createRoomModal = document.getElementById("createRoomModal");
const createRoomBtn = document.getElementById("createRoomBtn");
const closeModal = document.getElementById("closeModal");

createRoomBtn.addEventListener("click", () => {
  createRoomModal.classList.remove("hidden");
});

closeModal.addEventListener("click", () => {
  createRoomModal.classList.add("hidden");
});

window.addEventListener("click", (e) => {
  if (e.target === createRoomModal) {
    createRoomModal.classList.add("hidden");
  }
});

// Update create room modal handling for new layout
document
  .getElementById("submitCreateRoom")
  ?.addEventListener("click", async () => {
    const name = document.getElementById("roomNameInput").value.trim();
    const description = document.getElementById("roomDescInput").value.trim();
    const category = document.getElementById("roomCategoryInput").value;
    const isPrivate = document.getElementById("roomPrivateCheck").checked;

    if (!name || !description) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const newRoomRef = database.ref("rooms").push();
      await newRoomRef.set({
        name: name,
        description: description,
        category: category,
        isPrivate: isPrivate,
        image:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23334155'/%3E%3C/svg%3E",
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        members: {
          [currentUser.uid]: {
            name: currentUser.displayName,
            joinedAt: new Date().toISOString(),
          },
        },
      });

      document.getElementById("createRoomModal").classList.add("hidden");
      document.getElementById("roomNameInput").value = "";
      document.getElementById("roomDescInput").value = "";
      document.getElementById("roomPrivateCheck").checked = false;

      // Join the room
      window.location.href = `room.html?id=${newRoomRef.key}`;
    } catch (error) {
      alert("Failed to create room: " + error.message);
    }
  });

// Legacy Create Room Form (for old modal if exists)
document
  .getElementById("createRoomForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("roomName").value;
    const description = document.getElementById("roomDescription").value;
    const category = document.getElementById("roomCategory").value;
    const image = document.getElementById("roomImage").value;

    try {
      const newRoomRef = database.ref("rooms").push();
      await newRoomRef.set({
        name: name,
        description: description,
        category: category,
        image:
          image ||
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23334155'/%3E%3C/svg%3E",
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        members: {
          [currentUser.uid]: {
            name: currentUser.displayName,
            joinedAt: new Date().toISOString(),
          },
        },
      });

      createRoomModal.classList.add("hidden");
      document.getElementById("createRoomForm").reset();

      // Join the room
      window.location.href = `room.html?id=${newRoomRef.key}`;
    } catch (error) {
      alert("Failed to create room: " + error.message);
    }
  });

// Close modal buttons
document
  .getElementById("closeCreateRoomModal")
  ?.addEventListener("click", () => {
    document.getElementById("createRoomModal").classList.add("hidden");
  });

// Upload Room Image
document.getElementById("uploadImageBtn")?.addEventListener("click", () => {
  document.getElementById("imageUpload").click();
});

document
  .getElementById("imageUpload")
  ?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const imageUrl = await uploadToImgur(file);
        document.getElementById("roomImage").value = imageUrl;
        alert("Image uploaded successfully!");
      } catch (error) {
        alert("Failed to upload image: " + error.message);
      }
    }
  });

// Profile Modal
const profileModal = document.getElementById("profileModal");
const profileLink = document.getElementById("profileLink");
const closeProfileModal = document.getElementById("closeProfileModal");

if (profileLink && profileModal && closeProfileModal) {
  profileLink.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Please log in first");
      return;
    }

    // Load user profile
    const userSnapshot = await database
      .ref("users/" + currentUser.uid)
      .once("value");
    const userData = userSnapshot.val();

    document.getElementById("profileName").value = userData.name || "";
    document.getElementById("profileBio").value = userData.bio || "";
    document.getElementById("profileInterests").value = userData.interests
      ? userData.interests.join(", ")
      : "";
    document.getElementById("profileAvatar").src =
      userData.avatar ||
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23334155'/%3E%3C/svg%3E";

    profileModal.classList.remove("hidden");
  });

  closeProfileModal.addEventListener("click", () => {
    profileModal.classList.add("hidden");
  });

  window.addEventListener("click", (e) => {
    if (e.target === profileModal) {
      profileModal.classList.add("hidden");
    }
  });
}

// Upload Avatar
document.getElementById("uploadAvatarBtn").addEventListener("click", () => {
  document.getElementById("avatarUpload").click();
});

document
  .getElementById("avatarUpload")
  .addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const imageUrl = await uploadToImgur(file);
        document.getElementById("profileAvatar").src = imageUrl;
        alert("Avatar uploaded successfully!");
      } catch (error) {
        alert("Failed to upload avatar: " + error.message);
      }
    }
  });

// Save Profile
document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("profileName").value;
  const bio = document.getElementById("profileBio").value;
  const interests = document
    .getElementById("profileInterests")
    .value.split(",")
    .map((i) => i.trim())
    .filter((i) => i);
  const avatar = document.getElementById("profileAvatar").src;

  try {
    await database.ref("users/" + currentUser.uid).update({
      name: name,
      bio: bio,
      interests: interests,
      avatar: avatar,
    });

    // Update display name
    await currentUser.updateProfile({
      displayName: name,
      photoURL: avatar,
    });

    document.getElementById("userName").textContent = name;
    profileModal.classList.add("hidden");
    alert("Profile updated successfully!");
  } catch (error) {
    alert("Failed to update profile: " + error.message);
  }
});

// Notifications
const notificationBell = document.getElementById("notificationBell");
const notificationDropdown = document.getElementById("notificationDropdown");

notificationBell.addEventListener("click", () => {
  notificationDropdown.classList.toggle("hidden");
});

window.addEventListener("click", (e) => {
  if (
    !notificationBell.contains(e.target) &&
    !notificationDropdown.contains(e.target)
  ) {
    notificationDropdown.classList.add("hidden");
  }
});

// Current notification filter
let currentNotificationTab = 'all';
let previousNotificationCount = 0;

function listenForNotifications() {
  const notificationsRef = database.ref(`notifications/${currentUser.uid}`);
  const friendRequestsRef = database.ref(`friendRequests/${currentUser.uid}`);
  
  // Listen to both notifications and friend requests
  notificationsRef.on("value", (snapshot) => {
    displayNotifications();
    
    // Play sound for new notifications
    let currentCount = 0;
    snapshot.forEach(child => {
      if (!child.val().read) currentCount++;
    });
    
    if (currentCount > previousNotificationCount && previousNotificationCount > 0) {
      if (typeof sounds !== 'undefined') sounds.notification();
    }
    previousNotificationCount = currentCount;
  });
  
  friendRequestsRef.on("value", () => {
    displayNotifications();
  });
}

async function displayNotifications() {
  const notificationList = document.getElementById("notificationList");
  if (!notificationList) return;
  
  notificationList.innerHTML = "";

  let allNotifications = [];
  let unreadCount = 0;
  let friendRequestCount = 0;

  // Get regular notifications
  const notifSnapshot = await database.ref(`notifications/${currentUser.uid}`).once('value');
  notifSnapshot.forEach((childSnapshot) => {
    const notification = childSnapshot.val();
    notification.id = childSnapshot.key;
    notification.notifType = 'regular';
    if (!notification.read) unreadCount++;
    allNotifications.push(notification);
  });

  // Get friend requests
  const friendReqSnapshot = await database.ref(`friendRequests/${currentUser.uid}`).once('value');
  if (friendReqSnapshot.exists()) {
    for (const childSnapshot of friendReqSnapshot.children) {
      const request = childSnapshot.val();
      if (request.status === 'pending') {
        friendRequestCount++;
        unreadCount++;
        
        allNotifications.push({
          id: childSnapshot.key,
          notifType: 'friend_request',
          title: 'Friend Request',
          message: `${request.senderName} sent you a friend request`,
          timestamp: request.timestamp,
          senderAvatar: request.senderAvatar,
          senderId: childSnapshot.key,
          read: false
        });
      }
    }
  }

  // Sort by timestamp (newest first)
  allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Filter based on current tab
  let filteredNotifications = allNotifications;
  if (currentNotificationTab === 'friends') {
    filteredNotifications = allNotifications.filter(n => n.notifType === 'friend_request');
  } else if (currentNotificationTab === 'activity') {
    filteredNotifications = allNotifications.filter(n => n.notifType === 'regular');
  }

  // Display notifications
  if (filteredNotifications.length === 0) {
    notificationList.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          <p class="text-slate-500 text-sm">No notifications</p>
        </div>
      </div>
    `;
  } else {
    filteredNotifications.forEach(notification => {
      const notifItem = document.createElement("div");
      notifItem.className = `notification-item p-4 hover:bg-slate-700/50 transition-all cursor-pointer border-b border-slate-700/50 ${!notification.read ? 'bg-slate-700/20' : ''}`;
      
      if (notification.notifType === 'friend_request') {
        notifItem.innerHTML = `
          <div class="flex items-start gap-3">
            <img src="${notification.senderAvatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23334155\'/%3E%3C/svg%3E'}" 
                 class="w-10 h-10 rounded-full object-cover" />
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <p class="text-white font-medium text-sm">${notification.title}</p>
                  <p class="text-slate-400 text-xs mt-0.5">${notification.message}</p>
                  <p class="text-slate-500 text-xs mt-1">${timeAgo(notification.timestamp)}</p>
                </div>
                ${!notification.read ? '<span class="w-2 h-2 bg-brand-blue rounded-full flex-shrink-0 mt-1"></span>' : ''}
              </div>
              <div class="flex gap-2 mt-2">
                <button onclick="acceptFriendRequestFromNotif('${notification.senderId}', event)" 
                        class="flex-1 bg-brand-blue hover:bg-blue-600 text-white text-xs py-1.5 px-3 rounded-lg font-medium transition-all">
                  Accept
                </button>
                <button onclick="rejectFriendRequestFromNotif('${notification.senderId}', event)" 
                        class="flex-1 bg-slate-600 hover:bg-slate-500 text-white text-xs py-1.5 px-3 rounded-lg font-medium transition-all">
                  Decline
                </button>
              </div>
            </div>
          </div>
        `;
      } else {
        const iconType = getNotificationIcon(notification.type);
        notifItem.innerHTML = `
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              ${iconType}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <p class="text-white font-medium text-sm">${notification.title}</p>
                  <p class="text-slate-400 text-xs mt-0.5">${notification.message}</p>
                  <p class="text-slate-500 text-xs mt-1">${timeAgo(notification.timestamp)}</p>
                </div>
                ${!notification.read ? '<span class="w-2 h-2 bg-brand-blue rounded-full flex-shrink-0 mt-1"></span>' : ''}
              </div>
            </div>
          </div>
        `;
        
        notifItem.addEventListener("click", async () => {
          await database
            .ref(`notifications/${currentUser.uid}/${notification.id}`)
            .update({ read: true });

          if (notification.roomId) {
            window.location.href = `room.html?id=${notification.roomId}`;
          } else if (notification.postId) {
            window.location.href = `dashboard.html#post-${notification.postId}`;
          }
        });
      }

      notificationList.appendChild(notifItem);
    });
  }

  // Update badges
  const notificationBadge = document.getElementById("notificationCount");
  const mobileNotificationBadge = document.getElementById("mobileNotificationCount");
  const friendRequestBadge = document.getElementById("friendRequestNotifBadge");
  
  if (unreadCount > 0) {
    notificationBadge?.classList.remove("hidden");
    mobileNotificationBadge?.classList.remove("hidden");
  } else {
    notificationBadge?.classList.add("hidden");
    mobileNotificationBadge?.classList.add("hidden");
  }
  
  if (friendRequestCount > 0) {
    friendRequestBadge?.classList.remove("hidden");
    friendRequestBadge.textContent = friendRequestCount;
  } else {
    friendRequestBadge?.classList.add("hidden");
  }
}

function getNotificationIcon(type) {
  switch(type) {
    case 'like':
      return '<svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/></svg>';
    case 'comment':
      return '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>';
    case 'friend':
      return '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>';
    case 'mention':
      return '<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/></svg>';
    default:
      return '<svg class="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>';
  }
}

function timeAgo(timestamp) {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function switchNotificationTab(tab) {
  currentNotificationTab = tab;
  
  // Update tab styling
  document.querySelectorAll('.notification-tab').forEach(t => {
    const isActive = t.getAttribute('data-tab') === tab;
    const underline = t.querySelector('span:last-child');
    
    if (isActive) {
      t.classList.add('active', 'text-white');
      t.classList.remove('text-slate-400');
      underline.style.opacity = '1';
    } else {
      t.classList.remove('active', 'text-white');
      t.classList.add('text-slate-400');
      underline.style.opacity = '0';
    }
  });
  
  displayNotifications();
}

async function acceptFriendRequestFromNotif(senderId, event) {
  event.stopPropagation();
  if (typeof acceptFriendRequest === 'function') {
    await acceptFriendRequest(senderId);
    displayNotifications();
  }
}

async function rejectFriendRequestFromNotif(senderId, event) {
  event.stopPropagation();
  if (typeof rejectFriendRequest === 'function') {
    await rejectFriendRequest(senderId);
    displayNotifications();
  }
}

async function markAllNotificationsAsRead() {
  const updates = {};
  const snapshot = await database.ref(`notifications/${currentUser.uid}`).once('value');
  snapshot.forEach(child => {
    updates[`notifications/${currentUser.uid}/${child.key}/read`] = true;
  });
  await database.ref().update(updates);
  displayNotifications();
}

function viewAllNotifications() {
  // You can implement a dedicated notifications page
  alert('View all notifications - Feature coming soon!');
}
// Tab switching functionality
function setupTabSwitching() {
  const feedTab = document.getElementById("feedTab");
  const roomsTab = document.getElementById("roomsTab");
  const pagesTab = document.getElementById("pagesTab");
  const friendsTab = document.getElementById("friendsTab");
  const eventsTab = document.getElementById("eventsTab");

  const feedView = document.getElementById("feedView");
  const roomsView = document.getElementById("roomsView");
  const pagesView = document.getElementById("pagesView");
  const friendsView = document.getElementById("friendsView");
  const eventsView = document.getElementById("eventsView");
  const usersGrid = document.getElementById("usersGrid");

  feedTab?.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".sidebar-item")
      .forEach((item) => item.classList.remove("active"));
    feedTab.classList.add("active");

    feedView.classList.remove("hidden");
    roomsView.classList.add("hidden");
    pagesView.classList.add("hidden");
    friendsView.classList.add("hidden");
    eventsView.classList.add("hidden");
    usersGrid.classList.add("hidden");

    currentView = "feed";
    if (typeof loadPostsFeed === "function") loadPostsFeed();
  });

  roomsTab?.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".sidebar-item")
      .forEach((item) => item.classList.remove("active"));
    roomsTab.classList.add("active");

    feedView.classList.add("hidden");
    roomsView.classList.remove("hidden");
    pagesView.classList.add("hidden");
    friendsView.classList.add("hidden");
    eventsView.classList.add("hidden");
    usersGrid.classList.add("hidden");

    currentView = "rooms";
    loadRooms();
  });

  pagesTab?.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".sidebar-item")
      .forEach((item) => item.classList.remove("active"));
    pagesTab.classList.add("active");

    feedView.classList.add("hidden");
    roomsView.classList.add("hidden");
    pagesView.classList.remove("hidden");
    friendsView.classList.add("hidden");
    eventsView.classList.add("hidden");
    usersGrid.classList.add("hidden");

    currentView = "pages";
    if (typeof loadPages === "function") loadPages();
  });

  friendsTab?.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".sidebar-item")
      .forEach((item) => item.classList.remove("active"));
    friendsTab.classList.add("active");

    feedView.classList.add("hidden");
    roomsView.classList.add("hidden");
    pagesView.classList.add("hidden");
    friendsView.classList.remove("hidden");
    eventsView.classList.add("hidden");
    usersGrid.classList.add("hidden");

    currentView = "friends";
    loadFriends();
    if (typeof loadDiscovery === "function") loadDiscovery();
  });

  eventsTab?.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".sidebar-item")
      .forEach((item) => item.classList.remove("active"));
    eventsTab.classList.add("active");

    feedView.classList.add("hidden");
    roomsView.classList.add("hidden");
    pagesView.classList.add("hidden");
    friendsView.classList.add("hidden");
    eventsView.classList.remove("hidden");
    usersGrid.classList.add("hidden");

    currentView = "events";
    if (typeof loadEvents === "function") loadEvents();
  });
}

// Create menu dropdown
function setupCreateMenu() {
  const createMenuBtn = document.getElementById("createMenuBtn");
  const createDropdown = document.getElementById("createDropdown");
  const createRoomBtnMenu = document.getElementById("createRoomBtnMenu");

  createMenuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    createDropdown.classList.toggle("hidden");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!createMenuBtn?.contains(e.target)) {
      createDropdown.classList.add("hidden");
    }
  });

  // Create room from menu
  createRoomBtnMenu?.addEventListener("click", () => {
    createDropdown.classList.add("hidden");
    document.getElementById("createRoomModal").classList.remove("hidden");
  });
}

// Global search functionality
function setupGlobalSearch() {
  const globalSearch = document.getElementById("globalSearch");
  const mobileSearch = document.getElementById("mobileSearch");
  const searchFilter = document.getElementById("searchFilter");

  const handleSearch = async (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filter = searchFilter.value;

    if (searchTerm.length === 0) {
      // Return to current view
      document.getElementById(currentView + "View")?.classList.remove("hidden");
      document.getElementById("usersGrid").classList.add("hidden");
      return;
    }

    // Perform search
    await performGlobalSearch(searchTerm, filter);
  };

  globalSearch?.addEventListener("input", handleSearch);
  mobileSearch?.addEventListener("input", handleSearch);
}

// Perform global search
async function performGlobalSearch(searchTerm, filter) {
  const feedView = document.getElementById("feedView");
  const roomsView = document.getElementById("roomsView");
  const pagesView = document.getElementById("pagesView");
  const friendsView = document.getElementById("friendsView");
  const eventsView = document.getElementById("eventsView");
  const usersGrid = document.getElementById("usersGrid");
  const roomsGrid = document.getElementById("roomsGrid");
  const pagesGrid = document.getElementById("pagesGrid");

  // Hide all views
  feedView.classList.add("hidden");
  roomsView.classList.add("hidden");
  pagesView.classList.add("hidden");
  friendsView.classList.add("hidden");
  eventsView.classList.add("hidden");
  usersGrid.classList.add("hidden");

  if (filter === "people" || filter === "all") {
    // Search users
    const usersSnapshot = await database.ref("users").once("value");
    const users = [];
    usersSnapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      user.uid = childSnapshot.key;
      if (
        user.displayName?.toLowerCase().includes(searchTerm) ||
        user.name?.toLowerCase().includes(searchTerm)
      ) {
        users.push(user);
      }
    });

    if (users.length > 0) {
      usersGrid.classList.remove("hidden");
      usersGrid.innerHTML =
        '<h3 class="text-white text-lg font-semibold mb-4">People</h3><div id="searchUsersGrid" class="grid grid-cols-1 gap-4"></div>';
      const searchUsersContainer = document.getElementById("searchUsersGrid");
      users.forEach((user) => {
        const userCard = document.createElement("div");
        userCard.className =
          "bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-brand-blue transition-all cursor-pointer";
        userCard.onclick = () => {
          window.location.href = `profile.html?id=${user.uid}`;
        };

        userCard.innerHTML = `
                    <div class="flex items-center gap-3">
                        <img src="${user.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23334155'/%3E%3C/svg%3E"}" 
                             alt="${user.displayName || user.name || "User"}" 
                             class="w-12 h-12 rounded-full object-cover border-2 border-slate-700">
                        <div class="flex-1 min-w-0">
                            <h4 class="text-white font-semibold truncate">${user.displayName || user.name || "User"}</h4>
                            <p class="text-slate-400 text-sm truncate">${user.bio || user.email || "C-meet user"}</p>
                        </div>
                        ${user.isVerified ? '<svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>' : ""}
                        <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </div>
                `;
        searchUsersContainer.appendChild(userCard);
      });
    }
  }

  if (filter === "rooms" || filter === "all") {
    // Search rooms
    const rooms = allRooms.filter(
      (room) =>
        room.name.toLowerCase().includes(searchTerm) ||
        room.description.toLowerCase().includes(searchTerm),
    );

    if (rooms.length > 0) {
      roomsView.classList.remove("hidden");
      roomsGrid.innerHTML = "";
      rooms.forEach((room) => {
        const memberCount = room.members ? Object.keys(room.members).length : 0;
        const roomCard = document.createElement("div");
        roomCard.className = "room-card";
        roomCard.innerHTML = `
                    <img src="${room.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23334155'/%3E%3C/svg%3E"}" alt="${room.name}" class="room-card-image">
                    <div class="room-card-content">
                        <h3>${room.name}</h3>
                        <p>${room.description}</p>
                        <span>${memberCount} members</span>
                    </div>
                `;
        roomCard.addEventListener("click", () =>
          requestJoinRoom(room.id, room.isPrivate),
        );
        roomsGrid.appendChild(roomCard);
      });
    }
  }

  if (filter === "pages" || filter === "all") {
    // Search pages
    const pagesSnapshot = await database.ref("pages").once("value");
    const pages = [];
    pagesSnapshot.forEach((childSnapshot) => {
      const page = childSnapshot.val();
      page.id = childSnapshot.key;
      if (
        page.name?.toLowerCase().includes(searchTerm) ||
        page.description?.toLowerCase().includes(searchTerm)
      ) {
        pages.push(page);
      }
    });

    if (pages.length > 0) {
      pagesView.classList.remove("hidden");
      pagesGrid.innerHTML = "";
      pages.forEach((page) => {
        if (typeof displayPageCard === "function") {
          displayPageCard(page);
        }
      });
    }
  }
}

// Request to join room (with approval for private rooms)
async function requestJoinRoom(roomId, isPrivate) {
  const user = auth.currentUser;
  if (!user) return;

  if (isPrivate) {
    // Send join request
    const requestData = {
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      userAvatar:
        user.photoURL ||
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23334155'/%3E%3C/svg%3E",
      timestamp: Date.now(),
      status: "pending",
    };

    await database
      .ref(`roomJoinRequests/${roomId}/${user.uid}`)
      .set(requestData);

    // Notify room admin
    const roomSnapshot = await database.ref(`rooms/${roomId}`).once("value");
    const room = roomSnapshot.val();

    if (room.createdBy) {
      await database.ref(`notifications/${room.createdBy}`).push({
        type: "roomJoinRequest",
        from: user.uid,
        fromName: user.displayName || "Someone",
        roomId: roomId,
        roomName: room.name,
        timestamp: Date.now(),
        read: false,
      });
    }

    showNotification("Join request sent! Waiting for approval.");
  } else {
    // Join directly
    joinRoom(roomId);
  }
}

// Display user card (for friends list)
function displayUserCard(userData) {
  const friendsGrid = document.getElementById("friendsGrid");
  if (!friendsGrid) return;

  const userCard = document.createElement("div");
  userCard.className =
    "bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-brand-blue transition-all cursor-pointer";
  userCard.onclick = () => {
    window.location.href = `profile.html?id=${userData.uid}`;
  };

  userCard.innerHTML = `
        <div class="flex items-center gap-3">
            <img src="${userData.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23334155'/%3E%3C/svg%3E"}" 
                 alt="${userData.displayName || userData.name || "User"}" 
                 class="w-12 h-12 rounded-full object-cover border-2 border-slate-700">
            <div class="flex-1 min-w-0">
                <h4 class="text-white font-semibold truncate">${userData.displayName || userData.name || "User"}</h4>
                <p class="text-slate-400 text-sm truncate">${userData.bio || "C-meet user"}</p>
            </div>
            <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </div>
    `;

  friendsGrid.appendChild(userCard);
}

// Load friend requests in main Friends view
async function loadFriendRequestsMain() {
  const user = auth.currentUser;
  if (!user) return;

  const requestsGrid = document.getElementById("friendRequestsMainGrid");
  const noRequestsMsg = document.getElementById("noRequestsMessage");
  const requestsBadge = document.getElementById("friendRequestsBadge");
  const navBadge = document.getElementById("friendRequestsNavBadge");
  
  if (!requestsGrid) return;

  const friendRequestsRef = database.ref(`friendRequests/${user.uid}`);
  
  friendRequestsRef.on("value", async (snapshot) => {
    requestsGrid.innerHTML = "";
    let requestCount = 0;

    if (!snapshot.exists()) {
      noRequestsMsg?.classList.remove("hidden");
      requestsBadge?.classList.add("hidden");
      navBadge?.classList.add("hidden");
      return;
    }

    noRequestsMsg?.classList.add("hidden");

    for (const childSnapshot of snapshot.children) {
      const request = childSnapshot.val();
      const senderId = childSnapshot.key;

      if (request.status === "pending") {
        requestCount++;
        
        // Fetch sender details
        const senderSnapshot = await database.ref(`users/${senderId}`).once("value");
        const senderData = senderSnapshot.val();

        if (senderData) {
          const requestCard = document.createElement("div");
          requestCard.className = "bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-brand-blue/50 transition-all";
          requestCard.innerHTML = `
            <div class="flex items-center gap-3 mb-4">
              <img src="${senderData.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'30\' fill=\'%23334155\'/%3E%3C/svg%3E'}" 
                   alt="${senderData.displayName || 'User'}" 
                   class="w-16 h-16 rounded-full object-cover border-2 border-slate-600">
              <div class="flex-1 min-w-0">
                <h4 class="text-white font-semibold truncate">${senderData.displayName || senderData.name || "User"}</h4>
                <p class="text-slate-400 text-sm truncate">${senderData.bio || "C-meet user"}</p>
                ${senderData.mutualFriends ? `<p class="text-xs text-slate-500 mt-1">${senderData.mutualFriends} mutual friends</p>` : ''}
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick="acceptFriendRequest('${senderId}')" 
                      class="flex-1 bg-brand-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-all">
                Accept
              </button>
              <button onclick="rejectFriendRequest('${senderId}')" 
                      class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg font-medium transition-all">
                Decline
              </button>
            </div>
            <button onclick="window.location.href='profile.html?id=${senderId}'" 
                    class="w-full mt-2 text-sm text-slate-400 hover:text-brand-blue transition-colors">
              View Profile
            </button>
          `;
          requestsGrid.appendChild(requestCard);
        }
      }
    }

    // Update badges
    if (requestCount > 0) {
      requestsBadge?.classList.remove("hidden");
      requestsBadge.textContent = requestCount;
      navBadge?.classList.remove("hidden");
      navBadge.textContent = requestCount;
    } else {
      noRequestsMsg?.classList.remove("hidden");
      requestsBadge?.classList.add("hidden");
      navBadge?.classList.add("hidden");
    }
  });
}

// Mark all friend requests as read
function markAllRequestsAsRead() {
  // This is a placeholder - you can implement actual read status tracking if needed
  alert("All requests marked as read");
}

// Load friends list
async function loadFriends() {
  // Load friend requests first (prominent)
  loadFriendRequestsMain();
  
  // Load recommendations
  loadPeopleYouMayKnow();

  const user = auth.currentUser;
  if (!user) return;

  const friendsGrid = document.getElementById("friendsGrid");
  friendsGrid.innerHTML = '<div class="loading">Loading friends...</div>';

  const friendsRef = database.ref(`friends/${user.uid}`);
  friendsRef.on("value", async (snapshot) => {
    const friendIds = [];
    snapshot.forEach((childSnapshot) => {
      friendIds.push(childSnapshot.key);
    });

    if (friendIds.length === 0) {
      friendsGrid.innerHTML =
        '<div class="empty-state">No friends yet. Search for people to add!</div>';
      return;
    }

    friendsGrid.innerHTML = "";

    for (const friendId of friendIds) {
      const userSnapshot = await database
        .ref(`users/${friendId}`)
        .once("value");
      const friendData = userSnapshot.val();
      if (friendData) {
        friendData.uid = friendId;
        displayUserCard(friendData);
      }
    }
  });
}

// Load online friends in right sidebar
function loadOnlineFriends() {
  const user = auth.currentUser;
  if (!user) return;

  const onlineFriendsList = document.getElementById("onlineFriendsList");
  if (!onlineFriendsList) return;

  database.ref(`friends/${user.uid}`).on("value", async (snapshot) => {
    const friendIds = [];
    snapshot.forEach((childSnapshot) => {
      friendIds.push(childSnapshot.key);
    });

    onlineFriendsList.innerHTML = "";

    if (friendIds.length === 0) {
      onlineFriendsList.innerHTML =
        '<p style="font-size: 14px; color: var(--text-light);">No friends yet</p>';
      return;
    }

    for (const friendId of friendIds) {
      const userSnapshot = await database
        .ref(`users/${friendId}`)
        .once("value");
      const friendData = userSnapshot.val();

      if (friendData) {
        const friendItem = document.createElement("div");
        friendItem.className = "friend-item";
        friendItem.innerHTML = `
                    <img src="${friendData.avatar || "data:image/svg+xml,%3  3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23334155'/%3E%3C/svg%3E"}" alt="${friendData.displayName}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">
                    <span>${friendData.displayName || friendData.name || "User"}</span>
                `;
        friendItem.style.display = "flex";
        friendItem.style.alignItems = "center";
        friendItem.style.padding = "8px";
        friendItem.style.cursor = "pointer";
        friendItem.style.borderRadius = "4px";
        friendItem.addEventListener(
          "mouseenter",
          () => (friendItem.style.backgroundColor = "#f0f0f0"),
        );
        friendItem.addEventListener(
          "mouseleave",
          () => (friendItem.style.backgroundColor = "transparent"),
        );
        friendItem.addEventListener("click", () => {
          if (typeof openPrivateMessage === "function") {
            openPrivateMessage(
              friendId,
              friendData.displayName || friendData.name,
            );
          }
        });
        onlineFriendsList.appendChild(friendItem);
      }
    }
  });
}
// Function to load recommendations (People You May Know)
async function loadPeopleYouMayKnow() {
  const user = auth.currentUser;
  if (!user) return;

  const grid = document.getElementById("peopleYouMayKnowGrid");
  if (!grid) return;

  // Add loading state if empty
  if (grid.children.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center text-slate-500 py-4 animate-pulse">Finding people you may know...</div>`;
  }

  try {
    // 1. Get current user"s friends
    const friendsSnapshot = await database
      .ref(`friends/${user.uid}`)
      .once("value");
    const friendIds = new Set();
    friendsSnapshot.forEach((child) => friendIds.add(child.key));
    friendIds.add(user.uid); // Exclude self

    // 2. Get all users (Limit to recent 50)
    const usersSnapshot = await database
      .ref("users")
      .limitToLast(50)
      .once("value");
    const suggestions = [];

    usersSnapshot.forEach((child) => {
      // Exclude already friends & self
      if (!friendIds.has(child.key)) {
        suggestions.push({ uid: child.key, ...child.val() });
      }
    });

    // 3. Randomize and pick top 6
    // Simple shuffle
    const picks = suggestions.sort(() => 0.5 - Math.random()).slice(0, 6);

    if (picks.length === 0) {
      grid.innerHTML = `<div class="text-slate-500 col-span-full text-center py-4 text-sm bg-slate-800/20 rounded-lg">No new recommendations right now.</div>`;
      return;
    }

    grid.innerHTML = "";

    picks.forEach((userData) => {
      const card = document.createElement("div");
      card.className =
        "glass-panel p-4 rounded-xl border border-slate-700/50 flex flex-col items-center text-center hover:bg-slate-800/50 transition-colors relative group animate-fade-in-up cursor-pointer";

      // Make the whole card clickable to view profile
      card.addEventListener("click", (e) => {
        // Don't navigate if clicking the Add Friend button
        if (!e.target.closest(".add-friend-btn")) {
          window.location.href = `profile.html?id=${userData.uid}`;
        }
      });

      // Default avatar if missing
      const avatarUrl =
        userData.avatar ||
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Ccircle cx='75' cy='75' r='75' fill='%23334155'/%3E%3C/svg%3E";
      const displayName = userData.displayName || userData.name || "User";
      const email = userData.email || "";

      card.innerHTML = `
                <div class="relative mb-3">
                    <img src="${avatarUrl}" class="w-16 h-16 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-brand-blue/50 transition-all">
                    <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <h3 class="font-bold text-white text-sm mb-0.5 truncate w-full px-2" title="${displayName}">${displayName}</h3>
                <p class="text-xs text-slate-400 mb-3 truncate w-full px-2">${email}</p>
                
                <button class="add-friend-btn w-full py-2 rounded-lg bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1" data-uid="${userData.uid}">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Add Friend
                </button>
            `;

      // Add click listener for "Add Friend" button
      const btn = card.querySelector(".add-friend-btn");
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent card click
        // We assume sendFriendRequest function exists or we implement a simple version
        if (typeof sendFriendRequest === "function") {
          sendFriendRequest(userData.uid, btn);
        } else {
          // Fallback implementation
          btn.textContent = "Sent";
          btn.disabled = true;
          btn.classList.add("opacity-50", "cursor-not-allowed");
          // Real logic to send request in Firebase would go here
          database.ref(`friend_requests/${userData.uid}/${user.uid}`).set({
            from: user.uid,
            fromName: user.displayName || user.email,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
          });
        }
      });

      // Add card click to view profile -> navigate to profile
      card.addEventListener("click", (e) => {
        if (e.target !== btn && !btn.contains(e.target)) {
          window.location.href = `profile.html?id=${userData.uid}`;
        }
      });

      grid.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading recommendations:", error);
    grid.innerHTML = `<div class="text-red-400 text-xs col-span-full text-center">Failed to load suggestions</div>`;
  }
}

// Setup mobile navigation
function setupMobileNavigation() {
  const mobileFeedTab = document.getElementById("mobileFeedTab");
  const mobileRoomsTab = document.getElementById("mobileRoomsTab");
  const mobileFriendsTab = document.getElementById("mobileFriendsTab");
  const mobileProfileTab = document.getElementById("mobileProfileTab");
  const mobileCreateBtn = document.getElementById("mobileCreateBtn");
  const mobileNotificationBtn = document.getElementById(
    "mobileNotificationBtn",
  );

  // Feed tab
  if (mobileFeedTab) {
    mobileFeedTab.addEventListener("click", () => {
      document.getElementById("feedTab")?.click();
      updateMobileNavActive("mobileFeedTab");
    });
  }

  // Rooms tab
  if (mobileRoomsTab) {
    mobileRoomsTab.addEventListener("click", () => {
      document.getElementById("roomsTab")?.click();
      updateMobileNavActive("mobileRoomsTab");
    });
  }

  // Friends tab
  if (mobileFriendsTab) {
    mobileFriendsTab.addEventListener("click", () => {
      document.getElementById("friendsTab")?.click();
      updateMobileNavActive("mobileFriendsTab");
    });
  }

  // Profile tab
  if (mobileProfileTab) {
    mobileProfileTab.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  // Create button
  if (mobileCreateBtn) {
    mobileCreateBtn.addEventListener("click", () => {
      document.getElementById("createPostInputBtn")?.click();
    });
  }

  // Mobile notification button
  if (mobileNotificationBtn) {
    mobileNotificationBtn.addEventListener("click", () => {
      document.getElementById("notificationBell")?.click();
    });
  }
}

// Update active state for mobile nav
function updateMobileNavActive(activeId) {
  const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
  mobileNavItems.forEach((item) => {
    if (item.id === activeId) {
      item.classList.remove("text-slate-400");
      item.classList.add("text-brand-blue");
    } else {
      item.classList.remove("text-brand-blue");
      item.classList.add("text-slate-400");
    }
  });
}
