import React, { useEffect, useState } from 'react'

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onClose()
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getToastClasses = () => {
    const baseClasses = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform'
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-500 text-white`
      case 'error':
        return `${baseClasses} bg-red-500 text-white`
      case 'warning':
        return `${baseClasses} bg-yellow-500 text-black`
      default:
        return `${baseClasses} bg-blue-500 text-white`
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={getToastClasses()}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose(), 300)
          }}
          className="ml-4 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default Toast 