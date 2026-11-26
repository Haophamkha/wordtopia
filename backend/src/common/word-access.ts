// Từ user được phép ôn: từ deck công khai/của user, hoặc từ Lesson user đã học.
export function accessibleWords(userId: number) {
  return {
    AND: [
      {
        OR: [
          { deck: { OR: [{ isPublic: true }, { ownerId: userId }] } },
          { lessonId: { not: null }, progress: { some: { userId } } },
        ],
      },
    ],
  };
}