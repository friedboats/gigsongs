import { textStyles } from '@/src/theme/styles';
import { Text, TextProps } from 'react-native';

export function AppText({ style, ...props }: TextProps) {
  return <Text style={[textStyles.body, style]} {...props} />;
}
