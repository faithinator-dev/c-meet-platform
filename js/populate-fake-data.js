// Populate fake data for testing and demonstration
// Run this once to add fake users and posts to your database

const fakeUsers = [
    {
        id: 'fake_user_1',
        displayName: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        bio: 'Travel enthusiast 🌍 | Coffee lover ☕ | Photography is my passion 📸',
        interests: 'Travel, Photography, Coffee, Hiking',
        location: 'San Francisco, CA',
        website: 'https://sarahjohnson.com',
        gender: 'Female',
        avatar: 'https://i.pravatar.cc/150?img=1',
        coverPhoto: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop',
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
    },
    {
        id: 'fake_user_2',
        displayName: 'Michael Chen',
        email: 'michael.chen@example.com',
        bio: 'Tech entrepreneur 💻 | Fitness junkie 💪 | Building the future one line of code at a time',
        interests: 'Technology, Fitness, Entrepreneurship, Coding',
        location: 'New York, NY',
        website: 'https://michaelchen.dev',
        gender: 'Male',
        avatar: 'https://i.pravatar.cc/150?img=12',
        coverPhoto: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=300&fit=crop',
        profileVisibility: 'public',
        showEmail: true,
        showPhone: false,
        createdAt: Date.now() - (45 * 24 * 60 * 60 * 1000)
    },
    {
        id: 'fake_user_3',
        displayName: 'Emma Rodriguez',
        email: 'emma.rodriguez@example.com',
        bio: 'Digital artist 🎨 | Bookworm 📚 | Making the world more colorful',
        interests: 'Art, Books, Music, Design',
        location: 'Los Angeles, CA',
        website: 'https://emmarodriguez.art',
        gender: 'Female',
        avatar: 'https://i.pravatar.cc/150?img=5',
        coverPhoto: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&h=300&fit=crop',
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        createdAt: Date.now() - (60 * 24 * 60 * 60 * 1000)
    },
    {
        id: 'fake_user_4',
        displayName: 'David Kim',
        email: 'david.kim@example.com',
        bio: 'Food blogger 🍜 | Recipe creator | Exploring flavors around the world',
        interests: 'Cooking, Food, Travel, Photography',
        location: 'Seattle, WA',
        website: 'https://davidkimfood.com',
        gender: 'Male',
        avatar: 'https://i.pravatar.cc/150?img=13',
        coverPhoto: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=300&fit=crop',
        profileVisibility: 'public',
        showEmail: true,
        showPhone: false,
        createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000)
    },
    {
        id: 'fake_user_5',
        displayName: 'Jessica Martinez',
        email: 'jessica.martinez@example.com',
        bio: 'Yoga instructor 🧘‍♀️ | Wellness coach | Living mindfully and helping others do the same',
        interests: 'Yoga, Meditation, Health, Wellness',
        location: 'Austin, TX',
        website: 'https://jessicamartinez.yoga',
        gender: 'Female',
        avatar: 'https://i.pravatar.cc/150?img=9',
        coverPhoto: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200&h=300&fit=crop',
        profileVisibility: 'public',
        showEmail: false,
        showPhone: true,
        createdAt: Date.now() - (35 * 24 * 60 * 60 * 1000)
    },
    {
        id: 'fake_user_6',
        displayName: 'Ryan Thompson',
        email: 'ryan.thompson@example.com',
        bio: 'Music producer 🎵 | Guitar player | Creating beats that move souls',
        interests: 'Music, Guitar, Production, Concerts',
        location: 'Nashville, TN',
        website: 'https://ryanthompsonmusic.com',
        gender: 'Male',
        avatar: 'https://i.pravatar.cc/150?img=15',
        coverPhoto: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=300&fit=crop',
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        createdAt: Date.now() - (50 * 24 * 60 * 60 * 1000)
    },
    {
        id: 'fake_user_7',
        displayName: 'Olivia Brown',
        email: 'olivia.brown@example.com',
        bio: 'Fashion stylist 👗 | Trend setter | Making every day a runway',
        interests: 'Fashion, Style, Shopping, Makeup',
        location: 'Miami, FL',
        website: 'https://oliviabrown.style',
        gender: 'Female',
        avatar: 'https://i.pravatar.cc/150?img=10',
        coverPhoto: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=300&fit=crop',
        profileVisibility: 'public',
        showEmail: true,
        showPhone: false,
        createdAt: Date.now() - (25 * 24 * 60 * 60 * 1000)
    },
    {
        id: 'fake_user_8',
        displayName: 'James Wilson',
        email: 'james.wilson@example.com',
        bio: 'Sports enthusiast ⚽ | Marathon runner 🏃 | Pushing limits every day',
        interests: 'Sports, Running, Soccer, Fitness',
        location: 'Boston, MA',
        website: 'https://jameswilson.fit',
        gender: 'Male',
        avatar: 'https://i.pravatar.cc/150?img=14',
        coverPhoto: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=300&fit=crop',
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        createdAt: Date.now() - (40 * 24 * 60 * 60 * 1000)
    },
    {
        id: 'fake_user_9',
        displayName: 'Sophia Anderson',
        email: 'sophia.anderson@example.com',
        bio: 'Environmental activist 🌱 | Sustainability advocate | Making Earth greener one step at a time',
        interests: 'Environment, Sustainability, Nature, Activism',
        location: 'Portland, OR',
        website: 'https://sophiaanderson.eco',
        gender: 'Female',
        avatar: 'https://i.pravatar.cc/150?img=16',
        coverPhoto: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=300&fit=crop',
        profileVisibility: 'public',
        showEmail: false,
        showPhone: true,
        createdAt: Date.now() - (55 * 24 * 60 * 60 * 1000)
    },
    {
        id: 'fake_user_10',
        displayName: 'Alex Taylor',
        email: 'alex.taylor@example.com',
        bio: 'Gaming streamer 🎮 | Content creator | Building community through play',
        interests: 'Gaming, Streaming, Technology, Community',
        location: 'Chicago, IL',
        website: 'https://alextaylor.gg',
        gender: 'Non-binary',
        avatar: 'https://i.pravatar.cc/150?img=17',
        coverPhoto: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=300&fit=crop',
        profileVisibility: 'public',
        showEmail: true,
        showPhone: false,
        createdAt: Date.now() - (15 * 24 * 60 * 60 * 1000)
    }
];

const fakePosts = [
    {
        userId: 'fake_user_1',
        content: 'Just got back from an amazing trip to Iceland! 🇮🇸 The Northern Lights were absolutely breathtaking. Already planning my next adventure! ✨',
        image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_1',
        content: 'Morning coffee hits different when you have the perfect view ☕🌅',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_2',
        content: 'Excited to announce that our startup just raised Series A funding! 🚀 Thank you to everyone who believed in our vision. This is just the beginning!',
        image: '',
        privacy: 'public',
        timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_2',
        content: 'Crushed a 5K run this morning! 💪 Remember, your only limit is you. #FitnessMotivation',
        image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_3',
        content: 'New digital art piece finished! 🎨 This one took me 20 hours but I\'m so proud of how it turned out. What do you think?',
        image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (4 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_3',
        content: 'Currently reading "The Midnight Library" and I can\'t put it down! 📚 Any book recommendations for when I finish this one?',
        image: '',
        privacy: 'public',
        timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_4',
        content: 'Just perfected my homemade ramen recipe! 🍜 The key is letting the broth simmer for at least 12 hours. Recipe coming to the blog soon!',
        image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_4',
        content: 'Exploring the local farmers market this morning. Fresh ingredients make all the difference! 🥬🍅',
        image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (6 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_5',
        content: 'Sunrise yoga session on the beach 🧘‍♀️🌅 There\'s something magical about starting your day with mindfulness and movement. Join me tomorrow at 6 AM!',
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_5',
        content: 'Reminder: Take a deep breath. You\'re doing better than you think. 💚 #SelfCare #Wellness',
        image: '',
        privacy: 'public',
        timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_6',
        content: 'New track dropping this Friday! 🎵 Been working on this one for months. Pre-save link in bio!',
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_6',
        content: 'Studio session vibes 🎸 Sometimes the best songs come from the most unexpected jams.',
        image: 'https://images.unsplash.com/photo-1519508234439-4f23643125c1?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_7',
        content: 'Fashion tip: Confidence is the best accessory you can wear! 💃 Here\'s my latest outfit inspiration.',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_7',
        content: 'Spring fashion trends are HERE and I\'m obsessed! 🌸 Pastels, oversized blazers, and statement accessories are my picks for this season.',
        image: '',
        privacy: 'public',
        timestamp: Date.now() - (4 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_8',
        content: 'Marathon training week 8 complete! ✅ 42 miles this week. My legs are tired but my spirit is strong! 🏃‍♂️',
        image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_8',
        content: 'Game day! ⚽ Let\'s go team! Nothing beats the energy of a live match.',
        image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (6 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_9',
        content: 'Spent the day planting trees with an amazing group of volunteers! 🌳 We planted 200 trees today. Every small action counts! #ClimateAction',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_9',
        content: 'Reduce, Reuse, Recycle isn\'t just a saying - it\'s a lifestyle! 🌍♻️ Here are my top 5 tips for living more sustainably...',
        image: '',
        privacy: 'public',
        timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_10',
        content: 'Epic gaming session tonight! 🎮 Going live at 8 PM PST. Come hang out and let\'s conquer some quests together!',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_10',
        content: 'Just hit 10K followers on Twitch! 🎉 Thank you all for the amazing support. You guys are the best community ever!',
        image: '',
        privacy: 'public',
        timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_1',
        content: 'Pro tip for fellow travelers: Always pack a portable charger and download offline maps. You never know when you\'ll need them! 🗺️🔋',
        image: '',
        privacy: 'public',
        timestamp: Date.now() - (9 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_2',
        content: 'Code review day! Remember folks: good code is code that others can read and understand. Write for humans first, computers second. 💻',
        image: '',
        privacy: 'public',
        timestamp: Date.now() - (10 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_3',
        content: 'Art studio tour! 🎨 Here\'s where the magic happens. It\'s messy but it\'s mine and I love it!',
        image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop',
        privacy: 'public',
        timestamp: Date.now() - (11 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_4',
        content: 'Trying out a new Thai curry recipe tonight! 🌶️ Wish me luck! Anyone have tips for getting the perfect balance of flavors?',
        image: '',
        privacy: 'public',
        timestamp: Date.now() - (12 * 24 * 60 * 60 * 1000)
    },
    {
        userId: 'fake_user_5',
        content: 'Teaching a new meditation class this weekend! All levels welcome. Let\'s find inner peace together. 🕊️',
        image: '',
        privacy: 'public',
        timestamp: Date.now() - (13 * 24 * 60 * 60 * 1000)
    }
];

// Function to populate the database
async function populateFakeData() {
    try {
        console.log('Starting to populate fake data...');
        
        // Add fake users
        console.log('Adding fake users...');
        for (const user of fakeUsers) {
            const userId = user.id;
            const userData = { ...user };
            delete userData.id;
            
            await firebase.database().ref(`users/${userId}`).set(userData);
            console.log(`Added user: ${user.displayName}`);
        }
        
        // Add fake posts
        console.log('Adding fake posts...');
        for (const post of fakePosts) {
            const postRef = firebase.database().ref('posts').push();
            await postRef.set(post);
            console.log(`Added post by user ${post.userId}`);
        }
        
        // Create some friend connections
        console.log('Creating friend connections...');
        const friendConnections = [
            ['fake_user_1', 'fake_user_2'],
            ['fake_user_1', 'fake_user_3'],
            ['fake_user_1', 'fake_user_5'],
            ['fake_user_2', 'fake_user_4'],
            ['fake_user_2', 'fake_user_10'],
            ['fake_user_3', 'fake_user_7'],
            ['fake_user_3', 'fake_user_9'],
            ['fake_user_4', 'fake_user_1'],
            ['fake_user_5', 'fake_user_9'],
            ['fake_user_6', 'fake_user_10'],
            ['fake_user_7', 'fake_user_1'],
            ['fake_user_8', 'fake_user_2'],
            ['fake_user_9', 'fake_user_5'],
            ['fake_user_10', 'fake_user_6']
        ];
        
        for (const [userId1, userId2] of friendConnections) {
            const user1 = fakeUsers.find(u => u.id === userId1);
            const user2 = fakeUsers.find(u => u.id === userId2);
            
            await firebase.database().ref(`friends/${userId1}/${userId2}`).set({
                name: user2.displayName,
                avatar: user2.avatar,
                addedAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            });
            
            await firebase.database().ref(`friends/${userId2}/${userId1}`).set({
                name: user1.displayName,
                avatar: user1.avatar,
                addedAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            });
            
            console.log(`Created friendship: ${user1.displayName} <-> ${user2.displayName}`);
        }
        
        // Add some likes to posts
        console.log('Adding likes to posts...');
        const postsSnapshot = await firebase.database().ref('posts').once('value');
        const postIds = [];
        postsSnapshot.forEach(snap => {
            postIds.push(snap.key);
        });
        
        // Add random likes
        for (const postId of postIds) {
            const numLikes = Math.floor(Math.random() * 5) + 1; // 1-5 likes
            const likersIds = [];
            
            for (let i = 0; i < numLikes; i++) {
                const randomUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
                if (!likersIds.includes(randomUser.id)) {
                    likersIds.push(randomUser.id);
                    await firebase.database().ref(`posts/${postId}/likes/${randomUser.id}`).set(true);
                }
            }
        }
        
        // Add some comments
        console.log('Adding comments to posts...');
        const comments = [
            'This is amazing! 😍',
            'Love this!',
            'So inspiring! 💯',
            'Great post!',
            'Awesome! 🔥',
            'Keep it up! 👏',
            'Beautiful!',
            'This made my day! 😊',
            'Can\'t wait to see more!',
            'Incredible work!'
        ];
        
        for (let i = 0; i < 15; i++) {
            const randomPostId = postIds[Math.floor(Math.random() * postIds.length)];
            const randomUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
            const randomComment = comments[Math.floor(Math.random() * comments.length)];
            
            await firebase.database().ref(`posts/${randomPostId}/comments`).push({
                userId: randomUser.id,
                userName: randomUser.displayName,
                userAvatar: randomUser.avatar,
                comment: randomComment,
                timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            });
        }
        
        console.log('✅ Fake data population complete!');
        console.log(`Added ${fakeUsers.length} users, ${fakePosts.length} posts, ${friendConnections.length} friendships, and various likes/comments!`);
        
        alert('Fake data added successfully! Refresh the page to see the new content.');
        
    } catch (error) {
        console.error('Error populating fake data:', error);
        alert('Error adding fake data: ' + error.message);
    }
}

// Auto-run when included
if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
    console.log('Fake data script loaded. Call populateFakeData() to add fake users and posts.');
    
    // Optionally auto-run (comment out if you want manual control)
    // populateFakeData();
}
