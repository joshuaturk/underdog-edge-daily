import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ESPN API helpers
async function fetchESPNGolfData(endpoint: string) {
  const espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/golf'
  
  let espnUrl = ''
  switch (endpoint) {
    case 'Tournaments':
      espnUrl = `${espnBaseUrl}/pga/scoreboard`
      break
    case 'Leaderboards':
      espnUrl = `${espnBaseUrl}/pga/leaderboard`
      break
    case 'Players':
      espnUrl = `${espnBaseUrl}/pga/athletes`
      break
    default:
      throw new Error(`ESPN endpoint ${endpoint} not supported`)
  }

  console.log(`Fetching ESPN data from: ${espnUrl}`)
  
  const response = await fetch(espnUrl)
  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`)
  }
  
  return await response.json()
}

// The Odds API helpers
async function fetchOddsAPIData(endpoint: string, oddsApiKey?: string) {
  if (!oddsApiKey) {
    throw new Error('Odds API key not available')
  }
  
  const oddsBaseUrl = 'https://api.the-odds-api.com/v4/sports/golf_pga_championship/odds'
  
  console.log(`Fetching Odds API data from: ${oddsBaseUrl}`)
  
  const response = await fetch(`${oddsBaseUrl}?apiKey=${oddsApiKey}&regions=us&markets=h2h`)
  if (!response.ok) {
    throw new Error(`Odds API error: ${response.status}`)
  }
  
  return await response.json()
}

// SportsDataIO helpers
async function fetchSportsDataIO(endpoint: string, params: any, golfApiKey: string) {
  let url = `https://api.sportsdata.io/golf/v2/json/${endpoint}`
  
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  console.log(`Fetching SportsDataIO data from: ${url}`)

  const response = await fetch(url, {
    headers: {
      'Ocp-Apim-Subscription-Key': golfApiKey,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`SportsDataIO API error: ${response.status}`)
  }

  return await response.json()
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
    let errors: string[] = []

    // Try SportsDataIO first (primary source)
    if (golfApiKey) {
      try {
        data = await fetchSportsDataIO(endpoint, params, golfApiKey)
        successfulSource = 'SportsDataIO'
        console.log(`Successfully fetched data from SportsDataIO, ${data?.length || 'unknown'} items`)
      } catch (error) {
        console.warn(`SportsDataIO failed: ${error.message}`)
        errors.push(`SportsDataIO: ${error.message}`)
      }
    }

    // Try ESPN API as fallback
    if (!data) {
      try {
        const espnData = await fetchESPNGolfData(endpoint)
        // Transform ESPN data to match our expected format
        data = transformESPNData(espnData, endpoint)
        successfulSource = 'ESPN'
        console.log(`Successfully fetched data from ESPN API`)
      } catch (error) {
        console.warn(`ESPN API failed: ${error.message}`)
        errors.push(`ESPN: ${error.message}`)
      }
    }

    // Try Odds API for odds-specific data
    if (!data && endpoint === 'Odds' && oddsApiKey) {
      try {
        const oddsData = await fetchOddsAPIData(endpoint, oddsApiKey)
        data = transformOddsAPIData(oddsData)
        successfulSource = 'The Odds API'
        console.log(`Successfully fetched data from The Odds API`)
      } catch (error) {
        console.warn(`Odds API failed: ${error.message}`)
        errors.push(`Odds API: ${error.message}`)
      }
    }

    if (!data) {
      console.error(`All API sources failed for endpoint ${endpoint}:`, errors)
      return new Response(
        JSON.stringify({ 
          error: `All API sources failed`,
          details: errors,
          endpoint 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        source: successfulSource 
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

// Transform ESPN data to match our expected format
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

// Transform Odds API data to match our expected format
function transformOddsAPIData(oddsData: any) {
  return oddsData.map((game: any) => ({
    PlayerName: game.home_team,
    Value: game.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price,
    Sportsbook: game.bookmakers?.[0]?.title
  })) || []
}