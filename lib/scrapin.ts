export async function fetchLinkedInProfile(url: string) {
    try {
      console.log('Fetching LinkedIn profile for URL:', url);
      const response = await fetch('/api/scrapin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, endpoint: 'profile' }),
      });
  
      const responseText = await response.text();
      console.log('Profile API Response:', responseText);
  
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse profile API response:', e);
        throw new Error('Invalid API response format');
      }
  
      if (!response.ok) {
        console.error('LinkedIn profile fetch error:', data);
        // Return a minimal profile object instead of throwing
        return {
          success: false,
          person: {
            headline: 'Profile data unavailable',
            industry: 'Unknown'
          }
        };
      }
  
      return data;
    } catch (error) {
      console.error('fetchLinkedInProfile encountered an error:', error);
      // Return minimal profile instead of throwing
      return {
        success: false,
        person: {
          headline: 'Profile data unavailable',
          industry: 'Unknown'
        }
      };
    }
  }
  
  export async function fetchLinkedInActivities(url: string) {
    try {
      console.log('Fetching LinkedIn activities for URL:', url);
      const response = await fetch('/api/scrapin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, endpoint: 'activities' }),
      });
  
      const responseText = await response.text();
      console.log('Activities API Response:', responseText);
  
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse activities API response:', e);
        return {
          success: true,
          posts: [],
          comments: [],
          reactions: []
        };
      }
  
      if (!response.ok) {
        console.error('LinkedIn activities fetch error:', data);
        return {
          success: true,
          posts: [],
          comments: [],
          reactions: []
        };
      }
  
      return data;
    } catch (error) {
      console.error('fetchLinkedInActivities encountered an error:', error);
      return {
        success: true,
        posts: [],
        comments: [],
        reactions: []
      };
    }
  }