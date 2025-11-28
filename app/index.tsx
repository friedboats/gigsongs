import { AppText } from '@/components/AppText';
import { MainHeader } from '@/components/MainHeader';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <MainHeader />

      <Pressable
        onPress={() => router.push('../song/[id].tsx')}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 8,
          backgroundColor: '#0B3B2E',
        }}
      >
        <AppText style={{ color: 'white' }}>Open song</AppText>
      </Pressable>
    </View>
  );
}
