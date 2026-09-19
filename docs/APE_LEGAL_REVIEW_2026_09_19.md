# AP&E — closure, liability and refunds: findings and draft clauses

**Prepared by ccode, 2026-09-19. Owner queue item #5 of five.**

⚠️ **I am not a lawyer and this is not legal advice.** Everything below is
drafting work for a licensed attorney to review, edit and sign off before any
of it is published. Two of the findings (§1 and §7) are the kind of thing that
decides whether a liability shield actually works, so they should go to counsel
even if nothing else does.

What I did: read the published Terms (`web/content/legal/terms.html`, 383 KB,
30 sections + 15 appendices) and Privacy Policy (56 KB) end to end against the
three things you named — LLC closure, liability, refunds — plus the live
purchase surfaces in the app.

**The existing Terms are genuinely thorough.** Most of what I expected to be
missing is already there and well drafted: the safety disclaimers (§26.3 "No
Professional Advice", §26.7 "not calibrated measurement instruments", §27.12
personal injury / wiring / equipment damage) cover the field-hazard exposure
properly, and §10.2 already defines "Lifetime" honestly. The gaps below are
specific, not general.

---

## SUMMARY — seven findings

| # | Finding | Severity | Whose call |
|---|---|---|---|
| 1 | **No legal entity is named anywhere.** Zero occurrences of "LLC", "Inc.", "Limited Liability Company" or a state of formation in either document | **Highest** | Owner supplies the facts, lawyer drafts |
| 2 | **No cessation-of-operations clause at all**, against a $99.99 "Lifetime" product | **High** | Owner decides the promises, lawyer drafts |
| 3 | **Point-of-sale doesn't say what "Lifetime" means** — the honest definition is 383 KB away behind a link | **High** | Owner ratifies the copy, I can apply it |
| 4 | **The Terms cite a "Refund & Subscription Policy" that does not exist** — three times | Medium | Owner picks option A or B |
| 5 | Refunds: correct about the stores, silent about everything else | Medium | Owner + lawyer |
| 6 | Liability cap is conventional and fine, with two soft spots | Low–Medium | Lawyer |
| 7 | **§29.5 is not actually an arbitration agreement**, but §29.10 waives class actions anyway | **High** | Lawyer |

---

## 1 · No legal entity is named anywhere

**What's there now.** §1.1 makes the agreement between the user and
*"Pro Audio Training Academy ('Pro Audio Training Academy,' 'Academy,'
'Company,' 'we,' 'our,' or 'us')"*. §3.2 defines "Academy" as
*"Pro Audio Training Academy, including its mobile applications, websites …
successors, and authorized representatives."*

I searched both documents. **"LLC" appears 0 times. "Limited Liability" 0.
"Inc." 0. No state of formation, no registered address, no entity number.**

**Why it matters.** The limitation of liability (§27), the indemnity (§28) and
the warranty disclaimers (§26) all run in favour of "Pro Audio Training
Academy". If that name is a fictitious business name / DBA and the registered
entity is something else, then the party those protections run to is ambiguous,
and the most natural reading is that you contracted personally. **The shield an
LLC exists to provide comes from contracting AS the LLC** — naming it is most
of the work, and right now it isn't named.

The same applies to the App Store and Play listings, the merchant records, and
the Resend "from" identity: these should all resolve to one legal name, and a
mismatch between the seller of record and the contracting party is exactly what
a plaintiff's lawyer looks for first.

**Only you can supply these:**

1. The exact registered name (e.g. `CB Creative Services LLC`) — the bundle id
   is `com.cbcreativeservices.apestudio` and the GitHub org is
   `cbcreativeservices-crypto`, so I can guess, but I am not putting a guess in
   a contract.
2. The state of formation.
3. Whether "Pro Audio Training Academy" is registered as a DBA/FBN of that
   entity in your county/state, or is only a brand name.
4. A registered address for legal notices (§29.4 currently gives only an email).

**Draft replacement for §1.1, first paragraph:**

> These Terms of Service ("Terms") constitute a legally binding agreement
> between you ("you," "your," or "User") and **[REGISTERED ENTITY NAME], a
> [STATE] limited liability company, doing business as Pro Audio Training
> Academy** ("Pro Audio Training Academy," "Academy," "Company," "we," "our,"
> or "us") governing your access to and use of …

**Draft replacement for §3.2:**

> "Academy" means **[REGISTERED ENTITY NAME] d/b/a Pro Audio Training
> Academy**, including its mobile applications, websites, educational content,
> software, databases, online services, **members, managers,** employees,
> contractors, successors, and authorized representatives.

**Add to §29.4 (Contact for Legal Notices):**

> Legal notices must be sent in writing to **[REGISTERED ENTITY NAME],
> [REGISTERED ADDRESS]**, with a copy by email to
> info@proaudiotrainingacademy.com. Notice by email alone is not effective for
> the commencement of formal proceedings.

The same entity name then needs to propagate to §28 (indemnification, which
currently lists *"Pro Audio Training Academy and its owners, officers,
employees, contractors, instructors, affiliates, successors"* — "owners" should
become "members and managers" for an LLC) and to the Privacy Policy's opening
paragraph.

---

## 2 · There is no cessation-of-operations clause

**What's there now, and it's good as far as it goes.** §10.2 already does the
single most important thing:

> For purposes of these Terms, "Lifetime" means the operational lifetime of the
> Pro Audio Training Academy service. A Lifetime Purchase remains valid only
> while the Academy continues to operate the applicable Services supporting
> that purchase. A Lifetime Purchase does not guarantee: perpetual operation of
> the Academy …

Keep that. It is honest and it is the clause that matters.

**What's missing.** §24.14 covers discontinuing *individual features*. §24.15
says the Academy *intends* to operate long-term. §30.5 covers assignment on a
merger or sale of assets. **Nothing anywhere says what happens if the company
simply closes** — no notice period, no export window, no statement about
certificates already earned, no insolvency language. For a service selling a
$99.99 product with the word "Lifetime" on it, that is the gap.

**A word of caution before you decide what to promise.** A wind-down promise is
only worth what the company can perform. In an insolvency the assets belong to
the creditors, and a promise of refunds on closure that cannot be honoured is
worse than no promise — it converts a business failure into a consumer claim
and, if a court thinks you knew, potentially into a personal one. So the clause
below promises **notice, export and continued verification where reasonably
practicable**, and deliberately does **not** promise refunds on closure. That
is your call to overrule, with counsel.

**Draft new §31 (new top-level section, before the appendices):**

> ### 31. Cessation of Operations
>
> **31.1 Purpose.** This Section describes what happens if the Academy
> permanently ceases to operate the Services. It applies in addition to
> Section 24 (Service Availability) and Section 10 (Lifetime Purchases).
>
> **31.2 No Guarantee of Perpetual Operation.** The Academy is an operating
> business. No subscription, Lifetime Purchase, certificate, credential or
> Educational Record constitutes a guarantee that the Academy will continue to
> operate for any particular period. Section 10.2 defines "Lifetime" as the
> operational lifetime of the Services.
>
> **31.3 Advance Notice.** If the Academy determines to permanently cease
> operating the Services, it will use commercially reasonable efforts to
> provide **at least ninety (90) days'** advance notice to Users holding an
> active subscription, an active Lifetime Purchase, or an issued Credential.
> Notice may be given through the application, the Academy website, or email
> to the address associated with the Academy Account. Where a cessation is
> caused by insolvency, regulatory action, loss of an essential third-party
> service, or other circumstances outside the Academy's reasonable control,
> the notice period may be shorter than ninety days or, if unavoidable, may
> not be possible.
>
> **31.4 Export Window.** During any notice period under Section 31.3, the
> Academy will use commercially reasonable efforts to make available a means
> for Users to export their Educational Records, including completed study
> activity, achievements and issued certificates, in a commonly readable
> format. Users are encouraged to export and retain their own copies of any
> certificate or record they may need in future, at the time it is earned, and
> not to rely upon the continued availability of the Services for that purpose.
>
> **31.5 Certificates and Credentials Already Earned.** A certificate issued by
> the Academy records that a User completed the applicable requirements as of
> the date stated on it. That statement of historical fact is not withdrawn by
> the Academy ceasing to operate. However, **online verification of a
> Credential depends on the Academy operating the verification service**, and
> Users and employers should not assume that a verification link or QR code
> will resolve indefinitely. Where reasonably practicable, the Academy will
> seek to maintain a static record permitting verification of previously issued
> Credentials, or to transfer that function to a successor, but does not
> guarantee that it will be able to do so.
>
> **31.6 Subscriptions.** Recurring subscriptions are billed and administered by
> the Apple App Store or Google Play. On cessation of operations, the Academy
> will use commercially reasonable efforts to stop offering and to cancel
> renewals of subscriptions sold through those marketplaces. Amounts already
> paid are subject to Section 9.9 and to the policies of the applicable
> marketplace.
>
> **31.7 Lifetime Purchases.** A Lifetime Purchase entitles the User to access
> the applicable Services for the operational lifetime of those Services, as
> defined in Section 10.2. Cessation of operations ends that period. **Except
> where a refund is required by applicable law or granted by the applicable
> marketplace, no refund, credit or pro-rated repayment of a Lifetime Purchase
> is owed on cessation of operations.** Users are advised to consider this
> before selecting a Lifetime Purchase in preference to a subscription.
>
> **31.8 User Data.** Personal information held at the time of cessation will be
> handled in accordance with the Privacy Policy and applicable law, including
> deletion or de-identification once retention is no longer required.
>
> **31.9 Transfer to a Successor.** Nothing in this Section limits the Academy's
> rights under Section 30.5. Where the Services or the Academy's business are
> transferred to a successor, this Section applies only if the successor does
> not continue to operate the Services.
>
> **31.10 Survival.** Sections 26 (Disclaimers), 27 (Limitation of Liability),
> 28 (Indemnification) and 29 (Governing Law and Dispute Resolution) survive
> cessation of operations.

**Matching addition to the Privacy Policy, §19 (Data Retention).** §17 already
covers *"merger, acquisition, financing, reorganization, bankruptcy, sale of
assets"* disclosures, which is the right hook. Add:

> If we permanently cease operating the Services, we will delete or
> de-identify personal information once it is no longer required for a legal,
> accounting, tax, safety or dispute-resolution purpose, and will provide an
> export opportunity as described in the Terms of Service before doing so.
> Where our business or the Services are transferred to a successor, the
> transfer is subject to Section 17 and to appropriate notice.

---

## 3 · The point of sale doesn't say what "Lifetime" means

This is the one I would fix first, because it is the cheapest and it is where a
"lifetime" claim actually gets challenged.

**What a buyer sees today** (`src/screens/commercial/PaywallScreen.tsx:31`):

```
Lifetime Academy      $99.99      One-time payment      [BEST VALUE]
```

and beneath the plans, one legal line covering auto-renewal for the
subscription plans, plus links to Terms and Privacy.

**Nothing at the point of sale indicates that "Lifetime" means the operational
life of the service.** The honest definition exists — §10.2 — but it is inside
a 383 KB document behind a link, which is the classic fact pattern for a
deceptive-claim complaint. The FTC treats "lifetime" claims as requiring clear
disclosure of whose lifetime is meant, and both stores have taken enforcement
interest in the same thing.

**Proposed copy — one line, shown when the Lifetime plan is selected:**

> Lifetime means for as long as the Academy operates this service — not a
> guarantee of perpetual operation. See Terms §10.

⛔ I have **not** applied this. Every string on that screen is owner-ratified
(the file is annotated `Ratified by the owner` line by line), so the wording is
yours. Give me a ratified line and it is a ten-minute change; it is JS-only and
OTA-safe, so it does not need a build.

**Related copy problem, previously flagged three times and still live:** the
paywall's "early beta" note and *"prices valid through the end of the year"*
silently become false on 1 January. That is a pricing representation, not
decoration.

---

## 4 · The Terms cite a Refund Policy that does not exist

**"Refund & Subscription Policy"** is referenced three times — §1.3 (list of
governing documents), §9.9 (subscription refunds) and §10.13 (Lifetime refunds).
It is not published at any route on the site. `web/app/` has `terms`, `privacy`
and `support`, and nothing else legal.

So §9.9 currently reads, in effect: *refunds are governed by applicable law, by
Apple, by Google, and by a document you cannot read.* That reads as evasive
even though the substance is correct, and a dangling reference in a contract is
the kind of thing that gets construed against the drafter.

**Option A (recommended): publish a short one.** It costs a page and it lets you
state your own position rather than only pointing at Apple. Draft below.

**Option B: strike the three references** and fold the substance into §9.9 and
§10.13. Less good — it leaves the Academy with no stated position of its own.

**Draft Refund & Subscription Policy (Option A):**

> ### Refund & Subscription Policy
> *Effective [DATE] · [REGISTERED ENTITY NAME] d/b/a Pro Audio Training Academy*
>
> **1. Who takes your payment.** Memberships and Lifetime Purchases are sold
> through the Apple App Store and Google Play. Those marketplaces — not the
> Academy — are the seller of record, take the payment, hold the billing
> relationship and decide refunds. **The Academy cannot issue, approve or
> reverse a refund for a purchase made through either marketplace**, and cannot
> see your payment details.
>
> **2. How to request a refund.**
> *Apple:* reportaproblem.apple.com, or Settings → your name → Media &
> Purchases → Purchase History.
> *Google Play:* play.google.com/store/account/orderhistory, or the Play Store
> app → Payments & subscriptions → Budget & order history.
> Both marketplaces apply their own time limits and criteria.
>
> **3. Cancelling a subscription.** Cancel any time in your app-store
> subscription settings, at least 24 hours before the period ends to avoid the
> next charge. **Cancelling stops future renewals; it does not refund the
> current period**, and you keep access until the period you have paid for ends.
>
> **4. Statutory rights.** Nothing in this policy limits any non-waivable right
> you have under the consumer law of the country you live in, including any
> statutory right of withdrawal or cancellation. Where such a right applies to
> an app-store purchase, it is exercised through the marketplace.
>
> **5. Lifetime Purchases.** "Lifetime" means the operational lifetime of the
> service, as defined in Terms of Service §10.2 — it is not a guarantee that the
> Academy will operate for any particular period. Please read that section and
> §31 (Cessation of Operations) before choosing a Lifetime Purchase over a
> subscription.
>
> **6. If a refund is granted.** When a marketplace refunds a purchase, the
> corresponding access ends. Study progress and any certificate already earned
> are not deleted by a refund, but access to member features stops. [⚠️ OWNER
> DECISION — see §5 below on whether a refunded Lifetime Purchase revokes an
> already-issued certificate.]
>
> **7. Accounts closed for conduct.** [⚠️ OWNER DECISION — see §5 below.]
>
> **8. Contact.** info@proaudiotrainingacademy.com. We cannot process a refund
> for you, but if a marketplace has declined one and you think the
> circumstances warrant it, tell us — we would rather hear about it than not.

---

## 5 · Refunds: what's right, and the four things it's silent on

**Right, and worth keeping exactly as it is:** §9.9 and §10.13 say the Academy
*"cannot independently approve refunds for purchases controlled exclusively by
Apple or Google."* That is true, and pretending otherwise would be worse.

**Silent on four things:**

1. **Statutory withdrawal rights.** EU/UK consumers have cancellation rights
   that the seller of record handles. For in-app purchases that is the
   marketplace, so the practical answer is "through the store" — but saying
   nothing looks like denying the right. Clause 4 of the draft above fixes it
   in two sentences.
2. **What a refund does to access and to a certificate.** Nothing says. If
   someone buys Lifetime, earns a certificate, then gets a refund from Apple —
   does the certificate stand? My view: **the certificate should stand**,
   because it records that they passed an exam, which remains true, and
   revoking it converts a payment dispute into an academic-integrity claim. But
   that is a policy call, not a legal one. **Your ruling needed.**
3. **The ban/refund interaction.** This is the open question from the
   moderation work (governance D19 #2): if you ban a paid member, do you owe a
   refund? **You cannot refund an in-app purchase yourself** — so "we ban you
   and keep your money" is the default outcome whether or not you intend it,
   and that is a chargeback and consumer-complaint risk. The usual answer is to
   state it plainly up front: conduct-based termination does not entitle the
   user to a refund of amounts already paid, and any refund is at the
   marketplace's discretion. **Your ruling needed**, and it belongs in both the
   Terms (§25) and the Refund Policy (clause 7).
4. **Your own goodwill position.** You genuinely can't refund. But saying "if
   the store said no and you think that's wrong, tell us" costs nothing, is
   true, and is the difference between a support email and a one-star review
   saying you hid behind Apple. Clause 8 above.

---

## 6 · Liability: the cap is fine, two soft spots

**§27.5** caps total cumulative liability at the greater of (a) amounts paid in
the twelve months before the event, or (b) US $100. That is conventional,
proportionate to a $99.99 product, and I would not change its shape.

**Soft spot 1 — the cap collapses for Lifetime buyers.** A Lifetime purchaser
in month 18 has paid nothing in the preceding twelve months, so limb (a) is
zero and the cap is $100 against a $99.99 purchase. That is favourable to you,
but a cap at roughly the purchase price is the zone where courts in some states
start asking whether the remedy fails of its essential purpose. The standard
fix is to make limb (a) *"the total amount paid by the User for the product or
service giving rise to the claim, or the amount paid in the twelve months
preceding the event, whichever is greater."* Lawyer's call.

**Soft spot 2 — the non-disclaimable carve-outs aren't named.** Most states will
not permit a cap on gross negligence, wilful misconduct, fraud or personal
injury. §27.13 has a generic savings clause, which mostly handles it, but
naming the exclusions is cleaner and stops a court striking more of the section
than it needs to. Suggested addition:

> **27.16 Exclusions.** Nothing in these Terms excludes or limits liability for
> fraud or fraudulent misrepresentation, for death or personal injury caused by
> negligence, for gross negligence or wilful misconduct, or for any other
> liability that cannot lawfully be excluded or limited.

**Not a gap:** the field-hazard exposure is already covered properly by §26.3,
§26.7 and §27.12, and those line up with the in-app `AccuracyNote` that steers
users to calibrated instruments. That is the right structure — the disclaimer
in the contract and the warning at the point of use say the same thing.

---

## 7 · §29.5 is not an arbitration agreement, but §29.10 waives class actions

Read §29.5 closely:

> Where permitted by applicable law and unless otherwise prohibited, **the
> parties may agree** that disputes arising under these Terms **shall be**
> resolved through binding arbitration rather than court proceedings.
> **If arbitration is required:** …

That says the parties *might* agree to arbitrate at some future point. It does
not bind anyone to anything. There is no arbitration provider named, no rules
incorporated, no allocation of fees, no opt-out mechanism, and no delegation
clause. As drafted, **there is effectively no agreement to arbitrate.**

Meanwhile §29.10 is an unqualified class-action waiver.

A class-action waiver ordinarily gets its enforceability from sitting inside an
arbitration agreement governed by the Federal Arbitration Act. **Standing on its
own in a California-governed consumer contract, it is on materially weaker
ground.** So the current drafting may have the worst of both: no arbitration,
and a waiver that a court may decline to enforce.

This is squarely a lawyer question, and it is the item I would put in front of
counsel first alongside §1. The decision is binary:

- **Adopt real arbitration** — name the provider and rules, allocate fees,
  include a 30-day opt-out, keep the small-claims carve-out that §29.6 already
  has, and keep the class waiver inside it; or
- **Drop arbitration entirely** — delete §29.5, and have counsel advise whether
  to keep §29.10 at all given it would then stand alone.

I have not drafted either, because an arbitration clause written by a
non-lawyer is worse than none.

---

## WHAT I NEED FROM YOU

Four facts (only you have them):

1. Registered entity name, exactly as filed.
2. State of formation.
3. Is "Pro Audio Training Academy" registered as a DBA of it?
4. Registered address for legal notices.

Three rulings (policy, not law):

5. Does a **refunded** Lifetime Purchase revoke an already-issued certificate?
   (My view: no.)
6. Does a **ban** entitle the user to a refund, revoke earned credentials, or
   terminate paid membership? — the open D19 questions. Whatever you decide
   needs to be stated in §25 before launch, because the silent default is
   "we keep the money", and that is a chargeback risk.
7. Retention period for reports, messages and moderation records after removal.

One copy ratification:

8. The "Lifetime means…" line for the paywall (§3 above). JS-only, OTA-safe,
   ten minutes once you ratify the wording.

And then: **all of this to a lawyer.** Items 1 and 7 especially — those two
decide whether the protections in the rest of the document actually attach.
