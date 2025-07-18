import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './Register.css';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        numtele: '',
        email: '',
        motDePasse: '',
        confirmMotDePasse: '',
        role: 'ADMIN', // Default role is "ADMIN"
        datenaissance: '',
        genre: '',
        adresse: {
            rue: '',
            ville: '',
            codePostal: '',
            pays: ''
        },
        biographie: '', // Specific to teacher
        specialite: '', // Specific to teacher
        anneesExperience: '', // Specific to teacher
        langue: '', // Specific to student
        verificationCode: ''
    });
    const [isEtudiant, setIsEtudiant] = useState(false); // Checkbox for student
    const [isEnseignant, setIsEnseignant] = useState(false); // Checkbox for teacher
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [emailValid, setEmailValid] = useState(true);
    const [passwordStrength, setPasswordStrength] = useState({
        isValid: false,
        message: ''
    });
    const navigate = useNavigate();

    // Vérifier si les mots de passe correspondent à chaque changement
    useEffect(() => {
        if (formData.confirmMotDePasse && formData.motDePasse !== formData.confirmMotDePasse) {
            setPasswordMatch(false);
        } else {
            setPasswordMatch(true);
        }
    }, [formData.motDePasse, formData.confirmMotDePasse]);

    // Vérifier la force du mot de passe
    useEffect(() => {
        if (formData.motDePasse) {
            const password = formData.motDePasse;
            let message = '';
            let isValid = false;

            // Au moins 8 caractères
            if (password.length < 8) {
                message = 'Password must be at least 8 characters long';
            }
            // Au moins une lettre majuscule
            else if (!/[A-Z]/.test(password)) {
                message = 'Password must contain at least one uppercase letter';
            }
            // Au moins une lettre minuscule
            else if (!/[a-z]/.test(password)) {
                message = 'Password must contain at least one lowercase letter';
            }
            // Au moins un chiffre
            else if (!/[0-9]/.test(password)) {
                message = 'Password must contain at least one number';
            }
            // Au moins un caractère spécial
            else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                message = 'Password must contain at least one special character';
            } else {
                message = 'Password strength: Strong';
                isValid = true;
            }

            setPasswordStrength({
                isValid,
                message
            });
        } else {
            setPasswordStrength({
                isValid: false,
                message: ''
            });
        }
    }, [formData.motDePasse]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name in formData.adresse) {
            setFormData({
                ...formData,
                adresse: {
                    ...formData.adresse,
                    [name]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handlePhoneChange = (value) => {
        setFormData({
            ...formData,
            numtele: value
        });
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;

        if (name === 'etudiant') {
            setIsEtudiant(checked);
            setIsEnseignant(false); // Disable teacher checkbox
            setFormData({
                ...formData,
                role: checked ? 'ETUDIANT' : 'ADMIN',
                biographie: '', // Reset biography
                specialite: '', // Reset specialty
                anneesExperience: '', // Reset years of experience
            });
        } else if (name === 'enseignant') {
            setIsEnseignant(checked);
            setIsEtudiant(false); // Disable student checkbox
            setFormData({
                ...formData,
                role: checked ? 'ENSEIGNANT' : 'ADMIN',
                langue: '', // Reset language
            });
        }
    };

    const handleSendVerificationCode = async () => {
        if (!formData.email) {
            setErrorMessage('Please enter an email address.');
            return;
        }

        // Validation de l'email avec regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setErrorMessage('Please enter a valid email address.');
            setEmailValid(false);
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:8080/api/users/send-verification-code?email=${formData.email}`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            setSuccessMessage('Verification code sent to ' + formData.email);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage(error.response?.data || "An error occurred while sending the code.");
            setSuccessMessage('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setErrorMessage("Please enter a valid email address.");
            setEmailValid(false);
            return;
        }

        // Vérification des mots de passe
        if (formData.motDePasse !== formData.confirmMotDePasse) {
            setErrorMessage("Passwords do not match.");
            setPasswordMatch(false);
            return;
        }

        // Vérification de la force du mot de passe
        if (!passwordStrength.isValid) {
            setErrorMessage(passwordStrength.message);
            return;
        }

        try {
            const url = `http://localhost:8080/api/users/register`;

            const response = await axios.post(url, formData, {
                params: {
                    code: formData.verificationCode,
                    role: formData.role // Send the selected role
                }
            });

            console.log('Registration successful:', response.data);
            navigate('/login');
        } catch (error) {
            setErrorMessage(error.response?.data || "An error occurred during registration.");
        }
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, email: value });

        // Validation de l'email en temps réel
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setEmailValid(emailRegex.test(value) || value === '');
    };

    return (
        <div className="register-container">
            <form className="form" onSubmit={handleSubmit}>
                <p className="title">Register</p>
                <p className="message">Signup now and get full access to our app.</p>
                {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                        {errorMessage}
                    </div>
                )}
                {successMessage && <p className="success-message">{successMessage}</p>}

                {/* First Name and Last Name */}
                <div className="form-group-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>First Name:</label>
                        <input
                            required
                            type="text"
                            name="nom"
                            className="input"
                            value={formData.nom}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Last Name:</label>
                        <input
                            required
                            type="text"
                            name="prenom"
                            className="input"
                            value={formData.prenom}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Phone Number with country selector */}
                <div className="form-group">
                    <label>Phone Number:</label>
                    <PhoneInput
                        country={'us'}
                        value={formData.numtele}
                        onChange={handlePhoneChange}
                        inputClass="phone-input"
                        containerClass="phone-container"
                        buttonClass="phone-dropdown"
                        required
                    />
                </div>

                {/* Date of Birth */}
                <div className="form-group">
                    <label>Date of Birth:</label>
                    <input
                        required
                        type="date"
                        name="datenaissance"
                        className="input"
                        value={formData.datenaissance}
                        onChange={handleChange}
                    />
                </div>

                {/* Email and "Send Code" Button */}
                <div className="form-group">
                    <label>Email:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            required
                            type="email"
                            name="email"
                            className={`input ${!emailValid ? 'input-error' : ''}`}
                            value={formData.email}
                            onChange={handleEmailChange}
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            className="send-code-button"
                            onClick={handleSendVerificationCode}
                        >
                            Send
                        </button>
                    </div>
                    {!emailValid && <p className="error-text">Please enter a valid email address</p>}
                </div>

                {/* Verification Code */}
                <div className="form-group">
                    <label>Verification Code:</label>
                    <input
                        required
                        type="text"
                        name="verificationCode"
                        className="input"
                        value={formData.verificationCode}
                        onChange={handleChange}
                    />
                </div>

                {/* Address */}
                <div className="form-group-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Street:</label>
                        <input
                            required
                            type="text"
                            name="rue"
                            className="input"
                            value={formData.adresse.rue}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>City:</label>
                        <input
                            required
                            type="text"
                            name="ville"
                            className="input"
                            value={formData.adresse.ville}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Postal Code and Country */}
                <div className="form-group-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Postal Code:</label>
                        <input
                            required
                            type="text"
                            name="codePostal"
                            className="input"
                            value={formData.adresse.codePostal}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Country:</label>
                        <input
                            required
                            type="text"
                            name="pays"
                            className="input"
                            value={formData.adresse.pays}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Password and Confirm Password */}
                <div className="form-group-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Password:</label>
                        <input
                            required
                            type="password"
                            name="motDePasse"
                            className={`input ${!passwordStrength.isValid && formData.motDePasse ? 'input-error' : ''}`}
                            value={formData.motDePasse}
                            onChange={handleChange}
                        />
                        {formData.motDePasse && (
                            <p className={`password-strength ${passwordStrength.isValid ? 'strong' : 'weak'}`}>
                                {passwordStrength.message}
                            </p>
                        )}
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Confirm Password:</label>
                        <input
                            required
                            type="password"
                            name="confirmMotDePasse"
                            className={`input ${!passwordMatch && formData.confirmMotDePasse ? 'input-error' : ''}`}
                            value={formData.confirmMotDePasse}
                            onChange={handleChange}
                        />
                        {!passwordMatch && formData.confirmMotDePasse && (
                            <p className="error-text">Passwords do not match</p>
                        )}
                    </div>
                </div>

                {/* Gender */}
                <div className="form-group">
                    <label>Gender:</label>
                    <select
                        name="genre"
                        className="input"
                        value={formData.genre}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                </div>

                {/* Role Checkboxes */}
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="etudiant"
                            checked={isEtudiant}
                            onChange={handleCheckboxChange}
                        />
                        I am a student
                    </label>
                </div>
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="enseignant"
                            checked={isEnseignant}
                            onChange={handleCheckboxChange}
                        />
                        I am a teacher
                    </label>
                </div>

                {/* Student-Specific Fields */}
                {isEtudiant && (
                    <div className="form-group">
                        <label>Language:</label>
                        <select
                            name="langue"
                            className="input"
                            value={formData.langue}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Language</option>
                            <option value="French">French</option>
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="German">German</option>
                        </select>
                    </div>
                )}

                {/* Teacher-Specific Fields */}
                {isEnseignant && (
                    <>
                        <div className="form-group">
                            <label>Biography:</label>
                            <textarea
                                name="biographie"
                                className="input"
                                value={formData.biographie}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Specialty:</label>
                            <select
                                name="specialite"
                                className="input"
                                value={formData.specialite}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Specialty</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Physics">Physics</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Chemistry">Chemistry</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Years of Experience:</label>
                            <select
                                name="anneesExperience"
                                className="input"
                                value={formData.anneesExperience}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Years</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="5+">5+</option>
                            </select>
                        </div>
                    </>
                )}

                {/* Submit Button */}
                <button type="submit" className="submit">Submit</button>

                {/* Link to Login Page */}
                <p className="signin">
                    Already have an account? <Link to="/login">Signin</Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterForm;
