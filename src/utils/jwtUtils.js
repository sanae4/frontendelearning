// Utilitaire pour décoder les tokens JWT
// Placez ce fichier dans un dossier utils de votre projet

export const decodeToken = (token) => {
  try {
    // Vérifier si le token existe
    if (!token) return null;

    // Décoder le token (partie base64)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Erreur lors du décodage du token:", error);
    return null;
  }
};

// Fonction pour vérifier si un token est expiré
export const isTokenExpired = (token) => {
  const decodedToken = decodeToken(token);
  if (!decodedToken || !decodedToken.exp) {
    return true;
  }

  // La date d'expiration est en secondes, convertir en millisecondes
  const expirationDate = new Date(decodedToken.exp * 100000);
  const currentDate = new Date();

  return currentDate > expirationDate;
};

// Fonction pour récupérer l'ID de l'utilisateur depuis le token
export const getUserIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  const decodedToken = decodeToken(token);
  return decodedToken ? decodedToken.id : null;
};

// Fonction pour récupérer le rôle de l'utilisateur depuis le token
export const getUserRoleFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  const decodedToken = decodeToken(token);
  return decodedToken ? decodedToken.role : null;
};
