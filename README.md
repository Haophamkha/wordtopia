# Wordtopia

Ứng dụng học tiếng Anh cho người Việt (đồ án môn Lập trình thiết bị di động). Lộ trình kiểu Duolingo, tự học kiểu Quizlet, gia sư AI.

> Dùng Claude để phát triển? Đọc [`CLAUDE.md`](CLAUDE.md) trước, rồi [`docs/PRODUCT.md`](docs/PRODUCT.md) và [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Tính năng
**Đã có**
- Đăng ký / đăng nhập (JWT, SecureStore), Google login, quên mật khẩu bằng OTP
- Lộ trình Chặng (unit) → Màn (lesson), khóa tuần tự, sao theo điểm; 7 loại bài tập từ vựng
- Test đầu vào (10 câu từ vựng) xếp trình độ
- Bộ từ (deck): tìm kiếm, tạo tay, tạo bằng AI (Gemini), sửa/xóa; flashcard; quiz; từ yêu thích
- Ôn tập ngắt quãng (SRS Leitner), phát âm
- Thống kê: chuỗi ngày học, mục tiêu ngày, biểu đồ 7 ngày
- Nhắc học hằng ngày (local notification)
- Chat với gia sư AI "Wordie", tra từ bằng AI

**Đã viết code, chưa kiểm thử trên thiết bị** (xem `docs/ROADMAP.md`)
- XP, hiệu ứng streak (đạt/mất), lời khen và combo khi trả lời đúng
- Thông báo trong app (chuông) và push từ server (cần dev build/APK)
- Bỏ qua test đầu vào, làm lại test
- Ngữ pháp, bài kiểm tra cuối chặng (Checkpoint)
- Học qua video (phụ đề Anh-Việt, chạm từ để tra nghĩa) và video quiz
- Bảng xếp hạng (tuần/tất cả), kết bạn bằng mã, bảng xếp hạng bạn bè
- Huy hiệu
- AI giải thích lỗi sai, chat có ngữ cảnh, sửa câu viết bằng AI

**Chưa làm**
- Hearts, freeze streak
- Dashboard admin để nhập nội dung (video, bài học): hiện nhập bằng seed script

## Công nghệ
- Mobile: Expo SDK 58, React Native, Expo Router, Tamagui, TanStack Query, Zustand, Reanimated, expo-video, expo-notifications
- Backend: NestJS, Prisma, PostgreSQL, Google Gemini, @nestjs/schedule (lịch gửi push), Expo Push API

## Cấu trúc
```
backend/   API NestJS + Prisma (prisma/schema.prisma, prisma/seed/seed.ts, src/*)
mobile/    App Expo (src/app, api, components, hooks, lib, store, theme, types, utils)
docs/      PRODUCT.md (nghiệp vụ), ROADMAP.md (kế hoạch)
CLAUDE.md  Prompt tổng quan cho Claude
```

## Chạy dự án
Biến môi trường backend: `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL` (tùy chọn), và các biến Cloudinary/JWT/Google/mail theo `backend/.env.example`.

Backend:

    cd backend
    npm install
    npx prisma migrate deploy
    npm run seed        # bộ từ mẫu
    npm run seed:path   # lộ trình (cần prisma/seed/path-data.json)
    npm run seed:video  # video học (điền mediaUrl và phụ đề trong prisma/seed/video-data.json trước)
    npm run start:dev

Mobile (điện thoại cùng WiFi với máy tính, cài Expo Go):

    cd mobile
    npm install
    npx expo start -c

Mở cổng 3000 trên firewall nếu điện thoại không kết nối được backend. Push notification từ server cần dev build/APK, không chạy trong Expo Go. Backend phải chạy liên tục thì lịch gửi push mới hoạt động.

## Build APK

    npm i -g eas-cli
    eas login
    eas build -p android --profile preview

Đặt `EXPO_PUBLIC_API_URL` trong `eas.json` thành URL backend đã deploy.

Để nhận push từ server: chạy `eas init` trong `mobile` (tạo EAS projectId), tạo project Firebase rồi thêm `google-services.json` và khóa FCM V1 lên EAS (`eas credentials`), sau đó build APK.

## Nguồn dữ liệu
Nhiều câu ví dụ trong lộ trình lấy từ [Tatoeba](https://tatoeba.org) (giấy phép CC BY 2.0 FR). Mã câu gốc lưu ở trường `exampleSource` của từng từ.

Video demo: "CSBS Alice Wiegand.ogv" của Alice Wiegand, giấy phép CC BY-SA 3.0, qua [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:CSBS_Alice_Wiegand.ogv). Phụ đề tiếng Anh theo TimedText của clip, phụ đề tiếng Việt do nhóm dịch.