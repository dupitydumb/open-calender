import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event, { IEvent } from '@/models/Event';

// POST: Migrate localStorage events to MongoDB
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Validate that we received an array of events
    if (!Array.isArray(body.events)) {
      return NextResponse.json(
        { success: false, error: 'Expected an array of events' },
        { status: 400 }
      );
    }

    const events: IEvent[] = body.events;
    
    if (events.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No events to migrate', migrated: 0 },
        { status: 200 }
      );
    }

    // Validate each event has required fields
    for (const event of events) {
      if (!event.id || !event.title || !event.color) {
        return NextResponse.json(
          { success: false, error: 'Each event must have id, title, and color' },
          { status: 400 }
        );
      }
    }

    // Check for existing events with same IDs and skip them
    const existingIds = await Event.find({ 
      id: { $in: events.map(e => e.id) } 
    }).select('id');
    
    const existingIdSet = new Set(existingIds.map(e => e.id));
    const newEvents = events.filter(e => !existingIdSet.has(e.id));

    if (newEvents.length === 0) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'All events already exist in database', 
          migrated: 0,
          skipped: events.length 
        },
        { status: 200 }
      );
    }

    // Batch insert new events
    const result = await Event.insertMany(newEvents, { ordered: false });
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${result.length} events`,
      migrated: result.length,
      skipped: events.length - result.length,
      data: result 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error migrating events:', error);
    
    // Handle partial success (some events inserted, some failed)
    if (error.insertedDocs && error.insertedDocs.length > 0) {
      return NextResponse.json(
        { 
          success: true, 
          message: `Partially migrated ${error.insertedDocs.length} events`,
          migrated: error.insertedDocs.length,
          error: 'Some events failed to migrate'
        },
        { status: 207 } // Multi-status
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to migrate events' },
      { status: 500 }
    );
  }
}
