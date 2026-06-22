// scratch/test_apis.js
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const CREDENTIALS = {
  email: 'admin@buildwithjj.store',
  password: '1234567890'
};

let sessionCookies = '';

/**
 * Log in to Better-Auth and retrieve session cookies.
 */
async function login() {
  console.log('Logging in to Better-Auth...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL
      },
      body: JSON.stringify(CREDENTIALS)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Login failed with status ${res.status}: ${text}`);
    }

    const setCookieHeaders = res.headers.getSetCookie();
    if (setCookieHeaders.length === 0) {
      throw new Error('No set-cookie headers received from login response');
    }

    sessionCookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
    console.log('Successfully logged in. Cookies retrieved.');
  } catch (error) {
    console.error('Error during login:', error.message);
    throw error;
  }
}

/**
 * Perform an authenticated API request.
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...options.headers,
    'Cookie': sessionCookies
  };

  if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())) {
    headers['Origin'] = BASE_URL;
  }

  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const start = Date.now();
  try {
    const res = await fetch(url, { ...options, headers });
    const duration = Date.now() - start;
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return {
      status: res.status,
      ok: res.ok,
      duration,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      duration: Date.now() - start,
      error: error.message
    };
  }
}

/**
 * Main function that runs tests on all 27 cases.
 */
async function runTests() {
  const report = [];

  function recordResult(category, method, endpoint, result) {
    const status = result.status;
    const success = result.ok;
    const duration = result.duration;
    const errorMsg = result.error || (status >= 400 ? JSON.stringify(result.data) : null);

    console.log(`[${success ? 'PASS' : 'FAIL'}] ${method} ${endpoint} (${duration}ms) - Status: ${status}`);
    report.push({
      category,
      method,
      endpoint,
      status,
      success,
      duration,
      error: errorMsg
    });
  }

  try {
    await login();
  } catch (err) {
    console.error('Testing aborted due to login failure. Please ensure the database is push/seeded and next server is running.');
    return;
  }

  console.log('\nStarting API endpoints test suite...\n');

  // Let's declare variable placeholders for dynamic IDs we discover
  let agencyId = null;
  let userId = null;
  let internId = null;
  let shiftId = null;
  let scheduleId = null;
  let holidayId = null;
  let institutionId = null;
  let shiftAssignmentId = null;
  let agencyAccessId = null;

  // ==========================================
  // 1. AGENCIES ENDPOINTS
  // ==========================================
  
  // GET /api/agencies
  const getAgenciesRes = await apiRequest('/api/agencies');
  recordResult('Agencies', 'GET', '/api/agencies', getAgenciesRes);
  if (getAgenciesRes.ok && getAgenciesRes.data && getAgenciesRes.data.data && getAgenciesRes.data.data.length > 0) {
    agencyId = getAgenciesRes.data.data[0].id;
  }

  // POST /api/agencies (Create a temp agency for detail/rule/area/delete tests)
  const tempAgencyName = `Test Agency ${Date.now()}`;
  const postAgencyRes = await apiRequest('/api/agencies', {
    method: 'POST',
    body: { name: tempAgencyName }
  });
  recordResult('Agencies', 'POST', '/api/agencies', postAgencyRes);
  const tempAgencyId = postAgencyRes.ok && postAgencyRes.data ? postAgencyRes.data.id : null;

  if (tempAgencyId) {
    // GET /api/agencies/[id]
    const getAgencyDetailRes = await apiRequest(`/api/agencies/${tempAgencyId}`);
    recordResult('Agencies', 'GET', '/api/agencies/[id]', getAgencyDetailRes);

    // PATCH /api/agencies/[id]
    const patchAgencyRes = await apiRequest(`/api/agencies/${tempAgencyId}`, {
      method: 'PATCH',
      body: { name: `${tempAgencyName} Updated` }
    });
    recordResult('Agencies', 'PATCH', '/api/agencies/[id]', patchAgencyRes);

    // POST /api/agencies/[id]/areas
    const postAreaRes = await apiRequest(`/api/agencies/${tempAgencyId}/areas`, {
      method: 'POST',
      body: {
        geoData: {
          type: "Polygon",
          coordinates: [[[119.41, -5.15], [119.43, -5.15], [119.43, -5.135], [119.41, -5.135], [119.41, -5.15]]]
        },
        timezone: "Asia/Makassar"
      }
    });
    recordResult('Agencies', 'POST', '/api/agencies/[id]/areas', postAreaRes);

    // GET /api/agencies/[id]/areas
    const getAreaRes = await apiRequest(`/api/agencies/${tempAgencyId}/areas`);
    recordResult('Agencies', 'GET', '/api/agencies/[id]/areas', getAreaRes);

    // PATCH /api/agencies/[id]/areas
    const patchAreaRes = await apiRequest(`/api/agencies/${tempAgencyId}/areas`, {
      method: 'PATCH',
      body: {
        geoData: {
          type: "Polygon",
          coordinates: [[[119.42, -5.15], [119.43, -5.15], [119.43, -5.14], [119.42, -5.14], [119.42, -5.15]]]
        }
      }
    });
    recordResult('Agencies', 'PATCH', '/api/agencies/[id]/areas', patchAreaRes);

    // POST /api/agencies/[id]/rules
    const postRulesRes = await apiRequest(`/api/agencies/${tempAgencyId}/rules`, {
      method: 'POST',
      body: {
        requireFaceVerification: true,
        requireWithinArea: true
      }
    });
    recordResult('Agencies', 'POST', '/api/agencies/[id]/rules', postRulesRes);

    // GET /api/agencies/[id]/rules
    const getRulesRes = await apiRequest(`/api/agencies/${tempAgencyId}/rules`);
    recordResult('Agencies', 'GET', '/api/agencies/[id]/rules', getRulesRes);

    // PATCH /api/agencies/[id]/rules
    const patchRulesRes = await apiRequest(`/api/agencies/${tempAgencyId}/rules`, {
      method: 'PATCH',
      body: {
        requireFaceVerification: false
      }
    });
    recordResult('Agencies', 'PATCH', '/api/agencies/[id]/rules', patchRulesRes);

    // CLEANUP: Delete the temp agency
    const deleteAgencyRes = await apiRequest(`/api/agencies/${tempAgencyId}`, {
      method: 'DELETE'
    });
    recordResult('Agencies', 'DELETE', '/api/agencies/[id]', deleteAgencyRes);
  }

  // ==========================================
  // 2. USERS ENDPOINTS
  // ==========================================
  
  // GET /api/users
  const getUsersRes = await apiRequest('/api/users');
  recordResult('Users', 'GET', '/api/users', getUsersRes);
  if (getUsersRes.ok && getUsersRes.data && getUsersRes.data.data && getUsersRes.data.data.length > 0) {
    userId = getUsersRes.data.data[0].id;
  }

  if (userId) {
    // GET /api/users/[id]
    const getUserDetailRes = await apiRequest(`/api/users/${userId}`);
    recordResult('Users', 'GET', '/api/users/[id]', getUserDetailRes);

    // GET /api/users/[id]/attendances
    const getUserAttendancesRes = await apiRequest(`/api/users/${userId}/attendances`);
    recordResult('Users', 'GET', '/api/users/[id]/attendances', getUserAttendancesRes);

    // GET /api/users/[id]/face-descriptors
    const getUserFacesRes = await apiRequest(`/api/users/${userId}/face-descriptors`);
    recordResult('Users', 'GET', '/api/users/[id]/face-descriptors', getUserFacesRes);
  }

  // ==========================================
  // 3. INTERNS ENDPOINTS
  // ==========================================
  
  // GET /api/interns
  const getInternsRes = await apiRequest('/api/interns');
  recordResult('Interns', 'GET', '/api/interns', getInternsRes);
  if (getInternsRes.ok && getInternsRes.data && getInternsRes.data.data && getInternsRes.data.data.length > 0) {
    internId = getInternsRes.data.data[0].id;
  }

  if (internId) {
    // GET /api/interns/[id]
    const getInternDetailRes = await apiRequest(`/api/interns/${internId}`);
    recordResult('Interns', 'GET', '/api/interns/[id]', getInternDetailRes);

    // GET /api/interns/[id]/attendances
    const getInternAttendancesRes = await apiRequest(`/api/interns/${internId}/attendances`);
    recordResult('Interns', 'GET', '/api/interns/[id]/attendances', getInternAttendancesRes);
  }

  // ==========================================
  // 4. SHIFTS ENDPOINTS
  // ==========================================
  
  // GET /api/shifts
  const getShiftsRes = await apiRequest('/api/shifts');
  recordResult('Shifts', 'GET', '/api/shifts', getShiftsRes);
  if (getShiftsRes.ok && getShiftsRes.data && getShiftsRes.data.length > 0) {
    shiftId = getShiftsRes.data[0].id;
  }

  if (shiftId) {
    // GET /api/shifts/[id]
    const getShiftDetailRes = await apiRequest(`/api/shifts/${shiftId}`);
    recordResult('Shifts', 'GET', '/api/shifts/[id]', getShiftDetailRes);

    // GET /api/shifts/[id]/schedules
    const getShiftSchedulesRes = await apiRequest(`/api/shifts/${shiftId}/schedules`);
    recordResult('Shifts', 'GET', '/api/shifts/[id]/schedules', getShiftSchedulesRes);
  }

  // ==========================================
  // 5. SCHEDULES ENDPOINTS
  // ==========================================
  
  // GET /api/schedules
  const getSchedulesRes = await apiRequest('/api/schedules');
  recordResult('Schedules', 'GET', '/api/schedules', getSchedulesRes);
  if (getSchedulesRes.ok && getSchedulesRes.data && getSchedulesRes.data.length > 0) {
    scheduleId = getSchedulesRes.data[0].id;
  }

  if (scheduleId) {
    // GET /api/schedules/[id]
    const getScheduleDetailRes = await apiRequest(`/api/schedules/${scheduleId}`);
    recordResult('Schedules', 'GET', '/api/schedules/[id]', getScheduleDetailRes);
  }

  // ==========================================
  // 6. HOLIDAYS ENDPOINTS
  // ==========================================
  
  // GET /api/holidays
  const getHolidaysRes = await apiRequest('/api/holidays');
  recordResult('Holidays', 'GET', '/api/holidays', getHolidaysRes);
  if (getHolidaysRes.ok && getHolidaysRes.data && getHolidaysRes.data.data && getHolidaysRes.data.data.length > 0) {
    holidayId = getHolidaysRes.data.data[0].id;
  }

  if (holidayId) {
    // GET /api/holidays/[id]
    const getHolidayDetailRes = await apiRequest(`/api/holidays/${holidayId}`);
    recordResult('Holidays', 'GET', '/api/holidays/[id]', getHolidayDetailRes);
  }

  // ==========================================
  // 7. INSTITUTIONS ENDPOINTS
  // ==========================================
  
  // GET /api/institutions
  const getInstitutionsRes = await apiRequest('/api/institutions');
  recordResult('Institutions', 'GET', '/api/institutions', getInstitutionsRes);
  if (getInstitutionsRes.ok && getInstitutionsRes.data && getInstitutionsRes.data.data && getInstitutionsRes.data.data.length > 0) {
    institutionId = getInstitutionsRes.data.data[0].id;
  }

  if (institutionId) {
    // GET /api/institutions/[id]
    const getInstitutionDetailRes = await apiRequest(`/api/institutions/${institutionId}`);
    recordResult('Institutions', 'GET', '/api/institutions/[id]', getInstitutionDetailRes);
  }

  // ==========================================
  // 8. ATTENDANCES & OTHER LOGS
  // ==========================================
  
  // GET /api/attendances
  const getAttendancesRes = await apiRequest('/api/attendances');
  recordResult('Attendances', 'GET', '/api/attendances', getAttendancesRes);

  // GET /api/location-logs
  const getLocationLogsRes = await apiRequest('/api/location-logs');
  recordResult('Location Logs', 'GET', '/api/location-logs', getLocationLogsRes);

  // GET /api/shift-assignments
  const getShiftAssignmentsRes = await apiRequest('/api/shift-assignments');
  recordResult('Shift Assignments', 'GET', '/api/shift-assignments', getShiftAssignmentsRes);

  // GET /api/agency-accesses
  const getAgencyAccessesRes = await apiRequest('/api/agency-accesses');
  recordResult('Agency Accesses', 'GET', '/api/agency-accesses', getAgencyAccessesRes);

  // ==========================================
  // REPORT GENERATION
  // ==========================================
  generateReportFile(report);
}

/**
 * Generate a markdown report file of the API tests.
 */
function generateReportFile(report) {
  const filePath = path.join(__dirname, '..', 'API_TEST_REPORT.md');
  const total = report.length;
  const passed = report.filter(r => r.success).length;
  const failed = total - passed;

  let mdContent = `# Laporan Pengujian API Otomatis (API Automated Test Report)
Tanggal: ${new Date().toLocaleString()}
Aplikasi: diskominfo-intern-attendance

## 📊 Ringkasan Statistik
*   **Total Endpoint Diuji**: ${total}
*   **Passed (Sukses)**: ${passed} ✅
*   **Failed (Gagal)**: ${failed} ❌

---

## 📝 Detail Hasil Uji Coba

| Kategori | Method | Endpoint | HTTP Status | Hasil | Waktu (ms) | Detail Error |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
`;

  report.forEach(item => {
    mdContent += `| ${item.category} | \`${item.method}\` | \`${item.endpoint}\` | ${item.status} | ${item.success ? '✅ PASS' : '❌ FAIL'} | ${item.duration} | ${item.error ? `\`${item.error.replace(/\n/g, ' ')}\`` : '-'} |\n`;
  });

  mdContent += `\n---
*Laporan ini dibuat secara otomatis oleh script pengujian API \`scratch/test_apis.js\`.*
`;

  fs.writeFileSync(filePath, mdContent, 'utf8');
  console.log(`\nTest report generated successfully at: ${filePath}`);
}

runTests();
