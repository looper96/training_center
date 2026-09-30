# Legacy (not built)

These components and `trainingData.ts` were in the original export but were never
mounted in `App.tsx` and depend on types (`TraineeProfile`, `BpmnDocument`, …)
that were not part of the export. They are kept here for their content only and
are excluded from the TypeScript build.
