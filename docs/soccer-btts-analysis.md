# Soccer BTTS Analysis Documentation

## Overview

The Soccer BTTS (Both Teams To Score) analysis system automatically generates high-confidence betting picks for Premier League and English Championship matches using a recency-weighted algorithm.

## Algorithm Details

### Recency-Weighted BTTS Rate Calculation

For each team, we calculate a recency-weighted BTTS rate (R_T) using the last 10 matches:

```python
# Weights give more importance to recent matches
weights = [(10 - i) / sum(range(1, 11)) for i in range(10)]
R_T = sum(weights[i] * BTTS_i for i in range(10))
```

Where:
- `i=0` is the most recent match
- `i=9` is the 10th most recent match  
- `BTTS_i` is 1 if both teams scored in match i, 0 otherwise

### Fixture Probability Calculation

For each upcoming fixture, the BTTS probability is calculated as:

```python
P_BTTS = 0.5 * R_home + 0.5 * R_away
```

### Threshold Filtering

Only fixtures with `P_BTTS >= 0.65` (65% confidence) are included in the final picks.

## System Architecture

### Database Tables

1. **`btts_picks`** - Stores high-confidence BTTS picks
   - `league` - Premier League or Championship
   - `gameweek` - Current gameweek number
   - `home_team`, `away_team` - Team names
   - `home_team_rate`, `away_team_rate` - Individual team BTTS rates
   - `probability` - Combined fixture probability
   - `confidence` - Percentage confidence (probability × 100)
   - `kickoff_time` - Match kickoff time

2. **`team_btts_stats`** - Stores team-specific BTTS statistics
   - `team_name` - Team name
   - `league` - Premier League or Championship  
   - `recency_weighted_rate` - Current R_T value for the team

3. **`btts_analysis`** - Stores analysis metadata
   - `premier_league_gameweek` - Current PL gameweek
   - `championship_gameweek` - Current Championship gameweek
   - `total_picks` - Number of high-confidence picks
   - `average_confidence` - Average confidence percentage

### Edge Functions

1. **`football-data`** - Fetches fixtures and match data from external APIs
2. **`btts-scheduler`** - Nightly job that updates all BTTS picks and statistics

### Frontend Components

1. **`pages/Soccer.tsx`** - Main soccer dashboard displaying BTTS picks
2. **`services/BTTSAnalysisService.ts`** - Service layer for BTTS data operations
3. **`types/soccer.ts`** - TypeScript interfaces for soccer data

## Scheduling

### Nightly Updates (00:30 UTC)

The system automatically updates BTTS picks nightly:

1. Fetches last 10 matches for all Premier League and Championship teams
2. Calculates recency-weighted BTTS rates (R_T) for each team
3. Computes fixture probabilities for upcoming gameweek matches
4. Filters picks requiring ≥65% confidence
5. Updates database with new picks grouped by league and gameweek

### Gameweek Rollover

The system automatically detects when the current gameweek concludes and advances to the next gameweek's fixtures.

## Environment Configuration

### Required Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# BTTS Algorithm Configuration  
BTTS_RECENCY_N=10                    # Number of recent matches to analyze
BTTS_CONFIDENCE_THRESHOLD=0.65       # Minimum confidence threshold (65%)

# Football API Keys (replace with real APIs)
FOOTBALL_API_KEY=your_football_api_key
```

## API Endpoints

### GET `/api/soccer/btts-picks`
Returns current high-confidence BTTS picks

**Response:**
```json
{
  "lastUpdated": "2025-01-28T00:30:00Z",
  "currentGameweek": {
    "premierLeague": 25,
    "championship": 30
  },
  "picks": [
    {
      "league": "Premier League",
      "homeTeam": "Arsenal",
      "awayTeam": "Chelsea", 
      "confidence": 72,
      "kickoffTime": "2025-01-28T15:00:00Z"
    }
  ],
  "totalPicks": 8,
  "averageConfidence": 68
}
```

## Manual Operations

### Trigger Nightly Job Manually

To manually trigger the BTTS picks update:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/btts-scheduler \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Clear All Picks

To clear all BTTS picks (useful for testing):

```sql
DELETE FROM public.btts_picks;
DELETE FROM public.team_btts_stats;
DELETE FROM public.btts_analysis;
```

## Testing

### Unit Tests

Test files cover:

1. **Recency Algorithm** (`tests/btts-algorithm.test.ts`)
   - Verifies correct weight calculation
   - Tests BTTS rate computation with various match scenarios

2. **Fixture Probability** (`tests/fixture-probability.test.ts`)
   - Tests combined probability calculation
   - Verifies threshold filtering logic

3. **Gameweek Logic** (`tests/gameweek-rollover.test.ts`)
   - Tests automatic gameweek detection
   - Verifies fixture scheduling logic

### Mock Data Testing

The system includes realistic mock data for testing when real APIs are unavailable:

- Team BTTS rates typically range from 45-70%
- Fixture generation follows realistic scheduling patterns
- Confidence levels distributed across the 65-85% range

## Performance Considerations

### Database Indexes

The following indexes optimize query performance:

```sql
-- BTTS picks queries
CREATE INDEX idx_btts_picks_league_gameweek ON btts_picks(league, gameweek);
CREATE INDEX idx_btts_picks_confidence ON btts_picks(confidence DESC);

-- Team stats lookups  
CREATE INDEX idx_team_btts_stats_team_league ON team_btts_stats(team_name, league);
```

### Caching Strategy

- BTTS picks are cached until the next nightly update
- Team statistics are updated once per day
- Frontend uses optimistic updates for better UX

## Monitoring and Alerts

### Health Checks

Monitor these metrics for system health:

1. **Daily Pick Generation** - Should generate 8-15 picks per day on average
2. **API Success Rate** - External football API calls should succeed >95%
3. **Confidence Distribution** - Average confidence should be 65-75%
4. **Database Performance** - Query times should be <100ms

### Error Handling

The system gracefully handles:

- External API failures (falls back to mock data)
- Database connection issues (retries with exponential backoff)
- Invalid team/match data (skips problematic records)

## Future Enhancements

Planned improvements include:

1. **Real API Integration** - Replace mock data with live football APIs
2. **Historical Performance Tracking** - Track pick success rates
3. **Advanced Analytics** - Team form trends, venue-specific analysis
4. **Push Notifications** - Alert users to new high-confidence picks
5. **Betting Integration** - Direct links to sportsbook odds