import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultCategories = [
  { name: 'Peluquería', slug: 'peluqueria', icon: '💇', color: '#FF6B6B', order: 1 },
  { name: 'Barbería', slug: 'barberia', icon: '💈', color: '#4ECDC4', order: 2 },
  { name: 'Salón de Uñas', slug: 'salon-unas', icon: '💅', color: '#FF69B4', order: 3 },
  { name: 'Spa', slug: 'spa', icon: '🧖', color: '#95E1D3', order: 4 },
  { name: 'Masajes', slug: 'masajes', icon: '💆', color: '#C9A0DC', order: 5 },
  { name: 'Gimnasio', slug: 'gimnasio', icon: '🏋️', color: '#F38181', order: 6 },
  { name: 'Centro Fitness', slug: 'centro-fitness', icon: '💪', color: '#FCE38A', order: 7 },
  { name: 'Yoga/Pilates', slug: 'yoga-pilates', icon: '🧘', color: '#A8E6CF', order: 8 },
  { name: 'Clínica Médica', slug: 'clinica-medica', icon: '🏥', color: '#7FD1AE', order: 9 },
  { name: 'Dentista', slug: 'dentista', icon: '🦷', color: '#B4E7CE', order: 10 },
  { name: 'Veterinaria', slug: 'veterinaria', icon: '🐾', color: '#FDCB6E', order: 11 },
  { name: 'Centro de Belleza', slug: 'centro-belleza', icon: '✨', color: '#FD79A8', order: 12 },
  { name: 'Tatuajes', slug: 'tatuajes', icon: '🎨', color: '#6C5CE7', order: 13 },
  { name: 'Terapias', slug: 'terapias', icon: '🌿', color: '#55A3FF', order: 14 },
  { name: 'Restaurante', slug: 'restaurante', icon: '🍽️', color: '#FAB1A0', order: 15 },
  { name: 'Automotriz', slug: 'automotriz', icon: '🚗', color: '#74B9FF', order: 16 },
  { name: 'Educación/Tutorías', slug: 'educacion-tutorias', icon: '📚', color: '#A29BFE', order: 17 },
  { name: 'Fotografía', slug: 'fotografia', icon: '📸', color: '#FFA502', order: 18 },
  { name: 'Otros', slug: 'otros', icon: '📋', color: '#B2BEC3', order: 19 }
]

async function seedCategories() {
  console.log('🌱 Seeding categories...')
  
  for (const category of defaultCategories) {
    try {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          icon: category.icon,
          color: category.color,
          order: category.order,
          isActive: true
        },
        create: category
      })
      console.log(`✅ Category "${category.name}" created/updated`)
    } catch (error) {
      console.error(`❌ Error creating category "${category.name}":`, error)
    }
  }
  
  console.log('✨ Categories seeded successfully!')
}

seedCategories()
  .catch((error) => {
    console.error('Error seeding categories:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })