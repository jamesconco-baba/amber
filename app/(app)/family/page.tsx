"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  PageHeader,
  Card,
  Button,
  Field,
  Modal,
  EmptyState,
  inputClass,
} from "@/components/ui";
import { formatDate, TYPE_GLYPH, TYPE_LABEL } from "@/lib/media";
import { FamilyMember } from "@/lib/types";

const RELATIONSHIPS = [
  "Me",
  "Mother",
  "Father",
  "Grandmother",
  "Grandfather",
  "Daughter",
  "Son",
  "Grandchild",
  "Sibling",
  "Aunt",
  "Uncle",
  "Cousin",
  "Other",
];

export default function FamilyTree() {
  const {
    data,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [detail, setDetail] = useState<FamilyMember | null>(null);

  // form state
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);
  const [parentId, setParentId] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [note, setNote] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [contentIds, setContentIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const members = data.family;

  // Build root trees: members with no (resolvable) parent.
  const byParent = useMemo(() => {
    const map: Record<string, FamilyMember[]> = {};
    for (const m of members) {
      const key = m.parentId && members.some((x) => x.id === m.parentId) ? m.parentId : "__root__";
      (map[key] ||= []).push(m);
    }
    return map;
  }, [members]);

  const roots = byParent["__root__"] ?? [];

  const resetForm = () => {
    setName("");
    setRelationship(RELATIONSHIPS[0]);
    setParentId("");
    setPartnerName("");
    setBirthYear("");
    setDeathYear("");
    setNote("");
    setBeneficiaryId("");
    setContentIds([]);
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (m: FamilyMember) => {
    setEditing(m);
    setName(m.name);
    setRelationship(m.relationship || RELATIONSHIPS[0]);
    setParentId(m.parentId ?? "");
    setPartnerName(m.partnerName ?? "");
    setBirthYear(m.birthYear ?? "");
    setDeathYear(m.deathYear ?? "");
    setNote(m.note ?? "");
    setBeneficiaryId(m.beneficiaryId ?? "");
    setContentIds(m.contentIds ?? []);
    setDetail(null);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      relationship,
      parentId: parentId || undefined,
      partnerName: partnerName.trim() || undefined,
      birthYear: birthYear.trim() || undefined,
      deathYear: deathYear.trim() || undefined,
      note: note.trim() || undefined,
      beneficiaryId: beneficiaryId || undefined,
      contentIds,
    };
    try {
      if (editing) await updateFamilyMember(editing.id, payload);
      else await addFamilyMember(payload);
      setOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const toggleContent = (id: string) =>
    setContentIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  // Prevent choosing self or a descendant as parent (avoids cycles).
  const descendantIds = (rootId: string): Set<string> => {
    const set = new Set<string>();
    const walk = (pid: string) => {
      for (const m of members) {
        if (m.parentId === pid && !set.has(m.id)) {
          set.add(m.id);
          walk(m.id);
        }
      }
    };
    walk(rootId);
    return set;
  };
  const invalidParents = editing ? descendantIds(editing.id) : new Set<string>();

  function Node({ member }: { member: FamilyMember }) {
    const children = byParent[member.id] ?? [];
    const memoryCount = member.contentIds?.length ?? 0;
    const isMe = member.relationship?.toLowerCase() === "me";
    return (
      <li>
        <button
          onClick={() => setDetail(member)}
          className={`inline-block min-w-[132px] rounded-xl2 border px-3.5 py-2.5 text-left align-top shadow-soft transition-shadow hover:shadow-lift ${
            isMe ? "border-amber bg-amber-wash" : "border-ink/10 bg-parchment-card"
          }`}
        >
          <div className="font-display text-[15px] leading-tight text-ink">{member.name}</div>
          <div className="text-xs text-sage">{member.relationship}</div>
          {(member.birthYear || member.deathYear) && (
            <div className="mt-0.5 text-[11px] text-sage">
              {member.birthYear ?? "?"}
              {member.deathYear ? ` – ${member.deathYear}` : ""}
            </div>
          )}
          {member.partnerName && (
            <div className="mt-1 rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11px] text-ink/60">
              ⚭ {member.partnerName}
            </div>
          )}
          {memoryCount > 0 && (
            <div className="mt-1 text-[11px] text-clay">
              {memoryCount} linked memor{memoryCount === 1 ? "y" : "ies"}
            </div>
          )}
        </button>
        {children.length > 0 && (
          <ul>
            {children.map((c) => (
              <Node key={c.id} member={c} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Family Tree"
        title="Your family, across generations"
        subtitle="A living map of the people in your story. Link each person to the memories you've preserved about them."
        action={<Button onClick={openAdd}>Add a person</Button>}
      />

      {members.length === 0 ? (
        <EmptyState
          title="Start your family tree"
          body="Add yourself first, then parents, children, and grandchildren. Connect each to a place in the tree and to the memories that belong to them."
          action={<Button onClick={openAdd}>Add the first person</Button>}
        />
      ) : (
        <Card className="overflow-x-auto p-6">
          <div className="ftree inline-block min-w-full text-center">
            {roots.map((r) => (
              <ul key={r.id}>
                <Node member={r} />
              </ul>
            ))}
          </div>
        </Card>
      )}

      {/* Add / edit */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editing ? "Edit person" : "Add a person"}
        wide
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                autoFocus
              />
            </Field>
            <Field label="Relationship">
              <select
                className={inputClass}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Child of" hint="Place this person under their parent in the tree.">
            <select className={inputClass} value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">— No parent in tree (a root) —</option>
              {members
                .filter((m) => m.id !== editing?.id && !invalidParents.has(m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.relationship})
                  </option>
                ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Partner / spouse">
              <input
                className={inputClass}
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="Born">
              <input
                className={inputClass}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="Year"
              />
            </Field>
            <Field label="Died">
              <input
                className={inputClass}
                value={deathYear}
                onChange={(e) => setDeathYear(e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>

          <Field label="A note about them (optional)">
            <textarea
              className={`${inputClass} min-h-[70px] resize-y`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Who they were, what they meant…"
            />
          </Field>

          {data.beneficiaries.length > 0 && (
            <Field label="Link to a Legacy Circle member (optional)">
              <select
                className={inputClass}
                value={beneficiaryId}
                onChange={(e) => setBeneficiaryId(e.target.value)}
              >
                <option value="">— None —</option>
                {data.beneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.relationship})
                  </option>
                ))}
              </select>
            </Field>
          )}

          {data.content.length > 0 && (
            <Field label="Link memories about this person (optional)">
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-ink/10 p-2">
                {data.content.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink/[0.03]"
                  >
                    <input
                      type="checkbox"
                      checked={contentIds.includes(c.id)}
                      onChange={() => toggleContent(c.id)}
                      className="h-4 w-4 accent-[#BE873B]"
                    />
                    <span className="text-sm text-ink/80">
                      {TYPE_GLYPH[c.type]} {c.title}
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          )}

          <div className="flex items-center justify-between pt-2">
            {editing ? (
              <Button
                variant="danger"
                onClick={async () => {
                  await removeFamilyMember(editing.id);
                  setOpen(false);
                  resetForm();
                }}
              >
                Remove
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={save} disabled={!name.trim() || saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Add to tree"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ""}>
        {detail && (
          <div className="space-y-4">
            <div className="text-sm text-sage">
              {detail.relationship}
              {(detail.birthYear || detail.deathYear) &&
                ` · ${detail.birthYear ?? "?"}${detail.deathYear ? ` – ${detail.deathYear}` : ""}`}
              {detail.partnerName && ` · ⚭ ${detail.partnerName}`}
            </div>
            {detail.note && (
              <p className="whitespace-pre-wrap rounded-xl bg-parchment/60 p-4 text-[15px] leading-relaxed text-ink/85">
                {detail.note}
              </p>
            )}
            {detail.contentIds.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-ink/80">Linked memories</p>
                <ul className="space-y-1.5">
                  {detail.contentIds
                    .map((id) => data.content.find((c) => c.id === id))
                    .filter(Boolean)
                    .map((c) => (
                      <li
                        key={c!.id}
                        className="flex items-center gap-2 rounded-lg bg-parchment/60 px-3 py-2 text-sm text-ink/80"
                      >
                        <span className="text-clay">{TYPE_GLYPH[c!.type]}</span>
                        <span className="flex-1">{c!.title}</span>
                        <span className="text-xs text-sage">{TYPE_LABEL[c!.type]}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2 border-t border-ink/10 pt-4">
              <Button variant="outline" onClick={() => openEdit(detail)}>
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
