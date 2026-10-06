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

// Flatten coords into a reliable list of 49 elements
const allCoords = [];
for (let i = 0; i < 49; i++) {
    const sIdx = i % states.length;
    const state = states[sIdx];
    const cIdx = Math.floor(i / states.length) % state.coords.length;
    const base = state.coords[cIdx];
    
    // add small deterministic offset if we loop around
    const offset = Math.floor(i / (states.length * 3)) * 0.5; 
    
    allCoords.push({
        lat: base[0] + offset,
        lng: base[1] + offset,
        stateName: state.state,
        crop: state.crops[i % state.crops.length]
    });
}

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

function lerp(min, max, t) {
    return min + (max - min) * t;
}

function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    return Math.abs(h) / 2147483648;
}

let locs = [];
for (let i = 1; i <= 49; i++) {
    const id = 'DEMO_' + i.toString().padStart(3, '0');
    
    const coordData = allCoords[i - 1];
    const lat = coordData.lat;
    const lng = coordData.lng;
    const stateName = coordData.stateName;
    const crop = coordData.crop;
    
    const fname = farmerFirstNames[i % farmerFirstNames.length];
    const lname = farmerLastNames[(i * 3) % farmerLastNames.length];
    const farmerName = `${fname} ${lname}`;
    
    const farmTypes = ['Organics', 'Farms', 'Agrotech', 'Fields', 'Estate'];
    const farmName = `${lname} ${farmTypes[i % farmTypes.length]}`;
    
    // Simulate telemetry
    const ranges = cropRanges[crop];
    
    const h1 = hash(id + 'm');
    const h2 = hash(id + 't');
    const h3 = hash(id + 'ph');
    const h4 = hash(id + 'n');
    const h5 = hash(id + 'p');
    const h6 = hash(id + 'k');
    
    // Create one definite anomaly for DEMO_007
    let moisture = lerp(ranges.m[0], ranges.m[1], h1);
    let temp = lerp(ranges.t[0], ranges.t[1], h2);
    let ph = lerp(ranges.ph[0], ranges.ph[1], h3);
    let n = lerp(ranges.n[0], ranges.n[1], h4);
    let p = lerp(ranges.p[0], ranges.p[1], h5);
    let k = lerp(ranges.k[0], ranges.k[1], h6);
    
    let isAnomaly = false;
    let anomalyIssues = [];
    if (i === 7) {
        // Critical anomaly
        moisture = ranges.m[0] - 15;
        ph = ranges.ph[0] - 1.5;
        isAnomaly = true;
        anomalyIssues.push('Low Soil Moisture', 'Acidic pH');
    } else if (i === 12) {
        // Warning anomaly
        n = ranges.n[0] - 10;
        isAnomaly = true;
        anomalyIssues.push('Low Nitrogen');
    }

    const healthScore = isAnomaly ? (i === 7 ? 42 : 68) : Math.floor(lerp(85, 98, h1));
    const healthStatus = healthScore < 50 ? 'Critical' : (healthScore < 75 ? 'Sub-optimal' : 'Healthy');
    const alertStatus = healthScore < 50 ? 'CRITICAL' : (healthScore < 75 ? 'WARNING' : 'NORMAL');
    const recs = isAnomaly ? [`Address: ${anomalyIssues.join(', ')}`] : [`Optimal conditions for ${crop}.`];
    
    locs.push({
      id: id,
      farmerName: farmerName,
      farmName: farmName,
      village: stateName + ' Rural',
      district: stateName + ' Central',
      state: stateName,
      country: 'India',
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lng.toFixed(4)),
      crop: crop,
      cropCycleStart: '2026-06-01',
      cropCycleEnd: '2026-12-01',
      fieldArea: (2.0 + h1 * 5).toFixed(1),
      areaUnit: 'acres',
      sensorId: 'SN-D' + i.toString().padStart(3, '0'),
      sensorStatus: 'OFFLINE',
      locationStatus: 'DEMO',
      locationType: 'FIELD',
      alertStatus: alertStatus,
      healthStatus: healthStatus,
      fieldBoundary: null,
      cropHistory: [
        { crop: 'Wheat', startDate: '2025-10-01', endDate: '2026-04-01', id: Date.now() - (i * 1000) }
      ],
      simulatedTelemetry: {
        reading: {
          moisture_pct: Number(moisture.toFixed(1)),
          temperature_c: Number(temp.toFixed(1)),
          ph: Number(ph.toFixed(2)),
          nitrogen_mg_kg: Number(n.toFixed(1)),
          phosphorus_mg_kg: Number(p.toFixed(1)),
          potassium_mg_kg: Number(k.toFixed(1)),
          timestamp: new Date().toISOString()
        },
        evaluation: {
          health_score: healthScore,
          health_status: healthStatus,
          recommendations: recs
        }
      }
    });
}

const content = `export const DEMO_LOCATIONS = ${JSON.stringify(locs, null, 2)};\n`;
fs.writeFileSync('src/data/demoLocations.js', content);
console.log('Successfully generated 49 distributed demo locations.');
