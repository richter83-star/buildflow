import { useState, type ReactNode } from "react";
import { data, Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/portal.seo";
import { callTrpc } from "~/utils/trpc.server";
import {
  generateContentBrief,
  generateKeywordResearch,
  optimizeContent,
} from "~/utils/seo.server";
import { PortalShell } from "~/components/portal/PortalShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { PAID_OFFER } from "~/utils/offer";

type JsonRecord = Record<string, unknown>;

type KeywordResearch = {
  topic: string;
  keywords: JsonRecord[];
};

type ContentBrief = {
  keyword: string;
  contentType: string;
  brief: JsonRecord;
};

type OptimizedContent = {
  keyword: string;
  analysis: JsonRecord;
};

type ActionData = {
  intent?: "keywords" | "brief" | "optimize";
  error?: string;
  keywordResearch?: KeywordResearch;
  contentBrief?: ContentBrief;
  optimizedContent?: OptimizedContent;
};

const DEFAULT_KEYWORD_COUNT = 12;

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.replace(/^TRPCError:\s*/i, "").trim();
  }
  return "Something went wrong. Please try again.";
}

function toJsonPreview(payload: unknown) {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return "Unable to display JSON output.";
  }
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function formatValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function renderCell(value: unknown) {
  const text = formatValue(value);
  return text.length ? text : "-";
}

function TextSection({ title, value, placeholder = "Not provided." }: { title: string; value?: string; placeholder?: string }) {
  const content = value && value.length ? value : placeholder;
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="text-sm text-foreground">{content}</div>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: unknown[] }) {
  const normalized = items.map((item) => formatValue(item)).filter((item) => item.length);
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      {normalized.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
          {normalized.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-muted-foreground">No items returned.</div>
      )}
    </div>
  );
}

function ResultPanel({ title, summary, rawJson }: { title: string; summary: ReactNode; rawJson: string }) {
  const [copied, setCopied] = useState(false);
  const canCopy = rawJson.length > 0;
  const copyLabel = copied ? "Copied" : "Copy JSON";

  async function handleCopy() {
    if (!canCopy || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(rawJson);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium text-muted-foreground">{title}</div>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy} disabled={!canCopy}>
          {copyLabel}
        </Button>
      </div>
      <Tabs defaultValue="summary" className="mt-3">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">{summary}</TabsContent>
        <TabsContent value="raw">
          <pre className="whitespace-pre-wrap text-xs text-foreground">{rawJson}</pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) return redirect("/login");

  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: PAID_OFFER.productSlug });
  if (!hasEntitlement) return redirect("/checkout");

  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const caller = await callTrpc(request);
  const session = await caller.auth.me();

  if (!session.isSignedIn) return redirect("/login");

  const hasEntitlement = await caller.portal.hasEntitlement({ productSlug: PAID_OFFER.productSlug });
  if (!hasEntitlement) return redirect("/checkout");

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "keywords") {
    const topic = getFormString(formData, "topic");
    const rawCount = getFormString(formData, "count");

    if (!topic) {
      return data<ActionData>({ intent: "keywords", error: "Topic is required." }, { status: 400 });
    }

    let count = DEFAULT_KEYWORD_COUNT;
    if (rawCount) {
      const parsed = Number(rawCount);
      if (!Number.isFinite(parsed)) {
        return data<ActionData>({ intent: "keywords", error: "Keyword count must be a number." }, { status: 400 });
      }
      count = Math.round(parsed);
      if (count < 5 || count > 30) {
        return data<ActionData>({ intent: "keywords", error: "Keyword count must be between 5 and 30." }, { status: 400 });
      }
    }

    try {
      const result = await generateKeywordResearch(topic, count);
      return data<ActionData>({
        intent: "keywords",
        keywordResearch: {
          topic: result.topic,
          keywords: Array.isArray(result.keywords) ? result.keywords : [],
        },
      });
    } catch (error: unknown) {
      return data<ActionData>({ intent: "keywords", error: getErrorMessage(error) }, { status: 500 });
    }
  }

  if (intent === "brief") {
    const keyword = getFormString(formData, "keyword");
    const contentType = getFormString(formData, "contentType") || "article";

    if (!keyword) {
      return data<ActionData>({ intent: "brief", error: "Keyword is required." }, { status: 400 });
    }

    try {
      const result = await generateContentBrief(keyword, contentType);
      return data<ActionData>({
        intent: "brief",
        contentBrief: {
          keyword: result.keyword,
          contentType: result.contentType,
          brief: result.brief,
        },
      });
    } catch (error: unknown) {
      return data<ActionData>({ intent: "brief", error: getErrorMessage(error) }, { status: 500 });
    }
  }

  if (intent === "optimize") {
    const keyword = getFormString(formData, "keyword");
    const content = getFormString(formData, "content");

    if (!keyword) {
      return data<ActionData>({ intent: "optimize", error: "Keyword is required." }, { status: 400 });
    }

    if (!content) {
      return data<ActionData>({ intent: "optimize", error: "Content is required." }, { status: 400 });
    }

    try {
      const result = await optimizeContent(content, keyword);
      return data<ActionData>({
        intent: "optimize",
        optimizedContent: {
          keyword: result.keyword,
          analysis: result.analysis,
        },
      });
    } catch (error: unknown) {
      return data<ActionData>({ intent: "optimize", error: getErrorMessage(error) }, { status: 500 });
    }
  }

  return data<ActionData>({ error: "Unknown request." }, { status: 400 });
}

export default function SeoToolsPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const activeIntent = typeof navigation.formData?.get("intent") === "string"
    ? String(navigation.formData?.get("intent"))
    : null;

  const keywordsSubmitting = navigation.state === "submitting" && activeIntent === "keywords";
  const briefSubmitting = navigation.state === "submitting" && activeIntent === "brief";
  const optimizeSubmitting = navigation.state === "submitting" && activeIntent === "optimize";

  const keywordError = actionData?.intent === "keywords" ? actionData.error : undefined;
  const keywordResult = actionData?.intent === "keywords" ? actionData.keywordResearch : undefined;
  const briefError = actionData?.intent === "brief" ? actionData.error : undefined;
  const briefResult = actionData?.intent === "brief" ? actionData.contentBrief : undefined;
  const optimizeError = actionData?.intent === "optimize" ? actionData.error : undefined;
  const optimizeResult = actionData?.intent === "optimize" ? actionData.optimizedContent : undefined;
  const keywordJson = keywordResult ? toJsonPreview(keywordResult) : "";
  const briefJson = briefResult ? toJsonPreview(briefResult) : "";
  const optimizeJson = optimizeResult ? toJsonPreview(optimizeResult) : "";

  const briefData = asRecord(briefResult?.brief);
  const optimizeData = asRecord(optimizeResult?.analysis);

  return (
    <PortalShell
      title="SEO Tools"
      subtitle="Generate keyword research, content briefs, and on-page improvements."
    >
      <div className="space-y-6">
        <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          Set <b>OPENAI_API_KEY</b> in your environment to enable the SEO tools.
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Keyword research</CardTitle>
              <CardDescription>Build a short list of target keywords and angles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Form method="post" className="space-y-5">
                <input type="hidden" name="intent" value="keywords" />
                <FieldGroup>
                  {keywordError && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {keywordError}
                    </div>
                  )}
                  <Field>
                    <FieldLabel htmlFor="topic">Topic</FieldLabel>
                    <Input id="topic" name="topic" placeholder="AI automation for SMBs" required />
                    <FieldDescription>Describe the market or product you want to rank for.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="count">Keyword count</FieldLabel>
                    <Input
                      id="count"
                      name="count"
                      type="number"
                      min={5}
                      max={30}
                      defaultValue={DEFAULT_KEYWORD_COUNT}
                    />
                    <FieldDescription>Choose between 5 and 30 keywords.</FieldDescription>
                  </Field>
                  <Field className="flex gap-2">
                    <Button type="submit" disabled={keywordsSubmitting}>
                      {keywordsSubmitting ? "Generating..." : "Generate keywords"}
                    </Button>
                  </Field>
                </FieldGroup>
              </Form>

              {keywordResult && (
                <ResultPanel
                  title="Results"
                  rawJson={keywordJson}
                  summary={
                    keywordResult.keywords.length ? (
                      <Table>
                        <TableCaption>Generated for "{keywordResult.topic}".</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Keyword</TableHead>
                            <TableHead>Intent</TableHead>
                            <TableHead>Difficulty</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Angle</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keywordResult.keywords.map((row, index) => (
                            <TableRow key={`keyword-${index}`}>
                              <TableCell>{renderCell(row.keyword)}</TableCell>
                              <TableCell>{renderCell(row.intent)}</TableCell>
                              <TableCell>{renderCell(row.difficulty)}</TableCell>
                              <TableCell>{renderCell(row.volume)}</TableCell>
                              <TableCell>{renderCell(row.angle)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-sm text-muted-foreground">No keywords returned.</div>
                    )
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Content brief</CardTitle>
              <CardDescription>Turn a keyword into a ready-to-write outline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Form method="post" className="space-y-5">
                <input type="hidden" name="intent" value="brief" />
                <FieldGroup>
                  {briefError && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {briefError}
                    </div>
                  )}
                  <Field>
                    <FieldLabel htmlFor="brief-keyword">Keyword</FieldLabel>
                    <Input id="brief-keyword" name="keyword" placeholder="automation checklist template" required />
                    <FieldDescription>Use a primary keyword you want to rank.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contentType">Content type</FieldLabel>
                    <Input id="contentType" name="contentType" placeholder="guide, landing page, listicle" />
                    <FieldDescription>Optional. Defaults to article.</FieldDescription>
                  </Field>
                  <Field className="flex gap-2">
                    <Button type="submit" disabled={briefSubmitting}>
                      {briefSubmitting ? "Generating..." : "Generate brief"}
                    </Button>
                  </Field>
                </FieldGroup>
              </Form>

              {briefResult && (
                <ResultPanel
                  title="Brief"
                  rawJson={briefJson}
                  summary={
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <TextSection title="Intent" value={formatValue(briefData.intent)} />
                        <TextSection title="Meta title" value={formatValue(briefData.meta_title)} />
                        <TextSection title="Meta description" value={formatValue(briefData.meta_description)} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <ListSection title="Title ideas" items={asArray(briefData.title_ideas)} />
                        <ListSection title="Outline" items={asArray(briefData.outline)} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <ListSection title="FAQ" items={asArray(briefData.faq)} />
                        <ListSection title="Internal links" items={asArray(briefData.internal_links)} />
                      </div>
                      <ListSection title="Optimization notes" items={asArray(briefData.optimization_notes)} />
                    </div>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Optimize content</CardTitle>
              <CardDescription>Improve on-page copy for a specific keyword.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Form method="post" className="space-y-5">
                <input type="hidden" name="intent" value="optimize" />
                <FieldGroup>
                  {optimizeError && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {optimizeError}
                    </div>
                  )}
                  <Field>
                    <FieldLabel htmlFor="optimize-keyword">Keyword</FieldLabel>
                    <Input id="optimize-keyword" name="keyword" placeholder="prompt automation workflow" required />
                    <FieldDescription>Pick the keyword to optimize for.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="content">Draft content</FieldLabel>
                    <Textarea
                      id="content"
                      name="content"
                      rows={8}
                      placeholder="Paste your draft or existing page content here."
                      required
                    />
                    <FieldDescription>We use up to 4,000 characters for analysis.</FieldDescription>
                  </Field>
                  <Field className="flex gap-2">
                    <Button type="submit" disabled={optimizeSubmitting}>
                      {optimizeSubmitting ? "Optimizing..." : "Optimize content"}
                    </Button>
                  </Field>
                </FieldGroup>
              </Form>

              {optimizeResult && (
                <ResultPanel
                  title="Optimization notes"
                  rawJson={optimizeJson}
                  summary={
                    <div className="space-y-4">
                      <TextSection title="Summary" value={formatValue(optimizeData.summary)} />
                      <TextSection title="Revised intro" value={formatValue(optimizeData.revised_intro)} />
                      <div className="grid gap-4 md:grid-cols-2">
                        <ListSection title="Improvements" items={asArray(optimizeData.improvements)} />
                        <ListSection title="On-page checks" items={asArray(optimizeData.on_page_checks)} />
                      </div>
                    </div>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
}
