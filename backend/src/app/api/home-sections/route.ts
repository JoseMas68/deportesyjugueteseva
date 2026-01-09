import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const sections = await prisma.homeSection.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Error fetching home sections:', error)
    return NextResponse.json(
      { error: 'Error fetching home sections' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, subtitle, type, config, displayOrder, isActive, linkUrl, linkText } = body

    const section = await prisma.homeSection.create({
      data: {
        title,
        subtitle,
        type,
        config,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
        linkUrl,
        linkText,
      },
    })

    return NextResponse.json({ section }, { status: 201 })
  } catch (error) {
    console.error('Error creating home section:', error)
    return NextResponse.json(
      { error: 'Error creating home section' },
      { status: 500 }
    )
  }
}
