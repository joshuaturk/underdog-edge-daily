import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TeamMatch {
  opponent: string;
  date: string;
  home_score: number;
  away_score: number;
  is_home: boolean;
}

// Calculate recency weights for BTTS algorithm
function calculateRecencyWeights(n: number = 10): number[] {
  const weights = []
  const totalSum = Array.from({length: n}, (_, i) => n - i).reduce((sum, val) => sum + val, 0)
  
  for (let i = 0; i < n; i++) {
    weights.push((n - i) / totalSum)
  }
  return weights
}

// Calculate recency-weighted BTTS rate for a team
function calculateTeamBTTSRate(matches: TeamMatch[]): number {
  if (matches.length === 0) return 0
  
  const weights = calculateRecencyWeights(10)
  const matchesToUse = matches.slice(0, 10)
  
  let weightedSum = 0
  let totalWeight = 0
  
  matchesToUse.forEach((match, index) => {
    if (index < weights.length) {
      const btts = match.home_score > 0 && match.away_score > 0
      weightedSum += weights[index] * (btts ? 1 : 0)
      totalWeight += weights[index]
    }
  })
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

// Mock function to get team matches (replace with real API calls)
async function getTeamMatches(teamName: string, league: string): Promise<TeamMatch[]> {
  // In real implementation, this would call external football APIs
  console.log(`Fetching matches for ${teamName} in ${league}`)
  
  // Generate realistic mock data for now
  const baseBTTSRate = 0.45 + Math.random() * 0.25 // 45-70%
  
  const matches: TeamMatch[] = []
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
      opponent: `Opponent ${i + 1}`,
      date: matchDate.toISOString().split('T')[0],
      home_score: finalHomeScore,
      away_score: finalAwayScore,
      is_home: Math.random() > 0.5
    })
  }
  
  return matches
}

// Get upcoming fixtures for current gameweek
async function getUpcomingFixtures(): Promise<any[]> {
  // Mock fixtures for testing
  const mockTeams = {
    'Premier League': [
      'Arsenal', 'Aston Villa', 'Brighton', 'Chelsea', 'Crystal Palace',
      'Everton', 'Fulham', 'Liverpool', 'Manchester City', 'Manchester United',
      'Newcastle', 'Nottingham Forest', 'Tottenham', 'West Ham', 'Wolves'
    ],
    'Championship': [
      'Birmingham City', 'Blackburn', 'Bristol City', 'Cardiff City', 'Coventry City',
      'Hull City', 'Leeds United', 'Leicester City', 'Middlesbrough', 'Millwall',
      'Norwich City', 'Preston North End', 'QPR', 'Sheffield Wednesday', 'Stoke City'
    ]
  }
  
  const fixtures = []
  
  // Generate upcoming fixtures for both leagues
  for (const [league, teams] of Object.entries(mockTeams)) {
    for (let i = 0; i < Math.min(8, teams.length / 2); i++) {
      const homeIndex = i * 2
      const awayIndex = (i * 2 + 1) % teams.length
      
      if (homeIndex < teams.length && awayIndex < teams.length) {
        const kickoffDate = new Date()
        kickoffDate.setDate(kickoffDate.getDate() + Math.floor(Math.random() * 7) + 1)
        
        fixtures.push({
          league,
          home_team: teams[homeIndex],
          away_team: teams[awayIndex],
          kickoff_time: kickoffDate.toISOString(),
          match_date: kickoffDate.toISOString().split('T')[0],
          gameweek: Math.floor(Math.random() * 5) + 25 // Current gameweek range
        })
      }
    }
  }
  
  return fixtures
}

// Get current gameweek for a league
function getCurrentGameweek(league: string): number {
  // In real implementation, this would calculate based on current date and league schedule
  const now = new Date()
  const seasonStart = new Date('2024-08-17') // Typical season start
  const weeksPassed = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, Math.min(38, weeksPassed + 1))
}

// Main function to update BTTS picks
async function updateBTTSPicks() {
  console.log('=== UPDATING BTTS PICKS ===')
  
  try {
    // Get upcoming fixtures
    const fixtures = await getUpcomingFixtures()
    console.log(`Processing ${fixtures.length} fixtures`)
    
    // Clear existing picks for current gameweek
    await supabase
      .from('btts_picks')
      .delete()
      .gte('kickoff_time', new Date().toISOString())
    
    // Clear existing team stats
    await supabase
      .from('team_btts_stats')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    const picks = []
    const teamStats = []
    
    // Process each fixture
    for (const fixture of fixtures) {
      try {
        // Get BTTS rates for both teams
        const [homeMatches, awayMatches] = await Promise.all([
          getTeamMatches(fixture.home_team, fixture.league),
          getTeamMatches(fixture.away_team, fixture.league)
        ])
        
        const homeRate = calculateTeamBTTSRate(homeMatches)
        const awayRate = calculateTeamBTTSRate(awayMatches)
        
        // Store team stats
        teamStats.push({
          team_name: fixture.home_team,
          league: fixture.league,
          recency_weighted_rate: homeRate
        })
        
        teamStats.push({
          team_name: fixture.away_team,
          league: fixture.league,
          recency_weighted_rate: awayRate
        })
        
        // Calculate fixture probability: P_BTTS = 0.5 * R_home + 0.5 * R_away
        const probability = 0.5 * homeRate + 0.5 * awayRate
        
        // Only include picks above 65% confidence threshold
        if (probability >= 0.65) {
          picks.push({
            league: fixture.league,
            gameweek: fixture.gameweek,
            home_team: fixture.home_team,
            away_team: fixture.away_team,
            home_team_rate: homeRate,
            away_team_rate: awayRate,
            probability,
            confidence: Math.round(probability * 100),
            kickoff_time: fixture.kickoff_time,
            match_date: fixture.match_date
          })
        }
      } catch (error) {
        console.error(`Error processing fixture ${fixture.home_team} vs ${fixture.away_team}:`, error)
      }
    }
    
    // Insert team stats
    if (teamStats.length > 0) {
      const { error: statsError } = await supabase
        .from('team_btts_stats')
        .upsert(teamStats, {
          onConflict: 'team_name,league'
        })
      
      if (statsError) {
        console.error('Error inserting team stats:', statsError)
      } else {
        console.log(`Inserted ${teamStats.length} team BTTS stats`)
      }
    }
    
    // Insert BTTS picks
    if (picks.length > 0) {
      const { error: picksError } = await supabase
        .from('btts_picks')
        .insert(picks)
      
      if (picksError) {
        console.error('Error inserting BTTS picks:', picksError)
      } else {
        console.log(`Inserted ${picks.length} BTTS picks`)
      }
    }
    
    // Update analysis metadata
    const averageConfidence = picks.length > 0 
      ? picks.reduce((sum, pick) => sum + pick.confidence, 0) / picks.length 
      : 0
    
    const { error: analysisError } = await supabase
      .from('btts_analysis')
      .upsert({
        premier_league_gameweek: getCurrentGameweek('Premier League'),
        championship_gameweek: getCurrentGameweek('Championship'),
        total_picks: picks.length,
        average_confidence: Math.round(averageConfidence),
        last_updated: new Date().toISOString()
      })
    
    if (analysisError) {
      console.error('Error updating analysis metadata:', analysisError)
    }
    
    console.log(`✅ BTTS update completed: ${picks.length} picks with ${averageConfidence.toFixed(1)}% average confidence`)
    
    return {
      success: true,
      picks_generated: picks.length,
      average_confidence: Math.round(averageConfidence)
    }
  } catch (error) {
    console.error('❌ Error updating BTTS picks:', error)
    throw error
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
    console.log('BTTS Scheduler triggered at:', new Date().toISOString())
    
    const result = await updateBTTSPicks()
    
    return new Response(JSON.stringify({
      success: true,
      message: 'BTTS picks updated successfully',
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('BTTS Scheduler error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})