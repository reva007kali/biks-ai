import { useState } from "react";
import HeroStep from "./pages/HeroStep";
import DashboardStep from "./pages/DashboardStep";
import AccountsStep from "./pages/AccountsStep";
import BriefStep from "./pages/BriefStep";
import Navbar from "./components/Navbar";

export interface BusinessProfile {
  companyName: string;
  website: string;
  summary: string;
  valueProposition: string;
  valuePropositions?: {
    valueLabel: string;
    valueCopy: string;
    websiteCopy?: string;
  }[];
  currentSegments: string[];
  customerSegments?: {
    segmentLabel: string;
    segmentDescription?: string;
    clientNames: string[];
    websiteCopy?: string;
  }[];
  products: string[];
  proofPoints: string[];
  expansionCategories: ExpansionCategory[];
}

export interface ExpansionCategory {
  name: string;
  whyRelevant: string;
  salesAngle: string;
  painPoints: string[];
  searchQueries: string[];
}

export interface Lead {
  name: string;
  url: string;
  summary: string;
  highlights: string[];
  fitScore: number;
  category: string;
  city: string;
  status: "pending" | "accepted" | "rejected";
  rejectionReason?: string;
  email?: string | null;
  linkedinUrl?: string | null;
}

export interface MemoryItem {
  id: string;
  text: string;
}

export interface Contact {
  name: string;
  title: string;
  linkedinUrl: string;
  source: string;
  verificationStatus?: string;
}

export interface MeetingBrief {
  accountBrief: string;
  fitRationale: string;
  meetingPrep: string;
  discoveryQuestions: string[];
  objectionsAndResponses: { objection: string; response: string }[];
  outreachEmailSubject: string;
  outreachEmailBody: string;
  memoriesUsed: string[];
}

export interface SalesKit {
  accountBrief: string;
  whyRelevantNow: string;
  synergies: { sellerProduct: string; prospectPain: string; evidence: string }[];
  suggestedAngle: string;
  outreachEmailSubject: string;
  outreachEmailBody: string;
  solutions: { title: string; description: string }[];
  whyThisProspect: string[];
  proofStats: { number: string; label: string }[];
  memoriesUsed: string[];
}

export interface ReviewAnalysis {
  reviews: { text: string; rating: number; source: string; sentiment: string }[];
  painPoints: { issue: string; frequency: string; severity: string; evidence: string }[];
  solutionMapping: { painPoint: string; ourSolution: string; talkingPoint: string }[];
  summary: string;
}

function App() {
  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [brief, setBrief] = useState<MeetingBrief | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [salesKit, setSalesKit] = useState<SalesKit | null>(null);
  const [reviewAnalysis, setReviewAnalysis] = useState<ReviewAnalysis | null>(null);
  const [initialCategory, setInitialCategory] = useState(0);

  // Forward progression: advance and remember the furthest step reached.
  const goToStep = (newStep: number) => {
    setStep(newStep);
    setMaxStepReached((prev) => Math.max(prev, newStep));
  };

  // Only allow navigating to a step the user has already reached AND whose
  // required state still exists — never open a blank/invalid view.
  const canNavigateToStep = (targetStep: number) => {
    if (targetStep > maxStepReached) return false;
    if (targetStep === 2) return !!business;
    if (targetStep === 3) return !!business;
    if (targetStep === 4) return !!business && !!selectedLead;
    return false;
  };

  const handleStepClick = (targetStep: number) => {
    if (canNavigateToStep(targetStep)) {
      setStep(targetStep);
    }
  };

  const handleReset = () => {
    setStep(1);
    setMaxStepReached(1);
    setBusiness(null);
    setMemories([]);
    setLeads([]);
    setSelectedLead(null);
    setBrief(null);
    setContacts([]);
    setSalesKit(null);
    setReviewAnalysis(null);
    setInitialCategory(0);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {step > 1 && (
        <Navbar
          currentStep={step}
          maxStepReached={maxStepReached}
          canNavigateToStep={canNavigateToStep}
          onStepClick={handleStepClick}
          onReset={handleReset}
          website={business?.website || ""}
        />
      )}
      {step === 1 && (
        <HeroStep
          onComplete={(data) => { setBusiness(data); goToStep(2); }}
        />
      )}
      {step === 2 && business && (
        <DashboardStep
          business={business}
          memories={memories}
          setMemories={setMemories}
          onSelectCategory={(i) => { setInitialCategory(i); goToStep(3); }}
        />
      )}
      {step === 3 && business && (
        <AccountsStep
          business={business}
          memories={memories}
          setMemories={setMemories}
          leads={leads}
          setLeads={setLeads}
          contacts={contacts}
          setContacts={setContacts}
          onSelectLead={(lead) => { setSelectedLead(lead); setContacts([]); setBrief(null); setSalesKit(null); setReviewAnalysis(null); goToStep(4); }}
          onBack={() => setStep(2)}
          initialCategory={initialCategory}
        />
      )}
      {step === 4 && business && selectedLead && (
        <BriefStep
          business={business}
          lead={selectedLead}
          memories={memories}
          brief={brief}
          setBrief={setBrief}
          contacts={contacts}
          setContacts={setContacts}
          salesKit={salesKit}
          setSalesKit={setSalesKit}
          reviewAnalysis={reviewAnalysis}
          setReviewAnalysis={setReviewAnalysis}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  );
}

export default App;
