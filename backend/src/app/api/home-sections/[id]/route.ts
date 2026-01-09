import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const section = await prisma.homeSection.findUnique({
      where: { id: params.id },
    })

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Error fetching home section:', error)
    return NextResponse.json(
      { error: 'Error fetching home section' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, subtitle, type, config, displayOrder, isActive, linkUrl, linkText } = body

    const section = await prisma.homeSection.update({
      where: { id: params.id },
      data: {
        title,
        subtitle,
        type,
        config,
        displayOrder,
        isActive,
        linkUrl,
        linkText,
      },
    })

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Error updating home section:', error)
    return NextResponse.json(
      { error: 'Error updating home section' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.homeSection.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting home section:', error)
    return NextResponse.json(
      { error: 'Error deleting home section' },
      { status: 500 }
    )
  }
}
