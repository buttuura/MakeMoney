# GitHub Integration Setup Guide

## Overview
The GetCash app now uses GitHub as cloud storage for tasks instead of browser localStorage. This provides better persistence and allows data to be shared across devices.

## Setup Instructions

### 1. Create a GitHub Repository
1. Go to [GitHub](https://github.com) and sign in to your account
2. Click the "+" button and select "New repository"
3. Name your repository (e.g., `getcash-tasks`)
4. Make it **Public** (required for the current implementation)
5. Initialize with a README
6. Click "Create repository"

### 2. Generate a Personal Access Token
1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "GetCash App"
4. Select these scopes:
   - `public_repo` (for public repositories)
   - `repo` (if you want to use a private repository)
5. Click "Generate token"
6. **Copy the token immediately** - you won't see it again!

### 3. Configure the Application

#### For Task Upload (Admin Panel)
Edit `public/js/task-upload.js` and update these values:

```javascript
this.github = {
    owner: 'your-github-username',        // Replace with your GitHub username
    repo: 'getcash-tasks',                // Replace with your repository name
    token: 'ghp_your_token_here',         // Replace with your personal access token
    branch: 'main'                        // Usually 'main' or 'master'
};
```

#### For Task Loading (Task Pages)
Edit `public/js/tasks.js` and update these values:

```javascript
this.github = {
    owner: 'your-github-username',        // Replace with your GitHub username
    repo: 'getcash-tasks',                // Replace with your repository name  
    token: 'ghp_your_token_here',         // Replace with your personal access token
    branch: 'main'                        // Usually 'main' or 'master'
};
```

### 4. Test the Integration

1. Open `task-upload.html` in your browser
2. Select a level and upload a test task
3. Check your GitHub repository - you should see new JSON files created:
   - `tasks_intern.json`
   - `tasks_level1.json`
   - `tasks_level2.json`
   - `tasks_level3.json`
   - `uploaded_tasks.json`

### 5. Security Considerations

⚠️ **Important Security Notes:**

- **Never commit your personal access token to a public repository**
- Consider using GitHub Actions secrets for production deployments
- For production use, implement server-side API calls instead of client-side GitHub API calls
- The current implementation is suitable for development/testing purposes

### 6. File Structure

The app will create these files in your repository:

```
├── tasks_intern.json      # Intern level tasks
├── tasks_level1.json      # Level 1 tasks  
├── tasks_level2.json      # Level 2 tasks
├── tasks_level3.json      # Level 3 tasks
└── uploaded_tasks.json    # Admin upload history
```

### 7. Troubleshooting

**Error: "Failed to upload task"**
- Check your GitHub token is valid and has the right permissions
- Verify your repository name and username are correct
- Make sure the repository exists and is accessible

**Error: "GitHub API error: 404"**
- Repository doesn't exist or is private without proper token permissions
- Double-check the repository owner/name configuration

**Error: "GitHub API error: 401"**
- Invalid or expired personal access token
- Token doesn't have required permissions

### 8. Fallback Behavior

If GitHub integration fails:
- Task pages will show sample/demo tasks
- Users will see a notification about using sample data
- The app remains functional for testing purposes

## Next Steps

For production deployment, consider:
1. Implementing a backend API server
2. Using environment variables for sensitive data
3. Adding user authentication
4. Implementing proper error handling and retry logic