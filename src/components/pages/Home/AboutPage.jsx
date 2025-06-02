import React from "react";
import "./AboutPage.css"; // Import the CSS file

const AboutPage = () => {
    return (
        <div className="about-container">
            <div className="about-hero">
                <div className="about-hero-content">
                    <h1>Empowering Global Education</h1>
                    <p>Building the future of learning through innovation and accessibility</p>
                </div>
            </div>

            <div className="about-content">
                <div className="about-section">
                    <div className="about-section-header">
                        <div className="section-icon">
                            <i className="fas fa-lightbulb"></i>
                        </div>
                        <h2>Our Mission</h2>
                    </div>
                    <div className="about-text">
                        <p>
                            At <span className="highlight">E-learning</span>, we're on a mission to transform education by making high-quality learning experiences accessible to everyone, everywhere. We believe education is a fundamental right and a pathway to personal growth and global progress.
                        </p>
                        <p>
                            Founded in 2022 by a team of educators and technology enthusiasts, Learnify has grown into a vibrant community of learners and instructors from over 50 countries, sharing knowledge and pursuing excellence together.
                        </p>
                    </div>
                </div>



                <div className="about-section">
                    <div className="about-section-header">
                        <div className="section-icon">
                            <i className="fas fa-rocket"></i>
                        </div>
                        <h2>What Sets Us Apart</h2>
                    </div>
                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-laptop-code"></i>
                            </div>
                            <h3>Interactive Learning</h3>
                            <p>Engage with dynamic content, real-time feedback, and hands-on projects that reinforce concepts.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <h3>Expert Instructors</h3>
                            <p>Learn from industry professionals who bring real-world experience and insights to every lesson.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-certificate"></i>
                            </div>
                            <h3>Recognized Certificates</h3>
                            <p>Earn credentials valued by employers and showcase your skills with confidence.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-clock"></i>
                            </div>
                            <h3>Learn at Your Pace</h3>
                            <p>Flexible schedules and on-demand access let you balance learning with life's demands.</p>
                        </div>
                    </div>
                </div>

                <div className="about-section">
                    <div className="about-section-header">
                        <div className="section-icon">
                            <i className="fas fa-compass"></i>
                        </div>
                        <h2>Our Vision</h2>
                    </div>
                    <div className="about-text">
                        <p>
                            We envision a world where quality education transcends geographical, financial, and social barriers. Where learning is personalized, engaging, and directly applicable to real-world challenges.
                        </p>
                        <p>
                            By 2030, we aim to empower 1 million learners with the skills and knowledge they need to thrive in an ever-changing global landscape, contributing to sustainable development and innovation worldwide.
                        </p>
                    </div>
                </div>


                <div className="values-section">
                    <h2>Our Core Values</h2>
                    <div className="values-container">
                        <div className="value-item">
                            <div className="value-icon"><i className="fas fa-universal-access"></i></div>
                            <h3>Accessibility</h3>
                            <p>Learning opportunities for all, regardless of background or circumstances</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon"><i className="fas fa-star"></i></div>
                            <h3>Excellence</h3>
                            <p>Unwavering commitment to quality in content and experience</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon"><i className="fas fa-sync"></i></div>
                            <h3>Innovation</h3>
                            <p>Continuously improving how knowledge is shared and acquired</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon"><i className="fas fa-handshake"></i></div>
                            <h3>Community</h3>
                            <p>Fostering meaningful connections between learners and educators</p>
                        </div>
                    </div>
                </div>

                <div className="cta-section">
                    <h2>Join Our Learning Revolution</h2>
                    <p>Start your journey toward mastery today. Explore our courses, connect with expert instructors, and become part of a global community of lifelong learners.</p>
                    <div className="cta-buttons">
                        <button className="cta-button primary">Explore Courses</button>
                        <button className="cta-button secondary">Become an Instructor</button>
                    </div>
                </div>
            </div>

            <div className="about-footer">
                <p>&copy; 2025 E-learning. Transforming lives through education.</p>
            </div>
        </div>
    );
};

export default AboutPage;
