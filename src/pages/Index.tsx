import { useState, useEffect } from 'react';
import { BettingDashboard } from '@/components/BettingDashboard';
import { ApiKeySetup } from '@/components/ApiKeySetup';
import { FirecrawlService } from '@/services/FirecrawlService';

const Index = () => {
  const [showSetup, setShowSetup] = useState(true);

  useEffect(() => {
    // Check if API key is already configured
    const existingKey = FirecrawlService.getApiKey();
    if (existingKey) {
      setShowSetup(false);
    }
  }, []);

  const handleApiKeySet = () => {
    setShowSetup(false);
  };

  if (showSetup) {
    return <ApiKeySetup onApiKeySet={handleApiKeySet} />;
  }

  return <BettingDashboard />;
};

export default Index;
