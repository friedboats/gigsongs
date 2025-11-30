import ArrowLeftIcon from '@/assets/svgs/arrowLeft.svg';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { mockSongs } from '@/src/data/songs';
import { useAppTheme } from '@/src/theme/AppTheme';
import { textStyles } from '@/src/theme/styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  const song = mockSongs.find((s) => s.id === id);

  // TODO: TEST STYLES
  if (!song) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 40,
          paddingVertical: 40,
        }}
      >
        <Text style={{ fontSize: 20, marginBottom: 16, color: colors.primary }}>
          Song not found
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.primary,
              alignContent: 'center',
              flexDirection: 'row',
              gap: 8,
            },
          ]}
        >
          <ArrowLeftIcon width={18} height={18} color={colors.primary} />

          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 40,
          paddingVertical: 40,
          width: '100%',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.greenLight,
              alignContent: 'center',
              flexDirection: 'row',
              gap: 8,
            },
          ]}
        >
          <ArrowLeftIcon width={18} height={18} color={colors.primary} />

          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Back
          </Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Text
            style={[textStyles.heading2, { color: colors.primary }]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
          <Text
            style={[textStyles.heading4, { color: colors.primary }]}
            numberOfLines={1}
          >
            {song.artist}
          </Text>
        </View>

        <ThemeToggleButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
  },
});
