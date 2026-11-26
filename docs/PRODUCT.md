# Wordtopia: nghiệp vụ sản phẩm

Đặt tại `docs/PRODUCT.md`. Trạng thái từng mục xem `docs/ROADMAP.md`: các mục ghi **(đề xuất)** trong tài liệu này đều đã được viết code (phần lớn chưa test); các tính năng thêm sau cùng (video, bạn bè và bảng xếp hạng, huy hiệu, sửa câu viết, push) nằm ở §12-§16. Điều chỉnh được khi bắt tay làm.

## 1. Tham khảo từ các app mẫu
| App | Cấu trúc | Học và kiểm tra |
|---|---|---|
| Duolingo | Section → Unit → Lesson (~10 câu) | Không tách: học bằng cách làm bài. Có Unit test/Checkpoint, Practice (ôn), Placement test. |
| Busuu | Course → Unit → Lesson (từ vựng → ngữ pháp → hội thoại → viết/nói) | Mỗi unit có Review và bài kiểm tra cuối. Có ôn từ vựng bằng SRS. |
| Quizlet | Set thẻ từ, không có lộ trình | Tách theo chế độ: Flashcards, Learn, Match, Test. |
| Cake | Clip ngắn, mỗi clip vài câu | Xem clip → lưu câu → luyện nói lặp lại. |

Wordtopia chọn: **lộ trình kiểu Duolingo + tự học kiểu Quizlet**.

## 2. Bốn loại màn chơi / chế độ học
| Loại | Mục đích | Trạng thái |
|---|---|---|
| **Lesson** (học mới) | Giới thiệu từ/ngữ pháp rồi luyện tập có phản hồi từng câu. Học và kiểm tra gộp, qua bài thì mở bài sau. | Có (từ vựng, ngữ pháp, video; ngữ pháp và video chưa test) |
| **Checkpoint** (kiểm tra cuối unit) | Kiểm tra tổng hợp, không gợi ý, chấm cuối bài, qua mới mở unit sau. | Có (đã code, chưa test) |
| **Review** (ôn tập SRS) | Ôn từ đến hạn theo ngắt quãng. | Có (flashcard tự đánh giá). Đã sửa lỗi lọc từ Lesson (chưa test) |
| **Free study** (theo deck) | Bộ từ do user tự tạo / AI tạo: flashcard, quiz, yêu thích. | Có |

## 3. Vòng lặp học của user
1. Mở app → (lần đầu) khảo sát mục tiêu → **test đầu vào** (có thể bỏ qua).
2. Home hiện: streak, mục tiêu hôm nay, số từ cần ôn, nút "Tiếp tục bài".
3. Học Lesson theo lộ trình → nhận sao, XP, hiệu ứng.
4. Từ sai/đến hạn xuất hiện trong Review.
5. Cuối unit làm Checkpoint → mở unit sau.
6. Hỏi Wordie / tra từ khi vướng. Thông báo kéo user quay lại mỗi ngày.

## 4. Test đầu vào (placement)
- Hiện có: 10 câu từ vựng (4 BEGINNER, 3 INTERMEDIATE, 3 ADVANCED), xếp level theo ngưỡng đúng.
- Hiện tại: sau survey chuyển thẳng sang test; bỏ qua thì vào Home với level BEGINNER và thẻ test vẫn hiện ở tab Lộ trình. **(đề xuất)** thêm `POST /path/placement/skip` đặt `onboarded = true` để ẩn thẻ, và gửi câu "tự đánh giá trình độ" của survey lên server (hiện chỉ lưu local).
- **(đề xuất)** Cho làm lại ở Profile. Khi có ngữ pháp thì thêm vài câu ngữ pháp vào test.
- Kết quả đổi `User.level`. Lesson thuộc level thấp hơn được mở sẵn, bắt đầu từ lesson đầu của level đã xếp.

## 5. Lesson
- **Vocab Lesson** (hiện tại): intro từ mới → bài tập sinh runtime từ `Word`. Các loại: ghép cặp, chọn nghĩa, nghe chọn từ, điền chỗ trống, sắp xếp câu, đồng nghĩa, gõ từ.
- **Grammar Lesson (đề xuất)**: (1) thẻ giải thích ngắn tiếng Việt + ví dụ, (2) bài tập ngữ pháp có sẵn nội dung (không sinh từ `Word`), mỗi câu có `explanationVi` hiện khi sai. Loại bài: chọn đáp án điền chỗ trống, chọn câu đúng, sắp xếp câu, dịch chọn đáp án.
- Chấm: sao 3 (≥90%), 2 (≥70%), 1 (≥50%). Qua bài khi ≥1 sao (xem lại ngưỡng khi có Checkpoint).
- Câu sai: hiện đáp án đúng và giải thích. **(tùy chọn)** đưa câu sai xuống cuối bài để làm lại.

## 6. Checkpoint (đề xuất)
- Là Lesson cuối của mỗi Unit, `type = CHECKPOINT`, thay cho node trophy trang trí hiện tại.
- Câu hỏi lấy mẫu từ toàn bộ từ/ngữ pháp trong unit. Không gợi ý, không báo đúng/sai từng câu, xem kết quả ở cuối.
- Đạt ≥70% thì mở unit sau. Không đạt thì xem danh sách từ sai và làm lại được.

## 7. SRS (ôn tập ngắt quãng)
- Hộp Leitner: `level` 0-5, `INTERVAL_DAYS = [0,1,2,4,7,15]`. Đúng thì lên 1 level, sai thì về 0 (đến hạn ngay).
- Mọi nguồn (Lesson, Quiz, Review) đều gọi `study.applyReview`, nên một từ chỉ có một trạng thái SRS.
- "Cần ôn" = từ có `nextReviewAt <= now`. "Đã thuộc" = level ≥4.
- Phiên Review phải gồm cả từ thuộc Lesson (xem lỗi #1 trong CLAUDE.md §7).

## 8. Gamification
**Streak**
- Ngày tính theo giờ VN. Ngày được tính khi user hoàn thành ít nhất 1 lượt học/ôn từ.
- Học liên tiếp thì +1; bỏ lỡ ≥1 ngày thì reset.
- **(đề xuất)** API trả thêm: `studiedToday`, `streakIncreased` (sau khi nộp bài), `streakLost: { previous }` (khi vào app sau ngày bị lỡ, kèm cách "xác nhận đã xem" để chỉ hiện hiệu ứng một lần).
- Hiệu ứng: đạt streak mỗi ngày (kèm mốc 3/7/14/30/100), mất streak khi vào app. Dùng Reanimated (và Lottie nếu muốn).

**Mục tiêu ngày**: `dailyGoal` là số từ (học mới + ôn) từ `StudyLog`. Đạt thì hiệu ứng ăn mừng và một thông báo trong app.

**XP (đề xuất)**: `User.xp`, `StudyLog.xp`. Gợi ý: hoàn thành Lesson 10 + 5 mỗi sao; mỗi từ đúng ở Review/Quiz +2; đạt mục tiêu ngày +10. Chỉnh tại một hằng số trong backend.

**Phản hồi từng câu (client)**: `FeedbackBar` đã có haptic, sfx và chữ cố định "Chính xác!". Nâng cấp: câu đúng hiện lời khen ngẫu nhiên ("Tuyệt vời!", "Chuẩn rồi!"), kèm combo khi đúng 3, 5, 10 câu liên tiếp, kèm sfx/haptic. Câu sai hiện đáp án và giải thích. Chỉ làm ở client (`FeedbackBar`).

**Bảng xếp hạng và huy hiệu**: đã làm, xem §13 và §14.

**Hoãn lại (để sau)**: hearts/mạng, freeze streak. Khi làm XP và streak nên chừa chỗ để các tính năng này gắn thêm.

## 9. Thông báo
**Trong app (đề xuất)**: chuông ở Home có badge số chưa đọc, màn danh sách thông báo.
- Model `Notification { userId, type, title, body, data(Json), readAt, createdAt }`.
- Loại: `STREAK_MILESTONE`, `STREAK_LOST`, `DAILY_GOAL_DONE`, `REVIEW_DUE`, `SYSTEM`.
- API: `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.

**Push ngoài app (đề xuất)**: lưu `PushToken { userId, token, platform }` (`POST /devices`). Server gửi qua Expo Push API, chạy theo lịch (`@nestjs/schedule`):
- Nhắc học theo giờ user chọn (lưu `User.reminderHour` trên server), **bỏ qua nếu hôm nay đã học**.
- Cảnh báo "sắp mất streak" buổi tối nếu `streak > 0` và chưa học hôm nay.
- Nhắc ôn khi có nhiều từ đến hạn.
- Local reminder hiện tại (`lib/reminder.ts`) giữ làm phương án dự phòng cho đến khi push chạy ổn.
- Trạng thái: đã code, chưa test (cần dev build/APK, EAS projectId, FCM). Chi tiết ở §16.

## 10. AI hỗ trợ học
Đã có: `explain` (điền thông tin từ), `generate-deck`, `chat` Wordie. Đề xuất:
1. **"Vì sao sai?"**: sau câu sai, nút gọi AI giải thích ngắn tiếng Việt. Endpoint `POST /ai/explain-mistake`, cache theo (câu, đáp án chọn).
2. **Tra cứu từ** (`lookup.tsx`): đã có nghĩa, ví dụ, nút lưu vào deck. Bổ sung: phân biệt từ gần nghĩa.
3. **Tạo bộ từ theo chủ đề**: giữ nguyên.
4. **Chat có ngữ cảnh**: system prompt kèm trình độ user, vài từ vừa sai/đến hạn. Có chế độ roleplay theo tình huống (gọi món, phỏng vấn), sửa lỗi ngữ pháp nhẹ nhàng, ưu tiên từ đang học.
5. **Sửa câu viết**: user viết câu, AI chấm và gợi ý bản tốt hơn. Đã code, chưa test (§15).
- Ràng buộc: giới hạn lượt/ngày/user, cache khi có thể, bắt lỗi 429 và hiển thị thân thiện, ép trả JSON và kiểm tra schema, không để AI đổi dữ liệu học trực tiếp.
- AI chỉ hỗ trợ giải thích và luyện tập, **không thay** việc chấm đúng/sai của hệ thống.

## 11. Sẵn sàng cho video (chưa làm video)
- Thêm cột nullable `mediaUrl` / `mediaType` cho `Lesson` và `Exercise` khi cần. Bài tập lưu dạng `{ type, payload(Json) }`.
- Thêm video = thêm `type: 'video'` (xem clip) hoặc `'video_quiz'` (xem rồi trả lời), không đổi cấu trúc lộ trình/tiến độ.
- Client phải có **fallback cho type lạ** (hiện đang `return null` gây kẹt, xem CLAUDE.md §7 #3; đã thêm nút "Bỏ qua").
- Bước đầu đã làm (video học và video quiz): xem §12.

## 12. Video học (đã code, chưa test)
- **Cấu trúc**: `Lesson.type = VIDEO`, có 1 Exercise `type = 'video'` (`mediaUrl` + `payload.subtitles` dạng `[{ start, end, en, vi }]`), theo sau là 0 hoặc nhiều câu trắc nghiệm `grammar_choice` (video quiz).
- **Nhập nội dung**: bằng seed, chưa có dashboard. Soạn `backend/prisma/seed/video-data.json` rồi chạy `npm run seed:video` (chạy lại nhiều lần được). Video upload lên Cloudinary; file `.ogv` đổi đuôi thành `.mp4` ở URL để Cloudinary tự chuyển định dạng.
- **Vị trí**: unit "Học qua video" (BEGINNER, `order = 0`) ở đầu lộ trình, nên người dùng BEGINNER phải qua video trước khi tới bài thường.
- **Màn học** (`expo-video`): phụ đề Anh-Việt chạy theo thời gian, chạm câu để tua tới đó, lặp câu, bật/tắt phụ đề Việt. Chạm một từ thì video tạm dừng, hiện khung tra nghĩa (`/ai/explain`) và cho lưu vào bộ từ.
- **Hoàn thành**: xem ≥90% hoặc hết clip thì hiện nút Hoàn thành. Nếu có quiz thì clip không tính điểm, chấm như Lesson thường (sao theo %). Bài VIDEO/GRAMMAR gọi `study.markStudied` để vẫn tính streak.
- **Chưa có**: quiz phát lại đúng đoạn clip trên từng câu, tra nghĩa theo ngữ cảnh cả câu, dashboard nhập nội dung.
- **Video demo**: "CSBS Alice Wiegand.ogv" của Alice Wiegand, giấy phép CC BY-SA 3.0, qua Wikimedia Commons. Phụ đề Anh theo TimedText của clip, phụ đề Việt do nhóm dịch.

## 13. Bảng xếp hạng và bạn bè (đã code, chưa test)
- **Bảng xếp hạng**: `GET /leaderboard?period=week|all&scope=all|friends`. Tuần tính từ thứ Hai theo giờ VN, cộng `StudyLog.xp`; "Tất cả" dùng `User.xp`. Hiện top 20 và hạng của người xem; bằng XP thì tài khoản cũ hơn xếp trước. Bảng bạn bè luôn gồm bạn và những người đã chấp nhận, kể cả người 0 XP.
- **Kết bạn bằng mã**: mỗi người có mã `WT-XXXXXX` (6 ký tự ngẫu nhiên từ 32 ký tự, dùng `crypto.randomInt`, bỏ `0/O/1/I`), tạo khi mở màn Bạn bè lần đầu. Không dùng email hay tên để tìm.
- **Lời mời hai chiều**: gửi lời mời, người kia chấp nhận mới thành bạn (`Friendship` PENDING → ACCEPTED). Hai bên cùng nhập mã của nhau thì tự thành bạn. Có thể từ chối, hủy lời mời đã gửi, xóa bạn. Lời mời và lời chấp nhận tạo thông báo trong app.
- **Riêng tư**: bảng chung hiện tên và avatar của mọi người. Công tắc "Ẩn khỏi bảng xếp hạng chung" (`User.hideFromLeaderboard`) ẩn người dùng khỏi bảng chung nhưng bạn bè vẫn thấy trong bảng bạn bè.
- **Chưa có**: đổi mã bạn bè, chặn người dùng, giới hạn số lần thử mã, nhắc bạn học bằng push.

## 14. Huy hiệu (đã code, chưa test)
- **Danh mục** 18 huy hiệu ở `backend/src/badges/badges.catalog.ts` (mỗi huy hiệu có `metric` và `target`), sửa không cần migrate: bài học hoàn thành (1/10/30), 3 sao (1/10), streak (3/7/30), từ đã học (50/200/500), từ đã thuộc (25/100), XP (500/2000), bài video, Checkpoint, bạn bè.
- **Lưu**: bảng `UserBadge` (`userId`, `badgeKey`, `earnedAt`).
- **Khi nào cấp**: sau khi hoàn thành bài (`path.complete` trả thêm `newBadges`), khi kết bạn, và khi mở màn Huy hiệu (`GET /badges` trao nốt huy hiệu đạt được từ ôn tập, streak). Không cấp ngay lúc ôn từng thẻ để khỏi làm chậm.
- Mỗi huy hiệu mới tạo một thông báo trong app. Màn Huy hiệu hiện lưới huy hiệu, cái chưa nhận mờ kèm tiến độ.

## 15. AI sửa câu viết (đã code, chưa test)
- `POST /ai/correct-writing` nhận đoạn tiếng Anh (tối đa 600 ký tự), trả `corrected` (bản sửa tối thiểu), `better` (bản viết tự nhiên hơn, nếu có), `score` (0-10), `summaryVi`, `mistakes[]` (`original`, `fix`, `explanationVi`).
- Ràng buộc như §10: giới hạn 20 lượt/ngày/người, cache theo nội dung, kết quả ép về đúng schema (không tin nguyên văn AI), văn bản người dùng được bọc thẻ và AI được dặn không làm theo chỉ dẫn trong đó. AI chỉ chấm và gợi ý, không ghi vào dữ liệu học.
- Vào từ tab Gia sư AI, nút "Sửa câu". Chưa cộng XP hay huy hiệu cho luyện viết.

## 16. Push từ server (đã code, chưa test)
- **API**: `POST /devices` (lưu token), `POST /devices/unregister` (khi đăng xuất), `PATCH /devices/reminder` (giờ nhắc, `null` là tắt), `POST /devices/test` (gửi thử cho chính mình).
- **Lịch** (`@nestjs/schedule`, chạy đầu mỗi giờ theo giờ VN): nhắc học đúng giờ người dùng chọn (bỏ qua nếu hôm nay đã học); 20:00 cảnh báo sắp mất streak (có streak, hôm qua đã học, hôm nay chưa; không gửi nếu vừa nhắc học); 9:00 nhắc ôn khi có từ 10 từ đến hạn trở lên.
- **Chống gửi trùng**: mỗi loại push chỉ gửi 1 lần/ngày/người, kiểm tra bằng `Notification.data.pushKind`. Mỗi push cũng tạo một dòng trong chuông thông báo.
- **Mobile**: đăng ký token khi đã có quyền (hộp xin quyền chỉ hiện khi bật nhắc ở màn "Nhắc học hằng ngày"); bật push thành công thì hủy nhắc local để khỏi báo trùng; bấm thông báo mở đúng màn hình.
- **Điều kiện để nhận thật**: dev build/APK (Expo Go không nhận được push), EAS projectId (`eas init`), cấu hình FCM cho Android (`google-services.json` và khóa FCM V1 trên EAS), backend chạy liên tục. iOS cần tài khoản Apple Developer.

## 17. Ngoài phạm vi hiện tại
Hearts/mạng, freeze streak, dashboard admin để nhập nội dung, thanh toán, chặn người dùng, chat giữa bạn bè.
