# GitHub Token Setup Guide

## Issue: GitHub API Authentication Error (401)

The admin approval system requires a valid GitHub Personal Access Token to store data in your repository. Here's how to fix this:

## Step 1: Generate a GitHub Personal Access Token

1. Go to GitHub.com and log into your account
2. Click your profile picture → Settings
3. Scroll down and click "Developer settings" in the left sidebar
4. Click "Personal access tokens" → "Tokens (classic)"
5. Click "Generate new token" → "Generate new token (classic)"
6. Give it a name like "GetCash Admin Token"
7. Set expiration (recommend 90 days or No expiration for testing)
8. Select the following permissions:
   - ✅ **repo** (Full control of private repositories)
   - ✅ **workflow** (Update GitHub Action workflows)
   - ✅ **write:packages** (Upload packages to GitHub Package Registry)

## Step 2: Copy the Token

1. Click "Generate token"
2. **IMPORTANT**: Copy the token immediately (it won't be shown again!)
3. The token will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Update Your Configuration

Replace the token in these files:

### File: `js/admin-approval.js`
```javascript
this.github = {
    owner: 'buttuura',              // Your GitHub username
    repo: 'MakeMoney',              // Your repository name
    token: 'ghp_YOUR_ACTUAL_TOKEN_HERE',  // ← Replace this
    branch: 'main'
};
```

### File: `js/deposit.js`
```javascript
this.github = {
    owner: 'buttuura',
    repo: 'MakeMoney',
    token: 'ghp_YOUR_ACTUAL_TOKEN_HERE',  // ← Replace this
    branch: 'main'
};
```

### File: `js/user-notifications.js`
```javascript
this.github = {
    owner: 'buttuura',
    repo: 'MakeMoney',
    token: 'ghp_YOUR_ACTUAL_TOKEN_HERE',  // ← Replace this
    branch: 'main'
};
```

### File: `js/task-upload.js`
```javascript
this.github = {
    owner: 'buttuura',
    repo: 'MakeMoney',
    token: 'ghp_YOUR_ACTUAL_TOKEN_HERE',  // ← Replace this
    branch: 'main'
};
```

## Step 4: Create Data Directory (Optional)

Your repository might need a `data/` folder for storing files. You can:

1. Create it manually in GitHub:
   - Go to your repository
   - Click "Create new file"
   - Type `data/README.md`
   - Add some content and commit

2. Or let the system create it automatically when first used

## Alternative: Use Local Storage Fallback

The system now includes automatic fallback to localStorage when GitHub is unavailable:

- ✅ Data is saved locally if GitHub fails
- ✅ Admin approvals still work
- ✅ Users get notifications (locally)
- ⚠️ Data won't sync across devices
- ⚠️ Data may be lost if browser cache is cleared

## Testing the Fix

1. Update the tokens as described above
2. Open admin-approval.html
3. Try to approve a test deposit
4. Check the browser console for any errors
5. If you see "GitHub connectivity verified" - success!
6. If you see "Using local storage fallback" - GitHub token needs to be fixed

## Security Note

- Never commit your actual GitHub token to your repository
- Keep the token secure and private
- Regenerate the token if it gets compromised
- Consider using environment variables for production

## Current Status

✅ **Temporary Fix Applied**: The system now works with localStorage fallback
✅ **Error Handling**: Graceful degradation when GitHub is unavailable  
⚠️ **Action Needed**: Replace placeholder tokens with real ones for full functionality