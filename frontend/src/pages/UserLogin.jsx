import React, { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Toast from '../components/Toast'

const UserLogin = () => {
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ isLoading, setIsLoading ] = useState(false)
  const [ toast, setToast ] = useState(null)

  const { user, login } = useContext(UserDataContext)
  const navigate = useNavigate()

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  const submitHandler = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      showToast('Please fill in all fields', 'error')
      return
    }

    if (!email.includes('@')) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    setIsLoading(true)

    try {
      const userData = {
        email: email,
        password: password
      }

      const response = await axios.post(`${import.meta.env.VITE_BASE_URL || 'http://localhost:3000'}/users/login`, userData)

      if (response.status === 200) {
        const data = response.data
        login(data.user, data.token, 'user')
        showToast('Login successful!', 'success')
        setTimeout(() => {
          navigate('/home')
        }, 1000)
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.'
      showToast(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }

    setEmail('')
    setPassword('')
  }

  return (
    <div className='p-7 h-screen flex flex-col justify-between'>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div>
        <img className='w-16 mb-10' src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYQy-OIkA6In0fTvVwZADPmFFibjmszu2A0g&s" alt="" />

        <form onSubmit={(e) => {
          submitHandler(e)
        }}>
          <h3 className='text-lg font-medium mb-2'>What's your email</h3>
          <input
            required
            className="bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <h3 className='text-lg font-medium mb-2'>Enter Password</h3>
          

          <input
            type="password"
            placeholder="Password"
            className="bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            disabled={isLoading}
            className={`${isLoading ? 'bg-gray-400' : 'bg-[#111]'} text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base flex items-center justify-center`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>

        </form>
        <p className='text-center'>New here? <Link to='/signup' className='text-blue-600'>Create new Account</Link></p>
      </div>
      <div>
        <Link
          to='/captain-login'
          className='bg-[#10b461] flex items-center justify-center text-white font-semibold mb-5 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base'
        >Sign in as Captain</Link>
      </div>
    </div>
  )
}

export default UserLogin