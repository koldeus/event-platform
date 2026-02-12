// Développé par Keni Mottin

const CONFIG = {
  isLocal: window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.port === '5500',
  
  get API_BASE_URL() {
    if (this.isLocal) {
      return 'http://localhost:3000';
    } else {
      return '';
    }
  }
};

function apiUrl(endpoint) {
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  return `${CONFIG.API_BASE_URL}${endpoint}`;
}

console.log('🔧 Configuration API:', {
  environnement: CONFIG.isLocal ? 'LOCAL (Dev)' : 'PRODUCTION (AlwaysData)',
  hostname: window.location.hostname,
  port: window.location.port,
  API_BASE_URL: CONFIG.API_BASE_URL || '(URLs relatives)'
});

window.CONFIG = CONFIG;
window.apiUrl = apiUrl;