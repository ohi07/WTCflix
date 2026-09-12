import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_TOKEN =
  process.env.TMDB_API_READ_ACCESS_TOKEN ||
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5NjZiYmE3ZDBiODZmN2IwNjZmYjI3YjE5OWMxZDgxMCIsIm5iZiI6MTYzMzg5MTA0Ny4yMTIsInN1YiI6IjYxNjMzMmU3MjE2MjFiMDA4ZTllMmNiZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ajnJmnfjSI9somZdLiG7mpC8BxEdD9LqqSnloKQZ-88";
const TMDB_API_KEY = process.env.TMDB_API_KEY || "966bba7d0b86f7b066fb27b199c1d810";

async function fetchFromTmdb(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      url.searchParams.set(key, val);
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB responded with status ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", tmdbConfigured: !!TMDB_TOKEN });
});

// Search multi, movie, or tv
app.get("/api/tmdb/search", async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || "";
    const type = (req.query.type as string) || "multi"; // 'multi' | 'movie' | 'tv'
    const page = (req.query.page as string) || "1";

    if (!query.trim()) {
      return res.json({ results: [], total_results: 0, page: 1, total_pages: 0 });
    }

    const endpoint = type === "movie" ? "/search/movie" : type === "tv" ? "/search/tv" : "/search/multi";
    const data = await fetchFromTmdb(endpoint, {
      query,
      page,
      include_adult: "false",
    });

    res.json(data);
  } catch (error: any) {
    console.error("TMDB Search error:", error);
    res.status(500).json({ error: error.message || "Failed to search TMDB" });
  }
});

// Trending
app.get("/api/tmdb/trending", async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || "all"; // 'all' | 'movie' | 'tv'
    const timeWindow = (req.query.timeWindow as string) || "week"; // 'day' | 'week'
    const page = (req.query.page as string) || "1";

    const data = await fetchFromTmdb(`/trending/${type}/${timeWindow}`, { page });
    res.json(data);
  } catch (error: any) {
    console.error("TMDB Trending error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch trending" });
  }
});

// Popular items
app.get("/api/tmdb/popular", async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || "movie"; // 'movie' | 'tv'
    const page = (req.query.page as string) || "1";

    const data = await fetchFromTmdb(`/${type}/popular`, { page });
    res.json(data);
  } catch (error: any) {
    console.error("TMDB Popular error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch popular" });
  }
});

// Top Rated
app.get("/api/tmdb/top_rated", async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || "movie"; // 'movie' | 'tv'
    const page = (req.query.page as string) || "1";

    const data = await fetchFromTmdb(`/${type}/top_rated`, { page });
    res.json(data);
  } catch (error: any) {
    console.error("TMDB Top Rated error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch top rated" });
  }
});

// Discover by genre or language/keywords
app.get("/api/tmdb/discover", async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || "movie";
    const withGenres = (req.query.with_genres as string) || "";
    const withOriginalLanguage = (req.query.with_original_language as string) || "";
    const withKeywords = (req.query.with_keywords as string) || "";
    const page = (req.query.page as string) || "1";
    const sortBy = (req.query.sort_by as string) || "popularity.desc";

    const params: Record<string, string> = {
      page,
      sort_by: sortBy,
      include_adult: "false",
    };
    if (withGenres) params.with_genres = withGenres;
    if (withOriginalLanguage) params.with_original_language = withOriginalLanguage;
    if (withKeywords) params.with_keywords = withKeywords;

    const data = await fetchFromTmdb(`/discover/${type}`, params);
    res.json(data);
  } catch (error: any) {
    console.error("TMDB Discover error:", error);
    res.status(500).json({ error: error.message || "Failed to discover items" });
  }
});

// Movie Details
app.get("/api/tmdb/movie/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = await fetchFromTmdb(`/movie/${id}`, {
      append_to_response: "credits,videos,recommendations,similar",
    });
    res.json(data);
  } catch (error: any) {
    console.error(`TMDB Movie ${req.params.id} error:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch movie details" });
  }
});

// TV Show Details
app.get("/api/tmdb/tv/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = await fetchFromTmdb(`/tv/${id}`, {
      append_to_response: "credits,videos,recommendations,similar",
    });
    res.json(data);
  } catch (error: any) {
    console.error(`TMDB TV ${req.params.id} error:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch TV details" });
  }
});

// TV Season Details (episodes list)
app.get("/api/tmdb/tv/:id/season/:seasonNumber", async (req: Request, res: Response) => {
  try {
    const { id, seasonNumber } = req.params;
    const data = await fetchFromTmdb(`/tv/${id}/season/${seasonNumber}`);
    res.json(data);
  } catch (error: any) {
    console.error(`TMDB TV ${req.params.id} Season ${req.params.seasonNumber} error:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch season details" });
  }
});

// Start server with Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WTCflix Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
