/**
 * AI Intelligence News Service
 * Integrates GNews and Gemini AI for automated OSINT gathering.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY;

export interface AiArticle {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    category: string;
    publishedAt: string;
    rank?: number;
    relevanceScore?: number;
}

export const aiNewsService = {
    /**
     * Fetch news from GNews API
     */
    async fetchNews(state: string, date: string): Promise<AiArticle[]> {
        if (!GNEWS_API_KEY) {
            throw new Error('GNEWS_API_KEY is not configured in .env');
        }

        const query = encodeURIComponent(`${state} India security news`);
        const targetUrl = `https://gnews.io/api/v4/search?q=${query}&lang=en&country=in&max=10&apikey=${GNEWS_API_KEY}`;
        const url = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.errors ? data.errors[0] : 'Failed to fetch news');
            }

            return (data.articles || []).map((a: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                title: a.title,
                summary: a.description || a.content || '',
                source: a.source?.name || 'Unknown',
                url: a.url,
                category: 'Intelligence',
                publishedAt: a.publishedAt || date
            }));
        } catch (error: any) {
            console.error('Fetch error:', error);
            throw error;
        }
    },

    /**
     * Process articles with Gemini AI for ranking and summarization
     */
    async processWithAi(articles: AiArticle[], state: string, date: string): Promise<AiArticle[]> {
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured in .env');
        }

        const prompt = `You are a news intelligence analyst. Given the following news articles about ${state}, India for ${date}, do the following:
1. Remove duplicate or near-duplicate articles
2. Summarize each article in 2-3 concise sentences focusing on impact and actionable insights
3. Rank them by importance (national security > public safety > economic impact > governance impact > general interest)
4. Return a JSON array of objects with: title, summary, source, url, category, rank (1 = most important), relevanceScore (0-1)

Articles:
${JSON.stringify(articles.map(a => ({ title: a.title, summary: a.summary, source: a.source, url: a.url })), null, 2)}

Return ONLY a valid JSON array.`;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
                    }),
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'AI processing failed');
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? jsonMatch[0] : text;

            try {
                const processed = JSON.parse(jsonStr);
                return processed.map((p: any) => ({
                    ...p,
                    id: Math.random().toString(36).substr(2, 9),
                    publishedAt: date
                }));
            } catch (e) {
                console.error('Parse error:', text);
                return articles; // Fallback to original
            }
        } catch (error: any) {
            console.error('AI Process error:', error);
            throw error;
        }
    }
};
