import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { colors as palette } from './tokens';

type ColorMode = 'light' | 'dark';

type AppThemeValue = {
  mode: ColorMode;
  colors: typeof palette.light; // shape of one palette branch
  toggleMode: () => void;
};

const AppThemeContext = createContext<AppThemeValue | undefined>(undefined);

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const initialMode: ColorMode = systemScheme === 'dark' ? 'dark' : 'light';

  const [mode, setMode] = useState<ColorMode>(initialMode);

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo(
    () => ({
      mode,
      colors: palette[mode],
      toggleMode,
    }),
    [mode],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return ctx;
};
