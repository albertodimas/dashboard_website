import bcrypt from 'bcryptjs'
import { prisma } from '@nexodash/db'

export async function validatePasswordHistory(
  customerId: string, 
  newPassword: string,
  historyLimit: number = 7
): Promise<{ isValid: boolean; error?: string }> {
  // Obtener las últimas N contraseñas del historial
  const passwordHistory = await prisma.passwordHistory.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: historyLimit
  })

  // Verificar contra cada contraseña del historial
  for (const historicalPassword of passwordHistory) {
    const isReused = await bcrypt.compare(newPassword, historicalPassword.passwordHash)
    if (isReused) {
      return {
        isValid: false,
        error: `No puedes usar una contraseña que hayas utilizado en las últimas ${historyLimit} veces. Por favor, elige una contraseña diferente.`
      }
    }
  }

  return { isValid: true }
}

export async function addPasswordToHistory(
  customerId: string,
  passwordHash: string,
  historyLimit: number = 7
): Promise<void> {
  // Agregar la nueva contraseña al historial
  await prisma.passwordHistory.create({
    data: {
      customerId,
      passwordHash
    }
  })

  // Limpiar historial si hay más contraseñas del límite
  const allHistory = await prisma.passwordHistory.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' }
  })

  if (allHistory.length > historyLimit) {
    const toDelete = allHistory.slice(historyLimit)
    await prisma.passwordHistory.deleteMany({
      where: {
        id: { in: toDelete.map(h => h.id) }
      }
    })
  }
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Al menos una mayúscula')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Al menos una minúscula')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Al menos un número')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Al menos un carácter especial')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}