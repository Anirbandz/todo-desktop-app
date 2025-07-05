# Auto-Update Setup Guide for TaskFlow Desktop App

This guide explains how to set up automatic updates for your TaskFlow desktop application so that when you push updates, they automatically get distributed to your clients.

## Overview

The auto-update system uses:
- **electron-updater**: Handles update checking, downloading, and installation
- **GitHub Releases**: Stores update files and metadata
- **electron-builder**: Builds and publishes updates

## Prerequisites

1. **GitHub Repository**: Your app must be in a GitHub repository
2. **GitHub Token**: Personal access token with repo permissions
3. **Code Signing**: For macOS, you'll need an Apple Developer account

## Step 1: Configure GitHub Repository

1. Create a GitHub repository for your app (if you haven't already)
2. Generate a GitHub Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` permissions
   - Save the token securely

## Step 2: Update Configuration

### Update package.json

Update the `publish` section in your `package.json`:

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "your-github-username",
        "repo": "your-repo-name"
      }
    ]
  }
}
```

Replace:
- `your-github-username` with your GitHub username
- `your-repo-name` with your repository name

### Set Environment Variables

Create a `.env` file or set environment variables:

```bash
# GitHub token for publishing updates
GH_TOKEN=your-github-token-here

# For code signing (macOS)
CSC_LINK=path/to/your/certificate.p12
CSC_KEY_PASSWORD=your-certificate-password
```

## Step 3: Build and Publish Updates

### First Release

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Publish to GitHub**:
   ```bash
   npm run publish
   ```

This will:
- Build the app for all platforms
- Create a GitHub release
- Upload the built files
- Generate update metadata

### Subsequent Updates

1. **Update version** in `package.json`:
   ```json
   {
     "version": "1.0.2"
   }
   ```

2. **Build and publish**:
   ```bash
   npm run publish
   ```

## Step 4: Client Update Process

### Automatic Updates

The app automatically:
- Checks for updates on startup (after 5 seconds)
- Checks every 24 hours
- Shows notifications when updates are available
- Downloads and installs updates with user permission

### Manual Updates

Users can manually check for updates in Settings:
1. Go to Settings page
2. Click "Check for Updates"
3. Download and install if available

## Step 5: Update Workflow

### Development Workflow

1. **Make changes** to your code
2. **Update version** in `package.json`
3. **Commit and push** to GitHub
4. **Build and publish**:
   ```bash
   npm run publish
   ```

### Release Notes

Include release notes in your GitHub releases:
- Go to your GitHub repository
- Click on the latest release
- Edit the release description
- Add what's new, bug fixes, etc.

## Step 6: Testing Updates

### Test Update Process

1. **Install an older version** of your app
2. **Publish a newer version**
3. **Run the older version** - it should detect and offer the update

### Debugging

Check the console for update-related logs:
- Update checking
- Download progress
- Installation status

## Platform-Specific Notes

### macOS

- **Code Signing**: Required for auto-updates
- **Notarization**: Required for distribution outside App Store
- **DMG**: Updates are distributed as DMG files

### Windows

- **Code Signing**: Recommended but not required
- **NSIS**: Updates are distributed as NSIS installers

### Linux

- **AppImage**: Updates are distributed as AppImage files
- **Deb/RPM**: Can also distribute as package files

## Troubleshooting

### Common Issues

1. **Updates not detected**:
   - Check GitHub token permissions
   - Verify repository name in package.json
   - Check network connectivity

2. **Download fails**:
   - Check file size limits
   - Verify GitHub release assets
   - Check firewall settings

3. **Installation fails**:
   - Check file permissions
   - Verify code signing (macOS)
   - Check antivirus software

### Debug Commands

```bash
# Check current version
npm run build -- --debug

# Force update check
# (Add to main.js for testing)
autoUpdater.checkForUpdatesAndNotify()
```

## Security Considerations

1. **Code Signing**: Always sign your releases
2. **HTTPS**: Updates are downloaded over HTTPS
3. **Verification**: electron-updater verifies file integrity
4. **Permissions**: Users must approve updates

## Advanced Configuration

### Custom Update Server

You can use your own update server instead of GitHub:

```json
{
  "build": {
    "publish": [
      {
        "provider": "generic",
        "url": "https://your-update-server.com/updates"
      }
    ]
  }
}
```

### Update Channels

Support different update channels (beta, stable):

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "your-username",
        "repo": "your-repo",
        "channel": "latest"
      }
    ]
  }
}
```

## Monitoring

### Update Analytics

Track update adoption:
- GitHub release downloads
- App analytics (if implemented)
- User feedback

### Health Checks

Monitor:
- Update success rate
- Download speeds
- Installation success rate

## Best Practices

1. **Version Management**: Use semantic versioning
2. **Release Notes**: Always include meaningful release notes
3. **Testing**: Test updates thoroughly before release
4. **Rollback**: Keep previous versions available
5. **Communication**: Notify users of major updates

## Support

For issues with auto-updates:
1. Check electron-updater documentation
2. Review GitHub release logs
3. Test with a clean installation
4. Check platform-specific requirements

---

This setup enables seamless updates for your TaskFlow desktop app, ensuring users always have the latest features and security patches. 