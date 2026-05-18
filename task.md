Meet-Alert Dashboard Specification
Overview
A React-based management portal that allows team members to view upcoming Google Calendar events and "Opt-Out" of phone alerts. The system uses Google Calendar Private Extended Properties to store the ignore state, eliminating the need for a separate database.

Tech Stack
Framework: React (Vite/Next.js)

API: Google Calendar API v3

Auth: Google OAuth2 (Sensitive Scopes)

Styling: Tailwind CSS

1. Core Logic: The Metadata Patch
This function toggles the n8n_ignore flag on a specific event copy without affecting other attendees.

TypeScript
/**
 * @param eventId - The unique ID of the Google Calendar Event
 * @param shouldIgnore - Boolean: true to mute, false to alert
 */
const toggleMeetingAlert = async (eventId: string, shouldIgnore: boolean) => {
  const token = await getAccessToken(); // Retrieve from Auth Context

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        extendedProperties: {
          private: {
            n8n_ignore: shouldIgnore ? "true" : "false"
          }
        }
      })
    }
  );

  if (!response.ok) throw new Error('Failed to update event metadata');
  return await response.json();
};
2. UI Component: Meeting Row
The UI defaults to "Enabled" for every meeting. If the n8n_ignore property exists and is "true", the toggle renders as "Off."

TypeScript
const MeetingItem = ({ event }) => {
  const [isAlerting, setIsAlerting] = useState(
    event.extendedProperties?.private?.n8n_ignore !== "true"
  );

  const handleToggle = async () => {
    const nextState = !isAlerting;
    setIsAlerting(nextState);
    try {
      // shouldIgnore is the inverse of isAlerting
      await toggleMeetingAlert(event.id, !nextState);
    } catch (err) {
      setIsAlerting(!nextState); // Rollback on error
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-800">
      <div>
        <h3 className="font-medium text-white">{event.summary}</h3>
        <p className="text-sm text-gray-400">
          {new Date(event.start.dateTime).toLocaleTimeString()}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={isAlerting ? "text-green-400" : "text-red-400"}>
          {isAlerting ? "Alert Active" : "Muted"}
        </span>
        <button 
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isAlerting ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isAlerting ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </div>
  );
};
3. Required OAuth Scopes
Since we are writing Private Extended Properties, the .readonly scope you used for the trigger is insufficient for the UI. Ensure your React Auth configuration includes:

https://www.googleapis.com/auth/calendar.events (Allows reading/writing specific event metadata)

https://www.googleapis.com/auth/calendar.readonly (For fetching the list)

4. Integration Instructions for Team Members
Zenduty Setup: User must visit their Zenduty profile and verify their mobile number via OTP.

Alert Dashboard: User logs in to this React app once to authorize.

Behavior: * All meetings trigger a call 5 minutes before start.

If a meeting is for "Sync" or "Lunch," the user opens this UI and toggles it to Muted.

No database is updated; the state is stored directly in the user's Google Event object.

5. n8n Node Configuration (Internal Reference)
The n8n workflow must use the following expression in the If Node (Opt-Out check):
{{ $json.extendedProperties?.private?.n8n_ignore !== "true" }}

Security Note: Since you are using a shared AWS instance with Caddy, ensure the React app is served via HTTPS to prevent token sniffing during the OAuth callback.