import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FootballRequest {
  endpoint: string
  params: Record<string, any>
}

function leagueToCompetitionCode(league: string): string | null {
  const map: Record<string, string> = {
    'premier-league': 'PL',
    'championship': 'ELC',
    'la-liga': 'PD',
    'bundesliga': 'BL1',
    'serie-a': 'SA',
    'ligue-1': 'FL1',
  }
  return map[league] || null
}

function parseSeason(season?: string): string | undefined {
  if (!season) return undefined
  // Convert formats like "2024-25" -> "2024"
  const m = season.match(/^(\d{4})/)
  return m ? m[1] : undefined
}

async function fetchFootballDataOrg(path: string, apiKey: string) {
  const res = await fetch(`https://api.football-data.org/v4/${path}`, {
    headers: {
      'X-Auth-Token': apiKey,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Football-Data.org error ${res.status}: ${text}`)
  }
  return res.json()
}

async function handleFixtures(params: Record<string, any>, apiKey: string) {
  const code = leagueToCompetitionCode(params.league)
  if (!code) throw new Error(`Unsupported league: ${params.league}`)

  const season = parseSeason(params.season)
  const query = new URLSearchParams()
  query.set('status', 'SCHEDULED')
  if (season) query.set('season', season)

  const data = await fetchFootballDataOrg(`competitions/${code}/matches?${query.toString()}`, apiKey)
  const fixtures = (data.matches || []).map((m: any) => ({
    id: m.id,
    home_team: m.homeTeam?.name,
    away_team: m.awayTeam?.name,
    date: m.utcDate,
    kickoff_time: m.utcDate,
    gameweek: m.matchday,
    venue: m.venue || undefined,
    status: m.status,
  }))
  return { success: true, data: { fixtures } }
}

async function handleTeamMatches(params: Record<string, any>, apiKey: string) {
  const code = leagueToCompetitionCode(params.league)
  if (!code) throw new Error(`Unsupported league: ${params.league}`)
  const teamName = String(params.team || '').toLowerCase()
  if (!teamName) throw new Error('Missing team name')

  // Find team ID within the competition
  const teamsData = await fetchFootballDataOrg(`competitions/${code}/teams`, apiKey)
  const teams: any[] = teamsData.teams || []
  const team = teams.find(t =>
    String(t.name || '').toLowerCase() === teamName ||
    String(t.shortName || '').toLowerCase() === teamName ||
    String(t.tla || '').toLowerCase() === teamName
  )
  if (!team?.id) throw new Error(`Team not found in ${params.league}: ${params.team}`)

  // Fetch recent finished matches; get a window of the last ~6 months
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 6)
  const query = new URLSearchParams({
    status: 'FINISHED',
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  })

  const matchesData = await fetchFootballDataOrg(`teams/${team.id}/matches?${query.toString()}`, apiKey)
  const finished = (matchesData.matches || [])
    .sort((a: any, b: any) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, Number(params.limit || 10))

  const matches = finished.map((m: any) => ({
    date: m.utcDate,
    home_team: m.homeTeam?.name,
    away_team: m.awayTeam?.name,
    home_score: m.score?.fullTime?.home ?? 0,
    away_score: m.score?.fullTime?.away ?? 0,
    btts: (m.score?.fullTime?.home ?? 0) > 0 && (m.score?.fullTime?.away ?? 0) > 0,
  }))

  return { success: true, data: { matches } }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY')
    if (!apiKey) throw new Error('FOOTBALL_DATA_API_KEY is not set in Supabase Edge Function secrets')

    const { endpoint, params }: FootballRequest = await req.json()

    let result
    switch (endpoint) {
      case 'fixtures':
        result = await handleFixtures(params, apiKey)
        break
      case 'team-matches':
        result = await handleTeamMatches(params, apiKey)
        break
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    })
  } catch (error) {
    console.error('Football data error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    })
  }
})