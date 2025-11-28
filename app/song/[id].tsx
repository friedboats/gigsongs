// app/song/[id].tsx
import { AppText } from '@/components/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  return (
    <View style={{ flex: 1, paddingTop: 80, alignItems: 'center' }}>
      <AppText style={{ fontSize: 24, marginBottom: 16 }}>
        Song screen for ID: {id}
      </AppText>

      <Pressable
        onPress={() => router.back()}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 8,
          backgroundColor: '#0B3B2E',
        }}
      >
        <AppText style={{ color: 'white' }}>Back to list</AppText>
      </Pressable>
    </View>
  );
}
