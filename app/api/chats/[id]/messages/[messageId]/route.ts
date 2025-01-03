import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string, messageId: string } }
) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_token')?.value
    const { content } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const message = await prisma.message.update({
      where: {
        id: params.messageId,
      },
      data: {
        content,
      },
    })

    return NextResponse.json(message)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    )
  }
} 