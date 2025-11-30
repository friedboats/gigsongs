import { MainHeader } from '@/components/MainHeader';
import { SongPanel } from '@/components/SongPanel';
import { SongRow } from '@/components/SongRow';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { mockSongs } from '@/src/data/songs';
import { useAppTheme } from '@/src/theme/AppTheme';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function Index() {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const normalizedQuery = query.toLowerCase().trim();

  const filteredSongs = mockSongs.filter((song) => {
    if (!normalizedQuery) return true;

    return (
      song.title.toLowerCase().includes(normalizedQuery) ||
      song.artist.toLowerCase().includes(normalizedQuery)
    );
  });

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

      <SongPanel query={query} onChangeQuery={setQuery} />

      <View style={styles.listWrapper}>
        {filteredSongs.map((song, index) => (
          <SongRow key={song.id} song={song} index={index} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  headerWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  toggleRow: {
    alignItems: 'center',
    position: 'absolute',
    top: 49,
    right: 40,
  },
  listWrapper: {
    marginTop: 20,
  },
});
