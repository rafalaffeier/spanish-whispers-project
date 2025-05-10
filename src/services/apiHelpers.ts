
import { API_BASE_URL, getAuthToken } from './apiConfig';

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  // Include debugging to track request issues
  console.log(`[API Helper] Fetching ${endpoint}`);
  
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    console.log(`[API Helper] Using auth token: ${token.substring(0, 5)}...`);
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.log('[API Helper] No auth token available');
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers
  };

  try {
    console.log(`[API Helper] Sending request to: ${API_BASE_URL}${endpoint}`);
    console.log('[API Helper] Request options:', JSON.stringify({
      method: fetchOptions.method || 'GET',
      headers: fetchOptions.headers,
      bodySize: fetchOptions.body ? (fetchOptions.body as string).length : 0
    }));
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    console.log(`[API Helper] Response status: ${response.status}`);
    
    // Try to get response as text first
    const responseText = await response.text();
    console.log(`[API Helper] Response text (first 100 chars): ${responseText.substring(0, 100)}`);
    
    // Only try to parse as JSON if we have content
    let data;
    if (responseText.trim().length > 0) {
      try {
        data = JSON.parse(responseText);
        console.log('[API Helper] Parsed JSON response:', data);
      } catch (e) {
        console.error('[API Helper] Failed to parse response as JSON:', e);
        console.log('[API Helper] Raw response:', responseText);
        
        // If the response is not JSON, return the text response
        if (response.ok) {
          return { message: "Operation successful", text: responseText };
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
    } else {
      console.log('[API Helper] Empty response body');
      data = { message: "Operation completed" };
    }

    if (!response.ok) {
      console.error('[API Helper] Request failed:', data);
      throw data.error || data || new Error(`Error: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('[API Helper] Fetch error:', error);
    throw error;
  }
};

// Normaliza un NIF/CIF eliminando espacios y guiones y convirtiéndolo a mayúsculas
export const normalizeNif = (nif: string): string => {
  return nif.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};
