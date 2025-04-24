import Fuse from 'fuse.js';

const TMDB_API_KEY = 'e547e17d4e91f3e62a571655cd1ccaff'; // Replace this with your actual TMDb API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function fetchTMDB(endpoint) {
    const url = `${TMDB_BASE_URL}${endpoint}&api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('TMDb API request failed');
    return await res.json();
}

async function findContent(searchTerm, type = 'movie') {
    const endpoint = `/search/${type}?query=${encodeURIComponent(searchTerm)}`;
    const data = await fetchTMDB(endpoint);

    const results = data.results.map((item) => ({
        id: item.id,
        type,
        title: type === 'movie' ? item.title : item.name,
        year: (item.release_date || item.first_air_date || 'Unknown').split('-')[0],
    }));

    const fuse = new Fuse(results, { threshold: 0.3, distance: 200, keys: ["title"] });
    const matchedResults = fuse.search(searchTerm).map(result => result.item);

    if (matchedResults.length === 0) return { options: [] };

    return {
        options: matchedResults.map(({ id, title, year, type }) => ({ id, title, year, type }))
    };
}

async function getEpisodes(showId, seasonNumber = 1) {
    const endpoint = `/tv/${showId}/season/${seasonNumber}?`;
    const data = await fetchTMDB(endpoint);
    return data.episodes.map(ep => ({
        season: ep.season_number,
        episode: ep.episode_number,
        title: ep.name,
        air_date: ep.air_date,
        overview: ep.overview,
    }));
}

async function getStreamUrl(id, type, season = null, episode = null) {
    let url = '';

    if (type === 'movie') {
        url = `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=false`;
    } else if (type === 'show' && season !== null && episode !== null) {
        url = `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}?autoPlay=false`;
    } else {
        return { url: '', error: 'Missing season/episode for show' };
    }

    return { url };
}

export { findContent, getEpisodes, getStreamUrl };
