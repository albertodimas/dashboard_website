'use client'

import { useEffect, useState } from 'react'
import { BusinessType, getRecommendedModules, BusinessModules } from '@/lib/business-types'

interface UseBusinessModulesProps {
  businessType?: string;
  customModules?: BusinessModules;
}

export function useBusinessModules({ businessType, customModules }: UseBusinessModulesProps = {}) {
  const [modules, setModules] = useState<BusinessModules>(() => {
    if (customModules) return customModules;
    if (businessType) return getRecommendedModules(businessType as BusinessType);
    return {
      base: {
        appointments: true,
        customers: true,
        services: true,
        staff: true
      }
    };
  });

  // Actualizar módulos cuando cambie el tipo de negocio
  useEffect(() => {
    if (businessType && !customModules) {
      setModules(getRecommendedModules(businessType as BusinessType));
    }
  }, [businessType, customModules]);

  // Función para verificar si un módulo está habilitado
  const isModuleEnabled = (moduleName: keyof BusinessModules | string, feature?: string): boolean => {
    if (moduleName === 'base') {
      const f = feature as keyof BusinessModules['base'] | undefined
      return f ? Boolean(modules.base[f]) : true;
    }

    // Access dynamic module safely
    const module = (modules as any)[moduleName];
    if (!module || !module.enabled) return false;
    
    if (feature) {
      return module.features && module.features[feature] === true;
    }
    
    return true;
  };

  // Función para activar/desactivar un módulo
  const toggleModule = (moduleName: keyof BusinessModules | string, enabled: boolean) => {
    setModules(prev => ({
      ...prev,
      [moduleName]: {
        ...(prev as any)[moduleName],
        enabled
      }
    }));
  };

  // Función para activar/desactivar una característica específica
  const toggleFeature = (moduleName: keyof BusinessModules | string, featureName: string, enabled: boolean) => {
    setModules(prev => ({
      ...prev,
      [moduleName]: {
        ...(prev as any)[moduleName],
        features: {
          ...(prev as any)[moduleName]?.features,
          [featureName]: enabled
        }
      }
    }));
  };

  // Obtener lista de módulos activos
  const activeModules = Object.entries(modules)
    .filter(([name, config]) => name !== 'base' && config?.enabled)
    .map(([name]) => name);

  // Verificaciones rápidas para módulos comunes
  const hasFitness = isModuleEnabled('fitness');
  const hasBeauty = isModuleEnabled('beauty');
  const hasMedical = isModuleEnabled('medical');
  const hasPackages = isModuleEnabled('packages');
  const hasLoyalty = isModuleEnabled('loyalty');
  const hasInventory = isModuleEnabled('inventory');

  return {
    modules,
    setModules,
    isModuleEnabled,
    toggleModule,
    toggleFeature,
    activeModules,
    // Accesos directos
    hasFitness,
    hasBeauty,
    hasMedical,
    hasPackages,
    hasLoyalty,
    hasInventory,
    // Funciones específicas de fitness
    hasProgressTracking: isModuleEnabled('fitness', 'progressTracking'),
    hasGroupClasses: isModuleEnabled('fitness', 'groupClasses'),
    hasWorkoutPlans: isModuleEnabled('fitness', 'workoutPlans'),
    // Funciones específicas de belleza
    hasBeforeAfter: isModuleEnabled('beauty', 'beforeAfter'),
    hasTreatments: isModuleEnabled('beauty', 'treatments'),
    // Funciones específicas de paquetes
    hasSessionPacks: isModuleEnabled('packages', 'sessionPacks'),
    hasMonthlyPlans: isModuleEnabled('packages', 'monthlyPlans')
  };
}
