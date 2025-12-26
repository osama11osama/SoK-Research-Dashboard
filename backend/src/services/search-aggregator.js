const axios = require('axios');

/**
 * Search Aggregator Service
 * Aggregates search results from multiple academic APIs:
 * - DBLP (Computer Science Bibliography)
 * - Semantic Scholar (AI summaries and citations)
 * - OpenAlex (Open alternative to Google Scholar)
 * - arXiv (Preprints and recent papers)
 * - Crossref (DOI validation and metadata)
 */

// DBLP Search
async function searchDBLP(query, maxResults = 50) {
  try {
    const url = `https://dblp.org/search/publ/api?q=${encodeURIComponent(query)}&format=json&h=${Math.min(maxResults, 100)}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'SoK-Research-Dashboard/1.0' }
    });

    if (!response.data?.result?.hits) {
      return [];
    }

    const hits = response.data.result.hits.hit || [];
    return hits.map(hit => ({
      source: 'DBLP',
      title: hit.info.title || 'Unknown Title',
      authors: hit.info.authors?.author 
        ? (Array.isArray(hit.info.authors.author) 
            ? hit.info.authors.author.map(a => a.text || a).join(', ')
            : hit.info.authors.author.text || hit.info.authors.author)
        : 'Unknown Authors',
      venue: hit.info.venue || hit.info.publisher || 'Unknown Venue',
      year: hit.info.year ? parseInt(hit.info.year) : null,
      url: hit.info.url || hit.info.ee || null,
      doi: hit.info.doi || null,
      type: hit.info.type || null,
      dblpKey: hit.info.key || null
    }));
  } catch (err) {
    console.error('DBLP search error:', err.message);
    return [];
  }
}

// Semantic Scholar Search
async function searchSemanticScholar(query, maxResults = 50) {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${Math.min(maxResults, 100)}&fields=title,authors,year,venue,url,abstract,citationCount,influentialCitationCount,externalIds`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'SoK-Research-Dashboard/1.0' }
    });

    if (!response.data?.data) {
      return [];
    }

    return response.data.data.map(paper => ({
      source: 'Semantic Scholar',
      title: paper.title || 'Unknown Title',
      authors: paper.authors?.map(a => a.name).join(', ') || 'Unknown Authors',
      venue: paper.venue || 'Unknown Venue',
      year: paper.year || null,
      url: paper.url || null,
      doi: paper.externalIds?.DOI || null,
      abstract: paper.abstract || null,
      citationCount: paper.citationCount || 0,
      influentialCitationCount: paper.influentialCitationCount || 0,
      semanticScholarId: paper.paperId || null
    }));
  } catch (err) {
    console.error('Semantic Scholar search error:', err.message);
    return [];
  }
}

// OpenAlex Search
async function searchOpenAlex(query, maxResults = 50) {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${Math.min(maxResults, 100)}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'SoK-Research-Dashboard/1.0' }
    });

    if (!response.data?.results) {
      return [];
    }

    return response.data.results.map(work => ({
      source: 'OpenAlex',
      title: work.title || 'Unknown Title',
      authors: work.authorships?.map(a => a.author?.display_name).filter(Boolean).join(', ') || 'Unknown Authors',
      venue: work.primary_location?.source?.display_name || work.primary_location?.venue?.display_name || 'Unknown Venue',
      year: work.publication_year || null,
      url: work.primary_location?.landing_page_url || work.primary_location?.pdf_url || null,
      doi: work.doi || null,
      openAlexId: work.id || null,
      citationCount: work.cited_by_count || 0
    }));
  } catch (err) {
    console.error('OpenAlex search error:', err.message);
    return [];
  }
}

// arXiv Search
async function searchArXiv(query, maxResults = 50) {
  try {
    const url = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&start=0&max_results=${Math.min(maxResults, 100)}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'SoK-Research-Dashboard/1.0' }
    });

    // Parse XML response (simplified - you might want to use xml2js)
    const xmlText = response.data;
    const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];

    return entries.map(entry => {
      const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
      const authorsMatch = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g);
      const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
      const linkMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
      const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);

      const authors = authorsMatch 
        ? authorsMatch.map(a => a.match(/<name>([\s\S]*?)<\/name>/)?.[1]?.trim()).filter(Boolean).join(', ')
        : 'Unknown Authors';

      const publishedYear = publishedMatch?.[1] ? new Date(publishedMatch[1]).getFullYear() : null;

      return {
        source: 'arXiv',
        title: titleMatch?.[1]?.replace(/\n/g, ' ').trim() || 'Unknown Title',
        authors: authors || 'Unknown Authors',
        venue: 'arXiv',
        year: publishedYear,
        url: linkMatch?.[1] || null,
        doi: null,
        abstract: summaryMatch?.[1]?.replace(/\n/g, ' ').trim() || null,
        arxivId: linkMatch?.[1]?.match(/arxiv\.org\/abs\/(.+)/)?.[1] || null
      };
    });
  } catch (err) {
    console.error('arXiv search error:', err.message);
    return [];
  }
}

// Crossref Search (for DOI validation and metadata)
async function searchCrossref(query, maxResults = 50) {
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${Math.min(maxResults, 100)}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'SoK-Research-Dashboard/1.0' }
    });

    if (!response.data?.message?.items) {
      return [];
    }

    return response.data.message.items.map(item => ({
      source: 'Crossref',
      title: item.title?.[0] || 'Unknown Title',
      authors: item.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean).join(', ') || 'Unknown Authors',
      venue: item['container-title']?.[0] || item.publisher || 'Unknown Venue',
      year: item.published?.['date-parts']?.[0]?.[0] || item['published-print']?.['date-parts']?.[0]?.[0] || null,
      url: item.URL || null,
      doi: item.DOI || null,
      crossrefId: item.DOI || null
    }));
  } catch (err) {
    console.error('Crossref search error:', err.message);
    return [];
  }
}

// Merge and deduplicate results based on title similarity
function mergeAndDeduplicate(resultsArrays) {
  const allResults = resultsArrays.flat();
  const seen = new Map();
  const merged = [];

  for (const result of allResults) {
    // Normalize title for comparison
    const normalizedTitle = result.title.toLowerCase().trim();
    
    // Check if we've seen a similar title (exact match or very similar)
    let found = false;
    for (const [key, existing] of seen.entries()) {
      // Exact match or very similar (allowing for minor differences)
      if (normalizedTitle === key || 
          (normalizedTitle.length > 20 && key.length > 20 && 
           normalizedTitle.includes(key.substring(0, 20)) || 
           key.includes(normalizedTitle.substring(0, 20)))) {
        // Merge sources if different
        if (!existing.sources.includes(result.source)) {
          existing.sources.push(result.source);
        }
        // Prefer results with more complete data
        if ((result.doi && !existing.doi) || 
            (result.abstract && !existing.abstract) ||
            (result.citationCount > existing.citationCount)) {
          Object.assign(existing, result);
        }
        found = true;
        break;
      }
    }

    if (!found) {
      const newResult = {
        ...result,
        sources: [result.source]
      };
      seen.set(normalizedTitle, newResult);
      merged.push(newResult);
    }
  }

  return merged;
}

// Main aggregator function
async function searchAllSources(query, maxResults = 50, sources = ['dblp', 'semantic', 'openalex', 'arxiv']) {
  const searchPromises = [];

  if (sources.includes('dblp')) {
    searchPromises.push(searchDBLP(query, maxResults));
  }
  if (sources.includes('semantic')) {
    searchPromises.push(searchSemanticScholar(query, maxResults));
  }
  if (sources.includes('openalex')) {
    searchPromises.push(searchOpenAlex(query, maxResults));
  }
  if (sources.includes('arxiv')) {
    searchPromises.push(searchArXiv(query, maxResults));
  }
  if (sources.includes('crossref')) {
    searchPromises.push(searchCrossref(query, maxResults));
  }

  try {
    // Execute all searches in parallel
    const resultsArrays = await Promise.all(searchPromises);
    
    // Merge and deduplicate
    const mergedResults = mergeAndDeduplicate(resultsArrays);
    
    // Sort by relevance (papers with more sources, citations, or complete data rank higher)
    mergedResults.sort((a, b) => {
      // Prioritize papers with multiple sources
      if (a.sources.length !== b.sources.length) {
        return b.sources.length - a.sources.length;
      }
      // Then by citation count
      if ((a.citationCount || 0) !== (b.citationCount || 0)) {
        return (b.citationCount || 0) - (a.citationCount || 0);
      }
      // Then by year (newer first)
      if (a.year && b.year && a.year !== b.year) {
        return b.year - a.year;
      }
      return 0;
    });

    return mergedResults.slice(0, maxResults);
  } catch (err) {
    console.error('Search aggregation error:', err);
    throw err;
  }
}

// Get Semantic Scholar summary/TLDR for a paper
async function getSemanticScholarSummary(paperId) {
  try {
    // Ensure paperId is properly encoded for URL
    const encodedPaperId = encodeURIComponent(paperId);
    const url = `https://api.semanticscholar.org/graph/v1/paper/${encodedPaperId}?fields=title,abstract,tldr`;
    
    const response = await axios.get(url, {
      timeout: 15000, // Increased timeout
      headers: { 
        'User-Agent': 'SoK-Research-Dashboard/1.0',
        'Accept': 'application/json'
      }
    });

    // Check if response has valid data
    if (!response.data || !response.data.title) {
      console.warn(`Semantic Scholar: No data returned for paper ID: ${paperId}`);
      return null;
    }

    return {
      title: response.data.title || 'Unknown Title',
      abstract: response.data.abstract || null,
      tldr: response.data.tldr?.text || null
    };
  } catch (err) {
    // Log more details for debugging
    if (err.response) {
      console.error(`Semantic Scholar API error: ${err.response.status} - ${err.response.statusText}`);
      console.error(`Paper ID: ${paperId}`);
      if (err.response.status === 404) {
        console.warn(`Paper not found in Semantic Scholar: ${paperId}`);
      }
    } else if (err.request) {
      console.error('Semantic Scholar API: No response received', err.message);
    } else {
      console.error('Semantic Scholar API error:', err.message);
    }
    return null;
  }
}

module.exports = {
  searchAllSources,
  searchDBLP,
  searchSemanticScholar,
  searchOpenAlex,
  searchArXiv,
  searchCrossref,
  getSemanticScholarSummary
};

