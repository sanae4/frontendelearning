import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './CertificateGenerator.css';

const CertificateGenerator = () => {
    const certificateRef = useRef(null);
    const [loading, setLoading] = React.useState(false);

    // Données statiques
    const studentName = "Sanae Ben Hammadi";
    const courseName = "Python pour Débutants";
    const teacherName = "Dr. Sarah Johnson";
    const certificateId = "CERT2025-12345";
    const formattedDate = "June 14, 2025";

    const generatePDF = async () => {
        if (!certificateRef.current) return;

        try {
            setLoading(true);

            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                backgroundColor: '#ffffff'
            });

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);

            pdf.addImage(
                canvas.toDataURL('image/png'),
                'PNG',
                (pdfWidth - canvas.width * ratio) / 2,
                (pdfHeight - canvas.height * ratio) / 2,
                canvas.width * ratio,
                canvas.height * ratio
            );

            pdf.save(`Certificate_${studentName.replace(/\s+/g, '_')}.pdf`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="certificate-app">
            <div className="controls">
                <button onClick={generatePDF} disabled={loading}>
                    {loading ? 'Generating PDF...' : 'Download Certificate'}
                </button>
            </div>

            <div className="certificate-wrapper">
                <div className="certificate" ref={certificateRef}>
                    <div className="watermark">CERTIFICATE</div>

                    <div className="header">
                        <div className="logo">
                            <span className="logo-icon">E</span>
                            <span className="logo-text">Learning</span>
                        </div>
                        <h1>CERTIFICATE OF COMPLETION</h1>
                        <p className="subtitle">This is to certify that</p>
                    </div>

                    <div className="student">{studentName}</div>

                    <p className="description">
                        has successfully completed the course of study in
                    </p>

                    <div className="course">{courseName}</div>

                    <p className="description">
                        with distinction and fulfilled all the requirements as prescribed.
                    </p>

                    <div className="footer">
                        <div className="date">
                            <p>Date: {formattedDate}</p>
                        </div>
                        <div className="signature">
                            <div className="signature-line"></div>
                            <p className="teacher">{teacherName}</p>
                            <p>Course Instructor</p>
                        </div>
                    </div>

                    <div className="certificate-id">Certificate ID: {certificateId}</div>
                </div>
            </div>
        </div>
    );
};

export default CertificateGenerator;