import 'dotenv/config';
import { Difficulty, PartOfSpeech as P, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// [term, phonetic, partOfSpeech, meaning, example, exampleMeaning]
type W = [string, string, P, string, string, string];

const decks: {
  title: string; description: string; topic: string; emoji: string; difficulty: Difficulty; words: W[];
}[] = [
  {
    title: 'Daily Life', description: 'Từ vựng cho sinh hoạt hằng ngày', topic: 'Daily Life', emoji: '🏠', difficulty: 'BEGINNER',
    words: [
      ['wake up', '/weɪk ʌp/', 'VERB', 'thức dậy', 'I wake up at 6 a.m.', 'Tôi thức dậy lúc 6 giờ sáng.'],
      ['breakfast', '/ˈbrekfəst/', 'NOUN', 'bữa sáng', 'I eat breakfast with my family.', 'Tôi ăn sáng cùng gia đình.'],
      ['neighbor', '/ˈneɪbər/', 'NOUN', 'hàng xóm', 'My neighbor is very friendly.', 'Hàng xóm của tôi rất thân thiện.'],
      ['bedroom', '/ˈbedruːm/', 'NOUN', 'phòng ngủ', 'My bedroom is on the second floor.', 'Phòng ngủ của tôi ở tầng hai.'],
      ['tired', '/ˈtaɪərd/', 'ADJECTIVE', 'mệt mỏi', 'I feel tired after work.', 'Tôi thấy mệt sau giờ làm.'],
      ['usually', '/ˈjuːʒuəli/', 'ADVERB', 'thường xuyên', 'I usually go to bed at 11 p.m.', 'Tôi thường đi ngủ lúc 11 giờ đêm.'],
      ['clean', '/kliːn/', 'VERB', 'dọn dẹp', 'She cleans the house every weekend.', 'Cô ấy dọn nhà mỗi cuối tuần.'],
      ['weekend', '/ˈwiːkend/', 'NOUN', 'cuối tuần', 'What do you do on weekends?', 'Bạn làm gì vào cuối tuần?'],
    ],
  },
  {
    title: 'Food & Drink', description: 'Ăn uống và gọi món', topic: 'Food', emoji: '🍜', difficulty: 'BEGINNER',
    words: [
      ['delicious', '/dɪˈlɪʃəs/', 'ADJECTIVE', 'ngon', 'This soup is delicious.', 'Món súp này rất ngon.'],
      ['vegetable', '/ˈvedʒtəbəl/', 'NOUN', 'rau củ', 'You should eat more vegetables.', 'Bạn nên ăn nhiều rau củ hơn.'],
      ['spicy', '/ˈspaɪsi/', 'ADJECTIVE', 'cay', 'I cannot eat spicy food.', 'Tôi không ăn được đồ cay.'],
      ['order', '/ˈɔːrdər/', 'VERB', 'gọi món', 'Are you ready to order?', 'Bạn đã sẵn sàng gọi món chưa?'],
      ['bill', '/bɪl/', 'NOUN', 'hóa đơn', 'Can I have the bill, please?', 'Cho tôi xin hóa đơn nhé.'],
      ['recipe', '/ˈresəpi/', 'NOUN', 'công thức nấu ăn', 'This recipe is easy to follow.', 'Công thức này dễ làm theo.'],
      ['hungry', '/ˈhʌŋɡri/', 'ADJECTIVE', 'đói', 'I am so hungry right now.', 'Bây giờ tôi đói quá.'],
      ['beverage', '/ˈbevərɪdʒ/', 'NOUN', 'đồ uống', 'What beverage would you like?', 'Bạn muốn uống gì?'],
    ],
  },
  {
    title: 'Travel Essentials', description: 'Từ vựng khi đi du lịch', topic: 'Travel', emoji: '✈️', difficulty: 'INTERMEDIATE',
    words: [
      ['luggage', '/ˈlʌɡɪdʒ/', 'NOUN', 'hành lý', 'Please check your luggage here.', 'Vui lòng gửi hành lý của bạn ở đây.'],
      ['itinerary', '/aɪˈtɪnəreri/', 'NOUN', 'lịch trình', 'Our itinerary includes three cities.', 'Lịch trình của chúng tôi gồm ba thành phố.'],
      ['departure', '/dɪˈpɑːrtʃər/', 'NOUN', 'chuyến khởi hành', 'The departure time is 8 a.m.', 'Giờ khởi hành là 8 giờ sáng.'],
      ['accommodation', '/əˌkɑːməˈdeɪʃn/', 'NOUN', 'chỗ ở', 'We booked accommodation near the beach.', 'Chúng tôi đặt chỗ ở gần bãi biển.'],
      ['passport', '/ˈpæspɔːrt/', 'NOUN', 'hộ chiếu', 'Do not forget your passport.', 'Đừng quên hộ chiếu của bạn.'],
      ['destination', '/ˌdestɪˈneɪʃn/', 'NOUN', 'điểm đến', 'Da Nang is a popular destination.', 'Đà Nẵng là điểm đến nổi tiếng.'],
      ['souvenir', '/ˌsuːvəˈnɪr/', 'NOUN', 'quà lưu niệm', 'I bought a souvenir for my mom.', 'Tôi mua quà lưu niệm cho mẹ.'],
      ['reservation', '/ˌrezərˈveɪʃn/', 'NOUN', 'đặt chỗ', 'I have a reservation under Hao.', 'Tôi có đặt chỗ dưới tên Hao.'],
    ],
  },
  {
    title: 'Work & Office', description: 'Từ vựng môi trường công sở', topic: 'Work', emoji: '💼', difficulty: 'INTERMEDIATE',
    words: [
      ['deadline', '/ˈdedlaɪn/', 'NOUN', 'hạn chót', 'The deadline is next Friday.', 'Hạn chót là thứ Sáu tuần sau.'],
      ['colleague', '/ˈkɑːliːɡ/', 'NOUN', 'đồng nghiệp', 'My colleague helped me with the report.', 'Đồng nghiệp đã giúp tôi làm báo cáo.'],
      ['schedule', '/ˈskedʒuːl/', 'NOUN', 'lịch trình, thời gian biểu', 'My schedule is full today.', 'Lịch của tôi hôm nay kín rồi.'],
      ['negotiate', '/nɪˈɡoʊʃieɪt/', 'VERB', 'đàm phán', 'They negotiated a better price.', 'Họ đã đàm phán được giá tốt hơn.'],
      ['promotion', '/prəˈmoʊʃn/', 'NOUN', 'sự thăng chức', 'She got a promotion last month.', 'Cô ấy được thăng chức tháng trước.'],
      ['resign', '/rɪˈzaɪn/', 'VERB', 'từ chức, nghỉ việc', 'He decided to resign.', 'Anh ấy quyết định nghỉ việc.'],
      ['agenda', '/əˈdʒendə/', 'NOUN', 'chương trình họp', 'Let us review the agenda first.', 'Hãy xem lại chương trình họp trước.'],
      ['collaborate', '/kəˈlæbəreɪt/', 'VERB', 'hợp tác', 'We collaborate with many partners.', 'Chúng tôi hợp tác với nhiều đối tác.'],
    ],
  },
];

async function main() {
  await prisma.deck.deleteMany({ where: { ownerId: null } });
  for (const d of decks) {
    await prisma.deck.create({
      data: {
        title: d.title,
        description: d.description,
        topic: d.topic,
        emoji: d.emoji,
        difficulty: d.difficulty,
        isPublic: true,
        words: {
          create: d.words.map(([term, phonetic, partOfSpeech, meaning, example, exampleMeaning]) => ({
            term, phonetic, partOfSpeech, meaning, example, exampleMeaning,
          })),
        },
      },
    });
  }
  console.log('Seed xong:', decks.length, 'bộ từ');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());