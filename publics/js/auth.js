// ===== Authentication Module - Noah =====
// Ce fichier gère toute la logique d'authentification et de session utilisateur
// Il utilise localStorage pour stocker l'utilisateur connecté côté client

const API_URL = 'http://localhost:3000/api';

// Récupère l'utilisateur actuellement connecté depuis le localStorage - Noah
function getCurrentUser() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

// Stocke l'utilisateur connecté dans le localStorage - Noah
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

// Déconnecte l'utilisateur et le redirige vers la page d'accueil - Noah
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Enregistre un nouvel utilisateur via l'API - Noah
async function signup(email, password, name) {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'inscription');
    }

    // Sauvegarde l'utilisateur en local après inscription réussie - Noah
    setCurrentUser(data);
    return data;
  } catch (error) {
    console.error('Erreur inscription:', error);
    throw error;
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la connexion');
    }

    setCurrentUser(data);
    return data;
  } catch (error) {
    console.error('Erreur connexion:', error);
    throw error;
  }
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function updateAuthUI() {
  const currentUser = getCurrentUser();
  const authContainer = document.getElementById('auth-container');
  
  if (!authContainer) return;

  if (currentUser) {
    authContainer.innerHTML = `
      <div class="flex items-center gap-4">
        <span class="text-sm text-white"><i class="bi bi-person"></i>  ${currentUser.name}</span>
        <button onclick="logout()" class="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">
          Déconnexion
        </button>
      </div>
    `;
  } else {
    authContainer.innerHTML = `
      <div class="flex items-center gap-3">
        <a href="login.html" class="text-sm text-white px-3 py-1 bg-indigo-700 rounded hover:bg-indigo-800 transition">
          Connexion
        </a>
        <a href="signup.html" class="text-sm text-white px-3 py-1 bg-green-600 rounded hover:bg-green-700 transition">
          S'inscrire
        </a>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', updateAuthUI);
