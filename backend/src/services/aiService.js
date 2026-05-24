const axios = require('axios');

/**
 * AI Service — provider priority: Groq → OpenAI → Ollama → fallback
 * Get a free Groq key at: https://console.groq.com/keys
 */

function buildOpenAIClient(apiKey, baseURL) {
  const { OpenAI } = require('openai');
  return new OpenAI({ apiKey, baseURL });
}

function getClient() {
  // Read fresh every call — handles late env injection (dotenvx etc.)
  if (process.env.GROQ_API_KEY) {
    return buildOpenAIClient(process.env.GROQ_API_KEY, 'https://api.groq.com/openai/v1');
  }
  if (process.env.OPENAI_API_KEY) {
    return buildOpenAIClient(process.env.OPENAI_API_KEY, undefined);
  }
  return null;
}

class AiService {
  get ollamaBaseUrl() { return process.env.OLLAMA_BASE_URL || 'http://localhost:11434'; }
  get ollamaModel()   { return process.env.OLLAMA_MODEL || 'llama3.1:8b'; }
  get chatModel() {
    if (process.env.GROQ_API_KEY) return process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    return process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  activeProvider() {
    if (process.env.GROQ_API_KEY)  return 'groq';
    if (process.env.OPENAI_API_KEY) return 'openai';
    const p = (process.env.LLM_PROVIDER || '').toLowerCase();
    if (p === 'ollama' || p === 'local') return 'ollama';
    return 'fallback';
  }

  hasCloudAI() {
    return Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
  }

  // ── Single-turn cloud call ───────────────────────────────────────────────
  async chatCloud(systemPrompt, userMessage) {
    const client = getClient();
    if (!client) throw new Error('No cloud AI client configured');
    const msgs = userMessage
      ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }]
      : [{ role: 'user', content: systemPrompt }];
    const completion = await client.chat.completions.create({
      model: this.chatModel, messages: msgs, max_tokens: 1024, temperature: 0.7,
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  }

  // ── Multi-turn cloud call (full history) ─────────────────────────────────
  async chatWithHistory(systemPrompt, messages) {
    // messages = [{ role: 'user'|'assistant', content: string }, ...]
    const client = getClient();
    if (!client) throw new Error('No cloud AI client configured');
    const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];
    const completion = await client.chat.completions.create({
      model: this.chatModel, messages: fullMessages, max_tokens: 1024, temperature: 0.7,
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  }

  // ── Ollama ───────────────────────────────────────────────────────────────
  async chatOllama(prompt) {
    const response = await axios.post(
      `${this.ollamaBaseUrl}/api/generate`,
      { model: this.ollamaModel, prompt, stream: false },
      { timeout: 60000 }
    );
    return response.data?.response?.trim() || '';
  }

  // ── chat(prompt) — single string, all providers ──────────────────────────
  async chat(prompt) {
    if (this.hasCloudAI()) {
      try { return await this.chatCloud(prompt); }
      catch (err) { console.warn(`${this.activeProvider()} failed, trying Ollama:`, err.message); }
    }
    try { return await this.chatOllama(prompt); }
    catch (err) { console.warn('Ollama failed, using fallback:', err.message); }
    return this.localFallback(prompt);
  }

  // ── chatWithSystem — structured single-turn ──────────────────────────────
  async chatWithSystem(systemPrompt, userMessage) {
    if (this.hasCloudAI()) {
      try { return await this.chatCloud(systemPrompt, userMessage); }
      catch (err) { console.warn(`${this.activeProvider()} failed, trying Ollama:`, err.message); }
    }
    try { return await this.chatOllama(`${systemPrompt}\n\n---\nUser: ${userMessage}`); }
    catch (err) { console.warn('Ollama failed, using fallback:', err.message); }
    return this.localFallback(userMessage);
  }

  localFallback(prompt) {
    return `[No AI provider configured]\n\nGet a FREE Groq API key at https://console.groq.com/keys\nThen add to backend .env:\n  GROQ_API_KEY=gsk_...\n\nYour prompt: ${prompt.slice(0, 300)}`;
  }

  // ── Higher-level helpers ─────────────────────────────────────────────────
  async generateAgentIdeas({ domain = 'general', goal = 'Build a useful AI agent', pricingModel = 'purchase' } = {}) {
    const prompt = `Create 3 concise AI agent ideas for the ${domain} domain. Goal: ${goal}. Pricing model: ${pricingModel}. Return plain text bullets with name, use case, and one monetization idea.`;
    return { ideas: await this.chat(prompt), provider: this.activeProvider() };
  }

  async generatePromptTemplate({ name, description, features = [] }) {
    const prompt = `Write a system prompt for an AI agent named "${name}". Description: ${description}. Features: ${features.join(', ')}. Make it practical and concise.`;
    return { promptTemplate: await this.chat(prompt), provider: this.activeProvider() };
  }

  async summarize(text) {
    const prompt = `Summarize the following text in 5 bullets:\n\n${text}`;
    return { summary: await this.chat(prompt), provider: this.activeProvider() };
  }
}

module.exports = new AiService();
