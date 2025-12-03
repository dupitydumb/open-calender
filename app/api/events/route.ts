import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';

// GET: Fetch all events
export async function GET() {
  try {
    await connectDB();
    const events = await Event.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      data: events 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST: Create new event
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.title || !body.color) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, title, or color' },
        { status: 400 }
      );
    }

    const event = await Event.create(body);
    
    return NextResponse.json({ 
      success: true, 
      data: event 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Event with this ID already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}
