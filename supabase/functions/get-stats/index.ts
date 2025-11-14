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
    // Parse query parameters
    const url = new URL(req.url)
    const siteId = url.searchParams.get('site_id')
    const date = url.searchParams.get('date')

    if (!siteId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: site_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Build query
    let query = supabase
      .from('daily_stats')
      .select('*')
      .eq('site_id', siteId)

    // Add date filter if provided
    if (date) {
      query = query.eq('date', date)
    }

    query = query.order('date', { ascending: false })

    const { data: stats, error } = await query

    if (error) {
      console.error('Error fetching stats:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If no stats found
    if (!stats || stats.length === 0) {
      return new Response(
        JSON.stringify({
          site_id: siteId,
          date: date || 'all',
          total_views: 0,
          unique_users: 0,
          top_paths: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If date is specified, return single day stats
    if (date && stats.length > 0) {
      const dayStat = stats[0]
      return new Response(
        JSON.stringify({
          site_id: siteId,
          date: dayStat.date,
          total_views: dayStat.total_views,
          unique_users: dayStat.unique_users,
          top_paths: dayStat.path_stats || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If no date specified, aggregate all days
    const totalViews = stats.reduce((sum, s) => sum + s.total_views, 0)
    const totalUniqueUsers = stats.reduce((sum, s) => sum + s.unique_users, 0)

    // Aggregate path stats across all days
    const pathMap = new Map<string, number>()
    for (const stat of stats) {
      if (stat.path_stats) {
        for (const pathStat of stat.path_stats) {
          const current = pathMap.get(pathStat.path) || 0
          pathMap.set(pathStat.path, current + pathStat.views)
        }
      }
    }

    const topPaths = Array.from(pathMap.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    return new Response(
      JSON.stringify({
        site_id: siteId,
        date: 'all',
        days_tracked: stats.length,
        total_views: totalViews,
        unique_users: totalUniqueUsers,
        top_paths: topPaths
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
