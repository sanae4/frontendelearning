import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/course';

const CourseService = {
    getCoursesByEnseignant: async () => {
        const user = AuthService.getCurrentUser();
        if (!user) return [];

        try {
            const response = await axios.get(`${API_URL}/enseignant/${user.id}`, {
                headers: { Authorization: `Bearer ${AuthService.getToken()}` }
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des cours:', error);
            return [];
        }
    }
};

export default CourseService;
