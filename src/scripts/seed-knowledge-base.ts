/**
 * Knowledge base seed script.
 * Run once to populate the FAQ collection from website content.
 *
 * Usage:
 *   npx ts-node src/scripts/seed-knowledge-base.ts
 */

import '../config/env';
import { connectDatabase } from '../config/db';
import { Faq } from '../models/faq.model';
import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// FAQ entries — sourced from mana-shop.ch and mana-kendra.ch
// ---------------------------------------------------------------------------

const faqs = [
  // ── MANA SHOP: Bestellungen & Versand (DE) ──────────────────────────────

  {
    question: 'Wie hoch sind die Versandkosten?',
    answer:
      'Wir bieten drei Versandoptionen an: Versand B (Standard) für CHF 9.50 mit Lieferung in 3–12 Werktagen, Versand A für CHF 14.00 mit Lieferung in 1–3 Werktagen, und Express-Versand für CHF 19.00 mit Lieferung am nächsten Werktag (bei Bestellung bis 14:00 Uhr und sofortigem Zahlungseingang). Ab einem Bestellwert von CHF 100 ist der Versand kostenlos.',
    tags: ['versand', 'lieferung', 'kosten', 'shipping'],
    language: 'de',
  },
  {
    question: 'In welche Länder liefert ihr?',
    answer:
      'Wir liefern in die Schweiz, nach Liechtenstein, Österreich und Deutschland. Der kostenlose Versand ab CHF 100 gilt für alle Lieferländer. Bitte beachte, dass der Express-Versand nur innerhalb der Schweiz verfügbar ist.',
    tags: ['versand', 'lieferländer', 'international', 'deutschland', 'österreich'],
    language: 'de',
  },
  {
    question: 'Kann ich meine Bestellung im Geschäft abholen?',
    answer:
      'Ja! Du kannst deine Bestellung in unserem Ladengeschäft am Blankweg 2b, 3072 Bern-Ostermundigen abholen. Die Bestellung ist innerhalb von 14 Kalendertagen nach Bestätigung zur Abholung bereit. Nicht abgeholte Artikel werden danach wieder ins Lager zurückgelegt. Öffnungszeiten: Mo–Fr 10:00–19:00 Uhr, Sa 10:00–16:00 Uhr.',
    tags: ['abholung', 'pickup', 'laden', 'ostermundigen', 'bern'],
    language: 'de',
  },
  {
    question: 'Wann wird meine Bestellung versendet?',
    answer:
      'Der Versand erfolgt erst nach Zahlungseingang. Sobald deine Zahlung bestätigt wurde, wird deine Bestellung bearbeitet und gemäss der gewählten Versandmethode verschickt. Du erhältst eine Bestätigungs-E-Mail, sobald das Paket unterwegs ist.',
    tags: ['versand', 'bearbeitung', 'zahlung', 'lieferzeit'],
    language: 'de',
  },
  {
    question: 'Welche Zahlungsmethoden akzeptiert ihr?',
    answer:
      'Wir akzeptieren folgende Zahlungsmethoden: TWINT, PostFinance Card, Visa, Mastercard, American Express, PayPal, Klarna, Apple Pay, Google Pay, Samsung Pay und Shop Pay. Alle Zahlungen sind sicher und verschlüsselt.',
    tags: ['zahlung', 'bezahlen', 'twint', 'kreditkarte', 'paypal', 'klarna'],
    language: 'de',
  },
  {
    question: 'Wie kann ich eine Retoure einleiten?',
    answer:
      'Du hast 14 Tage nach Erhalt deiner Bestellung Zeit, eine Rücksendung zu beantragen. Artikel müssen ungetragen, ungenutzt, mit Etiketten versehen und in der Originalverpackung sein. Sende uns deine Rücksendeanfrage an info@mana-shop.ch oder über dein Kundenkonto. Wir schicken dir dann ein Rücksendeetikett. Bitte keine Pakete ohne vorherige Genehmigung einschicken.',
    tags: ['retoure', 'rückgabe', 'umtausch', 'rücksendung', 'zurückgeben'],
    language: 'de',
  },
  {
    question: 'Welche Artikel können nicht zurückgegeben werden?',
    answer:
      'Folgende Artikel sind vom Rückgaberecht ausgeschlossen: verderbliche Lebensmittel, Sonderanfertigungen und personalisierte Produkte, geöffnete Körperpflegeprodukte, Gefahrstoffe sowie Aktionsartikel und Gutscheine.',
    tags: ['retoure', 'ausnahmen', 'nicht zurückgebbar', 'gutscheine', 'lebensmittel'],
    language: 'de',
  },
  {
    question: 'Wie lange dauert die Rückerstattung?',
    answer:
      'Nach Eingang und Prüfung der zurückgesendeten Ware erhältst du innerhalb von 10 Werktagen eine Rückerstattung auf deine ursprüngliche Zahlungsmethode. Je nach Bank kann die Gutschrift noch einige Tage länger dauern.',
    tags: ['rückerstattung', 'erstattung', 'refund', 'geld zurück'],
    language: 'de',
  },
  {
    question: 'Gibt es einen B2B-Shop für Therapeuten und Wiederverkäufer?',
    answer:
      'Ja! Wir bieten zertifizierten Therapeuten, Yoga-Lehrern und Wiederverkäufern einen B2B-Shop mit Großhandelspreisen an. Bitte kontaktiere uns unter info@mana-shop.ch für weitere Informationen zur Anmeldung und den Konditionen.',
    tags: ['b2b', 'großhandel', 'therapeuten', 'wiederverkäufer', 'rabatt'],
    language: 'de',
  },
  {
    question: 'Bietet ihr Gutscheine an?',
    answer:
      'Ja, wir bieten Geschenkgutscheine an, die du online bestellen kannst. Gutscheine sind von der Rückgabe ausgeschlossen. Ausserdem erhältst du mit der Anmeldung zu unserem Newsletter einen 5%-Rabattgutschein für deine erste Bestellung.',
    tags: ['gutschein', 'geschenk', 'rabatt', 'newsletter', 'voucher'],
    language: 'de',
  },

  // ── MANA SHOP: Produkte (DE) ────────────────────────────────────────────

  {
    question: 'Welche Produktkategorien bietet der Mana Shop an?',
    answer:
      'Unser Sortiment umfasst: Ayurveda-Produkte (Massageöle, Gewürze, Kräuter), ätherische Öle & Duftsprays, Räucherwerk (Stäbchen, Smudge, Palo Santo), Yoga-Schmuck & Heilsteine (Mala-Ketten, Kristalle), Massage & Therapieprodukte (Klangschalen, Massageräte), Naturkosmetik (Haar-, Gesichts- & Körperpflege), Lebensmittel (Gewürze, Öle, Tees, Zeremonieller Kakao), Nahrungsergänzungsmittel (Vitalpilze, Ashwagandha, Vitamin D3), Yoga-Lifestyle-Produkte sowie Schamanismus- und Esoterik-Artikel.',
    tags: ['produkte', 'sortiment', 'kategorien', 'angebot'],
    language: 'de',
  },
  {
    question: 'Was ist Ayurveda und welche Produkte gibt es dazu?',
    answer:
      'Ayurveda ist die traditionelle indische Heilkunde, die auf dem Gleichgewicht der drei Doshas (Vata, Pitta, Kapha) basiert. In unserem Ayurveda-Sortiment findest du: kaltgepresste Massageöle (z. B. Sesamöl, Mandelöl), Kräuter (Ashwagandha, Triphala, Pippali), Kupferbecher, Gewürze (Kurkuma, Kardamom, Zimt), Nasya-Öle und Zieröle. Unser Dosha-Typen-Quiz hilft dir, die richtigen Produkte für deinen Konstitutionstyp zu finden.',
    tags: ['ayurveda', 'dosha', 'vata', 'pitta', 'kapha', 'massageöl', 'kräuter'],
    language: 'de',
  },
  {
    question: 'Verkauft ihr Klangschalen?',
    answer:
      'Ja, wir führen Klangschalen in unserem Sortiment unter der Kategorie Massage & Therapie. Klangschalen werden für Meditation, Klangtherapie und Entspannung eingesetzt. Für eine persönliche Beratung kannst du uns gerne im Ladengeschäft besuchen oder uns kontaktieren.',
    tags: ['klangschalen', 'sound bowl', 'meditation', 'klangtherapie'],
    language: 'de',
  },
  {
    question: 'Habt ihr Produkte für Schwangere?',
    answer:
      'Ja, wir haben Produkte, die für Schwangere geeignet sind, wie z. B. bestimmte Massageöle und Naturkosmetik. Bitte beachte jedoch, dass du bei Schwangerschaft immer zuerst mit deiner Ärztin oder deinem Arzt sprechen solltest, bevor du neue Produkte verwendest. Unsere Mitarbeiter im Ladengeschäft beraten dich gerne persönlich.',
    tags: ['schwangerschaft', 'schwangere', 'sicher', 'baby'],
    language: 'de',
  },
  {
    question: 'Sind eure Produkte biologisch / zertifiziert?',
    answer:
      'Viele unserer Produkte sind bio-zertifiziert oder aus kontrolliertem Anbau. Entsprechende Zertifizierungen sind bei den Produkten jeweils ausgewiesen (z. B. "Bio" im Produktnamen). Wir legen grossen Wert auf natürliche Qualitätsprodukte ohne unnötige Zusatzstoffe.',
    tags: ['bio', 'organic', 'zertifiziert', 'natürlich', 'qualität'],
    language: 'de',
  },

  // ── MANA SHOP: Kontakt & Laden (DE) ─────────────────────────────────────

  {
    question: 'Wo befindet sich der Mana Shop?',
    answer:
      'Unser Ladengeschäft befindet sich an der folgenden Adresse: Blankweg 2b, 3072 Bern-Ostermundigen, Schweiz. Öffnungszeiten: Montag bis Freitag 10:00–19:00 Uhr, Samstag 10:00–16:00 Uhr. Du erreichst uns telefonisch unter +41 78 200 90 49 oder per E-Mail an info@mana-shop.ch.',
    tags: ['adresse', 'laden', 'öffnungszeiten', 'standort', 'bern', 'ostermundigen'],
    language: 'de',
  },
  {
    question: 'Wie kann ich den Mana Shop kontaktieren?',
    answer:
      'Du kannst uns folgendermassen erreichen:\n• Telefon: +41 78 200 90 49\n• E-Mail: info@mana-shop.ch\n• Persönlich: Blankweg 2b, 3072 Bern-Ostermundigen\n• Öffnungszeiten: Mo–Fr 10:00–19:00, Sa 10:00–16:00',
    tags: ['kontakt', 'telefon', 'email', 'erreichbar'],
    language: 'de',
  },

  // ── MANA KENDRA: Therapien & Leistungen (DE) ────────────────────────────

  {
    question: 'Was ist Mana Kendra?',
    answer:
      'Mana Kendra ist ein ganzheitliches Gesundheitszentrum in Bern-Ostermundigen, das westliche, indische und chinesische Medizin vereint. Wir bieten Körpertherapien, Coaching und Bewusstseinsarbeit für inneren Frieden und körperliches Gleichgewicht an. Das Zentrum arbeitet mit zertifizierten Therapeutinnen und Therapeuten in einem ruhigen, professionellen Umfeld.',
    tags: ['mana kendra', 'gesundheitszentrum', 'therapie', 'ganzheitlich', 'bern'],
    language: 'de',
  },
  {
    question: 'Welche Massagen und Therapien bietet Mana Kendra an?',
    answer:
      'Unser Angebot umfasst:\n• Körperarbeit: Klassische Massage, Sportmassage, Lomi Lomi Nui, Reflexzonenmassage, Schröpftherapie, Craniosacral-Therapie\n• Energie & Bewegung: Yoga, Meditation, Atemarbeit (Breathwork), Qi Gong\n• Ayurveda: Abhyanga (Ganzkörpermassage), Shirodhara (Stirnölguss), Mukabhyanga (Gesichtsmassage), Marmatherapie\n• Coaching & Psychotherapie: Burnout-Begleitung, Traumatherapie, Hypnotherapie, Life Coaching, Familienberatung\n• Frauengesundheit: Beckenbodentraining, Zyklusbegleitung, Wochenbettbetreuung\n• Spezialbehandlungen: Klangschalenmassage, Kinesiologie, Ernährungsberatung',
    tags: ['therapie', 'massage', 'behandlung', 'ayurveda', 'yoga', 'coaching', 'lomi lomi'],
    language: 'de',
  },
  {
    question: 'Was kostet eine Behandlung bei Mana Kendra?',
    answer:
      'Unsere Therapiepreise sind wie folgt:\n• 60 Minuten: CHF 120 (Selbstzahler) / CHF 140 (Krankenkasse)\n• 90 Minuten: CHF 180 (Selbstzahler) / CHF 210 (Krankenkasse)\n• 120 Minuten: CHF 240 (Selbstzahler) / CHF 280 (Krankenkasse)\nEine kostenlose Erstberatung ist ebenfalls verfügbar. Für Kurspreise bitte direkt anfragen.',
    tags: ['preis', 'kosten', 'tarif', 'behandlung', 'massage', 'therapie'],
    language: 'de',
  },
  {
    question: 'Werden die Behandlungen von der Krankenkasse übernommen?',
    answer:
      'Ja, viele unserer Therapien werden von Zusatzversicherungen anerkannt. Wir sind nach EMR und QualiCert zertifiziert. Folgende Krankenkassen anerkennen unsere Leistungen: Groupe Mutuel, Assura, AXA, CSS, Helsana, Sanitas, SWICA und weitere. Bitte kläre die genaue Kostenübernahme vorab mit deiner Krankenkasse.',
    tags: ['krankenkasse', 'versicherung', 'kostenübernahme', 'emr', 'qualicert', 'zusatzversicherung'],
    language: 'de',
  },
  {
    question: 'Wie kann ich einen Termin bei Mana Kendra buchen?',
    answer:
      'Du kannst einen Termin online über unsere Website buchen oder uns direkt kontaktieren:\n• Telefon: +41 78 200 90 49\n• E-Mail: info@mana-kendra.ch\n• Persönlich: Blankweg 2b, 3072 Bern-Ostermundigen\nEine kostenlose Erstberatung ist ebenfalls möglich. Öffnungszeiten: Mo–Fr 10:00–19:00, Sa 10:00–16:00.',
    tags: ['termin', 'buchen', 'booking', 'appointment', 'reservierung'],
    language: 'de',
  },
  {
    question: 'Bietet ihr auch Ayurveda-Behandlungen an?',
    answer:
      'Ja, Ayurveda ist eines unserer Kernbereiche. Unser zertifizierter Ayurveda-Arzt Sreekumar Gopalan (VSAMT-zertifiziert) bietet an: Dosha-Analyse, Pulsdiagnose, Ernährungsberatung, Abhyanga-Ganzkörpermassage, Shirodhara-Stirnölguss, Mukabhyanga-Gesichtsmassage und Marmatherapie. Termine können online gebucht werden.',
    tags: ['ayurveda', 'abhyanga', 'shirodhara', 'dosha', 'pulsdiagnose', 'sreekumar'],
    language: 'de',
  },
  {
    question: 'Welche Kurse und Workshops bietet Mana Kendra an?',
    answer:
      'Wir bieten regelmässig Kurse und Workshops an, darunter:\n• Massageausbildung (14 Module, z. B. Nacken-/Migränmassage, Schröpfung, Lomi Lomi, Hot Stone, Reflexzonenmassage, Schwangerschaftsmassage, Sportmassage)\n• Breathwork & Meditation für Anfänger\n• Ayurveda Intensiv-Retreat\n• Tantramassage-Workshops (für Männer und Frauen getrennt)\n• Achtsamkeits- und Meditationskurse\nFür aktuelle Termine und Preise besuche unsere Website oder kontaktiere uns.',
    tags: ['kurse', 'workshops', 'ausbildung', 'massage', 'breathwork', 'meditation', 'yoga'],
    language: 'de',
  },
  {
    question: 'Kann ich Räume bei Mana Kendra mieten?',
    answer:
      'Ja, wir vermieten Seminar- und Praxisräume sowie Kursräume. Ideal für Therapeuten, Coaches oder Kursleiter. Für Verfügbarkeit, Grössen und Preise kontaktiere uns bitte direkt unter info@mana-kendra.ch oder +41 78 200 90 49.',
    tags: ['raumvermietung', 'seminarraum', 'praxisraum', 'mieten', 'kursraum'],
    language: 'de',
  },
  {
    question: 'Bietet ihr auch Firmen-Wellness oder Corporate-Angebote an?',
    answer:
      'Ja, Mana Kendra bietet Corporate Wellness Lösungen für Unternehmen an, zum Beispiel Stressprävention, Entspannungsmassagen am Arbeitsplatz, Burnout-Prävention und Team-Workshops. Kontaktiere uns für ein individuelles Angebot unter info@mana-kendra.ch.',
    tags: ['corporate', 'firmen', 'wellness', 'betrieblich', 'burnout', 'prävention'],
    language: 'de',
  },

  // ── MANA SHOP: Orders & Shipping (EN) ──────────────────────────────────

  {
    question: 'What are the shipping costs?',
    answer:
      'We offer three shipping options: Standard (Versand B) at CHF 9.50 with delivery in 3–12 business days, Priority (Versand A) at CHF 14.00 with delivery in 1–3 business days, and Express at CHF 19.00 for next-business-day delivery (orders placed before 2:00 PM with immediate payment). Shipping is free on orders over CHF 100.',
    tags: ['shipping', 'delivery', 'costs', 'versand'],
    language: 'en',
  },
  {
    question: 'Which countries do you ship to?',
    answer:
      'We ship to Switzerland, Liechtenstein, Austria, and Germany. Free shipping over CHF 100 applies to all delivery countries. Express shipping is available within Switzerland only.',
    tags: ['shipping', 'countries', 'international', 'delivery'],
    language: 'en',
  },
  {
    question: 'Can I pick up my order in store?',
    answer:
      'Yes! You can collect your order at our store at Blankweg 2b, 3072 Bern-Ostermundigen. Your order will be ready within 14 calendar days of confirmation. Uncollected items will be returned to stock after that. Store hours: Mon–Fri 10:00–19:00, Sat 10:00–16:00.',
    tags: ['pickup', 'collect', 'store', 'in-person'],
    language: 'en',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept: TWINT, PostFinance Card, Visa, Mastercard, American Express, PayPal, Klarna, Apple Pay, Google Pay, Samsung Pay, and Shop Pay. All payments are secure and encrypted.',
    tags: ['payment', 'pay', 'credit card', 'twint', 'paypal'],
    language: 'en',
  },
  {
    question: 'How do I return an item?',
    answer:
      'You have 14 days after receiving your order to request a return. Items must be unworn, unused, tagged, and in original packaging. Send your return request to info@mana-shop.ch or through your customer account. We will send a prepaid return label once approved. Do not send parcels without prior authorisation.',
    tags: ['return', 'refund', 'exchange', 'send back'],
    language: 'en',
  },
  {
    question: 'How long does a refund take?',
    answer:
      'Once we receive and inspect the returned item, your refund will be processed within 10 business days to your original payment method. Additional processing time may apply depending on your bank.',
    tags: ['refund', 'money back', 'return'],
    language: 'en',
  },

  // ── MANA KENDRA: Services (EN) ─────────────────────────────────────────

  {
    question: 'What is Mana Kendra?',
    answer:
      'Mana Kendra is a holistic health centre in Bern-Ostermundigen combining Western, Indian, and Chinese medicine under one roof. We offer body therapies, coaching, and consciousness work for inner peace and physical balance, with certified practitioners in a calm, professional environment.',
    tags: ['mana kendra', 'health centre', 'holistic', 'therapy', 'bern'],
    language: 'en',
  },
  {
    question: 'What treatments and therapies does Mana Kendra offer?',
    answer:
      'Our services include:\n• Body work: classical massage, sports massage, Lomi Lomi Nui, reflexology, cupping, craniosacral therapy\n• Energy & movement: yoga, meditation, breathwork, Qi Gong\n• Ayurveda: Abhyanga, Shirodhara, Mukabhyanga, Marma therapy\n• Coaching & therapy: burnout support, trauma therapy, hypnotherapy, life coaching, family counselling\n• Women\'s health: pelvic floor training, cycle support, postpartum care\n• Sound healing, kinesiology, nutritional counselling',
    tags: ['therapy', 'massage', 'treatment', 'ayurveda', 'yoga', 'coaching'],
    language: 'en',
  },
  {
    question: 'How much does a treatment at Mana Kendra cost?',
    answer:
      'Our therapy rates are:\n• 60 minutes: CHF 120 (self-pay) / CHF 140 (insurance rate)\n• 90 minutes: CHF 180 (self-pay) / CHF 210 (insurance rate)\n• 120 minutes: CHF 240 (self-pay) / CHF 280 (insurance rate)\nA free initial consultation is also available.',
    tags: ['price', 'cost', 'rate', 'treatment', 'therapy'],
    language: 'en',
  },
  {
    question: 'Is treatment covered by health insurance?',
    answer:
      'Many of our therapies are recognised by Swiss supplemental health insurance providers. We are certified by EMR and QualiCert. Recognised insurers include Groupe Mutuel, Assura, AXA, CSS, Helsana, Sanitas, SWICA, and others. Please check with your insurance provider in advance to confirm your specific coverage.',
    tags: ['insurance', 'health insurance', 'krankenkasse', 'coverage', 'emr'],
    language: 'en',
  },
  {
    question: 'How do I book an appointment at Mana Kendra?',
    answer:
      'You can book online via our website or contact us directly:\n• Phone: +41 78 200 90 49\n• Email: info@mana-kendra.ch\n• In person: Blankweg 2b, 3072 Bern-Ostermundigen\nA free initial consultation is available. Opening hours: Mon–Fri 10:00–19:00, Sat 10:00–16:00.',
    tags: ['book', 'appointment', 'booking', 'reservation', 'schedule'],
    language: 'en',
  },
  {
    question: 'Do you offer Ayurveda treatments?',
    answer:
      'Yes, Ayurveda is one of our core specialities. Our certified Ayurvedic physician Sreekumar Gopalan (VSAMT certified) offers: dosha analysis, pulse diagnosis, nutritional counselling, Abhyanga full-body oil massage, Shirodhara warm forehead oil treatment, Mukabhyanga facial massage, and Marma therapy for vital energy points.',
    tags: ['ayurveda', 'abhyanga', 'shirodhara', 'dosha', 'pulse diagnosis'],
    language: 'en',
  },
  {
    question: 'Do you offer courses and workshops?',
    answer:
      'Yes, we regularly run courses and workshops including: massage certification modules (neck/migraine, cupping, Lomi Lomi, hot stone, reflexology, pregnancy massage, sports massage), breathwork & meditation for beginners, Ayurveda immersion, and mindfulness courses. Contact us for current dates and pricing.',
    tags: ['courses', 'workshops', 'training', 'massage', 'breathwork', 'meditation'],
    language: 'en',
  },
  {
    question: 'Do you offer corporate wellness programmes?',
    answer:
      'Yes, Mana Kendra offers corporate wellness solutions including stress prevention, workplace massage, burnout prevention, and team workshops. Contact us at info@mana-kendra.ch for a tailored offer.',
    tags: ['corporate', 'business', 'wellness', 'workplace', 'burnout'],
    language: 'en',
  },
];

// ---------------------------------------------------------------------------
// Seeder
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  await connectDatabase();

  console.log(`[Seed] Clearing existing FAQ entries...`);
  await Faq.deleteMany({});

  console.log(`[Seed] Inserting ${faqs.length} FAQ entries...`);
  const inserted = await Faq.insertMany(faqs);

  console.log(`[Seed] Done. ${inserted.length} FAQs inserted successfully.`);

  await mongoose.disconnect();
  console.log('[Seed] Database connection closed.');
}

seed().catch((err) => {
  console.error('[Seed] Fatal error:', err);
  process.exit(1);
});
