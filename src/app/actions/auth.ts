'use server'

import { z } from 'zod'

// Define the login schema for validation
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

// Dummy user data for practice
const DUMMY_USER = {
  email: 'user@example.com',
  password: 'password123',
}

export async function loginAction(prevState: any, formData: FormData) {
  console.log('Login action called with formData:', formData)
  
  try {
    // Extract data from FormData
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    console.log('Raw form data:', rawData)

    // Validate data with zod
    const validatedData = loginSchema.parse(rawData)
    console.log('Validated data:', validatedData)

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check against dummy data
    if (
      validatedData.email === DUMMY_USER.email &&
      validatedData.password === DUMMY_USER.password
    ) {
      console.log('Login successful')
      
      // Create user object from the validated email
      const user = {
        id: '1',
        email: validatedData.email,
        name: validatedData.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        avatar: validatedData.email.charAt(0).toUpperCase() + validatedData.email.charAt(1).toUpperCase()
      }
      
      return {
        success: true,
        message: 'Login successful!',
        errors: null,
        user, // Return user data
      }
    } else {
      console.log('Invalid credentials')
      return {
        success: false,
        message: 'Invalid email or password',
        errors: null,
        user: null,
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      console.log('Validation errors:', error.errors)
      return {
        success: false,
        message: 'Validation failed',
        errors: error.errors.reduce((acc, err) => {
          acc[err.path[0]] = err.message
          return acc
        }, {} as Record<string, string>),
        user: null,
      }
    }

    return {
      success: false,
      message: 'An unexpected error occurred',
      errors: null,
      user: null,
    }
  }
}

export type LoginState = {
  success: boolean
  message: string
  errors: Record<string, string> | null
  user: {
    id: string
    email: string
    name: string
    avatar: string
  } | null
}
