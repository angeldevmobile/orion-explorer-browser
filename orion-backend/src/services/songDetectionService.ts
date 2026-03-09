import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class SongDetectionService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  /**
   * Identifica una canción usando Gemini a partir de la letra/descripción capturada
   * y opcionalmente audio fingerprint via AudD API
   */
  async identifyFromAudio(audioBase64: string, sourceUrl: string) {
    // Si hay API key de AudD, usar fingerprinting real
    if (process.env.AUDD_API_KEY) {
      return this.identifyWithAudD(audioBase64, sourceUrl);
    }
    // Fallback: usar Gemini para analizar el contexto de la página
    return this.identifyWithGemini(sourceUrl);
  }

  /**
   * AudD API - reconocimiento real de audio por fingerprint
   * https://audd.io/ - 300 req/mes gratis
   */
  private async identifyWithAudD(audioBase64: string, sourceUrl: string) {
    const formData = new URLSearchParams();
    formData.append('api_token', process.env.AUDD_API_KEY!);
    formData.append('audio', audioBase64);
    formData.append('return', 'apple_music,spotify');

    const response = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();

    if (data.status === 'success' && data.result) {
      const song = data.result;
      // Enriquecer con Gemini
      const enrichment = await this.enrichWithGemini(song.title, song.artist);
      return {
        found: true,
        title: song.title || 'Desconocido',
        artist: song.artist || 'Desconocido',
        album: song.album || enrichment.album || null,
        coverUrl: song.apple_music?.artwork?.url?.replace('{w}x{h}', '300x300') 
          || song.spotify?.album?.images?.[0]?.url || null,
        previewUrl: song.spotify?.preview_url || null,
        genre: enrichment.genre || null,
        year: song.release_date?.substring(0, 4) || enrichment.year || null,
        confidence: 0.95,
        sourceUrl,
        enrichment: enrichment.funFact || null,
      };
    }

    return { found: false, message: 'No se pudo identificar la canción' };
  }

  /**
   * Fallback: Gemini analiza la URL/contexto para identificar qué suena
   */
  private async identifyWithGemini(sourceUrl: string) {
    const prompt = `
      Analiza esta URL y determina qué canción podría estar reproduciéndose:
      URL: ${sourceUrl}
      
      Si es YouTube, Spotify, SoundCloud u otro servicio de música, extrae la información del título/URL.
      
      RESPONDE SOLO EN JSON VÁLIDO:
      {
        "found": true/false,
        "title": "nombre de la canción",
        "artist": "artista",
        "album": "álbum si lo conoces",
        "genre": "género musical",
        "year": "año de lanzamiento",
        "confidence": 0.0-1.0,
        "funFact": "un dato curioso sobre la canción"
      }
    `;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { found: false, message: 'No se pudo analizar' };

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      ...parsed,
      sourceUrl,
      coverUrl: null,
      previewUrl: null,
    };
  }

  /**
   * Enriquece la info de una canción ya identificada con datos adicionales de Gemini
   */
  private async enrichWithGemini(title: string, artist: string) {
    const prompt = `
      Dame información adicional sobre la canción "${title}" de ${artist}.
      
      RESPONDE SOLO EN JSON VÁLIDO:
      {
        "album": "nombre del álbum",
        "genre": "género musical",
        "year": "año",
        "funFact": "un dato curioso breve (1 oración)"
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      return {};
    }
  }

  /**
   * Obtiene el historial de canciones detectadas de un usuario
   */
  async getUserSongHistory(userId: string, prisma: PrismaClient) {
    return prisma.detectedSong.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Guarda una canción detectada
   */
  async saveSong(data: {
    title: string;
    artist: string;
    album?: string;
    coverUrl?: string;
    previewUrl?: string;
    sourceUrl: string;
    confidence: number;
    genre?: string;
    year?: string;
    userId: string;
  }, prisma: PrismaClient) {
    return prisma.detectedSong.create({ data });
  }
}

export const songDetectionService = new SongDetectionService();