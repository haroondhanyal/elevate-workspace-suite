export const themes = {
  light: { label: 'Light', description: 'Clean and bright workspace' },
  dark: { label: 'Dark', description: 'Easy on the eyes in low light' },
  grey: { label: 'Grey', description: 'Neutral and focused' },
  blue: { label: 'Blue', description: 'Calm blue workspace' },
  contrast: { label: 'High contrast', description: 'Maximum clarity and readability' },
}

export function getStoredTheme() {
  return localStorage.getItem('rh98-theme') || 'dark'
}

export function applyTheme(theme) {
  const selectedTheme = themes[theme] ? theme : 'light'
  document.documentElement.dataset.theme = selectedTheme
  document.documentElement.classList.toggle('dark-mode', selectedTheme === 'dark')
  localStorage.setItem('rh98-theme', selectedTheme)
}
