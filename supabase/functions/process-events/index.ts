import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting event processing...')

    // Fetch unprocessed events (batch processing)
    const { data: queuedEvents, error: fetchError } = await supabase
      .from('events_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(1000)

    if (fetchError) {
      console.error('Error fetching queued events:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!queuedEvents || queuedEvents.length === 0) {
      console.log('No events to process')
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No events in queue' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${queuedEvents.length} events...`)

    // Insert events into main events table
    const eventsToInsert = queuedEvents.map(event => ({
      site_id: event.site_id,
      event_type: event.event_type,
      path: event.path,
      user_id: event.user_id,
      timestamp: event.timestamp
    }))

    const { error: insertError } = await supabase
      .from('events')
      .insert(eventsToInsert)

    if (insertError) {
      console.error('Error inserting events:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark events as processed
    const eventIds = queuedEvents.map(e => e.id)
    const { error: updateError } = await supabase
      .from('events_queue')
      .update({ processed: true })
      .in('id', eventIds)

    if (updateError) {
      console.error('Error updating queue:', updateError)
    }

    // Aggregate stats by site and date
    const statsMap = new Map<string, any>()

    for (const event of queuedEvents) {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      const key = `${event.site_id}:${date}`

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          site_id: event.site_id,
          date: date,
          users: new Set(),
          paths: new Map()
        })
      }

      const stats = statsMap.get(key)
      stats.users.add(event.user_id)
      
      const pathCount = stats.paths.get(event.path) || 0
      stats.paths.set(event.path, pathCount + 1)
    }

    // Update daily_stats table
    for (const [key, stats] of statsMap.entries()) {
    const pathStats: { path: string; views: number }[] = []
    for (const [path, views] of stats.paths.entries()) {
      pathStats.push({ path: path as string, views: views as number })
    }
    pathStats.sort((a, b) => b.views - a.views)

      // Upsert daily stats
      const { error: upsertError } = await supabase
        .from('daily_stats')
        .upsert(
          {
            site_id: stats.site_id,
            date: stats.date,
            total_views: pathStats.reduce((sum: number, p: { path: string; views: number }) => sum + p.views, 0),
            unique_users: stats.users.size,
            path_stats: pathStats,
            last_updated: new Date().toISOString()
          },
          { 
            onConflict: 'site_id,date',
            ignoreDuplicates: false 
          }
        )

      if (upsertError) {
        console.error('Error upserting daily stats:', upsertError)
      }
    }

    console.log(`Successfully processed ${queuedEvents.length} events`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: queuedEvents.length,
        aggregated_days: statsMap.size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
