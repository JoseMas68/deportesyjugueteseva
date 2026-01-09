import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres').regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  parentId: z.string().optional().nullable(),
  menuSection: z.enum(['deportes', 'juguetes', 'hobbies']).optional().nullable(),
  displayOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
})

// GET - Listar todas las categorías
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get('includeProducts') === 'true'

    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: { id: true, name: true },
        },
        children: {
          select: { id: true, name: true },
        },
        ...(includeProducts && {
          _count: {
            select: { products: true },
          },
        }),
      },
      orderBy: [
        { menuSection: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createCategorySchema.parse(body)

    // Verificar que el nombre no exista
    const existingName = await prisma.category.findUnique({
      where: { name: validated.name },
    })
    if (existingName) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      )
    }

    // Verificar que el slug no exista
    const existingSlug = await prisma.category.findUnique({
      where: { slug: validated.slug },
    })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese slug' },
        { status: 400 }
      )
    }

    // Si tiene parentId, verificar que exista
    if (validated.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: validated.parentId },
      })
      if (!parent) {
        return NextResponse.json(
          { error: 'La categoría padre no existe' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description || null,
        imageUrl: validated.imageUrl || null,
        parentId: validated.parentId || null,
        menuSection: validated.menuSection || null,
        displayOrder: validated.displayOrder,
        isActive: validated.isActive,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    )
  }
}
