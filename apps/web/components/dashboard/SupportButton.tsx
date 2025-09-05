'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SupportButtonProps {
  className?: string
  businessName?: string
  userEmail?: string
}

export default function SupportButton({ className = '', businessName, userEmail }: SupportButtonProps) {
  const [supportNumber, setSupportNumber] = useState<string>('')
  const [messageTemplate, setMessageTemplate] = useState<string>('')

  useEffect(() => {
    // Get support configuration from environment or API
    setSupportNumber(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER || '+1234567890')
    setMessageTemplate(process.env.NEXT_PUBLIC_SUPPORT_MESSAGE_TEMPLATE || 'Hola, necesito ayuda con mi dashboard de negocio')
  }, [])

  const handleWhatsAppClick = () => {
    // Clean the phone number (remove spaces, dashes, etc)
    const cleanNumber = supportNumber.replace(/[^0-9+]/g, '')
    
    // Create the message with business context
    let message = messageTemplate
    if (businessName) {
      message += `\n\nNegocio: ${businessName}`
    }
    if (userEmail) {
      message += `\nEmail: ${userEmail}`
    }
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message)
    
    // Open WhatsApp with the support number and pre-filled message
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      {/* Floating Support Button */}
      <button
        onClick={handleWhatsAppClick}
        className={`fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 z-50 ${className}`}
        title="Contactar Soporte por WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden md:inline font-medium">Soporte</span>
      </button>

      {/* Mobile version - only icon */}
      <style jsx>{`
        @media (max-width: 768px) {
          button {
            padding: 12px;
          }
        }
      `}</style>
    </>
  )
}