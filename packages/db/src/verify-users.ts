import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

type MembershipWithBusiness = {
  role: string
  business: {
    id: string
    name: string
    slug: string | null
    customSlug: string | null
  }
}

type UserWithRelations = {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  isActive: boolean
  tenant: { name: string; subdomain: string } | null
  memberships: MembershipWithBusiness[]
}

function describeUser(user: UserWithRelations) {
  console.log(`User: ${user.name ?? 'N/A'} <${user.email}>`)
  console.log(`  Tenant: ${user.tenant ? `${user.tenant.name} (${user.tenant.subdomain})` : '-'}`)
  console.log(`  Admin: ${user.isAdmin ? 'yes' : 'no'} | Active: ${user.isActive ? 'yes' : 'no'}`)
  if (user.memberships.length) {
    console.log('  Memberships:')
    for (const membership of user.memberships) {
      const businessIdentifier =
        membership.business.slug ??
        membership.business.customSlug ??
        membership.business.id
      console.log(`    - ${membership.role} @ ${membership.business.name} (${businessIdentifier})`)
    }
  }
  console.log('---')
}

async function ensureDemoUsers() {
  const demoConfigs = [
    {
      tenant: {
        name: 'Luxury Cuts Barbershop',
        subdomain: 'luxurycuts',
        email: 'admin@luxurycuts.com',
        phone: '+1234567890',
      },
      user: {
        email: 'owner@luxurycuts.com',
        name: 'John Smith',
        isAdmin: true,
      },
    },
    {
      tenant: {
        name: 'Glamour Nails Studio',
        subdomain: 'glamournails',
        email: 'admin@glamournails.com',
        phone: '+1234567891',
      },
      user: {
        email: 'owner@glamournails.com',
        name: 'Sarah Johnson',
        isAdmin: true,
      },
    },
  ] as const

  const demoPassword = await bcrypt.hash('password123', 10)

  for (const config of demoConfigs) {
    const tenant = await prisma.tenant.upsert({
      where: { subdomain: config.tenant.subdomain },
      update: {
        email: config.tenant.email,
        phone: config.tenant.phone,
      },
      create: {
        name: config.tenant.name,
        subdomain: config.tenant.subdomain,
        email: config.tenant.email,
        phone: config.tenant.phone,
        settings: {},
      },
    })

    await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: config.user.email,
        },
      },
      update: {
        passwordHash: demoPassword,
        isActive: true,
        isAdmin: config.user.isAdmin,
        name: config.user.name,
      },
      create: {
        tenantId: tenant.id,
        email: config.user.email,
        passwordHash: demoPassword,
        name: config.user.name,
        isActive: true,
        isAdmin: config.user.isAdmin,
        emailVerified: new Date(),
      },
    })
  }
}

async function verifyUsers() {
  try {
    console.log('Ensuring demo users are present...')
    await ensureDemoUsers()

    console.log('\nListing users:\n')

    const users = await prisma.user.findMany({
      include: {
        tenant: {
          select: {
            name: true,
            subdomain: true,
          },
        },
        memberships: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
                customSlug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    for (const user of users as UserWithRelations[]) {
      describeUser(user)
    }

    console.log('\nVerification complete.')
  } catch (error) {
    console.error('Error during verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyUsers()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
