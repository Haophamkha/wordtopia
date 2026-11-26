# Wordtopia: roadmap

Đặt tại `docs/ROADMAP.md`. Làm theo thứ tự phase. Mỗi task nhỏ, tách commit riêng. Chi tiết nghiệp vụ: `PRODUCT.md`.
Chú thích: "(chưa test)" = code đã viết nhưng chưa chạy thử trên máy. `[x]` nghĩa là đã viết code, không có nghĩa là đã kiểm thử.

## Phase 0: dọn nền, sửa lỗi
- [x] `accessibleWords` gồm từ Lesson đã học, dùng chung ở `common/word-access.ts`; `stats.dueToday` khớp phiên ôn (chưa test).
- [x] `ExerciseView`: fallback có nút "Bỏ qua".
- [x] Xóa file `*.bak*`, thêm vào `.gitignore`.
- [x] `prisma/seed/path-data.json`, `seed-path.ts`, script `seed:path` (đã `git add` file JSON, nhớ commit).
- [x] README: ghi nguồn Tatoeba (CC BY 2.0 FR).
- [x] `words.service#search`: tìm được cả từ thuộc Lesson (chưa test; kiểm tra màn tìm kiếm mobile có lỗi khi `word.deck` null không).
- [ ] Đọc nốt file chưa đọc (CLAUDE.md §9).
- [ ] (Tùy chọn) Sửa type Tamagui trong `mobile/tamagui.config.ts` để `tsc` mobile sạch (332 lỗi có sẵn, không ảnh hưởng chạy); đổi `StyleSheet.absoluteFillObject` thành `absoluteFill` trong `FlipCard.tsx`.

## Phase 1: XP, streak, hiệu ứng
- [x] Schema: `User.xp`, `StudyLog.xp` (migration `add_xp`).
- [x] Backend: hằng số `XP`; `path.complete` trả `xpGained`, `totalXp`, `streak`, `streakIncreased`, `dailyGoalReached`; `study.review` trả `xpGained`, `streakIncreased`.
- [x] Backend: `stats.overview` trả `xp`, `todayXp`, `studiedToday`, `streakAtRisk`, `streakLost { previous }`; `POST /study/streak-lost/ack`.
- [x] Mobile: hiệu ứng đạt streak sau bài (`StreakCelebration`), mất streak ở Home, mốc 3/7/14/30 (chưa test).
- [x] Mobile: `FeedbackBar` có lời khen ngẫu nhiên + combo (`lib/praise.ts`) (chưa test).
- [x] Mobile: Home hiện XP; hiệu ứng đạt mục tiêu ngày (`GoalCelebration`) (chưa test).
- Xong khi: học xong 1 bài thấy streak/XP đổi đúng; bỏ 1 ngày rồi vào app thấy hiệu ứng mất streak một lần.

## Phase 2: thông báo
- [x] Schema: `Notification`, `PushToken`, `User.reminderHour` (migration `add_notifications` đã áp lên Neon).
- [x] Backend: module `notifications` (list, unread-count, read, read-all); tự tạo thông báo khi đạt mốc streak, đạt mục tiêu ngày, mất streak (chưa test).
- [x] Mobile: chuông ở Home + badge + màn `notifications` (chưa test; có thể cần `headerShown: false` trong `_layout.tsx`).
- [x] (chưa test) Backend: module `push`: `POST /devices` (lưu push token), `POST /devices/unregister`, `PATCH /devices/reminder` (lưu `User.reminderHour`), `POST /devices/test` (gửi thử cho chính mình); gửi qua Expo Push API theo lô 100, tự xóa token chết.
- [x] (chưa test) Backend: cron `@nestjs/schedule` chạy đầu mỗi giờ (giờ VN): nhắc học theo giờ người dùng chọn (bỏ qua nếu đã học), cảnh báo sắp mất streak lúc 20:00, nhắc ôn lúc 9:00 khi có từ 10 từ đến hạn trở lên; mỗi loại chỉ gửi 1 lần/ngày/người (tra bằng `Notification.data.pushKind`).
- [x] (chưa test) Mobile: `lib/push.ts` đăng ký push token khi đã có quyền, xin quyền khi bật nhắc, hủy đăng ký khi đăng xuất, đưa giờ nhắc lên server và hủy nhắc local để khỏi báo trùng (nhắc local vẫn là dự phòng); bấm thông báo mở đúng màn hình.
- [ ] Cấu hình để nhận push thật (làm tay): `eas init` (EAS projectId), Firebase + `google-services.json` + khóa FCM V1 lên EAS, build APK, đổi `EXPO_PUBLIC_API_URL` trong `eas.json`.
- Lưu ý: push cần dev build/APK (Expo Go không đủ); backend phải chạy liên tục thì cron mới gửi đúng giờ; iOS cần tài khoản Apple Developer.

## Phase 3: onboarding và placement
- [x] Luồng đăng ký → survey → placement đã có (survey có nút "Bỏ qua").
- [x] `POST /path/placement/skip` đặt `onboarded = true` (chưa test).
- [x] (chưa test) Gửi `selfLevel`/`purpose` của survey lên server (`POST /users/me/survey`: `purpose` → `User.goalType`, `selfLevel` → `User.selfLevel`).
- [x] Profile có dòng "Làm lại bài test trình độ" (chưa test).

## Phase 4: ngữ pháp và Checkpoint
- [x] (chưa test) Schema: `Lesson.type` (`VOCAB | GRAMMAR | CHECKPOINT`, sau này thêm `VIDEO`), `Lesson.noteMd`, `Exercise { lessonId, order, type, payload Json, explanationVi, mediaUrl? }`.
- [x] (chưa test) Backend: `getLesson` trả exercise lưu DB cho GRAMMAR; sinh bài tổng hợp cho CHECKPOINT (ngưỡng đạt ≥70%).
- [x] (chưa test) Mobile: thẻ giải thích ngữ pháp, các loại bài ngữ pháp mới trong `ExerciseView`, giao diện Checkpoint (chấm cuối bài).
- [x] (chưa test) Seed: 1-2 unit ngữ pháp mẫu (soạn tay hoặc script gọi AI rồi duyệt tay).
- [x] (chưa test) Path UI: node Checkpoint thật thay trophy trang trí; khóa unit sau đến khi đạt.

## Phase 5: AI học tập
- [x] (chưa test) `POST /ai/explain-mistake` + nút "Vì sao sai?" trong bài tập.
- [x] (chưa test) Chat có ngữ cảnh (trình độ, từ vừa sai/đến hạn) + chế độ roleplay.
- [x] (chưa test) Giới hạn lượt/ngày/user, cache, xử lý 429 thân thiện.
- [x] (chưa test) Cải thiện `lookup.tsx`: lưu được vào deck; `/ai/explain` trả thêm `similar` (2-3 từ gần nghĩa kèm `diffVi`), màn tra từ hiện mục "Phân biệt từ gần nghĩa".

## Phase 6: video học
- [x] (chưa test) Schema: thêm `VIDEO` vào `LessonType` (migration `add_video_lesson_type`). Mỗi bài video có 1 Exercise `type = 'video'` (`mediaUrl` + `payload.subtitles` `[{start,end,en,vi}]`).
- [x] (chưa test) Nhập nội dung bằng seed: `prisma/seed/video-data.json` + `seed-video.ts` + script `seed:video` (chưa có dashboard). Video nằm trong unit "Học qua video" (BEGINNER, `order = 0`) ở đầu lộ trình.
- [x] (chưa test) Mobile: `VideoLesson` dùng `expo-video`: phụ đề Anh-Việt chạy theo thời gian, chạm câu để tua, lặp câu, bật/tắt phụ đề Việt; xem ≥90% hoặc hết clip thì hiện nút Hoàn thành.
- [x] (chưa test) Chạm từ trong phụ đề: tạm dừng video, mở `WordLookupSheet` (nghĩa, phiên âm, ví dụ, từ gần nghĩa từ `/ai/explain`), lưu vào bộ từ.
- [x] (chưa test) Video quiz: sau clip là các câu trắc nghiệm (dùng lại loại bài `grammar_choice`), khai báo ở mảng `quiz` của `video-data.json`; khi có quiz thì clip không tính điểm.
- [x] (chưa test) `study.markStudied`: bài VIDEO/GRAMMAR (không có từ để `applyReview`) vẫn tính streak.
- Xong khi: mở bài video thấy clip + phụ đề chạy đúng; chạm từ tra được nghĩa; làm xong quiz thấy sao/XP/streak đổi.

## Phase 7: bảng xếp hạng và bạn bè
- [x] (chưa test) Backend: `GET /leaderboard?period=week|all&scope=all|friends`; tuần tính từ thứ Hai giờ VN theo `StudyLog.xp`, tổng theo `User.xp`; top 20 + hạng của người xem.
- [x] (chưa test) Schema: `Friendship` (PENDING/ACCEPTED), `User.friendCode` (unique), `User.hideFromLeaderboard` (migration `add_friends`).
- [x] (chưa test) Backend: module `friends`: mã bạn bè `WT-XXXXXX` tạo khi mở màn Bạn bè lần đầu; gửi/chấp nhận/từ chối/hủy lời mời, xóa bạn, công tắc ẩn khỏi bảng chung; thông báo trong app.
- [x] (chưa test) Mobile: màn `leaderboard` (Mọi người/Bạn bè × Tuần này/Tất cả), màn `friends` (mã của bạn, thêm bạn bằng mã, lời mời, danh sách bạn), nút ở Home và Profile.

## Phase 8: huy hiệu
- [x] (chưa test) Schema: `UserBadge { userId, badgeKey, earnedAt }` (migration `add_badges`); danh mục 18 huy hiệu ở `badges.catalog.ts` (sửa không cần migrate).
- [x] (chưa test) Backend: `BadgesService.evaluate` sau khi hoàn thành bài (`path.complete` trả thêm `newBadges`) và khi kết bạn; `GET /badges` trao nốt huy hiệu còn thiếu và trả tiến độ; tạo thông báo khi nhận huy hiệu.
- [x] (chưa test) Mobile: màn `badges` (lưới huy hiệu, tiến độ), chip "Huy hiệu mới" ở màn kết quả bài, dòng "Huy hiệu" trong Profile.

## Phase 9: AI sửa câu viết
- [x] (chưa test) Backend: `POST /ai/correct-writing`: giới hạn 20 lượt/ngày, cache, ép kết quả về đúng schema (`corrected`, `better`, `score`, `summaryVi`, `mistakes[]`), chặn chỉ dẫn lọt vào từ văn bản người dùng; không ghi vào dữ liệu học.
- [x] (chưa test) Mobile: màn `writing` (nút "Sửa câu" ở tab Gia sư AI): điểm, câu đã sửa, danh sách lỗi kèm giải thích tiếng Việt, gợi ý viết hay hơn.

## Việc còn lại
- [ ] **Kiểm thử toàn bộ** các mục "(chưa test)" ở trên, ưu tiên luồng cốt lõi: nộp bài (XP, streak, khóa/mở), Phase 4 (ngữ pháp, Checkpoint), video, kết bạn và bảng xếp hạng.
- [ ] Cấu hình để nhận push thật (xem Phase 2).
- [ ] Dashboard admin để nhập nội dung (video, bài ngữ pháp, từ vựng) thay cho seed script.

## Để sau
Hearts/mạng, freeze streak. Cải tiến sau khi test xong: video quiz phát lại đúng đoạn clip trên từng câu; tra nghĩa theo ngữ cảnh cả câu (hiện `/ai/explain` chỉ nhận từ đơn); nút đổi mã bạn bè, chặn người dùng, giới hạn số lần thử mã; cấp huy hiệu ngay trong lúc ôn tập (hiện chỉ cấp khi hoàn thành bài, kết bạn hoặc mở màn Huy hiệu); cộng XP/huy hiệu cho luyện viết; đưa video thành mục riêng thay vì unit đầu lộ trình.
