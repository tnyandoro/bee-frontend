import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import logor from '../logor.png';

const Login = (props) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const navigate = useNavigate()

  const onButtonClick = () => {
    if (email && password) {
      // Logic to validate the credentials goes here
      navigate('/');
    }
  }

  return (
    <div className="mainContainer flex">
      {/* Left side for the logo */}
      <div className="logoContainer w-1/2 flex items-center justify-center bg-gray-200">
        <img
          src={logor} // Use the imported logo
          alt="Resole 360 Logo"
          className="logoSize"
        />
      </div>


      {/* Right side for the login form */}
      <div className="formContainer w-1/2 flex flex-col justify-center items-center">
        <div className="titleContainer">
          <h1 className="text-2xl text-white mb-4">ITSM</h1>
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
  )
}

export default Login
