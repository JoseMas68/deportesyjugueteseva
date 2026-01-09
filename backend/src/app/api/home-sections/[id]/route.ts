import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const section = await prisma.homeSection.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, subtitle, type, config, displayOrder, isActive, linkUrl, linkText } = body

    const section = await prisma.homeSection.update({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.homeSection.delete({
      where: { id },
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
