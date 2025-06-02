import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import studentImage from '../../assets/hero-1.jpg';

const HeroSection = () => {
    return (
        <HeroContainer>
            <HeroContent>
                <HeroTitle>The Ultimate Pathway To Smarter Learning.</HeroTitle>
                <HeroDescription>
                    With AI-Learn, educators and students connect seamlessly,
                    creating dynamic, personalized learning journeys. Our AI-driven
                    platform adapts to individual learning styles and paces,
                    optimizing engagement and success for all.
                </HeroDescription>
                <GetStartedButton as={Link} to="/login">Get Started</GetStartedButton>
            </HeroContent>
            <HeroImageContainer>
                <HeroImage src={studentImage} alt="Student learning on laptop" />
            </HeroImageContainer>
        </HeroContainer>
    );
};

const HeroContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 5%;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 80vh;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 2rem;
  }
`;

const HeroContent = styled.div`
  flex: 1;
  padding-right: 2rem;
  
  @media (max-width: 768px) {
    padding-right: 0;
    margin-bottom: 2rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1A1A1A;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroDescription = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: #4A4A4A;
  margin-bottom: 2rem;
`;

const GetStartedButton = styled.button`
  background-color: #4361EE;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: inline-block;
  text-decoration: none;
  
  &:hover {
    background-color: #3A56D4;
  }
`;

const HeroImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HeroImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

export default HeroSection;
