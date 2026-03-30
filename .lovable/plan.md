

## Problem

The `capacitor.config.json` has a `server.url` pointing to the Lovable preview URL. This means the APK always loads the remote website instead of the locally bundled app files from the `dist` folder.

## Fix

Remove the `server` block entirely from `capacitor.config.json`. This makes Capacitor load the app from the local `dist/` directory (specified by `webDir`), so it runs fully offline as a real native app.

### Updated `capacitor.config.json`:
```json
{
  "appId": "app.lovable.pesaguard",
  "appName": "PesaGuard",
  "webDir": "dist",
  "plugins": {
    "SplashScreen": {
      "launchAutoHide": false,
      "backgroundColor": "#0a2e1a",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false
    },
    "LocalNotifications": {
      "smallIcon": "ic_stat_icon",
      "iconColor": "#1a6b3c"
    }
  }
}
```

### After this change, you must:
1. **Git pull** the project
2. Run `npm run build` to generate the `dist` folder
3. Run `npx cap sync` to copy the built files into the Android project
4. Run `npx cap run android` to launch on device/emulator

The app will now load locally from the device — no internet required, no preview badge.

