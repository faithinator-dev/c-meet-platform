# Group Admin System Documentation

## 🎯 Overview
Complete group management system with hierarchical roles: **Owner** (main admin), **Sub-Admins**, and **Members**.

## 👑 Role Hierarchy

### 1. **Owner (Main Admin)** - Red Badge 🔴
The user who created the group. Has **full control**.

**Permissions**:
- ✅ Add members to the group
- ✅ Remove any member (except themselves)
- ✅ Make members Sub-Admins
- ✅ Demote Sub-Admins to members
- ✅ **Delete the entire group**
- ✅ Leave the group (transfers ownership automatically)

**UI Features**:
- "Add Member" button - Opens modal to search and add users
- "Delete Group" button - Permanently deletes the group
- Can change roles of any member
- Can remove any member

### 2. **Sub-Admin** - Orange Badge 🟠
Appointed by the Owner to help manage the group.

**Permissions**:
- ✅ Add members to the group
- ✅ Remove regular members (NOT other Sub-Admins or Owner)
- ❌ Cannot change anyone's role
- ❌ Cannot delete the group
- ❌ Cannot remove other Sub-Admins or the Owner

**UI Features**:
- "Add Member" button - Can invite new members
- "Leave Group" button - Can leave voluntarily
- Can only remove regular members

### 3. **Member** - Blue Badge 🔵
Regular group members.

**Permissions**:
- ✅ Participate in group activities
- ✅ Create posts and comments
- ✅ Leave the group voluntarily
- ❌ Cannot manage other members
- ❌ Cannot change roles
- ❌ Cannot add or remove members

**UI Features**:
- "Leave Group" button only
- No member management controls

## 🔧 Features

### **Add Members**
Owners and Sub-Admins can add new members:
1. Click "Add Member" button
2. Modal opens showing all users not in the group
3. Search users by name or bio
4. Click "Add" next to a user to add them
5. New members join with "Member" role

### **Remove Members**
- **Owners**: Can remove anyone except Owner
- **Sub-Admins**: Can only remove regular Members
- Confirmation dialog before removal
- Member count updates automatically

### **Change Roles** (Owner Only)
1. Click gear icon ⚙️ next to a member
2. Select new role:
   - **Member**: Regular user
   - **Sub-Admin**: Can manage members
3. Confirm change
4. Badge and permissions update immediately

### **Delete Group** (Owner Only)
1. Click "Delete Group" button (red)
2. Two confirmation dialogs:
   - First: "Are you sure?"
   - Second: "This is permanent, continue?"
3. Group is permanently deleted
4. All members are removed
5. Redirects to Groups page

## 🎨 Visual Design

### **Role Badges**
```css
Owner      → Red badge    (#dc2626)
Sub-Admin  → Orange badge (#f59e0b)
Member     → Blue badge   (#3b82f6)
```

### **UI Elements**
- **Glass panel design** with backdrop blur
- **Hover effects** on member cards
- **Icon buttons** for actions (⚙️ for roles, ❌ for remove)
- **Search functionality** in Add Member modal
- **Responsive layout** with sidebar

## 📋 User Flows

### **Creating a Group**
1. Click "Create Group" on Groups page
2. Fill in name, description, category, privacy
3. Click "Create"
4. You become the **Owner** automatically
5. Group appears in "My Groups" tab

### **Managing Members (Owner)**
1. Go to group detail page
2. See all members with their roles
3. **To add**: Click "Add Member" → Search → Click "Add"
4. **To remove**: Click ❌ next to member → Confirm
5. **To promote**: Click ⚙️ → Select "Sub-Admin" → Confirm

### **Managing Members (Sub-Admin)**
1. Go to group detail page
2. Can see all members
3. **To add**: Click "Add Member" → Search → Click "Add"
4. **To remove**: Click ❌ next to regular members only
5. Cannot change roles or remove other admins

### **Deleting a Group (Owner)**
1. Go to group detail page
2. Click "Delete Group" (red button)
3. Confirm twice
4. Group is permanently deleted

## 🔐 Security & Permissions

### **Permission Checks**
```javascript
Permissions = {
  'owner': ['all'],                              // Full access
  'subadmin': ['add_members', 'remove_members'], // Member management only
  'member': ['create_posts', 'create_comments']  // Content creation only
}
```

### **Database Structure**
```javascript
groups/
  {groupId}/
    name: "Group Name"
    description: "..."
    owner: "creatorUserId"
    privacy: "public" | "private"
    memberCount: 10
    members/
      {userId1}/
        role: "owner"
        joinedAt: timestamp
        reputation: 50
      {userId2}/
        role: "subadmin"
        joinedAt: timestamp
        reputation: 30
      {userId3}/
        role: "member"
        joinedAt: timestamp
        reputation: 10
```

## ✨ Key Functions

### **JavaScript Functions**

```javascript
// group-detail.js

loadGroupDetails()        // Loads group info and members
loadMembers()            // Displays member list with controls
setupActionButtons()     // Shows buttons based on user role
loadAvailableUsers()     // Loads users not in group
addMemberToGroup(userId) // Adds a user to the group
kickUser(groupId, userId, userName) // Removes member
openRoleModal(userId, userName, currentRole) // Opens role change dialog
updateUserRole(groupId, userId, newRole) // Changes user's role
deleteGroup()            // Deletes entire group (owner only)
```

## 🚀 Usage Examples

### **Owner Actions**
```javascript
// Add a member
addMemberToGroup('user123')

// Remove a member
kickUser('groupId', 'user456', 'John Doe')

// Make someone sub-admin
updateUserRole('groupId', 'user789', 'subadmin')

// Delete group
deleteGroup()
```

### **Sub-Admin Actions**
```javascript
// Add a member
addMemberToGroup('user123')

// Remove a regular member (not other admins)
kickUser('groupId', 'regularUser', 'Jane Smith')
```

## 🎯 Testing Checklist

- [x] Create a group → Becomes Owner with red badge
- [x] Owner can add members → Opens modal with user search
- [x] Owner can remove any member → Confirmation dialog appears
- [x] Owner can promote to Sub-Admin → Role changes, orange badge
- [x] Owner can delete group → Two confirmations, group deleted
- [x] Sub-Admin can add members → Works same as owner
- [x] Sub-Admin can remove regular members → Works correctly
- [x] Sub-Admin CANNOT remove other admins → Button not shown
- [x] Sub-Admin CANNOT change roles → No gear icon shown
- [x] Sub-Admin CANNOT delete group → No delete button
- [x] Members can only leave → Only "Leave" button shown
- [x] Search users in Add Member modal → Filters correctly
- [x] Member count updates → Increases/decreases properly
- [x] Badges display correctly → Right color for each role

## 📱 Responsive Design

- **Desktop**: Full sidebar with admins list
- **Tablet**: Collapsible sidebar
- **Mobile**: Stacked layout, hamburger menu

## 🔧 Technical Details

### **Files Modified**
1. `js/groups.js` - Group creation with owner role
2. `js/group-detail.js` - Complete member management system
3. `group-detail.html` - UI with modals and role badges
4. `groups.html` - Role badge styling

### **New Features**
- Add Member modal with user search
- Role change modal (owner only)
- Delete group confirmation (owner only)
- Permission-based UI rendering
- Real-time member list updates

### **Performance**
- Uses `.once('value')` for user lists (not real-time)
- Cached member checks for fast filtering
- Efficient DOM updates with `appendChild`
- Search filtering on client side

## 🎨 Customization

### **Change Role Colors**
```css
.badge-owner { background: #dc2626; }    /* Red */
.badge-subadmin { background: #f59e0b; } /* Orange */
.badge-member { background: #3b82f6; }   /* Blue */
```

### **Add More Permissions**
```javascript
const permissions = {
  'owner': ['all'],
  'subadmin': ['add_members', 'remove_members', 'edit_group'],
  'member': ['create_posts', 'create_comments']
};
```

## 🐛 Troubleshooting

**Issue**: Sub-admin can't remove members
- **Fix**: Check `canModifyThisUser` logic in `loadMembers()`

**Issue**: Delete button shows for non-owners
- **Fix**: Verify `userRole === 'owner'` check in `setupActionButtons()`

**Issue**: Add Member modal doesn't show users
- **Fix**: Ensure `loadAvailableUsers()` filters existing members

**Issue**: Role badge wrong color
- **Fix**: Add CSS class `.badge-{roleName}` in HTML

## 📚 Related Documentation

- [Social Features Guide](SOCIAL_FEATURES_DOCS.md)
- [Profile System](PROFILE_SYSTEM_DOCS.md)
- [Performance Guide](PERFORMANCE_OPTIMIZATIONS.md)

---

**Version**: 1.0  
**Last Updated**: February 16, 2026  
**Status**: ✅ Fully Implemented
