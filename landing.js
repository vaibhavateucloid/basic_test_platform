// API Base URL - dynamically set based on current host
const API_BASE_URL = `http://${window.location.hostname}:8000`;

// Form submission handler
document.getElementById('registrationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitButton = document.getElementById('startButton');
    const errorMessage = document.getElementById('errorMessage');

    // Get form values
    const candidateName = document.getElementById('candidateName').value.trim();
    const candidateEmail = document.getElementById('candidateEmail').value.trim();
    const examCode = document.getElementById('examCode').value.trim() || null;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Validate
    if (!candidateName || !candidateEmail) {
        showError('Please fill in all required fields');
        return;
    }

    if (!agreeTerms) {
        showError('You must agree to the terms and conditions');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidateEmail)) {
        showError('Please enter a valid email address');
        return;
    }

    // Disable button and show loading
    submitButton.disabled = true;
    submitButton.textContent = 'Creating your session...';
    hideError();

    try {
        // Call registration API
        const response = await fetch(`${API_BASE_URL}/api/register-candidate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidate_name: candidateName,
                candidate_email: candidateEmail,
                exam_code: examCode
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Registration failed');
        }

        const result = await response.json();

        if (result.success) {
            // Store session info in sessionStorage
            sessionStorage.setItem('sessionId', result.session_id);
            sessionStorage.setItem('candidateName', candidateName);

            // Show success message
            submitButton.textContent = 'Redirecting to assessment...';

            // Redirect to test page with session ID
            setTimeout(() => {
                window.location.href = `test.html?session=${result.session_id}`;
            }, 500);
        } else {
            throw new Error('Registration failed');
        }

    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message || 'Failed to register. Please check if the backend server is running and try again.');

        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = 'Start Assessment';
    }
});

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';
}

// Add smooth scroll for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
