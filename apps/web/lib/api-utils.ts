import { NextResponse } from 'next/server'

export function ok(data?: any, init?: ResponseInit) {
  if (data === undefined) return NextResponse.json({ success: true }, init)
  return NextResponse.json({ success: true, data }, init)
}

export function fail(message: string, status = 400, details?: any) {
  const body: any = { error: message }
  if (details !== undefined) body.details = details
  return NextResponse.json(body, { status })
}

export function getString(value: any, trim = true) {
  if (typeof value !== 'string') return ''
  return trim ? value.trim() : value
}

