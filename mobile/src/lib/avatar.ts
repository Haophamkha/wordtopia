import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export const AVATAR_RULES = {
  mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  maxOriginalBytes: 10 * 1024 * 1024,
  maxUploadBytes: 2 * 1024 * 1024,
  minSide: 200,
  outputSide: 512,
};

export class AvatarError extends Error {}

/** Mở thư viện ảnh, kiểm tra, cắt vuông, thu nhỏ và nén. Trả về uri ảnh đã xử lý, hoặc null nếu người dùng huỷ. */
export async function pickAvatar(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];

  if (a.mimeType && !AVATAR_RULES.mimes.includes(a.mimeType.toLowerCase())) {
    throw new AvatarError('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
  }
  if (a.fileSize && a.fileSize > AVATAR_RULES.maxOriginalBytes) {
    throw new AvatarError('Ảnh quá lớn, tối đa 10MB.');
  }
  const side = Math.min(a.width, a.height);
  if (side < AVATAR_RULES.minSide) {
    throw new AvatarError(`Ảnh quá nhỏ, cần tối thiểu ${AVATAR_RULES.minSide}×${AVATAR_RULES.minSide} px.`);
  }

  const out = await ImageManipulator.manipulateAsync(
    a.uri,
    [
      {
        crop: {
          originX: Math.floor((a.width - side) / 2),
          originY: Math.floor((a.height - side) / 2),
          width: side,
          height: side,
        },
      },
      { resize: { width: Math.min(side, AVATAR_RULES.outputSide), height: Math.min(side, AVATAR_RULES.outputSide) } },
    ],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  const blob = await (await fetch(out.uri)).blob();
  if (blob.size > AVATAR_RULES.maxUploadBytes) {
    throw new AvatarError('Ảnh sau khi xử lý vẫn quá lớn (trên 2MB), hãy chọn ảnh khác.');
  }
  return out.uri;
}