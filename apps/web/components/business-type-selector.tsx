'use client'

import { useState } from 'react'
import { BusinessType, BUSINESS_TYPE_CONFIGS } from '@/lib/business-types'

interface BusinessTypeSelectorProps {
  value?: string;
  onChange: (type: BusinessType) => void;
  showDescription?: boolean;
}

export function BusinessTypeSelector({ 
  value, 
  onChange,
  showDescription = true 
}: BusinessTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<BusinessType | undefined>(
    value as BusinessType
  );

  const handleSelect = (type: BusinessType) => {
    setSelectedType(type);
    onChange(type);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(BUSINESS_TYPE_CONFIGS).map(([type, config]) => (
          <button
            key={type}
            onClick={() => handleSelect(type as BusinessType)}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${selectedType === type 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="text-3xl mb-2">{config.icon}</div>
            <div className="font-medium text-sm">{config.label}</div>
            {showDescription && (
              <div className="text-xs text-gray-500 mt-1">
                {config.description}
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">
            Módulos incluidos para {BUSINESS_TYPE_CONFIGS[selectedType].label}:
          </h3>
          <div className="space-y-2">
            {Object.entries(BUSINESS_TYPE_CONFIGS[selectedType].modules).map(([module, config]) => {
              if (module === 'base') return null;
              if (!config || !config.enabled) return null;
              
              return (
                <div key={module} className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm capitalize">{module}</span>
                  {config.features && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({Object.keys(config.features).length} características)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}