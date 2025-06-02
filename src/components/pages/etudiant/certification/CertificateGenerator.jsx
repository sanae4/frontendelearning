import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './CertificateGenerator.css';

const CertificateGenerator = ({ studentName, courseName, teacherName, onClose }) => {
    const certificateRef = useRef(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    // Générer un ID unique pour le certificat
    const certificateId = React.useMemo(() => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }, []);

    // Formater la date actuelle
    const formattedDate = React.useMemo(() => {
        const date = new Date();
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }, []);

    const generatePDF = async () => {
        if (!certificateRef.current) return;

        try {
            setLoading(true);
            setError(null);

            // Capturer le certificat en tant qu'image avec html2canvas
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2, // Meilleure qualité
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Créer un PDF au format A4 paysage
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Dimensions du PDF A4 paysage (en mm)
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Calculer le ratio pour adapter l'image au PDF
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            // Calculer les dimensions finales
            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;

            // Calculer les marges pour centrer l'image
            const marginX = (pdfWidth - finalWidth) / 2;
            const marginY = (pdfHeight - finalHeight) / 2;

            // Ajouter l'image au PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', marginX, marginY, finalWidth, finalHeight);

            // Télécharger le PDF
            pdf.save(`Certificate_${studentName.replace(/\s+/g, '_')}_${courseName.replace(/\s+/g, '_')}.pdf`);

        } catch (err) {
            console.error('Erreur lors de la génération du certificat:', err);
            setError('Une erreur est survenue lors de la génération du certificat. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="certificate-generator-wrapper">
            <div className="certificate-controls">
                <button
                    className="download-button"
                    onClick={generatePDF}
                    disabled={loading}
                >
                    {loading ? 'Génération en cours...' : 'Télécharger le certificat'}
                </button>
                <button className="close-button" onClick={onClose}>
                    Fermer
                </button>
                {error && <p className="error-message">{error}</p>}
            </div>

            <div className="certificate-preview-container">
                <div className="certificate-container" ref={certificateRef}>
                    <div className="watermark">E-LEARNING</div>

                    <div className="certificate-header">
                        <div className="logo1">
                            <div className="logo1-icon1">E</div>
                            <div className="logo1-text">learning</div>
                        </div>
                        <div className="certificate-title">Certificate of Completion</div>
                        <div className="certificate-subtitle">This is to certify that</div>
                    </div>

                    <div className="student-name">{studentName}</div>

                    <div className="certificate-text">
                        has successfully completed the course
                    </div>

                    <div className="course-name">{courseName}</div>

                    <div className="certificate-text">
                        with all the requirements as prescribed by the course instructor.
                    </div>

                    <div className="certificate-footer">
                        <div className="date-section">
                            <div className="certificate-date">Date: {formattedDate}</div>
                        </div>
                        <div className="signature-section">
                            <div className="signature-line"></div>
                            <div className="teacher-name">{teacherName}</div>
                            <div>Course Instructor</div>
                        </div>
                    </div>

                    <div className="certificate-id">Certificate ID: {certificateId}</div>
                </div>
            </div>
        </div>
    );
};

export default CertificateGenerator;
