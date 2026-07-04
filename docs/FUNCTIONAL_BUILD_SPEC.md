# Amber — Functional Build Specification

A complete, no-omission breakdown of every module, feature, function, linkage, and
process described in the concept document (v1.0), each mapped to a concrete build unit
and status.

**Status legend**
- ✅ **Built** — implemented and working in the current web app.
- 🟡 **Staged** — buildable now in software; scheduled in the build sequence (Part 12).
- 🔵 **Scaffold** — depends on a specialist/regulated external service; function is defined
  and an integration point is exposed, but it is not fully implemented in-app.

---

## Part 1 — The ten modules (Product Overview §5)

| # | Module | Function | Status |
|---|--------|----------|--------|
| 1 | **Amber Vault** | Secure storage for voice, video, photos, documents, letters, journals, memories. | ✅ |
| 2 | **Amber Timeline** | Chronological life story auto-built from preserved content. | ✅ |
| 3 | **Amber Messenger** | Scheduled messages for birthdays, graduations, weddings, anniversaries, milestones. | ✅ |
| 4 | **Amber AI** | AI interaction grounded exclusively in the creator's recorded legacy. | 🟡 UI / 🔵 grounding |
| 5 | **Amber Guardian** | Ethical + safety engine governing every AI interaction. | 🟡 |
| 6 | **Amber Family Tree** | Living, expandable multi-generational family history. | 🟡 |
| 7 | **Amber Books** | AI-assisted biographies/memoirs/family-history books from content. | 🔵 |
| 8 | **Amber Time Capsule** | Content locked until a future date or triggering event. | 🟡 (rules exist ✅) |
| 9 | **Amber Executor** | Digital inheritance management + beneficiary access administration. | 🟡 (this stage) |
| 10 | **Amber Memories** | AI-organized collections of photos/videos/stories by theme/date/person. | 🟡 |

---

## Part 2 — Roles & permissions (Functional Req §9.1, IA §16)

Four role types. A single account may hold different roles across different circles
(you are Creator of your own vault and possibly Beneficiary of your parent's).

| Role | Can do | Cannot do |
|------|--------|-----------|
| **Creator** | Create/edit/archive content; define Legacy Circle & recipients; set release rules; assign executors; opt content into AI; grant voice-clone consent. | See other families' data. |
| **Beneficiary** | Claim invitation; verify identity; view *released* content only; use AI Assistant on released content; request a Book; confirm milestones assigned to them. | See unreleased/sealed content; edit creator content; see other beneficiaries' private items. |
| **Executor** | Confirm life-event triggers; view executor dashboard (trigger/verification status, audit log); initiate release within grace-period rules. | Read content bodies (unless also a beneficiary); alter creator content. |
| **Advisor** (Family Office) | Manage multiple client legacies; access compliance/audit tools; dedicated support. | Read private content bodies without explicit grant; cross-client data mixing. |

**Functions:** `assignRole`, `switchRoleContext`, role-based route guards, permission matrix
enforced at the data layer (row-level security) and UI layer.

---

## Part 3 — Functional requirements, function by function (§9)

### 3.1 Account & Identity (§9.1)
- `registerEmailPhone` — registration with email/phone. ✅ (email; phone 🟡)
- `enableMFA` — multi-factor auth, biometric on supported devices. 🔵 (Supabase MFA + WebAuthn)
- `verifyIdentity(creator|beneficiary)` — identity verification. 🔵 (KYC provider integration point)
- `assignRole` — Creator/Beneficiary/Executor/Advisor. 🟡 (this stage)

### 3.2 Content Capture & Management (§9.2)
- `recordAudio` / `recordVideo` — in-app capture. ✅ audio / 🟡 video capture
- `uploadMedia(voice|video|photo|document)` — upload. ✅
- `writeLetter` — text composer. ✅
- `guidedPrompt` — prompts/templates for letters, advice, milestone messages. ✅
- `autoTranscribe` — automatic transcription of audio/video. 🔵 (speech-to-text service)
- `tagAndCategorize` — tagging + categorization. ✅ (tags) / 🟡 (categories)
- `editContent` / `replaceContent` / `archiveContent`. 🟡 (delete ✅; edit/replace/archive next)

### 3.3 Access Rules & Scheduling (§9.3, §15)
- `createReleaseRule(trigger_type, trigger_value)` — rules engine. ✅ immediate/date/milestone; 🟡 life-event (this stage)
- `multiLevelApproval` — approval workflow for sensitive/high-value content. 🟡
- `overrideEmergencyAccess` — via Executor. 🟡 (this stage)

### 3.4 AI Interaction (§9.4, §11, §19)
- `groundedAnswer(query)` — response from creator's content only. 🔵 (retrieval index + LLM)
- `guardianReview(response)` — mandatory safety routing. 🟡 (labeling + checks) / 🔵 (model safety)
- `labelAIContent` / `citeSources` — distinguish AI from originals; cite recordings. 🟡

### 3.5 Notifications & Communication (§9.5)
- `contributionReminder` — prompt creators to add content. 🟡
- `deliveryNotification` — notify beneficiaries on release. 🟡 (this stage: claim invite) / 🔵 (email/SMS send)
- `executorStatusUpdate` — updates for executors/admins. 🟡 (this stage)

---

## Part 4 — Core features (§10) → functions

| Feature | Functions | Status |
|---------|-----------|--------|
| Legacy Vault | capture, upload, tag, search, filter, edit, archive, detail view | ✅ (+edit/archive 🟡) |
| Guided Prompts | prompt library, category rotation, prompt→compose | ✅ |
| Milestone Messenger | composer, calendar view, statuses (Draft/Scheduled/Delivered), 4 trigger types | ✅ (+calendar & life-event 🟡) |
| Digital Timeline | auto-generated chronological view, past + upcoming nodes | ✅ |
| Family Tree Builder | add person nodes, relationships, link content to nodes, visual view | 🟡 |
| AI Legacy Assistant | grounded chat, source citations, empty state | 🟡/🔵 |
| AI Legacy Guardian | grounding check, age-appropriateness, harm block, sensitive-topic softening, audit log | 🟡/🔵 |
| Time Capsule | lock content to future date/event, sealed-until display, unlock on trigger | 🟡 |
| Digital Executor Tools | trigger conditions, verification steps, beneficiary access states, release audit log | 🟡 (this stage) |
| Amber Books | compile memoir/biography from content, order/print | 🔵 |

---

## Part 5 — Digital Inheritance & Access Rules (§15) — the reconciliation core

This is the product spine and the first code stage.

### 5.1 Release triggers
- **Immediate** — available to the recipient as soon as claimed. ✅
- **Scheduled Date** — released on a calendar date (auto). ✅
- **Milestone Event** — released on confirmation of an event (graduation/wedding). ✅ create; 🟡 confirm-by-party
- **Life Event** — released after verified incapacitation/passing via multi-party process. 🟡 (this stage)

### 5.2 Recipient model (from the sender→receiver discussion)
A message binds to a **Recipient record the creator owns**, not to an existing account:
- `Recipient` — name, relationship, age floor, optional birthday.
- `RecipientContact[]` — redundant channels (email, phone) for reaching them across decades.
- `Steward` — a trusted adult who helps the message find the recipient if channels go stale.
- Messages attach to the recipient record, so a creator can write to a one-year-old today.

Functions: `addRecipient`, `addRecipientContact`, `addSteward`, `attachContentToRecipient`.

### 5.3 Verification & safeguards
- `nominateVerifier` — designate trusted contacts / legal executor. 🟡 (this stage)
- `raiseVerificationEvent(trigger)` — a party asserts a life event/milestone occurred. 🟡
- `gracePeriod` — mandatory waiting window with creator ping before irreversible release. 🟡
- `disputeResolution` — challenge a pending release during the grace period. 🟡
- `proofOfLife` — periodic creator check-in; prolonged silence escalates to executor. 🟡
- `legalDocIntegration` — optional estate-document linkage. 🔵

### 5.4 Beneficiary claim / reconciliation flow (Journey B, §8)
1. Trigger fires → `raiseVerificationEvent` (date auto / milestone or life-event confirmed).
2. `sendClaimInvitation` — secure, time-limited invite across all recipient contacts + steward. 🟡 (link now / 🔵 email-SMS send)
3. `claimAccount` — beneficiary verifies identity and creates/links their account. 🟡
4. `reconcile` — pending items bind from the recipient record into the beneficiary account. 🟡
5. `empatheticReveal` — paced, contextual presentation ("A letter from your father, written on your 5th birthday, for your wedding day"). 🟡

---

## Part 6 — AI Legacy Assistant & Guardian (§11–13, §19–20)

### 6.1 Assistant (Amber AI)
- Trained/grounded **only** on the specific creator's consented content; no internet, no
  cross-family data. `buildPrivateIndex(creatorId)` 🔵, `groundedAnswer` 🔵.
- Capabilities: answer from recorded content; surface relevant memories/letters; synthesize
  thematic answers ("What did Dad believe about hard work?"); distinguish quotes from summaries.
- Boundaries: never fabricate opinions/memories; never simulate a living person without
  persistent AI labeling; decline out-of-scope questions rather than guess.

### 6.2 Guardian (Amber Guardian) — every response routed through it
- `verifyGrounding` — response tied to real content, nothing invented. 🟡 checks / 🔵 model
- `screenAgeAppropriate(beneficiaryProfile)`. 🟡
- `blockHarmful` — harmful/manipulative/exploitative outputs. 🟡/🔵
- `softenSensitive` — grief/illness/conflict flagged for supportive framing. 🟡
- `auditLog` — auditable AI-interaction log for admins/compliance. 🟡

### 6.3 Safety & Ethics pillars (§13)
Authenticity (bounded to recordings) · Consent (per-item AI opt-in, exclude specific items) ·
Protection (Guardian, extra safeguards for minors & grieving users) · Transparency (label AI,
always expose the original recording).
Functions: `setAIConsent(itemId, bool)`, `excludeFromAI(itemId)`.

### 6.4 Voice Cloning (§20) — 🔵 consent-gated, specialist
- `grantVoiceCloneConsent` — explicit, separate, revocable, distinct from storage consent.
- Clone narrates **only** the creator's own words; persistent "synthetic" disclosure to listener.
- Beneficiary can disable cloned playback; highest-tier encryption; excluded from external training.

---

## Part 7 — Security & Privacy (§14)
- End-to-end encryption for all content. 🔵 (app-layer/E2E) / ✅ (at-rest via Storage + RLS)
- MFA all account types + biometric. 🔵
- Zero-knowledge option for highly sensitive content. 🔵
- Role-based access control. 🟡 (this stage) / ✅ (RLS per-user)
- Independent audits + pen testing (process). 🔵
- Geo-redundant encrypted backups. 🔵 (infra)
- Compliance: NDPR (Nigeria), GDPR (international). 🔵 (process) + `dataExport`/`dataDelete` 🟡

---

## Part 8 — Information Architecture & screens (§16–17)

Three contexts (Creator / Beneficiary / Family Administration), each with tailored nav.

| Top-level area | Sections | Status |
|----------------|----------|--------|
| Home / Dashboard | recent activity, prompts, upcoming releases | ✅ |
| Vault | voice/video/photo/doc/letter/journal | ✅ (+journal 🟡) |
| Timeline | chronological life story | ✅ |
| Messenger | scheduled & milestone messages, calendar, composer | ✅ (+calendar 🟡) |
| Family Tree | multi-generational structure | 🟡 |
| AI Legacy Assistant | grounded chat, citations, empty state (beneficiary view) | 🟡 |
| Executor & Inheritance | recipients, rules, triggers, verification status, audit log | 🟡 (this stage) |
| Settings & Security | account, privacy, encryption, subscription, consent | ✅ (+consent/MFA 🟡) |

Named screens: Onboarding flow ✅ · Vault screen ✅ · Messenger screen ✅ (+calendar) ·
AI Assistant (beneficiary) 🟡 · Executor dashboard 🟡 (this stage).

---

## Part 9 — Technical & AI architecture (§18–19)
- Front end: web app ✅ (native iOS/Android 🔵).
- Backend services: identity, content storage, scheduling/rules engine, notifications, AI
  orchestration. ✅ (Supabase as backend) / 🟡 (rules engine expansion) / 🔵 (AI orchestration).
- Encrypted object storage + geo replication. ✅ (Storage) / 🔵 (geo-redundancy).
- Rules & Scheduling engine: triggers, verification workflows, access logic. 🟡 (this stage).
- AI orchestration: per-user context, approved-content retrieval, Guardian routing. 🔵.
- Observability: logging/monitoring/anomaly detection. 🔵.

---

## Part 10 — Data model (§21) — full entity list

| Entity | Key attributes | Status |
|--------|----------------|--------|
| User | user_id, role, profile, auth credentials | ✅ (profiles) |
| LegacyCircle | circle_id, creator_id, beneficiary_ids, relationship types | 🟡 |
| Recipient (+Contact, +Steward) | reconciliation model (Part 5.2) | 🟡 (this stage) |
| ContentItem | item_id, type, tags, transcript, ai_consent_flag | ✅ (+ai_consent 🟡) |
| ReleaseRule | rule_id, content_id, trigger_type, trigger_value, status | 🟡 (messages ≈ rules ✅) |
| VerificationEvent | event_id, trigger_id, verifying_party, status, timestamp | 🟡 (this stage) |
| AIInteractionLog | log_id, beneficiary_id, query, sources_used, guardian_review_status | 🟡 |
| FamilyTreeNode | node_id, person details, relationships, linked content_items | 🟡 |

Full SQL for every entity is in `supabase/schema-full.sql`.

---

## Part 11 — Business, plans, GTM (§23–27) — product functions
- Subscription tiers: Starter / Family / Legacy Plus / Advisor. `enforcePlanLimits`, `upgradePlan`. 🟡
- One-time: Amber Books purchase/print. 🔵
- Add-ons: voice-clone credits, expedited verification, extra storage. 🟡 (metering) / 🔵 (services)
- KPIs (§30): monthly active creators, items/user, beneficiary activation rate, retention/churn,
  Guardian intervention rate, NPS. `analyticsEvents` 🟡.

---

## Part 12 — Build sequence (what's next, in order)

1. **Inheritance & Reconciliation core + Roles** ← *this stage* (Parts 2, 5; schema).
2. **Family Tree Builder** (nodes, relationships, link content).
3. **Time Capsule UI + Messenger calendar view** (surface existing rules; life-event trigger UI).
4. **AI Legacy Assistant (beneficiary view) + Guardian labeling** (grounded prompt scaffold; wire to creator's content; source citations; audit log). Real grounding needs the retrieval index + LLM key.
5. **Amber Memories** (auto-collections by theme/date/person).
6. **Content lifecycle** (edit/replace/archive; categories; journals).
7. **Subscriptions & plan gating**; **Notifications/reminders**.
8. **Security/consent surface** (per-item AI consent, voice-clone consent gate, MFA, data export/delete).
9. **Specialist scaffolds** (KYC identity, transcription, E2E/zero-knowledge, Books, voice cloning, native apps) — integration points + provider selection.

---

## Part 13 — Explicitly deferred / specialist (not faked)
Voice cloning · real identity/KYC verification · automatic transcription (STT) · end-to-end /
zero-knowledge encryption · geo-redundant backup infra · native iOS/Android apps · legal estate
integration · independent security audits · outbound email/SMS delivery at scale. Each is defined
above with an integration point; none is stubbed as if complete.
