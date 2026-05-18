const ResolvedLocation = require('../models/ResolvedLocation');

/**
 * Resolves a locality string (e.g. "Kankanadi") into structured geographic data.
 * Checks the database cache first; if not found, queries OpenAI and stores the result.
 * 
 * @param {string} localityInput - The search input for the locality/area.
 * @returns {Promise<Object>} - The resolved location object.
 */
async function resolveLocality(localityInput) {
  if (!localityInput || typeof localityInput !== 'string' || localityInput.trim() === '') {
    throw new Error('A valid locality string is required');
  }

  const cleanedInput = localityInput.trim();
  const cacheKey = cleanedInput.toLowerCase();

  // 1. Check cache database
  const cached = await ResolvedLocation.findOne({ localityInput: cacheKey });
  if (cached) {
    return cached;
  }

  // 2. Call OpenAI API
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined in the environment variables. Please add it to your .env file.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert geocoding assistant specialized in Indian geographics and addresses. 
Your task is to resolve a given locality/area name into its full hierarchy (Area/Locality, Town/City, Taluk, District, State, Country, PIN Code).
Always return the result in raw JSON format matching this structure:
{
  "locality": "Resolved locality name, e.g., Kankanadi (Kankanady)",
  "city": "Resolved town or city, e.g., Mangaluru",
  "taluk": "Resolved taluk/subdistrict name, e.g., Mangaluru Taluk",
  "district": "Resolved district name, e.g., Dakshina Kannada",
  "state": "Resolved state name, e.g., Karnataka",
  "country": "Resolved country name, e.g., India",
  "pincode": "Resolved 6-digit PIN code, e.g., 575002"
}
Ensure all keys are present and the response is ONLY the JSON object. Do not include markdown code block backticks (like \`\`\`json) in your response, just the raw JSON.`
        },
        {
          role: 'user',
          content: `Resolve this locality: "${cleanedInput}"`
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to call OpenAI for location geocoding');
  }

  let resolvedData;
  try {
    resolvedData = JSON.parse(data.choices[0].message.content.trim());
  } catch (err) {
    throw new Error('Failed to parse OpenAI geocoding response as JSON: ' + err.message);
  }

  // Validate the response format from OpenAI
  const requiredFields = ['locality', 'city', 'district', 'state', 'country', 'pincode'];
  for (const field of requiredFields) {
    if (!resolvedData[field]) {
      resolvedData[field] = ''; // fallback
    }
  }

  // 3. Save to database for caching
  const newLocation = await ResolvedLocation.create({
    localityInput: cacheKey,
    locality: resolvedData.locality || cleanedInput,
    city: resolvedData.city || 'Unknown',
    taluk: resolvedData.taluk || '',
    district: resolvedData.district || 'Unknown',
    state: resolvedData.state || 'Unknown',
    country: resolvedData.country || 'India',
    pincode: resolvedData.pincode || ''
  });

  return newLocation;
}

module.exports = {
  resolveLocality
};
