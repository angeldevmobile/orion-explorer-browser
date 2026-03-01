import { voiceService as apiVoiceService } from './api';

export const processVoiceQuery = async (
  query: string, 
  context?: Record<string, unknown>
) => {
  return await apiVoiceService.processVoiceCommand(query, context);
};

export const summarizePage = async (url: string, content: string) => {
  return await apiVoiceService.summarizePage(url, content);
};

export const chatWithAssistant = async (message: string) => {
  return await apiVoiceService.chat(message);
};

export const getContextualSuggestions = async (
  currentUrl: string, 
  userActivity: Record<string, unknown>
) => {
  return await apiVoiceService.getSuggestions(currentUrl, userActivity);
};

export const clearConversationHistory = async () => {
  return await apiVoiceService.clearHistory();
};