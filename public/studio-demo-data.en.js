window.STUDIO_DEMO_DATA_EN = {
  j1: {
    name: "New Lead → First Class",
    scenario: "<b>Sarah M.</b> · first-time visitor, just found Modo Yoga",
    clock: "7:02",
    scenes: [
      { step:"Welcome",
        pre:[
          {from:"system", text:"Sarah created an account on modoyoga.com"},
          {from:"ai", text:"Hi Sarah! 👋 It's Modo Yoga, so glad you found us. What's drawing you to the mat right now, and is there anything holding you back?"},
          {from:"member", text:"Hi! Honestly, stress relief + flexibility. A little nervous I'm not bendy enough 😅"},
          {from:"ai", text:"That's the most common worry, and the least true 🌿 Flexibility is something class gives you, not something you need first. You're exactly in the right place."}
        ],
        behind:{ trigger:"Account created, Mariana Tek fires a webhook.",
          does:"Sends a warm welcome within minutes and asks about goals & hesitations, so everything after is personalized.",
          prod:"Transactional SMS reaches <b>97%</b> of members, vs only 7% for marketing. The welcome is classified transactional, so it actually lands." } },

      { step:"Personalized intro offer",
        pre:[
          {from:"ai", text:"Want to make starting easy? Our 2-week intro is unlimited classes for $40, the best way to find your rhythm."},
          {from:"member", text:"Yes please!"},
          {from:"ai", text:"Love it 🙌 Here's your secure checkout, it opens right in Mariana Tek:", mtlink:"modoyoga.marianatek.com/intro"}
        ],
        mt:{ kind:"checkout", title:"Checkout",
          plan:{ name:"2-Week Unlimited Intro", price:"$40", per:" / 2 weeks", perks:["Unlimited classes for 14 days","Every class at Modo Mondo","No commitment, cancel anytime"] },
          confirm:[ {from:"system", text:"💳 Payment confirmed · 2-week unlimited", style:"good"} ] },
        behind:{ trigger:"Sarah replied with intent → Compass recommends the right plan.",
          does:"Sends a personalized intro with a checkout link that opens straight in Mariana Tek, no app to install, no friction.",
          prod:"<b>280</b> active plans across 57 studios. Most common intros: 1-month 44%, 30-day 25%, 2-week 17%." } },

      { step:"Purchase detected",
        pre:[
          {from:"ai", text:"You're all set, Sarah! 🎉 Your two weeks of unlimited classes start today. Now the fun part, let's get your first class on the calendar."}
        ],
        behind:{ trigger:"Purchase → Mariana Tek records the purchase.",
          does:"Detects the purchase instantly and moves straight to booking, no dead air, no waiting.",
          prod:"<b>186</b> members in the sample bought an intro but never booked a class. Closing that gap is the whole game." } },

      { step:"Booking via Mariana Tek",
        pre:[ {from:"ai", text:"Here's tomorrow's schedule at Modo Mondo 🗓 Tap to grab your first-class spot:", mtlink:"modoyoga.marianatek.com/book"} ],
        mt:{ kind:"book", title:"Book a class", date:"Tomorrow · Wed · Modo Mondo",
          slots:[
            { time:"7:00 AM", cls:"Hot Flow", who:"Martha", spots:"6 spots",
              confirm:[{from:"ai", text:"Booked! ☀️ 7:00 AM Hot Flow with Martha, tomorrow. Martha is the warmest human, you'll feel right at home. I'll send a reminder the morning of."}] },
            { time:"5:30 PM", cls:"Deep Stretch", who:"Liam", spots:"9 spots",
              confirm:[{from:"ai", text:"Booked! 🌙 5:30 PM Deep Stretch with Liam, tomorrow. A perfect, gentle way to ease in. I'll send a reminder beforehand."}] }
          ] },
        behind:{ trigger:"Compass sends a booking link → tapping it opens the Modo Mondo schedule in Mariana Tek.",
          does:"Drops a deep link to the live schedule. Sarah books in Mariana Tek, the same app she'll use for every class after this.",
          prod:"Booked against live availability in Mariana Tek, the same schedule the front desk runs on." } },

      { step:"Studio Manager briefing",
        pre:[ {from:"system", text:"The next morning, at the front desk"} ],
        ops:`<div class="opscard">
          <div class="opscard-h">Front-desk briefing · Modo Mondo · today</div>
          <div class="briefrow"><div class="av">S</div><div><div class="bn">Sarah M. <span class="tag">First visit</span></div><div class="bd">7:00 AM · Hot Flow · 2-week intro</div></div></div>
          <div class="brief-line"><b>Goals:</b> stress relief, flexibility, a little nervous</div>
          <div class="brief-script">“Hi Sarah! So glad you’re here, Martha will take great care of you. First time? Grab a spot near the door if you’d like.”</div>
        </div>`,
        behind:{ trigger:"Daily briefing, generated every morning before classes.",
          does:"Hands the front desk a ready-to-read profile and a personalized greeting script, so staff greet every first-timer by name.",
          prod:"The personal touches, the goals and the greeting script, come from Compass. Mariana Tek stores the booking, not the human context." } },

      { step:"Reminder → no-show → recovery",
        pre:[
          {from:"ai", text:"Morning, Sarah! ☀️ Reminder: Hot Flow with Martha at 7:00 AM today. Arrive 10 minutes early, water and a mat are all you need."},
          {from:"system", text:"⚠️ 7:05 AM · Sarah didn't check in (no-show)", style:"alert"},
          {from:"ai", text:"Hey Sarah, looks like this morning got away from you. Life happens, truly 💛 No charge, here's the schedule whenever you're ready to rebook:", mtlink:"modoyoga.marianatek.com/book"}
        ],
        mt:{ kind:"book", title:"Reschedule", date:"Today & tomorrow · Modo Mondo",
          slots:[
            { time:"5:30 PM", cls:"Deep Stretch", who:"Liam", spots:"Tonight",
              confirm:[{from:"ai", text:"Done! 🌙 5:30 PM Deep Stretch with Liam tonight. Gentle and grounding, exactly right after a hectic morning. You've got this."}] },
            { time:"7:00 AM", cls:"Hot Flow", who:"Martha", spots:"Tomorrow",
              confirm:[{from:"ai", text:"Booked! ☀️ 7:00 AM with Martha again tomorrow. I believe in you, see you on the mat."}] }
          ] },
        behind:{ trigger:"No-show detected via Mariana Tek webhook → recovery within 15 minutes.",
          does:"Reaches out the moment a first-timer slips, with warmth and a reschedule link, before they drift away for good.",
          prod:"6.7% of bookings cancel; <b>Late Cancel and No Show are the #1 and #2 charge items</b> in production. This one play protects first-class attendance, the strongest predictor of staying." } },

      { step:"Attended → next booking",
        pre:[
          {from:"system", text:"✓ Sarah checked in · Deep Stretch with Liam", style:"good"},
          {from:"ai", text:"You came back AND showed up 👏 How did it feel?"},
          {from:"member", text:"Honestly? Amazing. So calm afterward."},
          {from:"ai", text:"That's the Modo magic 🌿 Want to lock in your next one while the feeling's fresh? I'll text you the schedule for Thursday."},
          {from:"member", text:"Yes! 😄"}
        ],
        behind:{ trigger:"Check-in recorded → her class count goes up.",
          does:"Closes the loop on a great first visit and immediately plants the next one, how a one-time visit becomes a habit.",
          prod:"Only <b>13.5%</b> of members get past 5 classes. Every nudge in the first two weeks compounds, and flows straight into the conversion journey →" } }
    ]
  },

  j2: {
    name: "Membership Conversion",
    scenario: "<b>Sarah M.</b> · two weeks in, just finished her 5th class on the intro",
    clock: "6:48",
    scenes: [
      { step:"5-class milestone",
        pre:[
          {from:"system", text:"🎉 Sarah just checked in · that's class #5", style:"good"},
          {from:"ai", text:"Sarah! That's 5 classes in two weeks 🔥 You've gone from \"not bendy enough\" to a genuine regular. I'm so proud of you."},
          {from:"member", text:"I'm kind of obsessed now 😅"}
        ],
        behind:{ trigger:"Her class count hits 5 → milestone reached.",
          does:"Celebrates the moment and opens the conversion conversation at the point of peak enthusiasm.",
          prod:"<b>42%</b> of memberships start as an intro. The 5-class mark is the sweet spot to convert." } },

      { step:"Personalized recommendation",
        pre:[
          {from:"ai", text:"Real talk: at the rate you're going (~3× a week 📈), a membership just makes sense. You'd save real money and never think about passes again."},
          {from:"member", text:"I was actually wondering about that"}
        ],
        behind:{ trigger:"Visit frequency ≥ 8/month → recommend Unlimited (under 8 → limited).",
          does:"Recommends the right tier from how Sarah actually trains, not a generic upsell.",
          prod:"Tier is chosen from real attendance: <b>&lt; 8 visits/mo → limited, ≥ 8 → unlimited.</b>" } },

      { step:"Market-specific math",
        pre:[
          {from:"ai", text:"Here's the Modo Mondo math 📊\n• 10-class pack: $250 → $25/class\n• Unlimited: $160/mo → about $12/class at your pace\nYou'd basically be paying half."},
          {from:"member", text:"ok that's a no-brainer 😂"}
        ],
        behind:{ trigger:"Studio market = NYC → lead with the credit-pack comparison.",
          does:"Tailors the pitch to the market. NYC members lean on credit packs, so Compass frames membership against pack pricing. (Canada leads with \"continue at the membership rate.\")",
          prod:"<b>New step from production:</b> NYC leans credits, Canada leans memberships, the same pitch doesn't work in both markets." } },

      { step:"Checkout via Mariana Tek",
        pre:[ {from:"ai", text:"Want me to switch you over? Tap to activate, your intro rolls straight into Unlimited:", mtlink:"modoyoga.marianatek.com/membership"} ],
        mt:{ kind:"checkout", title:"Membership",
          plan:{ name:"Unlimited Membership", price:"$160", per:" / month", perks:["Unlimited classes at Modo Mondo","Free mat & towel service","Member-only events & community"] },
          confirm:[ {from:"system", text:"💳 Payment confirmed · Unlimited membership", style:"good"} ] },
        behind:{ trigger:"Sarah taps the link → Mariana Tek checkout → a new membership is created.",
          does:"Sends a checkout link; Sarah confirms in Mariana Tek (Stripe / MT Web). No redirects, no re-entering card details.",
          prod:"Direct Mariana Tek checkout, the lowest-friction path from intent to member." } },

      { step:"Activation & onboarding",
        pre:[
          {from:"ai", text:"Welcome to the Modo family, Sarah 🎉 You're officially Unlimited, and don't worry, I'll retire the intro nudges 😉"},
          {from:"ai", text:"To get you started: I've saved Martha's Thursday Hot Flow to your favorites, and our Modo Mondo community is here whenever you want it 🌿", link:"Join the Modo Mondo community"},
          {from:"member", text:"This is the best. Thank you 🙏"}
        ],
        behind:{ trigger:"Purchase → pipeline set to “Membership Activated.”",
          does:"Flips Sarah to member, suppresses all intro-phase messages instantly, and starts the new-member onboarding sequence.",
          prod:"Activation cleanly hands off from \"convert\" mode to \"onboard & retain\" mode, no crossed wires, no stray intro texts." } },

      { step:"Conversion logged",
        pre:[ {from:"system", text:"✓ Membership active · welcome aboard, Sarah", style:"good"} ],
        ops:`<div class="opscard">
          <div class="opscard-h">Conversion event · logged</div>
          <table class="convtbl">
            <tr><td>Member</td><td>Sarah M. · Modo Mondo</td></tr>
            <tr><td>Intro type</td><td>2-week unlimited</td></tr>
            <tr><td>Days to convert</td><td>14</td></tr>
            <tr><td>Visits at conversion</td><td>5</td></tr>
            <tr><td>State before</td><td>high-velocity (≈3×/week)</td></tr>
            <tr><td>New plan</td><td>Unlimited · $160/mo</td></tr>
          </table>
        </div>`,
        behind:{ trigger:"Conversion recorded for analytics.",
          does:"Logs the full conversion story so the studio can see exactly what drives members, and do more of it.",
          prod:"Every conversion becomes data: which intro, how many classes, how many days. The loop that makes the next pitch smarter." } }
    ]
  }
};
