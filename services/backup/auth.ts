type GoogleSigninModule =
  typeof import("@react-native-google-signin/google-signin");

let _mod: GoogleSigninModule | null = null;

async function getModule(): Promise<GoogleSigninModule> {
  if (!_mod) {
    _mod = await import("@react-native-google-signin/google-signin");
  }
  return _mod;
}

/**
 * Returns a valid Google OAuth access token with the drive.appdata scope.
 * Silently refreshes if the current token is expired.
 */
export async function getValidAccessToken(): Promise<string> {
  const { GoogleSignin } = await getModule();
  try {
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  } catch {
    // Token expired or missing — attempt silent refresh
    await GoogleSignin.signInSilently();
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  }
}
