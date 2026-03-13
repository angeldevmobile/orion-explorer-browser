import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gemini a veces envuelve el JSON en ```json ... ``` — esto lo limpia
function parseGeminiJson(text: string): unknown {
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  return JSON.parse(clean);
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  private conversationHistory: Array<{ role: string; content: string }> = [];

  async processVoiceQuery(query: string, context?: Record<string, unknown>) {
    // Agregar contexto de conversación
    this.conversationHistory.push({ role: 'user', content: query });

    const prompt = `
      Eres Orion, un asistente de navegador web inteligente y conversacional.
      
      PERSONALIDAD:
      - Amigable, natural y cercano
      - Proactivo: sugiere ideas relacionadas
      - Intuitivo: anticipa necesidades del usuario
      - Conciso pero informativo
      
      CONVERSACIÓN PREVIA:
      ${this.conversationHistory.slice(-4).map(h => `${h.role}: ${h.content}`).join('\n')}
      
      CONSULTA ACTUAL: "${query}"
      
      CONTEXTO DEL NAVEGADOR:
      ${context ? JSON.stringify(context) : 'Sin contexto adicional'}
      
      INSTRUCCIONES:
      1. Analiza la intención del usuario (búsqueda, navegación, pregunta, comando)
      2. Responde de forma natural y conversacional
      3. Sugiere 2-3 acciones relacionadas que podrían interesarle
      4. Si detectas una búsqueda ambigua, ofrece clarificaciones
      5. Mantén el tono amigable y útil
      
      RESPONDE EN FORMATO JSON:
      {
        "action": "search" | "navigate" | "info" | "command" | "chat",
        "url": "url completa si aplica (ej: https://youtube.com)",
        "query": "término de búsqueda si aplica",
        "response": "respuesta verbal natural y conversacional para el usuario (máx 2-3 oraciones)",
        "suggestions": [
          "Sugerencia 1 relacionada",
          "Sugerencia 2 relacionada",
          "Sugerencia 3 relacionada"
        ],
        "data": {
          "intent": "intención detectada",
          "confidence": "alta|media|baja"
        }
      }
      
      EJEMPLOS:
      
      Usuario: "abre youtube"
      {
        "action": "navigate",
        "url": "https://youtube.com",
        "response": "Claro, abriendo YouTube para ti. ¿Te gustaría que busque algo en específico?",
        "suggestions": [
          "Buscar videos de música",
          "Ver tendencias del día",
          "Abrir mis suscripciones"
        ],
        "data": { "intent": "open_website", "confidence": "alta" }
      }
      
      Usuario: "busca recetas de pasta"
      {
        "action": "search",
        "query": "recetas de pasta fáciles y rápidas",
        "response": "Perfecto, buscando las mejores recetas de pasta. ¿Te interesan recetas vegetarianas o tradicionales?",
        "suggestions": [
          "Recetas italianas auténticas",
          "Pasta con ingredientes que tengas en casa",
          "Videos de cocina paso a paso"
        ],
        "data": { "intent": "search_web", "confidence": "alta" }
      }
      
      Usuario: "qué puedo hacer aquí"
      {
        "action": "info",
        "response": "¡Puedo ayudarte con muchas cosas! Puedo abrir sitios web, buscar información, resumir páginas y responder preguntas. ¿Qué te gustaría hacer?",
        "suggestions": [
          "Abrir tus sitios favoritos",
          "Buscar noticias actuales",
          "Ayudarte con investigación"
        ],
        "data": { "intent": "help", "confidence": "alta" }
      }
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const parsedResponse = parseGeminiJson(response.text()) as Record<string, unknown>;

    // Guardar respuesta en historial
    this.conversationHistory.push({
      role: 'assistant',
      content: parsedResponse.response as string
    });

    // Limitar historial a últimas 10 interacciones
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }

    return parsedResponse;
  }

  async summarizeWebPage(url: string, content: string) {
    const prompt = `
      Eres Orion, un asistente que resume contenido web de forma conversacional.
      
      URL: ${url}
      CONTENIDO: ${content.substring(0, 3000)}
      
      Resume este contenido de forma natural y conversacional:
      - Usa 2-3 oraciones máximo
      - Destaca lo más importante
      - Usa un tono amigable
      - Sugiere qué más podría interesarle al usuario
      
      FORMATO JSON:
      {
        "summary": "Resumen conversacional del contenido",
        "keyPoints": ["Punto clave 1", "Punto clave 2", "Punto clave 3"],
        "suggestions": ["Sugerencia 1", "Sugerencia 2"],
        "sentiment": "informativo|positivo|neutral|técnico"
      }
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return parseGeminiJson(response.text());
  }

  async getContextualSuggestions(currentUrl: string, userActivity: Record<string, unknown>) {
    const prompt = `
      Eres Orion, sugiere 5 acciones contextuales basadas en:
      
      URL ACTUAL: ${currentUrl}
      ACTIVIDAD RECIENTE: ${JSON.stringify(userActivity)}
      
      Sugiere acciones proactivas y útiles.
      
      FORMATO JSON:
      {
        "suggestions": [
          {
            "text": "Texto de la sugerencia",
            "action": "search|navigate|command",
            "priority": "alta|media|baja"
          }
        ]
      }
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return parseGeminiJson(response.text());
  }

  async chatWithUser(message: string) {
    const prompt = `
      Eres Orion, un asistente de navegador web amigable.
      
      HISTORIAL:
      ${this.conversationHistory.slice(-6).map(h => `${h.role}: ${h.content}`).join('\n')}
      
      USUARIO: ${message}
      
      Responde de forma natural, amigable y útil. Si detectas que el usuario necesita ayuda con el navegador, ofrécela proactivamente.
      
      FORMATO JSON:
      {
        "response": "tu respuesta conversacional",
        "canHelpWith": ["acción 1", "acción 2"] // si aplica
      }
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    
    const parsed = parseGeminiJson(response.text()) as Record<string, unknown>;

    this.conversationHistory.push({ role: 'user', content: message });
    this.conversationHistory.push({ role: 'assistant', content: parsed.response as string });
    
    return parsed;
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}

export const geminiService = new GeminiService();