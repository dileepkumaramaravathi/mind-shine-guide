# Selenium Test Cases Definitions (50 Test Cases)

SELENIUM_TEST_CASES = [
    # --- Landing Page (4) ---
    {
        "id": "TS_SEL_001",
        "module": "LandingPage",
        "name": "Verify landing page title and layout",
        "preconditions": "Web browser is open; application is not logged in.",
        "steps": [
            "1. Navigate to http://localhost:3000/",
            "2. Verify the document title includes 'Mind Mood AI'",
            "3. Confirm presence of logo and welcome header text."
        ],
        "expected": "Landing page displays title and description correctly.",
        "actual": "Title and header layout loaded as expected.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_002",
        "module": "LandingPage",
        "name": "Verify Get Started button navigation",
        "preconditions": "Application landing page is loaded.",
        "steps": [
            "1. Click the 'Get Started' CTA button",
            "2. Verify user is redirected to the Registration view."
        ],
        "expected": "App changes view to the Registration / SignUp screen.",
        "actual": "Successfully navigated to SignUp view.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_003",
        "module": "LandingPage",
        "name": "Verify Login button navigation",
        "preconditions": "Application landing page is loaded.",
        "steps": [
            "1. Click the secondary 'Login' link",
            "2. Verify user is redirected to the Login view."
        ],
        "expected": "App changes view to the Login / SignIn screen.",
        "actual": "Successfully navigated to Login view.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_004",
        "module": "LandingPage",
        "name": "Verify landing page visual responsive grid sizing",
        "preconditions": "Browser viewport is configured to desktop resolution (1280x800).",
        "steps": [
            "1. Measure the primary container bounds.",
            "2. Verify horizontal alignments are balanced."
        ],
        "expected": "Container uses side-by-side flex layout on desktop size.",
        "actual": "Layout aligns in two columns on desktop viewports.",
        "status": "Pass"
    },

    # --- Authentication (8) ---
    {
        "id": "TS_SEL_005",
        "module": "Authentication",
        "name": "Verify registration failure with empty credentials",
        "preconditions": "User is on the Registration / SignUp page.",
        "steps": [
            "1. Leave Name, Email, and Password empty",
            "2. Click the 'Create Account' button",
            "3. Observe validation errors."
        ],
        "expected": "Browser-native or custom validation error pops up.",
        "actual": "Form triggers field requirements validation successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_006",
        "module": "Authentication",
        "name": "Verify successful user registration",
        "preconditions": "User is on the Registration page; database does not contain test email.",
        "steps": [
            "1. Input 'Selenium Tester' in Name field",
            "2. Input 'selenium@test.com' in Email field",
            "3. Input 'SecurePass123' in Password field",
            "4. Click 'Create Account'"
        ],
        "expected": "Account created and user redirected to Dashboard.",
        "actual": "Registered successfully and redirected to Dashboard view.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_007",
        "module": "Authentication",
        "name": "Verify registration rejection for duplicate email",
        "preconditions": "User is on the Registration page; 'selenium@test.com' already exists.",
        "steps": [
            "1. Input duplicate credentials",
            "2. Click 'Create Account'",
            "3. Verify alert or toast dialog message."
        ],
        "expected": "Error message: 'An account with this email already exists.'",
        "actual": "Received server error: duplicate account block validated.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_008",
        "module": "Authentication",
        "name": "Verify login failure with wrong password",
        "preconditions": "User is on the Login page.",
        "steps": [
            "1. Input 'selenium@test.com' as email",
            "2. Input 'WrongPass' as password",
            "3. Click 'Sign In'"
        ],
        "expected": "Error message: 'Invalid email or password.' is displayed.",
        "actual": "Received 401 Unauthorized with correct error text.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_009",
        "module": "Authentication",
        "name": "Verify login success with correct credentials",
        "preconditions": "User is on the Login page.",
        "steps": [
            "1. Input 'selenium@test.com' and 'SecurePass123'",
            "2. Click 'Sign In'"
        ],
        "expected": "Redirects to Dashboard; auth token saved in localStorage.",
        "actual": "Auth token stored in mind_mood_token, dashboard loads.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_010",
        "module": "Authentication",
        "name": "Verify forgot password reset code request",
        "preconditions": "User is on the Login page.",
        "steps": [
            "1. Click 'Forgot Password?' link",
            "2. Enter registered email 'selenium@test.com'",
            "3. Click 'Send Reset Code'"
        ],
        "expected": "Dispatches code and displays 'verification code has been dispatched'.",
        "actual": "Reset code generated and retrieved successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_011",
        "module": "Authentication",
        "name": "Verify password reset with correct validation code",
        "preconditions": "Verification code has been dispatched to email.",
        "steps": [
            "1. Input verification code into the code field",
            "2. Input 'NewSecurePass999' as new password",
            "3. Click 'Update Password'"
        ],
        "expected": "Password updated successfully; prompt redirects user to login.",
        "actual": "Password updated successfully in database record.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_012",
        "module": "Authentication",
        "name": "Verify secure token restoration on page refresh",
        "preconditions": "User is authenticated and currently viewing the Dashboard.",
        "steps": [
            "1. Refresh browser page",
            "2. Verify user remains logged in without seeing landing page."
        ],
        "expected": "Auth token is retrieved from localStorage and profile loads.",
        "actual": "Token retrieved, skipped auth page, dashboard persisted.",
        "status": "Pass"
    },

    # --- Dashboard & Mood Logging (6) ---
    {
        "id": "TS_SEL_013",
        "module": "Dashboard",
        "name": "Verify dashboard layout metrics display",
        "preconditions": "User is authenticated and logged in.",
        "steps": [
            "1. Inspect header for user's customized name",
            "2. Check presence of today's date indicator banner",
            "3. Check default streak count display."
        ],
        "expected": "Header matches user name, streak is visible, current date is shown.",
        "actual": "User name and live current date loaded properly.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_014",
        "module": "Dashboard",
        "name": "Verify mood logging select interaction",
        "preconditions": "User is on the Dashboard with no mood logged today.",
        "steps": [
            "1. Click 'Happy' mood button",
            "2. Verify state highlighting color changes on button."
        ],
        "expected": "Happy button receives border outline indicating selection.",
        "actual": "Button highlighted dynamically upon selection.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_015",
        "module": "Dashboard",
        "name": "Verify mood logging intensity slider values",
        "preconditions": "Mood button is selected.",
        "steps": [
            "1. Drag intensity slider to max value (5)",
            "2. Confirm label changes text from 1 to 5."
        ],
        "expected": "Intensity slider successfully handles range adjustments.",
        "actual": "Value set to 5/5, color fills active bar.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_016",
        "module": "Dashboard",
        "name": "Verify successful mood logging submission",
        "preconditions": "Mood selection and intensity are selected.",
        "steps": [
            "1. Enter note: 'Had a productive coding session today.'",
            "2. Click 'Complete Check-In' button"
        ],
        "expected": "Mood is submitted, summary dashboard shows logged status.",
        "actual": "Daily mood recorded in database; UI shows 'Logged Today' state.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_017",
        "module": "Dashboard",
        "name": "Verify consecutive streak increment after logging",
        "preconditions": "User logs in and logs mood for consecutive days.",
        "steps": [
            "1. Log today's mood",
            "2. View user profile streak count in mini-badge."
        ],
        "expected": "Streak counter increments accordingly.",
        "actual": "Streak updated to 1 day on UI badge.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_018",
        "module": "Dashboard",
        "name": "Verify shortcut links load correct sub-pages",
        "preconditions": "User is on the Dashboard.",
        "steps": [
            "1. Locate quick action cards (Meditation, Chat)",
            "2. Click 'Start Breathing' link",
            "3. Verify active tab changes."
        ],
        "expected": "View portal navigates user to the Breathing Guide component.",
        "actual": "Navigated to Meditation view successfully.",
        "status": "Pass"
    },

    # --- AI Companion Chat (6) ---
    {
        "id": "TS_SEL_019",
        "module": "AIChat",
        "name": "Verify AI Support Chat landing view",
        "preconditions": "User is logged in; clicks 'AI Support Chat' sidebar tab.",
        "steps": [
            "1. Check welcome therapist card messaging",
            "2. Check input form placeholder text."
        ],
        "expected": "Therapist card displays welcoming instructions.",
        "actual": "Warm chat onboarding messaging visible.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_020",
        "module": "AIChat",
        "name": "Verify chat submission and loading state",
        "preconditions": "AI Support Chat is open.",
        "steps": [
            "1. Type 'I am feeling overwhelmed with homework'",
            "2. Click 'Send' button",
            "3. Observe progress spinner."
        ],
        "expected": "Message appears in bubble; loading spinner appears for AI reply.",
        "actual": "Message sent, progress bar animated correctly.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_021",
        "module": "AIChat",
        "name": "Verify AI response receipt and content structure",
        "preconditions": "Message has been submitted to AI.",
        "steps": [
            "1. Wait for spinner to disappear",
            "2. Inspect the latest message bubble.",
            "3. Verify detection of emotional tone header."
        ],
        "expected": "AI response is generated showing supportive text and emotional label.",
        "actual": "Empathetic reply received with 'Anxious/Stressed' classification.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_022",
        "module": "AIChat",
        "name": "Verify coping tips rendering on AI reply",
        "preconditions": "AI response is fully rendered in the view.",
        "steps": [
            "1. Scroll to the bottom of the AI chat window",
            "2. Check presence of coping suggestion list boxes."
        ],
        "expected": "Coping suggestions are visible beneath AI therapist message.",
        "actual": "Suggestions and breathing tips rendered successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_023",
        "module": "AIChat",
        "name": "Verify clearing chat history",
        "preconditions": "Chat messages are active in history.",
        "steps": [
            "1. Click the gear or 'Clear Chat' button in chat header",
            "2. Confirm clear warning action."
        ],
        "expected": "Chat history is deleted from database; workspace clears.",
        "actual": "Messages wiped, welcome placeholder reset.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_024",
        "module": "AIChat",
        "name": "Verify API fallback safety",
        "preconditions": "AI companion is loaded, simulated API error is forced.",
        "steps": [
            "1. Send feeling message with empty/stale token",
            "2. Check if error is handled gracefully."
        ],
        "expected": "Application returns static therapist fallback message cleanly.",
        "actual": "Static fallback successfully avoided app crash.",
        "status": "Pass"
    },

    # --- Self-Reflective Journal (6) ---
    {
        "id": "TS_SEL_025",
        "module": "MoodJournal",
        "name": "Verify mood journal component structure",
        "preconditions": "User is logged in; navigates to 'Mood Journal' tab.",
        "steps": [
            "1. Inspect presence of editor card container",
            "2. Verify Tag dropdown menu defaults."
        ],
        "expected": "Rich text area and tag buttons are correctly rendered.",
        "actual": "Editor area and emotion selector icons rendered.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_026",
        "module": "MoodJournal",
        "name": "Verify writing journal entry with custom tag",
        "preconditions": "Mood Journal is active.",
        "steps": [
            "1. Enter reflection: 'I managed to complete all tasks today.'",
            "2. Select tag 'Proud' (or custom happy option)",
            "3. Click 'Save Reflection'"
        ],
        "expected": "Reflection is logged; editor clears, entry list is appended.",
        "actual": "Journal entry saved, database updated, list refreshed.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_027",
        "module": "MoodJournal",
        "name": "Verify journal text character constraints validation",
        "preconditions": "Mood Journal is active.",
        "steps": [
            "1. Click 'Save Reflection' without entering text",
            "2. Verify validation alert."
        ],
        "expected": "Error message stating that journal text is required.",
        "actual": "Validation blocked submission of empty text.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_028",
        "module": "MoodJournal",
        "name": "Verify journal history cards display",
        "preconditions": "User has logged at least one reflection.",
        "steps": [
            "1. Scroll through journal timeline cards list",
            "2. Verify dates, tags, and text content."
        ],
        "expected": "Cards contain date, selected emotional tag icon, and body text.",
        "actual": "Timeline card rendered with proper timestamp and note details.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_029",
        "module": "MoodJournal",
        "name": "Verify journal entry deletion",
        "preconditions": "Timeline card is visible.",
        "steps": [
            "1. Click the trash bin icon on the journal card",
            "2. Observe list updating."
        ],
        "expected": "Entry is removed from timeline list instantly.",
        "actual": "Entry deleted from client view and backend database.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_030",
        "module": "MoodJournal",
        "name": "Verify journal security isolation",
        "preconditions": "User is logged in.",
        "steps": [
            "1. Fetch journals list via GET API",
            "2. Confirm that only the logged-in user's entries are returned."
        ],
        "expected": "Returned entries strictly correspond to owner's userId.",
        "actual": "Database queried and returns scoped user records only.",
        "status": "Pass"
    },

    # --- Analytics & Trend Insights (4) ---
    {
        "id": "TS_SEL_031",
        "module": "Analytics",
        "name": "Verify analytics dashboard view",
        "preconditions": "User navigates to 'Analytics & Insights'.",
        "steps": [
            "1. Inspect layout for trend graphs and stats widgets",
            "2. Verify empty state text if logs are empty."
        ],
        "expected": "Trend summaries, logs count, and average indicators appear.",
        "actual": "Analytics panels containing charts loaded successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_032",
        "module": "Analytics",
        "name": "Verify weekly mood breakdown charts rendering",
        "preconditions": "User has mood data recorded.",
        "steps": [
            "1. Inspect SVG bar nodes or flex columns representing distribution",
            "2. Verify percentage counts map to mood ratios."
        ],
        "expected": "SVG charts render proportionate to logged mood counts.",
        "actual": "Bar and circular metrics match mood record proportions.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_033",
        "module": "Analytics",
        "name": "Verify sleep and activity metrics sync",
        "preconditions": "User is viewing the Analytics page.",
        "steps": [
            "1. Inspect physical and sleep stats columns.",
            "2. Confirm correlation with logging data."
        ],
        "expected": "Sleep trends card reflects average logged hours.",
        "actual": "Calculated value accurately reflects data entries.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_034",
        "module": "Analytics",
        "name": "Verify weekly AI report request trigger",
        "preconditions": "User has at least one mood entry in database.",
        "steps": [
            "1. Click 'Generate Weekly AI Insight Report'",
            "2. Verify report panel expands showing therapist analysis summaries."
        ],
        "expected": "AI report container opens with summary, trends, and coping tips.",
        "actual": "Report generated dynamically via AI and displayed on UI.",
        "status": "Pass"
    },

    # --- Guided Relaxation / Meditation (4) ---
    {
        "id": "TS_SEL_035",
        "module": "Meditation",
        "name": "Verify guided breathing screen default state",
        "preconditions": "User navigates to 'Breathing Guide'.",
        "steps": [
            "1. Confirm breathing sphere is rendered in neutral state",
            "2. Verify default timer selection is 60 seconds."
        ],
        "expected": "Circular breathing helper element is ready, start button is active.",
        "actual": "Meditation interface ready with duration select pills.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_036",
        "module": "Meditation",
        "name": "Verify duration selection pills",
        "preconditions": "Breathing Guide is open.",
        "steps": [
            "1. Click the '3 Minute' pill option",
            "2. Verify counter changes to 180 seconds."
        ],
        "expected": "Active timer duration state updates dynamically.",
        "actual": "Timer updated to 180s successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_037",
        "module": "Meditation",
        "name": "Verify breathing timer start/pause action",
        "preconditions": "Breathing Guide is open.",
        "steps": [
            "1. Click the 'Start Session' button",
            "2. Verify label changes to 'Pause Session' and circle animates",
            "3. Click 'Pause' and verify stopwatch pauses."
        ],
        "expected": "Start button toggles correctly, animation matches state.",
        "actual": "Timer runs, scales down on pause, updates correctly.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_038",
        "module": "Meditation",
        "name": "Verify breathing completion notification trigger",
        "preconditions": "Session completes naturally (countdown hits 0).",
        "steps": [
            "1. Wait for simulated completion of breathing timer",
            "2. Verify database records completion",
            "3. Inspect notifications feed for milestone badge."
        ],
        "expected": "A milestone alert notification is added for the user.",
        "actual": "Logged loop completion, system added positive alert.",
        "status": "Pass"
    },

    # --- Community Plaza (4) ---
    {
        "id": "TS_SEL_039",
        "module": "CommunityPlaza",
        "name": "Verify community feed listing",
        "preconditions": "User navigates to 'Community Plaza'.",
        "steps": [
            "1. Inspect layout for reflection cards",
            "2. Verify cards show anonymous author names."
        ],
        "expected": "Plaza lists cards in structured grid with tags.",
        "actual": "Shared community reflection cards load in grid view.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_040",
        "module": "CommunityPlaza",
        "name": "Verify sharing customized gratitude card",
        "preconditions": "Community page is loaded.",
        "steps": [
            "1. Click 'Share Affirmation' trigger",
            "2. Input: 'Breathing exercises helped me focus!'",
            "3. Select a purple gradient backdrop block",
            "4. Click 'Publish anonymously'"
        ],
        "expected": "Card is saved to database and immediately prepended to feed.",
        "actual": "Affirmation posted, card rendered in purple layout.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_041",
        "module": "CommunityPlaza",
        "name": "Verify supporting (liking) community post",
        "preconditions": "Community feed displays other users' cards.",
        "steps": [
            "1. Choose a card published by another user",
            "2. Click the Heart button (Show Support)",
            "3. Observe support count increase."
        ],
        "expected": "Count increments by 1; heart button becomes highlighted.",
        "actual": "Toggled support like, updated count to 1.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_042",
        "module": "CommunityPlaza",
        "name": "Verify author support notifications feed alert",
        "preconditions": "Another user has supported current user's card.",
        "steps": [
            "1. Trigger mock support action on user's post",
            "2. Navigate to user notifications tab."
        ],
        "expected": "Alert reads: 'Someone liked and felt supported by your community affirmation!'",
        "actual": "Interactive notification visible in the feed list.",
        "status": "Pass"
    },

    # --- Wellness Score (3) ---
    {
        "id": "TS_SEL_043",
        "module": "WellnessScore",
        "name": "Verify wellness score breakdown layout",
        "preconditions": "User navigates to 'Wellness Core'.",
        "steps": [
            "1. Check primary circular score dial.",
            "2. Inspect breakdown cards (Streak, frequency, positivity, journal length)."
        ],
        "expected": "Weighted scores sum up correctly, evaluation text matches.",
        "actual": "Individual wellness scores and category badges visible.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_044",
        "module": "WellnessScore",
        "name": "Verify wellness grade updates dynamically after activities",
        "preconditions": "User has logged mood and reflection.",
        "steps": [
            "1. Check initial score",
            "2. Log new mood entry and write reflection",
            "3. Return to Wellness Core."
        ],
        "expected": "Wellness score recalculates and increases accordingly.",
        "actual": "Score successfully increased from base level.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_045",
        "module": "WellnessScore",
        "name": "Verify action items recommendations navigation link",
        "preconditions": "Wellness Core view is open.",
        "steps": [
            "1. Scroll to 'Improvement Checklist'",
            "2. Click 'Practice breathing link'",
            "3. Confirm view redirects."
        ],
        "expected": "Viewport changes to guided breathing guide.",
        "actual": "Successfully navigated user to the Meditation view.",
        "status": "Pass"
    },

    # --- Notifications, Profile & Search (5) ---
    {
        "id": "TS_SEL_046",
        "module": "Notifications",
        "name": "Verify unread notification badge count updates",
        "preconditions": "User is viewing the dashboard; has unread notifications.",
        "steps": [
            "1. Look at 'Notifications' menu item",
            "2. Count the red badge numeric value."
        ],
        "expected": "Badge displays correct count matching unread rows in db.",
        "actual": "Unread counter badge updates automatically.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_047",
        "module": "Notifications",
        "name": "Verify marking notification as read",
        "preconditions": "User navigates to Notifications feed page.",
        "steps": [
            "1. Choose an unread notification marked by active borders",
            "2. Click the 'Mark as Read' check button."
        ],
        "expected": "Active borders fade, unread badge count in sidebar decreases.",
        "actual": "Notification row state updated to read.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_048",
        "module": "ProfileSettings",
        "name": "Verify switching light and dark UI themes",
        "preconditions": "User navigates to 'Profile & Settings'.",
        "steps": [
            "1. Click the 'Toggle Dark Mode' button",
            "2. Inspect container background class list",
            "3. Toggle again."
        ],
        "expected": "UI colors switch immediately, classes change context.",
        "actual": "Theme changed successfully; theme CSS applies classes.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_049",
        "module": "FuzzySearch",
        "name": "Verify search filter behavior on journal entries",
        "preconditions": "User has logged journals with various texts.",
        "steps": [
            "1. Click search field in Dashboard header",
            "2. Type search query 'tasks'",
            "3. Observe matching list cards."
        ],
        "expected": "List filters down to entries containing query term in text/tag.",
        "actual": "Results narrowed down matching target query term.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_050",
        "module": "ProfileSettings",
        "name": "Verify user account signout",
        "preconditions": "User is logged in.",
        "steps": [
            "1. Click 'Sign Out' in profile tab or sidebar badge",
            "2. Check redirection to landing page."
        ],
        "expected": "Auth token cleared from localStorage; redirected to landing page.",
        "actual": "Token removed, view reset to landing page.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_051",
        "module": "LandingPage",
        "name": "Verify footer navigation link redirection",
        "preconditions": "Application landing page is loaded.",
        "steps": [
            "1. Scroll to the footer section",
            "2. Click the 'Privacy Policy' link",
            "3. Confirm navigation or modal display."
        ],
        "expected": "Privacy Policy content is shown to the user.",
        "actual": "Successfully verified Privacy Policy link display.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_052",
        "module": "LandingPage",
        "name": "Verify Cookie Consent banner visibility and acceptance",
        "preconditions": "Application landing page is loaded for the first time.",
        "steps": [
            "1. Locate the Cookie Consent banner",
            "2. Click the 'Accept All' button",
            "3. Confirm the banner disappears."
        ],
        "expected": "Cookie Consent banner dismisses and preference is stored in localStorage.",
        "actual": "Consent accepted, banner dismissed successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_053",
        "module": "LandingPage",
        "name": "Verify FAQ section accordion interactivity",
        "preconditions": "Application landing page is loaded.",
        "steps": [
            "1. Scroll to FAQ section",
            "2. Click on the first question row",
            "3. Confirm accordion body expands."
        ],
        "expected": "FAQ response text expands and becomes visible.",
        "actual": "Accordion toggle animation completed as expected.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_054",
        "module": "LandingPage",
        "name": "Verify language translation dropdown options",
        "preconditions": "Application landing page is loaded.",
        "steps": [
            "1. Click the Language dropdown button in header",
            "2. Select Spanish (ES) option",
            "3. Verify page content updates translating text headers."
        ],
        "expected": "Headers change dynamically into Spanish translations.",
        "actual": "Successfully translated landing headers to Spanish.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_055",
        "module": "Authentication",
        "name": "Verify password strength meter UI feedback",
        "preconditions": "User is on the Registration page.",
        "steps": [
            "1. Input '123' in password input field",
            "2. Verify strength bar displays red (Weak)",
            "3. Input 'SecureP@ss123!' and verify strength bar turns green (Strong)."
        ],
        "expected": "Strength indicator bar dynamically changes color and level labels.",
        "actual": "Visual feedback indicator updated according to complexity rules.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_056",
        "module": "Authentication",
        "name": "Verify invalid email format submission rejection",
        "preconditions": "User is on the Registration / SignUp page.",
        "steps": [
            "1. Enter invalid email string 'invalid-email-format'",
            "2. Attempt form submission",
            "3. Confirm presence of warning message."
        ],
        "expected": "Browser alert or custom tooltip warns about invalid format.",
        "actual": "Form blocked submission, displaying validation mismatch error.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_057",
        "module": "Authentication",
        "name": "Verify OAuth login redirect mock trigger",
        "preconditions": "User is on the Login page.",
        "steps": [
            "1. Click the 'Sign in with Google' button",
            "2. Confirm window redirects to mock OAuth callback URL."
        ],
        "expected": "OAuth screen overlay or redirect opens successfully.",
        "actual": "Google OAuth request mock verification succeeded.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_058",
        "module": "Authentication",
        "name": "Verify automatic session timeout mock notification",
        "preconditions": "User is logged in; session expiration time is modified to 1s.",
        "steps": [
            "1. Wait for session expiration interval",
            "2. Perform navigation action",
            "3. Verify redirection to landing page with warning message."
        ],
        "expected": "User session ends automatically, redirecting to login with message 'Session expired'.",
        "actual": "Session state cleared, logged out user automatically.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_059",
        "module": "Authentication",
        "name": "Verify Terms & Conditions checkbox block",
        "preconditions": "User is on the Registration / SignUp page.",
        "steps": [
            "1. Fill all input credentials fields",
            "2. Leave the 'Agree to Terms and Conditions' checkbox unchecked",
            "3. Click 'Create Account' and check for warning."
        ],
        "expected": "Registration is blocked with error requiring agreement confirmation.",
        "actual": "Checked status validator blocked user registration.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_060",
        "module": "Dashboard",
        "name": "Verify today's checklist widget items completion",
        "preconditions": "User is logged in on Dashboard.",
        "steps": [
            "1. Locate 'Daily Checklist' card item list",
            "2. Click checkbox next to 'Perform guided breathing session'",
            "3. Verify checklist counter increments."
        ],
        "expected": "Checklist checklist item state updates to completed, checklist progress updates.",
        "actual": "Completed task updated progress dial state.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_061",
        "module": "Dashboard",
        "name": "Verify streak milestones popup modal reward",
        "preconditions": "User reaches 7-day logging streak count.",
        "steps": [
            "1. Force mock streak value to 7 in user profile state",
            "2. Reload dashboard view",
            "3. Verify streak celebration modal pops up."
        ],
        "expected": "Milestone alert modal displays congratulating user.",
        "actual": "Badge milestone popup rendered on UI layer.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_062",
        "module": "Dashboard",
        "name": "Verify collapsing sidebar layout menu widget",
        "preconditions": "User is logged in on dashboard screen.",
        "steps": [
            "1. Click the 'Collapse Sidebar' menu icon button",
            "2. Verify sidebar widths shrink to icons only",
            "3. Click again to expand."
        ],
        "expected": "Layout adjustments shrink and restore sidebar smoothly.",
        "actual": "Toggle collapse button verified, layout adapts clean.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_063",
        "module": "Dashboard",
        "name": "Verify quick action card hover animations",
        "preconditions": "User is logged in on dashboard.",
        "steps": [
            "1. Move cursor hover state to Meditation action card",
            "2. Verify box shadow and scaling transforms apply."
        ],
        "expected": "Card expands slightly with glowing border shadow.",
        "actual": "Micro-animations applied successfully on mouse hover.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_064",
        "module": "Dashboard",
        "name": "Verify empty logs state default message",
        "preconditions": "User account has zero saved database check-ins.",
        "steps": [
            "1. Log in to a fresh demo account",
            "2. Verify dashboard summary card reads 'Start your first mood log today'."
        ],
        "expected": "Welcome instructions display placeholder layout text.",
        "actual": "Placeholder graphics and texts verified.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_065",
        "module": "Dashboard",
        "name": "Verify recent check-in list layout constraints",
        "preconditions": "User has logged several check-ins.",
        "steps": [
            "1. Scroll down to 'Recent Check-ins' section",
            "2. Confirm lists limit view to maximum of 5 recent logs."
        ],
        "expected": "Feed restricts records count to latest 5 entries only.",
        "actual": "Checked database sync limit constraints on dashboard listing.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_066",
        "module": "AIChat",
        "name": "Verify message time indicator formatting",
        "preconditions": "User has sent message in AI support chat.",
        "steps": [
            "1. Inspect bubble headers on the sent chat bubbles",
            "2. Verify presence of timestamp matching current minute."
        ],
        "expected": "Display tag format parses time correctly (e.g. '10:45 AM').",
        "actual": "Formatted message time indicators displayed as expected.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_067",
        "module": "AIChat",
        "name": "Verify copy message to clipboard button action",
        "preconditions": "AI support chat displays replies from companion.",
        "steps": [
            "1. Click the 'Copy' text button beside the latest message bubble",
            "2. Inspect clipboard text matches the response contents."
        ],
        "expected": "System clipboard contents update containing matching text.",
        "actual": "Text clipboard utility completed copies successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_068",
        "module": "AIChat",
        "name": "Verify typing indicator animation during generation",
        "preconditions": "AI chat message is sent.",
        "steps": [
            "1. Press send button on input text",
            "2. Observe presence of three pulsing dots indicator."
        ],
        "expected": "Three dots animation displays continuously until AI responds.",
        "actual": "Pulsing animation loading indicator rendered.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_069",
        "module": "AIChat",
        "name": "Verify API connection error recovery trigger",
        "preconditions": "Network disconnect simulated in gateway requests.",
        "steps": [
            "1. Send mood expression chat input",
            "2. Observe connection error alert with 'Retry' button",
            "3. Restore connection and click 'Retry'."
        ],
        "expected": "Shows error alert option; retry successfully pulls answer.",
        "actual": "Error handling and recovery logic verified successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_070",
        "module": "AIChat",
        "name": "Verify searching messages history keyword",
        "preconditions": "Chat logs contains dialogue.",
        "steps": [
            "1. Click 'Search Chat' button on menu header",
            "2. Type search keyword 'overwhelmed'",
            "3. Observe matching bubbles highlighted."
        ],
        "expected": "History viewport highlights message cards matches target word.",
        "actual": "Fuzzy highlighting match executed.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_071",
        "module": "AIChat",
        "name": "Verify scroll window auto-positioning on response",
        "preconditions": "Chat window is loaded with long dialogue threads.",
        "steps": [
            "1. Send a new message to companion AI",
            "2. Wait for response generation completion",
            "3. Verify scrollbar positions strictly to bottom."
        ],
        "expected": "Scroll viewport updates downward following message append.",
        "actual": "Auto-scroll animation positioned at bottom view.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_072",
        "module": "MoodJournal",
        "name": "Verify journal text character counter dynamic limits",
        "preconditions": "Journal editor is open.",
        "steps": [
            "1. Input reflection text paragraph into text area",
            "2. Observe character indicator updates below input box",
            "3. Try typing past character limit (8000) and verify blocks."
        ],
        "expected": "Count increment matches input length; rejects typing past 8000.",
        "actual": "Limit block and character counter verified.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_073",
        "module": "MoodJournal",
        "name": "Verify editing saved journal reflection text",
        "preconditions": "A journal entry exists in history timeline.",
        "steps": [
            "1. Click 'Edit reflection' icon on first entry",
            "2. Modify text: 'Updated reflection note.'",
            "3. Click 'Update' button"
        ],
        "expected": "Entry updates database records; card contents refresh on timeline.",
        "actual": "Record modified successfully and timeline re-rendered.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_074",
        "module": "MoodJournal",
        "name": "Verify journal search bar fuzzy matching",
        "preconditions": "Timeline lists multiple journal reflections.",
        "steps": [
            "1. Input partial match 'cod' in journal search",
            "2. Observe that entry containing 'coding session' remains visible."
        ],
        "expected": "Timeline updates dynamically listing matching entries only.",
        "actual": "Fuzzy criteria matching verified on list index.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_075",
        "module": "MoodJournal",
        "name": "Verify journal tag-based filter toggle",
        "preconditions": "Timeline lists entries with mixed tags ('Proud', 'Sad').",
        "steps": [
            "1. Click filter button and select 'Proud' filter option",
            "2. Check if only proud reflections populate view."
        ],
        "expected": "Entries list filters matching category criteria.",
        "actual": "Filtered cards correctly to Proud tag entries.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_076",
        "module": "MoodJournal",
        "name": "Verify rich-text editor bold format button",
        "preconditions": "Journal editor is open.",
        "steps": [
            "1. Highlight written journal word text",
            "2. Click bold format icon (B)",
            "3. Confirm markdown wrap indicators ** are added."
        ],
        "expected": "Markdown text wrap adds bold formatting syntax around selections.",
        "actual": "Text selection bolding tool applied syntax correctly.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_077",
        "module": "MoodJournal",
        "name": "Verify draft auto-saving function in editor",
        "preconditions": "Journal editor is open.",
        "steps": [
            "1. Type draft text 'Temporary draft notes'",
            "2. Close journal page tab, and reopen page view",
            "3. Check if draft text restoring matches."
        ],
        "expected": "Draft text is cached inside localStorage and restores on reload.",
        "actual": "Draft restored successfully on editor load.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_078",
        "module": "Analytics",
        "name": "Verify custom analytics date range selection picker",
        "preconditions": "User is viewing Analytics view page.",
        "steps": [
            "1. Click active calendar button selector",
            "2. Choose start date 7 days ago and end date today",
            "3. Click 'Apply Range'"
        ],
        "expected": "Chart data and averages recalculate matching dates range filter.",
        "actual": "Date range applied, graphs compiled data correctly.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_079",
        "module": "Analytics",
        "name": "Verify mood trend chart line hover coordinates tooltip",
        "preconditions": "User trends charts are populated.",
        "steps": [
            "1. Hover cursor coordinate on trend graph chart line nodes",
            "2. Verify dynamic tooltip popover is rendered showing date and intensity value."
        ],
        "expected": "Tooltip displays matching coordinates values on graph hover.",
        "actual": "Graph tooltips coordinate rendering verified.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_080",
        "module": "Analytics",
        "name": "Verify CSV logs data export action",
        "preconditions": "User has logged mood data records.",
        "steps": [
            "1. Click the 'Export Logs as CSV' button icon",
            "2. Verify mock download callback is triggered."
        ],
        "expected": "CSV file binary structure gets compiled containing logged entries list.",
        "actual": "CSV document downloaded successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_081",
        "module": "Analytics",
        "name": "Verify analytics sleep hours correlation trend chart",
        "preconditions": "Sleep data averages are recorded.",
        "steps": [
            "1. Toggle checkbox 'Show Sleep Correlation'",
            "2. Inspect overlapping line rendering on main graph views."
        ],
        "expected": "A secondary colored line overlays indicating physical hours data trends.",
        "actual": "Overlay trend rendering executed successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_082",
        "module": "Analytics",
        "name": "Verify weekly AI diagnostics analysis modal",
        "preconditions": "At least 3 mood logs saved this week.",
        "steps": [
            "1. Click 'Generate Weekly Diagnostic Report' action",
            "2. Inspect risk percentage dials for Burnout, Anxiety, and Fatigue."
        ],
        "expected": "AI processes criteria scoring, showing burnout and anxiety risk gauges.",
        "actual": "Risk metrics diagnostic dials rendered accurately.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_083",
        "module": "Meditation",
        "name": "Verify meditation ambient music toggle selector",
        "preconditions": "Breathing Guided session view is open.",
        "steps": [
            "1. Click 'Ambient Sound' toggle dropdown menu",
            "2. Select sound track item 'Soft Forest Rain'",
            "3. Confirm icon indicator toggles sound play."
        ],
        "expected": "Sound indicator changes, playing rain audio simulator in backend.",
        "actual": "Rain theme track played successfully in media player.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_084",
        "module": "Meditation",
        "name": "Verify breathing helper animation scaling matches text directions",
        "preconditions": "Guided breathing timer starts.",
        "steps": [
            "1. Start session, wait for label 'Inhale'",
            "2. Verify circular element scales larger",
            "3. Wait for label 'Exhale', verify element scales smaller."
        ],
        "expected": "Circle visual scaling transitions coordinate with text prompts.",
        "actual": "Breathing circle transform scale matched text state updates.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_085",
        "module": "Meditation",
        "name": "Verify meditation session feedback checklist prompt",
        "preconditions": "Session timer runs out completely hitting 0s.",
        "steps": [
            "1. Observe completion popup rendering on session end",
            "2. Click checklist button 'I feel calmer now'",
            "3. Confirm dashboard check-in gets appended."
        ],
        "expected": "Feedback buttons click updates checklist values and user XP details.",
        "actual": "Calmer check-in confirmed, user XP milestone awarded.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_086",
        "module": "Meditation",
        "name": "Verify session cancel option resets view",
        "preconditions": "Breathing session is running active.",
        "steps": [
            "1. Click the 'Cancel Session' reset button icon",
            "2. Confirm confirmation warning dialogue accept",
            "3. Verify timer resets back to default value."
        ],
        "expected": "Current timer terminates, resetting interface state cleanly.",
        "actual": "Session aborted, view restored to setup default options.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_087",
        "module": "Meditation",
        "name": "Verify custom duration manual input bounds",
        "preconditions": "Breathing Guide is open.",
        "steps": [
            "1. Click 'Custom Minutes' selection tab link",
            "2. Enter value '90' minutes and click apply",
            "3. Observe validation warning requiring range 1-20."
        ],
        "expected": "Input blocks values exceeding 20 minutes warning user.",
        "actual": "Input bounds validator caught out-of-range value.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_088",
        "module": "CommunityPlaza",
        "name": "Verify search filter on affirmations plaza feed",
        "preconditions": "Plaza page feed contains community cards.",
        "steps": [
            "1. Locate community plaza search input box",
            "2. Type search term 'focus'",
            "3. Confirm only affirmations matching word show."
        ],
        "expected": "Card feed filters listing to entries containing search query term.",
        "actual": "Plaza lists filtered cards matching query keyword.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_089",
        "module": "CommunityPlaza",
        "name": "Verify reporting inappropriate affirmation card flow",
        "preconditions": "Community cards are visible in feed.",
        "steps": [
            "1. Choose target post card",
            "2. Click the Flag icon (Report Content)",
            "3. Select reason 'Inappropriate' and click Send"
        ],
        "expected": "Reports content in backend; hides card from user view.",
        "actual": "Report action succeeded, post card removed from view feeds.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_090",
        "module": "CommunityPlaza",
        "name": "Verify feed pagination scrolling loader",
        "preconditions": "Database contains more than 10 plaza affirmation records.",
        "steps": [
            "1. Scroll to the bottom of the plaza view",
            "2. Observe 'Loading more posts' progress bar spinner",
            "3. Verify extra cards append."
        ],
        "expected": "Loads next posts chunk from database and appends to feed.",
        "actual": "Pagination scroll triggered load of extra records successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_091",
        "module": "CommunityPlaza",
        "name": "Verify user liking own affirmation restriction",
        "preconditions": "User has published community affirmation card.",
        "steps": [
            "1. Locate card published by current user ('Mobile User')",
            "2. Click support heart icon button on own card",
            "3. Confirm support count does not increase."
        ],
        "expected": "Interaction is blocked or heart icon is disabled showing user message.",
        "actual": "Support toggle blocked for author's own cards.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_092",
        "module": "CommunityPlaza",
        "name": "Verify community card card layouts custom gradients options",
        "preconditions": "User is writing affirmation card draft.",
        "steps": [
            "1. Open Affirmations Composer box",
            "2. Click green-to-blue gradient thumbnail selector button",
            "3. Verify composer preview box shifts background classes."
        ],
        "expected": "Composer card preview background classes update matching selection.",
        "actual": "Dynamic preview theme gradient class matched toggle.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_093",
        "module": "WellnessScore",
        "name": "Verify categories scoring criteria breakdown dialog",
        "preconditions": "Wellness Core page is open.",
        "steps": [
            "1. Hover mouse pointer on 'Mindfulness Frequency' rating card info",
            "2. Verify tooltip displays detailing math weights used."
        ],
        "expected": "Hover popup info lists evaluation criteria details.",
        "actual": "Criteria breakdown information popup verified.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_094",
        "module": "WellnessScore",
        "name": "Verify PDF wellness scorecard download action",
        "preconditions": "Wellness page loaded.",
        "steps": [
            "1. Click the 'Download Wellness Scorecard PDF' button",
            "2. Verify simulator downloads pdf formatted data."
        ],
        "expected": "Downloads PDF file containing diagnostics ratings summary details.",
        "actual": "PDF scorecard downloaded successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_095",
        "module": "WellnessScore",
        "name": "Verify levels calculation XP indicator",
        "preconditions": "User profile XP has changed.",
        "steps": [
            "1. Check XP indicator bar below main grade summary dial",
            "2. Confirm level count updates when XP reaches 100."
        ],
        "expected": "Progress bar fill matches XP percentage; increments level dynamically.",
        "actual": "Level tracker and XP indicator values match records.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_096",
        "module": "Notifications",
        "name": "Verify 'Clear All Notifications' button validation",
        "preconditions": "User is on the Notifications feed page.",
        "steps": [
            "1. Confirm clear button button is active",
            "2. Click the 'Clear All' trash icon button",
            "3. Verify notification list changes to empty state."
        ],
        "expected": "Clear action deletes notifications list from database and screen.",
        "actual": "Cleared all user notifications successfully.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_097",
        "module": "Notifications",
        "name": "Verify filters unread list rows display",
        "preconditions": "Notifications feed has mixed read and unread records.",
        "steps": [
            "1. Click 'Show Unread Only' toggle switch checkbox",
            "2. Confirm read items disappear from layout lists."
        ],
        "expected": "View filters rows, displaying unread entries matches criteria.",
        "actual": "Display toggled listing unread rows only.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_098",
        "module": "Notifications",
        "name": "Verify permission prompt for push updates modal",
        "preconditions": "User logged in for the first session.",
        "steps": [
            "1. Load dashboard view, wait 5 seconds",
            "2. Verify mock web push notification popup prompts user accept."
        ],
        "expected": "System displays popover requesting subscription permissions.",
        "actual": "Web Push subscriber dialog popped up.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_099",
        "module": "ProfileSettings",
        "name": "Verify profile name modification changes",
        "preconditions": "User is on the Profile page.",
        "steps": [
            "1. Click 'Edit Display Name' text icon input",
            "2. Modify string to 'Selenium Tester New'",
            "3. Click 'Save Updates' button"
        ],
        "expected": "Profile settings update; user header displayName displays new name.",
        "actual": "Display name successfully modified and header verified.",
        "status": "Pass"
    },
    {
        "id": "TS_SEL_100",
        "module": "ProfileSettings",
        "name": "Verify change password inputs validation criteria",
        "preconditions": "User is on the Profile & Security settings.",
        "steps": [
            "1. Expand security section and fill 'Current Password' with wrong password",
            "2. Input new password in 'New Password' input field",
            "3. Click 'Save Password' and check warning dialog."
        ],
        "expected": "Displays error validation 'Current password does not match database record'.",
        "actual": "Validator blocked change password and displayed mismatch error.",
        "status": "Pass"
    }
]
