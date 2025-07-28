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
    
    // Try multiple data sources
    const errors: string[] = []
    
    // Try SportsDataIO first
    if (golfApiKey) {
      try {
        let url = `https://api.sportsdata.io/golf/v2/json/${endpoint}`
        if (params) {
          const searchParams = new URLSearchParams(params)
          url += `?${searchParams.toString()}`
        }
        
        console.log(`Trying SportsDataIO: ${url}`)
        
        const response = await fetch(url, {
          headers: {
            'Ocp-Apim-Subscription-Key': golfApiKey,
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`SportsDataIO success: ${data.length || 0} items`)
          return new Response(
            JSON.stringify({ success: true, data, source: 'SportsDataIO' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          errors.push(`SportsDataIO: ${response.status}`)
          console.log(`SportsDataIO failed: ${response.status}`)
        }
      } catch (error) {
        errors.push(`SportsDataIO: ${error.message}`)
        console.log(`SportsDataIO error: ${error.message}`)
      }
    }

    // Try ESPN as fallback
    try {
      let espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard'
      
      // Handle different endpoints for ESPN
      if (endpoint === 'Odds/Tournament/Current') {
        console.log('ESPN error: ESPN endpoint Odds/Tournament/Current not supported')
        errors.push('ESPN: ESPN endpoint Odds/Tournament/Current not supported')
      } else {
        console.log(`Trying ESPN: ${espnUrl}`)
        
        const response = await fetch(espnUrl, {
          headers: { 'Accept': 'application/json' }
        })

        if (response.ok) {
          const data = await response.json()
          
          // Transform ESPN data to our format if it's leaderboard data
          let transformedData = data
          if (data.events && data.events[0] && data.events[0].competitions) {
            const competition = data.events[0].competitions[0]
            if (competition.competitors) {
              transformedData = competition.competitors.map((competitor: any) => ({
                name: competitor.athlete?.displayName || competitor.athlete?.name,
                position: competitor.status?.position || 0,
                score: competitor.score || 0,
                thru: competitor.status?.thru || 'F',
                status: competitor.status?.type?.name || 'ACTIVE'
              }))
            }
          }
          
          console.log(`ESPN success: ${transformedData.length || 0} items`)
          return new Response(
            JSON.stringify({ success: true, data: transformedData, source: 'ESPN' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          errors.push(`ESPN: ${response.status}`)
          console.log(`ESPN failed: ${response.status}`)
        }
      }
    } catch (error) {
      errors.push(`ESPN: ${error.message}`)
      console.log(`ESPN error: ${error.message}`)
    }

    // All APIs failed, return mock data for 3M Open
    console.log('All APIs failed, returning mock data')
    const mock3MOpenData = [
      { name: 'Scottie Scheffler', position: 1, score: -15, thru: 'F', status: 'WON' },
      { name: 'Tom Kim', position: 2, score: -13, thru: 'F', status: 'LOST' },
      { name: 'Sahith Theegala', position: 3, score: -12, thru: 'F', status: 'LOST' },
      { name: 'Shane Lowry', position: 4, score: -11, thru: 'F', status: 'LOST' },
      { name: 'Adam Hadwin', position: 5, score: -10, thru: 'F', status: 'LOST' },
      { name: 'Matt Fitzpatrick', position: 6, score: -9, thru: 'F', status: 'LOST' },
      { name: 'Rickie Fowler', position: 7, score: -8, thru: 'F', status: 'LOST' },
      { name: 'Tony Finau', position: 8, score: -7, thru: 'F', status: 'LOST' },
      { name: 'Cameron Young', position: 9, score: -6, thru: 'F', status: 'LOST' },
      { name: 'Hideki Matsuyama', position: 10, score: -5, thru: 'F', status: 'LOST' }
    ]

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: mock3MOpenData, 
        source: 'Mock Data', 
        errors 
      }),
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