import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions/completions";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

type JsonRecord = Record<string, unknown>;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function safeParseJson(raw: string): JsonRecord {
  try {
    return JSON.parse(raw) as JsonRecord;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as JsonRecord;
      } catch {
        // fall through
      }
    }
  }

  return { error: "Unable to parse JSON response.", raw };
}

async function createJsonCompletion(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.3
): Promise<JsonRecord> {
  const client = getClient();
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  const payload: ChatCompletionCreateParamsNonStreaming = {
    model: DEFAULT_MODEL,
    messages,
    temperature,
    stream: false,
  };

  let response: ChatCompletion;
  try {
    response = await client.chat.completions.create({
      ...payload,
      response_format: { type: "json_object" },
    });
  } catch {
    response = await client.chat.completions.create(payload);
  }

  const content = response.choices?.[0]?.message?.content ?? "{}";
  return safeParseJson(content);
}

export async function generateKeywordResearch(topic: string, count = 12) {
  const cleanedTopic = topic.trim();
  if (!cleanedTopic) {
    throw new Error("Topic is required.");
  }

  const limit = Math.min(Math.max(count, 5), 30);
  const result = await createJsonCompletion(
    "Return strictly valid JSON. Do not include markdown.",
    `Generate keyword research for the topic: "${cleanedTopic}".
Return JSON with keys:
- topic (string)
- keywords (array of objects with keyword, intent, difficulty, volume, angle)
Provide exactly ${limit} keywords.`,
    0.2
  );

  return {
    topic: cleanedTopic,
    keywords: Array.isArray(result.keywords) ? result.keywords : [],
    raw: result,
  };
}

export async function generateContentBrief(keyword: string, contentType: string) {
  const cleanedKeyword = keyword.trim();
  if (!cleanedKeyword) {
    throw new Error("Keyword is required.");
  }

  const cleanedType = contentType.trim() || "article";
  const result = await createJsonCompletion(
    "Return strictly valid JSON. Do not include markdown.",
    `Create an SEO content brief for keyword: "${cleanedKeyword}".
Content type: "${cleanedType}".
Return JSON with keys:
- keyword
- intent
- title_ideas (array)
- outline (array)
- meta_title
- meta_description
- faq (array)
- internal_links (array)
- optimization_notes (array)`,
    0.4
  );

  return {
    keyword: cleanedKeyword,
    contentType: cleanedType,
    brief: result,
  };
}

export async function optimizeContent(content: string, keyword: string) {
  const cleanedKeyword = keyword.trim();
  if (!cleanedKeyword) {
    throw new Error("Keyword is required.");
  }

  const clippedContent = content.trim().slice(0, 4000);
  if (!clippedContent) {
    throw new Error("Content is required.");
  }

  const result = await createJsonCompletion(
    "Return strictly valid JSON. Do not include markdown.",
    `Analyze and optimize this content for the keyword "${cleanedKeyword}".
Content:
${clippedContent}

Return JSON with keys:
- keyword
- summary
- improvements (array)
- revised_intro (string)
- on_page_checks (array)`,
    0.3
  );

  return {
    keyword: cleanedKeyword,
    analysis: result,
  };
}
