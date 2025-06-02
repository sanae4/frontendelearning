// Formatage de date
export const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';

    const date = new Date(dateString);
    if (isNaN(date)) return 'Date invalide';

    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

// Formatage de prix
export const formatPrice = (price) => {
    if (price === undefined || price === null) return 'Gratuit';

    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
};

// Extraire la réponse correcte à partir de JSON
export const extractCorrectAnswer = (jsonString) => {
    try {
        if (!jsonString) return 'Non définie';

        const parsed = JSON.parse(jsonString);
        return parsed.correct || 'Non définie';
    } catch (e) {
        console.error('Erreur lors de l\'analyse de la réponse:', e);
        return 'Format invalide';
    }
};

// Calculer le nombre total de chapitres dans un cours
export const countTotalChapters = (course) => {
    if (!course || !course.leçons) return 0;

    return course.leçons.reduce((total, lesson) => {
        return total + (lesson.chapitres ? lesson.chapitres.length : 0);
    }, 0);
};
