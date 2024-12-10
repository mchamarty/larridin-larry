export async function fetchLinkedInProfile(url: string) {
    const response = await fetch('/api/scrapin', {
      method: 'POST',
      body: JSON.stringify({ url, endpoint: 'profile' })
    })
    return response.json()
  }
  
  export async function fetchLinkedInActivities(url: string) {
    const response = await fetch('/api/scrapin', {
      method: 'POST',
      body: JSON.stringify({ url, endpoint: 'activities' })
    })
    return response.json()
  }