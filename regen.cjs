const fs = require('fs');

const states = [
  { state: 'Karnataka', coords: [[15.3, 75.1], [13.0, 76.5], [16.2, 76.0], [12.3, 76.6], [14.0, 75.5], [13.3, 77.1], [12.9, 75.9]], crops: ['Arecanut', 'Coffee', 'Sugarcane', 'Paddy', 'Coconut'] },
  { state: 'Maharashtra', coords: [[19.9, 74.2], [18.5, 74.0], [20.5, 75.8], [17.7, 75.9], [19.1, 76.2], [21.0, 77.5]], crops: ['Sugarcane', 'Grape', 'Cotton', 'Wheat'] },
  { state: 'Tamil Nadu', coords: [[11.0, 77.3], [10.3, 77.9], [12.0, 79.0], [9.9, 78.1], [11.6, 78.6]], crops: ['Coconut', 'Paddy', 'Sugarcane', 'Tea'] },
  { state: 'Punjab', coords: [[30.9, 75.8], [30.2, 75.0], [31.3, 75.4], [30.5, 76.3]], crops: ['Wheat', 'Cotton', 'Paddy'] },
  { state: 'Haryana', coords: [[29.7, 76.4], [29.1, 75.7], [30.1, 77.0]], crops: ['Wheat', 'Cotton'] },
  { state: 'Uttar Pradesh', coords: [[28.9, 77.6], [27.2, 79.0], [26.8, 80.9], [25.4, 82.8], [26.7, 83.1]], crops: ['Sugarcane', 'Wheat', 'Paddy'] },
  { state: 'Gujarat', coords: [[22.3, 71.0], [23.0, 72.5], [21.5, 70.4], [22.7, 73.2]], crops: ['Groundnut', 'Cotton', 'Wheat'] },
  { state: 'Andhra Pradesh', coords: [[16.5, 80.6], [14.4, 79.9], [15.8, 79.0], [17.0, 81.7]], crops: ['Chilli', 'Paddy', 'Cotton'] },
  { state: 'Telangana', coords: [[17.3, 78.4], [18.4, 79.1], [16.8, 78.0]], crops: ['Paddy', 'Cotton', 'Chilli'] },
  { state: 'Kerala', coords: [[10.5, 76.2], [9.6, 76.8], [11.2, 75.9]], crops: ['Tea', 'Coconut', 'Coffee'] },
  { state: 'West Bengal', coords: [[23.2, 87.8], [24.0, 88.0], [22.9, 88.4]], crops: ['Paddy', 'Tea'] },
  { state: 'Madhya Pradesh', coords: [[23.2, 77.4], [22.7, 75.8], [24.1, 78.5]], crops: ['Wheat', 'Cotton'] }
];

const farmerFirstNames = ['Ravi', 'Suresh', 'Manjula', 'Prakash', 'Lakshmi', 'Kumar', 'Girish', 'Veena', 'Santosh', 'Vikram', 'Priya', 'Amol', 'Karthik', 'Muthu', 'Kavitha', 'Harpreet', 'Gurdeep', 'Amit', 'Sunil', 'Pooja', 'Rahul', 'Vikash', 'Neha', 'Hardik', 'Jignesh', 'Aarti', 'Srinivas', 'Swapna', 'Prasad', 'Anitha', 'Arup', 'Sourav', 'Moumita', 'Ganesh', 'Dinesh', 'Savitri'];
const farmerLastNames = ['Gowda', 'Bhat', 'K', 'Rao', 'Devi', 'H', 'M', 'Shetty', 'Patil', 'Deshmukh', 'Kadam', 'Shinde', 'N', 'P', 'R', 'Singh', 'Kaur', 'Dalal', 'Khatri', 'Y', 'Yadav', 'Sharma', 'D', 'B', 'Reddy', 'G', 'Das', 'Ghosh', 'Pawar', 'Jadhav', 'Mane'];

const cropRanges = {
  'Arecanut': { m: [60, 75], t: [22, 28], ph: [5.5, 6.5], n: [40, 60], p: [20, 30], k: [80, 110] },
  'Coffee': { m: [55, 70], t: [18, 25], ph: [5.0, 6.0], n: [45, 65], p: [25, 35], k: [90, 120] },
  'Sugarcane': { m: [70, 85], t: [25, 32], ph: [6.0, 7.5], n: [60, 80], p: [30, 45], k: [100, 140] },
  'Grape': { m: [50, 65], t: [15, 25], ph: [6.5, 7.5], n: [35, 55], p: [20, 30], k: [70, 100] },
  'Coconut': { m: [65, 80], t: [25, 30], ph: [5.5, 7.0], n: [50, 70], p: [25, 35], k: [90, 130] },
  'Paddy': { m: [80, 95], t: [25, 32], ph: [5.5, 6.5], n: [70, 90], p: [35, 50], k: [80, 110] },
  'Wheat': { m: [45, 60], t: [10, 22], ph: [6.0, 7.0], n: [50, 70], p: [25, 40], k: [60, 90] },
  'Cotton': { m: [40, 55], t: [25, 35], ph: [5.8, 7.5], n: [55, 75], p: [30, 45], k: [70, 100] },
  'Groundnut': { m: [45, 60], t: [22, 30], ph: [6.0, 7.0], n: [30, 45], p: [35, 50], k: [50, 75] },
  'Chilli': { m: [50, 65], t: [20, 30], ph: [6.0, 6.8], n: [45, 65], p: [25, 40], k: [60, 90] },
  'Tea': { m: [65, 80], t: [15, 22], ph: [4.5, 5.5], n: [55, 75], p: [20, 30], k: [70, 100] }
};

function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    return Math.abs(h) / 2147483648;
}

function lerp(min, max, t) {
    return min + (max - min) * t;
}

const usedNames = new Set();
const usedCoords = [];

function distance(lat1, lon1, lat2, lon2) {
    return Math.sqrt(Math.pow(lat1-lat2, 2) + Math.pow(lon1-lon2, 2));
}

let locs = [];
for (let i = 1; i <= 49; i++) {
    const id = 'DEMO_' + i.toString().padStart(3, '0');
    
    // Pick state
    const stateObj = states[Math.floor(hash(id + 'st') * states.length)];
    const crop = stateObj.crops[Math.floor(hash(id + 'cr') * stateObj.crops.length)];
    
    // Generate unique coordinate
    let lat, lng;
    let attempts = 0;
    do {
      const baseCoord = stateObj.coords[Math.floor(hash(id + 'c' + attempts) * stateObj.coords.length)];
      lat = baseCoord[0] + (hash(id + 'la' + attempts) - 0.5) * 1.5;
      lng = baseCoord[1] + (hash(id + 'lo' + attempts) - 0.5) * 1.5;
      
      let tooClose = false;
      for (let c of usedCoords) {
        if (distance(lat, lng, c[0], c[1]) < 0.3) { tooClose = true; break; }
      }
      if (!tooClose || attempts > 50) break;
      attempts++;
    } while (true);
    usedCoords.push([lat, lng]);
    
    // Generate unique name
    let fname, lname, farmerName, farmName;
    attempts = 0;
    do {
      fname = farmerFirstNames[Math.floor(hash(id + 'fn' + attempts) * farmerFirstNames.length)];
      lname = farmerLastNames[Math.floor(hash(id + 'ln' + attempts) * farmerLastNames.length)];
      farmerName = fname + ' ' + lname;
      farmName = (hash(id + 'ft' + attempts) > 0.5) ? fname + "'s Fields" : lname + ' Organics';
      if (!usedNames.has(farmerName) || attempts > 50) break;
      attempts++;
    } while (true);
    usedNames.add(farmerName);

    const isAnomaly = id === 'DEMO_007' || id === 'DEMO_014' || id === 'DEMO_023' || id === 'DEMO_035' || id === 'DEMO_042';
    
    const ranges = cropRanges[crop];
    const r1 = hash(id + 'm');
    const r2 = hash(id + 't');
    const r3 = hash(id + 'ph');
    const r4 = hash(id + 'n');
    const r5 = hash(id + 'p');
    const r6 = hash(id + 'k');

    const anomFactor = isAnomaly ? (hash(id + 'dir') < 0.5 ? 0.6 : 1.4) : 1.0;
    
    let m = lerp(ranges.m[0], ranges.m[1], r1);
    if (isAnomaly) m *= anomFactor;
    
    let ph = lerp(ranges.ph[0], ranges.ph[1], r3);
    if (isAnomaly) ph += (anomFactor - 1.0) * 3;
    
    let t = lerp(ranges.t[0], ranges.t[1], r2);
    let n = lerp(ranges.n[0], ranges.n[1], r4);
    let p = lerp(ranges.p[0], ranges.p[1], r5);
    let k = lerp(ranges.k[0], ranges.k[1], r6);
    
    m = Math.max(5, Math.min(100, m));
    ph = Math.max(3.0, Math.min(9.0, ph));

    let score = 100;
    let issues = [];
    if (m < ranges.m[0]) { score -= 15; issues.push('Low moisture'); }
    else if (m > ranges.m[1]) { score -= 10; issues.push('High moisture'); }
    
    if (ph < ranges.ph[0]) { score -= 15; issues.push('Low pH (Acidic)'); }
    else if (ph > ranges.ph[1]) { score -= 15; issues.push('High pH (Alkaline)'); }

    if (n < ranges.n[0]) { score -= 10; issues.push('Low Nitrogen'); }
    if (k < ranges.k[0]) { score -= 10; issues.push('Low Potassium'); }

    score = Math.max(40, score);
    
    let healthStatus = 'Healthy';
    let alertStatus = 'NORMAL';
    if (score < 60) { healthStatus = 'Critical'; alertStatus = 'WARNING'; }
    else if (score < 80) { healthStatus = 'Sub-optimal'; alertStatus = 'WARNING'; }

    let recs = [];
    if (issues.length === 0) recs.push('All soil metrics are optimal for ' + crop + '.');
    else recs.push('Address: ' + issues.join(', '));
    
    const startStr = '2026-06-01';
    
    locs.push({
      id: id,
      farmerName: farmerName,
      farmName: farmName,
      village: stateObj.state + ' Rural',
      district: stateObj.state + ' Central',
      state: stateObj.state,
      country: 'India',
      latitude: parseFloat(lat.toFixed(4)),
      longitude: parseFloat(lng.toFixed(4)),
      crop: crop,
      cropCycleStart: startStr,
      cropCycleEnd: '2026-12-01',
      fieldArea: (hash(id + 'fa') * 8 + 1).toFixed(1),
      areaUnit: 'acres',
      sensorId: 'SN-D' + id.split('_')[1],
      sensorStatus: 'OFFLINE',
      locationStatus: 'DEMO',
      locationType: 'FIELD',
      alertStatus: alertStatus,
      healthStatus: healthStatus,
      fieldBoundary: null,
      cropHistory: [
        { crop: crop === 'Wheat' ? 'Paddy' : 'Wheat', startDate: '2025-10-01', endDate: '2026-04-01', id: Date.now() + i }
      ],
      simulatedTelemetry: {
        reading: {
            moisture_pct: parseFloat(m.toFixed(1)),
            temperature_c: parseFloat(t.toFixed(1)),
            ph: parseFloat(ph.toFixed(2)),
            nitrogen_mg_kg: parseFloat(n.toFixed(1)),
            phosphorus_mg_kg: parseFloat(p.toFixed(1)),
            potassium_mg_kg: parseFloat(k.toFixed(1))
        },
        evaluation: {
            health_score: Math.round(score),
            health_status: healthStatus,
            recommendations: recs
        }
      }
    });
}

const outContent = 'export const DEMO_LOCATIONS = ' + JSON.stringify(locs, null, 2) + ';\n';
fs.writeFileSync('src/data/demoLocations.js', outContent);
