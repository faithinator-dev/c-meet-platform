// creator-economy.js - Creator Economy & Monetization Features

// Micro-Tipping System (Stripe integration placeholder)
async function setupTippingButton(postId, creatorId) {
    const user = auth.currentUser;
    if (!user || user.uid === creatorId) return null;

    const tipBtn = document.createElement('button');
    tipBtn.className = 'tip-button bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:scale-105 transition-transform flex items-center gap-1';
    tipBtn.innerHTML = '💰 Tip Creator';
    tipBtn.onclick = () => showTipModal(postId, creatorId);
    
    return tipBtn;
}

async function showTipModal(postId, creatorId) {
    const creatorSnapshot = await database.ref(`users/${creatorId}`).once('value');
    const creator = creatorSnapshot.val();

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-md w-full p-6">
            <div class="text-center mb-6">
                <img src="${creator?.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'40\' fill=\'%23334155\'/%3E%3C/svg%3E'}" class="w-20 h-20 rounded-full mx-auto mb-3">
                <h3 class="text-xl font-bold text-white">Tip ${creator?.displayName || 'Creator'}</h3>
                <p class="text-sm text-slate-400">Support great content!</p>
            </div>

            <div class="grid grid-cols-4 gap-2 mb-4">
                ${[1, 5, 10, 25].map(amount => `
                    <button onclick="selectTipAmount(${amount})" class="tip-amount bg-slate-900 hover:bg-slate-700 text-white py-3 rounded-lg font-bold transition-colors">
                        $${amount}
                    </button>
                `).join('')}
            </div>

            <div class="mb-4">
                <label class="text-sm text-slate-400 block mb-2">Custom Amount</label>
                <input type="number" id="customTipAmount" placeholder="Enter amount" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" min="1">
            </div>

            <textarea id="tipMessage" placeholder="Add a message (optional)" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white resize-none h-20 mb-4"></textarea>

            <div class="flex gap-3">
                <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold">Cancel</button>
                <button onclick="processTip('${postId}', '${creatorId}')" class="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-3 rounded-lg font-semibold">Send Tip</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

let selectedTipAmount = 5;
function selectTipAmount(amount) {
    selectedTipAmount = amount;
    document.querySelectorAll('.tip-amount').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-yellow-500');
    });
    event.target.classList.add('ring-2', 'ring-yellow-500');
    document.getElementById('customTipAmount').value = '';
}

async function processTip(postId, creatorId) {
    const user = auth.currentUser;
    if (!user) return;

    const customAmount = document.getElementById('customTipAmount')?.value;
    const amount = customAmount ? parseFloat(customAmount) : selectedTipAmount;
    const message = document.getElementById('tipMessage')?.value || '';

    if (amount < 1) {
        alert('Minimum tip is $1');
        return;
    }

    // In production, integrate with Stripe API here
    // For now, just record the tip
    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref(`tips/${creatorId}`).push({
        from: user.uid,
        fromName: userData.displayName || 'Anonymous',
        fromAvatar: userData.avatar || '',
        amount: amount,
        message: message,
        postId: postId,
        timestamp: Date.now(),
        processed: false
    });

    // Update creator earnings
    const earningsRef = database.ref(`users/${creatorId}/earnings`);
    const earningsSnapshot = await earningsRef.once('value');
    const currentEarnings = earningsSnapshot.val() || 0;
    await earningsRef.set(currentEarnings + amount);

    document.querySelector('.fixed.inset-0')?.remove();
    showToast(`✅ Sent $${amount} tip!`);
}

// Service Marketplace
async function openServiceMarketplace() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">💼 Service Marketplace</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="flex justify-between items-center mb-6">
                    <input type="text" id="serviceSearch" placeholder="Search services..." class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white mr-4">
                    <button onclick="postNewService()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold whitespace-nowrap">+ Offer Service</button>
                </div>

                <div class="grid grid-cols-1 gap-3 mb-6">
                    ${['Design', 'Programming', 'Writing', 'Marketing', 'Music', 'Video Editing', 'Consulting', 'Teaching'].map(cat => `
                        <button onclick="filterServiceCategory('${cat}')" class="service-category-btn bg-slate-900 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            ${cat}
                        </button>
                    `).join('')}
                </div>

                <div id="servicesGrid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Services will load here -->
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadServices();
}

async function postNewService() {
    const title = prompt('Service Title:\n(e.g., "Logo Design", "Web Development")');
    if (!title) return;

    const description = prompt('Service Description:');
    if (!description) return;

    const price = prompt('Price (USD):');
    if (!price) return;

    const category = prompt('Category:\n(Design, Programming, Writing, Marketing, Music, Video Editing, Consulting, Teaching)');
    if (!category) return;

    const user = auth.currentUser;
    if (!user) return;

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref('services').push({
        providerId: user.uid,
        providerName: userData.displayName || 'Service Provider',
        providerAvatar: userData.avatar || '',
        title: title,
        description: description,
        price: parseFloat(price),
        category: category,
        timestamp: Date.now(),
        orders: 0,
        rating: 0,
        reviews: {}
    });

    showToast('✅ Service posted!');
    loadServices();
}

async function loadServices(category = null) {
    const container = document.getElementById('servicesGrid');
    if (!container) return;

    let query = database.ref('services').orderByChild('timestamp');
    
    const snapshot = await query.limitToLast(50).once('value');
    container.innerHTML = '';

    const services = [];
    snapshot.forEach(child => {
        const service = child.val();
        if (!category || service.category === category) {
            services.unshift({ id: child.key, ...service });
        }
    });

    if (services.length === 0) {
        container.innerHTML = '<p class="text-slate-400 col-span-3 text-center py-8">No services found</p>';
        return;
    }

    services.forEach(service => {
        const div = document.createElement('div');
        div.className = 'bg-slate-900 rounded-lg overflow-hidden border border-slate-700 hover:border-green-500 transition-colors';
        div.innerHTML = `
            <div class="p-4">
                <div class="flex items-start gap-3 mb-3">
                    <img src="${service.providerAvatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23334155\'/%3E%3C/svg%3E'}" class="w-10 h-10 rounded-full">
                    <div class="flex-1">
                        <h4 class="font-bold text-white">${service.title}</h4>
                        <p class="text-xs text-slate-400">by ${service.providerName}</p>
                    </div>
                </div>
                <p class="text-sm text-slate-300 mb-3 line-clamp-2">${service.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-green-400 font-bold text-lg">$${service.price}</span>
                    <button onclick="orderService('${service.id}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-lg text-sm font-semibold">Order</button>
                </div>
                <div class="mt-2 text-xs text-slate-400">
                    ⭐ ${service.rating.toFixed(1)} • ${service.orders} orders
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function filterServiceCategory(category) {
    loadServices(category);
    document.querySelectorAll('.service-category-btn').forEach(btn => {
        btn.classList.remove('bg-green-600');
        if (btn.textContent.trim() === category) {
            btn.classList.add('bg-green-600');
        }
    });
}

async function orderService(serviceId) {
    const user = auth.currentUser;
    if (!user) return;

    const requirements = prompt('Please describe your requirements:');
    if (!requirements) return;

    const serviceSnapshot = await database.ref(`services/${serviceId}`).once('value');
    const service = serviceSnapshot.val();

    const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    await database.ref(`serviceOrders/${service.providerId}`).push({
        serviceId: serviceId,
        serviceTitle: service.title,
        buyerId: user.uid,
        buyerName: userData.displayName || 'Buyer',
        buyerAvatar: userData.avatar || '',
        requirements: requirements,
        price: service.price,
        status: 'pending',
        timestamp: Date.now()
    });

    // Increment order count
    await database.ref(`services/${serviceId}/orders`).set((service.orders || 0) + 1);

    showToast('✅ Order placed! Provider will contact you.');
}

// Portfolio / Creator Mode
async function enableCreatorMode() {
    const user = auth.currentUser;
    if (!user) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-2xl w-full p-6">
            <h2 class="text-2xl font-bold text-white mb-6">🎨 Setup Creator Profile</h2>
            
            <div class="space-y-4 mb-6">
                <div>
                    <label class="text-sm text-slate-400 block mb-2">Creator Title</label>
                    <input type="text" id="creatorTitle" placeholder="e.g., Graphic Designer, Developer" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white">
                </div>

                <div>
                    <label class="text-sm text-slate-400 block mb-2">Bio</label>
                    <textarea id="creatorBio" placeholder="Tell people about your work..." class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white resize-none h-24"></textarea>
                </div>

                <div>
                    <label class="text-sm text-slate-400 block mb-2">Portfolio Links (comma separated)</label>
                    <input type="text" id="portfolioLinks" placeholder="https://behance.net/..., https://github.com/..." class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white">
                </div>

                <div>
                    <label class="text-sm text-slate-400 block mb-2">Skills (comma separated)</label>
                    <input type="text" id="creatorSkills" placeholder="Photoshop, Illustrator, Figma" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white">
                </div>
            </div>

            <div class="flex gap-3">
                <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold">Cancel</button>
                <button onclick="saveCreatorProfile()" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold">Save & Enable</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveCreatorProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const title = document.getElementById('creatorTitle')?.value;
    const bio = document.getElementById('creatorBio')?.value;
    const links = document.getElementById('portfolioLinks')?.value.split(',').map(l => l.trim()).filter(l => l);
    const skills = document.getElementById('creatorSkills')?.value.split(',').map(s => s.trim()).filter(s => s);

    if (!title || !bio) {
        alert('Please fill in title and bio');
        return;
    }

    await database.ref(`users/${user.uid}/creator`).set({
        title: title,
        bio: bio,
        portfolioLinks: links,
        skills: skills,
        enabled: true,
        timestamp: Date.now()
    });

    document.querySelector('.fixed.inset-0')?.remove();
    showToast('🎉 Creator Mode enabled!');
}

// Earnings Dashboard
async function openEarningsDashboard() {
    const user = auth.currentUser;
    if (!user) return;

    const tipsSnapshot = await database.ref(`tips/${user.uid}`).once('value');
    const ordersSnapshot = await database.ref(`serviceOrders`).orderByChild('providerId').equalTo(user.uid).once('value');

    let totalTips = 0;
    let tipCount = 0;
    tipsSnapshot.forEach(child => {
        totalTips += child.val().amount || 0;
        tipCount++;
    });

    let totalOrders = 0;
    let orderCount = 0;
    ordersSnapshot.forEach(child => {
        const order = child.val();
        if (order.status === 'completed') {
            totalOrders += order.price || 0;
            orderCount++;
        }
    });

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl max-w-3xl w-full p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-white">💰 Earnings Dashboard</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white text-3xl">&times;</button>
            </div>

            <div class="grid md:grid-cols-3 gap-4 mb-6">
                <div class="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 p-6 rounded-xl">
                    <div class="text-4xl font-bold text-green-400">$${(totalTips + totalOrders).toFixed(2)}</div>
                    <div class="text-sm text-slate-300 mt-2">Total Earnings</div>
                </div>

                <div class="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-6 rounded-xl">
                    <div class="text-4xl font-bold text-yellow-400">$${totalTips.toFixed(2)}</div>
                    <div class="text-sm text-slate-300 mt-2">From Tips (${tipCount})</div>
                </div>

                <div class="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 p-6 rounded-xl">
                    <div class="text-4xl font-bold text-blue-400">$${totalOrders.toFixed(2)}</div>
                    <div class="text-sm text-slate-300 mt-2">From Services (${orderCount})</div>
                </div>
            </div>

            <div class="flex gap-3">
                <button onclick="requestPayout()" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">Request Payout</button>
                <button onclick="openServiceMarketplace(); this.closest('.fixed').remove();" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">Manage Services</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function requestPayout() {
    const user = auth.currentUser;
    if (!user) return;

    const earningsSnapshot = await database.ref(`users/${user.uid}/earnings`).once('value');
    const earnings = earningsSnapshot.val() || 0;

    if (earnings < 10) {
        alert('Minimum payout is $10. Current balance: $' + earnings.toFixed(2));
        return;
    }

    const paymentMethod = prompt('Payment method:\n1. PayPal\n2. Bank Transfer\n\nEnter 1 or 2:');
    if (!paymentMethod) return;

    await database.ref(`payoutRequests/${user.uid}`).push({
        amount: earnings,
        method: paymentMethod === '1' ? 'PayPal' : 'Bank Transfer',
        status: 'pending',
        timestamp: Date.now()
    });

    showToast('✅ Payout request submitted!');
}

// Export functions
window.setupTippingButton = setupTippingButton;
window.showTipModal = showTipModal;
window.selectTipAmount = selectTipAmount;
window.processTip = processTip;
window.openServiceMarketplace = openServiceMarketplace;
window.postNewService = postNewService;
window.filterServiceCategory = filterServiceCategory;
window.orderService = orderService;
window.enableCreatorMode = enableCreatorMode;
window.saveCreatorProfile = saveCreatorProfile;
window.openEarningsDashboard = openEarningsDashboard;
window.requestPayout = requestPayout;

console.log('✅ Creator Economy features loaded');
