/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'theme-bg-primary': 'var(--bg-primary)',
        'theme-bg-secondary': 'var(--bg-secondary)',
        'theme-bg-tertiary': 'var(--bg-tertiary)',
        'theme-text-primary': 'var(--text-primary)',
        'theme-text-secondary': 'var(--text-secondary)',
        'theme-text-tertiary': 'var(--text-tertiary)',
        'theme-border': 'var(--border-color)',
        'theme-accent': 'var(--accent-primary)',
        'theme-accent-hover': 'var(--accent-hover)',
        'theme-sidebar-bg': 'var(--sidebar-bg)',
        'theme-sidebar-text': 'var(--sidebar-text)',
        'theme-sidebar-hover': 'var(--sidebar-hover)',
      },
    },
  },
  plugins: [],
}

