/**
 * Applies the stored theme before first paint. Inlined in <head> because a
 * client effect would flash the light theme for dark mode users.
 */
export function ThemeScript() {
  const script = `(function(){try{var stored=localStorage.getItem('skillproof-theme');var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=stored||(prefersDark?'dark':'light');}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
