export const participants = {
  lead: {
    id: 'lead',
    label: 'Member or Lead',
    short: 'Member',
    description: 'Someone interested in or attending your studio',
    color: 'sky',
  },
  ai: {
    id: 'ai',
    label: 'Compass Assistant',
    short: 'Compass',
    description: 'Sends messages, books classes, and follows up automatically',
    color: 'brand',
  },
  mt: {
    id: 'mt',
    label: 'Booking System',
    short: 'Booking System',
    description: 'Mariana Tek — where classes are scheduled and purchases are made',
    color: 'slate',
  },
  mgr: {
    id: 'mgr',
    label: 'Studio Team',
    short: 'Studio Team',
    description: 'Managers and front desk staff at the studio',
    color: 'amber',
  },
  ghl: {
    id: 'ghl',
    label: 'Lead Tracking',
    short: 'Lead Tracking',
    description: 'Tracks where each person is in your sales process',
    color: 'teal',
  },
};

export const stages = ['New Lead', 'First Class', '5 Class Pack', 'Membership'];

export function step(from, to, text, dashed) {
  return { type: 'step', from, to, text, dashed: !!dashed };
}
export function note(text, anchor) {
  return { type: 'note', text, anchor: anchor || null };
}
export function alt(...branches) {
  return { type: 'alt', branches };
}
export function branch(label, isElse, ...steps) {
  return { label, else: !!isElse, steps };
}

export const journeys = [
  {
    id: 'new-lead-first-class',
    stage: 0,
    parallel: false,
    title: 'New Lead → First Class',
    tagline: 'From first contact to attending class one.',
    items: [
      note('Journey 1 – New Lead to First Class'),
      step('lead', 'mt', 'Submit lead form or walk in', false),
      step('mt', 'ai', 'Webhook trigger – new lead created', true),
      step('ai', 'lead', 'Welcome message (SMS/email) + fitness goals & hesitations', false),
      alt(branch('Responds', false, step('ai', 'lead', 'Personalized intro offer with Stripe payment link', false))),
      alt(
        branch(
          'First visit – no intro purchased (drop-in, karma, guest)',
          false,
          step('ai', 'lead', '2–4hrs after class – personalized intro offer pitch', false)
        )
      ),
      step('lead', 'mt', 'Purchases intro offer', true),
      step('mt', 'ghl', 'Update pipeline status', true),
      step(
        'ai',
        'lead',
        '"I see you got the intro pack! We have spots tomorrow 7 AM or 5:30 PM. Which works for you?"',
        false
      ),
      step('lead', 'ai', 'Chooses time', true),
      step('ai', 'mt', 'Books class directly (no link)', false),
      alt(
        branch(
          'No booking within 2h',
          false,
          step('ai', 'lead', 'Reminder – "Don\'t forget to lock in your first class"', false)
        )
      ),
      step(
        'ai',
        'mgr',
        'Daily morning briefing – first-time attendees for today with paragraph overview and optional personalised welcome script per lead',
        false
      ),
      step('ai', 'lead', 'Pre-class reminder', false),
      alt(
        branch(
          'No-show or late cancel (MT webhook)',
          false,
          step('ai', 'lead', '"Life happens! Let\'s get you back on schedule — mornings or evenings?"', false),
          alt(
            branch('Rebooks', false, step('ai', 'mt', 'Update booking', false)),
            branch('No response', true, step('ai', 'ai', 'Flag as "at-risk", adjust cadence', false))
          )
        )
      ),
      step('ai', 'lead', 'Post-class check-in message', false),
      step(
        'ai',
        'lead',
        'Post-class booking nudge (timing customisable per studio) – "Lock in your next class"',
        false
      ),
    ],
  },
  {
    id: 'first-class-five-class',
    stage: 1,
    parallel: false,
    title: 'First Class → 5-Class Milestone',
    tagline: 'Building habit, catching drop-off, reading sentiment.',
    items: [
      note('Journey 2 – First Class to 5-Class Milestone'),
      step('mt', 'ai', 'Attendance recorded', true),
      step('ai', 'lead', 'After class 1 – reinforce decision, nudge next booking', false),
      alt(
        branch(
          'No-show at any class',
          false,
          step('ai', 'lead', 'Recovery message with conversational rebooking within 15 mins', false)
        )
      ),
      step('ai', 'lead', 'After each class – post-class nudge to book next class (timing customisable per studio)', false),
      step('ai', 'lead', 'Every 7 days – personalised reminder until class pass is completed', false),
      alt(
        branch(
          'Low velocity – less than 4 visits in 10 days',
          false,
          step('ai', 'lead', 'Encouraging message – make the most of remaining days + schedule suggestions', false),
          alt(
            branch(
              'Zero visits at Day 10',
              false,
              step('ai', 'mgr', 'Staff task – check in with member, zero visits at Day 10', false)
            )
          )
        ),
        branch(
          'High velocity – 4 or more visits in 10 days',
          true,
          step(
            'ai',
            'lead',
            'Celebratory message – membership as natural next step + cost-per-class math + purchase link',
            false
          )
        )
      ),
      alt(
        branch(
          'Mid-journey check-in',
          false,
          step('ai', 'lead', '14-day intro – light check-in on Day 7', false),
          step('ai', 'lead', '30-day intro – light check-in on Day 14', false)
        )
      ),
      step('ai', 'lead', 'After class 3 – sentiment check', false),
      alt(
        branch('Positive response', false, step('ai', 'ai', 'Continue standard upsell path', false)),
        branch(
          'Negative response',
          true,
          step('ai', 'ai', 'Classify objection (instructor, class type, etc.)', false),
          alt(
            branch('High-value member', false, step('ai', 'mgr', 'Alert – unhappy after class 3, recommend outreach', false)),
            branch('General member', true, step('ai', 'lead', 'Suggest new instructor/class type', false))
          )
        )
      ),
      step('ai', 'lead', 'After class 5 – celebrate progress, introduce membership offer with direct purchase link', false),
      alt(branch('No response at any stage', false, step('ai', 'ai', 'Flag as "at-risk", adjust cadence', false))),
    ],
  },
  {
    id: 'inactivity-churn-prevention',
    stage: 1,
    parallel: true,
    title: 'Inactivity & Churn Prevention',
    tagline: 'Runs in parallel — catches members before they drift away.',
    items: [
      note('Journey 3 – Inactivity / Churn Prevention'),
      step('mt', 'ai', 'Velocity drop or 14-day inactivity trigger', true),
      step('ai', 'ai', 'Detect early "near-churn" – no booking in 6 days for 3x/week attendee', false),
      step('ai', 'lead', 'Light-touch check-in before habit breaks', false),
      alt(
        branch(
          'Intro nearing expiry',
          false,
          step(
            'ai',
            'lead',
            'Message 1 – urgency email "Your intro ends in X days" + membership options + purchase link',
            false
          ),
          alt(
            branch(
              'No purchase after 24hrs',
              false,
              step('ai', 'lead', 'Message 2 – SMS with direct purchase link only', false),
              alt(
                branch(
                  'No purchase on last day',
                  false,
                  step('ai', 'lead', 'Message 3 – final day email, offer to answer questions', false)
                )
              )
            ),
            branch(
              'Student replies at any point',
              false,
              step('ai', 'ai', 'Pause sequence – route to conversational handling', false)
            )
          )
        )
      ),
      alt(
        branch(
          'Intro expired – no membership',
          false,
          step(
            'ai',
            'lead',
            '24hrs after expiry – "It\'s not too late" message with drop-in, pack, or membership options',
            false
          ),
          alt(branch('No response after 3 days', false, step('ai', 'ai', 'Exit to win-back campaign', false)))
        )
      ),
      step('ai', 'lead', 'Day 14 – "We miss you" message personalized by class history and sentiment', false),
      alt(
        branch(
          'No response',
          false,
          step('ai', 'lead', 'Day 17 – follow-up with relevant offer or class recommendation', false),
          alt(branch('Still no response', false, step('ai', 'mgr', 'Day 21 – manual outreach task', false)))
        )
      ),
      alt(
        branch(
          'Member texts "freeze" or "cancel"',
          false,
          step('ai', 'lead', 'Offer membership freeze instead of cancel', false),
          alt(
            branch(
              'Freeze accepted',
              false,
              step('ai', 'mt', 'Collect start/end dates, update freeze', false),
              step('ai', 'ghl', 'Save account status', false)
            ),
            branch(
              'Cancel confirmed',
              true,
              step('ai', 'mt', 'Process cancellation', false),
              step('ai', 'ai', 'Trigger win-back campaign at 3, 6, and 12 months', false)
            )
          )
        )
      ),
      step('mt', 'ai', 'Failed billing webhook', true),
      step('ai', 'lead', 'Empathetic payment retry message with secure update link', false),
      step('lead', 'mt', 'Updates payment details', false),
      step('ai', 'ghl', 'Update CRM on resolution', false),
      step('ai', 'ai', 'Churn model runs continuously – prioritise high risk students', false),
    ],
  },
  {
    id: 'membership-conversion',
    stage: 2,
    parallel: false,
    title: 'Membership Conversion',
    tagline: 'When a proven habit becomes a recurring member.',
    items: [
      note('Journey 4 – Membership Conversion'),
      step('mt', 'ai', 'Lead reaches 5-class milestone or responds positively to membership offer', true),
      step('ai', 'lead', 'Personalised membership recommendation with pricing tied to attendance pattern', false),
      note('Less than 8 visits/month → limited membership\n8 or more visits/month → unlimited membership', 'ai'),
      step('lead', 'mt', 'Purchases membership via Stripe/MT Web link', true),
      step('mt', 'ai', 'Membership purchased webhook', true),
      step('ai', 'ai', 'Suppress all intro-phase messages immediately', false),
      step('mt', 'ghl', 'Pipeline updated to "Membership Activated"', true),
      step('ai', 'lead', 'Welcome sequence – onboarding messages, class schedule suggestions, community intro', false),
      step(
        'ai',
        'ai',
        'Log conversion event – student ID, date, intro type, days to convert, visits at conversion',
        false
      ),
    ],
  },
  {
    id: 'win-back-lapsed',
    stage: 3,
    parallel: true,
    title: 'Win-Back — Lapsed Members',
    tagline: 'Timed re-engagement for cancelled or inactive members.',
    items: [
      note('Journey 5 – Win-Back – Lapsed Members'),
      step('ai', 'ai', 'Trigger at 3, 6, or 12 months post cancellation or inactivity', false),
      step('ai', 'lead', 'Tailored win-back message via SMS/email with time-sensitive offer', false),
      alt(
        branch(
          'Responds',
          false,
          step('ai', 'lead', 'Handle replies conversationally – answer questions, process reactivation', false),
          step('lead', 'mt', 'Reactivates profile', true),
          step('mt', 'ghl', 'Pipeline updated', true),
          step('ai', 'lead', 'Re-trigger Journey 1 welcome sequence', false)
        )
      ),
    ],
  },
];
