# TechAssess - Online Assessment Platform

A sleek and professional online assessment platform for interviewing freshers with three rounds: MCQ, Python Coding, and SQL Mystery.

## Features

### 1. MCQ Round (10 Questions)
- Computer Fundamentals
- Operating Systems
- Networking
- Database Basics
- Automatically scored

### 2. Python Coding Round (2 Problems)
- **Problem 1: Two Sum** - Easy array manipulation problem
- **Problem 2: Palindrome Check** - String processing problem
- Code editors with syntax highlighting
- Solutions stored for manual review

### 3. SQL Mystery Round (5 Questions)
- Theme: Database Heist Investigation
- Interactive SQL query execution
- In-browser database simulation
- Automatically scored based on answers

## 🚀 Quick Start

### Easiest Way - Docker Compose (Recommended)

```bash
# Navigate to project directory
cd C:\Users\vaibh\Documents\basic_test_platform

# Start everything with one command
docker-compose up --build
```

Then open:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Alternative - Run Manually

**Frontend Only (No backend features):**
```bash
# Just open index.html in your browser
start index.html
```

**With Backend:**
```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
python main.py

# Terminal 2 - Frontend (or just open index.html)
python -m http.server 3000
```

**📖 For detailed instructions, see [QUICKSTART.md](QUICKSTART.md)**

## Project Structure

```
basic_test_platform/
├── index.html      # Main HTML file with all sections
├── styles.css      # Custom styling with brand colors
├── script.js       # JavaScript logic for questions and interactivity
└── README.md       # This file
```

## Customization

### Adding/Modifying Questions

**MCQ Questions:**
Edit the `mcqQuestions` array in `script.js`:
```javascript
const mcqQuestions = [
    {
        id: 1,
        question: "Your question here?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correct: 0  // Index of correct answer (0-3)
    },
    // ... more questions
];
```

**Python Problems:**
Modify the problem descriptions in `index.html` under the "Python Coding Round" section.

**SQL Questions:**
1. Update the `sqlDatabase` object in `script.js` to modify database tables
2. Update the `sqlAnswers` object with correct answers
3. Modify question text in `index.html` under the "SQL Mystery Round" section

### Changing Colors/Theme
All brand colors are in `styles.css`:
- Primary color: `#BE003C`
- Secondary color: `#8B0028`
- Update these to match your brand

### Logo
Replace the logo URL in `index.html`:
```html
<img src="YOUR_LOGO_URL" alt="TechAssess Logo" class="header-logo">
```

## Deployment

### For Production Use

Since this is a static website, you can deploy it to:

1. **GitHub Pages** (Free)
2. **Netlify** (Free)
3. **Vercel** (Free)
4. **AWS S3 + CloudFront**
5. **Any web hosting service**

### Docker Deployment
For running in a containerized environment with memory constraints:

Create a `Dockerfile`:
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t techassess .
docker run -p 8080:80 --memory="512m" techassess
```

## Backend Integration (Future Enhancement)

Currently, all data is stored in browser console. To integrate with a backend:

1. Add a backend API endpoint
2. Modify the `submitAssessment()` function in `script.js`:
```javascript
function submitAssessment() {
    // ... existing code ...

    // Send to backend
    fetch('/api/submit-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userResponses)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Submission successful:', data);
    });
}
```

## Security Notes

- For production, implement:
  - User authentication
  - Session management
  - Backend validation of answers
  - Time limits per section
  - Anti-cheating measures (tab switching detection, etc.)
  - Secure code execution environment for Python submissions

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## License

MIT License - Feel free to use and modify for your needs.

## Support

For issues or questions, please refer to the documentation or contact support.
