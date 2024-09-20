import React, { useState } from 'react';
import axios from 'axios';
import bg from '../bg.png';

function AdminRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (isSubmitting) return; // Prevent multiple submissions
  //   if (password !== passwordConfirmation) {
  //     setError('Passwords do not match');
  //     return;
  //   }

  //   setIsSubmitting(true);
  
  //   try {
  //     const response = await axios.post('http://localhost:3000/api/v1/admins/register', {
  //       name,
  //       email,
  //       phone_number: phoneNumber,
  //       website,
  //       address,
  //       subdomain,
  //       password,
  //       password_confirmation: passwordConfirmation,
  //     });

  //     // Store JWT token in localStorage
  //     localStorage.setItem('token', response.data.token);

  //     // Redirect to admin dashboard
  //     window.location.href = '/admin/dashboard';

  //   } catch (err) {
  //     // Set a more specific error message if available
  //     if (err.response && err.response.data && err.response.data.error) {
  //       setError(err.response.data.error);
  //     } else {
  //       setError('Error during registration');
  //     }
  //   } finally {
  //     setIsSubmitting(false); // Re-enable submission after request completes
  //   }
  // };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
  
    try {
      const response = await axios.post('http://localhost:3000/api/v1/admins/register', {
        organization: {
          name,
          email,
          phone_number: phoneNumber,
          website,
          address,
          subdomain
        },
        admin: {
          email,
          password,
          password_confirmation: passwordConfirmation
        }
      });
      localStorage.setItem('token', response.data.token); // Store JWT
      window.location.href = '/admin/dashboard'; // Redirect to admin dashboard
    } catch (err) {
      setError('Error during registration');
    } finally {
      setIsSubmitting(false); // Re-enable submission after request completes
    }
  };
  
  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <form onSubmit={handleSubmit} className="bg-white bg-opacity-70 p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl mb-4 text-blue-500 flex items-center justify-center">Admin Registration</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          type="text"
          placeholder="Organization Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <input
          type="text"
          placeholder="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <input
          type="text"
          placeholder="Subdomain"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 w-full"
          disabled={isSubmitting}  // Disable button while submitting
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default AdminRegister;
