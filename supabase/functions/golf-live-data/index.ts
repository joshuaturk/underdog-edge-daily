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
    const oddsApiKey = Deno.env.get('ODDS_API_KEY')
    
    let data = null
    let successfulSource = ''
    const errors: string[] = []

    // Try SportsDataIO first if we have the key
    if (golfApiKey) {
      try {
        const url = `https://api.sportsdata.io/golf/v2/json/${endpoint}${params ? '?' + new URLSearchParams(params).toString() : ''}`
        console.log(`Trying SportsDataIO: ${url}`)
        
        const response = await fetch(url, {
          headers: {
            'Ocp-Apim-Subscription-Key': golfApiKey,
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          data = await response.json()
          successfulSource = 'SportsDataIO'
          console.log(`SportsDataIO success: ${data?.length || 'unknown'} items`)
        } else {
          errors.push(`SportsDataIO: ${response.status}`)
          console.warn(`SportsDataIO failed: ${response.status}`)
        }
      } catch (error) {
        errors.push(`SportsDataIO: ${error.message}`)
        console.warn(`SportsDataIO error: ${error.message}`)
      }
    }

    // Try ESPN API as fallback
    if (!data) {
      try {
        let espnUrl = ''
        switch (endpoint) {
          case 'Tournaments':
            espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard'
            break
          case 'Leaderboards':
            espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard'
            break
          case 'Players':
            espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/athletes'
            break
          default:
            throw new Error(`ESPN endpoint ${endpoint} not supported`)
        }

        console.log(`Trying ESPN: ${espnUrl}`)
        const response = await fetch(espnUrl)
        
        if (response.ok) {
          const espnData = await response.json()
          data = transformESPNData(espnData, endpoint)
          successfulSource = 'ESPN'
          console.log(`ESPN success`)
        } else {
          errors.push(`ESPN: ${response.status}`)
          console.warn(`ESPN failed: ${response.status}`)
        }
      } catch (error) {
        errors.push(`ESPN: ${error.message}`)
        console.warn(`ESPN error: ${error.message}`)
      }
    }

    // If still no data, return mock data to prevent app crash
    if (!data) {
      console.warn('All APIs failed, returning mock data')
      data = getMockData(endpoint)
      successfulSource = 'Mock Data'
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        source: successfulSource,
        errors: errors.length > 0 ? errors : undefined
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

// Transform ESPN data to match expected format
function transformESPNData(espnData: any, endpoint: string) {
  switch (endpoint) {
    case 'Tournaments':
      return espnData.events?.map((event: any) => ({
        TournamentID: event.id,
        Name: event.name,
        StartDate: event.date,
        EndDate: event.date,
        Venue: event.competitions?.[0]?.venue?.fullName,
        Location: event.competitions?.[0]?.venue?.address?.city,
        IsInProgress: event.status?.type?.name === 'STATUS_IN_PROGRESS',
        IsOver: event.status?.type?.name === 'STATUS_FINAL'
      })) || []
    
    case 'Leaderboards':
      return espnData.events?.[0]?.competitions?.[0]?.competitors?.map((competitor: any) => ({
        PlayerName: competitor.athlete?.displayName,
        Rank: competitor.linescores?.[0]?.value,
        TotalScore: competitor.score,
        Thru: competitor.status?.displayValue,
        MadeCut: competitor.status?.type?.name !== 'STATUS_CUT'
      })) || []
    
    case 'Players':
      return espnData.athletes?.map((athlete: any, index: number) => ({
        PlayerID: athlete.id,
        FirstName: athlete.firstName,
        LastName: athlete.lastName,
        Name: athlete.displayName
      })) || []
    
    default:
      return []
  }
}

// Mock data fallback to prevent app crashes
function getMockData(endpoint: string) {
  switch (endpoint) {
    case 'Tournaments':
      return [{
        TournamentID: 1,
        Name: "3M Open",
        StartDate: "2025-07-24T00:00:00",
        EndDate: "2025-07-27T00:00:00",
        IsOver: false,
        IsInProgress: true,
        Venue: "TPC Twin Cities",
        Location: "Blaine, MN"
      }]
    
    case 'Players':
      return Array.from({ length: 20 }, (_, i) => ({
        PlayerID: 40000000 + i,
        FirstName: `Player`,
        LastName: `${i + 1}`,
        Name: `Player ${i + 1}`
      }))
    
    case 'Leaderboards':
      return []
    
    default:
      return []
  }
}