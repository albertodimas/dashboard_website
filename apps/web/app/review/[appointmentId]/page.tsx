'use client'

import { logger } from '@/lib/logger'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Check, AlertCircle } from 'lucide-react'

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.appointmentId as string
  
  const [appointment, setAppointment] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchAppointmentDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/review/appointment/${appointmentId}`)
      if (response.ok) {
        const data = await response.json()
        setAppointment(data)
        
        // Check if review already exists
        if (data.hasReview) {
          setSubmitted(true)
          setRating(data.existingReview.rating)
          setComment(data.existingReview.comment)
        }
      } else {
        setError('Invalid or expired review link')
      }
    } catch (error) {
      logger.error('Error fetching appointment:', error)
      setError('Failed to load appointment details')
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    void fetchAppointmentDetails()
  }, [fetchAppointmentDetails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          rating,
          comment
        })
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit review')
      }
    } catch (error) {
      logger.error('Error submitting review:', error)
      setError('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Oops!</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto bg-green-100 rounded-full w-20 h-20 flex items-center justify-center">
                <Check className="text-green-600" size={40} />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Your review has been submitted successfully. We appreciate your feedback!
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={24}
                    className={`${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              {comment && (
                <p className="text-gray-700 italic mt-3">&quot;{comment}&quot;</p>
              )}
            </div>

            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              How was your experience?
            </h1>
            <p className="text-gray-600">
              We&apos;d love to hear about your visit to {appointment?.business?.name}
            </p>
          </div>

          {/* Service Details */}
          {appointment && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-semibold">Service:</span> {appointment.service?.name}</p>
                <p><span className="font-semibold">Date:</span> {new Date(appointment.startTime).toLocaleDateString()}</p>
                {appointment.staff && (
                  <p><span className="font-semibold">Staff:</span> {appointment.staff.name}</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Rating Selection */}
            <div className="mb-8">
              <label className="block text-gray-700 font-semibold mb-4">
                Rate your experience
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={40}
                      className={`${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center mt-2">
                <span className="text-sm text-gray-600">
                  {rating === 0 && 'Click to rate'}
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-8">
              <label htmlFor="comment" className="block text-gray-700 font-semibold mb-2">
                Tell us more (optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Share your experience with others..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Your review will be publicly visible to help others make informed decisions.
        </p>
      </div>
    </div>
  )
}