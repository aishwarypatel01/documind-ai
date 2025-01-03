import { hash, compare } from 'bcryptjs'
import { prisma } from './db'

export async function createUser(email: string, password: string) {
  const hashedPassword = await hash(password, 12)
  
  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return { user: userWithoutPassword }
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Email already exists')
    }
    throw error
  }
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  const isValid = await compare(password, user.password)

  if (!isValid) {
    throw new Error('Invalid credentials')
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user
  return { user: userWithoutPassword }
} 