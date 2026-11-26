export type BadgeMetric =
  | 'lessonsDone'
  | 'threeStars'
  | 'videosDone'
  | 'checkpoints'
  | 'wordsLearned'
  | 'mastered'
  | 'streak'
  | 'xp'
  | 'friends';

export interface BadgeDef {
  key: string;
  emoji: string;
  title: string;
  description: string;
  metric: BadgeMetric;
  target: number;
}

// Thêm/sửa huy hiệu tại đây (không cần đổi database): đủ `metric` >= `target` là nhận.
export const BADGES: BadgeDef[] = [
  { key: 'FIRST_LESSON', emoji: '🎯', title: 'Bước đầu tiên', description: 'Hoàn thành bài học đầu tiên', metric: 'lessonsDone', target: 1 },
  { key: 'LESSONS_10', emoji: '📚', title: 'Chăm chỉ', description: 'Hoàn thành 10 bài học', metric: 'lessonsDone', target: 10 },
  { key: 'LESSONS_30', emoji: '🏫', title: 'Học bá', description: 'Hoàn thành 30 bài học', metric: 'lessonsDone', target: 30 },
  { key: 'STARS_3', emoji: '⭐', title: 'Hoàn hảo', description: 'Đạt 3 sao ở một bài học', metric: 'threeStars', target: 1 },
  { key: 'STARS_3_X10', emoji: '🌟', title: 'Ngôi sao', description: 'Đạt 3 sao ở 10 bài học', metric: 'threeStars', target: 10 },
  { key: 'STREAK_3', emoji: '🔥', title: 'Giữ lửa', description: 'Học 3 ngày liên tiếp', metric: 'streak', target: 3 },
  { key: 'STREAK_7', emoji: '⚡', title: 'Một tuần bền bỉ', description: 'Học 7 ngày liên tiếp', metric: 'streak', target: 7 },
  { key: 'STREAK_30', emoji: '👑', title: 'Vua kiên trì', description: 'Học 30 ngày liên tiếp', metric: 'streak', target: 30 },
  { key: 'WORDS_50', emoji: '🌱', title: 'Mầm non', description: 'Học 50 từ', metric: 'wordsLearned', target: 50 },
  { key: 'WORDS_200', emoji: '🌿', title: 'Vốn từ lớn dần', description: 'Học 200 từ', metric: 'wordsLearned', target: 200 },
  { key: 'WORDS_500', emoji: '🌳', title: 'Cây đại thụ', description: 'Học 500 từ', metric: 'wordsLearned', target: 500 },
  { key: 'MASTERED_25', emoji: '🧠', title: 'Trí nhớ tốt', description: 'Thuộc 25 từ', metric: 'mastered', target: 25 },
  { key: 'MASTERED_100', emoji: '🏆', title: 'Bậc thầy từ vựng', description: 'Thuộc 100 từ', metric: 'mastered', target: 100 },
  { key: 'XP_500', emoji: '💎', title: 'Tích lũy', description: 'Đạt 500 XP', metric: 'xp', target: 500 },
  { key: 'XP_2000', emoji: '💫', title: 'Kinh nghiệm dày dạn', description: 'Đạt 2000 XP', metric: 'xp', target: 2000 },
  { key: 'VIDEO_1', emoji: '🎬', title: 'Mọt phim', description: 'Hoàn thành một bài học qua video', metric: 'videosDone', target: 1 },
  { key: 'CHECKPOINT_1', emoji: '🚩', title: 'Vượt ải', description: 'Qua bài kiểm tra cuối chặng', metric: 'checkpoints', target: 1 },
  { key: 'FRIEND_1', emoji: '🤝', title: 'Có bạn đồng hành', description: 'Kết bạn với một người', metric: 'friends', target: 1 },
];
