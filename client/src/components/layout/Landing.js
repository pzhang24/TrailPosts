import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <section className="landing">
      <div className="landing-display bg-dark-overlay">
        <h1 className="x-large my-1">Join the Community of Adventurers.</h1>
        <p className="my-1">
          Create or browse guides for the Pacific Coast's best trails, and share
          your adventures with others.
        </p>
        <div className="landing-buttons">
          <Link to="/register" className="btn btn-primary">
            Sign Up For Free
          </Link>
          <Link to="/login" className="btn btn-light">
            Login
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Landing;
