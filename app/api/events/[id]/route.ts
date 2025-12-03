import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';

// PUT: Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();
    
    // Don't allow updating the ID itself
    delete body._id;
    delete body.id;
    
    const event = await Event.findOneAndUpdate(
      { id },
      body,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: event 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE: Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;
    
    const event = await Event.findOneAndDelete({ id });
    
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: event 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete event' },
      { status: 500 }
    );
  }
}
