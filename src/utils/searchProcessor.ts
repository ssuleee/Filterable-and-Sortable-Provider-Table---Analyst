type SearchPattern = {
  patterns: string[];
  filter: (data: any, query: string) => boolean;
  sort?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  description: string;
  response?: string;
  relevantColumns?: string[];
  followUpQuestions?: string[];
};

// Helper function to get available specialties from data
const getAvailableSpecialties = (data: any[]) => {
  const specialties = [...new Set(data.map(provider => provider.specialty))];
  return specialties.slice(0, 3); // Limit to first 3 for UI
};

// Helper function to get available states from data
const getAvailableStates = (data: any[]) => {
  const states = [...new Set(data.flatMap(provider => 
    [provider.primaryPracticeState, ...provider.otherPracticeStates]))];
  return states.slice(0, 3); // Limit to first 3 for UI
};

// Helper function to get available statuses from data
const getAvailableStatuses = (data: any[]) => {
  const statuses = [...new Set(data.map(provider => provider.attestationStatus))];
  return statuses;
};

// Smart follow-up question generator based on available data
const generateContextualFollowUps = (query: string, data: any[], currentColumns: string[]) => {
  const followUps = [];
  const specialties = getAvailableSpecialties(data);
  const states = getAvailableStates(data);
  const statuses = getAvailableStatuses(data);

  // If we can show attestation status, suggest status-based queries
  if (data.some(p => p.attestationStatus)) {
    if (!query.toLowerCase().includes('active') && statuses.includes('Active')) {
      followUps.push('Show only active providers');
    }
    if (!query.toLowerCase().includes('pending') && statuses.includes('Pending')) {
      followUps.push('Show pending attestations');
    }
    if (!query.toLowerCase().includes('expired') && statuses.includes('Expired')) {
      followUps.push('Show expired providers');
    }
  }

  // If we can show specialties, suggest specialty-based queries
  if (data.some(p => p.specialty) && !query.toLowerCase().includes('specialist')) {
    if (specialties.includes('Cardiology')) {
      followUps.push('Show cardiologists only');
    }
    if (specialties.includes('Urologist')) {
      followUps.push('Show urologists only');
    }
  }

  // If we can show states, suggest location-based queries
  if (data.some(p => p.primaryPracticeState)) {
    if (!query.toLowerCase().includes('california') && states.includes('CA')) {
      followUps.push('Show providers in California');
    }
    if (!query.toLowerCase().includes('texas') && states.includes('TX')) {
      followUps.push('Show providers in Texas');
    }
  }

  // If we can show attestation dates, suggest date-based queries
  if (data.some(p => p.lastAttestationDate)) {
    if (!query.toLowerCase().includes('recent') && !query.toLowerCase().includes('7 days')) {
      followUps.push('Who attested in the last 7 days?');
    }
    if (!query.toLowerCase().includes('recent') && !query.toLowerCase().includes('30 days')) {
      followUps.push('Show attestations from last 30 days');
    }
  }

  // Combination queries if multiple identifiers are available
  if (data.some(p => p.attestationStatus) && data.some(p => p.specialty)) {
    followUps.push('Show active specialists by type');
  }

  if (data.some(p => p.attestationStatus) && data.some(p => p.primaryPracticeState)) {
    followUps.push('Find active providers by state');
  }

  return followUps.slice(0, 4); // Limit to 4 suggestions
};

const searchPatterns: SearchPattern[] = [{
  patterns: ['which providers have recently attested', 'who recently attested', 'recent attestation', 'recently attested', 'attested recently', 'new attestations', 'latest attestations', 'providers who attested recently'],
  filter: provider => {
    try {
      const attestationDate = new Date(provider.lastAttestationDate);
      const today = new Date();
      const fourteenDaysAgo = new Date(today.getTime() - (14 * 24 * 60 * 60 * 1000));
      
      // Debug: log the dates to see what's happening
      console.log('Provider:', provider.firstName, provider.lastName);
      console.log('Attestation Date:', attestationDate);
      console.log('Fourteen days ago:', fourteenDaysAgo);
      console.log('Is recent?', attestationDate >= fourteenDaysAgo);
      
      return attestationDate >= fourteenDaysAgo;
    } catch (error) {
      console.error('Date parsing error:', error);
      return false;
    }
  },
  sort: {
    key: 'lastAttestationDate',
    direction: 'desc'
  },
  description: 'Providers who attested in the last 14 days',
  response: "Here are the recent attestations from the past 14 days, sorted from most recent to oldest.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'lastAttestationDate', 'attestationStatus', 'specialty'],
  followUpQuestions: [
    'Show only active recent attestations',
    'Who attested in the last 7 days?',
    'Show recent attestations by specialty',
    'Find recent urologist attestations'
  ]
}, {
  patterns: ['show me providers in california', 'providers in california', 'california providers', 'find providers in california', 'california', 'ca providers'],
  filter: provider => {
    return provider.primaryPracticeState === 'CA' || provider.otherPracticeStates.includes('CA');
  },
  description: 'Providers practicing in California',
  response: "Here are all providers practicing in California.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'primaryPracticeState', 'otherPracticeStates', 'specialty', 'attestationStatus'],
  followUpQuestions: [
    'Show only active providers in California',
    'Show California cardiologists',
    'Find California urologists',
    'Show recent California attestations'
  ]
}, {
  patterns: ['show only active providers in california', 'active providers in california', 'active california providers', 'active ca providers'],
  filter: provider => {
    const isActive = provider.attestationStatus === 'Active';
    const isInCalifornia = provider.primaryPracticeState === 'CA' || provider.otherPracticeStates.includes('CA');
    return isActive && isInCalifornia;
  },
  description: 'Active providers practicing in California',
  response: "Here are active providers practicing in California.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus', 'primaryPracticeState', 'otherPracticeStates', 'specialty'],
  followUpQuestions: [
    'Show all providers in California',
    'Show active California cardiologists',
    'Find active providers in Texas',
    'Show California providers needing updates'
  ]
}, {
  patterns: ['find specialists by type', 'show specialists', 'specialists by type', 'find by specialty', 'show specialties', 'specialists'],
  filter: () => true,
  sort: {
    key: 'specialty',
    direction: 'asc'
  },
  description: 'All providers organized by specialty',
  response: "Here are all providers organized by their specialty types.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'specialty', 'attestationStatus', 'primaryPracticeState'],
  followUpQuestions: [
    'Show cardiologists only',
    'Show urologists only',
    'Find active specialists',
    'Show specialists by state'
  ]
}, {
  patterns: ['who needs to update their attestation', 'who needs attestation update', 'needs to update', 'attestation update needed', 'expired attestation', 'update attestation'],
  filter: provider => {
    return provider.attestationStatus === 'Expired' || provider.attestationStatus === 'Pending';
  },
  description: 'Providers who need to update their attestation',
  response: "Here are providers who need to update their attestation (expired or pending).",
  relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus', 'lastAttestationDate', 'specialty', 'primaryPracticeState'],
  followUpQuestions: [
    'Show only expired attestations',
    'Show only pending attestations',
    'Find expired cardiologists',
    'Show providers needing updates by state'
  ]
}, {
  patterns: ['who attested in the last 7 days', 'last 7 days', '7 days', 'attested this week', 'this week attestations'],
  filter: provider => {
    try {
      const attestationDate = new Date(provider.lastAttestationDate);
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      // Debug: log the dates to see what's happening
      console.log('Provider:', provider.firstName, provider.lastName);
      console.log('Attestation Date:', attestationDate);
      console.log('Seven days ago:', sevenDaysAgo);
      console.log('Is within 7 days?', attestationDate >= sevenDaysAgo);
      
      return attestationDate >= sevenDaysAgo;
    } catch (error) {
      console.error('Date parsing error:', error);
      return false;
    }
  },
  sort: {
    key: 'lastAttestationDate',
    direction: 'desc'
  },
  description: 'Providers who attested in the last 7 days',
  response: "Here are providers who attested within the last 7 days, sorted from most recent to oldest.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'lastAttestationDate', 'attestationStatus', 'specialty'],
  followUpQuestions: [
    'Show last 14 days instead',
    'Show only active from last 7 days',
    'Find last 7 days by specialty',
    'Show yesterday\'s attestations'
  ]
}, {
  patterns: ['show only active recent attestations', 'active recent attestations', 'active providers who recently attested'],
  filter: provider => {
    try {
      const attestationDate = new Date(provider.lastAttestationDate);
      const today = new Date();
      const fourteenDaysAgo = new Date(today.getTime() - (14 * 24 * 60 * 60 * 1000));
      const isRecent = attestationDate >= fourteenDaysAgo;
      const isActive = provider.attestationStatus === 'Active';
      return isRecent && isActive;
    } catch (error) {
      console.error('Date parsing error:', error);
      return false;
    }
  },
  sort: {
    key: 'lastAttestationDate',
    direction: 'desc'
  },
  description: 'Active providers who attested in the last 14 days',
  response: "Here are active providers who have recently attested, sorted from most recent to oldest.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus', 'lastAttestationDate', 'specialty'],
  followUpQuestions: [
    'Show all recent attestations',
    'Find active recent cardiologists',
    'Show active recent by state',
    'Find active urologists recently attested'
  ]
}, {
  patterns: ['show cardiologists', 'cardiologists only', 'cardiology providers', 'find cardiologists'],
  filter: provider => provider.specialty.toLowerCase() === 'cardiology',
  description: 'Cardiology providers',
  response: "Here are all cardiology providers.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'specialty', 'attestationStatus', 'primaryPracticeState', 'lastAttestationDate'],
  followUpQuestions: [
    'Show active cardiologists only',
    'Find California cardiologists',
    'Show recent cardiology attestations',
    'Find expired cardiologists'
  ]
}, {
  patterns: ['show urologists', 'urologists only', 'urology providers', 'find urologists'],
  filter: provider => provider.specialty.toLowerCase() === 'urologist',
  description: 'Urology providers',
  response: "Here are all urology providers.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'specialty', 'attestationStatus', 'primaryPracticeState', 'lastAttestationDate'],
  followUpQuestions: [
    'Show active urologists only',
    'Find California urologists',
    'Show recent urology attestations',
    'Find pending urologists'
  ]
}, {
  patterns: ['active urologist in ca', 'active urologists in california', 'active ca urologists'],
  filter: provider => {
    const isActive = provider.attestationStatus === 'Active';
    const isUrologist = provider.specialty.toLowerCase() === 'urologist';
    const isInCA = provider.primaryPracticeState === 'CA' || provider.otherPracticeStates.includes('CA');
    return isActive && isUrologist && isInCA;
  },
  description: 'Active urologists practicing in California',
  response: "Here are active urologists practicing in California.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus', 'specialty', 'primaryPracticeState', 'otherPracticeStates', 'lastAttestationDate'],
  followUpQuestions: [
    'Show all California urologists',
    'Find active cardiologists in California',
    'Show recent California urology attestations',
    'Find urologists in other states'
  ]
}];

// Helper function to convert state names to codes (simplified version)
const stateMap = {
  california: 'CA',
  texas: 'TX',
  florida: 'FL',
  arizona: 'AZ',
  nevada: 'NV',
  oregon: 'OR',
  washington: 'WA',
  newyork: 'NY',
  newjersey: 'NJ'
};

const getStateCode = (stateName: string): string => {
  const normalizedName = stateName.toLowerCase().replace(/\s+/g, '');
  return stateMap[normalizedName] || stateName.toUpperCase();
};

export type SearchResult = {
  filteredData: any[];
  sort?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  description: string;
  response?: string;
  relevantColumns?: string[];
  followUpQuestions?: string[];
};

export const processNaturalLanguageSearch = (query: string, data: any[]): SearchResult | null => {
  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery.length < 3) return null;

  // First try exact pattern matching for better accuracy
  for (const pattern of searchPatterns) {
    if (pattern.patterns.some(p => {
      const regex = new RegExp(p, 'i');
      return regex.test(normalizedQuery);
    })) {
      const filteredData = data.filter(item => pattern.filter(item, normalizedQuery));
      return {
        filteredData,
        sort: pattern.sort,
        description: pattern.description,
        response: pattern.response,
        relevantColumns: pattern.relevantColumns,
        followUpQuestions: pattern.followUpQuestions || generateContextualFollowUps(query, filteredData, pattern.relevantColumns || [])
      };
    }
  }

  // For simple searches, show columns that match the search term
  if (normalizedQuery.length <= 20 && !normalizedQuery.includes('?')) {
    const relevantColumns = Object.keys(data[0] || {}).filter(key => data.some(item => {
      const value = item[key];
      return value && value.toString().toLowerCase().includes(normalizedQuery);
    }));
    
    const filteredData = data.filter(item => Object.values(item).some(value => 
      value && (Array.isArray(value) ? 
        value.some(v => v.toString().toLowerCase().includes(normalizedQuery)) : 
        value.toString().toLowerCase().includes(normalizedQuery))));
    
    return {
      filteredData,
      description: `Results for "${query}"`,
      response: 'I found these results.',
      relevantColumns: relevantColumns.length > 0 ? relevantColumns : ['firstName', 'lastName', 'npi'],
      followUpQuestions: generateContextualFollowUps(query, filteredData, relevantColumns)
    };
  }

  if (normalizedQuery.includes('?') || normalizedQuery.startsWith('how') || normalizedQuery.startsWith('what') || normalizedQuery.startsWith('where') || normalizedQuery.startsWith('show')) {
    return {
      filteredData: data,
      description: "I'm not sure I understood that exactly. Let me show you all providers.",
      response: "I can help you find specific providers, attestations, specialties, or locations.",
      relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus'],
      followUpQuestions: [
        'Show active providers',
        'Find recent attestations',
        'Show providers in California',
        'Find specialists by type'
      ]
    };
  }

  return null;
};