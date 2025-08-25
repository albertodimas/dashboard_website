// Configuración de tipos de negocio y sus módulos predefinidos

export enum BusinessType {
  // Belleza y Estética
  BARBERSHOP = 'barbershop',
  HAIR_SALON = 'hair_salon',
  NAIL_SALON = 'nail_salon',
  SPA = 'spa',
  BEAUTY_SALON = 'beauty_salon',
  
  // Salud y Bienestar
  GYM = 'gym',
  PERSONAL_TRAINER = 'personal_trainer',
  YOGA_STUDIO = 'yoga_studio',
  CLINIC = 'clinic',
  DENTAL_CLINIC = 'dental_clinic',
  PHYSIOTHERAPY = 'physiotherapy',
  
  // Servicios Profesionales
  CONSULTING = 'consulting',
  PHOTOGRAPHY = 'photography',
  TATTOO_STUDIO = 'tattoo_studio',
  
  // Otros
  OTHER = 'other'
}

export interface ModuleConfig {
  enabled: boolean;
  features: Record<string, boolean>;
  defaultServices?: Array<{
    name: string;
    duration: number;
    price: number;
  }>;
}

export interface BusinessModules {
  // Módulos base (siempre activos)
  base: {
    appointments: boolean;
    customers: boolean;
    services: boolean;
    staff: boolean;
  };
  
  // Módulos específicos por industria
  beauty?: ModuleConfig;
  fitness?: ModuleConfig;
  medical?: ModuleConfig;
  loyalty?: ModuleConfig;
  inventory?: ModuleConfig;
  packages?: ModuleConfig;
}

// Configuración predefinida por tipo de negocio
export const BUSINESS_TYPE_CONFIGS: Record<string, {
  label: string;
  icon: string;
  description: string;
  modules: BusinessModules;
  suggestedServices: Array<{
    name: string;
    duration: number;
    price: number;
    category?: string;
  }>;
}> = {
  [BusinessType.BARBERSHOP]: {
    label: 'Barbería',
    icon: '💈',
    description: 'Cortes de cabello, afeitado y cuidado de barba',
    modules: {
      base: {
        appointments: true,
        customers: true,
        services: true,
        staff: true
      },
      loyalty: {
        enabled: true,
        features: {
          points: true,
          rewards: true,
          referrals: true
        }
      },
      inventory: {
        enabled: false,
        features: {
          products: true,
          sales: true
        }
      }
    },
    suggestedServices: [
      { name: 'Corte de Cabello', duration: 30, price: 15, category: 'Cortes' },
      { name: 'Corte + Barba', duration: 45, price: 25, category: 'Combos' },
      { name: 'Afeitado Clásico', duration: 30, price: 20, category: 'Barba' },
      { name: 'Diseño de Barba', duration: 20, price: 12, category: 'Barba' },
      { name: 'Corte Niño', duration: 20, price: 10, category: 'Cortes' }
    ]
  },
  
  [BusinessType.HAIR_SALON]: {
    label: 'Peluquería',
    icon: '💇‍♀️',
    description: 'Corte, color, tratamientos capilares',
    modules: {
      base: {
        appointments: true,
        customers: true,
        services: true,
        staff: true
      },
      beauty: {
        enabled: true,
        features: {
          beforeAfter: true,
          treatments: true,
          colorFormulas: true
        }
      },
      inventory: {
        enabled: true,
        features: {
          products: true,
          sales: true,
          supplies: true
        }
      }
    },
    suggestedServices: [
      { name: 'Corte Dama', duration: 45, price: 30, category: 'Cortes' },
      { name: 'Tinte Completo', duration: 120, price: 80, category: 'Color' },
      { name: 'Mechas/Balayage', duration: 180, price: 120, category: 'Color' },
      { name: 'Tratamiento Keratina', duration: 150, price: 150, category: 'Tratamientos' },
      { name: 'Peinado Evento', duration: 60, price: 50, category: 'Peinados' }
    ]
  },
  
  [BusinessType.NAIL_SALON]: {
    label: 'Salón de Uñas',
    icon: '💅',
    description: 'Manicura, pedicura, nail art',
    modules: {
      base: {
        appointments: true,
        customers: true,
        services: true,
        staff: true
      },
      beauty: {
        enabled: true,
        features: {
          beforeAfter: true,
          designs: true,
          gallery: true
        }
      },
      loyalty: {
        enabled: true,
        features: {
          points: true,
          membershipCards: true
        }
      }
    },
    suggestedServices: [
      { name: 'Manicura Básica', duration: 30, price: 20, category: 'Manicura' },
      { name: 'Manicura Gel', duration: 45, price: 35, category: 'Manicura' },
      { name: 'Pedicura Spa', duration: 60, price: 40, category: 'Pedicura' },
      { name: 'Uñas Acrílicas', duration: 90, price: 50, category: 'Extensiones' },
      { name: 'Nail Art', duration: 30, price: 15, category: 'Diseños' }
    ]
  },
  
  [BusinessType.GYM]: {
    label: 'Gimnasio',
    icon: '🏋️',
    description: 'Entrenamiento, clases grupales, membresías',
    modules: {
      base: {
        appointments: true,
        customers: true,
        services: true,
        staff: true
      },
      fitness: {
        enabled: true,
        features: {
          memberships: true,
          groupClasses: true,
          personalTraining: true,
          progressTracking: true,
          workoutPlans: true,
          bodyMetrics: true
        }
      },
      packages: {
        enabled: true,
        features: {
          sessionPacks: true,
          monthlyPlans: true,
          familyPlans: true
        }
      }
    },
    suggestedServices: [
      { name: 'Membresía Mensual', duration: 0, price: 50, category: 'Membresías' },
      { name: 'Entrenamiento Personal', duration: 60, price: 40, category: 'Personal' },
      { name: 'Clase Grupal', duration: 45, price: 15, category: 'Clases' },
      { name: 'Evaluación Física', duration: 30, price: 25, category: 'Evaluaciones' },
      { name: 'Plan Nutricional', duration: 45, price: 35, category: 'Nutrición' }
    ]
  },
  
  [BusinessType.PERSONAL_TRAINER]: {
    label: 'Entrenador Personal',
    icon: '💪',
    description: 'Entrenamiento personalizado, seguimiento de progreso',
    modules: {
      base: {
        appointments: true,
        customers: true,
        services: true,
        staff: false
      },
      fitness: {
        enabled: true,
        features: {
          progressTracking: true,
          workoutPlans: true,
          bodyMetrics: true,
          nutritionPlans: true,
          beforeAfter: true,
          homeService: true
        }
      },
      packages: {
        enabled: true,
        features: {
          sessionPacks: true,
          monthlyPlans: true
        }
      }
    },
    suggestedServices: [
      { name: 'Sesión Individual', duration: 60, price: 50, category: 'Entrenamiento' },
      { name: 'Sesión Domicilio', duration: 60, price: 70, category: 'Domicilio' },
      { name: 'Evaluación Inicial', duration: 45, price: 40, category: 'Evaluaciones' },
      { name: 'Paquete 5 Sesiones', duration: 60, price: 225, category: 'Paquetes' },
      { name: 'Paquete 10 Sesiones', duration: 60, price: 400, category: 'Paquetes' }
    ]
  },
  
  [BusinessType.SPA]: {
    label: 'Spa',
    icon: '🧖‍♀️',
    description: 'Masajes, tratamientos corporales, relajación',
    modules: {
      base: {
        appointments: true,
        customers: true,
        services: true,
        staff: true
      },
      beauty: {
        enabled: true,
        features: {
          treatments: true,
          packages: true,
          giftCards: true
        }
      },
      packages: {
        enabled: true,
        features: {
          dayPasses: true,
          treatments: true,
          combos: true
        }
      }
    },
    suggestedServices: [
      { name: 'Masaje Relajante', duration: 60, price: 60, category: 'Masajes' },
      { name: 'Masaje Piedras Calientes', duration: 90, price: 85, category: 'Masajes' },
      { name: 'Facial Hidratante', duration: 60, price: 70, category: 'Faciales' },
      { name: 'Exfoliación Corporal', duration: 45, price: 50, category: 'Corporales' },
      { name: 'Day Spa Completo', duration: 240, price: 200, category: 'Paquetes' }
    ]
  },
  
  [BusinessType.CLINIC]: {
    label: 'Clínica Médica',
    icon: '🏥',
    description: 'Consultas médicas, diagnóstico, tratamientos',
    modules: {
      base: {
        appointments: true,
        customers: true,
        services: true,
        staff: true
      },
      medical: {
        enabled: true,
        features: {
          medicalHistory: true,
          prescriptions: true,
          labResults: true,
          insurance: true,
          referrals: true,
          followUps: true
        }
      }
    },
    suggestedServices: [
      { name: 'Consulta General', duration: 30, price: 50, category: 'Consultas' },
      { name: 'Consulta Especialista', duration: 45, price: 80, category: 'Consultas' },
      { name: 'Chequeo Anual', duration: 60, price: 100, category: 'Chequeos' },
      { name: 'Urgencia', duration: 20, price: 70, category: 'Urgencias' },
      { name: 'Seguimiento', duration: 15, price: 30, category: 'Consultas' }
    ]
  },
  
  [BusinessType.OTHER]: {
    label: 'Otro',
    icon: '🏢',
    description: 'Personaliza tu tipo de negocio',
    modules: {
      base: {
        appointments: true,
        customers: true,
        services: true,
        staff: true
      }
    },
    suggestedServices: []
  }
};

// Función para obtener módulos recomendados según el tipo de negocio
export function getRecommendedModules(businessType: BusinessType): BusinessModules {
  return BUSINESS_TYPE_CONFIGS[businessType]?.modules || BUSINESS_TYPE_CONFIGS[BusinessType.OTHER].modules;
}

// Función para obtener servicios sugeridos
export function getSuggestedServices(businessType: BusinessType) {
  return BUSINESS_TYPE_CONFIGS[businessType]?.suggestedServices || [];
}

// Función para verificar si un módulo está disponible para un tipo de negocio
export function isModuleAvailable(businessType: BusinessType, moduleName: string): boolean {
  const config = BUSINESS_TYPE_CONFIGS[businessType];
  if (!config) return false;
  
  return moduleName in config.modules && config.modules[moduleName]?.enabled;
}