# Wordtopia

Ứng dụng học từ vựng tiếng Anh (môn Lập trình thiết bị di động).

## Tính năng
- Đăng ký / đăng nhập (JWT, lưu token bằng SecureStore)
- Bộ từ vựng: tìm kiếm, tạo thủ công, tạo bằng AI (Gemini), sửa/xóa
- Học flashcard lật thẻ, ôn tập lặp lại ngắt quãng (SRS), phát âm
- Quiz trắc nghiệm, từ yêu thích
- Thống kê: chuỗi ngày học, mục tiêu ngày, biểu đồ 7 ngày
- Chat với gia sư AI "Wordie"

## Công nghệ
- Mobile: Expo SDK 58, React Native, Expo Router, TamaGUI, TanStack Query, Zustand, Reanimated
- Backend: NestJS, Prisma, PostgreSQL, Google Gemini

## Chạy dự án
Backend:

    cd backend
    npm install
    npm run start:dev

Mobile (điện thoại cùng WiFi với máy tính, cài Expo Go):

    cd mobile
    npm install
    npx expo start -c

Mở cổng 3000 trên firewall nếu điện thoại không kết nối được backend.

## Build APK

    npm i -g eas-cli
    eas login
    eas build -p android --profile preview

Đặt EXPO_PUBLIC_API_URL trong eas.json thành URL backend đã deploy.