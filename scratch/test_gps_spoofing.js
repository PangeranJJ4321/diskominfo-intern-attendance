// scratch/test_gps_spoofing.js
const { PrismaClient } = require('../app/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { hashPassword } = require('better-auth/crypto');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'intern_test@buildwithjj.store';
const TEST_PASSWORD = 'password123';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

let sessionCookies = '';

async function login() {
  console.log('Logging in as test intern...');
  const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': BASE_URL
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed: ${text}`);
  }

  const cookies = res.headers.getSetCookie();
  sessionCookies = cookies.map(c => c.split(';')[0]).join('; ');
  console.log('Login successful. Session cookies retrieved.');
}

async function apiRequest(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookies,
      'Origin': BASE_URL
    },
    body: JSON.stringify(body)
  });

  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    data
  };
}

async function run() {
  console.log('Initializing test database data...');
  
  // Clean up any old test records just in case
  await cleanup();

  // 1. Get the seeded agency
  const agency = await prisma.agency.findFirst({
    where: { name: 'Diskominfo Kota Makassar' }
  });

  if (!agency) {
    throw new Error('Agency "Diskominfo Kota Makassar" not found. Please run seed first.');
  }

  // 2. Create test user
  const hashedPassword = await hashPassword(TEST_PASSWORD);
  const user = await prisma.user.create({
    data: {
      name: 'Test Intern User',
      email: TEST_EMAIL,
      emailVerified: true
    }
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: hashedPassword
    }
  });

  // 3. Create Intern
  const startedAt = new Date();
  const intern = await prisma.intern.create({
    data: {
      userId: user.id,
      agencyId: agency.id,
      startedAt
    }
  });

  // 4. Create Shift & open Schedule matching current time
  const shift = await prisma.shift.create({
    data: {
      agencyId: agency.id,
      name: 'Test Temp QA Shift'
    }
  });

  const now = new Date();

  const schedule = await prisma.schedule.create({
    data: {
      shiftId: shift.id,
      name: 'Test Check-in Schedule',
      dayOfWeek: now.getDay(),
      windowStart: '00:00:00',
      scheduleStart: '01:00:00',
      lateCutoff: '23:00:00',
      scheduleEnd: '23:59:00'
    }
  });

  // 5. Create Shift Assignment
  const todayStr = formatDate(now);
  await prisma.shiftAssignment.create({
    data: {
      internId: intern.id,
      shiftId: shift.id,
      startDate: todayStr
    }
  });

  console.log('Database initialization complete.');

  try {
    // Authenticate
    await login();

    console.log('\n--- TEST CASE 1: Geofencing Check (Outside Area) ---');
    // Coordinates outside the polygon (Makassar area coordinates in seed are around [119.42, -5.14])
    // We try [106.82, -6.17] (Jakarta)
    const res1 = await apiRequest('/api/attendances', {
      internId: intern.id,
      scheduleId: schedule.id,
      date: todayStr,
      attendanceLatitude: -6.175,
      attendanceLongitude: 106.827,
      status: 'PRESENT'
    });

    console.log('Response Status:', res1.status);
    console.log('Response Data:', JSON.stringify(res1.data));
    
    if (res1.status === 400 && res1.data.error === 'Presensi wajib dilakukan di dalam area kantor.') {
      console.log('✅ TEST CASE 1 PASS: API correctly rejected outside-geofence check-in.');
    } else {
      console.error('❌ TEST CASE 1 FAIL: Unexpected API response.');
    }

    console.log('\n--- TEST CASE 2: Geofencing Check (Inside Area) ---');
    // Coordinates inside the seeded polygon (e.g. [119.42, -5.14])
    const res2 = await apiRequest('/api/attendances', {
      internId: intern.id,
      scheduleId: schedule.id,
      date: todayStr,
      attendanceLatitude: -5.145,
      attendanceLongitude: 119.425,
      status: 'PRESENT'
    });

    console.log('Response Status:', res2.status);
    console.log('Response Data:', JSON.stringify(res2.data));

    if (res2.status === 201) {
      console.log('✅ TEST CASE 2 PASS: API correctly allowed inside-geofence check-in.');
    } else {
      console.error('❌ TEST CASE 2 FAIL: Unexpected API response.');
    }

    console.log('\n--- TEST CASE 3: GPS Spoofing Check (Velocity Teleportation) ---');
    // For this check, we need another schedule to post attendance, or we can check location velocity
    // when posting a location log first, then another location log / check-in.
    // The velocity check compares the current check-in with the latest location log.
    // Let's create a LocationLog inside the geofence 10 seconds ago.
    const tenSecondsAgo = new Date(Date.now() - 10000);
    await prisma.locationLog.create({
      data: {
        internId: intern.id,
        latitude: -5.145,
        longitude: 119.425,
        createdAt: tenSecondsAgo
      }
    });

    // Now, let's submit another check-in (requires a different schedule, so let's make another schedule)
    const schedule2 = await prisma.schedule.create({
      data: {
        shiftId: shift.id,
        name: 'Test Checkout Schedule',
        dayOfWeek: now.getDay(),
        windowStart: '00:00:00',
        scheduleStart: '01:00:00',
        lateCutoff: '23:00:00',
        scheduleEnd: '23:59:00'
      }
    });

    // Submit check-in to schedule2 at coordinates far away (e.g. -5.20, 119.50)
    // Moving ~10km in 10 seconds is impossible (speed limit is set to human walking/driving limits)
    const res3 = await apiRequest('/api/attendances', {
      internId: intern.id,
      scheduleId: schedule2.id,
      date: todayStr,
      attendanceLatitude: -5.20,
      attendanceLongitude: 119.50,
      status: 'PRESENT'
    });

    console.log('Response Status:', res3.status);
    console.log('Response Data:', JSON.stringify(res3.data));

    if (res3.status === 400 && res3.data.error === 'Terdeteksi indikasi pemalsuan lokasi (GPS spoofing). Silakan hubungi admin atau coba lagi.') {
      console.log('✅ TEST CASE 3 PASS: API correctly detected location velocity spoofing.');
    } else {
      console.error('❌ TEST CASE 3 FAIL: Unexpected API response.');
    }

  } catch (error) {
    console.error('Testing encountered error:', error);
  } finally {
    console.log('\nCleaning up test database records...');
    await cleanup();
    console.log('Cleanup complete.');
    await prisma.$disconnect();
  }
}

async function cleanup() {
  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL }
  });

  if (user) {
    // Delete intern shift assignments, attendances, location logs
    const interns = await prisma.intern.findMany({
      where: { userId: user.id }
    });

    for (const intern of interns) {
      await prisma.attendance.deleteMany({ where: { internId: intern.id } });
      await prisma.locationLog.deleteMany({ where: { internId: intern.id } });
      await prisma.shiftAssignment.deleteMany({ where: { internId: intern.id } });
    }

    await prisma.intern.deleteMany({ where: { userId: user.id } });
    await prisma.account.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }

  // Delete temp shift and schedules
  const shifts = await prisma.shift.findMany({
    where: { name: 'Test Temp QA Shift' }
  });

  for (const shift of shifts) {
    await prisma.schedule.deleteMany({ where: { shiftId: shift.id } });
    await prisma.shift.delete({ where: { id: shift.id } });
  }
}

run();
