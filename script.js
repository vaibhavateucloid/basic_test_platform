// ===== CONFIGURATION =====
// API Configuration - dynamically set based on current host
const API_BASE_URL = `http://${window.location.hostname}:8000`;

// Developer Mode - Set to true to disable anti-cheating restrictions
const DEV_MODE = true;  // Set to false for production

// MCQ Questions Data
const mcqQuestions = [
    {
        id: 1,
        question: "What is the time complexity of binary search in a sorted array?",
        options: [
            "O(n)",
            "O(log n)",
            "O(n log n)",
            "O(1)"
        ],
        correct: 1
    },
    {
        id: 2,
        question: "Which layer of the OSI model is responsible for end-to-end communication and error-free delivery?",
        options: [
            "Network Layer",
            "Transport Layer",
            "Data Link Layer",
            "Session Layer"
        ],
        correct: 1
    },
    {
        id: 3,
        question: "In a relational database, what does ACID stand for?",
        options: [
            "Atomicity, Consistency, Isolation, Durability",
            "Authentication, Confidentiality, Integrity, Delivery",
            "Association, Computation, Integration, Distribution",
            "Access, Control, Identity, Data"
        ],
        correct: 0
    },
    {
        id: 4,
        question: "Which scheduling algorithm can cause starvation?",
        options: [
            "Round Robin",
            "First Come First Serve (FCFS)",
            "Priority Scheduling",
            "Shortest Job First (SJF)"
        ],
        correct: 2
    },
    {
        id: 5,
        question: "What is the default subnet mask for a Class C IP address?",
        options: [
            "255.0.0.0",
            "255.255.0.0",
            "255.255.255.0",
            "255.255.255.255"
        ],
        correct: 2
    },
    {
        id: 6,
        question: "Which data structure uses LIFO (Last In First Out) principle?",
        options: [
            "Queue",
            "Stack",
            "Array",
            "Linked List"
        ],
        correct: 1
    },
    {
        id: 7,
        question: "What does DNS stand for in networking?",
        options: [
            "Dynamic Network System",
            "Domain Name System",
            "Data Network Service",
            "Digital Naming Standard"
        ],
        correct: 1
    },
    {
        id: 8,
        question: "In operating systems, what is a deadlock?",
        options: [
            "When a process terminates unexpectedly",
            "When two or more processes wait indefinitely for resources held by each other",
            "When the CPU utilization reaches 100%",
            "When memory is full"
        ],
        correct: 1
    },
    {
        id: 9,
        question: "Which SQL command is used to remove a table from a database?",
        options: [
            "DELETE TABLE",
            "REMOVE TABLE",
            "DROP TABLE",
            "CLEAR TABLE"
        ],
        correct: 2
    },
    {
        id: 10,
        question: "What port number does HTTP use by default?",
        options: [
            "21",
            "22",
            "80",
            "443"
        ],
        correct: 2
    }
];

// SQL Database now runs in MySQL Docker container via backend API

// SQL Answers
const sqlAnswers = {
    1: "23:47",
    2: "Charlie Davis",
    3: "customers, financial_records, salary_data",
    4: "Yes",
    5: "185.220.101.45"
};

// Store user responses
let userResponses = {
    mcq: {},
    python: {},
    sql: {},
    sqlQueries: {}  // Store SQL query editor contents
};

// ===== SESSION MANAGEMENT =====
let currentSession = null;
let sessionId = null;
let timerInterval = null;

// Extract session ID from URL
function getSessionIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('session');
}

// Initialize session on page load
async function initializeSession() {
    sessionId = getSessionIdFromURL();

    if (!sessionId) {
        alert('No session found. Redirecting to registration page...');
        window.location.href = 'landing.html';
        return;
    }

    try {
        // Fetch session info
        const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}`);

        if (!response.ok) {
            throw new Error('Invalid session');
        }

        const result = await response.json();
        currentSession = result.session;

        // Check session state
        if (currentSession.state === 'submitted') {
            alert('This assessment has already been submitted.');
            showSubmittedMessage();
            return;
        }

        if (currentSession.is_expired) {
            alert('This session has expired.');
            return;
        }

        // Display candidate name
        document.querySelector('.container h1').textContent = `Technical Assessment - ${currentSession.candidate_name}`;

        // Mark session as in_progress if not already
        if (currentSession.state === 'not_started') {
            await fetch(`${API_BASE_URL}/api/session/${sessionId}/start`, {
                method: 'POST'
            });
            currentSession.state = 'in_progress';
        }

        // Start timer
        startTimer(currentSession.remaining_seconds);

        // Restore progress if any
        await restoreProgress();

        // Start auto-save
        startAutoSave();

    } catch (error) {
        console.error('Session initialization error:', error);
        alert('Failed to load session. Please check your link or contact support.');
        window.location.href = 'landing.html';
    }
}

// Start countdown timer
function startTimer(remainingSeconds) {
    updateTimerDisplay(remainingSeconds);

    timerInterval = setInterval(() => {
        remainingSeconds--;

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            handleTimeExpired();
        } else {
            updateTimerDisplay(remainingSeconds);

            // Warning at 10 minutes
            if (remainingSeconds === 600 && !DEV_MODE) {
                alert('⚠️ 10 minutes remaining!');
            }
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Update or create timer element
    let timerElement = document.getElementById('exam-timer');
    if (!timerElement) {
        timerElement = document.createElement('div');
        timerElement.id = 'exam-timer';
        timerElement.className = 'exam-timer';
        document.body.appendChild(timerElement);
    }

    timerElement.innerHTML = `
        <div class="timer-label">Time Remaining</div>
        <div class="timer-value">${timeString}</div>
    `;

    // Add warning color when < 10 minutes
    if (seconds < 600) {
        timerElement.classList.add('timer-warning');
    }
}

// Handle time expired
function handleTimeExpired() {
    alert('⏰ Time is up! Your assessment will be submitted automatically.');
    submitAssessment(); // Auto-submit
}

// Show submitted message
function showSubmittedMessage() {
    document.querySelector('.container').innerHTML = `
        <div style="text-align: center; padding: 50px;">
            <h1>Assessment Already Submitted</h1>
            <p>This assessment has already been completed and submitted.</p>
            <p>If you believe this is an error, please contact support.</p>
        </div>
    `;
}

// ===== AUTO-SAVE FUNCTIONALITY =====
let autoSaveInterval = null;
let lastSaveTime = null;

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Save to localStorage (immediate, debounced)
const autoSaveToLocal = debounce(() => {
    if (!sessionId) return;

    const progressData = {
        mcq: userResponses.mcq,
        python: userResponses.python,
        sql: userResponses.sql,
        sqlQueries: userResponses.sqlQueries,
        timestamp: new Date().toISOString()
    };

    try {
        localStorage.setItem(`session_${sessionId}_progress`, JSON.stringify(progressData));
        console.log('💾 Auto-save to localStorage:', {
            mcq: Object.keys(progressData.mcq).length + ' answers',
            python: Object.keys(progressData.python).length + ' problems',
            sql: Object.keys(progressData.sql).length + ' answers',
            sqlQueries: Object.keys(progressData.sqlQueries).length + ' queries',
            timestamp: progressData.timestamp
        });
    } catch (error) {
        console.error('❌ Failed to save to localStorage:', error);
    }
}, 500); // 500ms debounce

// Save to backend (periodic)
async function saveProgressToBackend() {
    if (!sessionId) return;

    try {
        showAutoSaveIndicator('Saving...');

        const payload = {
            mcq: userResponses.mcq,
            python: userResponses.python,
            sql: userResponses.sql,
            sqlQueries: userResponses.sqlQueries
        };

        console.log('📡 Auto-save to backend:', {
            mcq: Object.keys(payload.mcq).length + ' answers',
            python: Object.keys(payload.python).length + ' problems',
            sql: Object.keys(payload.sql).length + ' answers',
            sqlQueries: Object.keys(payload.sqlQueries).length + ' queries'
        });

        const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/save-progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            lastSaveTime = result.saved_at;
            console.log('✅ Progress saved to server at:', result.saved_at);
            showAutoSaveIndicator('Saved');
        } else {
            console.error('❌ Failed to save progress - Status:', response.status, response.statusText);
            showAutoSaveIndicator('Failed');
        }
    } catch (error) {
        console.error('❌ Auto-save error:', error);
        showAutoSaveIndicator('Failed');
    }
}

// Restore progress from backend or localStorage
async function restoreProgress() {
    if (!sessionId) {
        console.log('⚠️ No sessionId - skipping progress restoration');
        return;
    }

    console.log('🔄 Starting progress restoration for session:', sessionId);

    let backendProgress = null;
    let localProgress = null;

    // 1. Try backend first
    try {
        console.log('📡 Fetching progress from backend...');
        const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/progress`);
        if (response.ok) {
            const result = await response.json();
            if (result.progress) {
                backendProgress = result.progress;
                console.log('✅ Backend progress loaded:', {
                    mcq: Object.keys(backendProgress.mcq || {}).length + ' answers',
                    python: Object.keys(backendProgress.python || {}).length + ' problems',
                    sql: Object.keys(backendProgress.sql || {}).length + ' answers',
                    sqlQueries: Object.keys(backendProgress.sqlQueries || {}).length + ' queries',
                    timestamp: backendProgress.saved_at
                });
            } else {
                console.log('ℹ️ No progress found in backend');
            }
        } else {
            console.log('⚠️ Backend request failed with status:', response.status);
        }
    } catch (error) {
        console.error('❌ Failed to load backend progress:', error);
    }

    // 2. Load from localStorage
    try {
        console.log('💾 Loading progress from localStorage...');
        const localData = localStorage.getItem(`session_${sessionId}_progress`);
        if (localData) {
            localProgress = JSON.parse(localData);
            console.log('✅ localStorage progress loaded:', {
                mcq: Object.keys(localProgress.mcq || {}).length + ' answers',
                python: Object.keys(localProgress.python || {}).length + ' problems',
                sql: Object.keys(localProgress.sql || {}).length + ' answers',
                sqlQueries: Object.keys(localProgress.sqlQueries || {}).length + ' queries',
                timestamp: localProgress.timestamp
            });
        } else {
            console.log('ℹ️ No progress found in localStorage');
        }
    } catch (error) {
        console.error('❌ Failed to load localStorage progress:', error);
    }

    // 3. Select most recent
    const progressToRestore = selectMostRecent(backendProgress, localProgress);

    if (!progressToRestore) {
        console.log('ℹ️ No progress to restore - starting fresh');
        return;
    }

    const source = (backendProgress && progressToRestore === backendProgress) ? 'backend' : 'localStorage';
    console.log(`📦 Using progress from: ${source}`);

    // 4. Restore MCQ answers
    if (progressToRestore.mcq && Object.keys(progressToRestore.mcq).length > 0) {
        console.log('📝 Restoring MCQ answers...');
        let mcqRestored = 0;
        let mcqFailed = 0;

        Object.entries(progressToRestore.mcq).forEach(([qId, answer]) => {
            userResponses.mcq[parseInt(qId)] = answer;
            const radio = document.querySelector(`input[name="question${qId}"][value="${answer}"]`);
            if (radio) {
                radio.checked = true;
                mcqRestored++;
                console.log(`  ✅ MCQ ${qId}: ${answer}`);
            } else {
                mcqFailed++;
                console.warn(`  ⚠️ MCQ ${qId}: Radio button not found for value "${answer}"`);
            }
        });

        console.log(`✅ MCQ Restoration: ${mcqRestored} restored, ${mcqFailed} failed`);
    } else {
        console.log('ℹ️ No MCQ answers to restore');
    }

    // 5. Restore Python code
    if (progressToRestore.python && Object.keys(progressToRestore.python).length > 0) {
        console.log('💻 Restoring Python code...');
        let pythonRestored = 0;
        let pythonFailed = 0;

        Object.entries(progressToRestore.python).forEach(([problemId, code]) => {
            userResponses.python[problemId] = code;
            const editorNum = problemId.replace('problem', '');
            const editor = document.getElementById(`python-code-${editorNum}`);
            if (editor) {
                editor.value = code;
                pythonRestored++;
                console.log(`  ✅ Python ${problemId}: ${code.length} characters`);
            } else {
                pythonFailed++;
                console.warn(`  ⚠️ Python ${problemId}: Editor not found (python-code-${editorNum})`);
            }
        });

        console.log(`✅ Python Restoration: ${pythonRestored} restored, ${pythonFailed} failed`);
    } else {
        console.log('ℹ️ No Python code to restore');
    }

    // 6. Restore SQL answers
    if (progressToRestore.sql && Object.keys(progressToRestore.sql).length > 0) {
        console.log('🗃️ Restoring SQL queries...');
        let sqlRestored = 0;
        let sqlFailed = 0;

        Object.entries(progressToRestore.sql).forEach(([qId, answer]) => {
            userResponses.sql[parseInt(qId)] = answer;
            const input = document.getElementById(`sql-answer-${qId}`);
            if (input) {
                input.value = answer;
                sqlRestored++;
                console.log(`  ✅ SQL ${qId}: ${answer.length} characters`);
            } else {
                sqlFailed++;
                console.warn(`  ⚠️ SQL ${qId}: Input not found (sql-answer-${qId})`);
            }
        });

        console.log(`✅ SQL Answers Restoration: ${sqlRestored} restored, ${sqlFailed} failed`);
    } else {
        console.log('ℹ️ No SQL answers to restore');
    }

    // 7. Restore SQL query editors
    if (progressToRestore.sqlQueries && Object.keys(progressToRestore.sqlQueries).length > 0) {
        console.log('🔍 Restoring SQL query editors...');
        let sqlQueriesRestored = 0;
        let sqlQueriesFailed = 0;

        Object.entries(progressToRestore.sqlQueries).forEach(([queryId, query]) => {
            userResponses.sqlQueries[parseInt(queryId)] = query;
            const queryEditor = document.getElementById(`sql-query-${queryId}`);
            if (queryEditor) {
                queryEditor.value = query;
                sqlQueriesRestored++;
                console.log(`  ✅ SQL query ${queryId}: ${query.length} characters`);
            } else {
                sqlQueriesFailed++;
                console.warn(`  ⚠️ SQL query ${queryId}: Editor not found (sql-query-${queryId})`);
            }
        });

        console.log(`✅ SQL Query Editors Restoration: ${sqlQueriesRestored} restored, ${sqlQueriesFailed} failed`);
    } else {
        console.log('ℹ️ No SQL query editors to restore');
    }

    // 8. Show notification
    console.log('🎉 Progress restoration complete!');
    showNotification(`Progress restored from ${formatTimestamp(progressToRestore.timestamp || progressToRestore.saved_at)}`);
}

// Select most recent progress
function selectMostRecent(backend, local) {
    if (!backend && !local) return null;
    if (!backend) return local;
    if (!local) return backend;

    const backendTime = new Date(backend.saved_at || backend.timestamp);
    const localTime = new Date(local.timestamp);

    return backendTime > localTime ? backend : local;
}

// Format timestamp
function formatTimestamp(isoString) {
    if (!isoString) return 'unknown time';
    const date = new Date(isoString);
    return date.toLocaleTimeString();
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Show auto-save indicator
function showAutoSaveIndicator(status) {
    let indicator = document.getElementById('autosave-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'autosave-indicator';
        document.body.appendChild(indicator);
    }

    indicator.textContent = status;
    indicator.className = `autosave-indicator ${status.toLowerCase()}`;

    if (status === 'Saved') {
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    } else {
        indicator.style.opacity = '1';
    }
}

// Start auto-save
function startAutoSave() {
    // Save to localStorage on input
    document.addEventListener('input', autoSaveToLocal);
    document.addEventListener('change', autoSaveToLocal);

    // Sync to backend every 10 seconds (reduced from 30s for better reliability)
    autoSaveInterval = setInterval(() => {
        saveProgressToBackend();
    }, 10000); // 10 seconds

    // Save on page unload
    window.addEventListener('beforeunload', () => {
        // Use sendBeacon for guaranteed send
        const data = JSON.stringify({
            mcq: userResponses.mcq,
            python: userResponses.python,
            sql: userResponses.sql,
            sqlQueries: userResponses.sqlQueries
        });
        navigator.sendBeacon(`${API_BASE_URL}/api/session/${sessionId}/save-progress`, data);
        console.log('📤 Sending data via beacon on page unload');
    });
}

// Stop auto-save
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

// ===== REAL-TIME RESPONSE CAPTURE =====
// Initialize event listeners to capture Python and SQL responses as user types
function initializeRealtimeCapture() {
    // Capture MCQ selections in real-time
    console.log('🔍 Setting up MCQ real-time capture...');
    let mcqRadiosFound = 0;

    // Attach change listeners to all MCQ radio buttons
    mcqQuestions.forEach(q => {
        const radios = document.querySelectorAll(`input[name="question${q.id}"]`);
        if (radios.length > 0) {
            mcqRadiosFound += radios.length;
            radios.forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.checked) {
                        userResponses.mcq[q.id] = parseInt(this.value);
                        console.log(`📝 MCQ question ${q.id} answered: option ${this.value}`);
                    }
                });
            });
        }
    });
    console.log(`✅ MCQ radio buttons found: ${mcqRadiosFound}/${mcqQuestions.length * 4}`);

    // Capture Python code in real-time
    // Python problems: python-code-1, python-code-2
    const pythonEditor1 = document.getElementById('python-code-1');
    const pythonEditor2 = document.getElementById('python-code-2');

    if (pythonEditor1) {
        pythonEditor1.addEventListener('input', function() {
            userResponses.python['problem1'] = this.value;
            console.log('📝 Python problem1 updated:', this.value.length, 'characters');
        });
    }

    if (pythonEditor2) {
        pythonEditor2.addEventListener('input', function() {
            userResponses.python['problem2'] = this.value;
            console.log('📝 Python problem2 updated:', this.value.length, 'characters');
        });
    }

    // Capture SQL Query Editors in real-time
    // SQL query editors: sql-query-1 through sql-query-5
    console.log('🔍 Checking for SQL query editor fields...');
    let sqlQueryEditorsFound = 0;
    for (let i = 1; i <= 5; i++) {
        const sqlQueryEditor = document.getElementById(`sql-query-${i}`);
        console.log(`  Looking for sql-query-${i}:`, sqlQueryEditor ? 'FOUND' : 'NOT FOUND');
        if (sqlQueryEditor) {
            sqlQueryEditorsFound++;
            sqlQueryEditor.addEventListener('input', function() {
                userResponses.sqlQueries[i] = this.value;
                console.log(`📝 SQL query ${i} updated:`, this.value.length, 'characters');
            });
        }
    }
    console.log(`✅ SQL query editors found: ${sqlQueryEditorsFound}/5`);

    // Capture SQL answers in real-time
    // SQL questions: sql-answer-1 through sql-answer-5
    console.log('🔍 Checking for SQL input fields...');
    let sqlInputsFound = 0;

    // Helper function to attach listener with proper closure
    function attachSQLListener(inputElement, questionNumber) {
        console.log(`  🔧 Attaching listener to SQL answer ${questionNumber}`);
        const handler = function(event) {
            console.log(`📝 [EVENT FIRED] SQL answer ${questionNumber} - Event type: ${event.type}, Value: "${this.value}" (${this.value.length} characters)`);
            userResponses.sql[questionNumber] = this.value;
        };
        inputElement.addEventListener('input', handler);
        inputElement.addEventListener('change', handler);  // Also listen to change events
        console.log(`  ✅ Listener attached to SQL answer ${questionNumber}`);
    }

    for (let i = 1; i <= 5; i++) {
        const sqlInput = document.getElementById(`sql-answer-${i}`);
        console.log(`  Looking for sql-answer-${i}:`, sqlInput ? 'FOUND' : 'NOT FOUND');
        if (sqlInput) {
            sqlInputsFound++;
            // Log the element details
            console.log(`    Element details:`, {
                id: sqlInput.id,
                type: sqlInput.type,
                disabled: sqlInput.disabled,
                readOnly: sqlInput.readOnly,
                value: sqlInput.value
            });
            attachSQLListener(sqlInput, i);
        }
    }
    console.log(`✅ SQL inputs found: ${sqlInputsFound}/5`);

    // Fallback: Use event delegation at document level for MCQ, SQL inputs and query editors
    document.addEventListener('input', function(event) {
        const target = event.target;
        if (target && target.id) {
            // Handle SQL answer inputs
            if (target.id.startsWith('sql-answer-')) {
                const questionNum = parseInt(target.id.replace('sql-answer-', ''));
                if (questionNum >= 1 && questionNum <= 5) {
                    console.log(`📝 [FALLBACK DELEGATION] SQL answer ${questionNum} updated: "${target.value}" (${target.value.length} characters)`);
                    userResponses.sql[questionNum] = target.value;
                }
            }
            // Handle SQL query editors
            else if (target.id.startsWith('sql-query-')) {
                const queryNum = parseInt(target.id.replace('sql-query-', ''));
                if (queryNum >= 1 && queryNum <= 5) {
                    console.log(`📝 [FALLBACK DELEGATION] SQL query ${queryNum} updated: (${target.value.length} characters)`);
                    userResponses.sqlQueries[queryNum] = target.value;
                }
            }
        }
    }, true); // Use capture phase

    // Fallback: Use event delegation for MCQ radio buttons (change event)
    document.addEventListener('change', function(event) {
        const target = event.target;
        if (target && target.type === 'radio' && target.name && target.name.startsWith('question')) {
            const questionId = parseInt(target.name.replace('question', ''));
            if (!isNaN(questionId) && target.checked) {
                console.log(`📝 [FALLBACK DELEGATION] MCQ question ${questionId} answered: option ${target.value}`);
                userResponses.mcq[questionId] = parseInt(target.value);
            }
        }
    }, true); // Use capture phase

    console.log('✅ Real-time response capture initialized (with delegation fallback)');
    console.log('📊 Current userResponses state:', {
        mcq: Object.keys(userResponses.mcq).length + ' answers',
        python: Object.keys(userResponses.python).length + ' problems',
        sql: Object.keys(userResponses.sql).length + ' answers',
        sqlQueries: Object.keys(userResponses.sqlQueries).length + ' queries'
    });
}

// Debug functions - accessible from browser console
window.debugResponses = function() {
    console.log('🔍 DEBUG: Current userResponses:');
    console.log('MCQ:', userResponses.mcq);
    console.log('Python:', userResponses.python);
    console.log('SQL Answers:', userResponses.sql);
    console.log('SQL Queries:', userResponses.sqlQueries);
    return userResponses;
};

window.testSQLInputs = function() {
    console.log('🧪 TESTING SQL INPUTS:');
    for (let i = 1; i <= 5; i++) {
        const input = document.getElementById(`sql-answer-${i}`);
        if (input) {
            console.log(`sql-answer-${i}:`, {
                exists: true,
                value: input.value,
                disabled: input.disabled,
                readOnly: input.readOnly,
                type: input.type,
                hasInputListener: 'Check if input event fires below...'
            });
            // Try to trigger input event manually
            input.value = 'TEST_' + i;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            console.log(`sql-answer-${i}: NOT FOUND`);
        }
    }
    console.log('After manual test, userResponses.sql:', userResponses.sql);
};

window.testMCQCapture = function() {
    console.log('🧪 TESTING MCQ CAPTURE:');
    console.log('Current MCQ responses:', userResponses.mcq);
    mcqQuestions.forEach(q => {
        const radios = document.querySelectorAll(`input[name="question${q.id}"]`);
        const checked = document.querySelector(`input[name="question${q.id}"]:checked`);
        console.log(`Question ${q.id}:`, {
            totalOptions: radios.length,
            selected: checked ? `Option ${checked.value}` : 'None',
            inMemory: userResponses.mcq[q.id] !== undefined ? `Option ${userResponses.mcq[q.id]}` : 'Not captured'
        });
    });
};

// ===== ANTI-CHEATING MEASURES =====
let tabSwitchCount = 0;
let warningShown = false;

// Conditionally apply anti-cheating restrictions based on DEV_MODE
if (!DEV_MODE) {
    // Disable right-click
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        alert('⚠️ Right-click is disabled during the assessment.');
        return false;
    });

    // Disable copy, cut, paste
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        alert('⚠️ Copying is disabled during the assessment.');
        return false;
    });

    document.addEventListener('cut', function(e) {
        e.preventDefault();
        alert('⚠️ Cutting is disabled during the assessment.');
        return false;
    });
}

// Update tab switch count on server
async function updateTabSwitchCount() {
    if (sessionId) {
        try {
            await fetch(`${API_BASE_URL}/api/session/${sessionId}/update-tab-switches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: tabSwitchCount })
            });
        } catch (error) {
            console.error('Failed to update tab switch count:', error);
        }
    }
}

// Detect tab switching / window blur (track count even in dev mode)
window.addEventListener('blur', function() {
    tabSwitchCount++;
    updateTabSwitchCount();
    if (!DEV_MODE && !warningShown) {
        alert('⚠️ WARNING: Tab switching detected!\n\nYou switched away from the assessment. This activity is being monitored.\n\nMultiple violations may result in automatic submission.');
        warningShown = true;
        setTimeout(() => { warningShown = false; }, 3000);
    }
    console.log(`Tab switch detected. Count: ${tabSwitchCount}`);
});

// Detect when user returns to tab
window.addEventListener('focus', function() {
    console.log('User returned to assessment tab');
});

// Detect visibility change (tab switch, minimize)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        tabSwitchCount++;
        updateTabSwitchCount();
        console.log(`Page hidden (tab switch/minimize). Count: ${tabSwitchCount}`);

        if (!DEV_MODE && !warningShown) {
            setTimeout(() => {
                alert('⚠️ WARNING: You switched tabs or minimized the window!\n\nThis behavior is being monitored. Continue with the assessment.');
            }, 100);
            warningShown = true;
            setTimeout(() => { warningShown = false; }, 3000);
        }
    } else {
        console.log('User returned to assessment');
    }
});

// Prevent opening DevTools (F12, Ctrl+Shift+I, etc.) - only in production
if (!DEV_MODE) {
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12') {
            e.preventDefault();
            alert('⚠️ Developer tools are disabled during the assessment.');
            return false;
        }

        // Ctrl+Shift+I (Inspect)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            alert('⚠️ Developer tools are disabled during the assessment.');
            return false;
        }

        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            alert('⚠️ Developer tools are disabled during the assessment.');
            return false;
        }

        // Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            alert('⚠️ Viewing source is disabled during the assessment.');
            return false;
        }

        // Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            alert('⚠️ Developer tools are disabled during the assessment.');
            return false;
        }
    });
}

// Warn before closing/refreshing the page - only in production
if (!DEV_MODE) {
    window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress may be lost.';
        return 'Are you sure you want to leave? Your progress may be lost.';
    });
}

// Initialize the assessment
window.onload = async function() {
    // Render MCQ questions FIRST so radio buttons exist for restoration
    renderMCQQuestions();

    // Initialize session (validates, starts timer, and restores progress)
    await initializeSession();

    initializeResizablePanes();
    initializeNavigation();

    // Initialize real-time response capture for Python and SQL
    initializeRealtimeCapture();

    // Add dev mode badge if in developer mode
    if (DEV_MODE) {
        addDevModeBadge();
    }

    // Show initial warning (only in production mode)
    if (!DEV_MODE) {
        setTimeout(() => {
            alert('📋 ASSESSMENT INSTRUCTIONS:\n\n' +
                  '✓ Do not switch tabs or minimize this window\n' +
                  '✓ Do not right-click or use developer tools\n' +
                  '✓ Do not copy or paste content\n' +
                  '✓ All suspicious activities are being monitored\n\n' +
                  'Click OK to begin the assessment.');
        }, 500);
    }
};

// Add developer mode badge
function addDevModeBadge() {
    const badge = document.createElement('div');
    badge.className = 'dev-mode-badge';
    badge.innerHTML = '🔧 DEV MODE';
    badge.title = 'Developer Mode Active - Anti-cheating restrictions disabled';
    document.body.appendChild(badge);
}

// Initialize free navigation between sections
function initializeNavigation() {
    // Make all progress steps clickable
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.style.cursor = 'pointer';
        step.addEventListener('click', function() {
            goToSection(index + 1);
        });
    });
}

// ===== RESIZABLE PANES FUNCTIONALITY =====

function initializeResizablePanes() {
    // Initialize all vertical dividers
    const verticalDividers = document.querySelectorAll('.vertical-divider');
    verticalDividers.forEach(divider => {
        initializeVerticalDivider(divider);
    });

    // Initialize all horizontal dividers
    const horizontalDividers = document.querySelectorAll('.horizontal-divider');
    horizontalDividers.forEach(divider => {
        initializeHorizontalDivider(divider);
    });
}

function initializeVerticalDivider(divider) {
    let isResizing = false;
    let container = null;
    let leftPane = null;
    let rightContainer = null;
    let startX = 0;
    let startLeftWidth = 0;

    divider.addEventListener('mousedown', function(e) {
        isResizing = true;
        const containerId = divider.getAttribute('data-container');
        container = document.getElementById(containerId);
        leftPane = container.querySelector('.left-pane');
        rightContainer = container.querySelector('.right-container');

        startX = e.clientX;
        startLeftWidth = leftPane.offsetWidth;

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;

        const diff = e.clientX - startX;
        const newLeftWidth = startLeftWidth + diff;
        const containerWidth = container.offsetWidth;

        // Set minimum and maximum widths (20% to 60% of container)
        const minWidth = containerWidth * 0.2;
        const maxWidth = containerWidth * 0.6;

        if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
            const leftPercent = (newLeftWidth / containerWidth) * 100;
            leftPane.style.flex = `0 0 ${leftPercent}%`;
        }
    });

    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // Save to localStorage
            if (container && leftPane) {
                const containerId = container.getAttribute('id');
                const leftPercent = (leftPane.offsetWidth / container.offsetWidth) * 100;
                localStorage.setItem(`${containerId}-left-width`, leftPercent);
            }
        }
    });
}

function initializeHorizontalDivider(divider) {
    let isResizing = false;
    let container = null;
    let topPane = null;
    let bottomPane = null;
    let rightContainer = null;
    let startY = 0;
    let startTopHeight = 0;

    divider.addEventListener('mousedown', function(e) {
        isResizing = true;
        const containerId = divider.getAttribute('data-container');
        container = document.getElementById(containerId);
        rightContainer = container.querySelector('.right-container');
        topPane = rightContainer.querySelector('.top-pane');
        bottomPane = rightContainer.querySelector('.bottom-pane');

        startY = e.clientY;
        startTopHeight = topPane.offsetHeight;

        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';

        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;

        const diff = e.clientY - startY;
        const newTopHeight = startTopHeight + diff;
        const containerHeight = rightContainer.offsetHeight;

        // Set minimum heights (20% to 80% of container)
        const minHeight = containerHeight * 0.2;
        const maxHeight = containerHeight * 0.8;

        if (newTopHeight >= minHeight && newTopHeight <= maxHeight) {
            const topPercent = (newTopHeight / containerHeight) * 100;
            const bottomPercent = 100 - topPercent;
            topPane.style.flex = `0 0 ${topPercent}%`;
            bottomPane.style.flex = `0 0 ${bottomPercent}%`;
        }
    });

    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // Save to localStorage
            if (container && topPane) {
                const containerId = container.getAttribute('id');
                const topPercent = (topPane.offsetHeight / rightContainer.offsetHeight) * 100;
                localStorage.setItem(`${containerId}-top-height`, topPercent);
            }
        }
    });
}

// Load saved pane sizes from localStorage
window.addEventListener('DOMContentLoaded', function() {
    // Restore left pane widths
    document.querySelectorAll('.three-pane-container').forEach(container => {
        const containerId = container.getAttribute('id');
        const savedLeftWidth = localStorage.getItem(`${containerId}-left-width`);
        const savedTopHeight = localStorage.getItem(`${containerId}-top-height`);

        const leftPane = container.querySelector('.left-pane');
        const topPane = container.querySelector('.top-pane');
        const bottomPane = container.querySelector('.bottom-pane');

        if (savedLeftWidth && leftPane) {
            leftPane.style.flex = `0 0 ${savedLeftWidth}%`;
        }

        if (savedTopHeight && topPane && bottomPane) {
            topPane.style.flex = `0 0 ${savedTopHeight}%`;
            bottomPane.style.flex = `0 0 ${100 - parseFloat(savedTopHeight)}%`;
        }
    });
});

// Render MCQ Questions
function renderMCQQuestions() {
    const container = document.getElementById('mcq-container');
    container.innerHTML = '';

    mcqQuestions.forEach((q, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.innerHTML = `
            <div class="question-text">${index + 1}. ${q.question}</div>
            <div class="options">
                ${q.options.map((option, optIndex) => `
                    <div class="option">
                        <input type="radio" id="q${q.id}_opt${optIndex}" name="question${q.id}" value="${optIndex}">
                        <label for="q${q.id}_opt${optIndex}">${option}</label>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(questionCard);
    });
}

// Submit MCQ and move to next section
function submitMCQ() {
    // Collect MCQ answers
    mcqQuestions.forEach(q => {
        const selected = document.querySelector(`input[name="question${q.id}"]:checked`);
        if (selected) {
            userResponses.mcq[q.id] = parseInt(selected.value);
        }
    });

    // Optional: Warn if not all questions answered, but allow proceeding
    if (Object.keys(userResponses.mcq).length < mcqQuestions.length) {
        const proceed = confirm('Some questions are unanswered. Do you want to proceed anyway?');
        if (!proceed) return;
    }

    goToSection(2);
}

// Python test cases configuration
const pythonTestCases = {
    1: [ // Two Sum problem
        {
            name: 'Test Case 1 (Visible)',
            test: 'print(twoSum([2, 7, 11, 15], 9))',
            expected: '[0, 1]',
            visible: true
        },
        {
            name: 'Test Case 2 (Hidden)',
            test: 'print(twoSum([3, 2, 4], 6))',
            expected: '[1, 2]',
            visible: false
        },
        {
            name: 'Test Case 3 (Hidden)',
            test: 'print(twoSum([3, 3], 6))',
            expected: '[0, 1]',
            visible: false
        }
    ],
    2: [ // Palindrome problem
        {
            name: 'Test Case 1 (Visible)',
            test: 'print(isPalindrome("A man a plan a canal Panama"))',
            expected: 'True',
            visible: true
        },
        {
            name: 'Test Case 2 (Hidden)',
            test: 'print(isPalindrome("race a car"))',
            expected: 'False',
            visible: false
        },
        {
            name: 'Test Case 3 (Hidden)',
            test: 'print(isPalindrome("hello"))',
            expected: 'False',
            visible: false
        }
    ]
};

// Run Python code with test cases
async function runPythonCode(problemNum) {
    const codeInput = document.getElementById(`python-code-${problemNum}`);
    const resultsDiv = document.getElementById(`test-results-${problemNum}`);
    const runButton = event.target;

    const code = codeInput.value.trim();

    if (!code) {
        resultsDiv.innerHTML = '<p class="placeholder-text" style="color: #f56565;">Please write some code first.</p>';
        return;
    }

    // Disable button and show loading
    runButton.disabled = true;
    runButton.textContent = '⏳ Running...';
    resultsDiv.innerHTML = '<p class="placeholder-text">Executing code and running test cases...</p>';

    try {
        // Call backend API with test cases
        const response = await fetch(`${API_BASE_URL}/api/execute-python`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                test_cases: pythonTestCases[problemNum]
            })
        });

        if (!response.ok) {
            throw new Error('Backend server error');
        }

        const result = await response.json();

        // Display results
        if (result.success && result.test_mode) {
            displayTestResults(resultsDiv, result);
        } else if (!result.success) {
            resultsDiv.innerHTML = `
                <div class="sql-result-info error">
                    <strong>✗ Error:</strong><br>
                    ${result.error || 'Unknown error'}
                </div>
            `;
        }

    } catch (error) {
        console.error('Error executing code:', error);
        resultsDiv.innerHTML = `
            <div class="sql-result-info error">
                <strong>✗ Connection Error:</strong><br>
                Could not connect to backend server. Make sure it's running on ${API_BASE_URL}
            </div>
        `;
    } finally {
        // Re-enable button
        runButton.disabled = false;
        runButton.textContent = '▶ Run Code';
    }
}

// Display test results with statistics
function displayTestResults(container, result) {
    let html = '';

    // Test statistics
    html += `
        <div class="test-stats">
            <div class="stat-item">
                <div class="stat-label">Total Tests</div>
                <div class="stat-value total">${result.total_tests}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Passed</div>
                <div class="stat-value passed">${result.passed}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Failed</div>
                <div class="stat-value failed">${result.failed}</div>
            </div>
        </div>
    `;

    // Individual test cases (only show visible ones with details)
    result.test_results.forEach((testCase, index) => {
        if (testCase.visible) {
            // Show full details for visible test case
            const statusClass = testCase.passed ? 'passed' : 'failed';
            const statusText = testCase.passed ? '✓ PASSED' : '✗ FAILED';

            html += `
                <div class="test-case ${statusClass}">
                    <div class="test-case-header">
                        <div class="test-case-name">${testCase.test_name}</div>
                        <div class="test-case-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="test-case-details">
                        <div><strong>Expected:</strong> ${testCase.expected}</div>
                        <div><strong>Got:</strong> ${testCase.actual || testCase.error || 'Error'}</div>
                    </div>
                </div>
            `;
        } else {
            // Show only pass/fail for hidden test cases
            const statusClass = testCase.passed ? 'passed' : 'failed';
            const statusText = testCase.passed ? '✓ PASSED' : '✗ FAILED';

            html += `
                <div class="test-case ${statusClass}">
                    <div class="test-case-header">
                        <div class="test-case-name">${testCase.test_name}</div>
                        <div class="test-case-status ${statusClass}">${statusText}</div>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

// Submit Python code
function submitPython() {
    const code1 = document.getElementById('python-code-1').value;
    const code2 = document.getElementById('python-code-2').value;

    // Save current code
    userResponses.python = {
        problem1: code1,
        problem2: code2
    };

    // Optional: Warn if no code written, but allow proceeding
    if (!code1.trim() || !code2.trim()) {
        const proceed = confirm('Some code is missing. Do you want to proceed anyway?');
        if (!proceed) return;
    }

    goToSection(3);
}

// Run SQL Query (calling backend API)
async function runSQLQuery(questionNum) {
    const queryInput = document.getElementById(`sql-query-${questionNum}`);
    const resultDiv = document.getElementById(`sql-result-${questionNum}`);
    const runButton = event.target;

    const query = queryInput.value.trim();

    if (!query) {
        resultDiv.innerHTML = '<p class="placeholder-text" style="color: #f56565;">Please enter a query.</p>';
        return;
    }

    // Disable button and show loading
    runButton.disabled = true;
    runButton.textContent = '⏳ Running...';
    resultDiv.innerHTML = '<p class="placeholder-text">Executing SQL query...</p>';

    try {
        // Call backend API
        const response = await fetch(`${API_BASE_URL}/api/execute-sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query
            })
        });

        if (!response.ok) {
            throw new Error('Backend server error');
        }

        const result = await response.json();

        // Display results
        if (result.success) {
            displaySQLResults(resultDiv, result);
        } else {
            resultDiv.innerHTML = `
                <div class="sql-result-info error">
                    <strong>✗ Error:</strong><br>
                    ${result.error || 'Unknown error'}
                </div>
            `;
        }

    } catch (error) {
        console.error('Error executing SQL:', error);
        resultDiv.innerHTML = `
            <div class="sql-result-info error">
                <strong>✗ Connection Error:</strong><br>
                Could not connect to backend server. Make sure it's running on ${API_BASE_URL}
            </div>
        `;
    } finally {
        // Re-enable button
        runButton.disabled = false;
        runButton.textContent = '▶ Run Query';
    }
}

// Display SQL results
function displaySQLResults(container, result) {
    let html = '';

    // Result info
    html += `
        <div class="sql-result-info">
            <strong>✓ Query executed successfully</strong><br>
            ${result.row_count} row(s) returned
        </div>
    `;

    // Results table
    if (result.results && result.results.length > 0) {
        const headers = Object.keys(result.results[0]);

        html += '<table>';
        html += '<thead><tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead><tbody>';

        result.results.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${row[header] !== null ? row[header] : 'NULL'}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
    } else {
        html += '<p class="placeholder-text">No results returned</p>';
    }

    container.innerHTML = html;
}

// Old SQL parser functions removed - now using MySQL backend

// Submit final assessment
function submitAssessment() {
    // Collect SQL answers
    for (let i = 1; i <= 5; i++) {
        const answer = document.getElementById(`sql-answer-${i}`).value.trim();
        userResponses.sql[i] = answer;
    }

    // Check if all SQL answers are provided
    let allAnswered = true;
    for (let i = 1; i <= 5; i++) {
        if (!userResponses.sql[i]) {
            allAnswered = false;
            break;
        }
    }

    // Optional: Warn if not all answered, but allow submission
    if (!allAnswered) {
        const proceed = confirm('Some SQL answers are missing. Do you want to submit anyway?');
        if (!proceed) return;
    }

    // Calculate scores
    calculateScores();
}

// Calculate and display scores
async function calculateScores() {
    try {
        // Show loading state
        document.getElementById('mcq-score').textContent = 'Calculating...';
        document.getElementById('python-score').textContent = 'Calculating...';
        document.getElementById('sql-score').textContent = 'Calculating...';
        document.getElementById('total-score').textContent = 'Calculating...';

        // Send to backend API with session ID
        const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mcq: userResponses.mcq,
                python: userResponses.python,
                sql: userResponses.sql,
                tab_switch_count: tabSwitchCount
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit assessment');
        }

        const result = await response.json();

        // Display results from backend
        document.getElementById('mcq-score').textContent = result.scores.mcq;
        document.getElementById('python-score').textContent = result.scores.python || '0/10';
        document.getElementById('sql-score').textContent = result.scores.sql;
        document.getElementById('total-score').textContent = result.scores.total;

        console.log('Assessment submitted successfully:', result);

        goToSection(4);

    } catch (error) {
        console.error('Error submitting assessment:', error);
        alert('Failed to submit assessment. Please try again or check if the backend server is running.');

        // Fallback to local calculation if API fails
        calculateScoresLocally();
    }
}

// Fallback: Calculate scores locally if API is unavailable
function calculateScoresLocally() {
    let mcqScore = 0;
    mcqQuestions.forEach(q => {
        if (userResponses.mcq[q.id] === q.correct) {
            mcqScore++;
        }
    });

    let sqlScore = 0;
    for (let i = 1; i <= 5; i++) {
        const userAnswer = userResponses.sql[i].toLowerCase().trim();
        const correctAnswer = sqlAnswers[i].toLowerCase().trim();

        if (userAnswer === correctAnswer) {
            sqlScore++;
        } else if (i === 3) {
            const tables = ['customers', 'financial_records', 'salary_data'];
            const allPresent = tables.every(t => userAnswer.includes(t));
            if (allPresent) sqlScore++;
        }
    }

    document.getElementById('mcq-score').textContent = `${mcqScore}/10`;
    document.getElementById('python-score').textContent = 'Submitted (not graded offline)';
    document.getElementById('sql-score').textContent = `${sqlScore}/5`;
    document.getElementById('total-score').textContent = `${mcqScore + sqlScore}/25`;

    console.log('Assessment Results (Local):', {
        mcq: mcqScore,
        python: userResponses.python,
        sql: sqlScore,
        total: mcqScore + sqlScore
    });

    goToSection(4);
}

// Navigate between sections
function goToSection(sectionNum) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    if (sectionNum === 4) {
        document.getElementById('results-section').classList.add('active');
    } else {
        document.getElementById(`section-${sectionNum}`).classList.add('active');
    }

    // Update progress bar
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < sectionNum) {
            step.classList.add('completed');
        } else if (index + 1 === sectionNum) {
            step.classList.add('active');
        }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}