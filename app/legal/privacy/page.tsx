import { LegalDoc, LegalSection } from "@/components/legal-doc";

export const metadata = { title: "Privacy Policy — Amber" };

const sections: LegalSection[] = [
  {
    h: "1. Who this applies to",
    p: [
      "This policy explains how Amber (\"we\", \"us\") collects, uses, stores, and protects personal information when you use the Amber app and website at theamberapp.com (the \"Service\"). It applies to account holders and to the people whose details an account holder adds.",
    ],
  },
  {
    h: "2. Information we collect",
    p: [
      "Account information: your email address and password credentials (passwords are handled by our authentication provider and are never stored by us in plain text).",
      "Profile information: your name and, if you choose to add one, a profile photo.",
      "Content you create: voice recordings, written letters, notes, photos, videos, documents, transcripts, tags, and the titles you give them.",
      "People you add to your Legacy Circle: their names, relationships to you, and any email address, date of birth, photo, or notes you provide about them.",
      "Scheduling and inheritance information: release dates, milestones, recipients, stewards, executors, and related settings.",
      "Technical information: basic device, log, and usage data needed to operate and secure the Service.",
    ],
  },
  {
    h: "3. How we use your information",
    p: [
      "To provide the Service: to store your content securely, organise it, and deliver messages according to the schedules and rules you set.",
      "To power features you turn on: for example, the Legacy Assistant and memoir tools, which draw only on the content you have marked for AI use.",
      "To keep the Service secure, prevent abuse, and comply with law.",
      "To communicate with you about your account, such as confirmation and security emails.",
      "We do not sell your personal information, and we do not use your private content to train third-party AI models.",
    ],
  },
  {
    h: "4. AI processing",
    p: [
      "When you use Amber's AI features, the specific content you have consented to (per item) is sent to our AI provider, Anthropic, to generate a response grounded in that content. You control this consent for each memory and can turn it off at any time.",
      "AI responses are generated from your own preserved content and are reviewed by a safety layer before display. They may still contain errors and are not a substitute for professional advice.",
    ],
  },
  {
    h: "5. Storage, security, and location",
    p: [
      "Your content is stored using our infrastructure providers (including Supabase for the database and file storage, and Vercel for hosting). Media files are kept in private storage and served through short-lived, signed links.",
      "Data is encrypted in transit, and access controls restrict each account's data to that account. No method of storage or transmission is perfectly secure, but we work to protect your information using industry-standard measures.",
    ],
  },
  {
    h: "6. Information about other people",
    p: [
      "When you add someone to your Legacy Circle or name a recipient, steward, or executor, you provide personal information about them. You are responsible for ensuring you have a lawful basis to share that information and, where appropriate, for informing them.",
      "If you are ever asked to, we will help a named person understand what information is held about them and how to request its removal.",
    ],
  },
  {
    h: "7. Sharing and disclosure",
    p: [
      "We share information only with service providers who help us run Amber (hosting, storage, email delivery, and AI processing), under agreements that limit their use of it.",
      "We may disclose information if required by law, or to protect the rights, safety, and security of users and the public.",
      "Where you have set up a release, content is disclosed to the recipients you designate, according to the triggers and verification steps you configure.",
    ],
  },
  {
    h: "8. Your rights",
    p: [
      "Depending on where you live, you may have rights to access, correct, export, or delete your personal information, and to withdraw consent. You can edit or delete most information directly in the app, and you can delete your account from Settings.",
      "To exercise any right that isn't available in-app, contact us at privacy@theamberapp.com.",
    ],
  },
  {
    h: "9. Release on death or incapacity",
    p: [
      "Amber lets you plan for content to be released to others upon a future date, a milestone, or a verified life event, optionally involving an executor and a waiting period. These features are tools to help you share your legacy; they are not a legal will and do not replace formal estate planning. See our Terms of Service for more.",
    ],
  },
  {
    h: "10. Children",
    p: [
      "The Service is intended for adults. You must be old enough to form a binding contract in your jurisdiction (generally 18) to hold an account. Do not create an account for a child.",
      "You may add information about children to your Legacy Circle (for example, a young grandchild). You are responsible for that information, and we treat it with particular care.",
    ],
  },
  {
    h: "11. Retention",
    p: [
      "We keep your information for as long as your account is active or as needed to provide the Service and meet legal obligations. When you delete content or your account, we remove it from active systems and from backups on a rolling basis.",
    ],
  },
  {
    h: "12. Changes and contact",
    p: [
      "We may update this policy as Amber develops. Material changes will be communicated in-app or by email.",
      "For any privacy question or request, contact privacy@theamberapp.com.",
    ],
  },
];

export default function Privacy() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated="July 2026"
      intro="Amber exists to help you preserve deeply personal things — your voice, your words, and messages for the people you love. We take the responsibility that comes with that seriously. This policy explains, in plain language, what we collect and how we handle it."
      sections={sections}
    />
  );
}
