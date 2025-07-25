import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, params } = await req.json()
    const golfApiKey = Deno.env.get('GOLF_API_KEY')
    
    if (!golfApiKey) {
      return new Response(
        JSON.stringify({ error: 'Golf API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let url = `https://api.sportsdata.io/golf/v2/json/${endpoint}`
    
    // Add query parameters if provided
    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    console.log(`Fetching golf data from: ${url}`)

    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': golfApiKey,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`Golf API error: ${response.status} ${response.statusText}`)
      return new Response(
        JSON.stringify({ error: `Golf API error: ${response.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    console.log(`Successfully fetched golf data, ${data.length || 0} items`)

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in golf-live-data function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})