import axios from 'axios';

// Configuration d'Axios
const API_URL = 'http://192.168.11.113:8080/api';

// Service pour les opérations liées aux catégories
const CategoryService = {
    // Récupérer toutes les catégories
    getAllCategories: async () => {
        try {
            const response = await axios.get(`${API_URL}/category`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories:', error);
            throw error;
        }
    },

    // Récupérer les catégories racines (sans parent)
    getRootCategories: async () => {
        try {
            const response = await axios.get(`${API_URL}/category/root`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories racines:', error);
            throw error;
        }
    },

    // Récupérer une catégorie par son ID
    getCategoryById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/category/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération de la catégorie ${id}:`, error);
            throw error;
        }
    },

    // Récupérer les sous-catégories d'une catégorie parent
    getSubCategories: async (parentId) => {
        try {
            const response = await axios.get(`${API_URL}/category/${parentId}/subcategories`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération des sous-catégories de ${parentId}:`, error);
            throw error;
        }
    },

    // Vérifier si une catégorie a des sous-catégories
    hasSubCategories: async (categoryId) => {
        try {
            const response = await axios.get(`${API_URL}/category/${categoryId}/has-subcategories`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la vérification des sous-catégories pour ${categoryId}:`, error);
            throw error;
        }
    },

    // Rechercher des catégories par titre
    searchCategoriesByTitle: async (title) => {
        try {
            const response = await axios.get(`${API_URL}/category/search?title=${title}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la recherche de catégories avec le titre ${title}:`, error);
            throw error;
        }
    },

    // Créer une nouvelle catégorie
    createCategory: async (categoryData) => {
        try {
            const response = await axios.post(`${API_URL}/category`, categoryData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création de la catégorie:', error);
            throw error;
        }
    },

    // Mettre à jour une catégorie existante
    updateCategory: async (id, categoryData) => {
        try {
            const response = await axios.put(`${API_URL}/category/${id}`, categoryData);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de la catégorie ${id}:`, error);
            throw error;
        }
    },

    // Supprimer une catégorie
    deleteCategory: async (id) => {
        try {
            await axios.delete(`${API_URL}/category/${id}`);
            return true;
        } catch (error) {
            console.error(`Erreur lors de la suppression de la catégorie ${id}:`, error);
            throw error;
        }
    }
};

export default CategoryService;
