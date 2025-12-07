// src/services/AiService.ts

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const AiService = {
  /**
   * Gera conteúdo de texto usando o Gemini Flash 2.0.
   * @param prompt O texto de instrução para a IA.
   * @returns O texto gerado ou uma mensagem de erro amigável.
   */
  async generateText(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      console.error("SERVER ERROR: GEMINI_API_KEY não configurada.");
      return "O serviço de inteligência não está configurado corretamente.";
    }

    try {
      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error:", errorData);
        throw new Error(`Erro na API externa: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta da IA.";

    } catch (error) {
      console.error("AI Service Exception:", error);
      return "Não foi possível gerar a análise no momento.";
    }
  }
};