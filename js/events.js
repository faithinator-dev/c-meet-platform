// Events System

// Load events
function loadEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '<div class="loading col-span-full">Loading events...</div>';

    database.ref('events').orderByChild('date').on('value', (snapshot) => {
        const events = [];
        snapshot.forEach((childSnapshot) => {
            const event = childSnapshot.val();
            event.id = childSnapshot.key;
            // Only show future events
            if (new Date(event.date) >= new Date().setHours(0,0,0,0)) {
                events.push(event);
            }
        });

        // Sort by date ascending
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (events.length === 0) {
            eventsGrid.innerHTML = '<div class="empty-state col-span-full">No upcoming events. Create one!</div>';
            return;
        }

        eventsGrid.innerHTML = '';
        events.forEach(event => {
            displayEventCard(event);
        });
    });
}

// Display Event Card
function displayEventCard(event) {
    const eventsGrid = document.getElementById('eventsGrid');
    const user = auth.currentUser;
    const isAttending = event.attendees && event.attendees[user.uid];
    const attendeeCount = event.attendees ? Object.keys(event.attendees).length : 0;

    const card = document.createElement('div');
    card.className = 'bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-brand-blue transition-all group';
    
    card.innerHTML = `
        <div class="h-32 bg-slate-700 relative overflow-hidden">
            <img src="${event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&h=300&fit=crop'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute top-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white border border-slate-600">
                ${new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
        </div>
        <div class="p-4">
            <h3 class="font-bold text-white text-lg mb-1 truncate">${event.name}</h3>
            <div class="flex items-center gap-2 text-xs text-slate-400 mb-3">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                ${event.location}
            </div>
            <p class="text-sm text-slate-300 mb-4 line-clamp-2">${event.description}</p>
            <div class="flex items-center justify-between mt-auto">
                <span class="text-xs text-slate-500">${attendeeCount} going</span>
                <button class="rsvp-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isAttending ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-brand-blue text-white hover:bg-blue-600'}" onclick="toggleRSVP('${event.id}')">
                    ${isAttending ? 'Going ✓' : 'Join Event'}
                </button>
            </div>
        </div>
    `;
    eventsGrid.appendChild(card);
}

// Create Event
async function createEvent() {
    const user = auth.currentUser;
    if (!user) return;

    const name = document.getElementById('eventNameInput').value;
    const date = document.getElementById('eventDateInput').value;
    const location = document.getElementById('eventLocationInput').value;
    const description = document.getElementById('eventDescInput').value;

    if (!name || !date || !location) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const newEventRef = database.ref('events').push();
        await newEventRef.set({
            name,
            date,
            location,
            description,
            createdBy: user.uid,
            creatorName: user.displayName,
            createdAt: Date.now(),
            attendees: {
                [user.uid]: true
            }
        });

        document.getElementById('createEventModal').classList.add('hidden');
        // Reset form
        document.getElementById('eventNameInput').value = '';
        document.getElementById('eventDateInput').value = '';
        document.getElementById('eventLocationInput').value = '';
        document.getElementById('eventDescInput').value = '';
        
        showNotification('Event created successfully!');
        if (typeof sounds !== 'undefined') sounds.success();
    } catch (error) {
        console.error('Error creating event:', error);
        alert('Failed to create event');
    }
}

// Toggle RSVP
async function toggleRSVP(eventId) {
    const user = auth.currentUser;
    if (!user) return;

    const rsvpRef = database.ref(`events/${eventId}/attendees/${user.uid}`);
    const snapshot = await rsvpRef.once('value');

    if (snapshot.exists()) {
        await rsvpRef.remove();
        showNotification('You are no longer attending this event.');
    } else {
        await rsvpRef.set(true);
        showNotification('You are now attending this event!');
        if (typeof sounds !== 'undefined') sounds.success();
    }
}

// Expose globally
window.createEvent = createEvent;
window.toggleRSVP = toggleRSVP;
window.loadEvents = loadEvents;