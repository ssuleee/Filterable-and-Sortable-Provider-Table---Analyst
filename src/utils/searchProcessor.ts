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
const searchPatterns: SearchPattern[] = [{
  patterns: ['which providers have recently attested', 'who recently attested', 'recent attestation', 'recently attested', 'attested recently', 'new attestations', 'latest attestations', 'providers who attested recently'],
  filter: provider => {
    const attestationDate = new Date(provider.lastAttestationDate);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return attestationDate >= twoWeeksAgo;
  },
  sort: {
    key: 'lastAttestationDate',
    direction: 'desc'
  },
  description: 'Providers who attested in the last 14 days',
  response: "Here are the recent attestations from the past 14 days.",
  relevantColumns: ['lastAttestationDate', 'attestationStatus', 'firstName', 'lastName', 'npi'],
  followUpQuestions: [
    'Show only active recent attestations',
    'Which specialties recently attested?',
    'Show recent attestations by state',
    'Who attested in the last 7 days?'
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
    'Which specialties are in California?',
    'Show California providers by specialty',
    'Find recent attestations in California'
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
    'Find active providers in other states',
    'Show active California cardiologists',
    'Which active California providers recently attested?'
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
    'Show only cardiologists',
    'Find active specialists',
    'Show urologists only',
    'Which specialties need attestation updates?'
  ]
}, {
  patterns: ['who needs to update their attestation', 'who needs attestation update', 'needs to update', 'attestation update needed', 'expired attestation', 'update attestation'],
  filter: provider => {
    return provider.attestationStatus === 'Expired' || provider.attestationStatus === 'Pending';
  },
  description: 'Providers who need to update their attestation',
  response: "Here are providers who need to update their attestation (expired or pending).",
  relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus', 'lastAttestationDate', 'specialty'],
  followUpQuestions: [
    'Show only expired attestations',
    'Show only pending attestations',
    'Which states have providers needing updates?',
    'Show expired providers by specialty'
  ]
}, {
  patterns: ['show only active recent attestations', 'active recent attestations', 'active providers who recently attested'],
  filter: provider => {
    const attestationDate = new Date(provider.lastAttestationDate);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const isRecent = attestationDate >= twoWeeksAgo;
    const isActive = provider.attestationStatus === 'Active';
    return isRecent && isActive;
  },
  sort: {
    key: 'lastAttestationDate',
    direction: 'desc'
  },
  description: 'Active providers who attested in the last 14 days',
  response: "Here are active providers who have recently attested.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus', 'lastAttestationDate', 'specialty'],
  followUpQuestions: [
    'Show all recent attestations',
    'Find active providers by specialty',
    'Show recent attestations by state',
    'Which active providers attested yesterday?'
  ]
}, {
  patterns: ['active (.*) in (.*)', 'show me active (.*) in (.*)', 'find active (.*) in (.*)', 'show active (.*) in (.*)', 'active (.*) in (.*)', 'active (.*) (.*)'],
  filter: (provider, query: string) => {
    const isActive = provider.attestationStatus === 'Active';
    const specialtyMatch = query.match(/active (.*?) in/i)?.[1] || query.match(/active (.*?) (california|ca)/i)?.[1];
    const locationMatch = query.match(/in (.*?)$/i)?.[1] || query.match(/active .*? (california|ca)/i)?.[1];
    
    const matchesSpecialty = specialty => provider.specialty.toLowerCase() === specialty.toLowerCase();
    const matchesLocation = location => {
      if (!location) return false;
      const stateCode = location.length === 2 ? location.toUpperCase() : getStateCode(location);
      return provider.primaryPracticeState === stateCode || provider.otherPracticeStates.includes(stateCode);
    };
    
    return isActive && specialtyMatch && matchesSpecialty(specialtyMatch) && locationMatch && matchesLocation(locationMatch);
  },
  description: 'Active providers by specialty and location',
  response: "I've filtered to show active providers matching your specialty and location criteria.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus', 'specialty', 'primaryPracticeState', 'otherPracticeStates'],
  followUpQuestions: [
    'Show all providers in this location',
    'Show inactive providers with this specialty',
    'Show recent attestations for this specialty',
    'Find other specialties in this state'
  ]
}, {
  patterns: ['active attestation', 'who have an active', 'only show active', 'show me active', 'currently active', 'active providers', 'active status'],
  filter: provider => provider.attestationStatus === 'Active',
  description: 'Providers with active attestation status',
  response: "I've found all providers with active attestation status.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus', 'specialty', 'primaryPracticeState'],
  followUpQuestions: [
    'Show me active providers in California',
    'Which active providers recently attested?',
    'Show active cardiologists',
    'Find active providers by state'
  ]
}, {
  patterns: ['expired', 'who have expired', 'show expired', 'expired status', 'expired providers', 'expired attestation'],
  filter: provider => provider.attestationStatus === 'Expired',
  description: 'Providers with expired status',
  response: "I found providers with expired status.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus', 'lastAttestationDate', 'specialty'],
  followUpQuestions: [
    'When did these providers last attest?',
    'Show expired providers by state',
    'Which specialties have expired attestations?',
    'Show expired providers in California'
  ]
}, {
  patterns: ['pending', 'who are pending', 'show pending', 'pending status', 'pending providers', 'pending attestation'],
  filter: provider => provider.attestationStatus === 'Pending',
  description: 'Providers with pending attestation',
  response: "Here are the pending attestations.",
  relevantColumns: ['firstName', 'lastName', 'npi', 'attestationStatus', 'lastAttestationDate', 'specialty'],
  followUpQuestions: [
    'Show pending attestations by date',
    'Which states have pending providers?',
    'Show pending providers by specialty',
    'Find oldest pending attestations'
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
  // Add more common states
};
// Update getStateCode function
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
      return {
        filteredData: data.filter(item => pattern.filter(item, normalizedQuery)),
        sort: pattern.sort,
        description: pattern.description,
        response: pattern.response,
        relevantColumns: pattern.relevantColumns,
        followUpQuestions: pattern.followUpQuestions
      };
    }
  }
  // Check for compound search criteria
  const hasStatus = /(active|inactive|pending|expired)/i.test(normalizedQuery);
  const hasSpecialty = data.map(item => item.specialty.toLowerCase()).some(specialty => normalizedQuery.includes(specialty.toLowerCase()));
  const hasLocation = /(in|at|from) (.*?)($|\s)/i.test(normalizedQuery) || Object.keys(stateMap).some(state => normalizedQuery.includes(state.toLowerCase()));
  // For simple searches, show columns that match the search term
  if (normalizedQuery.length <= 20 && !normalizedQuery.includes('?')) {
    const relevantColumns = Object.keys(data[0] || {}).filter(key => data.some(item => {
      const value = item[key];
      return value && value.toString().toLowerCase().includes(normalizedQuery);
    }));
    return {
      filteredData: data.filter(item => Object.values(item).some(value => value && (Array.isArray(value) ? value.some(v => v.toString().toLowerCase().includes(normalizedQuery)) : value.toString().toLowerCase().includes(normalizedQuery)))),
      description: `Results for "${query}"`,
      response: 'I found these results.',
      relevantColumns: relevantColumns.length > 0 ? relevantColumns : ['firstName', 'lastName', 'npi'],
      followUpQuestions: [
        'Show only active providers',
        'Filter by specialty',
        'Show by state',
        'Find recent attestations'
      ]
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