import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EventPayload {
  site_id: string
  event_type: string
  path: string
  user_id: string
  timestamp: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const startTime = performance.now()

    // Parse and validate request
    const payload: EventPayload = await req.json()
    
    // Validate required fields
    if (!payload.site_id || !payload.event_type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: site_id and event_type are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client for background processing
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Queue the event in background (non-blocking)
    const backgroundTask = async () => {
      try {
        console.log('Background: Inserting event into queue', payload)
        
        const { error } = await supabase
          .from('events_queue')
          .insert({
            site_id: payload.site_id,
            event_type: payload.event_type,
            path: payload.path || '/',
            user_id: payload.user_id || 'anonymous',
            timestamp: payload.timestamp || new Date().toISOString(),
            processed: false
          })

        if (error) {
          console.error('Background: Error inserting event', error)
        } else {
          console.log('Background: Event queued successfully')
        }
      } catch (error) {
        console.error('Background: Exception in queue insert', error)
      }
    }

    // Start background task without awaiting
    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundTask())
    } else {
      // Fallback for local development
      backgroundTask()
    }

    // Calculate response time
    const responseTime = performance.now() - startTime

    // Return immediately (FAST!)
    return new Response(
      JSON.stringify({ 
        success: true, 
        queued: true,
        response_time_ms: Math.round(responseTime * 100) / 100
      }),
      { 
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in ingest-event:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid request format' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
