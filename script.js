// ===== CONFIGURATION =====
// API Configuration
const API_BASE_URL = 'http://localhost:8000';

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
    sql: {}
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

// Detect tab switching / window blur (track count even in dev mode)
window.addEventListener('blur', function() {
    tabSwitchCount++;
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
window.onload = function() {
    renderMCQQuestions();
    initializeResizablePanes();
    initializeNavigation();

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

        // Send to backend API
        const response = await fetch(`${API_BASE_URL}/api/submit-assessment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mcq: userResponses.mcq,
                python: userResponses.python,
                sql: userResponses.sql,
                candidate_name: null,  // Can add name/email fields later
                candidate_email: null,
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