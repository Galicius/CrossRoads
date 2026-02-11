const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://coomqgvkdkbpttcotpki.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvb21xZ3ZrZGticHR0Y290cGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzQwODcsImV4cCI6MjA4NjE1MDA4N30.3SD6OrarY4iN5AysVH9x0FejfxTRFzEqDtXOjSPXlHE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ──── REALISTIC BIOS ────
const bios = [
    "Full-time van lifer 🚐 Currently exploring the Balkans. Love hiking, cold plunges, and making friends on the road.",
    "Digital nomad working from cafes across Europe ☕ Freelance photographer. Always chasing the golden hour.",
    "Slow traveler. I spend 2-3 weeks per city getting to know the culture, food, and people. Currently in love with Croatia.",
    "Adventure cyclist touring from Portugal to Turkey 🚴 900km in and counting. Looking for riding buddies!",
    "Ex-corporate, now full-time overlander. Converted my Land Rover into a tiny home. Best decision I ever made.",
    "Sailing the Mediterranean on a 35ft catamaran ⛵ Learning to fix everything myself. Life is simple and beautiful.",
    "Backpacker turned van dweller. I make pottery at every stop and sell at local markets 🏺",
    "Mountain enthusiast. Climbed 47 peaks so far this year. Working remotely as a software dev between summits.",
    "Couple traveling in a converted school bus 🚌 We document our journey on YouTube. 42 countries and counting!",
    "Solo female traveler. Yoga instructor by morning, explorer by afternoon. Finding peace one country at a time 🧘‍♀️",
    "Wildlife photographer following migration routes. Currently tracking birds across the Adriatic flyway 📸",
    "Retired early at 35. Now I drive my camper through European vineyards and write about wine 🍷",
    "Surf nomad chasing waves from Morocco to Norway 🏄 I trade surf lessons for places to park my van.",
    "Architect who designs tiny spaces. Traveling to study how people live in small homes across Europe.",
    "Music producer making beats from my van studio 🎵 Powered by solar. Inspired by every new landscape.",
    "Rock climbing addict. My van is basically a mobile gear closet. Fontainebleau → Kalymnos → Siurana loop.",
    "Permaculture student hopping between eco-villages. Learning how to grow food everywhere I go 🌱",
    "Chef on wheels. I cook local recipes at every destination and share them in my newsletter 🍳",
    "Motorcycle traveler. BMW GS + tent = freedom. Currently riding the TET through the Balkans.",
    "Teacher taking a gap year. Volunteering at schools along my route. Kids are the same everywhere ❤️",
];

// ──── NAMES ────
const firstNames = [
    'Marta', 'Luka', 'Ana', 'Jan', 'Petra', 'Matej', 'Nika', 'Andrej',
    'Elena', 'Marco', 'Sophie', 'Felix', 'Lucia', 'Erik', 'Clara', 'Viktor',
    'Ines', 'David', 'Maja', 'Tom', 'Sara', 'Noah', 'Julia', 'Leo',
    'Emma', 'Oscar', 'Hannah', 'Kai', 'Mila', 'Finn'
];

// ──── TRAVEL ROUTES (European) ────
const travelRoutes = [
    // Balkan loop
    [
        { name: 'Ljubljana', lat: 46.0569, lng: 14.5058, durationDays: 5 },
        { name: 'Zagreb', lat: 45.8150, lng: 15.9819, durationDays: 3 },
        { name: 'Split', lat: 43.5081, lng: 16.4402, durationDays: 7 },
        { name: 'Dubrovnik', lat: 42.6507, lng: 18.0944, durationDays: 4 },
        { name: 'Mostar', lat: 43.3438, lng: 17.8078, durationDays: 3 },
    ],
    // Mediterranean coast
    [
        { name: 'Barcelona', lat: 41.3874, lng: 2.1686, durationDays: 6 },
        { name: 'Nice', lat: 43.7102, lng: 7.2620, durationDays: 4 },
        { name: 'Cinque Terre', lat: 44.1461, lng: 9.6439, durationDays: 5 },
        { name: 'Rome', lat: 41.9028, lng: 12.4964, durationDays: 8 },
    ],
    // Alpine route
    [
        { name: 'Munich', lat: 48.1351, lng: 11.5820, durationDays: 4 },
        { name: 'Innsbruck', lat: 47.2692, lng: 11.4041, durationDays: 3 },
        { name: 'Zermatt', lat: 46.0207, lng: 7.7491, durationDays: 5 },
        { name: 'Chamonix', lat: 45.9237, lng: 6.8694, durationDays: 4 },
        { name: 'Lake Como', lat: 45.9871, lng: 9.2573, durationDays: 6 },
    ],
    // Scandinavian
    [
        { name: 'Copenhagen', lat: 55.6761, lng: 12.5683, durationDays: 4 },
        { name: 'Gothenburg', lat: 57.7089, lng: 11.9746, durationDays: 3 },
        { name: 'Oslo', lat: 59.9139, lng: 10.7522, durationDays: 5 },
        { name: 'Bergen', lat: 60.3913, lng: 5.3221, durationDays: 7 },
    ],
    // Eastern Europe
    [
        { name: 'Prague', lat: 50.0755, lng: 14.4378, durationDays: 5 },
        { name: 'Krakow', lat: 50.0647, lng: 19.9450, durationDays: 4 },
        { name: 'Budapest', lat: 47.4979, lng: 19.0402, durationDays: 6 },
        { name: 'Belgrade', lat: 44.7866, lng: 20.4489, durationDays: 3 },
        { name: 'Thessaloniki', lat: 40.6401, lng: 22.9444, durationDays: 5 },
    ],
    // Iberian Peninsula
    [
        { name: 'Lisbon', lat: 38.7223, lng: -9.1393, durationDays: 7 },
        { name: 'Seville', lat: 37.3891, lng: -5.9845, durationDays: 4 },
        { name: 'Granada', lat: 37.1773, lng: -3.5986, durationDays: 3 },
        { name: 'Valencia', lat: 39.4699, lng: -0.3763, durationDays: 5 },
    ],
    // Greek Islands
    [
        { name: 'Athens', lat: 37.9838, lng: 23.7275, durationDays: 4 },
        { name: 'Santorini', lat: 36.3932, lng: 25.4615, durationDays: 6 },
        { name: 'Crete', lat: 35.2401, lng: 24.8093, durationDays: 8 },
        { name: 'Rhodes', lat: 36.4341, lng: 28.2176, durationDays: 5 },
    ],
    // Baltic coast
    [
        { name: 'Tallinn', lat: 59.4370, lng: 24.7536, durationDays: 4 },
        { name: 'Riga', lat: 56.9496, lng: 24.1052, durationDays: 3 },
        { name: 'Vilnius', lat: 54.6872, lng: 25.2797, durationDays: 5 },
        { name: 'Warsaw', lat: 52.2297, lng: 21.0122, durationDays: 4 },
    ],
    // Western France
    [
        { name: 'Paris', lat: 48.8566, lng: 2.3522, durationDays: 5 },
        { name: 'Mont Saint-Michel', lat: 48.6361, lng: -1.5115, durationDays: 2 },
        { name: 'Bordeaux', lat: 44.8378, lng: -0.5792, durationDays: 6 },
        { name: 'Biarritz', lat: 43.4832, lng: -1.5586, durationDays: 4 },
    ],
    // Turkey & Caucasus
    [
        { name: 'Istanbul', lat: 41.0082, lng: 28.9784, durationDays: 6 },
        { name: 'Cappadocia', lat: 38.6431, lng: 34.8289, durationDays: 4 },
        { name: 'Antalya', lat: 36.8969, lng: 30.7133, durationDays: 5 },
        { name: 'Fethiye', lat: 36.6515, lng: 29.1164, durationDays: 7 },
    ],
];

// Add dates to route checkpoints
function addDatesToRoute(route) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60)); // Started 0–60 days ago

    let currentDate = new Date(startDate);
    return route.map(cp => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);
        end.setDate(end.getDate() + cp.durationDays);
        currentDate = new Date(end);
        currentDate.setDate(currentDate.getDate() + 1); // travel day between stops

        return {
            ...cp,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        };
    });
}

// ──── PROFILE IMAGES (randomuser.me) ────
function getImages(index) {
    const isFemale = index % 2 === 0;
    const gender = isFemale ? 'women' : 'men';
    const count = 3 + Math.floor(Math.random() * 3);
    const images = [];
    const usedIds = new Set();
    for (let i = 0; i < count; i++) {
        let id;
        do { id = Math.floor(Math.random() * 70); } while (usedIds.has(id));
        usedIds.add(id);
        images.push(`https://randomuser.me/api/portraits/${gender}/${id}.jpg`);
    }
    return images;
}

// ──── MAIN ────
async function updateProfiles() {
    console.log('Fetching all profiles...');
    const { data: profiles, error } = await supabase.from('profiles').select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${profiles.length} profiles. Populating with rich data...\n`);

    for (let i = 0; i < profiles.length; i++) {
        const p = profiles[i];
        const route = travelRoutes[i % travelRoutes.length];
        const routeWithDates = addDatesToRoute(route);
        const bio = bios[i % bios.length];
        const images = getImages(i);
        const name = p.full_name || firstNames[i % firstNames.length];
        const age = p.age || (22 + Math.floor(Math.random() * 15));

        const updates = {
            full_name: name,
            bio: bio,
            age: age,
            images: images,
            route_data: routeWithDates,
            latitude: route[0].lat,
            longitude: route[0].lng,
        };

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', p.id);

        if (updateError) {
            console.error(`❌ ${p.id}: ${updateError.message}`);
        } else {
            console.log(`✅ ${name} (${age}) — ${route.map(r => r.name).join(' → ')}`);
        }
    }

    console.log('\n🎉 All profiles updated!');
}

updateProfiles();
