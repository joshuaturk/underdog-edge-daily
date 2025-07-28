import { useLocation } from 'react-router-dom';

// Base sports navigation data
const baseSportsMenu = [
  { name: 'MLB', symbol: '⚾', path: '/' },
  { name: 'NCAA Football', symbol: '🏈', path: '#' },
  { name: 'NCAA Bball', symbol: '🏀', path: '#' },
  { name: 'NHL', symbol: '🏒', path: '#' },
  { name: 'NBA', symbol: '🏀', path: '#' },
  { name: 'NFL', symbol: '🏈', path: '#' },
  { name: 'Soccer', symbol: '⚽', path: '/soccer' },
  { name: 'Golf', symbol: '⛳', path: '/golf' },
  { name: 'Tennis', symbol: '🎾', path: '#' }
];

export const useSportsMenu = () => {
  const location = useLocation();

  // Create prioritized sports menu: active link first, then other working links, then placeholders
  const sportsMenu = [...baseSportsMenu].sort((a, b) => {
    const aIsActive = location.pathname === a.path;
    const bIsActive = location.pathname === b.path;
    const aHasContent = a.path !== '#'; // Has actual content/page
    const bHasContent = b.path !== '#';
    
    // If one is active and the other isn't (both must have content)
    if (aIsActive && !bIsActive && aHasContent && bHasContent) return -1;
    if (bIsActive && !aIsActive && aHasContent && bHasContent) return 1;
    
    // If both have content but neither is active, or both are active, maintain original order
    if (aHasContent && bHasContent) {
      return baseSportsMenu.indexOf(a) - baseSportsMenu.indexOf(b);
    }
    
    // Working links come before placeholder links
    if (aHasContent && !bHasContent) return -1;
    if (!aHasContent && bHasContent) return 1;
    
    // Both are placeholders, maintain original order
    return baseSportsMenu.indexOf(a) - baseSportsMenu.indexOf(b);
  });

  return { sportsMenu, baseSportsMenu };
};