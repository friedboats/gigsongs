import { AppText } from '@/components/AppText';
import { textStyles } from '@/src/theme/styles';
import { Text } from 'react-native';

export function MainHeader() {
  return (
    <AppText
      style={[
        textStyles.headingXl,
        { paddingVertical: 80, position: 'relative' },
      ]}
    >
      <Text>GigSongs</Text>
      <Text
        style={[
          {
            position: 'absolute',
            fontSize: 14,
            marginTop: 30,
            marginLeft: 0,
          },
        ]}
      >
        ™
      </Text>
    </AppText>
  );
}
