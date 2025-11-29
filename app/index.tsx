import { MainHeader } from '@/components/MainHeader';
import { SongRow } from '@/components/SongRow';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { mockSongs } from '@/src/data/songs';
import { useAppTheme } from '@/src/theme/AppTheme';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function Index() {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.white },
      ]}
    >
      <View style={styles.headerWrapper}>
        <MainHeader />
      </View>

      <View style={styles.toggleRow}>
        <ThemeToggleButton />
      </View>

      <View style={styles.listWrapper}>
        {mockSongs.map((song, index) => (
          <SongRow key={song.id} song={song} index={index} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 80,
    paddingBottom: 40,
  },
  headerWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  toggleRow: {
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    right: 20,
  },
  listWrapper: {
    marginTop: 20,
  },
});
