"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const router = useRouter()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // In a real application, you would send this data to your backend for authentication
    console.log("Form submitted:", formData)
    // Simulate successful signin
    router.push("/")
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-4xl font-bold mb-4">Sign In</h1>
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">
            Email
          </label>
          <input type="email" id="email" name="email" required className="input-field" onChange={handleChange} />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="input-field"
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn-primary">
          Sign In
        </button>
      </form>
    </div>
  )
}

