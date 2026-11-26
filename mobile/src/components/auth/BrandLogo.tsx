import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

// Logo tạm. Sau này thay bằng logo thật: chỉ cần sửa file này.
export function BrandLogo() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          backgroundColor: 'rgba(255,255,255,0.18)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="book" size={22} color="#FF9A8D" />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>
        Word<Text style={{ color: '#FF9A8D' }}>topia</Text>
      </Text>
    </View>
  );
}