import { colors } from '@/src/theme/tokens';
import { useColorScheme } from 'react-native';

export function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? colors.dark : colors.light;
}
