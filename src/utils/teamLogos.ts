// MLB team logos utility
export const getTeamLogo = (teamName: string): string => {
  // Normalize team name to handle various formats
  const normalizedName = teamName.toLowerCase().trim();
  
  // MLB team logo mapping using ESPN's CDN (reliable and high-quality)
  const logoMap: Record<string, string> = {
    // American League East
    'yankees': 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png',
    'new york yankees': 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png',
    'red sox': 'https://a.espncdn.com/i/teamlogos/mlb/500/bos.png',
    'boston red sox': 'https://a.espncdn.com/i/teamlogos/mlb/500/bos.png',
    'orioles': 'https://a.espncdn.com/i/teamlogos/mlb/500/bal.png',
    'baltimore orioles': 'https://a.espncdn.com/i/teamlogos/mlb/500/bal.png',
    'blue jays': 'https://a.espncdn.com/i/teamlogos/mlb/500/tor.png',
    'toronto blue jays': 'https://a.espncdn.com/i/teamlogos/mlb/500/tor.png',
    'rays': 'https://a.espncdn.com/i/teamlogos/mlb/500/tb.png',
    'tampa bay rays': 'https://a.espncdn.com/i/teamlogos/mlb/500/tb.png',
    
    // American League Central
    'guardians': 'https://a.espncdn.com/i/teamlogos/mlb/500/cle.png',
    'cleveland guardians': 'https://a.espncdn.com/i/teamlogos/mlb/500/cle.png',
    'twins': 'https://a.espncdn.com/i/teamlogos/mlb/500/min.png',
    'minnesota twins': 'https://a.espncdn.com/i/teamlogos/mlb/500/min.png',
    'white sox': 'https://a.espncdn.com/i/teamlogos/mlb/500/chw.png',
    'chicago white sox': 'https://a.espncdn.com/i/teamlogos/mlb/500/chw.png',
    'tigers': 'https://a.espncdn.com/i/teamlogos/mlb/500/det.png',
    'detroit tigers': 'https://a.espncdn.com/i/teamlogos/mlb/500/det.png',
    'royals': 'https://a.espncdn.com/i/teamlogos/mlb/500/kc.png',
    'kansas city royals': 'https://a.espncdn.com/i/teamlogos/mlb/500/kc.png',
    
    // American League West
    'astros': 'https://a.espncdn.com/i/teamlogos/mlb/500/hou.png',
    'houston astros': 'https://a.espncdn.com/i/teamlogos/mlb/500/hou.png',
    'mariners': 'https://a.espncdn.com/i/teamlogos/mlb/500/sea.png',
    'seattle mariners': 'https://a.espncdn.com/i/teamlogos/mlb/500/sea.png',
    'rangers': 'https://a.espncdn.com/i/teamlogos/mlb/500/tex.png',
    'texas rangers': 'https://a.espncdn.com/i/teamlogos/mlb/500/tex.png',
    'angels': 'https://a.espncdn.com/i/teamlogos/mlb/500/laa.png',
    'los angeles angels': 'https://a.espncdn.com/i/teamlogos/mlb/500/laa.png',
    'la angels': 'https://a.espncdn.com/i/teamlogos/mlb/500/laa.png',
    'athletics': 'https://a.espncdn.com/i/teamlogos/mlb/500/oak.png',
    'oakland athletics': 'https://a.espncdn.com/i/teamlogos/mlb/500/oak.png',
    
    // National League East
    'braves': 'https://a.espncdn.com/i/teamlogos/mlb/500/atl.png',
    'atlanta braves': 'https://a.espncdn.com/i/teamlogos/mlb/500/atl.png',
    'phillies': 'https://a.espncdn.com/i/teamlogos/mlb/500/phi.png',
    'philadelphia phillies': 'https://a.espncdn.com/i/teamlogos/mlb/500/phi.png',
    'mets': 'https://a.espncdn.com/i/teamlogos/mlb/500/nym.png',
    'new york mets': 'https://a.espncdn.com/i/teamlogos/mlb/500/nym.png',
    'marlins': 'https://a.espncdn.com/i/teamlogos/mlb/500/mia.png',
    'miami marlins': 'https://a.espncdn.com/i/teamlogos/mlb/500/mia.png',
    'nationals': 'https://a.espncdn.com/i/teamlogos/mlb/500/wsh.png',
    'washington nationals': 'https://a.espncdn.com/i/teamlogos/mlb/500/wsh.png',
    
    // National League Central
    'cubs': 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png',
    'chicago cubs': 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png',
    'brewers': 'https://a.espncdn.com/i/teamlogos/mlb/500/mil.png',
    'milwaukee brewers': 'https://a.espncdn.com/i/teamlogos/mlb/500/mil.png',
    'cardinals': 'https://a.espncdn.com/i/teamlogos/mlb/500/stl.png',
    'st. louis cardinals': 'https://a.espncdn.com/i/teamlogos/mlb/500/stl.png',
    'saint louis cardinals': 'https://a.espncdn.com/i/teamlogos/mlb/500/stl.png',
    'reds': 'https://a.espncdn.com/i/teamlogos/mlb/500/cin.png',
    'cincinnati reds': 'https://a.espncdn.com/i/teamlogos/mlb/500/cin.png',
    'pirates': 'https://a.espncdn.com/i/teamlogos/mlb/500/pit.png',
    'pittsburgh pirates': 'https://a.espncdn.com/i/teamlogos/mlb/500/pit.png',
    
    // National League West
    'dodgers': 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png',
    'los angeles dodgers': 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png',
    'padres': 'https://a.espncdn.com/i/teamlogos/mlb/500/sd.png',
    'san diego padres': 'https://a.espncdn.com/i/teamlogos/mlb/500/sd.png',
    'giants': 'https://a.espncdn.com/i/teamlogos/mlb/500/sf.png',
    'san francisco giants': 'https://a.espncdn.com/i/teamlogos/mlb/500/sf.png',
    'diamondbacks': 'https://a.espncdn.com/i/teamlogos/mlb/500/ari.png',
    'arizona diamondbacks': 'https://a.espncdn.com/i/teamlogos/mlb/500/ari.png',
    'rockies': 'https://a.espncdn.com/i/teamlogos/mlb/500/col.png',
    'colorado rockies': 'https://a.espncdn.com/i/teamlogos/mlb/500/col.png'
  };
  
  // Try exact match first
  if (logoMap[normalizedName]) {
    return logoMap[normalizedName];
  }
  
  // Try partial matches for team names that might be shortened
  for (const [key, logo] of Object.entries(logoMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return logo;
    }
  }
  
  // Default MLB logo if no match found
  return 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png';
};