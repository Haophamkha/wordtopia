import { Text } from 'tamagui';

// Hiển thị **in đậm** từ Markdown đơn giản của AI
export function RichText({ text, color, size = 15 }: { text: string; color: string; size?: number }) {
  const clean = text.replace(/\*(?!\*)([^*\n]+)\*(?!\*)/g, '$1');
  const parts = clean.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text color={color} fontSize={size} lineHeight={size * 1.45}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <Text key={i} fontWeight="800" color={color} fontSize={size}>{p.slice(2, -2)}</Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}