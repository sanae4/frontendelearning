import React from 'react';
import './TeacherProfileCard.css';

const TeacherProfileCard = ({ teacher, onEdit }) => {
    return (
        <div className="teacher-profile-card">
            <div className="profile-header">
                <div className="profile-avatar">
                    {/* If avatar available, display it, otherwise use initials */}
                    {teacher.avatar ? (
                        <img src={teacher.avatar} alt={`${teacher.prenom} ${teacher.nom}`} />
                    ) : (
                        <div className="avatar-initials">
                            {teacher.prenom.charAt(0)}{teacher.nom.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="profile-info">
                    <h2 className="profile-name">{teacher.prenom} {teacher.nom}</h2>
                    <p className="profile-speciality">{teacher.specialite || 'No specialty'}</p>
                    <p className="profile-experience">
                        {teacher.anneesExperience ? `${teacher.anneesExperience} years of experience` : 'Experience not specified'}
                    </p>
                </div>

                <button className="btn btn-outline edit-profile-btn" onClick={onEdit}>
                    <i className="fas fa-edit"></i> Edit Profile
                </button>
            </div>

            <div className="profile-details">
                <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{teacher.email}</span>
                </div>

                <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{teacher.numtele || 'Not specified'}</span>
                </div>


            </div>

            {teacher.biographie && (
                <div className="profile-bio">
                    <h3>Biography</h3>
                    <p>{teacher.biographie}</p>
                </div>
            )}
        </div>
    );
};

export default TeacherProfileCard;