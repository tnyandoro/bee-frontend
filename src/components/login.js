import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logor from '../logor.png';
import bg from '../bg.png';
import axios from 'axios'; // Import axios for API requests

const Login = (props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();

  const onButtonClick = async () => {
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    try {
      // Send a request to the API to log in
      const response = await axios.post('http://localhost:3000/api/v1/admin_auth/login', {
        email,
        password,
      });

      // On successful login, store the token and set loggedIn to true
      localStorage.setItem('token', response.data.token);
      props.setLoggedIn(true);
      props.setEmail(email);

      // Redirect to admin dashboard
      navigate('/admin/dashboard');
    } catch (error) {
      // Handle error, e.g., show message
      if (error.response && error.response.status === 401) {
        setEmailError('Invalid email or password');
      } else {
        setEmailError('Something went wrong, please try again');
      }
    }
  };

  return (
    <div className="mainContainer flex"
    style={{
      backgroundImage: `url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      height: '100vh',
    }}>
      <div className="logoContainer w-1/2 flex items-center justify-center bg-gray-200">
        <img src={logor} alt="Resole 360 Logo" className="logoSize" />
      </div>

      <div className="formContainer w-1/2 flex flex-col justify-center items-center">
        <div className="titleContainer">
          <h1 className="text-2xl mb-4 text-white">Resolve360</h1>
        </div>

        <div className="inputContainer mb-4">
          <input
            value={email}
            placeholder="Enter your email here"
            onChange={(ev) => setEmail(ev.target.value)}
            className="inputBox border p-2 w-80"
          />
          <label className="errorLabel text-red-500">{emailError}</label>
        </div>

        <div className="inputContainer mb-4">
          <input
            value={password}
            type="password"
            placeholder="Enter your password here"
            onChange={(ev) => setPassword(ev.target.value)}
            className="inputBox border p-2 w-80"
          />
          <label className="errorLabel text-red-500">{passwordError}</label>
        </div>

        <div className="inputContainer">
          <input
            className="inputButton bg-blue-950 text-white mb-4 rounded w-80"
            type="button"
            onClick={onButtonClick}
            value="Log in"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
