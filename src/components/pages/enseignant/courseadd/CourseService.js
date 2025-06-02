import axios from 'axios';

// Configuration d'Axios
const API_URL = 'http://localhost:8080/api';

// Service pour les opérations liées aux cours
const CourseService = {
    // Récupérer tous les cours
    getAllCourses: async () => {
        try {
            const response = await axios.get(`${API_URL}/course`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des cours:', error);
            throw error;
        }
    },

    // Récupérer un cours par son ID
    getCourseById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/course/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération du cours ${id}:`, error);
            throw error;
        }
    },

    // Créer un nouveau cours
    createCourse: async (courseData) => {
        try {
            const response = await axios.post(`${API_URL}/course`, courseData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création du cours:', error);
            throw error;
        }
    },

    // Mettre à jour un cours existant
    updateCourse: async (id, courseData) => {
        try {
            const response = await axios.put(`${API_URL}/course/${id}`, courseData);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du cours ${id}:`, error);
            throw error;
        }
    },

    // Supprimer un cours
    deleteCourse: async (id) => {
        try {
            await axios.delete(`${API_URL}/course/${id}`);
            return true;
        } catch (error) {
            console.error(`Erreur lors de la suppression du cours ${id}:`, error);
            throw error;
        }
    },

    // Récupérer les cours par catégorie
    getCoursesByCategory: async (categoryId) => {
        try {
            const response = await axios.get(`${API_URL}/course/category/${categoryId}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération des cours par catégorie ${categoryId}:`, error);
            throw error;
        }
    },

    // Récupérer les cours par niveau
    getCoursesByLevel: async (level) => {
        try {
            const response = await axios.get(`${API_URL}/course/level/${level}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération des cours par niveau ${level}:`, error);
            throw error;
        }
    },

    // Récupérer les cours par langue
    getCoursesByLanguage: async (language) => {
        try {
            const response = await axios.get(`${API_URL}/course/language/${language}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération des cours par langue ${language}:`, error);
            throw error;
        }
    },

    // Rechercher des cours par titre
    searchCoursesByTitle: async (title) => {
        try {
            const response = await axios.get(`${API_URL}/course/search?title=${title}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la recherche de cours avec le titre ${title}:`, error);
            throw error;
        }
    },

    // Upload de fichier pour un cours
    uploadCourseFile: async (courseId, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `${API_URL}/course/${courseId}/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error(`Erreur lors de l'upload du fichier pour le cours ${courseId}:`, error);
            throw error;
        }
    }
};

export default CourseService;
