// app/index.tsx
import { MainHeader } from '@/components/MainHeader';
import { SongPanel } from '@/components/SongPanel';
import { SongRow } from '@/components/SongRow';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { mockSongs, type Song } from '@/src/data/songs';
import { useAppTheme } from '@/src/theme/AppTheme';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';

export default function Index() {
  const { colors } = useAppTheme();

  // songs in state so reordering sticks
  const [songs, setSongs] = useState<Song[]>(mockSongs);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.toLowerCase().trim();

  const filteredSongs = songs.filter((song) => {
    if (!normalizedQuery) return true;

    return (
      song.title.toLowerCase().includes(normalizedQuery) ||
      song.artist.toLowerCase().includes(normalizedQuery)
    );
  });

  const renderItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<Song>) => {
    const index = getIndex?.() ?? 0; // fallback to 0 if undefined

    return (
      <SongRow
        song={item}
        index={index}
        drag={drag}
        isActive={isActive}
        disableDrag={!!normalizedQuery} // optional: no drag while searching
      />
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.white }]}>
      <DraggableFlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          if (!normalizedQuery) {
            setSongs(data);
          }
        }}
        extraData={songs}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <View style={styles.toggleRow}>
              <ThemeToggleButton />
            </View>

            <View style={styles.headerWrapper}>
              <MainHeader />
            </View>

            <SongPanel query={query} onChangeQuery={setQuery} />

            <View style={styles.listSpacer} />
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
    right: 0,
  },
  listSpacer: {
    marginTop: 50,
  },
});
