'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BusinessTypeSelector } from '@/components/business-type-selector'
import { BusinessType } from '@/lib/business-types'

export default function ModulesSettingsPage() {
  const router = useRouter();
  const [businessType, setBusinessType] = useState<BusinessType>(BusinessType.OTHER);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar configuración actual al montar el componente
  useEffect(() => {
    fetch('/api/dashboard/business/modules')
      .then(res => res.json())
      .then(data => {
        if (data.businessType) {
          setBusinessType(data.businessType as BusinessType);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading business type:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/dashboard/business/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType
        })
      });

      if (response.ok) {
        // Redirigir a la página de configuración con mensaje de éxito
        router.push('/dashboard/settings?updated=true');
      } else {
        alert('Error al guardar el tipo de negocio');
      }
    } catch (error) {
      console.error('Error saving business type:', error);
      alert('Error al guardar el tipo de negocio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Tipo de Negocio</h1>
        <p className="text-gray-600">
          Selecciona el tipo de negocio que mejor describe tu empresa
        </p>
      </div>

      {/* Selector de tipo de negocio */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-6">Categoría del Negocio</h2>
        <BusinessTypeSelector 
          value={businessType}
          onChange={setBusinessType}
        />
        
        {/* Nota informativa */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Esta configuración es informativa y ayuda a identificar tu tipo de negocio. 
            Los módulos y funcionalidades disponibles son gestionados por el administrador de la plataforma.
          </p>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Funcionalidades Disponibles</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Sistema de reservas y citas
          </div>
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Gestión de servicios
          </div>
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Sistema de paquetes y sesiones
          </div>
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Gestión de personal (staff)
          </div>
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Portal de clientes
          </div>
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Galería de imágenes
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Para habilitar funcionalidades adicionales, contacta al administrador de la plataforma.
        </p>
      </div>

      {/* Botón de guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Tipo de Negocio'}
        </button>
      </div>
    </div>
  );
}