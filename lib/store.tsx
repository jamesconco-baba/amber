"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";
import {
  VBTData,
  Profile,
  Beneficiary,
  ContentItem,
  ScheduledMessage,
} from "./types";

// ---------------------------------------------------------------------------
// Supabase-backed store.
//
// Components talk only to `useStore()`. Data lives in Postgres (row-level
// security scopes every read/write to the signed-in user) and media lives in
// the private "vault" storage bucket. Mutating methods are async.
// ---------------------------------------------------------------------------

const EMPTY: VBTData = {
  profile: null,
  beneficiaries: [],
  content: [],
  messages: [],
  onboarded: false,
};

const SIGNED_URL_TTL = 60 * 60; // 1 hour

function mimeToExt(mime: string) {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("mpeg")) return "mp4";
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("pdf")) return "pdf";
  const guess = mime.split("/")[1];
  return guess ? guess.replace(/[^a-z0-9]/gi, "") : "bin";
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

// Map DB rows -> app types, attaching signed URLs for any media.
async function loadAll(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<VBTData> {
  const [profileRes, benRes, contentRes, msgRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("beneficiaries").select("*").eq("user_id", userId).order("created_at"),
    supabase
      .from("content_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("scheduled_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const contentRows = contentRes.data ?? [];
  const paths = contentRows.filter((c) => c.media_path).map((c) => c.media_path as string);
  const signed: Record<string, string> = {};
  if (paths.length) {
    const { data: sigs } = await supabase.storage.from("vault").createSignedUrls(paths, SIGNED_URL_TTL);
    sigs?.forEach((s, i) => {
      if (s.signedUrl) signed[paths[i]] = s.signedUrl;
    });
  }

  const profile: Profile | null = profileRes.data
    ? {
        id: userId,
        name: profileRes.data.name ?? "You",
        email,
        role: "creator",
        createdAt: profileRes.data.created_at,
      }
    : null;

  return {
    profile,
    onboarded: Boolean(profileRes.data?.onboarded),
    beneficiaries: (benRes.data ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      relationship: b.relationship ?? "",
      email: b.email ?? undefined,
      birthday: b.birthday ?? undefined,
      createdAt: b.created_at,
    })),
    content: contentRows.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      note: c.note ?? undefined,
      transcript: c.transcript ?? undefined,
      tags: c.tags ?? [],
      beneficiaryIds: c.beneficiary_ids ?? [],
      promptId: c.prompt_id ?? undefined,
      aiConsent: c.ai_consent ?? true,
      createdAt: c.created_at,
      media: c.media_path
        ? {
            dataUrl: signed[c.media_path] ?? "",
            mimeType: c.media_mime ?? "application/octet-stream",
            fileName: c.media_filename ?? undefined,
            durationSec: c.media_duration ?? undefined,
          }
        : undefined,
    })),
    messages: (msgRes.data ?? []).map((m) => ({
      id: m.id,
      contentId: m.content_id ?? undefined,
      title: m.title,
      note: m.note ?? undefined,
      beneficiaryId: m.beneficiary_id ?? "",
      trigger: m.trigger,
      releaseDate: m.release_date ?? undefined,
      milestone: m.milestone ?? undefined,
      status: m.status,
      createdAt: m.created_at,
    })),
  };
}

interface StoreShape {
  data: VBTData;
  ready: boolean;
  configured: boolean;
  session: Session | null;
  refresh: () => Promise<void>;
  saveProfile: (name: string) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  addBeneficiary: (b: Omit<Beneficiary, "id" | "createdAt">) => Promise<void>;
  removeBeneficiary: (id: string) => Promise<void>;
  addContent: (c: Omit<ContentItem, "id" | "createdAt">) => Promise<void>;
  removeContent: (id: string) => Promise<void>;
  addMessage: (m: Omit<ScheduledMessage, "id" | "createdAt">) => Promise<void>;
  updateMessage: (id: string, patch: Partial<ScheduledMessage>) => Promise<void>;
  removeMessage: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
  reset: () => Promise<void>;
}

const StoreContext = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const configured = isSupabaseConfigured();
  const [data, setData] = useState<VBTData>(EMPTY);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const userId = session?.user.id ?? null;
  const emailRef = useRef<string>("");

  const refresh = async () => {
    if (!supabase || !userId) {
      setData(EMPTY);
      return;
    }
    const next = await loadAll(supabase, userId, emailRef.current);
    setData(next);
  };

  // Auth bootstrap + subscription
  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      emailRef.current = session?.user.email ?? "";
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      emailRef.current = session?.user.email ?? "";
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load data whenever the signed-in user changes
  useEffect(() => {
    if (!ready) return;
    if (userId) refresh();
    else setData(EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, ready]);

  const api: StoreShape = useMemo(() => {
    const requireAuth = () => {
      if (!supabase || !userId) throw new Error("Not signed in");
      return { supabase, userId };
    };
    return {
      data,
      ready,
      configured,
      session,
      refresh,
      saveProfile: async (name) => {
        const { supabase, userId } = requireAuth();
        await supabase.from("profiles").upsert({ id: userId, name });
        await refresh();
      },
      finishOnboarding: async () => {
        const { supabase, userId } = requireAuth();
        await supabase.from("profiles").upsert({ id: userId, onboarded: true });
        await refresh();
      },
      addBeneficiary: async (b) => {
        const { supabase, userId } = requireAuth();
        await supabase.from("beneficiaries").insert({
          user_id: userId,
          name: b.name,
          relationship: b.relationship,
          email: b.email ?? null,
          birthday: b.birthday ?? null,
        });
        await refresh();
      },
      removeBeneficiary: async (id) => {
        const { supabase } = requireAuth();
        await supabase.from("beneficiaries").delete().eq("id", id);
        await refresh();
      },
      addContent: async (c) => {
        const { supabase, userId } = requireAuth();
        let media_path: string | null = null;
        if (c.media?.dataUrl?.startsWith("data:")) {
          const blob = await dataUrlToBlob(c.media.dataUrl);
          const ext = mimeToExt(c.media.mimeType);
          const path = `${userId}/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage
            .from("vault")
            .upload(path, blob, { contentType: c.media.mimeType, upsert: false });
          if (error) throw error;
          media_path = path;
        }
        const { error } = await supabase.from("content_items").insert({
          user_id: userId,
          type: c.type,
          title: c.title,
          note: c.note ?? null,
          transcript: c.transcript ?? null,
          tags: c.tags,
          beneficiary_ids: c.beneficiaryIds,
          prompt_id: c.promptId ?? null,
          ai_consent: c.aiConsent ?? true,
          media_path,
          media_mime: c.media?.mimeType ?? null,
          media_filename: c.media?.fileName ?? null,
          media_duration: c.media?.durationSec ?? null,
        });
        if (error) throw error;
        await refresh();
      },
      removeContent: async (id) => {
        const { supabase } = requireAuth();
        const item = data.content.find((c) => c.id === id);
        await supabase.from("content_items").delete().eq("id", id);
        // best-effort media cleanup handled by cascade / lifecycle in production
        void item;
        await refresh();
      },
      addMessage: async (m) => {
        const { supabase, userId } = requireAuth();
        await supabase.from("scheduled_messages").insert({
          user_id: userId,
          content_id: m.contentId ?? null,
          title: m.title,
          note: m.note ?? null,
          beneficiary_id: m.beneficiaryId || null,
          trigger: m.trigger,
          release_date: m.releaseDate ?? null,
          milestone: m.milestone ?? null,
          status: m.status,
        });
        await refresh();
      },
      updateMessage: async (id, patch) => {
        const { supabase } = requireAuth();
        const row: Record<string, unknown> = {};
        if (patch.status !== undefined) row.status = patch.status;
        if (patch.title !== undefined) row.title = patch.title;
        if (patch.note !== undefined) row.note = patch.note;
        await supabase.from("scheduled_messages").update(row).eq("id", id);
        await refresh();
      },
      removeMessage: async (id) => {
        const { supabase } = requireAuth();
        await supabase.from("scheduled_messages").delete().eq("id", id);
        await refresh();
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        setData(EMPTY);
      },
      reset: async () => {
        const { supabase, userId } = requireAuth();
        await Promise.all([
          supabase.from("scheduled_messages").delete().eq("user_id", userId),
          supabase.from("content_items").delete().eq("user_id", userId),
          supabase.from("beneficiaries").delete().eq("user_id", userId),
        ]);
        await supabase.from("profiles").upsert({ id: userId, onboarded: false });
        await refresh();
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ready, configured, session, userId]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
