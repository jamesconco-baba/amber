"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  PageHeader,
  Button,
  Card,
  Field,
  Modal,
  EmptyState,
  inputClass,
} from "@/components/ui";
import { formatDate } from "@/lib/media";

const RELATIONSHIPS = ["Daughter", "Son", "Grandchild", "Spouse", "Sibling", "Other"];

export default function Circle() {
  const { data, addBeneficiary, removeBeneficiary } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");

  const save = () => {
    if (!name.trim()) return;
    addBeneficiary({
      name: name.trim(),
      relationship,
      email: email.trim() || undefined,
      birthday: birthday || undefined,
    });
    setName("");
    setEmail("");
    setBirthday("");
    setRelationship(RELATIONSHIPS[0]);
    setOpen(false);
  };

  const forCount = (id: string) =>
    data.content.filter((c) => c.beneficiaryIds.includes(id)).length +
    data.messages.filter((m) => m.beneficiaryId === id).length;

  return (
    <div>
      <PageHeader
        eyebrow="Legacy Circle"
        title="The people you're preserving for"
        subtitle="Your circle defines who can receive what you leave, and when. You stay in control of every rule."
        action={
          <div className="flex gap-2">
            <Link href="/inheritance">
              <Button variant="outline">Inheritance & release</Button>
            </Link>
            <Button onClick={() => setOpen(true)}>Add someone</Button>
          </div>
        }
      />

      {data.beneficiaries.length === 0 ? (
        <EmptyState
          title="Your circle is empty"
          body="Add a child, grandchild, or loved one so you can address messages to them and schedule releases."
          action={<Button onClick={() => setOpen(true)}>Add your first person</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.beneficiaries.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-ink font-display text-lg text-amber-soft">
                    {b.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3 className="font-display text-lg text-ink">{b.name}</h3>
                    <p className="text-sm text-sage">{b.relationship}</p>
                  </div>
                </div>
                <button
                  className="text-sm text-clay hover:underline"
                  onClick={() => removeBeneficiary(b.id)}
                >
                  Remove
                </button>
              </div>
              <dl className="mt-4 space-y-1 text-sm text-sage">
                {b.email && <div>Email · {b.email}</div>}
                {b.birthday && <div>Birthday · {formatDate(b.birthday)}</div>}
                <div>{forCount(b.id)} item(s) addressed to them</div>
              </dl>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add to your circle">
        <div className="space-y-5">
          <Field label="Name">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Their full name"
              autoFocus
            />
          </Field>
          <Field label="Relationship">
            <select className={inputClass} value={relationship} onChange={(e) => setRelationship(e.target.value)}>
              {RELATIONSHIPS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Email (optional)" hint="Where a release notification would eventually be sent.">
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="them@example.com"
            />
          </Field>
          <Field label="Birthday (optional)" hint="Helps suggest milestone dates later.">
            <input
              className={inputClass}
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!name.trim()}>
              Add to circle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
