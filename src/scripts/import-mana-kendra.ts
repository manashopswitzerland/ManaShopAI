/**
 * One-time import: seeds Mana Kendra services as FAQs in the database.
 * Run with: npx ts-node src/scripts/import-mana-kendra.ts
 */
import mongoose from 'mongoose';
import { Faq } from '../models/faq.model';
import { env } from '../config/env';

const KENDRA_FAQS = [
  // ── Massages ──────────────────────────────────────────────────────────────
  {
    question: 'Welche Massagen bietet Mana Kendra an?',
    answer: 'Mana Kendra bietet eine grosse Auswahl an Massagen: Klassische Massage, Lomi Lomi (Hawaiianische Massage), Triggerpunkt-Massage, Sportmassage, Fussreflexzonenmassage, Schröpfen, Hot-Stone-Therapie, Craniosacrale Therapie und Lymphdrainage. Alle Behandlungen können direkt gebucht werden unter: https://www.mana-kendra.ch/massage-behandlung',
    tags: ['massage', 'behandlung', 'körper'],
  },
  {
    question: 'What massages does Mana Kendra offer?',
    answer: 'Mana Kendra offers a wide range of massages: Classical Massage, Lomi Lomi (Hawaiian massage), Trigger Point Massage, Sports Massage, Foot Reflexology, Cupping, Hot Stone Therapy, Craniosacral Therapy and Lymphatic Drainage. Book directly at: https://www.mana-kendra.ch/massage-behandlung',
    tags: ['massage', 'treatment', 'body'],
    language: 'en' as const,
  },
  {
    question: 'Was ist eine Lomi Lomi Massage?',
    answer: 'Die Lomi Lomi ist eine hawaiianische Massagetechnik, die mit fliessenden, wellenartigen Bewegungen arbeitet und tiefe Entspannung und Loslassen fördert. Buchung unter: https://www.mana-kendra.ch/massage-behandlung',
    tags: ['lomi lomi', 'massage', 'hawaii'],
  },
  {
    question: 'Was ist Craniosacrale Therapie?',
    answer: 'Die Craniosacrale Therapie ist eine sanfte Körpertherapie, die das Nervensystem reguliert und tiefe Entspannung fördert. Sie wirkt bei Stress, Kopfschmerzen, Schlafproblemen und Erschöpfung. Buchung: https://www.mana-kendra.ch/massage-behandlung',
    tags: ['craniosacral', 'nervensystem', 'therapie'],
  },

  // ── Yoga ──────────────────────────────────────────────────────────────────
  {
    question: 'Bietet Mana Kendra Yoga-Kurse an?',
    answer: 'Ja! Mana Kendra bietet regelmässige Yoga-Kurse in Bern-Ostermundigen an: verschiedene Stile und Niveaus, Yogatherapie, Qi Gong, Atemtherapie und geführte Meditation. Die wöchentlichen Kurse findest du hier: https://www.mana-kendra.ch/yoga-kurse-bern',
    tags: ['yoga', 'kurs', 'bewegung', 'bern'],
  },
  {
    question: 'Does Mana Kendra offer yoga classes?',
    answer: 'Yes! Mana Kendra offers regular yoga classes in Bern-Ostermundigen: various styles and levels, yoga therapy, Qi Gong, breathwork, and guided meditation. See the weekly schedule at: https://www.mana-kendra.ch/yoga-kurse-bern',
    tags: ['yoga', 'classes', 'movement', 'bern'],
    language: 'en' as const,
  },
  {
    question: 'Was ist Yogatherapie?',
    answer: 'Yogatherapie bei Mana Kendra verbindet therapeutische Bewegungsübungen mit Atemtechniken und Achtsamkeit. Sie wird gezielt bei körperlichen Beschwerden, Stress oder Rekonvaleszenz eingesetzt. Mehr Infos: https://www.mana-kendra.ch/yoga-kurse-bern',
    tags: ['yogatherapie', 'therapie', 'yoga'],
  },
  {
    question: 'Gibt es Meditationskurse bei Mana Kendra?',
    answer: 'Ja, Mana Kendra bietet regelmässige Meditationssessions und Atemarbeits-Gruppen an. Qi Gong-Kurse zur Energiepflege sind ebenfalls im Programm. Wöchentliche Kurse: https://www.mana-kendra.ch/woechentliche-kurse',
    tags: ['meditation', 'qi gong', 'atemtherapie'],
  },

  // ── Therapies & Coaching ──────────────────────────────────────────────────
  {
    question: 'Welche Therapien bietet Mana Kendra an?',
    answer: 'Mana Kendra bietet u.a.: Hypnotherapie, Coaching & Lebensberatung, Kinesiotherapie, Paar- und Familienberatung, Traumatherapie, Beckenbodenkurse, Ernährungsberatung, Klangtherapie, Kinesiologie, Reiki und Energiearbeit. Buchung und Infos: https://www.mana-kendra.ch/kontakt',
    tags: ['therapie', 'coaching', 'beratung'],
  },
  {
    question: 'What therapies does Mana Kendra offer?',
    answer: 'Mana Kendra offers: Hypnotherapy, Coaching & Life Counseling, Kinesiotherapy, Couples & Family Counseling, Trauma Therapy, Pelvic Floor Training, Nutritional Counseling, Sound Therapy, Kinesiology, Reiki and energy work. Info & booking: https://www.mana-kendra.ch/kontakt',
    tags: ['therapy', 'coaching', 'counseling'],
    language: 'en' as const,
  },
  {
    question: 'Bietet Mana Kendra Hypnotherapie an?',
    answer: 'Ja, Mana Kendra bietet professionelle Hypnotherapie an — zur Arbeit mit unbewussten Mustern, Ängsten, Stress oder zur persönlichen Entwicklung. Kontakt für eine Beratung: info@mana-kendra.ch oder https://www.mana-kendra.ch/kontakt',
    tags: ['hypnotherapie', 'hypnose', 'therapie'],
  },
  {
    question: 'Gibt es Traumatherapie bei Mana Kendra?',
    answer: 'Ja, Mana Kendra bietet traumasensible Therapie an. Die Therapeuten arbeiten einfühlsam und professionell mit Menschen, die traumatische Erfahrungen verarbeiten möchten. Mehr: https://www.mana-kendra.ch/trauma-therapie',
    tags: ['trauma', 'traumatherapie', 'therapie'],
  },

  // ── Ayurveda ──────────────────────────────────────────────────────────────
  {
    question: 'Bietet Mana Kendra Ayurveda-Behandlungen an?',
    answer: 'Ja! Mana Kendra bietet Ayurvedische Massagen zur Dosha-Balance, Ayurveda-Beratungen nach traditioneller indischer Medizin sowie Mykotherapie (Heilpilze) an. Buchung: https://www.mana-kendra.ch/massage-behandlung',
    tags: ['ayurveda', 'massage', 'dosha', 'indisch'],
  },
  {
    question: 'What is Ayurvedic treatment at Mana Kendra?',
    answer: 'Mana Kendra offers Ayurvedic massages for dosha balancing, Ayurvedic consultations based on traditional Indian medicine, and herbal/mushroom therapy (Mykotherapy). Book at: https://www.mana-kendra.ch/massage-behandlung',
    tags: ['ayurveda', 'massage', 'dosha', 'indian medicine'],
    language: 'en' as const,
  },

  // ── Pregnancy & Family ────────────────────────────────────────────────────
  {
    question: 'Gibt es Angebote für Schwangere bei Mana Kendra?',
    answer: 'Ja! Mana Kendra bietet spezielle Angebote für Schwangere und junge Familien: Schwangerschaftsbegleitung, Geburtsvorbereitung, Rückbildungskurse nach der Geburt sowie Babymassage-Kurse. Kontakt: info@mana-kendra.ch oder https://www.mana-kendra.ch/kontakt',
    tags: ['schwangerschaft', 'geburt', 'rückbildung', 'baby'],
  },
  {
    question: 'Does Mana Kendra offer pregnancy or postpartum support?',
    answer: 'Yes! Mana Kendra offers pregnancy support, birth preparation, postpartum recovery (Rückbildung) and baby massage courses. Contact: info@mana-kendra.ch or https://www.mana-kendra.ch/kontakt',
    tags: ['pregnancy', 'postpartum', 'baby massage', 'birth'],
    language: 'en' as const,
  },

  // ── Burnout & Stress ──────────────────────────────────────────────────────
  {
    question: 'Kann mir Mana Kendra bei Burnout oder Stress helfen?',
    answer: 'Ja, Mana Kendra hat ein spezialisiertes Programm für Burnout-Prävention und -Behandlung in Bern. Das Angebot umfasst Coaching, Körpertherapie, Yoga und individuelle Begleitung. Mehr Infos: https://www.mana-kendra.ch/burnout-bern',
    tags: ['burnout', 'stress', 'erschöpfung', 'bern'],
  },
  {
    question: 'Does Mana Kendra help with burnout or stress?',
    answer: 'Yes, Mana Kendra has a specialized burnout prevention and recovery program in Bern, combining coaching, body therapy, yoga and personal support. Learn more: https://www.mana-kendra.ch/burnout-bern',
    tags: ['burnout', 'stress', 'exhaustion', 'bern'],
    language: 'en' as const,
  },

  // ── General / Contact ─────────────────────────────────────────────────────
  {
    question: 'Wo befindet sich Mana Kendra?',
    answer: 'Mana Kendra befindet sich an der Blankweg 2b, 3072 Bern-Ostermundigen. Öffnungszeiten: Mo–Fr 10–19 Uhr, Sa 10–16 Uhr. Telefon: +41 78 200 90 49 | E-Mail: info@mana-kendra.ch',
    tags: ['adresse', 'öffnungszeiten', 'standort', 'bern'],
  },
  {
    question: 'Where is Mana Kendra located?',
    answer: 'Mana Kendra is located at Blankweg 2b, 3072 Bern-Ostermundigen. Opening hours: Mon–Fri 10am–7pm, Sat 10am–4pm. Phone: +41 78 200 90 49 | Email: info@mana-kendra.ch',
    tags: ['address', 'opening hours', 'location', 'bern'],
    language: 'en' as const,
  },
  {
    question: 'Wie kann ich eine Behandlung bei Mana Kendra buchen?',
    answer: 'Du kannst Massagen und Behandlungen direkt online buchen unter: https://www.mana-kendra.ch/massage-behandlung\nFür Therapien und Beratungen erreichst du uns per E-Mail an info@mana-kendra.ch oder telefonisch unter +41 78 200 90 49.',
    tags: ['buchen', 'termin', 'booking'],
  },
  {
    question: 'How do I book a treatment at Mana Kendra?',
    answer: 'You can book massages and treatments directly online at: https://www.mana-kendra.ch/massage-behandlung\nFor therapy and counseling sessions, contact us at info@mana-kendra.ch or call +41 78 200 90 49.',
    tags: ['book', 'appointment', 'booking'],
    language: 'en' as const,
  },
  {
    question: 'Bietet Mana Kendra Kurse oder Workshops an?',
    answer: 'Ja! Neben wöchentlichen Yoga- und Meditationskursen organisiert Mana Kendra regelmässig Workshops, Events und Intensivprogramme. Das aktuelle Programm findest du unter: https://www.mana-kendra.ch/events-workshops',
    tags: ['workshop', 'event', 'kurs', 'programm'],
  },
  {
    question: 'Bietet Mana Kendra Corporate Wellness an?',
    answer: 'Ja, Mana Kendra bietet massgeschneiderte Wellness-Programme für Unternehmen an — Stressmanagement, Team-Gesundheit und Burnout-Prävention. Kontakt: info@mana-kendra.ch',
    tags: ['corporate', 'unternehmen', 'business', 'wellness'],
  },
  {
    question: 'Was ist eine Gesundheitsanalyse bei Mana Kendra?',
    answer: 'Die Gesundheitsanalyse bei Mana Kendra ist eine umfassende Wellness-Standortbestimmung. Sie hilft dir, deine körperlichen und energetischen Ressourcen zu erkennen und gezielte Massnahmen zu planen. Mehr Infos: https://www.mana-kendra.ch/gesundheitsanalyse',
    tags: ['gesundheitsanalyse', 'analyse', 'wellness'],
  },
];

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const entry of KENDRA_FAQS) {
    const exists = await Faq.findOne({ question: entry.question });
    if (exists) { skipped++; continue; }
    await Faq.create({
      question: entry.question,
      answer: entry.answer,
      tags: entry.tags ?? [],
      language: (entry as { language?: 'de' | 'en' }).language ?? 'de',
      storeId: 'mana-kendra',
    });
    created++;
    console.log(`  ✓ ${entry.question.substring(0, 60)}…`);
  }

  console.log(`\nDone: ${created} created, ${skipped} already existed.`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
