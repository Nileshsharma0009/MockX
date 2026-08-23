import dotenv from "dotenv";
dotenv.config();
import { logger } from "../utils/logger.js";

function cleanJSONString(str) {
  if (!str) return "";
  let clean = str.trim();
  if (clean.startsWith("```json")) {
    clean = clean.substring(7);
  } else if (clean.startsWith("```")) {
    clean = clean.substring(3);
  }
  if (clean.endsWith("```")) {
    clean = clean.substring(0, clean.length - 3);
  }
  return clean.trim();
}

export class SmartLLMProvider {
  /**
   * Universal call interface
   * @param {Array<{role: string, content: string}>} messages 
   * @param {Object} options 
   * @param {boolean} options.jsonMode 
   * @param {string} options.systemInstruction 
   */
  static async call(messages, options = {}) {
    const { jsonMode = false, systemInstruction = "" } = options;

    const formattedMessages = [...messages];
    if (systemInstruction) {
      formattedMessages.unshift({ role: "system", content: systemInstruction });
    }

    const groqKey1 = process.env.GROQ_API_KEY;
    const groqModel1 = process.env.GROQ_MODEL || "qwen/qwen3.6-27b";

    const groqKey2 = process.env.GROQ_API_KEY_2;
    const groqModel2 = process.env.GROQ_MODEL_2 || "qwen/qwen3.6-27b";

    const geminiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    // 1. Attempt Groq 1
    if (groqKey1) {
      try {
        logger.info(`[SmartLLMProvider] [TRY 1] Attempting Groq 1 (${groqModel1})...`);
        const result = await this.callGroq(formattedMessages, groqKey1, groqModel1, jsonMode);
        return jsonMode ? cleanJSONString(result) : result;
      } catch (err) {
        logger.error(`[SmartLLMProvider] [TRY 1] Groq 1 failed. Error: ${err.message || err}. Trying Groq 2...`);
      }
    }

    // 2. Attempt Groq 2
    if (groqKey2) {
      try {
        logger.info(`[SmartLLMProvider] [TRY 2] Attempting Groq 2 (${groqModel2})...`);
        const result = await this.callGroq(formattedMessages, groqKey2, groqModel2, jsonMode);
        return jsonMode ? cleanJSONString(result) : result;
      } catch (err) {
        logger.error(`[SmartLLMProvider] [TRY 2] Groq 2 failed. Error: ${err.message || err}. Trying Gemini...`);
      }
    }

    // 3. Attempt Gemini
    if (geminiKey) {
      try {
        logger.info(`[SmartLLMProvider] [TRY 3] Attempting Gemini (${geminiModel})...`);
        const result = await this.callGemini(formattedMessages, geminiKey, geminiModel, jsonMode, systemInstruction);
        return jsonMode ? cleanJSONString(result) : result;
      } catch (err) {
        logger.error(`[SmartLLMProvider] [TRY 3] Gemini failed. Error: ${err.message || err}. Trying Groq 1 fallback...`);
      }
    }

    // 4. Attempt Groq 1 (Final Fallback)
    if (groqKey1) {
      try {
        logger.info(`[SmartLLMProvider] [TRY 4] Final Fallback attempting Groq 1 (${groqModel1})...`);
        const result = await this.callGroq(formattedMessages, groqKey1, groqModel1, jsonMode);
        return jsonMode ? cleanJSONString(result) : result;
      } catch (err) {
        logger.error(`[SmartLLMProvider] [TRY 4] Final Fallback Groq 1 failed. Error: ${err.message || err}`);
      }
    }

    throw new Error("All provider attempts (Groq 1, Groq 2, Gemini, Groq 1 Fallback) failed to execute.");
  }

  static async callGroq(messages, key, model, jsonMode) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          response_format: jsonMode ? { type: "json_object" } : undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Groq API error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      } else {
        throw new Error("Invalid response format from Groq API");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  static async callGemini(messages, key, model, jsonMode, systemInstruction) {
    // Formulate contents for Gemini API (excluding system messages)
    const contents = messages
      .filter(m => m.role !== "system")
      .map(m => {
        let role = "user";
        if (m.role === "assistant" || m.role === "model") {
          role = "model";
        }
        return {
          role,
          parts: [{ text: m.content }]
        };
      });

    // Formulate request body
    const reqBody = {
      contents,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: jsonMode ? "application/json" : "text/plain"
      }
    };

    // Include system instruction
    const sysMsg = messages.find(m => m.role === "system");
    const actualSystem = systemInstruction || sysMsg?.content;
    if (actualSystem) {
      reqBody.systemInstruction = {
        parts: [{ text: actualSystem }]
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reqBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response format from Gemini API");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
}
