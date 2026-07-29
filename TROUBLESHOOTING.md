# Troubleshooting Guide - FastChat

## Common Issues and Solutions

### 1. CORS Errors and BlackBox.io Requests

**Problem:** Browser shows CORS errors or tries to access `www.useblackbox.io/tlm`

**Causes:**
- Browser extension interfering with the application
- Content Security Policy not properly configured
- Third-party scripts injected by extensions

**Solutions:**
1. **Disable Browser Extensions**: Try opening the app in an incognito/private window
2. **Check Network Tab**: Look for any external requests that shouldn't be there
3. **Clear Browser Cache**: Clear cache and cookies for the domain
4. **Use Different Browser**: Test in a different browser to isolate the issue

### 2. Backend Connection Issues (500 Errors)

**Problem:** `/api/chat` returns 500 errors or "Backend server is not reachable"

**Debugging Steps:**

1. **Check Backend Health**:
   ```
   GET https://fastchat-backend-xujp.onrender.com/api/health
   ```

2. **Check Frontend Debug Info**:
   ```
   GET https://your-frontend-domain.vercel.app/api/debug
   ```

3. **Verify Environment Variables**:
   - `GROQ_API_KEY` is set and valid
   - `DB_URL` is accessible
   - CORS origins include your frontend domain

**Common Backend Issues:**
- Render.com backend in sleep mode (first request may timeout)
- Database connection issues
- Invalid Groq API key
- Missing environment variables

### 3. File Upload Issues

**Problem:** File uploads fail or timeout

**Solutions:**
1. **Check File Size**: Max 10MB per file
2. **Supported Formats**: .txt, .pdf, .docx, .md, .markdown
3. **Network Timeout**: Files may take longer to process

### 4. Environment Configuration

**Development Setup:**
```env
# .env.local
BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_BACKEND_URL=https://fastchat-backend-xujp.onrender.com
```

**Production Setup:**
```env
# .env.production
BACKEND_URL=https://fastchat-backend-xujp.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://fastchat-backend-xujp.onrender.com
```

## Quick Fixes

### If Chat is Not Working:

1. **Check Backend Status**:
   - Visit: https://fastchat-backend-xujp.onrender.com/api/health
   - Should return JSON with status "UP"

2. **Refresh the Page**: Sometimes a simple refresh resolves connection issues

3. **Clear Session**: Click "New Chat" to create a fresh session

4. **Check Console**: Open browser dev tools and look for error messages

### If BlackBox.io Errors Persist:

1. **Disable Extensions**: Especially AI-related browser extensions
2. **Use Incognito Mode**: Test in private/incognito window
3. **Try Different Browser**: Chrome, Firefox, Safari, Edge
4. **Check Network**: Ensure no corporate firewall is injecting scripts

## Monitoring and Logs

### Frontend Logs:
- Open browser dev tools → Console tab
- Look for error messages starting with `[chat/json]` or `[chat/multipart]`

### Backend Logs:
- Check Render.com dashboard for backend service logs
- Look for database connection errors or Groq API issues

## Contact Information

If issues persist after trying these solutions:
1. Check the GitHub repository issues
2. Verify all environment variables are correctly set
3. Ensure backend service is running on Render.com