// API Configuration
const API_BASE_URL = 'http://localhost:8000';

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

// SQL Database (simulated)
const sqlDatabase = {
    security_logs: [
        { log_id: 1, user_id: 101, access_time: '14:30', date: '2024-01-15', action: 'login' },
        { log_id: 2, user_id: 102, access_time: '15:45', date: '2024-01-15', action: 'login' },
        { log_id: 3, user_id: 103, access_time: '23:45', date: '2024-01-15', action: 'login' },
        { log_id: 4, user_id: 103, access_time: '23:47', date: '2024-01-15', action: 'database_access' },
        { log_id: 5, user_id: 101, access_time: '09:00', date: '2024-01-16', action: 'login' }
    ],
    employees: [
        { user_id: 101, name: 'Alice Johnson', department: 'IT', position: 'Developer' },
        { user_id: 102, name: 'Bob Smith', department: 'HR', position: 'Manager' },
        { user_id: 103, name: 'Charlie Davis', department: 'IT', position: 'Database Admin' },
        { user_id: 104, name: 'Diana Wilson', department: 'Finance', position: 'Analyst' }
    ],
    access_history: [
        { access_id: 1, user_id: 103, table_name: 'customers', date: '2024-01-15', time: '23:47' },
        { access_id: 2, user_id: 103, table_name: 'financial_records', date: '2024-01-15', time: '23:48' },
        { access_id: 3, user_id: 103, table_name: 'salary_data', date: '2024-01-15', time: '23:50' },
        { access_id: 4, user_id: 101, table_name: 'products', date: '2024-01-15', time: '14:35' }
    ],
    employee_records: [
        { user_id: 101, status: 'active', disciplinary_action: 'none' },
        { user_id: 102, status: 'active', disciplinary_action: 'none' },
        { user_id: 103, status: 'terminated', disciplinary_action: 'termination_pending', termination_date: '2024-01-20' },
        { user_id: 104, status: 'active', disciplinary_action: 'none' }
    ],
    network_traffic: [
        { traffic_id: 1, user_id: 103, destination_ip: '185.220.101.45', data_size_mb: 250, timestamp: '2024-01-15 23:52' },
        { traffic_id: 2, user_id: 101, destination_ip: '192.168.1.10', data_size_mb: 5, timestamp: '2024-01-15 14:40' },
        { traffic_id: 3, user_id: 102, destination_ip: '192.168.1.15', data_size_mb: 2, timestamp: '2024-01-15 15:50' }
    ]
};

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

// Anti-cheating measures
let tabSwitchCount = 0;
let warningShown = false;

// Disable right-click
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    alert('⚠️ Right-click is disabled during the assessment.');
    return false;
});

// Disable text selection and copying (optional - uncomment if needed)
// document.addEventListener('selectstart', function(e) {
//     e.preventDefault();
//     return false;
// });

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

// Detect tab switching / window blur
window.addEventListener('blur', function() {
    tabSwitchCount++;
    if (!warningShown) {
        alert('⚠️ WARNING: Tab switching detected!\n\nYou switched away from the assessment. This activity is being monitored.\n\nMultiple violations may result in automatic submission.');
        warningShown = true;
        setTimeout(() => { warningShown = false; }, 3000); // Reset after 3 seconds
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

        if (!warningShown) {
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

// Prevent opening DevTools (F12, Ctrl+Shift+I, etc.)
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

// Warn before closing/refreshing the page
window.addEventListener('beforeunload', function(e) {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave? Your progress may be lost.';
    return 'Are you sure you want to leave? Your progress may be lost.';
});

// Initialize the assessment
window.onload = function() {
    renderMCQQuestions();

    // Show initial warning
    setTimeout(() => {
        alert('📋 ASSESSMENT INSTRUCTIONS:\n\n' +
              '✓ Do not switch tabs or minimize this window\n' +
              '✓ Do not right-click or use developer tools\n' +
              '✓ Do not copy or paste content\n' +
              '✓ All suspicious activities are being monitored\n\n' +
              'Click OK to begin the assessment.');
    }, 500);
};

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

    // Check if all questions are answered
    if (Object.keys(userResponses.mcq).length < mcqQuestions.length) {
        alert('Please answer all questions before proceeding.');
        return;
    }

    goToSection(2);
}

// Run Python code in Docker sandbox
async function runPythonCode(problemNum) {
    const codeInput = document.getElementById(`python-code-${problemNum}`);
    const outputDiv = document.getElementById(`output-${problemNum}`);
    const runButton = event.target;

    const code = codeInput.value.trim();

    if (!code) {
        outputDiv.className = 'code-output show error';
        outputDiv.innerHTML = '<span class="output-label">Error:</span>Please write some code first.';
        return;
    }

    // Disable button and show loading
    runButton.disabled = true;
    runButton.textContent = '⏳ Running...';
    outputDiv.className = 'code-output show loading';
    outputDiv.innerHTML = '<span class="output-label">Status:</span>Executing code in Docker sandbox...';

    try {
        // Add test code based on problem
        let testCode = code + '\n\n';
        if (problemNum === 1) {
            // Test Two Sum
            testCode += `
# Test cases
print(twoSum([2, 7, 11, 15], 9))
print(twoSum([3, 2, 4], 6))
print(twoSum([3, 3], 6))
`;
        } else if (problemNum === 2) {
            // Test Palindrome
            testCode += `
# Test cases
print(isPalindrome("A man a plan a canal Panama"))
print(isPalindrome("race a car"))
print(isPalindrome("hello"))
`;
        }

        // Call backend API
        const response = await fetch(`${API_BASE_URL}/api/execute-python`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: testCode
            })
        });

        if (!response.ok) {
            throw new Error('Backend server error');
        }

        const result = await response.json();

        // Display results
        if (result.success) {
            outputDiv.className = 'code-output show success';
            outputDiv.innerHTML = `<span class="output-label">✓ Output:</span>${result.output || '(No output)'}`;
        } else {
            outputDiv.className = 'code-output show error';
            outputDiv.innerHTML = `<span class="output-label">✗ Error:</span>${result.error || 'Unknown error'}`;
        }

    } catch (error) {
        console.error('Error executing code:', error);
        outputDiv.className = 'code-output show error';
        outputDiv.innerHTML = `<span class="output-label">✗ Connection Error:</span>Could not connect to backend server. Make sure it's running on ${API_BASE_URL}`;
    } finally {
        // Re-enable button
        runButton.disabled = false;
        runButton.textContent = '▶ Run Code';
    }
}

// Submit Python code
function submitPython() {
    const code1 = document.getElementById('python-code-1').value;
    const code2 = document.getElementById('python-code-2').value;

    if (!code1.trim() || !code2.trim()) {
        alert('Please write code for both problems before proceeding.');
        return;
    }

    userResponses.python = {
        problem1: code1,
        problem2: code2
    };

    goToSection(3);
}

// Run SQL Query
function runSQLQuery(questionNum) {
    const query = document.getElementById(`sql-query-${questionNum}`).value.trim().toLowerCase();
    const resultDiv = document.getElementById(`result-${questionNum}`);

    if (!query) {
        resultDiv.innerHTML = '<p style="color: #e53e3e;">Please enter a query.</p>';
        return;
    }

    try {
        // Simple SQL parser (for demonstration)
        let result = parseAndExecuteSQL(query);
        resultDiv.innerHTML = result;
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #e53e3e;">Error: ${error.message}</p>`;
    }
}

// Simple SQL Parser (basic implementation)
function parseAndExecuteSQL(query) {
    // Extract table name
    let tableName = null;
    for (let table in sqlDatabase) {
        if (query.includes(table)) {
            tableName = table;
            break;
        }
    }

    if (!tableName) {
        return '<p style="color: #e53e3e;">Table not found. Available tables: security_logs, employees, access_history, employee_records, network_traffic</p>';
    }

    let data = sqlDatabase[tableName];

    // Simple WHERE clause handling
    if (query.includes('where')) {
        const whereMatch = query.match(/where\s+(.+?)(?:\s+order|\s+limit|$)/i);
        if (whereMatch) {
            const condition = whereMatch[1].trim();
            data = data.filter(row => evaluateCondition(row, condition));
        }
    }

    // Handle JOIN (basic)
    if (query.includes('join')) {
        return '<p style="color: #f59e0b;">For this demo, try querying tables individually and piece together the information.</p>';
    }

    // Limit results
    if (data.length > 20) {
        data = data.slice(0, 20);
    }

    return formatTableResult(data);
}

// Evaluate simple WHERE conditions
function evaluateCondition(row, condition) {
    // Handle simple conditions like: user_id = 103, date = '2024-01-15'
    const eqMatch = condition.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
    if (eqMatch) {
        const [, field, value] = eqMatch;
        return String(row[field]) == String(value).replace(/['"]/g, '');
    }
    return true;
}

// Format SQL result as HTML table
function formatTableResult(data) {
    if (!data || data.length === 0) {
        return '<p style="color: #718096;">No results found.</p>';
    }

    const headers = Object.keys(data[0]);
    let html = '<table><thead><tr>';
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
            html += `<td>${row[header]}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

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

    if (!allAnswered) {
        alert('Please answer all SQL questions before submitting.');
        return;
    }

    // Calculate scores
    calculateScores();
}

// Calculate and display scores
async function calculateScores() {
    try {
        // Show loading state
        document.getElementById('mcq-score').textContent = 'Calculating...';
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
    document.getElementById('sql-score').textContent = `${sqlScore}/5`;
    document.getElementById('total-score').textContent = `${mcqScore + sqlScore}/15`;

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