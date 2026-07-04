"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Button, Field, Modal, inputClass } from "@/components/ui";
import { AvatarPicker } from "@/components/avatar";
import { formatDate, TYPE_GLYPH } from "@/lib/media";

const RELATIONSHIPS = ["Daughter", "Son", "Grandchild", "Spouse", "Sibling", "Parent", "Friend", "Other"];

export default function EditBeneficiary() {
  const { data, updateBeneficiary, removeBeneficiary } = useStore();
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const member = data.beneficiaries.find((b) => b.id === id);

  const [name, setName] = useState(member?.name ?? "");
  const [relationship, setRelationship] = useState(member?.relationship || RELATIONSHIPS[0]);
  const [email, setEmail] = useState(member?.email ?? "");
  const [birthday, setBirthday] = useState(member?.birthday ?? "");
  const [notes, setNotes] = useState(member?.notes ?? "");
  const [avatar, setAvatar] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const addressed = useMemo(
    () => (member ? data.content.filter((c) => c.beneficiaryIds.includes(member.id)) : []),
    [data.content, member]
  );

  if (!member) {
    return (
      <div>
        <PageHeader title="Member not found" subtitle="This person may have been removed." />
        <Link href="/circle">
          <Button variant="outline">Back to Legacy Circle</Button>
        </Link>
      </div>
    );
  }

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateBeneficiary(
        member.id,
        {
          name: name.trim(),
          relationship,
          email: email.trim() || undefined,
          birthday: birthday || undefined,
          notes: notes.trim() || undefined,
        },
        avatar
      );
      setAvatar(undefined);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Legacy Circle"
        title={`Edit ${member.name.split(" ")[0]}`}
        subtitle="Keep their details up to date, add a photo, or note anything worth remembering."
        action={
          <Link href="/circle">
            <Button variant="ghost">← Back</Button>
          </Link>
        }
      />

      <Card className="max-w-2xl p-6">
        <div className="space-y-5">
          <AvatarPicker
            url={member.avatarUrl}
            preview={avatar}
            name={name}
            onPick={setAvatar}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" hint="Where a release notification would eventually be sent.">
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="them@example.com"
              />
            </Field>
            <Field label="Date of birth">
              <input
                className={inputClass}
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notes & details" hint="Anything you'd like to remember about them.">
            <textarea
              className={`${inputClass} min-h-[90px] resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Their story, what they mean to you, things to pass on…"
            />
          </Field>

          <div className="flex items-center justify-between pt-1">
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Remove from circle
            </Button>
            <div className="flex items-center gap-3">
              {saved && <span className="text-sm text-sage">Saved</span>}
              <Button onClick={save} disabled={!name.trim() || saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {addressed.length > 0 && (
        <Card className="mt-5 max-w-2xl p-6">
          <h3 className="mb-3 font-display text-lg text-ink">Addressed to {member.name.split(" ")[0]}</h3>
          <ul className="space-y-1.5">
            {addressed.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-lg bg-parchment/60 px-3 py-2 text-sm text-ink/80">
                <span className="text-clay">{TYPE_GLYPH[c.type]}</span>
                <span className="flex-1 truncate">{c.title}</span>
                <span className="text-xs text-sage">{formatDate(c.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={`Remove ${member.name}?`}>
        <p className="text-[15px] leading-relaxed text-ink/75">
          This removes {member.name} from your Legacy Circle. Memories and messages already
          preserved aren&apos;t deleted, but they will no longer be addressed to this person.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await removeBeneficiary(member.id);
              router.push("/circle");
            }}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
