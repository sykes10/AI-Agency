# Frontend Blueprints: Writing Style Guide

## 1. Purpose and Scope

This document is the project-wide writing style reference for all authored content on Frontend Blueprints: every Blueprint and every Pattern. It sits alongside `DESIGN.md` (the visual/UI design system) and `PROJECT.md` at the repo root, and future phase planning should cite it the same way it cites `DESIGN.md` whenever prose is generated or reviewed.

It governs the MDX prose in `content/blueprints/` and `content/patterns/`: voice, sentence-level punctuation, and the structural habits that make writing read as AI-generated rather than human-written. It serves two audiences: the single author drafting or revising a post, and any planning or review pass that generates or checks prose against this standard.

The stakes are the same as the site's core value: every Blueprint or Pattern should give the reader a production-grade mental model, not a tutorial. A hiring manager reading a post should come away understanding how the author thinks. An engineer should be able to return to it as a reference the next time they hit the same problem. Style serves that goal. It is not decoration.

## 2. Voice and Tone

Write like an experienced engineer explaining a decision to a peer, not a documentation bot summarizing a spec. The reader is a competent frontend engineer. Write for that person: skip the throat-clearing, get to the judgment, and back it with reasoning.

Some working principles:

- Favor concrete nouns and active verbs. "The cache invalidates on mutation" beats "Cache invalidation occurs when a mutation is performed."
- Have an opinion. If a pattern has a real trade-off, say which side you'd pick and why. Readers come here for judgment, not a neutral survey of options.
- Let personality through. A dry aside or a blunt assessment ("this approach doesn't scale past a few hundred rows") reads as human. A flat, hedge-everything tone reads as generated.
- Respect the reader's competence. Don't soften a technical claim with unnecessary qualifiers just to seem agreeable.

## 3. Sentence-Level Rules

Three marks are banned from this site's prose:

- The em dash character.
- The double-hyphen `--` used as a substitute for an em dash.
- The semicolon.

These marks are common in AI-generated text because they let a model glue two thoughts together without deciding how they actually relate. Banning them forces a real decision about structure, which is exactly what makes prose read as hand-written.

Replacement moves:

- For a break in thought or an aside, use a period and a new sentence, a comma, or parentheses.
- To introduce a list or an elaboration, use a colon.
- To join two related clauses, use a period, or connect them with "and" or "but." Don't reach for a semicolon to avoid choosing.
- Don't use a colon as a substitute for a dash or double-hyphen when joining two clauses. A colon that introduces a genuine list or a real elaboration is fine. A colon that glues two independent thoughts together, the way a dash would, is not. If you catch yourself using a colon this way, rephrase into two sentences, or connect the clauses with "and," "so," or "because." When in doubt, skip the special-character connector entirely.

**Don't:** The queue caps at three visible toasts: older ones drop off automatically.

**Do:** The queue caps at three visible toasts. Older ones drop off automatically.

Beyond punctuation, vary sentence length on purpose. A paragraph where every sentence runs twelve to eighteen words, subject-verb-object, reads flat and mechanical. Mix a short sentence next to a longer one. Let a fragment land for emphasis when it earns it.

Prefer the common, everyday word over the grammatically precise but uncommon or formal one, even when the common word is slightly less exact, because it reads more natural and human. A technical standard might name something with a formal singular term, but if people actually talk about it with an everyday plural word, use the everyday word in running prose. This holds even when the formal term would be more precise, since the reader values natural phrasing over pedantic correctness.

## 4. Explaining Versus Over-Explaining

Trust the reader. Don't restate what a code sample already shows in the prose above or below it. Don't define terms a mid-level frontend engineer already knows (what a promise is, what `useState` does). Say the thing once, clearly, and move on.

The goal is a production-grade mental model and the reasoning behind a trade-off. That means real depth on the "why": why this pattern over the obvious alternative, what breaks at scale, what the failure mode looks like in production. That depth is the point of the writing, not padding to cut.

The padding to cut is different: recapping the obvious, hedging a claim you already believe, restating a point in slightly different words to hit a word count. Trusting the reader is not the same as being terse to the point of unhelpful. Cut the filler. Keep the substance.

## 5. Structural and Formatting Habits to Avoid

These are the tells that make writing look AI-generated. Watch for them in a draft and cut them on sight.

| Habit | Why it reads as AI-generated |
|-------|-------------------------------|
| Formulaic transitions ("Moreover," "Furthermore," "In conclusion," "It's worth noting that") | These exist to bridge paragraphs that don't actually connect. A human writer restructures the paragraph instead of bolting on a connector. |
| Excessive hedging ("arguably," "it could be said," stacked qualifiers) | Piling on qualifiers avoids committing to a claim. This site is built on stated opinions and judgment calls, not diplomatic non-answers. |
| Rule-of-three padding | Reaching for exactly three parallel examples for rhythm, when the real number is one or five, signals a pattern optimized for cadence over content. |
| Overuse of bulleted lists | Lists are useful for genuinely parallel, scannable items. Reaching for a list to avoid writing connected prose flattens reasoning that should read as an argument. |
| Generic intros and outros | Opening with a restatement of the title, or closing with a summary of what was just said, adds length without adding information. Start with the actual point. End when the point is made. |
| Uniform, repetitive sentence rhythm | Every sentence the same length and shape reads like it was generated from a template rather than written by someone thinking as they go. |
| Over-signposting ("In this section, we will discuss...") | The heading already says what the section covers. Restating it in prose is wasted words. |

## 6. Do/Don't Example

**Don't:**

> When it comes to state management in React applications, there are several approaches worth considering; Context API is one option, Redux is another, and Zustand is a third. Moreover, it's worth noting that each of these has its own trade-offs. In conclusion, the right choice arguably depends on your specific use case, so you should evaluate your needs carefully before deciding.

**Do:**

> Context re-renders every consumer on every update, so it falls apart once a provider holds more than a handful of fields. Zustand fixes that with selector-based subscriptions: a component only re-renders when the slice it reads actually changes. Redux does the same, plus middleware and time-travel debugging, at the cost of real boilerplate. For a small app, reach for Zustand. Redux earns its cost once multiple teams touch the same store and you need enforced conventions.

The "Don't" block is illustrative. It is the only place in this site's prose where a semicolon or the banned habits above are allowed to appear, precisely because it is demonstrating what to avoid.
