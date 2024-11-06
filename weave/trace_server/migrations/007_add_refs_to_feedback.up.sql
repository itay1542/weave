/*
This migration adds the following columns to the feedback table:
- `annotation_ref`: The ref pointing to the annotation definition for this feedback.
- `runnable_ref`: The ref pointing to the runnable definition for this feedback.
- `call_ref`: The ref pointing to the resulting call associated with generating this feedback.
- `trigger_ref`: The ref pointing to the trigger definition which resulted in this feedback.

We are enhancing the feedback table to support richer payloads - specifically those generated
from scoring functions and/or human annotations. These additional columns allow us
to join/query/filter on the referenced entities (aka foreign keys) without loading
the entire payload into memory.

Note, there are two classes of feedback types:
- `wandb.annotation.*`: Feedback generated by a human annotator.
    - Here, `*` is a placeholder for the name of the annotation field (which is expected to be the name part of the annotaiton ref)
- `wandb.runnable.*`: Feedback generated by a machine scoring function.
    - Here, `*` is a placeholder for the name of the runnable (which is expected to be the name part of the runnable ref)

Furthermore, the fields are mostly mutually exclusive, where:
- `wandb.annotation.*` feedback will have `annotation_ref` populated.
- `wandb.runnable.*` feedback will have `runnable_ref` populated and optionally (`call_ref` and `trigger_ref`).
However, it is conceivable that in the future a user might want to use a runnable to generate feedback that
corresponds to an annotation field!

*/
ALTER TABLE feedback
    /*
    `annotation_ref`: The ref pointing to the annotation definition for this feedback.
    Expected to be present on any feedback type starting with `wandb.annotation`.
    */
    ADD COLUMN annotation_ref Nullable(String) DEFAULT NULL,
    /*
    `runnable_ref`: The ref pointing to the runnable definition for this feedback.
    This can be an op, a configured action, etc...
    Expected to be present on any feedback type starting with `wandb.runnable`.
    */
    ADD COLUMN runnable_ref Nullable(String) DEFAULT NULL,
    /*
    `call_ref`: The ref pointing to the resulting call associated with generating this feedback.
    Expected (but not required) to be present on any feedback that has `runnable_ref` as a
    call-producing op.
    */
    ADD COLUMN call_ref Nullable(String) DEFAULT NULL,
    /*
    `trigger_ref`: The ref pointing to the trigger definition which resulted in this feedback.
    Will be present when the runnable_ref has been executed by a trigger, not a human/small batch job.
    */
    ADD COLUMN trigger_ref Nullable(String) DEFAULT NULL;