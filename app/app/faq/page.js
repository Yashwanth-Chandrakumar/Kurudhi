import React from 'react';

const faqPage = () => {
  const faqs = [
    {
      question: 'How can I register as a blood donor?',
      answer: 'Go to the “Become a Donor” page, fill in your personal details, agree to our Terms & Conditions, and submit your application.',
    },
    {
      question: 'Who is eligible to donate blood?',
      answer: 'Anyone aged 18–60, weighing at least 50 kg, in good health, and with the proper donation interval (90 days for men, 120 for women).',
    },
    {
      question: 'How will I be notified during an emergency?',
      answer: 'We will contact you via SMS, email, or phone call, based on the details you provided.',
    },
    {
      question: 'Can I decline a request if I’m unavailable?',
      answer: 'Yes, you are always free to decline, reschedule, or opt out without any penalty.',
    },
    {
      question: 'Is it safe to donate blood through Kurudhi Koodai?',
      answer: 'Absolutely. All donations are coordinated with licensed hospitals and certified blood banks using sterile equipment.',
    },
    {
      question: 'Can I update my details after registering?',
      answer: 'Yes. You can log in to your profile or contact our support team to update your info or availability.',
    },
    {
      question: 'Do I need to fast before donating?',
      answer: 'No. You should have a light, non-fatty meal before donating and stay hydrated.',
    },
    {
      question: 'Is my personal information safe on this site?',
      answer: 'Yes. We take data privacy seriously and use your information only for coordination during blood requests, with your consent.',
    },
    {
      question: 'What if I faint or feel unwell after donating?',
      answer: 'This is rare. Rest, hydrate, and if needed, consult the medical team on-site or your doctor. Inform us if you\'re unwell.',
    },
    {
      question: 'How long does the donation process take?',
      answer: 'The full process, including registration and rest, takes around 30–45 minutes. The actual blood draw takes 10–15 minutes.',
    },
    {
      question: 'Will I be paid for donating blood?',
      answer: 'No. Blood donation is a voluntary service. Kurudhi Koodai does not support paid donations to maintain safety and integrity.',
    },
    {
      question: 'Can I donate blood if I’m on medication?',
      answer: 'It depends on the medication. Please consult your doctor or a blood bank before donating.',
    },
    {
      question: 'What happens after I donate?',
      answer: 'Your donation is logged, and you may receive a thank-you message. With consent, the recipient\'s family may also be informed of your help.',
    },
  ];

  return (
    <section className="bg-background py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-primary mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details key={index} className="group bg-card p-4 rounded-lg shadow-md">
              <summary className="flex items-center justify-between cursor-pointer text-lg font-semibold text-card-foreground">
                {faq.question}
                <span className="transform transition-transform duration-300 group-open:rotate-180">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default faqPage;
