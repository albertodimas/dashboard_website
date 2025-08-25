'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBusinessModules } from '@/hooks/useBusinessModules'
import { BusinessTypeSelector } from '@/components/business-type-selector'
import { BusinessType, BUSINESS_TYPE_CONFIGS } from '@/lib/business-types'

export default function ModulesSettingsPage() {
  const router = useRouter();
  const [businessType, setBusinessType] = useState<BusinessType>(BusinessType.OTHER);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { 
    modules, 
    setModules,
    toggleModule, 
    toggleFeature,
    isModuleEnabled 
  } = useBusinessModules({ businessType });

  // Cargar configuración actual al montar el componente
  useEffect(() => {
    fetch('/api/dashboard/business/modules')
      .then(res => res.json())
      .then(data => {
        if (data.businessType) {
          setBusinessType(data.businessType as BusinessType);
        }
        if (data.features) {
          setModules(data.features);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading modules:', err);
        setLoading(false);
      });
  }, [setModules]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/dashboard/business/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType,
          features: modules
        })
      });

      if (response.ok) {
        // Redirigir a la página de configuración con mensaje de éxito
        router.push('/dashboard/settings?modules=updated');
      } else {
        alert('Error al guardar los módulos');
      }
    } catch (error) {
      console.error('Error saving modules:', error);
      alert('Error al guardar los módulos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Configuración de Módulos</h1>
        <p className="text-gray-600">
          Personaliza los módulos y funcionalidades según tu tipo de negocio
        </p>
      </div>

      {/* Selector de tipo de negocio */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Tipo de Negocio</h2>
        <BusinessTypeSelector 
          value={businessType}
          onChange={setBusinessType}
        />
      </div>

      {/* Módulos disponibles */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Módulos Disponibles</h2>
        
        <div className="space-y-6">
          {/* Módulo Fitness */}
          {businessType === BusinessType.GYM || businessType === BusinessType.PERSONAL_TRAINER ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold flex items-center">
                    💪 Módulo Fitness
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      Recomendado
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Gestión completa para gimnasios y entrenadores
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isModuleEnabled('fitness')}
                    onChange={(e) => toggleModule('fitness', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {isModuleEnabled('fitness') && (
                <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={isModuleEnabled('fitness', 'progressTracking')}
                      onChange={(e) => toggleFeature('fitness', 'progressTracking', e.target.checked)}
                    />
                    <span>Seguimiento de progreso físico</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={isModuleEnabled('fitness', 'groupClasses')}
                      onChange={(e) => toggleFeature('fitness', 'groupClasses', e.target.checked)}
                    />
                    <span>Clases grupales</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={isModuleEnabled('fitness', 'workoutPlans')}
                      onChange={(e) => toggleFeature('fitness', 'workoutPlans', e.target.checked)}
                    />
                    <span>Planes de entrenamiento</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={isModuleEnabled('fitness', 'bodyMetrics')}
                      onChange={(e) => toggleFeature('fitness', 'bodyMetrics', e.target.checked)}
                    />
                    <span>Métricas corporales</span>
                  </label>
                </div>
              )}
            </div>
          ) : null}

          {/* Módulo Paquetes */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">📦 Paquetes y Sesiones</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Vende paquetes de sesiones y planes mensuales
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isModuleEnabled('packages')}
                  onChange={(e) => toggleModule('packages', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {isModuleEnabled('packages') && (
              <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                <label className="flex items-center text-sm">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                    checked={isModuleEnabled('packages', 'sessionPacks')}
                    onChange={(e) => toggleFeature('packages', 'sessionPacks', e.target.checked)}
                  />
                  <span>Paquetes de sesiones (5, 10, 20)</span>
                </label>
                <label className="flex items-center text-sm">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                    checked={isModuleEnabled('packages', 'monthlyPlans')}
                    onChange={(e) => toggleFeature('packages', 'monthlyPlans', e.target.checked)}
                  />
                  <span>Planes mensuales/anuales</span>
                </label>
              </div>
            )}
          </div>

          {/* Módulo Fidelización */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">🎁 Programa de Fidelización</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sistema de puntos y recompensas para clientes
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isModuleEnabled('loyalty')}
                  onChange={(e) => toggleModule('loyalty', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {isModuleEnabled('loyalty') && (
              <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                <label className="flex items-center text-sm">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                    checked={isModuleEnabled('loyalty', 'points')}
                    onChange={(e) => toggleFeature('loyalty', 'points', e.target.checked)}
                  />
                  <span>Sistema de puntos</span>
                </label>
                <label className="flex items-center text-sm">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                    checked={isModuleEnabled('loyalty', 'rewards')}
                    onChange={(e) => toggleFeature('loyalty', 'rewards', e.target.checked)}
                  />
                  <span>Recompensas y descuentos</span>
                </label>
                <label className="flex items-center text-sm">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                    checked={isModuleEnabled('loyalty', 'referrals')}
                    onChange={(e) => toggleFeature('loyalty', 'referrals', e.target.checked)}
                  />
                  <span>Programa de referidos</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
}