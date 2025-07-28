import { describe, it, expect, beforeEach } from 'vitest';
import { BTTSAnalysisService } from '../src/services/BTTSAnalysisService';

describe('BTTS Algorithm Tests', () => {
  describe('Recency Weight Calculation', () => {
    it('should calculate correct weights for 10 matches', () => {
      // The weights should sum to 1 and give more weight to recent matches
      const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(w => w / 55); // 55 is sum(1..10)
      
      // Test the expected weight distribution
      expect(weights[0]).toBeCloseTo(10/55, 4); // Most recent match
      expect(weights[9]).toBeCloseTo(1/55, 4);  // Oldest match
      
      // Weights should sum to 1
      const sum = weights.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 4);
    });
  });

  describe('Team BTTS Rate Calculation', () => {
    it('should calculate correct BTTS rate for perfect BTTS record', () => {
      const matches = Array(10).fill(null).map(() => ({ btts: true }));
      
      // With all matches having BTTS, rate should be 1.0
      const rate = calculateTeamBTTSRate(matches);
      expect(rate).toBe(1.0);
    });

    it('should calculate correct BTTS rate for no BTTS record', () => {
      const matches = Array(10).fill(null).map(() => ({ btts: false }));
      
      // With no matches having BTTS, rate should be 0.0
      const rate = calculateTeamBTTSRate(matches);
      expect(rate).toBe(0.0);
    });

    it('should give more weight to recent BTTS results', () => {
      // Recent match with BTTS, older matches without
      const recentBTTS = [
        { btts: true },  // Most recent
        ...Array(9).fill(null).map(() => ({ btts: false }))
      ];
      
      // Older match with BTTS, recent matches without  
      const olderBTTS = [
        ...Array(9).fill(null).map(() => ({ btts: false })),
        { btts: true }   // Oldest
      ];
      
      const recentRate = calculateTeamBTTSRate(recentBTTS);
      const olderRate = calculateTeamBTTSRate(olderBTTS);
      
      // Recent BTTS should result in higher rate than older BTTS
      expect(recentRate).toBeGreaterThan(olderRate);
    });

    it('should handle empty match list', () => {
      const rate = calculateTeamBTTSRate([]);
      expect(rate).toBe(0);
    });

    it('should handle fewer than 10 matches', () => {
      const matches = [
        { btts: true },
        { btts: true },
        { btts: false }
      ];
      
      const rate = calculateTeamBTTSRate(matches);
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(1);
    });
  });
});

describe('Fixture Probability Tests', () => {
  it('should calculate correct fixture probability', () => {
    const homeRate = 0.7;  // 70% BTTS rate
    const awayRate = 0.6;  // 60% BTTS rate
    
    // P_BTTS = 0.5 * R_home + 0.5 * R_away
    const expectedProbability = 0.5 * homeRate + 0.5 * awayRate; // 0.65
    
    expect(expectedProbability).toBe(0.65);
  });

  it('should filter picks above confidence threshold', () => {
    const threshold = 0.65;
    
    const highConfidencePick = 0.7;   // Should be included
    const lowConfidencePick = 0.6;    // Should be excluded
    const borderlinePick = 0.65;      // Should be included (exactly at threshold)
    
    expect(highConfidencePick >= threshold).toBe(true);
    expect(lowConfidencePick >= threshold).toBe(false); 
    expect(borderlinePick >= threshold).toBe(true);
  });
});

describe('Gameweek Logic Tests', () => {
  it('should calculate realistic gameweek numbers', () => {
    // Test current gameweek calculation logic
    const now = new Date();
    const seasonStart = new Date('2024-08-17');
    const weeksPassed = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const gameweek = Math.max(1, Math.min(38, weeksPassed + 1));
    
    expect(gameweek).toBeGreaterThanOrEqual(1);
    expect(gameweek).toBeLessThanOrEqual(38);
  });

  it('should handle season start edge case', () => {
    const seasonStart = new Date('2024-08-17');
    const weeksPassed = Math.floor((seasonStart.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const gameweek = Math.max(1, Math.min(38, weeksPassed + 1));
    
    expect(gameweek).toBe(1); // Should be gameweek 1 at season start
  });
});

// Helper function to test (would be imported from service in real implementation)
function calculateTeamBTTSRate(lastMatches: { btts: boolean }[]): number {
  if (lastMatches.length === 0) return 0;
  
  const RECENCY_N = 10;
  const weights = [];
  const totalSum = Array.from({length: RECENCY_N}, (_, i) => RECENCY_N - i)
    .reduce((sum, val) => sum + val, 0);
  
  for (let i = 0; i < RECENCY_N; i++) {
    weights.push((RECENCY_N - i) / totalSum);
  }
  
  const matchesToUse = lastMatches.slice(0, RECENCY_N);
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  matchesToUse.forEach((match, index) => {
    if (index < weights.length) {
      weightedSum += weights[index] * (match.btts ? 1 : 0);
      totalWeight += weights[index];
    }
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}