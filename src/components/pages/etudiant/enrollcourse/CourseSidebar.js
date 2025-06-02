import React from 'react';

const CourseSidebar = ({
    lessons,
    chapters,
    activeLesson,
    activeChapter,
    onLessonSelect,
    onChapterSelect,
}) => {
    return (
        <nav className="course-sidebar">
            <h3 className="sidebar-title">Lessons</h3>
            {lessons.length > 0 ? (
                <ul className="lessons-list">
                    {lessons.map((lesson) => (
                        <li key={lesson.id}>
                            <h3
                                className={`lesson-header ${activeLesson?.id === lesson.id ? 'active' : ''}`}
                                onClick={() => onLessonSelect(lesson)}
                            >
                                {lesson.titreLeçon}
                            </h3>

                            {activeLesson?.id === lesson.id && (
                                <ul className="chapters-list">
                                    {chapters.length > 0 ?
                                        chapters.map((chapter) => (
                                            <li key={chapter.id}>
                                                <p
                                                    className={`chapter-item ${activeChapter?.id === chapter.id ? 'active' : ''}`}
                                                    onClick={() => onChapterSelect(chapter)}
                                                >
                                                    {chapter.titre}
                                                </p>
                                            </li>
                                        )) :
                                        <li><p className="no-chapters">No chapters available</p></li>
                                    }
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-content">No lessons available for this course</p>
            )}
        </nav>
    );
};

export default CourseSidebar;
