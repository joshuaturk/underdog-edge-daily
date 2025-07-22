// Helper function to correctly determine which team is the underdog based on American odds
export const determineUnderdog = (homeOdds: number, awayOdds: number): { isHomeUnderdog: boolean; favoriteOdds: number; underdogOdds: number } => {
  // In American odds:
  // Negative odds = favorite (lower absolute value = stronger favorite)
  // Positive odds = underdog (higher value = bigger underdog)
  
  // If both are negative, the one closer to 0 is the favorite
  if (homeOdds < 0 && awayOdds < 0) {
    const isHomeUnderdog = Math.abs(homeOdds) > Math.abs(awayOdds);
    return {
      isHomeUnderdog,
      favoriteOdds: isHomeUnderdog ? awayOdds : homeOdds,
      underdogOdds: isHomeUnderdog ? homeOdds : awayOdds
    };
  }
  
  // If both are positive, the lower one is the favorite
  if (homeOdds > 0 && awayOdds > 0) {
    const isHomeUnderdog = homeOdds > awayOdds;
    return {
      isHomeUnderdog,
      favoriteOdds: isHomeUnderdog ? awayOdds : homeOdds,
      underdogOdds: isHomeUnderdog ? homeOdds : awayOdds
    };
  }
  
  // Mixed: negative is favorite, positive is underdog
  const isHomeUnderdog = homeOdds > 0;
  return {
    isHomeUnderdog,
    favoriteOdds: isHomeUnderdog ? awayOdds : homeOdds,
    underdogOdds: isHomeUnderdog ? homeOdds : awayOdds
  };
};