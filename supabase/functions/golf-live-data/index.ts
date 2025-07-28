import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GolfLeaderboardData {
  name: string;
  position: number;
  score: number;
  thru: string | number;
  status: 'WON' | 'LOST' | 'ACTIVE' | 'CUT';
  rounds?: number[];
  teeTime?: string;
}

interface GolfDataResponse {
  success: boolean;
  data: GolfLeaderboardData[];
  source: string;
  errors?: string[];
  tournament?: {
    id: string;
    name: string;
    status: string;
  };
}

/**
 * Five-tier golf data fetching with fallback hierarchy:
 * 1. Slash Golf API (Primary)
 * 2. PGA Tour Internal JSON (Secondary) 
 * 3. ESPN Golf API (Fallback #1)
 * 4. Sportsdata.io Golf API (Fallback #2)
 * 5. The Odds API (Fallback #3)
 */
async function fetchGolfStats(endpoint: string): Promise<GolfDataResponse> {
  const errors: string[] = []
  
  // Tier 1: Slash Golf API
  const slashGolfKey = Deno.env.get('SLASHGOLF_API_KEY')
  if (slashGolfKey) {
    try {
      console.log('Trying Slash Golf API...')
      const url = `https://api.slashgolf.com/v1/${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${slashGolfKey}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const transformedData = transformSlashGolfData(data)
        console.log(`Slash Golf success: ${transformedData.length} items`)
        return {
          success: true,
          data: transformedData,
          source: 'Slash Golf',
          tournament: data.tournament
        }
      } else {
        errors.push(`Slash Golf: ${response.status}`)
        console.log(`Slash Golf failed: ${response.status}`)
      }
    } catch (error) {
      errors.push(`Slash Golf: ${error.message}`)
      console.log(`Slash Golf error: ${error.message}`)
    }
  } else {
    errors.push('Slash Golf: API key not configured')
    console.log('Slash Golf: API key not configured')
  }

  // Tier 2: PGA Tour Internal JSON
  try {
    console.log('Trying PGA Tour API...')
    // First get current tournament ID
    const messageResponse = await fetch('https://statdata.pgatour.com/r/current/message.json')
    if (messageResponse.ok) {
      const messageData = await messageResponse.json()
      const tournamentId = messageData?.tid || messageData?.tournament_id
      
      if (tournamentId) {
        const leaderboardResponse = await fetch(`https://statdata.pgatour.com/r/${tournamentId}/leaderboard-v2.json`)
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json()
          const transformedData = transformPGATourData(leaderboardData)
          console.log(`PGA Tour success: ${transformedData.length} items`)
          return {
            success: true,
            data: transformedData,
            source: 'PGA Tour',
            errors,
            tournament: {
              id: tournamentId,
              name: leaderboardData.tournament?.name || 'Current Tournament',
              status: leaderboardData.tournament?.status || 'active'
            }
          }
        } else {
          errors.push(`PGA Tour: Leaderboard ${leaderboardResponse.status}`)
          console.log(`PGA Tour leaderboard failed: ${leaderboardResponse.status}`)
        }
      } else {
        errors.push('PGA Tour: No active tournament found')
        console.log('PGA Tour: No active tournament found')
      }
    } else {
      errors.push(`PGA Tour: Message ${messageResponse.status}`)
      console.log(`PGA Tour message failed: ${messageResponse.status}`)
    }
  } catch (error) {
    errors.push(`PGA Tour: ${error.message}`)
    console.log(`PGA Tour error: ${error.message}`)
  }

  // Tier 3: ESPN Golf API
  const espnApiKey = Deno.env.get('ESPN_API_KEY')
  try {
    console.log('Trying ESPN API...')
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (espnApiKey) {
      headers['Authorization'] = `Bearer ${espnApiKey}`
    }

    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard', {
      headers
    })

    if (response.ok) {
      const data = await response.json()
      const transformedData = transformESPNData(data)
      console.log(`ESPN success: ${transformedData.length} items`)
      return {
        success: true,
        data: transformedData,
        source: 'ESPN',
        errors,
        tournament: data.events?.[0] ? {
          id: data.events[0].id,
          name: data.events[0].name,
          status: data.events[0].status?.type?.name || 'active'
        } : undefined
      }
    } else {
      errors.push(`ESPN: ${response.status}`)
      console.log(`ESPN failed: ${response.status}`)
    }
  } catch (error) {
    errors.push(`ESPN: ${error.message}`)
    console.log(`ESPN error: ${error.message}`)
  }

  // Tier 4: Sportsdata.io Golf API
  const sportsdataKey = Deno.env.get('SPORTSDATA_API_KEY')
  if (sportsdataKey) {
    try {
      console.log('Trying Sportsdata.io API...')
      let url = `https://api.sportsdata.io/golf/v2/json/${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': sportsdataKey,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const transformedData = transformSportsdataData(data)
        console.log(`Sportsdata.io success: ${transformedData.length} items`)
        return {
          success: true,
          data: transformedData,
          source: 'Sportsdata.io',
          errors
        }
      } else {
        errors.push(`Sportsdata.io: ${response.status}`)
        console.log(`Sportsdata.io failed: ${response.status}`)
      }
    } catch (error) {
      errors.push(`Sportsdata.io: ${error.message}`)
      console.log(`Sportsdata.io error: ${error.message}`)
    }
  } else {
    errors.push('Sportsdata.io: API key not configured')
    console.log('Sportsdata.io: API key not configured')
  }

  // Tier 5: The Odds API
  const oddsApiKey = Deno.env.get('ODDS_API_KEY')
  if (oddsApiKey) {
    try {
      console.log('Trying Odds API...')
      const response = await fetch('https://api.the-odds-api.com/v4/sports/golf/odds/', {
        headers: {
          'Authorization': `Bearer ${oddsApiKey}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const transformedData = transformOddsAPIData(data)
        console.log(`Odds API success: ${transformedData.length} items`)
        return {
          success: true,
          data: transformedData,
          source: 'Odds API',
          errors
        }
      } else {
        errors.push(`Odds API: ${response.status}`)
        console.log(`Odds API failed: ${response.status}`)
      }
    } catch (error) {
      errors.push(`Odds API: ${error.message}`)
      console.log(`Odds API error: ${error.message}`)
    }
  } else {
    errors.push('Odds API: API key not configured')
    console.log('Odds API: API key not configured')
  }

  // All APIs failed
  throw new Error(`All golf data sources failed: ${errors.join(', ')}`)
}

// Data transformation functions
function transformSlashGolfData(data: any): GolfLeaderboardData[] {
  if (!data?.leaderboard) return []
  
  return data.leaderboard.map((player: any) => ({
    name: player.name || player.player_name,
    position: player.position || player.pos,
    score: player.total_score || player.score || 0,
    thru: player.thru || player.holes_completed || 'F',
    status: normalizeStatus(player.status),
    rounds: player.rounds || [],
    teeTime: player.tee_time
  }))
}

function transformPGATourData(data: any): GolfLeaderboardData[] {
  if (!data?.leaderboard?.players) return []
  
  return data.leaderboard.players.map((player: any) => ({
    name: player.player_bio?.first_name + ' ' + player.player_bio?.last_name,
    position: parseInt(player.current_position) || 0,
    score: parseInt(player.total_strokes) || 0,
    thru: player.thru || 'F',
    status: normalizeStatus(player.player_state),
    rounds: player.rounds?.map((r: any) => r.strokes) || [],
    teeTime: player.tee_time
  }))
}

function transformESPNData(data: any): GolfLeaderboardData[] {
  if (!data?.events?.[0]?.competitions?.[0]?.competitors) return []
  
  const competitors = data.events[0].competitions[0].competitors
  return competitors.map((competitor: any) => ({
    name: competitor.athlete?.displayName || competitor.athlete?.name,
    position: competitor.status?.position || 0,
    score: competitor.score || 0,
    thru: competitor.status?.thru || 'F',
    status: normalizeStatus(competitor.status?.type?.name)
  }))
}

function transformSportsdataData(data: any): GolfLeaderboardData[] {
  if (!Array.isArray(data)) return []
  
  return data.map((player: any) => ({
    name: player.Name || player.PlayerName,
    position: player.Rank || player.Position || 0,
    score: player.TotalScore || player.Score || 0,
    thru: player.Thru || 'F',
    status: normalizeStatus(player.Status)
  }))
}

function transformOddsAPIData(data: any): GolfLeaderboardData[] {
  // Odds API typically doesn't have leaderboard data, but may have player info
  if (!Array.isArray(data)) return []
  
  return data.map((item: any) => ({
    name: item.player_name || item.name,
    position: 0, // No position data from odds
    score: 0, // No score data from odds
    thru: '-',
    status: 'ACTIVE' as const
  }))
}

function normalizeStatus(status: string | undefined): 'WON' | 'LOST' | 'ACTIVE' | 'CUT' {
  if (!status) return 'ACTIVE'
  
  const statusLower = status.toLowerCase()
  if (statusLower.includes('cut') || statusLower.includes('wd') || statusLower.includes('dq')) {
    return 'CUT'
  }
  if (statusLower.includes('won') || statusLower.includes('win')) {
    return 'WON'
  }
  if (statusLower.includes('complete') || statusLower.includes('finish')) {
    return 'LOST'
  }
  return 'ACTIVE'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, params } = await req.json()
    
    // Use new five-tier system
    try {
      let finalEndpoint = endpoint || 'Leaderboards'
      
      // Map odds requests to leaderboard for now since we have leaderboard data
      if (endpoint === 'odds' || endpoint === 'Odds/Tournament/Current') {
        finalEndpoint = 'Leaderboards'
      }
      
      const result = await fetchGolfStats(finalEndpoint)
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      // If all APIs fail, return mock data as ultimate fallback
      console.log('All APIs failed, returning mock data')
      console.log(`Error: ${error.message}`)

      const mockWyndhamData = [
        { name: 'Scottie Scheffler', position: 1, score: -12, thru: 'F', status: 'WON' },
        { name: 'Russell Henley', position: 2, score: -11, thru: 'F', status: 'LOST' },
        { name: 'Billy Horschel', position: 3, score: -10, thru: 'F', status: 'LOST' },
        { name: 'Chris Kirk', position: 4, score: -9, thru: 'F', status: 'LOST' },
        { name: 'Xander Schauffele', position: 5, score: -8, thru: 'F', status: 'LOST' },
        { name: 'Shane Lowry', position: 6, score: -7, thru: 'F', status: 'LOST' },
        { name: 'Collin Morikawa', position: 7, score: -6, thru: 'F', status: 'LOST' },
        { name: 'Patrick Cantlay', position: 8, score: -5, thru: 'F', status: 'LOST' },
        { name: 'Sungjae Im', position: 9, score: -4, thru: 'F', status: 'LOST' },
        { name: 'Cameron Young', position: 10, score: -3, thru: 'F', status: 'LOST' }
      ]

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: mockWyndhamData, 
          source: 'Mock Data',
          errors: [error.message]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in golf-live-data function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})