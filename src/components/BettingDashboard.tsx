import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Target, Globe, Database, 
         GraduationCap, Dribbble, Trophy } from 'lucide-react';
import { BettingPick, BettingResults } from '@/types/betting';
import { BettingAnalysisService } from '@/services/BettingAnalysisService';
import { ProductionDataService } from '@/services/ProductionDataService';
import { SportsAPIService } from '@/services/SportsAPIService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { determineUnderdog } from '@/utils/oddsUtils';
import { getTeamLogo } from '@/utils/teamLogos';

// Import custom sports icons
import baseballIcon from '@/assets/baseball-icon.png';
import hockeyIcon from '@/assets/hockey-icon.png';
import footballIcon from '@/assets/football-icon.png';
import soccerIcon from '@/assets/soccer-icon.png';

// Sports navigation data with consistent Unicode symbols as backup
const sportsMenu = [
  { name: 'MLB', symbol: '⚾', active: true },
  { name: 'NCAA Football', symbol: '🏈' },
  { name: 'NCAA Bball', symbol: '🏀' },
  { name: 'NHL', symbol: '🏒' },
  { name: 'NBA', symbol: '🏀' },
  { name: 'NFL', symbol: '🏈' },
  { name: 'Soccer', symbol: '⚽' },
  { name: 'Golf', symbol: '⛳' },
  { name: 'Tennis', symbol: '🎾' }
];

export const BettingDashboard = () => {
  // Clean state initialization for live data
  const [dailyPicks, setDailyPicks] = useState<BettingPick[]>([]);
  const [tomorrowPicks, setTomorrowPicks] = useState<BettingPick[]>([]);
  const [allPicks, setAllPicks] = useState<BettingPick[]>([]);
  const [results, setResults] = useState<BettingResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUsingLiveData, setIsUsingLiveData] = useState(true); // Always start with live data
  const { toast } = useToast();

  // Helper function to get dates in ET timezone
  const getETDate = (daysOffset: number = 0) => {
    const now = new Date();
    const etDate = new Date(now.getTime() + (daysOffset * 24 * 60 * 60 * 1000));
    return etDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'America/New_York'
    });
  };

  const getETTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
  };

  // Auto-fetch at 7am ET daily
  useEffect(() => {
    const checkAndFetch = () => {
      const now = new Date();
      const etHour = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"})).getHours();
      
      // Check if it's 7am ET and we haven't fetched today
      if (etHour === 7) {
        const lastFetchDate = localStorage.getItem('lastAutoFetch');
        const today = new Date().toDateString();
        
        if (lastFetchDate !== today) {
          console.log('Auto-fetching daily data at 7am ET');
          generateDailyPicks();
          localStorage.setItem('lastAutoFetch', today);
        }
      }
    };

    // Check immediately and then every hour
    checkAndFetch();
    const interval = setInterval(checkAndFetch, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (allPicks.length > 0) {
      setResults(BettingAnalysisService.analyzeResults(allPicks));
    }
  }, [allPicks]);


  // Fixed demo games for consistent testing (July 22, 2025)
  const getFixedDemoGames = () => [
    { homeTeam: 'Yankees', awayTeam: 'Red Sox', isHomeUnderdog: false, odds: -150 },
    { homeTeam: 'Cubs', awayTeam: 'Cardinals', isHomeUnderdog: true, odds: 140 },
    { homeTeam: 'Dodgers', awayTeam: 'Giants', isHomeUnderdog: false, odds: -180 },
    { homeTeam: 'Astros', awayTeam: 'Rangers', isHomeUnderdog: false, odds: -120 },
    { homeTeam: 'Marlins', awayTeam: 'Mets', isHomeUnderdog: true, odds: 160 }
  ];

  // Fixed demo games for tomorrow (July 23, 2025)
  const getFixedTomorrowGames = () => [
    { homeTeam: 'Orioles', awayTeam: 'Blue Jays', isHomeUnderdog: true, odds: 135 },
    { homeTeam: 'Phillies', awayTeam: 'Braves', isHomeUnderdog: false, odds: -165 },
    { homeTeam: 'Padres', awayTeam: 'Rockies', isHomeUnderdog: false, odds: -140 },
    { homeTeam: 'Angels', awayTeam: 'Mariners', isHomeUnderdog: true, odds: 125 },
    { homeTeam: 'Tigers', awayTeam: 'Twins', isHomeUnderdog: true, odds: 155 }
  ];

  const generateDailyPicks = async () => {
    setIsLoading(true);
    
    try {
      // Check if we have a Sports API key first
      const apiKey = SportsAPIService.getApiKey();
      
      if (apiKey) {
        // Use Sports API for live data
        console.log('Using Sports API for live MLB data');
        setIsUsingLiveData(true);
        
        try {
          console.log('Attempting to fetch MLB games from Sports API...');
          const result = await SportsAPIService.getMLBGames();
          
          console.log('Sports API result:', result);
          
          if (result.success && result.data && result.data.length > 0) {
            console.log('Live MLB data fetched successfully:', result.data);
            
            // For Odds API data, we need to get pitcher info from ESPN
            let espnPitcherData: any[] = [];
            try {
              const espnResult = await SportsAPIService.getMLBGamesFromESPN(0);
              if (espnResult.success && espnResult.data) {
                espnPitcherData = espnResult.data;
              }
            } catch (espnError) {
              console.log('Could not fetch pitcher data from ESPN:', espnError);
            }
            
            // Use the real games data and merge with pitcher info
            const realGames = result.data;
            const games = realGames.map(game => {
              const { isHomeUnderdog, underdogOdds } = determineUnderdog(game.homeOdds, game.awayOdds);
              
              // Try to find matching ESPN game for pitcher data
              const espnGame = espnPitcherData.find(eg => 
                (eg.homeTeam.includes(game.homeTeam.split(' ').pop()) || game.homeTeam.includes(eg.homeTeam.split(' ').pop())) &&
                (eg.awayTeam.includes(game.awayTeam.split(' ').pop()) || game.awayTeam.includes(eg.awayTeam.split(' ').pop()))
              );
              
              return {
                homeTeam: game.homeTeam,
                awayTeam: game.awayTeam,
                isHomeUnderdog,
                odds: game.runlineOdds || underdogOdds,
                source: game.source,
                homePitcher: espnGame?.homePitcher || undefined,
                awayPitcher: espnGame?.awayPitcher || undefined
              };
            });
            
            const newPicks: BettingPick[] = [];
            
            games.forEach(game => {
              const pick = BettingAnalysisService.analyzeGame(
                game.homeTeam,
                game.awayTeam,
                game.isHomeUnderdog,
                game.odds,
                game.homePitcher,
                game.awayPitcher
              );
              
              if (pick) {
                // Add source information to the pick
                pick.reason += ` (Source: ${game.source})`;
                newPicks.push(pick);
              }
            });
            
            setDailyPicks(newPicks.slice(0, 4)); // Only show top 4 picks
            setLastUpdate(new Date());
            
            toast({
              title: "Real MLB Data Retrieved!",
              description: `Found ${newPicks.length} qualifying picks from ${realGames[0]?.source} with live odds`,
            });
          } else {
            throw new Error('No games found from Sports API');
          }
        } catch (apiError) {
          console.error('Error with Sports API, trying ESPN fallback:', apiError);
          
          // Try ESPN API as fallback
          const espnResult = await SportsAPIService.getMLBGamesFromESPN();
          
          if (espnResult.success && espnResult.data && espnResult.data.length > 0) {
            const games = espnResult.data.map(game => {
              const { isHomeUnderdog, underdogOdds } = determineUnderdog(game.homeOdds, game.awayOdds);
              return {
                homeTeam: game.homeTeam,
                awayTeam: game.awayTeam,
                isHomeUnderdog,
                odds: game.runlineOdds || underdogOdds,
                source: game.source,
                homePitcher: game.homePitcher,
                awayPitcher: game.awayPitcher
              };
            });
            
            const newPicks: BettingPick[] = [];
            
            games.forEach(game => {
              const pick = BettingAnalysisService.analyzeGame(
                game.homeTeam,
                game.awayTeam,
                game.isHomeUnderdog,
                game.odds,
                game.homePitcher,
                game.awayPitcher
              );
              
              if (pick) {
                pick.reason += ` (Source: ${game.source})`;
                newPicks.push(pick);
              }
            });
            
            setDailyPicks(newPicks.slice(0, 4)); // Only show top 4 picks
            setLastUpdate(new Date());
            
            toast({
              title: "ESPN Data Retrieved",
              description: `Found ${newPicks.length} qualifying picks from ESPN API`,
            });
          } else {
            // Final fallback to mock data
            setIsUsingLiveData(true);
            const games = getFixedDemoGames();
            const newPicks: BettingPick[] = [];
            
             games.forEach(game => {
               const pick = BettingAnalysisService.analyzeGame(
                 game.homeTeam,
                 game.awayTeam,
                 game.isHomeUnderdog,
                 game.odds,
                 undefined, // No pitcher data for demo
                 undefined  // No pitcher data for demo
               );
               
               if (pick) {
                 newPicks.push(pick);
               }
             });
            
            setDailyPicks(newPicks.slice(0, 4)); // Only show top 4 picks
            setLastUpdate(new Date());
            
            toast({
              title: "Using Demo Data",
              description: `API configured but no live data available - found ${newPicks.length} demo picks`,
              variant: "default"
            });
          }
        }
      } else {
        // No API key - show setup or use ESPN fallback
        console.log('No Sports API key found, trying ESPN...');
        
        try {
          const espnResult = await SportsAPIService.getMLBGamesFromESPN();
          
          if (espnResult.success && espnResult.data && espnResult.data.length > 0) {
            setIsUsingLiveData(false);
            
              const games = espnResult.data.map(game => {
                const { isHomeUnderdog, underdogOdds } = determineUnderdog(game.homeOdds, game.awayOdds);
                return {
                  homeTeam: game.homeTeam,
                  awayTeam: game.awayTeam,
                  isHomeUnderdog,
                  odds: game.runlineOdds || underdogOdds,
                  source: game.source,
                  homePitcher: game.homePitcher,
                  awayPitcher: game.awayPitcher
                };
              });
            
            const newPicks: BettingPick[] = [];
            
            games.forEach(game => {
              const pick = BettingAnalysisService.analyzeGame(
                game.homeTeam,
                game.awayTeam,
                game.isHomeUnderdog,
                game.odds,
                game.homePitcher,
                game.awayPitcher
              );
              
              if (pick) {
                pick.reason += ` (Source: ${game.source})`;
                newPicks.push(pick);
              }
            });
            
            setDailyPicks(newPicks);
            setLastUpdate(new Date());
            
            toast({
              title: "ESPN Data Retrieved",
              description: `Found ${newPicks.length} qualifying picks (free ESPN data)`,
            });
          } else {
            throw new Error('ESPN API also failed');
          }
        } catch (espnError) {
          // Ultimate fallback to demo data
          setIsUsingLiveData(false);
          
          const games = BettingAnalysisService.mockDailyGames();
          const newPicks: BettingPick[] = [];
          
          games.forEach(game => {
            const pick = BettingAnalysisService.analyzeGame(
              game.homeTeam,
              game.awayTeam,
              game.isHomeUnderdog,
              game.odds,
              undefined, // No pitcher data for mock games
              undefined  // No pitcher data for mock games
            );
            
            if (pick) {
              newPicks.push(pick);
            }
          });
          
          setDailyPicks(newPicks);
          setLastUpdate(new Date());
          
          toast({
            title: "Demo Analysis Complete",
            description: `Found ${newPicks.length} qualifying picks (demo data)`,
          });
        }
      }
    } catch (error) {
      // Final error handling
      const apiKey = SportsAPIService.getApiKey();
      setIsUsingLiveData(!!apiKey);
      
      const games = apiKey ? getFixedDemoGames() : BettingAnalysisService.mockDailyGames();
      const newPicks: BettingPick[] = [];
      
      games.forEach(game => {
        const pick = BettingAnalysisService.analyzeGame(
          game.homeTeam,
          game.awayTeam,
          game.isHomeUnderdog,
          game.odds,
          undefined, // No pitcher data for error fallback
          undefined  // No pitcher data for error fallback
        );
        
        if (pick) {
          newPicks.push(pick);
        }
      });
      
      setDailyPicks(newPicks);
      setLastUpdate(new Date());
      
      toast({
        title: "Analysis Complete",
        description: `Found ${newPicks.length} qualifying picks (fallback mode)`,
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTomorrowPicks = async () => {
    try {
      console.log('Attempting to fetch tomorrow\'s MLB games from ESPN...');
      
      // Try ESPN API for tomorrow's games
      const espnResult = await SportsAPIService.getMLBGamesFromESPN(1); // 1 day offset for tomorrow
      
      if (espnResult.success && espnResult.data && espnResult.data.length > 0) {
        const games = espnResult.data.map(game => {
          const { isHomeUnderdog, underdogOdds } = determineUnderdog(game.homeOdds, game.awayOdds);
          return {
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            isHomeUnderdog,
            odds: game.runlineOdds || underdogOdds,
            source: game.source,
            homePitcher: game.homePitcher,
            awayPitcher: game.awayPitcher
          };
        });
        
        const newPicks: BettingPick[] = [];
        
        games.forEach(game => {
          const pick = BettingAnalysisService.analyzeGame(
            game.homeTeam,
            game.awayTeam,
            game.isHomeUnderdog,
            game.odds,
            game.homePitcher,
            game.awayPitcher
          );
          
          if (pick) {
            // Update pick ID and date for tomorrow
            pick.id = `tomorrow-${pick.id}`;
            pick.date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            newPicks.push(pick);
          }
        });
        
        setTomorrowPicks(newPicks.slice(0, 4)); // Only show top 4 picks
        console.log(`Tomorrow's ESPN analysis: ${newPicks.length} picks qualify out of ${games.length} games`);
      } else {
        // Fallback to fixed games
        console.log('ESPN failed for tomorrow, using fixed demo games');
        const games = getFixedTomorrowGames();
        const newPicks: BettingPick[] = [];
        
        games.forEach(game => {
          const pick = BettingAnalysisService.analyzeGame(
            game.homeTeam,
            game.awayTeam,
            game.isHomeUnderdog,
            game.odds,
            undefined, // Tomorrow's pitchers TBD for demo
            undefined  // Tomorrow's pitchers TBD for demo
          );
          
          if (pick) {
            pick.id = `tomorrow-${pick.id}`;
            pick.date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            newPicks.push(pick);
          }
        });
        
        setTomorrowPicks(newPicks.slice(0, 4)); // Only show top 4 picks
        console.log(`Tomorrow's demo analysis: ${newPicks.length} picks qualify out of ${games.length} games`);
      }
    } catch (error) {
      console.error('Error generating tomorrow picks:', error);
      setTomorrowPicks([]);
    }
  };

  // Generate tomorrow's picks when component mounts
  useEffect(() => {
    generateTomorrowPicks();
  }, [isUsingLiveData]);



  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-profit text-profit-foreground';
    if (confidence >= 70) return 'bg-accent text-accent-foreground';
    return 'bg-secondary text-secondary-foreground';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'bg-profit text-profit-foreground';
      case 'lost': return 'bg-loss text-loss-foreground';
      case 'push': return 'bg-push text-push-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Main component render
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Underdog Runline
            </h1>
            <p className="text-muted-foreground mt-1">
              Advanced underdog runline analysis & daily picks
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isUsingLiveData ? (
              <Badge variant="outline" className="bg-profit/10 text-profit border-profit/20">
                <Globe className="w-3 h-3 mr-1" />
                Live Data
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                <Database className="w-3 h-3 mr-1" />
                Demo Mode
              </Badge>
            )}
            <ThemeToggle />
            <Button onClick={generateDailyPicks} disabled={isLoading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Live Data
            </Button>
          </div>
        </div>

        {/* Sports Navigation Menu */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              {sportsMenu.map((sport, index) => {
                return (
                  <Button
                    key={sport.name}
                    variant={sport.active ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-2 ${
                      sport.active 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className="text-base" style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif' }}>
                      {sport.symbol}
                    </span>
                    {sport.name}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {results && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {results.winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {results.wonPicks}/{results.totalPicks} picks
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-profit" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${results.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {results.totalProfit >= 0 ? '+' : ''}{results.totalProfit.toFixed(2)}u
                </div>
                <p className="text-xs text-muted-foreground">
                  {results.roi.toFixed(1)}% ROI
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                {results.streak.type === 'win' ? 
                  <TrendingUp className="h-4 w-4 text-profit" /> : 
                  <TrendingDown className="h-4 w-4 text-loss" />
                }
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${results.streak.type === 'win' ? 'text-profit' : 'text-loss'}`}>
                  {results.streak.count}
                </div>
                <p className="text-xs text-muted-foreground">
                  {results.streak.type === 'win' ? 'wins' : 'losses'} in a row
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Update</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {getETTime()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getETDate()} ET
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Picks Tabs */}
        <Tabs defaultValue="today" className="w-full">
          {/* Tabs List Above MLB Picks */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Underdog Runline</h3>
            </div>
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="today" className="flex items-center gap-2">
                Today
                <span className="text-xs text-muted-foreground">
                  {getETDate()}
                </span>
                <Badge variant="outline" className="ml-1">
                  {dailyPicks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="tomorrow" className="flex items-center gap-2">
                Tomorrow
                <span className="text-xs text-muted-foreground">
                  {getETDate(1)}
                </span>
                <Badge variant="outline" className="ml-1">
                  {tomorrowPicks.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
            <CardContent className="p-6">
              <TabsContent value="today" className="mt-0">
                {dailyPicks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {isLoading ? "Analyzing games..." : "No qualifying picks found for today"}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dailyPicks.map((pick) => (
                      <div 
                        key={pick.id}
                        className="border border-border/50 rounded-lg p-4 bg-gradient-to-r from-card to-card/50 hover:from-card/80 hover:to-card/60 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 space-y-3">
                            {/* Away Team */}
                            <div className="flex items-center gap-3">
                              <img 
                                src={getTeamLogo(pick.awayTeam)} 
                                alt={`${pick.awayTeam} logo`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png';
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-base">{pick.awayTeam}</div>
                                <div className="text-xs text-muted-foreground">{pick.awayPitcher || 'Starting Pitcher TBD'}</div>
                              </div>
                            </div>
                            
                            {/* Home Team */}
                            <div className="flex items-center gap-3">
                              <img 
                                src={getTeamLogo(pick.homeTeam)} 
                                alt={`${pick.homeTeam} logo`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png';
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-base">{pick.homeTeam}</div>
                                <div className="text-xs text-muted-foreground">{pick.homePitcher || 'Starting Pitcher TBD'}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-2 ml-4">
                            <Badge className={getConfidenceColor(pick.confidence)}>
                              {Math.round(pick.confidence)}% confidence
                            </Badge>
                            <Badge variant="outline">
                              {pick.odds > 0 ? '+' : ''}{pick.odds}
                            </Badge>
                            {pick.status !== 'pending' && (
                              <Badge className={getStatusColor(pick.status)}>
                                {pick.status.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="border-t border-border/30 pt-3">
                          <p className="text-sm text-muted-foreground font-medium mb-2">
                            Recommended Bet: {pick.recommendedBet === 'home_runline' ? pick.homeTeam : pick.awayTeam} +1.5
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pick.reason}
                          </p>
                        </div>
                        
                        
                        {pick.result && (
                          <div className="text-sm text-muted-foreground border-t border-border/30 pt-2 mt-2">
                            Final: {pick.homeTeam} {pick.result.homeScore} - {pick.awayTeam} {pick.result.awayScore}
                            {pick.profit && (
                              <span className={`ml-2 font-semibold ${pick.profit > 0 ? 'text-profit' : 'text-loss'}`}>
                                ({pick.profit > 0 ? '+' : ''}{pick.profit.toFixed(2)}u)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tomorrow" className="mt-0">
                {tomorrowPicks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No picks available for tomorrow yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tomorrowPicks.map((pick) => (
                      <div 
                        key={pick.id}
                        className="border border-border/50 rounded-lg p-4 bg-gradient-to-r from-card to-card/50 hover:from-card/80 hover:to-card/60 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 space-y-3">
                            {/* Away Team */}
                            <div className="flex items-center gap-3">
                              <img 
                                src={getTeamLogo(pick.awayTeam)} 
                                alt={`${pick.awayTeam} logo`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png';
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-base">{pick.awayTeam}</div>
                                <div className="text-xs text-muted-foreground">{pick.awayPitcher || 'Starting Pitcher TBD'}</div>
                              </div>
                            </div>
                            
                            {/* Home Team */}
                            <div className="flex items-center gap-3">
                              <img 
                                src={getTeamLogo(pick.homeTeam)} 
                                alt={`${pick.homeTeam} logo`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png';
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-base">{pick.homeTeam}</div>
                                <div className="text-xs text-muted-foreground">{pick.homePitcher || 'Starting Pitcher TBD'}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-2 ml-4">
                            <Badge className={getConfidenceColor(pick.confidence)}>
                              {Math.round(pick.confidence)}% confidence
                            </Badge>
                            <Badge variant="outline">
                              {pick.odds > 0 ? '+' : ''}{pick.odds}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="border-t border-border/30 pt-3">
                          <p className="text-sm text-muted-foreground font-medium mb-2">
                            Recommended Bet: {pick.recommendedBet === 'home_runline' ? pick.homeTeam : pick.awayTeam} +1.5
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">
                            {pick.reason}
                          </p>
                        </div>
                        
                        <div className="text-xs text-muted-foreground bg-accent/10 rounded px-2 py-1 inline-block">
                          Preview - Game starts tomorrow
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
};