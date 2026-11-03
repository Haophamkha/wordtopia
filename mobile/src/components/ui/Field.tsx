import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Text, YStack } from 'tamagui';
import { colors } from '../../theme/colors';

type Props = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Field({ label, icon, secureTextEntry, style, onFocus, onBlur, ...rest }: Props) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const readOnly = rest.editable === false;

  return (
    <YStack gap={6}>
      {label ? (
        <Text color={colors.muted} fontSize={13} fontWeight="600">
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 54,
          gap: 10,
          paddingHorizontal: 14,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: focused ? colors.primary : colors.border,
          backgroundColor: readOnly ? '#F1F1F6' : '#fff',
        }}
      >
        {icon ? <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.muted} /> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          secureTextEntry={!!secureTextEntry && !show}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[{ flex: 1, height: '100%', paddingVertical: 0, fontSize: 16, color: readOnly ? colors.muted : colors.text }, style]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={12}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </YStack>
  );
}