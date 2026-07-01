export type Severity = "mild" | "moderate" | "severe"
export type Urgency = "self-care" | "appointment" | "urgent" | "emergency"

export interface SymptomInfo {
  id: string
  label: string
  bodyPart: string
  severityWeights: Record<Severity, number>
  possibleConditions: Record<Severity, string[]>
  redFlags: string[]
  followUp: FollowUpQuestion[]
  selfCare: string
  seeDoctor: string
}

export interface FollowUpQuestion {
  id: string
  question: string
  options: string[]
}

export interface FollowUpAnswer {
  questionId: string
  answer: string
}

export interface TriageInput {
  symptomIds: string[]
  customSymptoms: string[]
  description: string
  duration: string
  severity: Severity
  followUpAnswers: FollowUpAnswer[]
}

export interface TriageResult {
  urgency: Urgency
  possibleConditions: string[]
  recommendation: string
  bodyPartsInvolved: string[]
  redFlagsDetected: string[]
  suggestedMedication?: string
  disclaimer: string
  whenToWorry: string
  selfCare: string
}

const symptomDB: Record<string, SymptomInfo> = {
  headache: {
    id: "headache",
    label: "Headache",
    bodyPart: "head",
    severityWeights: { mild: 1, moderate: 4, severe: 8 },
    possibleConditions: {
      mild: ["Tension headache", "Eye strain", "Dehydration", "Sinus congestion"],
      moderate: ["Migraine", "Cluster headache", "Sinusitis", "Cervicogenic headache"],
      severe: ["Migraine with aura", "Meningitis", "Subarachnoid hemorrhage", "Temporal arteritis"],
    },
    redFlags: ["Worst headache of your life", "Headache after head injury", "Headache with stiff neck and fever", "Sudden thunderclap headache"],
    followUp: [
      { id: "headache-location", question: "Where is the pain?", options: ["One side of head", "Both sides", "Behind eyes", "All over", "Front of head"] },
      { id: "headache-type", question: "What type of pain?", options: ["Throbbing/pulsing", "Sharp/stabbing", "Dull/aching", "Tightness/pressure"] },
    ],
    selfCare: "Rest in a dark, quiet room. Apply a cold compress to your forehead. Stay hydrated. Limit screen time.",
    seeDoctor: "If headaches persist more than 3 days, worsen, or interfere with daily activities.",
  },
  fever: {
    id: "fever",
    label: "Fever",
    bodyPart: "whole-body",
    severityWeights: { mild: 2, moderate: 5, severe: 9 },
    possibleConditions: {
      mild: ["Viral infection", "Common cold", "Mild flu"],
      moderate: ["Influenza", "Bacterial infection", "COVID-19", "Urinary tract infection"],
      severe: ["Sepsis", "Pneumonia", "Meningitis", "Severe bacterial infection"],
    },
    redFlags: ["Fever above 40°C (104°F)", "Fever lasting more than 3 days", "Fever with stiff neck", "Fever with difficulty breathing"],
    followUp: [
      { id: "fever-temp", question: "Temperature range?", options: ["Below 38°C (100.4°F)", "38-39°C (100.4-102.2°F)", "Above 39°C (102.2°F)", "Don't know"] },
      { id: "fever-duration-days", question: "How long has the fever lasted?", options: ["Less than 24 hours", "1-2 days", "3+ days", "On and off for weeks"] },
    ],
    selfCare: "Rest and stay hydrated. Take paracetamol for discomfort. Monitor temperature every 4-6 hours.",
    seeDoctor: "If fever exceeds 40°C, lasts more than 3 days, or is accompanied by severe symptoms.",
  },
  cough: {
    id: "cough",
    label: "Cough",
    bodyPart: "chest",
    severityWeights: { mild: 1, moderate: 3, severe: 6 },
    possibleConditions: {
      mild: ["Common cold", "Post-nasal drip", "Mild allergy", "Dry air irritation"],
      moderate: ["Bronchitis", "Influenza", "COVID-19", "Allergic cough", "Asthma"],
      severe: ["Pneumonia", "Whooping cough", "Tuberculosis", "Pulmonary embolism"],
    },
    redFlags: ["Coughing up blood", "Difficulty breathing", "Wheezing", "Chest pain when coughing", "Cough lasting more than 3 weeks"],
    followUp: [
      { id: "cough-type", question: "What kind of cough?", options: ["Dry/hacking", "Productive (phlegm)", "Barking", "Wheezing"] },
      { id: "cough-timing", question: "When is it worse?", options: ["At night", "Morning only", "After exercise", "Throughout the day"] },
    ],
    selfCare: "Warm honey and lemon tea. Stay hydrated. Use a humidifier. Avoid smoke and irritants.",
    seeDoctor: "If cough lasts more than 3 weeks, produces blood, or is accompanied by shortness of breath.",
  },
  fatigue: {
    id: "fatigue",
    label: "Fatigue",
    bodyPart: "whole-body",
    severityWeights: { mild: 1, moderate: 2, severe: 4 },
    possibleConditions: {
      mild: ["Sleep deprivation", "Stress", "Dehydration", "Poor nutrition"],
      moderate: ["Anaemia", "Hypothyroidism", "Vitamin D deficiency", "Depression", "Long COVID"],
      severe: ["Chronic fatigue syndrome", "Autoimmune disorder", "Heart failure", "Sleep apnoea"],
    },
    redFlags: ["Sudden severe fatigue", "Fatigue with chest pain", "Fatigue with unexplained weight loss", "Fainting episodes"],
    followUp: [
      { id: "fatigue-onset", question: "When did the fatigue start?", options: ["Gradually over months", "Suddenly this week", "After an illness", "Always tired"] },
      { id: "fatigue-relief", question: "Does rest help?", options: ["Yes, I feel better after resting", "No, rest doesn't help", "I can't sleep well"] },
    ],
    selfCare: "Prioritise 7-9 hours of sleep. Stay hydrated. Eat balanced meals. Reduce caffeine after 2 PM.",
    seeDoctor: "If fatigue persists for more than 2 weeks despite adequate rest and sleep.",
  },
  "sore-throat": {
    id: "sore-throat",
    label: "Sore throat",
    bodyPart: "neck",
    severityWeights: { mild: 1, moderate: 3, severe: 5 },
    possibleConditions: {
      mild: ["Common cold", "Dry air", "Mild allergy", "Voice strain"],
      moderate: ["Strep throat", "Tonsillitis", "Pharyngitis", "Glandular fever"],
      severe: ["Peritonsillar abscess", "Epiglottitis", "Severe allergic reaction"],
    },
    redFlags: ["Difficulty swallowing saliva", "Difficulty breathing", "Unable to open mouth fully", "Swelling on one side of throat"],
    followUp: [
      { id: "throat-pain-type", question: "How would you describe the pain?", options: ["Scratchy/irritated", "Sharp when swallowing", "Burning", "Lump sensation"] },
      { id: "throat-visible", question: "Can you see anything unusual?", options: ["Redness only", "White patches", "Swollen tonsils", "No visible changes"] },
    ],
    selfCare: "Warm salt water gargle. Drink warm tea with honey. Suck on throat lozenges. Rest your voice.",
    seeDoctor: "If sore throat lasts more than 5 days, or you have white patches, or difficulty swallowing.",
  },
  "body-ache": {
    id: "body-ache",
    label: "Body ache",
    bodyPart: "whole-body",
    severityWeights: { mild: 1, moderate: 3, severe: 6 },
    possibleConditions: {
      mild: ["Viral infection (cold/flu)", "Overexertion", "Mild dehydration"],
      moderate: ["Influenza", "COVID-19", "Fibromyalgia", "Vitamin D deficiency"],
      severe: ["Autoimmune flare", "Severe infection", "Rhabdomyolysis", "Chronic fatigue syndrome"],
    },
    redFlags: ["Muscle weakness", "Dark urine", "Extreme pain with no movement", "Pain after starting new medication"],
    followUp: [
      { id: "body-ache-location", question: "Where are the aches?", options: ["All over", "Arms and legs only", "Back and neck", "Joints specifically"] },
      { id: "body-ache-onset", question: "When did it start?", options: ["Today", "2-3 days ago", "A week ago", "Months ago"] },
    ],
    selfCare: "Rest, warm baths, gentle stretching. Take paracetamol or ibuprofen. Stay hydrated.",
    seeDoctor: "If body aches are severe, accompanied by fever over 39°C, or persist beyond one week.",
  },
  nausea: {
    id: "nausea",
    label: "Nausea",
    bodyPart: "abdomen",
    severityWeights: { mild: 1, moderate: 3, severe: 6 },
    possibleConditions: {
      mild: ["Indigestion", "Motion sickness", "Mild food poisoning", "Anxiety"],
      moderate: ["Gastroenteritis", "Migraine", "Gastritis", "Medication side effect"],
      severe: ["Severe food poisoning", "Pancreatitis", "Meningitis", "Diabetic ketoacidosis"],
    },
    redFlags: ["Vomiting blood", "Severe abdominal pain", "Stiff neck with nausea", "Head injury with nausea"],
    followUp: [
      { id: "nausea-vomiting", question: "Have you been vomiting?", options: ["No", "Yes, 1-2 times", "Yes, 3+ times", "Can't keep liquids down"] },
      { id: "nausea-trigger", question: "What triggers it?", options: ["After eating", "Morning only", "Certain smells", "Constant"] },
    ],
    selfCare: "Sip clear fluids slowly. Eat bland foods (crackers, toast, rice). Avoid strong smells. Rest.",
    seeDoctor: "If vomiting persists more than 24 hours, you can't keep liquids down, or there's blood in vomit.",
  },
  dizziness: {
    id: "dizziness",
    label: "Dizziness",
    bodyPart: "head",
    severityWeights: { mild: 2, moderate: 5, severe: 9 },
    possibleConditions: {
      mild: ["Dehydration", "Low blood sugar", "Standing up too fast", "Mild anaemia"],
      moderate: ["Vestibular neuritis", "Meniere's disease", "Migraine variant", "Anxiety", "Low blood pressure"],
      severe: ["Stroke/TIA", "Cardiac arrhythmia", "Severe anaemia", "Brain tumour"],
    },
    redFlags: ["Sudden severe dizziness with slurred speech", "Dizziness after head injury", "Fainting", "One-sided weakness"],
    followUp: [
      { id: "dizziness-type", question: "What does it feel like?", options: ["Room spinning", "Lightheaded/faint", "Off-balance", "Floating sensation"] },
      { id: "dizziness-trigger", question: "When does it happen?", options: ["Standing up", "Moving head", "Sudden onset", "Constant"] },
    ],
    selfCare: "Sit or lie down immediately. Move slowly when standing. Stay hydrated. Avoid sudden head movements.",
    seeDoctor: "If dizziness is severe, accompanied by slurred speech or weakness, or causes fainting.",
  },
  "chest-pain": {
    id: "chest-pain",
    label: "Chest pain",
    bodyPart: "chest",
    severityWeights: { mild: 6, moderate: 8, severe: 10 },
    possibleConditions: {
      mild: ["Muscle strain", "Heartburn/acid reflux", "Costochondritis", "Anxiety"],
      moderate: ["Angina", "Pericarditis", "Pleurisy", "Shingles"],
      severe: ["Heart attack", "Pulmonary embolism", "Aortic dissection", "Pneumothorax"],
    },
    redFlags: ["Crushing chest pain", "Pain radiating to left arm or jaw", "Shortness of breath with chest pain", "Cold sweats with chest pain"],
    followUp: [
      { id: "chest-pain-type", question: "What type of chest pain?", options: ["Sharp/stabbing", "Crushing/pressure", "Burning", "Dull ache"] },
      { id: "chest-pain-radiation", question: "Does the pain spread anywhere?", options: ["No", "Left arm or shoulder", "Back or jaw", "Neck or throat"] },
    ],
    selfCare: "If mild and related to movement or eating, rest and avoid trigger foods. Monitor closely.",
    seeDoctor: "Any new chest pain requires medical evaluation. Call emergency if severe or with shortness of breath.",
  },
  "shortness-breath": {
    id: "shortness-breath",
    label: "Shortness of breath",
    bodyPart: "chest",
    severityWeights: { mild: 5, moderate: 8, severe: 10 },
    possibleConditions: {
      mild: ["Anxiety", "Mild asthma", "Deconditioning", "Allergies"],
      moderate: ["Asthma exacerbation", "Bronchitis", "Anaemia", "COVID-19"],
      severe: ["Pneumonia", "Pulmonary embolism", "Heart failure", "Severe allergic reaction"],
    },
    redFlags: ["Sudden severe breathlessness", "Breathlessness at rest", "Blue lips or fingers", "Chest tightness with breathlessness"],
    followUp: [
      { id: "sob-onset", question: "When did it start?", options: ["Suddenly (minutes)", "Over hours", "Over days", "Gradually over weeks"] },
      { id: "sob-trigger", question: "What makes it worse?", options: ["Walking or exertion", "Lying flat", "At rest too", "Specific triggers (pollen, etc)"] },
    ],
    selfCare: "Sit upright, breathe slowly. Avoid triggers. Use a fan. If asthma, use your reliever inhaler.",
    seeDoctor: "If shortness of breath is sudden, severe, or occurs at rest — call emergency immediately.",
  },
  "abdominal-pain": {
    id: "abdominal-pain",
    label: "Abdominal pain",
    bodyPart: "abdomen",
    severityWeights: { mild: 2, moderate: 5, severe: 9 },
    possibleConditions: {
      mild: ["Indigestion", "Gas/bloating", "Mild constipation", "Menstrual cramps"],
      moderate: ["Gastritis", "Irritable bowel syndrome", "Food poisoning", "Urinary tract infection", "Gallstones"],
      severe: ["Appendicitis", "Pancreatitis", "Perforated ulcer", "Ectopic pregnancy", "Bowel obstruction"],
    },
    redFlags: ["Severe pain that comes in waves", "Blood in stool", "Vomiting blood", "Abdomen rigid and tender", "Pain with fever"],
    followUp: [
      { id: "abdo-location", question: "Where is the pain?", options: ["Upper left", "Upper right", "Lower left", "Lower right", "Centre", "All over"] },
      { id: "abdo-type", question: "What type of pain?", options: ["Sharp/stabbing", "Cramping", "Burning", "Dull ache", "Colicky (comes and goes)"] },
    ],
    selfCare: "Small sips of water. Avoid solid food temporarily. Apply a warm water bottle. Rest.",
    seeDoctor: "If pain is severe, persistent, or accompanied by fever, vomiting, or blood in stool.",
  },
  rash: {
    id: "rash",
    label: "Skin rash",
    bodyPart: "skin",
    severityWeights: { mild: 1, moderate: 3, severe: 6 },
    possibleConditions: {
      mild: ["Dry skin", "Mild allergic reaction", "Heat rash", "Insect bite"],
      moderate: ["Contact dermatitis", "Eczema", "Hives (urticaria)", "Fungal infection"],
      severe: ["Cellulitis", "Shingles", "Stevens-Johnson syndrome", "Meningococcal rash"],
    },
    redFlags: ["Rash with fever", "Rash that doesn't blanch (fade when pressed)", "Rash with blisters", "Rash spreading rapidly"],
    followUp: [
      { id: "rash-appearance", question: "What does the rash look like?", options: ["Red patches", "Raised bumps/hives", "Blisters", "Dry and scaly", "Purple/dark spots"] },
      { id: "rash-itch", question: "Is it itchy?", options: ["Very itchy", "Mildly itchy", "Painful/burning", "No sensation"] },
    ],
    selfCare: "Avoid scratching. Apply cool compresses. Use fragrance-free moisturiser. Avoid known irritants.",
    seeDoctor: "If rash is painful, spreads rapidly, or is accompanied by fever or difficulty breathing.",
  },
  "ear-pain": {
    id: "ear-pain",
    label: "Ear pain",
    bodyPart: "head",
    severityWeights: { mild: 1, moderate: 4, severe: 7 },
    possibleConditions: {
      mild: ["Eustachian tube congestion", "Mild ear infection", "Pressure changes", "Excess earwax"],
      moderate: ["Otitis media (middle ear infection)", "Swimmer's ear", "Sinusitis", "Temporomandibular joint (TMJ) disorder"],
      severe: ["Mastoiditis", "Ruptured eardrum", "Severe ear infection with fever"],
    },
    redFlags: ["Fluid or blood draining from ear", "Sudden hearing loss", "Severe pain with fever", "Pain behind ear with swelling"],
    followUp: [
      { id: "ear-pain-location", question: "Which ear?", options: ["Left ear", "Right ear", "Both ears"] },
      { id: "ear-pain-type", question: "Type of pain?", options: ["Sharp", "Dull ache", "Fullness/pressure", "Throbbing"] },
    ],
    selfCare: "Apply a warm cloth to the ear. Rest upright to reduce pressure. Use over-the-counter pain relief.",
    seeDoctor: "If ear pain is severe, accompanied by fever, or you notice fluid draining from the ear.",
  },
  "eye-irritation": {
    id: "eye-irritation",
    label: "Eye irritation",
    bodyPart: "head",
    severityWeights: { mild: 1, moderate: 3, severe: 7 },
    possibleConditions: {
      mild: ["Dry eyes", "Eye strain", "Allergy", "Foreign body"],
      moderate: ["Conjunctivitis (pink eye)", "Blepharitis", "Corneal abrasion", "Sinusitis"],
      severe: ["Acute glaucoma", "Orbital cellulitis", "Corneal ulcer", "Uveitis"],
    },
    redFlags: ["Sudden vision loss", "Severe eye pain", "Eye pain with nausea", "Pupil changes", "Eye injury"],
    followUp: [
      { id: "eye-symptoms", question: "What are you experiencing?", options: ["Redness", "Itching", "Discharge", "Pain", "Blurry vision", "Sensitivity to light"] },
      { id: "eye-onset", question: "When did it start?", options: ["Suddenly today", "Over 1-2 days", "Gradually"] },
    ],
    selfCare: "Avoid rubbing eyes. Use artificial tears. Remove contact lenses. Apply cold compress.",
    seeDoctor: "If you have vision changes, severe pain, or symptoms lasting more than 2 days.",
  },
  "back-pain": {
    id: "back-pain",
    label: "Back pain",
    bodyPart: "back",
    severityWeights: { mild: 1, moderate: 4, severe: 7 },
    possibleConditions: {
      mild: ["Muscle strain", "Poor posture", "Overexertion", "Sedentary lifestyle"],
      moderate: ["Herniated disc", "Sciatica", "Spinal stenosis", "Osteoarthritis"],
      severe: ["Cauda equina syndrome", "Spinal fracture", "Infection (osteomyelitis)", "Cancer metastasis"],
    },
    redFlags: ["Loss of bladder or bowel control", "Numbness in groin area", "Pain after a fall or injury", "Unexplained weight loss with back pain"],
    followUp: [
      { id: "back-pain-location", question: "Where in the back?", options: ["Upper back", "Lower back", "Middle back", "Tailbone area", "All over"] },
      { id: "back-pain-radiation", question: "Does the pain spread?", options: ["No", "Down one leg", "Down both legs", "To the arms or chest"] },
    ],
    selfCare: "Gentle movement, not bed rest. Apply heat or cold packs. Maintain good posture. Sleep on a firm mattress.",
    seeDoctor: "If pain radiates down legs, causes numbness, or is accompanied by loss of bladder/bowel control.",
  },
  "joint-pain": {
    id: "joint-pain",
    label: "Joint pain",
    bodyPart: "limbs",
    severityWeights: { mild: 1, moderate: 3, severe: 6 },
    possibleConditions: {
      mild: ["Overuse", "Mild arthritis", "Weather-related stiffness", "Exercise soreness"],
      moderate: ["Osteoarthritis", "Rheumatoid arthritis", "Gout", "Bursitis", "Tendonitis"],
      severe: ["Septic arthritis", "Autoimmune flare", "Fracture", "Severe gout"],
    },
    redFlags: ["Hot, red, swollen joint", "Joint pain with fever", "Inability to move the joint", "Pain after injury"],
    followUp: [
      { id: "joint-location", question: "Which joints?", options: ["Knees", "Hips", "Hands/wrists", "Shoulders", "Ankles/feet", "Multiple joints"] },
      { id: "joint-pattern", question: "Pattern of pain?", options: ["Worse in morning", "Worse with activity", "Constant", "Comes and goes", "Swollen and hot"] },
    ],
    selfCare: "Rest the joint. Apply ice for 15-20 minutes. Elevate if swollen. Gentle range-of-motion exercises.",
    seeDoctor: "If a joint is hot, red, and swollen, or if pain persists for more than 2 weeks.",
  },
}

export const commonSymptomsList = Object.values(symptomDB).map(s => ({
  id: s.id,
  label: s.label,
}))

export function getSymptomInfo(id: string): SymptomInfo | undefined {
  return symptomDB[id]
}

export function getFollowUps(symptomIds: string[]): FollowUpQuestion[] {
  const seen = new Set<string>()
  const questions: FollowUpQuestion[] = []
  for (const id of symptomIds) {
    const info = symptomDB[id]
    if (!info) continue
    for (const q of info.followUp) {
      if (!seen.has(q.id)) {
        seen.add(q.id)
        questions.push(q)
      }
    }
  }
  return questions
}

export function evaluateTriage(input: TriageInput): TriageResult {
  const { symptomIds, customSymptoms, description, severity, followUpAnswers } = input
  const allText = [...symptomIds.map(id => symptomDB[id]?.label ?? ""), ...customSymptoms, description]
    .filter(Boolean).join(" ").toLowerCase()

  const selectedSymptoms = symptomIds.map(id => symptomDB[id]).filter(Boolean) as SymptomInfo[]

  let totalScore = 0
  const bodyPartsInvolved = new Set<string>()
  const redFlagsDetected: string[] = []
  let allPossibleConditions: string[] = []
  let selfCareTips: string[] = []

  for (const s of selectedSymptoms) {
    totalScore += s.severityWeights[severity] ?? 0
    bodyPartsInvolved.add(s.bodyPart)
    allPossibleConditions = [...allPossibleConditions, ...s.possibleConditions[severity]]

    for (const rf of s.redFlags) {
      if (allText.includes(rf.toLowerCase().slice(0, 20))) {
        redFlagsDetected.push(rf)
      }
    }

    if (s.selfCare) selfCareTips.push(s.selfCare)
  }

  if (customSymptoms.length > 0) {
    totalScore += severity === "severe" ? 4 : severity === "moderate" ? 2 : 0
    bodyPartsInvolved.add("other")
    allPossibleConditions.push("Condition related to reported symptoms")
  }

  if (description.length > 50) {
    totalScore += 1
  }

  const hasRedFlagKeywords =
    allText.includes("unconscious") || allText.includes("not breathing") ||
    allText.includes("heavy bleeding") || allText.includes("poisoning") ||
    allText.includes("suicidal") || allText.includes("seizure") ||
    allText.includes("allergic reaction") || allText.includes("difficulty breathing") ||
    allText.includes("cannot wake") || allText.includes("choking") ||
    allText.includes("drowning") || allText.includes("electrical shock") ||
    allText.includes("severe burn") || allText.includes("head injury") ||
    allText.includes("broken bone") || allText.includes("deep cut")

  let urgency: Urgency
  if (hasRedFlagKeywords || totalScore >= 18 || redFlagsDetected.length > 0) {
    urgency = "emergency"
  } else if (totalScore >= 12 || symptomIds.includes("chest-pain") || symptomIds.includes("shortness-breath")) {
    urgency = "urgent"
  } else if (totalScore >= 6 || severity === "severe" || hasFever(allText)) {
    urgency = "appointment"
  } else {
    urgency = "self-care"
  }

  allPossibleConditions = [...new Set(allPossibleConditions)].slice(0, 4)

  if (urgency === "self-care" && allPossibleConditions.length === 0) {
    allPossibleConditions = ["Mild viral infection", "Tension headache", "Minor allergy", "Stress-related symptoms"]
  }

  const recommendation = buildRecommendation(urgency, severity, allText, symptomIds, selectedSymptoms, followUpAnswers)
  const whenToWorry = buildWhenToWorry(urgency, selectedSymptoms)
  const selfCare = urgency === "self-care" ? [...new Set(selfCareTips)].slice(0, 2).join(" ") : ""

  return {
    urgency,
    possibleConditions: allPossibleConditions.slice(0, 4),
    recommendation,
    bodyPartsInvolved: [...bodyPartsInvolved],
    redFlagsDetected,
    suggestedMedication: urgency === "self-care" ? "Paracetamol or Ibuprofen — follow package instructions" : undefined,
    disclaimer: "This AI-generated assessment is for informational purposes only. It does not replace a medical diagnosis. Always consult a qualified healthcare professional for medical advice.",
    whenToWorry,
    selfCare,
  }
}

function hasFever(text: string): boolean {
  return text.includes("fever") && (text.includes("38") || text.includes("39") || text.includes("40") || text.includes("high"))
}

function buildRecommendation(
  urgency: Urgency,
  severity: Severity,
  allText: string,
  symptomIds: string[],
  selectedSymptoms: SymptomInfo[],
  followUpAnswers: FollowUpAnswer[]
): string {
  const parts: string[] = []

  if (urgency === "emergency") {
    parts.push("This could be a medical emergency. Please call emergency services (10177 in South Africa) or go to the nearest emergency room immediately.")
    parts.push("Do not wait to see if symptoms improve. Every minute counts.")
    return parts.join(" ")
  }

  if (urgency === "urgent") {
    parts.push("You should speak to a healthcare provider within the next 24 hours.")
    parts.push("This may require diagnostic tests or treatment that cannot wait.")
    if (severity === "severe") {
      parts.push("If symptoms worsen, go to the nearest emergency room.")
    }
    return parts.join(" ")
  }

  if (urgency === "appointment") {
    parts.push("Schedule an appointment with your primary care provider within the next 2-3 days.")
    if (symptomIds.includes("cough") && symptomIds.includes("fever")) {
      parts.push("You may need testing for influenza, COVID-19, or a bacterial infection.")
    }
    if (symptomIds.includes("rash") && symptomIds.includes("fever")) {
      parts.push("A rash with fever can indicate an infection that requires medical evaluation.")
    }
    if (symptomIds.includes("abdominal-pain") && severity === "moderate") {
      parts.push("If the pain moves to the lower right side or becomes severe, go to emergency.")
    }
    if (parts.length === 1) {
      parts.push("Monitor your symptoms and seek care sooner if they worsen.")
    }
    return parts.join(" ")
  }

  parts.push("Based on your symptoms, self-care at home is appropriate.")
  for (const s of selectedSymptoms) {
    if (s.selfCare) {
      parts.push(s.selfCare)
      break
    }
  }
  if (parts.length === 1) {
    parts.push("Rest, stay hydrated, and monitor your symptoms.")
  }
  return parts.join(" ")
}

function buildWhenToWorry(urgency: Urgency, symptoms: SymptomInfo[]): string {
  if (urgency === "emergency") return "Seek emergency care immediately. Do not wait."

  const warnings = symptoms.map(s => s.seeDoctor).filter(Boolean)
  if (warnings.length > 0) {
    return warnings.slice(0, 2).join(" ")
  }
  return "If symptoms persist for more than 7 days, or if they worsen at any point, consult a healthcare provider."
}
