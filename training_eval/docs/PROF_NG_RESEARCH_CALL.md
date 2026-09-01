# Why we contacted Prof Teck Khim Ng

**Status:** factual research-process note

## 1. An NUS paper led us back to NUS

During the hackathon research sprint, the team encountered an NUS paper that approached generative-image detection through camera-pipeline and local-statistics cues rather than only high-level semantics. Because we were genuinely curious about where the Bayer/local-statistics idea came from—and because the work came from our own university community—we tried to reach the authors and spoke with Prof Teck Khim Ng.

The paper is coauthored by **Yung Jer Wong and Prof Ng**. Prof Ng should not be described as its sole creator. In the recorded call, Prof Ng explained that Wong had been his student and teaching assistant, later volunteered to pursue the research, and carried out the research implementation; Prof Ng had suggested investigating the Bayer-pattern direction. That division of credit is the version this project uses.

## 2. What we wanted to understand

Our questions were methodological rather than ceremonial:

- Why should Bayer/demosaicing traces separate camera photographs from generated pixels?
- Which local-statistics cues survive resizing, blur and recompression?
- How quickly do such cues become obsolete as generators improve?
- Could a local forensic branch complement our globally pooled representation?
- How should a detector be framed when an adversary can deliberately erase its signal?

That is why the call matters to the project story: we sought a domain expert because the paper challenged the assumptions behind our observed SID false negatives, not simply because the authors were at NUS.

## 3. Research takeaways from the call

The transcript supports four high-level takeaways:

1. **Camera formation can leave local traces.** Bayer sampling and demosaicing are a physically motivated source of local statistics in many photographs.
2. **The signal is not permanent.** Blur, resizing and new generator pipelines can weaken or imitate those traces.
3. **Detection is an arms race.** A useful forensic cue can become a target once it is known; no passive detector is proof of origin.
4. **Local evidence is complementary.** Global semantic features can miss a small edited region, while local statistics may expose a different failure mode.

These conclusions align with TEST1: SID's locally tampered positives were much harder at the fixed threshold, and ordinary corruptions changed the score distribution even when ROC ranking remained useful.

## 4. What the call changed

The call changed the **research roadmap**, not the provenance of the shipped detector.

It motivated a proposed local-statistics/patch expert with:

- deterministic Bayer-residual and high-pass views;
- patch-level multiple-instance supervision for partial edits;
- symmetric blur/resize/JPEG counterfactuals;
- a clean-image false-positive veto; and
- generator/source-disjoint validation before fusion.

It also strengthened our reporting language: SynthFlag is a triage signal, not a definitive authorship oracle, and consequential platform action needs provenance and human review.

The current selected detector remains a frozen upstream Expert 4 representation plus project-trained heads and routing. The Bayer/local-statistics direction is documented future work because the team did not have time to implement and audit it without risking new false positives.

## 5. Why this matters for TikTok

For a creator platform, adding a highly sensitive forensic branch without an untouched real-image audit would be irresponsible. A local cue that fires on ordinary camera processing, screenshots or beauty filters can wrongly flag authentic creators. The proposed branch therefore has two product gates:

1. it must reduce local-tamper false negatives on a source-held-out audit; and
2. it must not increase false positives at the strict review threshold.

If both cannot be satisfied, the signal remains an analyst-only diagnostic. That is the practical lesson we carried from the research call into the system design.
