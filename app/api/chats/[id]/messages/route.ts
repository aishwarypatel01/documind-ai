import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_token')?.value
    const { content, role } = await request.json()
    const chatId = context.params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
    })

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    const message = await prisma.message.create({
      data: {
        content,
        role,
        chatId
      }
    })

    return NextResponse.json(message)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    )
  }
} 