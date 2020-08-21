import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const { name, email, password, passwordConfirm } = form;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      console.log('Passwords do not match');
    } else {
      console.log('Success');
      //TODO: make api call and process errors to display
    }
  };
  return (
    <section className="container">
      <h1 className="x-large my-1">Create Account</h1>
      <hr />
      <form onSubmit={(e) => onSubmit(e)} className="form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Name (Required)"
            name="name"
            value={name}
            onChange={(e) => onChange(e)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email Address (Required)"
            name="email"
            value={email}
            onChange={(e) => onChange(e)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password (Required)"
            name="password"
            value={password}
            onChange={(e) => onChange(e)}
            min-length="8"
          />
          <small className="form-text">
            Password must be at least 8 characters
          </small>
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm Password (Required)"
            name="passwordConfirm"
            value={passwordConfirm}
            onChange={(e) => onChange(e)}
            min-length="8"
          />
        </div>
        <div className="form-text-list">
          <small className="form-text form-error">Please provide a name</small>
          <small className="form-text form-error">
            Please provide a valid email address
          </small>
          <small className="form-text form-error">
            Password with at least 8 characters is required
          </small>
          <small className="form-text form-error">Passwords must match</small>
        </div>
        <div className="form-group">
          <input type="submit" value="Sign Up" className="btn btn-primary" />
        </div>
      </form>
      <p className="my-1">
        Already have an account?
        <Link className="text-bold" to="/login">
          Sign In
        </Link>
      </p>
    </section>
  );
};

export default Register;
