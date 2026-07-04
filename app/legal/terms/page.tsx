import { LegalDoc, LegalSection } from "@/components/legal-doc";

export const metadata = { title: "Terms of Service — Amber" };

const sections: LegalSection[] = [
  {
    h: "1. Acceptance",
    p: [
      "By creating an account or using Amber (the \"Service\"), you agree to these Terms of Service and to our Privacy Policy. If you do not agree, please do not use the Service.",
    ],
  },
  {
    h: "2. What Amber is",
    p: [
      "Amber is a digital legacy tool that lets you preserve voice recordings, letters, photos, videos, and documents, organise them, and schedule them to be shared with people you choose — on a date, at a milestone, or on a verified life event.",
      "Amber is a tool to help you share your legacy. It is not a law firm and does not provide legal, financial, or medical advice.",
    ],
  },
  {
    h: "3. Eligibility",
    p: [
      "You must be at least 18 years old, or the age of legal majority in your jurisdiction, to hold an Amber account. By using the Service you confirm that you meet this requirement.",
    ],
  },
  {
    h: "4. Your account",
    p: [
      "You are responsible for keeping your login credentials secure and for activity that happens under your account. Tell us promptly if you suspect unauthorised access.",
    ],
  },
  {
    h: "5. Your content and ownership",
    p: [
      "You own the content you create in Amber. You grant us a limited licence to store, process, and deliver it solely to operate the Service for you — for example, to save a recording, generate an assistant response from content you have permitted, or deliver a scheduled message.",
      "You are responsible for the content you upload and confirm that you have the rights to it and that it does not break the law or these terms.",
    ],
  },
  {
    h: "6. People you add",
    p: [
      "When you add people to your Legacy Circle or designate recipients, stewards, or executors, you confirm that you may lawfully provide their information and involve them in this way. Keep their contact details accurate so that any future release can reach them.",
    ],
  },
  {
    h: "7. Scheduled delivery and inheritance — important limits",
    p: [
      "Amber's scheduling, inheritance, and release features are provided on a best-effort basis. They are not a will, trust, or other legal instrument, and they do not replace proper estate planning with a qualified professional.",
      "We do not guarantee that a message will be delivered at an exact time, that a recipient's contact details will still be valid years from now, or that a life-event trigger will operate as intended. You are responsible for keeping recipients, stewards, and executors informed and up to date, and for making separate legal arrangements for anything that must be legally binding.",
    ],
  },
  {
    h: "8. AI features",
    p: [
      "AI features generate responses from the content you have permitted, and are reviewed by a safety layer before display. They can still be inaccurate or incomplete and should not be relied on as fact or as professional advice.",
    ],
  },
  {
    h: "9. Acceptable use",
    p: [
      "Do not use Amber to store or share unlawful content, to infringe others' rights, to harass or harm anyone, or to attempt to breach the security of the Service. We may suspend or remove content or accounts that violate these terms.",
    ],
  },
  {
    h: "10. Availability and changes",
    p: [
      "The Service is provided \"as is\" and \"as available\". We may add, change, or discontinue features, and we may perform maintenance that temporarily affects availability. We will give reasonable notice of significant changes where we can.",
    ],
  },
  {
    h: "11. Disclaimers and limitation of liability",
    p: [
      "To the fullest extent permitted by law, Amber is provided without warranties of any kind, and we are not liable for indirect, incidental, or consequential losses, or for any failure or delay in delivering scheduled content. Nothing in these terms limits liability that cannot be limited by law.",
    ],
  },
  {
    h: "12. Termination",
    p: [
      "You may stop using Amber and delete your account at any time. We may suspend or end access if these terms are breached. On deletion, your content is removed from active systems and from backups on a rolling basis.",
    ],
  },
  {
    h: "13. Governing law and changes",
    p: [
      "These terms are governed by the laws of the jurisdiction stated in our final published terms. We may update these terms as Amber develops and will communicate material changes in-app or by email.",
      "Questions about these terms can be sent to privacy@theamberapp.com.",
    ],
  },
];

export default function Terms() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated="July 2026"
      intro="These terms set out the agreement between you and Amber. We've written them in plain language, but a few points — especially about scheduled delivery and inheritance — matter a great deal, so please read section 7 carefully."
      sections={sections}
    />
  );
}
