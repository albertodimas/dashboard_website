import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyUsers() {
  try {
    console.log('Verificando usuarios en la base de datos...\n');
    
    const users = await prisma.user.findMany({
      include: {
        tenant: true
      }
    });
    
    console.log(`Total de usuarios encontrados: ${users.length}\n`);
    
    for (const user of users) {
      console.log(`Usuario: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Tenant: ${user.tenant?.name || 'Sin tenant'}`);
      console.log('---');
    }
    
    const demoEmails = ['owner@luxurycuts.com', 'owner@glamournails.com'];
    
    for (const email of demoEmails) {
      const user = await prisma.user.findFirst({
        where: { email }
      });
      
      if (!user) {
        console.log(`\n⚠️ Usuario demo no encontrado: ${email}`);
        console.log('Creando usuario demo...');
        
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        if (email === 'owner@luxurycuts.com') {
          const tenant = await prisma.tenant.create({
            data: {
              name: 'Luxury Cuts Barbershop',
              domain: 'luxurycuts',
              settings: {}
            }
          });
          
          await prisma.user.create({
            data: {
              email,
              passwordHash: hashedPassword,
              name: 'John Smith',
              role: 'OWNER',
              tenantId: tenant.id
            }
          });
          
          await prisma.service.create({
            data: {
              name: 'Luxury Cuts Barbershop',
              type: 'BARBERSHOP',
              description: 'Premium barbershop with expert stylists',
              address: '123 Main St, New York, NY 10001',
              phone: '(555) 123-4567',
              tenantId: tenant.id,
              ownerId: (await prisma.user.findFirst({ where: { email } }))!.id,
              settings: {}
            }
          });
          
          console.log('✅ Usuario creado: owner@luxurycuts.com');
        } else if (email === 'owner@glamournails.com') {
          const tenant = await prisma.tenant.create({
            data: {
              name: 'Glamour Nails & Spa',
              domain: 'glamournails',
              settings: {}
            }
          });
          
          await prisma.user.create({
            data: {
              email,
              passwordHash: hashedPassword,
              name: 'Sarah Johnson',
              role: 'OWNER',
              tenantId: tenant.id
            }
          });
          
          await prisma.service.create({
            data: {
              name: 'Glamour Nails & Spa',
              type: 'NAIL_SALON',
              description: 'Full service nail salon and spa',
              address: '456 Oak Ave, New York, NY 10002',
              phone: '(555) 234-5678',
              tenantId: tenant.id,
              ownerId: (await prisma.user.findFirst({ where: { email } }))!.id,
              settings: {}
            }
          });
          
          console.log('✅ Usuario creado: owner@glamournails.com');
        }
      } else {
        console.log(`\n✅ Usuario demo encontrado: ${email}`);
        const isValidPassword = await bcrypt.compare('password123', user.passwordHash);
        console.log(`  Password válido: ${isValidPassword}`);
        
        if (!isValidPassword) {
          console.log('  Actualizando password...');
          const hashedPassword = await bcrypt.hash('password123', 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
          });
          console.log('  ✅ Password actualizado');
        }
      }
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUsers();