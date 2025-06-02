import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/navbar/navbar';
import LoginForm from './components/auth/login/login';
import RegisterForm from './components/auth/Register/registerForm';
import EtudiantDashboard from './components/pages/etudiant/dashbord';
import HomePage from './components/pages/etudiant/HeroSection';
import CreateCourse from './components/pages/enseignant/create_course/create_cours';
import CourseForm from './components/pages/enseignant/courseadd/CourseForm';
import TeacherCoursesPage from './components/pages/enseignant/profil/courses/TeacherCoursesPage';
import AddLessonPage from "./components/pages/enseignant/lesson_add/LessonForm";
import CourseEditForm from './components/pages/enseignant/courseadd/CourseEditForm/CourseEditForm';
import ChapterEditForm from './components/pages/enseignant/ChapterForm/ChapterForm';
import CategoryManagement from './components/pages/admin/categories/CategoryMgmtSystem';
import TeacherManagement from './components/pages/admin/teachermanagement/TeacherManagement';
import CourseContent from './components/pages/admin/course-content/CourseContent';
import QuizDisplay from './components/pages/enseignant/ChapterForm/QuizDisplay';
import LessonDisplay from './components/pages/enseignant/displayLesson/LessonDisplay';
import CoursePreviewDashboard from './components/pages/enseignant/displaycourse/CourseDisplay';
import QuizCreationPage from './components/pages/enseignant/ChapterForm/QuizCreation';
import Coursedisplayadmin from './components/pages/admin/courses/AdminCourseApproval';
import CreateReport from './components/pages/enseignant/profil/repport/CreateReport';
import AdminReports from './components/pages/admin/repports/AdminReports';
import ReportDetail from './components/pages/admin/repports/ReportDetail';
import AdminDashboard from './components/pages/admin/AdminDashboard';
import CategoriesPage from './components/pages/Home/CategoryBrowser';
import AboutPage from './components/pages/Home/AboutPage';
import ConfigQuiz from './components/pages/enseignant/displayLesson/quizconfig/ConfigQuiz';

import CoursesByCategoryPage from './components/pages/Home/coursesdisplaying/CoursesByCategoryPage';

import Coursepreview from './components/pages/Home/coursesdisplaying/coursepreview/CoursePreview';
import CourseEnrollmentPage from './components/pages/etudiant/enrollcourse/CourseEnrollmentPage';

import QuizPage from './components/pages/etudiant/passe_quizz/QuizPage';

import './App.css';

// Composant pour gérer l'affichage conditionnel de la navbar
const NavbarWrapper = ({ user, setUser }) => {
  const location = useLocation();
  const isEnrollmentPage = location.pathname.includes('/course-view/');
  const isQuizPage = location.pathname.includes('/quiz/');

  useEffect(() => {
    if (isEnrollmentPage || isQuizPage) {
      document.body.classList.add('no-navbar');
    } else {
      document.body.classList.remove('no-navbar');
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('no-navbar');
    };
  }, [isEnrollmentPage, isQuizPage]);

  if (isEnrollmentPage || isQuizPage) {
    return null;
  }

  return <Navbar user={user} setUser={setUser} />;
};
const App = () => {
  // Initialisation de l'état utilisateur à partir du localStorage
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Si vous stockez les informations utilisateur dans localStorage
      const userInfo = localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;

      // OU si vous devez décoder le token JWT
      // return decodeJWT(token); // Vous devrez implémenter cette fonction
    }
    return null;
  });

  // Effet pour vérifier l'authentification au chargement
  useEffect(() => {
    // Vous pouvez ajouter ici une vérification de validité du token
    // ou une requête API pour obtenir les informations utilisateur à jour
  }, []);

  return (
    <Router>
      {/* Navbar avec affichage conditionnel */}
      <NavbarWrapper user={user} setUser={setUser} />

      {/* Contenu principal */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginForm setUser={setUser} />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/etudiant/dashboard" element={<EtudiantDashboard />} />
          <Route path="/enseignant/dashboard" element={<EtudiantDashboard />} />
          <Route path="/create-course" element={<CourseForm />} />
          <Route path="/edit-course/:courseId" element={<CourseForm />} />
          <Route path="/create_course" element={<CreateCourse />} />
          <Route path="/courseform" element={<CourseForm />} />
          <Route path="/coursesteacher/:id?" element={<TeacherCoursesPage />} />
          <Route path="/course/:id/lessons" element={<AddLessonPage />} />

          <Route path="/course/:id/edit" element={<CourseEditForm />} />
          <Route path="/course/:courseId/lessons/:lessonId/chapters" element={<ChapterEditForm />} />
          <Route path="/course/:id/lessons/:lessonId/chapters" element={<ChapterEditForm />} />
          <Route path="/admin/categories" element={<CategoryManagement />} />
          <Route path="/admin/teachers" element={<TeacherManagement />} />
          <Route path="/course-content/:courseId" element={<CourseContent />} />
          <Route path="/quizzes/:quizId" element={<QuizDisplay />} />
          <Route path="/course/:courseId/createquiz" element={<QuizCreationPage />} />
          <Route path="/course/:courseId/lessons/:lessonId/" element={<LessonDisplay />} />
          <Route path="/coursepreview/:courseId" element={<CoursePreviewDashboard />} />
          <Route path="/courses/admin" element={<Coursedisplayadmin />} />
          <Route path="/report" element={<CreateReport user={user} />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/reportsdetails/:id" element={< ReportDetail />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />


          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/about" element={<AboutPage />} />

          <Route path="/quiz-config/lesson/:id" element={<ConfigQuiz />} />
          <Route path="/quiz-config/course/:id" element={<ConfigQuiz />} />
          <Route path="/categorycourses/:categoryId" element={<CoursesByCategoryPage />} />
          <Route path="/courseview/:courseId" element={<Coursepreview />} />
          <Route path="/course-view/:courseId" element={<CourseEnrollmentPage />} />
          <Route path="/quiz/:quizId" element={<QuizPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
