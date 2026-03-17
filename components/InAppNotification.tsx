import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  onPress?: () => void;
  onClose?: () => void;
};

export default function InAppNotification({
  visible,
  title,
  message,
  onPress,
}: Props) {
  if (!visible) return null;

  return (
    <Pressable style={styles.wrapper} onPress={onPress}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 999,
  },
  card: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    color: '#eaf2ff',
  },
});