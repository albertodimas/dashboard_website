export type OperationMode = 'RESERVA' | 'PROYECTO'

export const OperationModes: { value: OperationMode; label: string; description: string }[] = [
  { value: 'RESERVA', label: 'Reserva', description: 'Clientes reservan fecha y hora en tu calendario' },
  { value: 'PROYECTO', label: 'Proyecto', description: 'Clientes envían una solicitud; tú coordinas después' },
]

export function getOperationMode(settings: any): OperationMode {
  const v = settings?.operationMode
  return v === 'PROYECTO' ? 'PROYECTO' : 'RESERVA'
}
