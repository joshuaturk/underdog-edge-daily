// Team logo utility for soccer teams
export const getSoccerTeamLogo = (teamName: string): string => {
  const teamLogos: Record<string, string> = {
    // Premier League
    'Arsenal': 'https://logos.fandom.com/wiki/Arsenal_F.C.?file=Arsenal_FC_logo_%282022%29.svg',
    'Aston Villa': 'https://logos.fandom.com/wiki/Aston_Villa_F.C.?file=Aston_Villa_logo.svg',
    'Brighton': 'https://logos.fandom.com/wiki/Brighton_%26_Hove_Albion_F.C.?file=Brighton_%26_Hove_Albion_logo.svg',
    'Chelsea': 'https://logos.fandom.com/wiki/Chelsea_F.C.?file=Chelsea_FC_logo_%282022%29.svg',
    'Crystal Palace': 'https://logos.fandom.com/wiki/Crystal_Palace_F.C.?file=Crystal_Palace_FC_logo_%282022%29.svg',
    'Everton': 'https://logos.fandom.com/wiki/Everton_F.C.?file=Everton_FC_logo.svg',
    'Fulham': 'https://logos.fandom.com/wiki/Fulham_F.C.?file=Fulham_FC_logo_%282022%29.svg',
    'Liverpool': 'https://logos.fandom.com/wiki/Liverpool_F.C.?file=Liverpool_FC_logo_%282022%29.svg',
    'Manchester City': 'https://logos.fandom.com/wiki/Manchester_City_F.C.?file=Manchester_City_FC_logo_%282022%29.svg',
    'Manchester United': 'https://logos.fandom.com/wiki/Manchester_United_F.C.?file=Manchester_United_FC_logo_%282022%29.svg',
    'Newcastle': 'https://logos.fandom.com/wiki/Newcastle_United_F.C.?file=Newcastle_United_FC_logo_%282022%29.svg',
    'Nottingham Forest': 'https://logos.fandom.com/wiki/Nottingham_Forest_F.C.?file=Nottingham_Forest_FC_logo_%282022%29.svg',
    'Tottenham': 'https://logos.fandom.com/wiki/Tottenham_Hotspur_F.C.?file=Tottenham_Hotspur_FC_logo_%282022%29.svg',
    'West Ham': 'https://logos.fandom.com/wiki/West_Ham_United_F.C.?file=West_Ham_United_FC_logo_%282022%29.svg',
    'Wolves': 'https://logos.fandom.com/wiki/Wolverhampton_Wanderers_F.C.?file=Wolverhampton_Wanderers_FC_logo_%282022%29.svg',
    'Bournemouth': 'https://logos.fandom.com/wiki/AFC_Bournemouth?file=AFC_Bournemouth_logo_%282022%29.svg',
    'Brentford': 'https://logos.fandom.com/wiki/Brentford_F.C.?file=Brentford_FC_logo_%282022%29.svg',
    'Sheffield United': 'https://logos.fandom.com/wiki/Sheffield_United_F.C.?file=Sheffield_United_FC_logo_%282022%29.svg',
    'Luton Town': 'https://logos.fandom.com/wiki/Luton_Town_F.C.?file=Luton_Town_FC_logo_%282022%29.svg',
    'Burnley': 'https://logos.fandom.com/wiki/Burnley_F.C.?file=Burnley_FC_logo_%282022%29.svg',

    // La Liga
    'Real Madrid': 'https://logos.fandom.com/wiki/Real_Madrid_C.F.?file=Real_Madrid_CF_logo_%282022%29.svg',
    'Barcelona': 'https://logos.fandom.com/wiki/FC_Barcelona?file=FC_Barcelona_logo_%282022%29.svg',
    'Atletico Madrid': 'https://logos.fandom.com/wiki/Atl%C3%A9tico_Madrid?file=Atletico_Madrid_logo_%282022%29.svg',
    'Sevilla': 'https://logos.fandom.com/wiki/Sevilla_FC?file=Sevilla_FC_logo_%282022%29.svg',
    'Valencia': 'https://logos.fandom.com/wiki/Valencia_CF?file=Valencia_CF_logo_%282022%29.svg',
    'Villarreal': 'https://logos.fandom.com/wiki/Villarreal_CF?file=Villarreal_CF_logo_%282022%29.svg',
    'Real Sociedad': 'https://logos.fandom.com/wiki/Real_Sociedad?file=Real_Sociedad_logo_%282022%29.svg',
    'Athletic Bilbao': 'https://logos.fandom.com/wiki/Athletic_Bilbao?file=Athletic_Bilbao_logo_%282022%29.svg',

    // Bundesliga
    'Bayern Munich': 'https://logos.fandom.com/wiki/FC_Bayern_Munich?file=FC_Bayern_Munich_logo_%282022%29.svg',
    'Borussia Dortmund': 'https://logos.fandom.com/wiki/Borussia_Dortmund?file=Borussia_Dortmund_logo_%282022%29.svg',
    'RB Leipzig': 'https://logos.fandom.com/wiki/RB_Leipzig?file=RB_Leipzig_logo_%282022%29.svg',
    'Bayer Leverkusen': 'https://logos.fandom.com/wiki/Bayer_04_Leverkusen?file=Bayer_04_Leverkusen_logo_%282022%29.svg',
    'Wolfsburg': 'https://logos.fandom.com/wiki/VfL_Wolfsburg?file=VfL_Wolfsburg_logo_%282022%29.svg',
    'Frankfurt': 'https://logos.fandom.com/wiki/Eintracht_Frankfurt?file=Eintracht_Frankfurt_logo_%282022%29.svg',
    'Borussia Monchengladbach': 'https://logos.fandom.com/wiki/Borussia_M%C3%B6nchengladbach?file=Borussia_Monchengladbach_logo_%282022%29.svg',

    // Serie A
    'Juventus': 'https://logos.fandom.com/wiki/Juventus_F.C.?file=Juventus_FC_logo_%282022%29.svg',
    'AC Milan': 'https://logos.fandom.com/wiki/AC_Milan?file=AC_Milan_logo_%282022%29.svg',
    'Inter Milan': 'https://logos.fandom.com/wiki/Inter_Milan?file=Inter_Milan_logo_%282022%29.svg',
    'Napoli': 'https://logos.fandom.com/wiki/SSC_Napoli?file=SSC_Napoli_logo_%282022%29.svg',
    'Roma': 'https://logos.fandom.com/wiki/AS_Roma?file=AS_Roma_logo_%282022%29.svg',
    'Lazio': 'https://logos.fandom.com/wiki/S.S._Lazio?file=SS_Lazio_logo_%282022%29.svg',
    'Atalanta': 'https://logos.fandom.com/wiki/Atalanta_B.C.?file=Atalanta_BC_logo_%282022%29.svg',

    // Ligue 1
    'PSG': 'https://logos.fandom.com/wiki/Paris_Saint-Germain_F.C.?file=Paris_Saint-Germain_FC_logo_%282022%29.svg',
    'Marseille': 'https://logos.fandom.com/wiki/Olympique_de_Marseille?file=Olympique_de_Marseille_logo_%282022%29.svg',
    'Lyon': 'https://logos.fandom.com/wiki/Olympique_Lyonnais?file=Olympique_Lyonnais_logo_%282022%29.svg',
    'Monaco': 'https://logos.fandom.com/wiki/AS_Monaco_FC?file=AS_Monaco_FC_logo_%282022%29.svg',
    'Nice': 'https://logos.fandom.com/wiki/OGC_Nice?file=OGC_Nice_logo_%282022%29.svg',
    'Rennes': 'https://logos.fandom.com/wiki/Stade_Rennais_F.C.?file=Stade_Rennais_FC_logo_%282022%29.svg',

    // Championship
    'Leeds United': 'https://logos.fandom.com/wiki/Leeds_United_F.C.?file=Leeds_United_FC_logo_%282022%29.svg',
    'Leicester City': 'https://logos.fandom.com/wiki/Leicester_City_F.C.?file=Leicester_City_FC_logo_%282022%29.svg',
    'Birmingham City': 'https://logos.fandom.com/wiki/Birmingham_City_F.C.?file=Birmingham_City_FC_logo_%282022%29.svg',
    'Bristol City': 'https://logos.fandom.com/wiki/Bristol_City_F.C.?file=Bristol_City_FC_logo_%282022%29.svg',
    'Cardiff City': 'https://logos.fandom.com/wiki/Cardiff_City_F.C.?file=Cardiff_City_FC_logo_%282022%29.svg',
    'Hull City': 'https://logos.fandom.com/wiki/Hull_City_A.F.C.?file=Hull_City_AFC_logo_%282022%29.svg',
    'Middlesbrough': 'https://logos.fandom.com/wiki/Middlesbrough_F.C.?file=Middlesbrough_FC_logo_%282022%29.svg',
    'Norwich City': 'https://logos.fandom.com/wiki/Norwich_City_F.C.?file=Norwich_City_FC_logo_%282022%29.svg',
    'Sheffield Wednesday': 'https://logos.fandom.com/wiki/Sheffield_Wednesday_F.C.?file=Sheffield_Wednesday_FC_logo_%282022%29.svg'
  };

  // Return team-specific logo or fallback to generic soccer ball
  return teamLogos[teamName] || 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Soccerball.svg';
};

// Fallback function for when logo fails to load
export const handleSoccerLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Soccerball.svg';
};