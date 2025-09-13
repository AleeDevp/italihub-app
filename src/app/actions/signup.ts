'use server'

import { z } from 'zod'

// Define the signup schema for validation
const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Simple in-memory storage for demo purposes
const registeredUsers: Array<{
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
}> = []

export async function signupAction(prevState: any, formData: FormData) {
  console.log('Signup action called with formData:', formData)
  
  try {
    // Extract data from FormData
    const rawData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    console.log('Raw signup data:', { ...rawData, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' })

    // Validate data with zod
    const validatedData = signupSchema.parse(rawData)
    console.log('Validated signup data:', { 
      ...validatedData, 
      password: '[HIDDEN]', 
      confirmPassword: '[HIDDEN]' 
    })

    // Check if user already exists
    const existingUser = registeredUsers.find(user => user.email === validatedData.email)
    if (existingUser) {
      console.log('User already exists with email:', validatedData.email)
      return {
        success: false,
        message: 'User with this email already exists',
        errors: { email: 'This email is already registered' },
        user: null,
      }
    }

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      password: validatedData.password, // In real app, this would be hashed
    }

    // Add to our "database"
    registeredUsers.push(newUser)
    console.log('New user created:', { ...newUser, password: '[HIDDEN]' })
    console.log('Total registered users:', registeredUsers.length)

    // Return user data for immediate login
    const user = {
      id: newUser.id,
      email: newUser.email,
      name: `${newUser.firstName} ${newUser.lastName}`,
      avatar: newUser.firstName.charAt(0).toUpperCase() + newUser.lastName.charAt(0).toUpperCase()
    }

    return {
      success: true,
      message: 'Account created successfully! Welcome to ItaliHub!',
      errors: null,
      user,
    }
  } catch (error) {
    console.error('Signup error:', error)
    
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
      message: 'An unexpected error occurred during signup',
      errors: null,
      user: null,
    }
  }
}

export type SignupState = {
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
