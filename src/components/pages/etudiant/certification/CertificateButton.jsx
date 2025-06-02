import React, { useState } from 'react';
import CertificateGenerator from './CertificateGenerator';
import { Award } from 'lucide-react';
import './CertificateButton.css';

const CertificateButton = ({ studentName, courseName, teacherName }) => {
    const [showCertificate, setShowCertificate] = useState(false);

    const handleShowCertificate = () => {
        setShowCertificate(true);
    };

    const handleCloseCertificate = () => {
        setShowCertificate(false);
    };

    return (
        <>
            <div className="certificate-button-container">
                <button
                    className="certificate-btn"
                    onClick={handleShowCertificate}
                >
                    <Award size={20} />
                    Obtenir votre certificat
                </button>
            </div>

            {showCertificate && (
                <div className="certificate-modal">
                    <div className="certificate-modal-content">
                        <CertificateGenerator
                            studentName={studentName}
                            courseName={courseName}
                            teacherName={teacherName}
                            onClose={handleCloseCertificate}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default CertificateButton;
