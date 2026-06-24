import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'light' | 'dark' | 'auto';
export type FontSizeType = 'small' | 'medium' | 'large';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  fontSize: FontSizeType;
  setFontSize: (size: FontSizeType) => void;
  hasChosenTheme: boolean;
  completeThemeSelection: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'auto',
  setTheme: () => {},
  fontSize: 'medium',
  setFontSize: () => {},
  hasChosenTheme: false,
  completeThemeSelection: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    return (localStorage.getItem('lybet_theme') as ThemeType) || 'auto';
  });

  const [fontSize, setFontSizeState] = useState<FontSizeType>(() => {
    return (localStorage.getItem('lybet_fontsize') as FontSizeType) || 'medium';
  });
  
  const [hasChosenTheme, setHasChosenTheme] = useState<boolean>(() => {
    return localStorage.getItem('lybet_theme_chosen') === 'true';
  });

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('lybet_theme', newTheme);
  };

  const setFontSize = (newSize: FontSizeType) => {
    setFontSizeState(newSize);
    localStorage.setItem('lybet_fontsize', newSize);
  };

  const completeThemeSelection = () => {
    setHasChosenTheme(true);
    localStorage.setItem('lybet_theme_chosen', 'true');
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Theme logic
    root.classList.remove('light', 'dark');
    let activeTheme = theme;
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }
    root.classList.add(activeTheme);

    // Font size logic
    root.classList.remove('text-sm', 'text-md', 'text-lg');
    if (fontSize === 'small') root.classList.add('text-sm');
    else if (fontSize === 'large') root.classList.add('text-lg');
    else root.classList.add('text-md');

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, fontSize]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize, hasChosenTheme, completeThemeSelection }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
