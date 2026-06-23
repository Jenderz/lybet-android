import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeType = 'light' | 'dark' | 'auto';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  hasChosenTheme: boolean;
  completeThemeSelection: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'auto',
  setTheme: () => {},
  hasChosenTheme: false,
  completeThemeSelection: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    return (localStorage.getItem('lybet_theme') as ThemeType) || 'auto';
  });
  
  const [hasChosenTheme, setHasChosenTheme] = useState<boolean>(() => {
    return localStorage.getItem('lybet_theme_chosen') === 'true';
  });

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('lybet_theme', newTheme);
  };

  const completeThemeSelection = () => {
    setHasChosenTheme(true);
    localStorage.setItem('lybet_theme_chosen', 'true');
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    let activeTheme = theme;
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }

    root.classList.add(activeTheme);

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, hasChosenTheme, completeThemeSelection }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
