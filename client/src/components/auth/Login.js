import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const { email, password } = form;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    console.log('Success');
    //TODO: make api call and process errors to display
  };
  return (
    <section class="container">
      <h1 class="x-large my-1">Sign In</h1>
      <hr />
      <form onSubmit={(e) => onSubmit(e)} class="form">
        <div class="form-group">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => onChange(e)}
            placeholder="Email Address"
            required
          />
        </div>
        <div class="form-group">
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => onChange(e)}
            placeholder="Password"
            required
          />
        </div>
        <div class="form-text-list">
          <small class="form-text form-error">
            Please provide a valid email address
          </small>
          <small class="form-text form-error">Password is required</small>
          <small class="form-text form-error">
            Incorrect Email or Password
          </small>
        </div>
        <div class="form-group">
          <input type="submit" value="Login" class="btn btn-primary" />
        </div>
      </form>
      <p class="my-1">
        Don't have an account?
        <Link class="text-bold" to="/register">
          Sign Up
        </Link>
      </p>
    </section>
  );
};

export default Login;
