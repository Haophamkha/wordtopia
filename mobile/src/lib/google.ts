export class GoogleError extends Error {}

/** Trả về idToken, hoặc null nếu người dùng huỷ. Cần development build. */
export async function signInWithGoogle(): Promise<string | null> {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw new GoogleError('Chưa cấu hình EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID trong file .env của mobile.');
  }

  let mod: typeof import('@react-native-google-signin/google-signin');
  try {
    mod = require('@react-native-google-signin/google-signin');
  } catch {
    throw new GoogleError('Đăng nhập Google cần development build, không chạy được trong Expo Go.');
  }

  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = mod;
  try {
    GoogleSignin.configure({ webClientId });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null;
    const idToken = res.data.idToken;
    if (!idToken) throw new GoogleError('Không lấy được mã xác thực từ Google.');
    return idToken;
  } catch (e) {
    if (e instanceof GoogleError) throw e;
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw new GoogleError('Đăng nhập Google thất bại, hãy thử lại.');
  }
}