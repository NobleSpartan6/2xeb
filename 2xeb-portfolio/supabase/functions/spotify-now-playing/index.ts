import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyNowPlayingResponse {
  is_playing: boolean;
  item?: {
    name: string;
    artists: Array<{ name: string }>;
    album?: {
      name: string;
      images?: Array<{ url: string }>;
    };
  };
}

interface SpotifyRecentlyPlayedResponse {
  items: Array<{
    track: {
      name: string;
      artists: Array<{ name: string }>;
      album?: {
        name: string;
        images?: Array<{ url: string }>;
      };
    };
    played_at: string;
  }>;
}

// Get a fresh access token using the refresh token
async function getAccessToken(): Promise<string | null> {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  const refreshToken = Deno.env.get("SPOTIFY_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing Spotify credentials");
    return null;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    console.error("Failed to refresh token:", await response.text());
    return null;
  }

  const data: SpotifyTokenResponse = await response.json();
  return data.access_token;
}

// Fetch currently playing track
async function getNowPlaying(accessToken: string): Promise<SpotifyNowPlayingResponse | null> {
  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // 204 = nothing playing
  if (response.status === 204) {
    return { is_playing: false };
  }

  if (!response.ok) {
    console.error("Failed to fetch now playing:", await response.text());
    return null;
  }

  return response.json();
}

// Fetch recently played tracks
async function getRecentlyPlayed(accessToken: string): Promise<SpotifyRecentlyPlayedResponse | null> {
  const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch recently played:", await response.text());
    return null;
  }

  return response.json();
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return new Response(
        JSON.stringify({ isPlaying: false, error: "Spotify not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nowPlaying = await getNowPlaying(accessToken);
    if (!nowPlaying) {
      return new Response(
        JSON.stringify({ isPlaying: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!nowPlaying.is_playing || !nowPlaying.item) {
      // Nothing playing - try to get recently played
      const recentlyPlayed = await getRecentlyPlayed(accessToken);
      if (recentlyPlayed?.items?.[0]) {
        const recent = recentlyPlayed.items[0];
        const track = recent.track.name;
        const artist = recent.track.artists.map((a) => a.name).join(", ");
        const album = recent.track.album?.name;
        const albumArt = recent.track.album?.images?.[0]?.url;
        const playedAt = recent.played_at;

        return new Response(
          JSON.stringify({
            isPlaying: false,
            wasPlaying: true,
            track,
            artist,
            album,
            albumArt,
            playedAt,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ isPlaying: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const track = nowPlaying.item.name;
    const artist = nowPlaying.item.artists.map((a) => a.name).join(", ");
    const album = nowPlaying.item.album?.name;
    const albumArt = nowPlaying.item.album?.images?.[0]?.url;

    return new Response(
      JSON.stringify({
        isPlaying: true,
        track,
        artist,
        album,
        albumArt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ isPlaying: false, error: "Internal server error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

