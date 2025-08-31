import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el cliente ya existe
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase()
      }
    })

    if (existingCustomer) {
      // Si existe pero no tiene contraseña, actualizar
      if (!existingCustomer.password) {
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const updatedCustomer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            password: hashedPassword,
            name: name || existingCustomer.name,
            phone: phone || existingCustomer.phone
          }
        })

        // Generar token
        const token = jwt.sign(
          { 
            customerId: updatedCustomer.id,
            email: updatedCustomer.email,
            name: updatedCustomer.name
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        )

        return NextResponse.json({
          success: true,
          token,
          customer: {
            id: updatedCustomer.id,
            name: updatedCustomer.name,
            email: updatedCustomer.email,
            phone: updatedCustomer.phone
          },
          message: 'Cuenta actualizada exitosamente'
        })
      } else {
        return NextResponse.json(
          { error: 'Este email ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Crear nuevo cliente
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Obtener el primer tenant disponible (o crear lógica para asignar tenant)
    const defaultTenant = await prisma.tenant.findFirst()
    
    if (!defaultTenant) {
      return NextResponse.json(
        { error: 'Error de configuración del sistema' },
        { status: 500 }
      )
    }

    const newCustomer = await prisma.customer.create({
      data: {
        tenantId: defaultTenant.id,
        email: email.toLowerCase(),
        name,
        phone,
        password: hashedPassword,
        source: 'PORTAL'
      }
    })

    // Generar token
    const token = jwt.sign(
      { 
        customerId: newCustomer.id,
        email: newCustomer.email,
        name: newCustomer.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone
      }
    })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Error al crear cuenta' },
      { status: 500 }
    )
  }
}