'use client'

import { Info } from 'lucide-react'

type Mode = 'RESERVA' | 'PROYECTO'

export default function OperationModeSelector({
  value,
  onChange,
}: { value: Mode; onChange: (m: Mode) => void }) {
  const cards: Array<{ key: Mode; title: string; desc: string }> = [
    {
      key: 'RESERVA',
      title: 'Reserva',
      desc: 'Tus clientes eligen fecha y hora en tu calendario.',
    },
    {
      key: 'PROYECTO',
      title: 'Proyecto',
      desc: 'Recibes una solicitud y luego coordinas contacto y fecha.',
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {cards.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key)}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            value === c.key
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{c.title}</span>
            <Info size={16} className="text-gray-400" title={c.desc} />
          </div>
          <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
        </button>
      ))}
    </div>
  )
}

