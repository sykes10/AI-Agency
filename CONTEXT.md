# Press Agency

Press Agency turns an article idea into a sequence of immutable editorial artifacts. Each artifact records the output of one stage so the article's history remains observable and replayable.

## Language

**Article**:
The aggregate that tracks an idea and every artifact produced while turning it into publishable content.
_Avoid_: Job, post record

**Draft**:
The Writing Agent's first complete article body, created before technical and editorial review.
_Avoid_: Article copy, final draft

**Review**:
A structured set of findings about a Draft. An Article has one Technical Review and one Editorial Review in the current workflow.
_Avoid_: Feedback blob, critique

**Revised Draft**:
The immutable article body produced by applying the Technical Review and Editorial Review to the Draft in one revision pass. SEO and publication consume the Revised Draft while the original Draft remains unchanged.
_Avoid_: Updated draft, final draft

**Resolution**:
The recorded decision for one Review finding. A Resolution says whether the finding was applied or rejected and preserves the reason for that decision.
_Avoid_: Review status, action item

## Example dialogue

**Editor:** Has this Article been reviewed yet?

**Developer:** Yes. Its Draft has both Reviews, and the revision pass produced a Revised Draft. SEO can now use the Revised Draft without overwriting the original Draft.
