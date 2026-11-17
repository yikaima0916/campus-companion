// Apply the saved palette before styles are painted, including on the login screen.
try {
  document.documentElement.dataset.theme = localStorage.getItem('campus-theme') === 'dark' ? 'dark' : 'light';
} catch {
  document.documentElement.dataset.theme = 'light';
}
// Hide the page until app.js applies the interface language (English by default).
try {
  const saved = localStorage.getItem('campus-locale');
  document.documentElement.lang = ['en', 'zh-CN', 'zh-TW'].includes(saved) ? saved : 'en';
} catch {
  document.documentElement.lang = 'en';
}
document.documentElement.classList.add('i18n-pending');
setTimeout(() => document.documentElement.classList.remove('i18n-pending'), 4000);
