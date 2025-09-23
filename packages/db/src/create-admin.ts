import { prisma } from './index'
import * as bcrypt from 'bcryptjs'

async function createAdmin() {
  try {
    // Primero, buscar o crear el tenant del sistema
    const systemTenant = await prisma.tenant.upsert({
      where: { id: '00000000-0000-0000-0000-000000000000' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'System',
        subdomain: 'admin',
        email: 'admin@nexodash.com',
        settings: {
          features: {
            multiTenant: true,
            userManagement: true
          }
        }
      }
    })

    console.log('✅ System tenant created/found')

    // Crear el usuario administrador
    const hashedPassword = await bcrypt.hash('Admin123!', 10)
    
    const admin = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: systemTenant.id,
          email: 'admin@nexodash.com'
        }
      },
      update: {
        passwordHash: hashedPassword,
        isAdmin: true,
        isActive: true,
        name: 'System Administrator'
      },
      create: {
        tenantId: systemTenant.id,
        email: 'admin@nexodash.com',
        passwordHash: hashedPassword,
        name: 'System Administrator',
        emailVerified: new Date(),
        isActive: true,
        isAdmin: true
      }
    })

    console.log('✅ Admin user created/updated:')
    console.log('   Email: admin@nexodash.com')
    console.log('   Password: Admin123!')
    console.log('   Access: http://localhost:3000/admin/login')
    
    return admin
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
  .then(() => {
    console.log('\n✨ Admin setup complete!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Failed to create admin:', err)
    process.exit(1)
  })