"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  Button,
  Card,
  Field,
  Modal,
  PageHeader,
  StatusPill,
  EmptyState,
  Tag,
  inputClass,
} from "@/components/ui";
import { formatDate } from "@/lib/media";
import * as inh from "@/lib/inheritance";

type Tab = "recipients" | "executors" | "verification" | "audit";

export default function Inheritance() {
  const { ready, session } = useStore();
  const [tab, setTab] = useState<Tab>("recipients");
  const [d, setD] = useState<inh.InheritanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setD(await inh.loadInheritance());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready && session) reload();
  }, [ready, session, reload]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "recipients", label: "Recipients" },
    { key: "verification", label: "Verification & release" },
    { key: "executors", label: "Executors" },
    { key: "audit", label: "Audit log" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Executor & Inheritance"
        title="How your legacy reaches them"
        subtitle="Set up who receives what you leave, how they'll be reached across the years, and the safeguards before anything is released."
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              tab === t.key
                ? "bg-ink text-parchment"
                : "border border-ink/15 text-ink/60 hover:border-ink/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading || !d ? (
        <Card className="p-6 text-sm text-sage">Loading your inheritance plan…</Card>
      ) : tab === "recipients" ? (
        <RecipientsTab d={d} reload={reload} />
      ) : tab === "verification" ? (
        <VerificationTab d={d} reload={reload} />
      ) : tab === "executors" ? (
        <ExecutorsTab d={d} reload={reload} />
      ) : (
        <AuditTab d={d} />
      )}
    </div>
  );
}

/* ----------------------------- Recipients ------------------------------ */

function RecipientsTab({ d, reload }: { d: inh.InheritanceData; reload: () => Promise<void> }) {
  const [openContact, setOpenContact] = useState<string | null>(null);
  const [openSteward, setOpenSteward] = useState<string | null>(null);
  const [claimLink, setClaimLink] = useState<string | null>(null);

  if (!d.recipients.length) {
    return (
      <EmptyState
        title="No recipients yet"
        body="Add people to your Legacy Circle first — each one becomes a recipient you can set contacts, stewards, and release rules for."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-sage">
        A message binds to a recipient record you own — not to an account — so you can write
        to someone who has no email yet. Add redundant ways to reach them, and a steward who
        can help your message find them if those change over the years.
      </p>

      {d.recipients.map((r) => {
        const contacts = d.contacts.filter((c) => c.beneficiary_id === r.id);
        const stewards = d.stewards.filter((s) => s.beneficiary_id === r.id);
        return (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ink font-display text-lg text-amber-soft">
                  {r.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3 className="font-display text-lg text-ink">{r.name}</h3>
                  <p className="text-sm text-sage">
                    {r.relationship || "Recipient"}
                    {r.claimed_by ? " · account claimed" : " · not yet claimed"}
                  </p>
                </div>
              </div>
              <AgeFloor recipient={r} reload={reload} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink/80">Ways to reach them</span>
                  <button className="text-xs text-clay hover:underline" onClick={() => setOpenContact(r.id)}>
                    + Add
                  </button>
                </div>
                {contacts.length ? (
                  <ul className="space-y-1">
                    {contacts.map((c) => (
                      <li key={c.id} className="flex items-center justify-between text-sm text-ink/80">
                        <span>
                          <span className="text-sage">{c.kind}:</span> {c.value}
                        </span>
                        <button
                          className="text-xs text-clay hover:underline"
                          onClick={async () => {
                            await inh.removeContact(c.id);
                            reload();
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-sage">None yet — add at least one.</p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink/80">Stewards</span>
                  <button className="text-xs text-clay hover:underline" onClick={() => setOpenSteward(r.id)}>
                    + Add
                  </button>
                </div>
                {stewards.length ? (
                  <ul className="space-y-1">
                    {stewards.map((s) => (
                      <li key={s.id} className="flex items-center justify-between text-sm text-ink/80">
                        <span>
                          {s.name} <span className="text-sage">{s.relationship ? `· ${s.relationship}` : ""}</span>
                        </span>
                        <button
                          className="text-xs text-clay hover:underline"
                          onClick={async () => {
                            await inh.removeSteward(s.id);
                            reload();
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-sage">A trusted adult who can help reach them.</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end border-t border-ink/10 pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => setClaimLink(await inh.createClaimLink(r.id))}
              >
                Generate claim invitation link
              </Button>
            </div>
          </Card>
        );
      })}

      {/* Add contact modal */}
      <ContactModal
        open={!!openContact}
        onClose={() => setOpenContact(null)}
        onSave={async (kind, value) => {
          if (openContact) await inh.addContact(openContact, kind, value);
          setOpenContact(null);
          reload();
        }}
      />
      {/* Add steward modal */}
      <StewardModal
        open={!!openSteward}
        onClose={() => setOpenSteward(null)}
        onSave={async (s) => {
          if (openSteward) await inh.addSteward(openSteward, s);
          setOpenSteward(null);
          reload();
        }}
      />
      {/* Claim link modal */}
      <Modal open={!!claimLink} onClose={() => setClaimLink(null)} title="Claim invitation link">
        <p className="text-sm text-ink/70">
          This is the time-limited link a recipient (or their steward) uses to claim what
          you&apos;ve left them. In production it&apos;s sent automatically when a release
          triggers; here you can copy it to test the flow.
        </p>
        <div className="mt-4 break-all rounded-xl bg-ink p-3 text-sm text-parchment">{claimLink}</div>
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              if (claimLink) navigator.clipboard?.writeText(claimLink);
            }}
          >
            Copy link
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AgeFloor({ recipient, reload }: { recipient: inh.Recipient; reload: () => Promise<void> }) {
  const [val, setVal] = useState(recipient.age_floor?.toString() ?? "");
  return (
    <div className="text-right">
      <label className="text-xs text-sage">Age floor</label>
      <div className="mt-1 flex items-center gap-1.5">
        <input
          className={`${inputClass} !w-20 !py-1.5 text-center`}
          value={val}
          onChange={(e) => setVal(e.target.value.replace(/\D/g, ""))}
          placeholder="—"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            await inh.setAgeFloor(recipient.id, val ? Number(val) : null);
            reload();
          }}
        >
          Save
        </Button>
      </div>
      <p className="mt-0.5 text-[11px] text-sage">Nothing releases before this age</p>
    </div>
  );
}

function ContactModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (kind: "email" | "phone", value: string) => void;
}) {
  const [kind, setKind] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Add a way to reach them">
      <div className="space-y-4">
        <div className="inline-flex rounded-full border border-ink/15 bg-parchment/60 p-1">
          {(["email", "phone"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                kind === k ? "bg-ink text-parchment" : "text-ink/60"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <Field label={kind === "email" ? "Email address" : "Phone number"}>
          <input className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => value.trim() && onSave(kind, value.trim())} disabled={!value.trim()}>
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function StewardModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (s: { name: string; relationship: string | null; email: string | null; phone: string | null }) => void;
}) {
  const [name, setName] = useState("");
  const [relationship, setRel] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Add a steward">
      <div className="space-y-4">
        <p className="text-sm text-sage">
          A trusted adult who can help your message find its recipient if their own contacts
          change over the years.
        </p>
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Relationship">
          <input className={inputClass} value={relationship} onChange={(e) => setRel(e.target.value)} placeholder="e.g. Their mother" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              name.trim() &&
              onSave({
                name: name.trim(),
                relationship: relationship.trim() || null,
                email: email.trim() || null,
                phone: phone.trim() || null,
              })
            }
            disabled={!name.trim()}
          >
            Add steward
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ----------------------------- Verification ---------------------------- */

function VerificationTab({ d, reload }: { d: inh.InheritanceData; reload: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const recipientName = (id: string | null) =>
    d.recipients.find((r) => r.id === id)?.name ?? "Whole circle";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="max-w-xl text-sm text-sage">
          Milestones and life events can&apos;t be detected automatically — a trusted party
          confirms them. Life events enter a {inh.GRACE_DAYS}-day grace period before anything
          is released, so nothing goes out by mistake.
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          Raise a verification
        </Button>
      </div>

      {!d.events.length ? (
        <EmptyState
          title="No verifications yet"
          body="When a milestone or life event occurs, raise it here to begin the confirmed-release process."
        />
      ) : (
        <ul className="space-y-2.5">
          {d.events.map((e) => (
            <li key={e.id}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Tag>{e.trigger_kind === "life_event" ? "Life event" : "Milestone"}</Tag>
                      <StatusPill status={e.status} />
                    </div>
                    <h3 className="mt-1.5 font-display text-lg text-ink">
                      {e.description || "(no description)"}
                    </h3>
                    <p className="text-sm text-sage">
                      For {recipientName(e.beneficiary_id)} · raised {formatDate(e.created_at)}
                      {e.grace_until && (e.status === "grace") ? (
                        <> · grace ends {formatDate(e.grace_until)}</>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-1">
                  {(e.status === "pending" || e.status === "grace") && (
                    <>
                      <Button size="sm" variant="outline" onClick={async () => { await inh.confirmEvent(e.id, e.description || ""); reload(); }}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => { await inh.disputeEvent(e.id, e.description || ""); reload(); }}>
                        Dispute
                      </Button>
                      <Button size="sm" variant="danger" onClick={async () => { await inh.cancelEvent(e.id, e.description || ""); reload(); }}>
                        Cancel
                      </Button>
                    </>
                  )}
                  {e.status === "confirmed" && (
                    <Button size="sm" onClick={async () => { await inh.releaseEvent(e.id, e.description || ""); reload(); }}>
                      Release content
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <RaiseModal
        open={open}
        recipients={d.recipients}
        onClose={() => setOpen(false)}
        onSave={async (bId, kind, desc) => {
          await inh.raiseEvent(bId, kind, desc);
          setOpen(false);
          reload();
        }}
      />
    </div>
  );
}

function RaiseModal({
  open,
  recipients,
  onClose,
  onSave,
}: {
  open: boolean;
  recipients: inh.Recipient[];
  onClose: () => void;
  onSave: (bId: string | null, kind: "milestone" | "life_event", desc: string) => void;
}) {
  const [bId, setBId] = useState<string>("");
  const [kind, setKind] = useState<"milestone" | "life_event">("milestone");
  const [desc, setDesc] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Raise a verification">
      <div className="space-y-4">
        <Field label="Type">
          <div className="inline-flex rounded-full border border-ink/15 bg-parchment/60 p-1">
            {(["milestone", "life_event"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  kind === k ? "bg-ink text-parchment" : "text-ink/60"
                }`}
              >
                {k === "life_event" ? "Life event" : "Milestone"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Recipient">
          <select className={inputClass} value={bId} onChange={(e) => setBId(e.target.value)}>
            <option value="">Whole circle</option>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="What happened?"
          hint={kind === "life_event" ? `A ${inh.GRACE_DAYS}-day grace period will apply.` : undefined}
        >
          <input
            className={inputClass}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={kind === "life_event" ? "e.g. Passing confirmed by executor" : "e.g. Graduated university"}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => desc.trim() && onSave(bId || null, kind, desc.trim())} disabled={!desc.trim()}>
            Raise
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------ Executors ------------------------------ */

function ExecutorsTab({ d, reload }: { d: inh.InheritanceData; reload: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRel] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="max-w-xl text-sm text-sage">
          Executors are the people you trust to confirm a life event and oversee release when
          you can&apos;t. Name at least one.
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          Add executor
        </Button>
      </div>

      {!d.executors.length ? (
        <EmptyState title="No executors yet" body="Add a trusted person to confirm life-event triggers on your behalf." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {d.executors.map((e) => (
            <Card key={e.id} className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-display text-lg text-ink">{e.name}</h3>
                <p className="text-sm text-sage">
                  {e.relationship || "Executor"} {e.email ? `· ${e.email}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={e.status} />
                <button
                  className="text-sm text-clay hover:underline"
                  onClick={async () => {
                    await inh.removeExecutor(e.id);
                    reload();
                  }}
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add an executor">
        <div className="space-y-4">
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Relationship">
            <input className={inputClass} value={relationship} onChange={(e) => setRel(e.target.value)} placeholder="e.g. Spouse, lawyer" />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!name.trim()) return;
                await inh.addExecutor({
                  name: name.trim(),
                  relationship: relationship.trim() || null,
                  email: email.trim() || null,
                });
                setName("");
                setRel("");
                setEmail("");
                setOpen(false);
                reload();
              }}
              disabled={!name.trim()}
            >
              Add executor
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* -------------------------------- Audit -------------------------------- */

function AuditTab({ d }: { d: inh.InheritanceData }) {
  if (!d.audit.length) {
    return <EmptyState title="No activity yet" body="Inheritance actions — verifications, releases, invitations — are logged here for an auditable trail." />;
  }
  return (
    <Card className="divide-y divide-ink/10 p-0">
      {d.audit.map((a) => (
        <div key={a.id} className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-ink/80">{a.action}</span>
          <span className="text-xs text-sage">
            {a.actor} · {formatDate(a.created_at)}
          </span>
        </div>
      ))}
    </Card>
  );
}
