# Backend API Integration Test Cases Definitions (50 Test Cases)

BACKEND_TEST_CASES = [
    # --- Auth Endpoints (10) ---
    {
        "id": "TS_API_001",
        "module": "Authentication",
        "name": "POST /api/auth/register - Success",
        "preconditions": "Database does not contain register email.",
        "steps": [
            "1. Send POST request to /api/auth/register with name, email, and password.",
            "2. Verify response code is 200 OK and contains JWT session token."
        ],
        "expected": "User is registered successfully; session token returned.",
        "actual": "Response 200 OK; JWT token generated in response body.",
        "status": "Pass"
    },
    {
        "id": "TS_API_002",
        "module": "Authentication",
        "name": "POST /api/auth/register - Rejects duplicate email",
        "preconditions": "User email already exists in system database.",
        "steps": [
            "1. Send POST request with duplicate email.",
            "2. Confirm response code is 400 Bad Request."
        ],
        "expected": "Returns error message stating duplicate email block.",
        "actual": "Response 400 Bad Request; error message matches constraints.",
        "status": "Pass"
    },
    {
        "id": "TS_API_003",
        "module": "Authentication",
        "name": "POST /api/auth/register - Rejects missing name",
        "preconditions": "None.",
        "steps": [
            "1. Send POST request with name omitted.",
            "2. Confirm response code is 400 Bad Request."
        ],
        "expected": "Returns error: 'All fields (name, email, password) are required.'",
        "actual": "Response 400 Bad Request; missing name error returned.",
        "status": "Pass"
    },
    {
        "id": "TS_API_004",
        "module": "Authentication",
        "name": "POST /api/auth/register - Rejects missing password",
        "preconditions": "None.",
        "steps": [
            "1. Send POST request with password omitted.",
            "2. Confirm response code is 400 Bad Request."
        ],
        "expected": "Returns validation error for missing password.",
        "actual": "Response 400 Bad Request; missing password field blocked.",
        "status": "Pass"
    },
    {
        "id": "TS_API_005",
        "module": "Authentication",
        "name": "POST /api/auth/login - Success",
        "preconditions": "User is registered with correct credentials.",
        "steps": [
            "1. Send POST request to /api/auth/login with valid email and password.",
            "2. Verify response code is 200 OK and contains JWT session token."
        ],
        "expected": "User logged in successfully; redirects with session token.",
        "actual": "Response 200 OK; valid token returned successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_006",
        "module": "Authentication",
        "name": "POST /api/auth/login - Rejects invalid password",
        "preconditions": "User is registered in system.",
        "steps": [
            "1. Send POST request with correct email and wrong password.",
            "2. Verify response code is 401 Unauthorized."
        ],
        "expected": "Returns error: 'Invalid email or password.'",
        "actual": "Response 401 Unauthorized; invalid login credentials blocked.",
        "status": "Pass"
    },
    {
        "id": "TS_API_007",
        "module": "Authentication",
        "name": "POST /api/auth/forgot-password - Success",
        "preconditions": "Email exists in database.",
        "steps": [
            "1. Send POST request with registered email.",
            "2. Verify response code is 200 OK and contains reset code."
        ],
        "expected": "Returns verification reset code with successful dispatch message.",
        "actual": "Response 200 OK; temporary code returned in payload.",
        "status": "Pass"
    },
    {
        "id": "TS_API_008",
        "module": "Authentication",
        "name": "POST /api/auth/reset-password - Success",
        "preconditions": "Forgot password reset code has been generated.",
        "steps": [
            "1. Send POST request to /api/auth/reset-password with code and new password.",
            "2. Verify response code is 200 OK."
        ],
        "expected": "Password updated successfully in user record.",
        "actual": "Response 200 OK; password updated successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_009",
        "module": "Authentication",
        "name": "GET /api/auth/profile - Success with active token",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send GET request to /api/auth/profile with valid Authorization token.",
            "2. Verify response is 200 OK and contains user profile data."
        ],
        "expected": "Returns user profile details matching database record.",
        "actual": "Response 200 OK; profile details load successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_010",
        "module": "Authentication",
        "name": "GET /api/auth/profile - Rejects stale/invalid token",
        "preconditions": "None.",
        "steps": [
            "1. Send GET request with invalid Authorization token.",
            "2. Verify response code is 401 Unauthorized."
        ],
        "expected": "Returns error stating invalid session token.",
        "actual": "Response 401 Unauthorized; endpoint access blocked.",
        "status": "Pass"
    },

    # --- Mood Logging API (8) ---
    {
        "id": "TS_API_011",
        "module": "MoodJournal",
        "name": "POST /api/mood/add - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST to /api/mood/add with valid moodType, intensity (1-5), and note.",
            "2. Verify response code is 200 OK."
        ],
        "expected": "Mood logged successfully; database appended.",
        "actual": "Response 200 OK; mood object returned successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_012",
        "module": "MoodJournal",
        "name": "POST /api/mood/add - Rejects invalid intensity range",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST to /api/mood/add with intensity set to 6.",
            "2. Verify response code is 400 Bad Request."
        ],
        "expected": "Returns error stating intensity must be between 1 and 5.",
        "actual": "Response 400 Bad Request; invalid range blocked.",
        "status": "Pass"
    },
    {
        "id": "TS_API_013",
        "module": "MoodJournal",
        "name": "POST /api/mood/add - Rejects invalid mood category name",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST with moodType set to 'unknown_mood'.",
            "2. Verify response code is 400 Bad Request."
        ],
        "expected": "Returns validation error: 'Invalid mood type.'",
        "actual": "Response 400 Bad Request; unrecognized category rejected.",
        "status": "Pass"
    },
    {
        "id": "TS_API_014",
        "module": "MoodJournal",
        "name": "GET /api/mood/today - Success",
        "preconditions": "User token is authenticated and logged a mood today.",
        "steps": [
            "1. Send GET to /api/mood/today.",
            "2. Verify response code is 200 OK and contains today's mood data."
        ],
        "expected": "Returns today's logged mood object successfully.",
        "actual": "Response 200 OK; today's mood object returned.",
        "status": "Pass"
    },
    {
        "id": "TS_API_015",
        "module": "MoodJournal",
        "name": "GET /api/mood/today - Returns null if not logged",
        "preconditions": "User token is authenticated; no mood logged today.",
        "steps": [
            "1. Send GET to /api/mood/today.",
            "2. Verify response code is 200 OK and mood is null."
        ],
        "expected": "Returns 200 OK; mood parameter is null.",
        "actual": "Response 200 OK; today's mood value is null.",
        "status": "Pass"
    },
    {
        "id": "TS_API_016",
        "module": "MoodJournal",
        "name": "GET /api/mood/history - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send GET to /api/mood/history.",
            "2. Verify response code is 200 OK and contains list of past moods."
        ],
        "expected": "Returns list of historical mood log entries.",
        "actual": "Response 200 OK; array of mood logs returned.",
        "status": "Pass"
    },
    {
        "id": "TS_API_017",
        "module": "MoodJournal",
        "name": "POST /api/mood/add - Streak increment validation",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Log mood for consecutive days.",
            "2. Get user profile and confirm moodStreak has incremented."
        ],
        "expected": "Database user profile streak counts increase.",
        "actual": "Streak variable updated correctly in storage.",
        "status": "Pass"
    },
    {
        "id": "TS_API_018",
        "module": "MoodJournal",
        "name": "POST /api/mood/add - Triggers notification creation",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Add a mood entry.",
            "2. GET /api/notifications and confirm mood tracking notification is present."
        ],
        "expected": "System dispatches mood log notification badge.",
        "actual": "Notification entry created successfully.",
        "status": "Pass"
    },

    # --- Journal Entries API (7) ---
    {
        "id": "TS_API_019",
        "module": "MoodJournal",
        "name": "POST /api/journal/add - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST to /api/journal/add with text and moodTag.",
            "2. Verify response code is 200 OK."
        ],
        "expected": "Reflection recorded and entry added to timeline list.",
        "actual": "Response 200 OK; journal entry saved successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_020",
        "module": "MoodJournal",
        "name": "POST /api/journal/add - Rejects empty text",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST with text omitted.",
            "2. Verify response code is 400 Bad Request."
        ],
        "expected": "Returns validation error stating text is required.",
        "actual": "Response 400 Bad Request; missing text blocked.",
        "status": "Pass"
    },
    {
        "id": "TS_API_021",
        "module": "MoodJournal",
        "name": "GET /api/journal/all - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send GET to /api/journal/all.",
            "2. Verify response is 200 OK and contains list of journal entries."
        ],
        "expected": "Returns full list of logged journal reflection cards.",
        "actual": "Response 200 OK; list of entries retrieved successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_022",
        "module": "MoodJournal",
        "name": "DELETE /api/journal/:id - Success",
        "preconditions": "User token is authenticated; entry ID exists and belongs to user.",
        "steps": [
            "1. Send DELETE to /api/journal/:id.",
            "2. Verify response code is 200 OK."
        ],
        "expected": "Journal entry deleted from data records.",
        "actual": "Response 200 OK; entry deleted successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_023",
        "module": "MoodJournal",
        "name": "DELETE /api/journal/:id - Rejects non-existent ID",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send DELETE to /api/journal/invalid-id-999.",
            "2. Verify response code is 404 Not Found."
        ],
        "expected": "Returns error: 'Journal entry not found or belongs to another user.'",
        "actual": "Response 404 Not Found; request rejected.",
        "status": "Pass"
    },
    {
        "id": "TS_API_024",
        "module": "MoodJournal",
        "name": "POST /api/journal/add - Triggers reflection notification",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Save a new journal entry.",
            "2. Check notifications feed and confirm 'Reflection Recorded' alert exists."
        ],
        "expected": "System generates a notification for the saved entry.",
        "actual": "Notification row added successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_025",
        "module": "MoodJournal",
        "name": "GET /api/journal/all - RLS security validation",
        "preconditions": "Multi-user setup exists in database.",
        "steps": [
            "1. Log in as User A.",
            "2. Fetch all journals and verify User B's entries are excluded."
        ],
        "expected": "Endpoint returns strictly owned entries.",
        "actual": "Data isolation query validated successfully.",
        "status": "Pass"
    },

    # --- AI Endpoints API (8) ---
    {
        "id": "TS_API_026",
        "module": "AIChat",
        "name": "POST /api/ai/analyze-mood - Success with Gemini API response",
        "preconditions": "User token is authenticated; Gemini API is functional.",
        "steps": [
            "1. Send POST to /api/ai/analyze-mood with journal text.",
            "2. Verify response contains emotion, summary, suggestions, and quote."
        ],
        "expected": "Returns structured JSON analysis from Gemini model.",
        "actual": "Response 200 OK; JSON analysis object loaded successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_027",
        "module": "AIChat",
        "name": "POST /api/ai/analyze-mood - Fallback when API times out",
        "preconditions": "User token is authenticated; API timeout simulated.",
        "steps": [
            "1. Send POST to /api/ai/analyze-mood.",
            "2. Verify response contains valid fallback text and suggestion array."
        ],
        "expected": "Returns predefined therapy fallback analysis successfully.",
        "actual": "Graceful fallback returned without throwing server crash.",
        "status": "Pass"
    },
    {
        "id": "TS_API_028",
        "module": "AIChat",
        "name": "POST /api/ai/chat - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST to /api/ai/chat with user feeling query.",
            "2. Verify response contains message text, detected emotion, and coping tips."
        ],
        "expected": "Returns structured supportive AI companion reply.",
        "actual": "Response 200 OK; message object and coping tips loaded.",
        "status": "Pass"
    },
    {
        "id": "TS_API_029",
        "module": "AIChat",
        "name": "POST /api/ai/chat - Fallback when AI fails",
        "preconditions": "User token is authenticated; simulate API connection failure.",
        "steps": [
            "1. Send feeling message.",
            "2. Confirm receipt of static breathing-centered coping reply."
        ],
        "expected": "Returns valid support chat fallback message.",
        "actual": "Empathetic chat fallback returned successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_030",
        "module": "AIChat",
        "name": "GET /api/ai/chat-history - Success",
        "preconditions": "User token is authenticated; chat history exists.",
        "steps": [
            "1. Send GET to /api/ai/chat-history.",
            "2. Verify response code is 200 OK and contains past messages."
        ],
        "expected": "Returns full chronological conversation thread array.",
        "actual": "Response 200 OK; message list retrieved.",
        "status": "Pass"
    },
    {
        "id": "TS_API_031",
        "module": "AIChat",
        "name": "DELETE /api/ai/chat-history - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send DELETE to /api/ai/chat-history.",
            "2. Verify response code is 200 OK."
        ],
        "expected": "All chat messages for this user are deleted from data logs.",
        "actual": "Response 200 OK; database logs wiped successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_032",
        "module": "AIChat",
        "name": "GET /api/ai/weekly-report - Success",
        "preconditions": "User has logged mood data in the past week.",
        "steps": [
            "1. Send GET request to /api/ai/weekly-report.",
            "2. Verify response contains weekly trends, summary, and recommendations."
        ],
        "expected": "Returns weekly clinical analysis report JSON structure.",
        "actual": "Response 200 OK; weekly wellness report compiled.",
        "status": "Pass"
    },
    {
        "id": "TS_API_033",
        "module": "AIChat",
        "name": "GET /api/ai/weekly-report - Rejects when no data logged",
        "preconditions": "User has zero mood logs in system database.",
        "steps": [
            "1. Send GET request to /api/ai/weekly-report.",
            "2. Verify response code is 400 Bad Request."
        ],
        "expected": "Returns error: 'You need to record at least one mood entry...'",
        "actual": "Response 400 Bad Request; operation blocked.",
        "status": "Pass"
    },

    # --- Community Plaza API (6) ---
    {
        "id": "TS_API_034",
        "module": "CommunityPlaza",
        "name": "GET /api/community - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send GET to /api/community.",
            "2. Verify response code is 200 OK and contains plaza posts list."
        ],
        "expected": "Returns list of positive shared cards.",
        "actual": "Response 200 OK; posts list loaded successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_035",
        "module": "CommunityPlaza",
        "name": "POST /api/community/add - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST to /api/community/add with authorName, text, and bgGradient.",
            "2. Verify response code is 200 OK."
        ],
        "expected": "Post is saved and visible to all users.",
        "actual": "Response 200 OK; post card published successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_036",
        "module": "CommunityPlaza",
        "name": "POST /api/community/add - Rejects missing text",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST with text omitted.",
            "2. Verify response code is 400 Bad Request."
        ],
        "expected": "Returns error: 'Post text is required.'",
        "actual": "Response 400 Bad Request; missing post text rejected.",
        "status": "Pass"
    },
    {
        "id": "TS_API_037",
        "module": "CommunityPlaza",
        "name": "POST /api/community/like/:id - Success",
        "preconditions": "User token is authenticated; post ID exists.",
        "steps": [
            "1. Send POST to /api/community/like/:id.",
            "2. Verify response contains updated likes array."
        ],
        "expected": "Likes list updated successfully, toggling user support.",
        "actual": "Response 200 OK; like toggled in likes array.",
        "status": "Pass"
    },
    {
        "id": "TS_API_038",
        "module": "CommunityPlaza",
        "name": "POST /api/community/like/:id - Rejects invalid post ID",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST to /api/community/like/invalid-post-999.",
            "2. Verify response code is 404 Not Found."
        ],
        "expected": "Returns error: 'Post not found.'",
        "actual": "Response 404 Not Found; like request rejected.",
        "status": "Pass"
    },
    {
        "id": "TS_API_039",
        "module": "CommunityPlaza",
        "name": "POST /api/community/like/:id - Triggers author notification",
        "preconditions": "User B supports User A's community post.",
        "steps": [
            "1. Log in as User B.<br>2. Support User A's post.",
            "3. Log in as User A and confirm notification is received."
        ],
        "expected": "User A receives: 'Someone liked and felt supported by your community affirmation!'",
        "actual": "Author notifications updated with like alert.",
        "status": "Pass"
    },

    # --- Notifications API (5) ---
    {
        "id": "TS_API_040",
        "module": "Notifications",
        "name": "GET /api/notifications - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send GET to /api/notifications.",
            "2. Verify response is 200 OK and lists user notifications."
        ],
        "expected": "Returns list of read and unread notifications scoped to user.",
        "actual": "Response 200 OK; notifications feed returned.",
        "status": "Pass"
    },
    {
        "id": "TS_API_041",
        "module": "Notifications",
        "name": "POST /api/notifications/read/:id - Success",
        "preconditions": "User token is authenticated; notification ID exists.",
        "steps": [
            "1. Send POST to /api/notifications/read/:id.",
            "2. Verify response is 200 OK and success is true."
        ],
        "expected": "Notification status updated to read.",
        "actual": "Response 200 OK; read state saved successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_042",
        "module": "Notifications",
        "name": "POST /api/notifications/clear - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST to /api/notifications/clear.",
            "2. Verify response code is 200 OK."
        ],
        "expected": "All notifications cleared from user logs.",
        "actual": "Response 200 OK; notifications collection cleared.",
        "status": "Pass"
    },

    # --- Core Analytics & Score API (6) ---
    {
        "id": "TS_API_043",
        "module": "WellnessScore",
        "name": "GET /api/wellness/score - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send GET request to /api/wellness/score.",
            "2. Verify response contains score, breakdown variables, and evaluation summary."
        ],
        "expected": "Returns calculated weighted wellness metrics out of 100.",
        "actual": "Response 200 OK; score breakdown fields retrieved.",
        "status": "Pass"
    },
    {
        "id": "TS_API_044",
        "module": "WellnessScore",
        "name": "GET /api/wellness/score - Score weight calculation logic",
        "preconditions": "User has logged mood and reflections.",
        "steps": [
            "1. Fetch score metrics.",
            "2. Confirm weighted sum (streak + logging + positivity + journal) matches values."
        ],
        "expected": "Weighted score math holds correct values.",
        "actual": "Calculated score matches criteria weights.",
        "status": "Pass"
    },
    {
        "id": "TS_API_045",
        "module": "FuzzySearch",
        "name": "GET /api/search - Success with query parameters",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send GET to /api/search with query string q=happy.",
            "2. Verify returned journals and moods filter by the query string."
        ],
        "expected": "Returns filtered list of matching journals and mood notes.",
        "actual": "Response 200 OK; query results retrieved successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_046",
        "module": "FuzzySearch",
        "name": "GET /api/search - Returns all when query is empty",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send GET to /api/search with empty query.",
            "2. Confirm all owned entries are returned."
        ],
        "expected": "Returns full list of user journals and mood notes.",
        "actual": "Response 200 OK; full history retrieved.",
        "status": "Pass"
    },
    {
        "id": "TS_API_047",
        "module": "Meditation",
        "name": "POST /api/meditation/complete - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send POST to /api/meditation/complete with seconds logged.",
            "2. Verify response is 200 OK."
        ],
        "expected": "Session logged; triggers creation of breathing milestone notification.",
        "actual": "Response 200 OK; milestone event created successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_048",
        "module": "Notifications",
        "name": "GET /api/health - Success",
        "preconditions": "None.",
        "steps": [
            "1. Send GET request to /api/health.",
            "2. Verify response code is 200 OK and contains system details."
        ],
        "expected": "Returns system health metrics and platform data.",
        "actual": "Response 200 OK; server uptime and metadata retrieved.",
        "status": "Pass"
    },
    {
        "id": "TS_API_049",
        "module": "Notifications",
        "name": "GET /api/backend/info - Success",
        "preconditions": "User token is authenticated.",
        "steps": [
            "1. Send GET request to /api/backend/info.",
            "2. Verify response lists supported API routes."
        ],
        "expected": "Returns service details and supported endpoint list.",
        "actual": "Response 200 OK; endpoints information loaded successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_API_050",
        "module": "Notifications",
        "name": "GET /api/backend/info - Blocks unauthorized calls",
        "preconditions": "None.",
        "steps": [
            "1. Send GET request without session token.",
            "2. Verify response code is 401 Unauthorized."
        ],
        "expected": "Request blocked displaying Token is missing error.",
        "actual": "Response 401 Unauthorized; route guard blocked request.",
        "status": "Pass"
    }
]
