# Phase 1: Authentication API Test Results

✅ Test setup: Passwords updated successfully.

▶ Test 1: Valid admin login
Input: geniuscoachinginstitute1@gmail.com
Expected: Token & admin role
Actual: Success
Status: PASS

▶ Test 2: Valid teacher login
Input: teacher@test.com
Expected: Token & teacher role
Actual: Success
Status: PASS

▶ Test 3: Valid student login
Input: rajgupta@gmail.com
Expected: Token & student role
Actual: Success
Status: PASS

▶ Test 4: Wrong password
Input: rajgupta@gmail.com / WrongPassword!
Expected: 401 Unauthorized
Actual: 401 Unauthorized
Status: PASS

▶ Test 5: Unknown user
Input: nobody@nowhere.com
Expected: 401 Unauthorized
Actual: 401 Unauthorized
Status: PASS

▶ Test 6: Missing token
Input: GET /dashboard/admin (no token)
Expected: 401 Unauthorized
Actual: 401 Unauthorized
Status: PASS

▶ Test 7: Malformed token
Input: GET /dashboard/admin (bad token)
Expected: 401 Unauthorized
Actual: 401 Unauthorized
Status: PASS

▶ Test 8: Expired token
Input: GET /dashboard/admin (expired token)
Expected: 401 Unauthorized
Actual: 401 Unauthorized
Status: PASS

▶ Test 9: Wrong-role protected route
Input: GET /dashboard/admin (using student token)
Expected: 403 Forbidden
Actual: 403 Forbidden
Status: PASS

