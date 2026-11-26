# Wordtopia: prompt tổng quan cho Claude

> Đọc file này trước, rồi `docs/PRODUCT.md` (nghiệp vụ) và `docs/ROADMAP.md` (kế hoạch).
> Viết ngày 06/11/2026 từ source đã đọc. Code có thể đã đổi: luôn đối chiếu source thật trước khi kết luận.

## 1. Dự án là gì
App học tiếng Anh cho người Việt, mọi trình độ. Mobile (Expo / React Native) + API (NestJS). Đồ án môn Lập trình thiết bị di động.

- Mô hình học: **lộ trình kiểu Duolingo** (Unit → Lesson → bài tập) + **tự học kiểu Quizlet** (bộ từ/deck, flashcard, quiz) + **gia sư AI** (Wordie, Gemini).
- Nội dung: từ vựng **kết hợp ngữ pháp**. Hiện **mới có từ vựng**, ngữ pháp chưa có.
- Gamification: streak, mục tiêu ngày, XP, hiệu ứng, thông báo.
- Chưa có video. Thiết kế để sau này gắn video không phải đổi cấu trúc (xem PRODUCT.md §9).
- Hoãn lại (làm sau): hearts/mạng, freeze streak, bảng xếp hạng.

## 2. Quy tắc làm việc với người dùng
- Trả lời **ngắn gọn bằng tiếng Việt**, ít giải thích, đi thẳng vào việc.
- Thay đổi **nhỏ, tập trung đúng yêu cầu**. Không refactor lan man, không đổi file không liên quan.
- Tên code, field, endpoint, commit: tiếng Anh. Chữ hiển thị trên UI: tiếng Việt.
- Đọc code thật trước khi sửa. Không giả định file/hàm tồn tại.
- Prisma: tạo migration mới, không sửa migration cũ.
- Bỏ qua mọi file `*.bak*` (rác, nên xóa và thêm vào `.gitignore`).

## 3. Tech stack
- Mobile: Expo SDK 58, React Native, Expo Router, Tamagui, TanStack Query, Zustand, Reanimated, expo-notifications, expo-secure-store.
- Backend: NestJS, Prisma, PostgreSQL, JWT, Cloudinary (avatar), Google Gemini (`GEMINI_MODEL`, mặc định `gemini-2.5-flash-lite`).
- Chạy: xem `README.md`. Backend `npm run start:dev` (cổng 3000), mobile `npx expo start -c`.
- Seed: `cd backend && npm run seed` (script `prisma/seed/seed.ts`). Máy dev dùng Windows PowerShell 5.1.
- Đã cài: `expo-notifications`, `expo-device`, `react-native-reanimated`. **Chưa có**: `@nestjs/schedule` (cần cho cron push), Lottie, `@nestjs/throttler`.

## 4. Cấu trúc source
```
backend/src/  auth, users, words, decks, study, quiz, path, stats, ai, password-reset, prisma, common
backend/prisma/schema.prisma, seed/seed.ts
mobile/src/   app/ (Expo Router), api/, components/, hooks/, lib/, store/, theme/, types/, utils/
```
Mobile routes chính: `(tabs)/{home,path,decks,chat,profile}`, `lesson/[id]`, `placement`, `review` (= `study`), `quiz`, `reminder`, `lookup`, `favorites`, `survey`, `word-form`, `deck/[id]`, `(auth)/*`.

## 5. Domain model (Prisma)
- `User`: level (BEGINNER/INTERMEDIATE/ADVANCED), dailyGoal (số từ/ngày), onboarded, streak, longestStreak, lastStudyAt, goalType.
- `Unit` (level, order, title, titleVi, emoji) → `Lesson` (order, title) → `Word`.
- `LessonProgress` (userId, lessonId): stars, bestScore, attempts, completedAt.
- `Word`: term, meaning, phonetic, partOfSpeech, example, exampleMeaning, synonym, imageUrl. Thuộc `Deck` (deckId) **hoặc** `Lesson` (lessonId).
- `Deck`: bộ từ công khai (seed) hoặc riêng của user (tạo tay / AI).
- `Progress` (userId, wordId): SRS Leitner (`level` 0-5, `nextReviewAt`), correctCount, wrongCount, isFavorite.
- `StudyLog` (userId, date): wordsLearned, wordsReview, minutes. Nguồn cho mục tiêu ngày và biểu đồ.
- `QuizAttempt` (quiz theo deck), `ChatMessage` (lịch sử chat AI), `PasswordReset`.
- Đã có `Notification`, `PushToken`, `User.reminderHour` (migration `add_notifications`). **Chưa có**: Grammar/Exercise lưu DB. XP đã có (`User.xp`, `StudyLog.xp`, hằng số `XP` ở `study.service.ts`). DB dev là Neon (cloud) nên migration áp thẳng lên đó.
- Dữ liệu hiện có (DB local, 06/11): 50 Unit (20 BEGINNER, 19 INTERMEDIATE, 11 ADVANCED), 200 Lesson (~5 từ/lesson), 999 từ Lesson (`deckId = null`, có `synonym`, `exampleSource`, `imageUrl` đang null). Câu ví dụ từ Tatoeba (CC BY 2.0 FR) nên cần ghi nguồn.

## 6. Các luồng đã có (đã đọc code)
**Lộ trình** (`path.service.ts`, `app/(tabs)/path.tsx`, `lesson/[id].tsx`)
- Khóa tuần tự theo thứ tự level → unit → lesson. Level thấp hơn trình độ user thì mở sẵn.
- Một Lesson = **học và kiểm tra gộp** (kiểu Duolingo): (1) màn giới thiệu các từ mới, (2) chuỗi bài tập sinh **lúc runtime** từ `Word` trong `buildExercises`, (3) nộp kết quả.
- Loại bài tập: `match_pairs`, `choose_meaning`, `listen_choose`, `fill_blank`, `order_sentence`, `synonym`, `type_word`. Phản hồi từng câu nằm ở `FeedbackBar` (`components/exercises/ui.tsx`): haptic + sfx (`lib/sfx.ts`), lời khen ngẫu nhiên và combo (`lib/praise.ts`), câu sai hiện đáp án.
- Chấm điểm (`complete`): sao 3 nếu ≥90, 2 nếu ≥70, 1 nếu ≥50, 0 nếu thấp hơn. Qua bài khi sao ≥1. Mỗi từ gọi `study.applyReview` (cập nhật SRS, StudyLog, streak).
- Chưa có màn kiểm tra riêng (unit test). Icon trophy/chest trên `path.tsx` hiện chỉ là trang trí.

**Placement** (`placement.tsx`, `path.service.ts`): 10 câu chọn nghĩa của từ (4 BEGINNER, 3 INTERMEDIATE, 3 ADVANCED). Xếp ADVANCED nếu đúng ≥2 ở advanced và ≥2 ở intermediate; INTERMEDIATE nếu đúng ≥2 ở intermediate và ≥3 ở beginner; còn lại BEGINNER. Chỉ kiểm tra từ vựng. Luồng: đăng ký → `survey.tsx` (mục đích, tự đánh giá trình độ, mục tiêu/ngày; chỉ `dailyGoal` được gửi server, hai câu còn lại chỉ lưu local ở `store/survey`) → `/placement`. "Bỏ qua" ở survey vào thẳng Home. Nếu chưa làm test (`onboarded === false`) thì tab Lộ trình hiện thẻ "Làm bài test". Thoát test bằng ✕ vẫn giữ level mặc định BEGINNER.

**SRS** (`study.service.ts`): hộp Leitner, `INTERVAL_DAYS = [0,1,2,4,7,15]`. Đúng thì level+1 (tối đa 5), sai thì về 0. "Đã thuộc" khi level ≥4.

**Streak / thống kê** (`study.service.ts#touchDaily`, `stats.service.ts`): ngày tính theo giờ VN (`vnDate`). Bất kỳ `applyReview` nào cũng tính là đã học trong ngày. Cách cập nhật streak:
- Cách ngày liền trước thì streak+1.
- Cách hơn 1 ngày thì streak về 1.
- Cùng ngày thì giữ nguyên.
- `overview` trả streak = 0 nếu đã bỏ lỡ.

**Nhắc học** (`lib/reminder.ts`): chỉ là local notification lặp hằng ngày (expo-notifications), nội dung tĩnh. Không có push từ server. Đã có chuông + màn thông báo trong app (module `notifications`).

**AI** (`ai.service.ts`): `explain` (điền thông tin từ), `generate-deck` (tạo bộ từ theo chủ đề), `chat` (gia sư Wordie, 10 tin gần nhất, trả lời chủ yếu tiếng Việt). Chat chưa biết trình độ hay từ đang học của user. `lookup.tsx` (tra từ qua `/ai/explain`) đã có nút thêm từ vào deck của user; `chat.tsx` có gợi ý câu hỏi cố định và nút "Tra từ".

## 7. Điểm nghi vấn / lỗi cần xác minh
1. (Đã sửa) `accessibleWords` ở `common/word-access.ts` cho từ Lesson đã học vào phiên ôn; `stats.dueToday` dùng chung điều kiện này.
2. (Đã xong) `stats.overview` trả `streakLost`; Home hiện hiệu ứng rồi gọi `POST /study/streak-lost/ack`.
3. (Đã sửa) `ExerciseView` có fallback "Bỏ qua" cho type lạ; từ của bài bị bỏ qua mặc định tính đúng.
4. Bỏ qua placement thì `onboarded` vẫn false, thẻ test luôn hiện ở tab Lộ trình (chưa có endpoint skip).
5. `reminder.ts` gọi `cancelAllScheduledNotificationsAsync()` (hủy mọi lịch). Nhắc học không biết user đã học hôm nay chưa. Không chạy trong Expo Go.
6. Ngưỡng qua bài là ≥50% (khá dễ). Xem lại khi thêm checkpoint.
7. (Đã sửa) Lộ trình nạp bằng `npm run seed:path` từ `prisma/seed/path-data.json`. `seed.ts` chỉ seed Deck.
8. (Đã sửa, chưa test) `words.service#search` tìm được cả từ thuộc Lesson (`deck` có thể null).
9. `npx tsc --noEmit` ở `mobile/` báo **332 lỗi có sẵn** (06/11), phần lớn do type Tamagui chưa được khai báo (prop `backgroundColor`, `alignItems`, `color`... bị báo sai), thêm `StyleSheet.absoluteFillObject` trong `FlipCard.tsx` (RN 0.88 không còn type này) và `Voice.notInstalled` trong `utils/speak.ts`. App vẫn chạy bình thường. **Đừng dùng tsc mobile làm tiêu chí đạt**; dùng `tsc` backend (phải sạch) và chạy thử app. Khi sửa file mobile, không cần sửa các lỗi này trừ khi được yêu cầu.

## 8. Cách thêm một loại bài tập mới (hiện tại)
1. Backend: thêm builder trong `PathService.buildExercises` (trả object `{ id, type, wordId, ... }`).
2. Mobile: thêm vào union `Exercise` ở `types/lesson.ts`.
3. Mobile: thêm `case` trong `ExerciseView.tsx`, gọi `onDone([{ wordId, correct }])`.

## 9. Chưa đọc (kiểm tra trước khi sửa vùng liên quan)
`decks.tsx`, `(auth)/*`, `personal-info.tsx`, `favorites.tsx`, `word-form.tsx`, `api/*` còn lại, `auth` service, `.env.example`.
Đã đọc thêm ngày 06/11: `ui.tsx`, `sfx.ts`, `lookup.tsx`, `survey.tsx`, `chat.tsx`, `profile.tsx`, `api/path.ts`, hooks, `store/auth.ts`, DTO path/study, `date.util.ts`, `words.service.ts`, `decks.service.ts`, `package.json` hai phía, `prisma.config.ts`.

## 10. Quy trình khi nhận một task
1. Đọc đúng file liên quan (mục 4, 9), xác minh giả định.
2. Đối chiếu `docs/ROADMAP.md` xem task thuộc phase nào, tuân thủ quy ước ở `docs/PRODUCT.md`.
3. Sửa tối thiểu. Có đổi schema thì tạo migration mới. Cập nhật tài liệu nếu đổi nghiệp vụ.
4. Báo ngắn: đã đổi file nào, cách kiểm tra.