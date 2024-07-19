import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'


const Register = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  })
  const [error, setError] = useState('')
  const navigate = useNavigate();

  const changeInputHandler = (e) => {
    setUserData(prevState => {
      return { ...prevState, [e.target.name]: e.target.value }
    })
  }

  const registerUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/users/register`, userData);

      console.log(response); // Debugging line

      if (response && response.data) {
        const newUser = response.data;
        console.log(newUser);
        navigate('/login'); // Call navigate as a function
      } else {
        setError("Couldn't register user. Please try again");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <section className='register'>
      <div className='container'>
        <h2>Sign Up</h2>
        <form className='form register__form' onSubmit={registerUser}>

          {error && <p className='form__error-message'>{error} </p>}

          <input type='text' placeholder='Full name' name='name' value={userData.name} onChange={changeInputHandler} />

          <input type='email' placeholder='Email' name='email' value={userData.email} onChange={changeInputHandler} />

          <input type='password' placeholder='Password' name='password' value={userData.password} onChange={changeInputHandler} />

          <input type='password' placeholder='Confirm Password' name='password2' value={userData.password2} onChange={changeInputHandler} />

          <button type='submit' className='btn primary'>Register</button>

        </form>

        <small>Already have an account? <Link to='/login'>sign in</Link></small>

      </div>
    </section>
  )
}

export default Register
