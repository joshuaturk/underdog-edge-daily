import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface FootballRequest {
  endpoint: string
  params: Record<string, any>
}

// Mock data for testing
const mockTeams = {
  'premier-league': [
    'Arsenal', 'Aston Villa', 'Brighton', 'Burnley', 'Chelsea', 'Crystal Palace',
    'Everton', 'Fulham', 'Liverpool', 'Luton Town', 'Manchester City', 
    'Manchester United', 'Newcastle', 'Nottingham Forest', 'Sheffield United',
    'Tottenham', 'West Ham', 'Wolves', 'Bournemouth', 'Brentford'
  ],
  'championship': [
    'Birmingham City', 'Blackburn', 'Bristol City', 'Cardiff City', 'Coventry City',
    'Hull City', 'Ipswich Town', 'Leeds United', 'Leicester City', 'Middlesbrough',
    'Millwall', 'Norwich City', 'Plymouth Argyle', 'Preston North End', 'QPR',
    'Rotherham', 'Sheffield Wednesday', 'Southampton', 'Stoke City', 'Sunderland',
    'Swansea City', 'Watford', 'West Bromwich Albion', 'Huddersfield Town'
  ]
}

function generateMockFixtures(league: string) {
  const teams = mockTeams[league as keyof typeof mockTeams] || []
  const fixtures = []
  
  // Generate some upcoming fixtures
  for (let i = 0; i < Math.min(10, teams.length / 2); i++) {
    const homeIndex = i * 2
    const awayIndex = (i * 2 + 1) % teams.length
    
    if (homeIndex < teams.length && awayIndex < teams.length) {
      const kickoffDate = new Date()
      kickoffDate.setDate(kickoffDate.getDate() + Math.floor(Math.random() * 7) + 1)
      
      fixtures.push({
        id: `${league}-${i}`,
        home_team: teams[homeIndex],
        away_team: teams[awayIndex],
        kickoff_time: kickoffDate.toISOString(),
        date: kickoffDate.toISOString().split('T')[0],
        status: 'upcoming',
        gameweek: Math.floor(Math.random() * 10) + 25 // Current gameweek range
      })
    }
  }
  
  return fixtures
}

function generateMockTeamMatches(teamName: string) {
  const matches = []
  
  // Generate last 10 matches with realistic BTTS rates
  const baseBTTSRate = 0.45 + Math.random() * 0.25 // 45-70%
  
  for (let i = 0; i < 10; i++) {
    const matchDate = new Date()
    matchDate.setDate(matchDate.getDate() - (i + 1) * 7) // Weekly matches
    
    const homeScore = Math.floor(Math.random() * 4)
    const awayScore = Math.floor(Math.random() * 4)
    
    // Apply BTTS rate bias
    const shouldBTTS = Math.random() < baseBTTSRate
    const finalHomeScore = shouldBTTS && homeScore === 0 ? 1 : homeScore
    const finalAwayScore = shouldBTTS && awayScore === 0 ? 1 : awayScore
    
    matches.push({
      date: matchDate.toISOString().split('T')[0],
      home_score: finalHomeScore,
      away_score: finalAwayScore,
      opponent: `Opponent ${i + 1}`,
      is_home: Math.random() > 0.5
    })
  }
  
  return matches
}

async function fetchRealFootballData(endpoint: string, params: Record<string, any>) {
  // This would implement real API calls to football data providers
  // For now, return mock data
  console.log(`Mock API call: ${endpoint}`, params)
  
  switch (endpoint) {
    case 'fixtures':
      return {
        success: true,
        data: {
          fixtures: generateMockFixtures(params.league || 'premier-league')
        },
        source: 'Mock API'
      }
      
    case 'team-matches':
      return {
        success: true,
        data: {
          matches: generateMockTeamMatches(params.team)
        },
        source: 'Mock API'
      }
      
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`)
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { endpoint, params }: FootballRequest = await req.json()
    
    console.log('Football data request:', { endpoint, params })
    
    const result = await fetchRealFootballData(endpoint, params)
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Football data error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})