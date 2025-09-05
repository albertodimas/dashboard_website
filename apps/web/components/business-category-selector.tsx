'use client'

export enum BusinessCategory {
  HAIR_SALON = 'HAIR_SALON',
  BARBERSHOP = 'BARBERSHOP',
  NAIL_SALON = 'NAIL_SALON',
  SPA = 'SPA',
  MASSAGE = 'MASSAGE',
  GYM = 'GYM',
  FITNESS = 'FITNESS',
  YOGA = 'YOGA',
  MEDICAL = 'MEDICAL',
  DENTAL = 'DENTAL',
  VETERINARY = 'VETERINARY',
  BEAUTY = 'BEAUTY',
  TATTOO = 'TATTOO',
  THERAPY = 'THERAPY',
  RESTAURANT = 'RESTAURANT',
  AUTOMOTIVE = 'AUTOMOTIVE',
  EDUCATION = 'EDUCATION',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  OTHER = 'OTHER'
}

export const businessCategoryLabels: Record<BusinessCategory, string> = {
  [BusinessCategory.HAIR_SALON]: 'Peluquería',
  [BusinessCategory.BARBERSHOP]: 'Barbería',
  [BusinessCategory.NAIL_SALON]: 'Salón de Uñas',
  [BusinessCategory.SPA]: 'Spa',
  [BusinessCategory.MASSAGE]: 'Masajes',
  [BusinessCategory.GYM]: 'Gimnasio',
  [BusinessCategory.FITNESS]: 'Centro Fitness',
  [BusinessCategory.YOGA]: 'Yoga/Pilates',
  [BusinessCategory.MEDICAL]: 'Clínica Médica',
  [BusinessCategory.DENTAL]: 'Dentista',
  [BusinessCategory.VETERINARY]: 'Veterinaria',
  [BusinessCategory.BEAUTY]: 'Centro de Belleza',
  [BusinessCategory.TATTOO]: 'Tatuajes',
  [BusinessCategory.THERAPY]: 'Terapias',
  [BusinessCategory.RESTAURANT]: 'Restaurante',
  [BusinessCategory.AUTOMOTIVE]: 'Automotriz',
  [BusinessCategory.EDUCATION]: 'Educación/Tutorías',
  [BusinessCategory.PHOTOGRAPHY]: 'Fotografía',
  [BusinessCategory.OTHER]: 'Otros'
}

interface BusinessCategorySelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function BusinessCategorySelector({ value, onChange, disabled = false }: BusinessCategorySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Categoría del Negocio
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
      >
        <option value="">Seleccionar categoría...</option>
        {Object.entries(businessCategoryLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-gray-500">
        Esta categoría ayuda a organizar tu negocio y evitar conflictos con competidores directos
      </p>
    </div>
  )
}