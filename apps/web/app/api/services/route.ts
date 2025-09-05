import { NextResponse } from 'next/server';
import { prisma } from '@dashboard/db';

export async function GET() {
  try {
    const services = await prisma.service.findMany();

    const formattedServices = services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description || '',
      category: service.type.toLowerCase().replace('_', '-'),
      address: service.address || '',
      phone: service.phone || '',
      priceRange: '$$',
      rating: 4.5 + Math.random() * 0.5,
      reviewCount: Math.floor(Math.random() * 500) + 50
    }));

    return NextResponse.json(formattedServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json([], { status: 200 });
  }
}