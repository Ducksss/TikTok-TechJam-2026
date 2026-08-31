/* oxlint-disable next/no-html-link-for-pages -- vinext's production next/link prefetch shim currently breaks route clicks; standard anchors keep public navigation reliable. */
import { ArrowUpRight, Download, ScanSearch } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { HashAnchorSync } from '../hash-anchor-sync';
import { PrintButton } from '../print-button';
import '../documentation.css';
import './architecture.css';
import { ModelJourney } from './model-journey';

const paperUrl = 'https://arxiv.org/html/2604.11487v1';
const repositoryUrl = 'https://github.com/Ducksss/TikTok-TechJam-2026';
const dinoModelCardUrl =
  'https://github.com/facebookresearch/dinov3/blob/main/MODEL_CARD.md';

const contents = [
  ['overall', 'Overall system'],
  ['request', 'Request sequence'],
  ['runtime', 'Worker lifecycle'],
  ['checkpoints', 'Checkpoint gates'],
  ['tensors', 'Tensor contract'],
  ['deep-model', 'Full model graph'],
  ['expert-anatomy', 'Expert anatomy'],
  ['dinov3-context', 'DINOv3 context'],
  ['release', 'Release boundary'],
  ['operations', 'Operational states'],
  ['batch', 'Batch durability'],
] as const;

type EvidenceKind = 'paper' | 'code' | 'guidance';

type AlternativeRow = {
  boundary: string;
  stage: string;
  behavior: string;
};

type AtlasSection = {
  alt: string;
  alternative: AlternativeRow[];
  bullets: ReactNode[];
  evidence: Array<{ kind: EvidenceKind; label: string }>;
  file: string;
  group:
    | 'System'
    | 'Runtime and model contract'
    | 'Challenge context'
    | 'Release and operations';
  height?: number;
  id: (typeof contents)[number][0];
  kicker: string;
  lead: ReactNode;
  number: string;
  technical: ReactNode;
  title: string;
  width?: number;
  dense?: boolean;
};

const sections: AtlasSection[] = [
  {
    id: 'overall',
    number: '07',
    group: 'System',
    kicker: '01 · Supported configuration',
    title: 'The website and model service are separate systems',
    evidence: [
      { kind: 'code', label: 'Released code' },
      { kind: 'guidance', label: 'Configuration boundary' },
    ],
    lead: (
      <>
        The browser presents the detector, while a checkpoint-backed Python
        service performs scoring. The browser can call that service directly or
        use the website&apos;s same-origin proxy.
      </>
    ),
    bullets: [
      <>
        <strong>Direct mode:</strong> a public inference URL receives health and
        analysis requests from the browser.
      </>,
      <>
        <strong>Proxy mode:</strong> <code>/api/analyze</code> forwards to the
        configured service URL.
      </>,
      <>
        <strong>Model boundary:</strong> four externally supplied checkpoints
        are mounted beside the inference service, not shipped in the website.
      </>,
      <>
        <strong>Output:</strong> the browser receives score, timing, model,
        version, threshold, and checkpoint-identity fields.
      </>,
    ],
    technical: (
      <>
        <p>
          Direct routing uses <code>NEXT_PUBLIC_SYNTHFLAG_INFERENCE_URL</code>.
          Proxy routing uses server-side <code>SYNTHFLAG_INFERENCE_URL</code>.
          Both converge on FastAPI <code>GET /health</code> and{' '}
          <code>POST /v1/analyze</code>.
        </p>
        <p>
          This is the topology supported by the released code, not a claim about
          the exact infrastructure, process count, or network controls of every
          deployment. The application has no upload database or result store;
          platform logging and retention remain deployment concerns.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'Browser',
        behavior: 'The /try interface validates and previews one image.',
        boundary:
          'Selects direct service or same-origin proxy from configuration.',
      },
      {
        stage: 'Website proxy',
        behavior: 'Optionally forwards health and multipart analysis requests.',
        boundary: 'Does not run the vision models itself.',
      },
      {
        stage: 'Inference service',
        behavior: 'Validates, decodes, loads or reuses the model, then scores.',
        boundary: 'Uses externally mounted checkpoints and a resident model.',
      },
      {
        stage: 'Response',
        behavior: 'Returns a JSON result to the browser.',
        boundary: 'A score is a review signal, not provenance proof.',
      },
    ],
    alt: 'Supported SynthFlag topology showing the browser using either direct or proxy routing to a FastAPI inference service, externally mounted checkpoints, a resident four-expert model, and a JSON result.',
    file: '07-overall-system.svg',
  },
  {
    id: 'request',
    number: '08',
    group: 'System',
    kicker: '02 · One request, two paths',
    title: 'Cold and warm requests differ before inference starts',
    evidence: [{ kind: 'code', label: 'Released code' }],
    lead: (
      <>
        Every accepted upload reaches the same decode and prediction path. A
        cold worker must first verify and load the four experts; a warm worker
        reuses its cached model.
      </>
    ),
    bullets: [
      'The browser rejects unsupported types, files over 10 MiB, and images it cannot decode.',
      'Proxy and service layers repeat the applicable MIME and size checks.',
      'The service enforces at least 32 pixels per dimension and at most 50 million total pixels.',
      'Only the locked prediction interval is reported as processing_ms.',
    ],
    technical: (
      <>
        <p>
          Cold initialization occurs inside <code>_model_lock</code>. The timer
          starts only after <code>_get_model()</code> returns, so upload,
          service-side decode, proxy travel, and checkpoint loading are
          excluded. It includes waiting for <code>_inference_lock</code> and the
          prediction call.
        </p>
        <p>
          The proxy analysis path has a 300-second timeout. Direct browser POST
          requests have no explicit timeout in the released client code.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'Client preflight',
        behavior: 'Check MIME, 10 MiB limit, and browser decodability.',
        boundary: 'Prevents obvious invalid uploads before the request.',
      },
      {
        stage: 'Service preflight',
        behavior:
          'Read bounded bytes, verify decode and dimensions, convert RGB.',
        boundary: 'Rejects unsupported, oversized, tiny, or undecodable input.',
      },
      {
        stage: 'Cold or warm model',
        behavior: 'Load once under the model lock or reuse the cached object.',
        boundary: 'Cold loading is outside processing_ms.',
      },
      {
        stage: 'Prediction',
        behavior: 'Wait for the inference lock, run the model, return JSON.',
        boundary: 'Lock wait and model execution are inside processing_ms.',
      },
    ],
    alt: 'Sequence diagram comparing cold and warm SynthFlag requests from browser validation through service decode, model acquisition, serialized prediction, and JSON response.',
    file: '08-request-sequence.svg',
  },
  {
    id: 'runtime',
    number: '09',
    group: 'Runtime and model contract',
    kicker: '03 · Process-local lifecycle',
    title: 'Each worker owns one model and serializes prediction',
    evidence: [{ kind: 'code', label: 'Released code' }],
    lead: (
      <>
        The service keeps a single model object per process. Image decoding runs
        in worker threads, but one process admits only one prediction at a time
        through its inference lock.
      </>
    ),
    bullets: [
      <>
        <strong>Eager option:</strong> load during service startup when{' '}
        <code>SYNTHFLAG_EAGER_LOAD=1</code>.
      </>,
      <>
        <strong>Lazy default:</strong> the first accepted analysis calls{' '}
        <code>_get_model()</code>.
      </>,
      <>
        <strong>Single initialization:</strong> <code>_model_lock</code>{' '}
        prevents duplicate construction inside a process.
      </>,
      <>
        <strong>Single prediction:</strong> <code>_inference_lock</code>{' '}
        protects the shared model during execution.
      </>,
    ],
    technical: (
      <>
        <p>
          <code>ready: true</code> means the process has a model object. It does
          not report lock occupancy or queue length. <code>ready: false</code>{' '}
          means no model object is loaded; a health check does not itself begin
          lazy loading.
        </p>
        <p>
          Additional server processes would each allocate their own model and
          locks. The released service does not define a process count,
          application queue limit, autoscaler, or distributed scheduler.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'Startup',
        behavior: 'Optionally eager-load, otherwise expose an unloaded worker.',
        boundary: 'Health reports model presence, not active warm-up progress.',
      },
      {
        stage: 'Initialization',
        behavior:
          'One request constructs and caches the model under _model_lock.',
        boundary: 'Other initializers wait; construction is not duplicated.',
      },
      {
        stage: 'Decode',
        behavior: 'Accepted request bytes are decoded in a worker thread.',
        boundary: 'Decode is outside the inference lock.',
      },
      {
        stage: 'Inference',
        behavior: 'Requests enter _inference_lock and predict one at a time.',
        boundary: 'Serialization applies within one service process.',
      },
    ],
    alt: 'Process lifecycle showing optional eager loading, lazy model initialization under a model lock, process-local model caching, threaded decoding, and serialized prediction under an inference lock.',
    file: '09-worker-lifecycle.svg',
  },
  {
    id: 'checkpoints',
    number: '10',
    group: 'Runtime and model contract',
    kicker: '04 · Integrity before deserialization',
    title: 'Checkpoint loading is a sequence of explicit gates',
    evidence: [
      { kind: 'code', label: 'Released code' },
      { kind: 'guidance', label: 'Trust boundary' },
    ],
    lead: (
      <>
        The default path checks all four expected files against manifest sizes
        and SHA-256 identities before PyTorch deserializes any checkpoint.
        Structural gates continue after hashing.
      </>
    ),
    bullets: [
      'Require the weights directory and four exact checkpoint filenames.',
      'Require manifest schema 1, positive byte sizes, and 64-hex SHA-256 values.',
      'Load on CPU with weights_only=True and require a non-empty tensor-only state dictionary.',
      'Strictly match the architecture, then move the expert to the selected device and evaluation mode.',
    ],
    technical: (
      <>
        <p>
          The four manifest entries total 5,862,218,414 bytes. The service
          returns the first 12 characters of a combined checkpoint-identity
          digest; CLI metadata records the full digest. The returned short
          digest alone does not prove byte hashing ran when hash checks were
          explicitly bypassed.
        </p>
        <p>
          These checks establish integrity and expected identity, not a digital
          signature, origin authentication, malware scan, license grant, or
          provenance proof. <code>SYNTHFLAG_SKIP_HASH_CHECK=1</code> bypasses
          size and hash comparison and is intended only for trusted immutable
          deployments.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'Presence gate',
        behavior: 'Resolve the directory and require four exact filenames.',
        boundary: 'Missing files stop loading.',
      },
      {
        stage: 'Manifest gate',
        behavior: 'Validate schema, entries, sizes, and SHA-256 syntax.',
        boundary: 'Malformed identity metadata stops loading.',
      },
      {
        stage: 'Byte gate',
        behavior: 'Compare actual sizes and stream-hash checkpoint bytes.',
        boundary: 'Any mismatch stops loading before deserialization.',
      },
      {
        stage: 'Structure gate',
        behavior:
          'Safe-load tensors, require tensor-only state, strict-match model.',
        boundary: 'Invalid payload or architecture mismatch stops activation.',
      },
      {
        stage: 'Activation',
        behavior:
          'Move each expert to the device and switch to evaluation mode.',
        boundary: 'Integrity is not the same as provenance or authorization.',
      },
    ],
    alt: 'Checkpoint loading gates from required filenames and manifest schema through size and SHA-256 comparison, weights-only tensor loading, strict architecture match, and evaluation-mode activation.',
    file: '10-checkpoint-integrity.svg',
  },
  {
    id: 'tensors',
    number: '11',
    group: 'Runtime and model contract',
    kicker: '05 · Executable data contract',
    title: 'The tensor shapes make the four-to-one flow explicit',
    evidence: [{ kind: 'code', label: 'Released code' }],
    lead: (
      <>
        A batch of RGB images becomes two fixed-size tensors. CLIP and SigLIP
        then produce different feature widths, but every expert ends with two
        logits and one fake-class probability per image.
      </>
    ),
    bullets: [
      <>
        Python tensor input is <code>[B,3,H,W]</code>, using <code>uint8</code>{' '}
        or finite floats in <code>[0,1]</code>.
      </>,
      <>
        CLIP lane: <code>[B,3,224,224]</code> → <code>[B,768]</code> →{' '}
        <code>[B,2]</code>.
      </>,
      <>
        SigLIP lane: <code>[B,3,384,384]</code> → <code>[B,1152]</code> →{' '}
        <code>[B,2]</code>.
      </>,
      <>
        Four class-1 vectors <code>[B]</code> are averaged; the web path returns
        one scalar because <code>B=1</code>.
      </>,
    ],
    technical: (
      <>
        <p>
          Mixed-size PIL images enter through <code>predict_pil()</code> and are
          converted to RGB independently before stacking. CUDA autocast is
          optional and CUDA-only; each expert&apos;s logits are explicitly cast
          to float before softmax.
        </p>
        <p>
          Empty batches return an empty float tensor. Wrong rank or channel
          count, unsupported integer dtype, non-finite floats, out-of-range
          floats, and malformed final outputs are rejected.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'Input',
        behavior: 'B RGB images, or tensor [B,3,H,W].',
        boundary: 'Tensor values must be uint8 or finite floats in [0,1].',
      },
      {
        stage: 'CLIP lane',
        behavior: '[B,3,224,224] to two [B,768] embeddings and [B,2] logits.',
        boundary: 'Experts 1 and 2 have independent parameters.',
      },
      {
        stage: 'SigLIP lane',
        behavior: '[B,3,384,384] to two [B,1152] features and [B,2] logits.',
        boundary: 'Experts 3 and 4 have independent parameters.',
      },
      {
        stage: 'Fusion',
        behavior:
          'Float softmax class 1 gives four [B] vectors; mean gives [B].',
        boundary: 'No vote, learned fusion, or calibration layer.',
      },
    ],
    alt: 'Exact tensor trace from a batch of RGB images through 224-pixel CLIP and 384-pixel SigLIP tensors, feature vectors, binary logits, four fake-class probabilities, and one averaged output vector.',
    file: '11-tensor-contract.svg',
  },
  {
    id: 'deep-model',
    number: '15',
    group: 'Runtime and model contract',
    kicker: '06 · Maximal image-to-score trace',
    title: 'Every released inference operation in one execution graph',
    evidence: [
      { kind: 'code', label: 'Released code' },
      { kind: 'guidance', label: 'DINO boundary' },
    ],
    lead: (
      <>
        This is the densest single view of SynthFlag: upload gates, RGB decode,
        both preprocessing lanes, patch embeddings, transformer dimensions,
        checkpoint-specific heads, four float32 softmax paths, fusion, and the
        scalar web response.
      </>
    ),
    bullets: [
      'CLIP turns a 224-pixel crop into 256 patches plus one class token, then runs 24 transformer layers at width 1,024.',
      'SigLIP turns a 384-pixel crop into 729 patch tokens, then runs 27 transformer layers at width 1,152 and attention-pools with a learned probe.',
      'The four experts share architecture by family but never share checkpoint parameters or classifier heads.',
      'No DINO, DINOv2, or DINOv3 module exists in the released inference graph.',
    ],
    technical: (
      <>
        <p>
          The four instantiated experts contain 1,465,369,736 parameters in
          total: 304,163,586 per CLIP expert and 428,521,282 per SigLIP expert.
          Those counts follow the pinned Transformers 5.3.0 module definitions
          and the exact configs in <code>infer/model.py</code>.
        </p>
        <p>
          Evaluation mode disables classifier dropout. Optional CUDA autocast
          wraps the ensemble call, but every expert&apos;s two logits are cast
          to float32 before <code>softmax(dim=1)</code>. The final operation
          keeps the released arithmetic order:{' '}
          <code>(P3 + P4 + P1 + P2) / 4</code>.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'Input and decode',
        behavior:
          'Accept JPEG, PNG, or WebP up to 10 MiB; verify dimensions and decode once to RGB.',
        boundary: 'At least 32 px per side and at most 50 million pixels.',
      },
      {
        stage: 'CLIP preprocessing',
        behavior:
          'Bicubic resize, 224 center crop, tensor conversion, and CLIP channel normalization.',
        boundary: 'Produces [B,3,224,224] for experts 1 and 2.',
      },
      {
        stage: 'CLIP experts 1 and 2',
        behavior:
          '256 patches plus CLS; 24 encoder blocks; CLS pool; 1,024-to-768 projection; 768-to-256-to-2 head.',
        boundary:
          'Same architecture, separate full checkpoints and parameters.',
      },
      {
        stage: 'SigLIP preprocessing',
        behavior:
          'Bicubic resize, 384 center crop, tensor conversion, and 0.5 mean/std normalization.',
        boundary: 'Produces [B,3,384,384] for experts 3 and 4.',
      },
      {
        stage: 'SigLIP experts 3 and 4',
        behavior:
          '729 patches; 27 encoder blocks; learned-probe attention pool; 1,152-to-256-to-2 head.',
        boundary:
          'Same architecture, separate full checkpoints and parameters.',
      },
      {
        stage: 'Fusion and web output',
        behavior:
          'Cast logits to float32, take class-1 softmax for each expert, and average four vectors.',
        boundary:
          'Web uses B=1 and returns one score; it is not calibrated proof.',
      },
      {
        stage: 'DINO family',
        behavior: 'No DINO-family module is instantiated or loaded.',
        boundary:
          'A future DINO design must be documented as a separate architecture.',
      },
    ],
    alt: 'Maximal SynthFlag inference graph tracing an uploaded image through validation, RGB decoding, separate CLIP and SigLIP preprocessing, exact patch and transformer dimensions, four checkpoint-specific classifier heads, class-one softmax probabilities, arithmetic-mean fusion, and the scalar web response; a dashed boundary states that DINOv3 is not in the released path.',
    file: '15-full-model-execution.svg',
    width: 1920,
    height: 1500,
    dense: true,
  },
  {
    id: 'expert-anatomy',
    number: '16',
    group: 'Runtime and model contract',
    kicker: '07 · Transformer-level anatomy',
    title:
      'The two backbone families diverge at tokens, pooling, and feature width',
    evidence: [
      { kind: 'code', label: 'Released code' },
      { kind: 'code', label: 'Pinned dependency' },
    ],
    lead: (
      <>
        A second zoomed view opens the repeated transformer blocks. It shows
        query, key, and value projections, attention-head geometry, residual
        paths, MLP widths and activations, then the different CLIP and SigLIP
        pooling routes.
      </>
    ),
    bullets: [
      'CLIP uses 16 attention heads of width 64 and a 1,024→4,096→1,024 QuickGELU MLP inside each of 24 blocks.',
      'SigLIP uses 16 attention heads of width 72 and a 1,152→4,304→1,152 GELU-tanh MLP inside each of 27 blocks.',
      'CLIP selects and post-normalizes the CLS token before a bias-free 1,024→768 projection.',
      'SigLIP post-normalizes every patch token and applies learned-probe multi-head attention pooling plus a residual MLP.',
    ],
    technical: (
      <>
        <p>
          Both encoder families are pre-layer-normalized residual transformers:
          layer norm → multi-head self-attention → residual add, followed by
          layer norm → two-layer MLP → residual add. Configured attention
          dropout is zero in both backbones.
        </p>
        <p>
          The pooling-head detail comes from the pinned Transformers 5.3.0
          implementation used by the release. The public inference path uses
          only vision modules—there is no text encoder, contrastive similarity
          stage, prompt, or generative decoder at scoring time.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'CLIP tokenization',
        behavior:
          '14-by-14 bias-free patch convolution creates 256 tokens; prepend CLS and add 257 learned positions.',
        boundary: 'Token tensor is [B,257,1024].',
      },
      {
        stage: 'CLIP encoder block ×24',
        behavior:
          'Pre-LN, 16-head Q/K/V self-attention, residual, pre-LN, QuickGELU MLP, residual.',
        boundary: 'Head width 64; MLP width 4,096.',
      },
      {
        stage: 'CLIP pooling',
        behavior:
          'Select CLS, post-LN, and apply bias-free 1,024-to-768 visual projection.',
        boundary: 'Classifier receives [B,768].',
      },
      {
        stage: 'SigLIP tokenization',
        behavior:
          '14-by-14 valid patch convolution creates 729 tokens and adds learned positions; no CLS token.',
        boundary: 'Token tensor is [B,729,1152].',
      },
      {
        stage: 'SigLIP encoder block ×27',
        behavior:
          'Pre-LN, 16-head Q/K/V self-attention, residual, pre-LN, GELU-tanh MLP, residual.',
        boundary: 'Head width 72; MLP width 4,304.',
      },
      {
        stage: 'SigLIP pooling',
        behavior:
          'Post-LN tokens; learned probe attends to every token, then layer norm, MLP, residual, and selection.',
        boundary: 'Classifier receives [B,1152].',
      },
    ],
    alt: 'Detailed comparison of CLIP and SigLIP patch embeddings, repeated pre-normalized transformer blocks with query, key, value attention and residual MLP paths, and their different class-token and learned-probe pooling mechanisms.',
    file: '16-expert-anatomy.svg',
    width: 1920,
    height: 1350,
    dense: true,
  },
  {
    id: 'dinov3-context',
    number: '17',
    group: 'Challenge context',
    kicker: '08 · External methods, clearly separated',
    title: 'DINOv3 belongs to other NTIRE submissions—not SynthFlag',
    evidence: [
      { kind: 'paper', label: 'Challenge report' },
      { kind: 'guidance', label: 'External architecture' },
    ],
    lead: (
      <>
        The challenge report also describes DINOv3 systems from MICV and Ant
        International. This comparative figure gives their deepest supportable
        image-to-score breakdown while keeping a hard boundary around the
        released UESTC/SynthFlag runtime.
      </>
    ),
    bullets: [
      'MICV reports two committees—four DINOv3 backbones in one stream and two in another—followed by per-stream projection and MLP heads, then probability averaging.',
      'Ant International reports two independently fine-tuned DINOv3-7B experts: a 512-pixel attention-pooling specialist and a 288-pixel first-token-pooling specialist.',
      'The official DINOv3 ViT-7B/16 backbone uses width 4,096, 40 blocks, 32 attention heads, patch size 16, four register tokens, RoPE, and a SwiGLU feed-forward path.',
      'Neither external method, its checkpoints, nor its preprocessing code is present in the SynthFlag repository or served by /try.',
    ],
    technical: (
      <>
        <p>
          The NTIRE report gives high-level detector topology but leaves some
          implementation details undisclosed. MICV does not name the six exact
          DINOv3 variants or aggregation operator inside each committee. Ant
          International does not disclose its TTA set, ensemble weights, or
          binary-head layer dimensions. The diagram marks each omission instead
          of filling it with assumptions.
        </p>
        <p>
          The DINOv3-7B backbone anatomy comes from Meta&apos;s official model
          card and reference factory, not from SynthFlag code. UESTC evaluated
          the earlier DINO family during backbone selection, then chose CLIP and
          SigLIP for its final four-expert system.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'MICV input',
        behavior: 'Directly resize images to 512 by 512 for inference.',
        boundary: 'Exact normalization and interpolation are not reported.',
      },
      {
        stage: 'MICV committees',
        behavior:
          'One stream aggregates four DINOv3 backbones; a second aggregates two; each uses projection and an MLP probability head.',
        boundary:
          'Exact variants, feature tensor shapes, committee aggregation, and head dimensions are not reported.',
      },
      {
        stage: 'MICV fusion',
        behavior: 'Average the two stream probabilities.',
        boundary: 'This model is external challenge context, not SynthFlag.',
      },
      {
        stage: 'Ant expert 1',
        behavior:
          'A fully fine-tuned DINOv3-7B specialist at 512 pixels uses attention pooling and TTA.',
        boundary: 'TTA transforms and binary-head dimensions are not reported.',
      },
      {
        stage: 'Ant expert 2',
        behavior:
          'A second fully fine-tuned DINOv3-7B specialist at 288 pixels uses first-token pooling and TTA.',
        boundary:
          'The two experts have independent parameters; total reported size is 14B.',
      },
      {
        stage: 'Ant fusion',
        behavior:
          'Aggregate TTA outputs per expert and combine experts by weighted averaging.',
        boundary: 'Weights and exact TTA policy are not reported.',
      },
      {
        stage: 'Official DINOv3-7B/16 backbone',
        behavior:
          'Patch-16 ViT with 4,096 width, 40 blocks, 32 heads, four register tokens, RoPE, and SwiGLU.',
        boundary:
          'Official backbone specification contextualizes the named model; the challenge teams may adapt its task head.',
      },
    ],
    alt: 'Comparative architecture diagram for the external NTIRE DINOv3 methods: MICV uses committees of four and two DINOv3 backbones followed by projection and MLP heads; Ant International uses two independently fine-tuned DINOv3-7B experts at 512 and 288 pixels with different pooling and weighted fusion. Unreported details are explicitly marked, and a hard boundary separates both from SynthFlag.',
    file: '17-dinov3-challenge-context.svg',
    width: 1920,
    height: 1400,
    dense: true,
  },
  {
    id: 'release',
    number: '12',
    group: 'Release and operations',
    kicker: '06 · Method, artifacts, and rights',
    title: 'Training evidence and the public release have a hard boundary',
    evidence: [
      { kind: 'paper', label: 'Paper fact' },
      { kind: 'code', label: 'Released code' },
    ],
    lead: (
      <>
        The paper describes how UESTC trained the method. This repository
        packages inference and public evidence, but it neither reproduces that
        upstream trainer nor redistributes the four fine-tuned checkpoints.
      </>
    ),
    bullets: [
      'Paper layer: two-stage binary training with dense feature self-distillation.',
      'External artifact layer: four independently trained checkpoint files supplied by an authorized user or deployment.',
      'Public source layer: model definitions, preprocessing, verification, CLI, service, documentation, and aggregate evidence.',
      'Runtime layer: fixed checkpoints score new images; uploads do not update model weights.',
    ],
    technical: (
      <>
        <p>
          SynthFlag is the public product name; FeatDistill identifies the
          underlying detector lineage, while the NTIRE report names the
          submission UESTC. The relationship must be explained rather than
          collapsing those names.
        </p>
        <p>
          The release audit permits checkpoint filenames, sizes, and hashes but
          excludes the checkpoint bytes, dataset pixels, protected split rows,
          private per-image scores, and unlicensed third-party material.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'Paper-described method',
        behavior:
          'Stage 1 binary training, then Stage 2 dense self-distillation.',
        boundary: 'The public repository does not contain this trainer.',
      },
      {
        stage: 'External checkpoints',
        behavior:
          'Four independently trained state dictionaries carry learned parameters.',
        boundary: 'No redistribution grant was located; bytes remain external.',
      },
      {
        stage: 'Public release',
        behavior:
          'Source, manifest identities, aggregate evidence, and documentation.',
        boundary:
          'No datasets, private rows, protected scores, or checkpoint binaries.',
      },
      {
        stage: 'Inference deployment',
        behavior:
          'Authorized checkpoints are mounted and fixed during scoring.',
        boundary: 'No live upload feeds training or changes model weights.',
      },
    ],
    alt: 'Boundary diagram separating paper-described UESTC training, externally supplied fine-tuned checkpoints, the public SynthFlag source and evidence release, and optional fixed-weight inference deployment.',
    file: '12-method-release-boundary.svg',
  },
  {
    id: 'operations',
    number: '13',
    group: 'Release and operations',
    kicker: '07 · Observable states and failures',
    title: 'The interface reports a small state machine, not backend telemetry',
    evidence: [
      { kind: 'code', label: 'Released code' },
      { kind: 'guidance', label: 'Deployment responsibility' },
    ],
    lead: (
      <>
        The web interface checks connectivity, accepts or rejects a local image,
        starts one analysis request, and either shows a validated result or an
        error. Its animated steps are illustrative—not streamed backend
        progress.
      </>
    ),
    bullets: [
      <>
        Health becomes <strong>offline</strong>, <strong>ready</strong>, or the
        UI label <strong>warming</strong>; that last label only means the model
        is not yet loaded.
      </>,
      'Analysis errors preserve the currently selected valid preview; rejected inputs are not adopted.',
      'The proxy maps malformed input, unsupported types, size limits, missing configuration, and upstream failure to explicit statuses.',
      'Authentication, rate limiting, bounded queueing, and automated retry are not implemented in this application layer.',
    ],
    technical: (
      <>
        <p>
          Proxy statuses include 400, 413, 415, 502, and 503. The service uses
          413 for byte or pixel limits, 415 for MIME, and 422 for tiny or
          undecodable images. Model initialization errors currently surface as
          server errors.
        </p>
        <p>
          Browser health aborts after 6 seconds; proxy health aborts after 5
          seconds; proxy analysis aborts after 300 seconds. No automatic retry
          is defined. CORS allowlisting exists for direct access, but it is not
          user authentication.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'Connectivity',
        behavior:
          'checking transitions to offline, ready, or UI-labelled warming.',
        boundary: 'Health describes connection and model presence only.',
      },
      {
        stage: 'Local input',
        behavior: 'idle accepts a valid preview or shows a client-side error.',
        boundary: 'Animated analysis steps are not server progress events.',
      },
      {
        stage: 'Analysis',
        behavior:
          'One multipart request transitions to complete or returns to idle with an error.',
        boundary: 'No built-in automatic retry.',
      },
      {
        stage: 'Deployment controls',
        behavior:
          'Operators add auth, rate limits, queue limits, and monitoring as needed.',
        boundary:
          'Those controls are guidance, not released application features.',
      },
    ],
    alt: 'Operational state map showing connectivity, local input, analysis, completion and error states, HTTP failure classes, timeouts, and deployment controls that are not built into the application.',
    file: '13-operational-state-map.svg',
  },
  {
    id: 'batch',
    number: '14',
    group: 'Release and operations',
    kicker: '08 · Durable folder inference',
    title: 'The CLI makes interrupted batch runs resumable and auditable',
    evidence: [{ kind: 'code', label: 'Released code' }],
    lead: (
      <>
        Batch inference discovers supported files deterministically, verifies
        checkpoints before model construction, locks the output directory, and
        resumes only when saved metadata exactly matches the requested run.
      </>
    ),
    bullets: [
      'Images are recursively discovered and sorted; relative POSIX paths are the resume keys.',
      'An exclusive .inference.lock prevents two processes from sharing one output directory.',
      'CSV rows are validated, buffered, appended, flushed, and fsynced; metadata uses temporary-file replacement.',
      'Metadata mismatch, orphaned CSV, invalid rows, or a stale lock cause explicit refusal rather than silent continuation.',
    ],
    technical: (
      <>
        <p>
          <code>predictions.meta.json</code> records protocol and package
          versions, input root, checkpoint identity and hash status, device,
          CUDA autocast, batch size, runtime versions, preprocessing ID, and
          score definition.
        </p>
        <p>
          Fsynced CSV rows are intended to survive a process crash; images in
          the current unflushed buffer may be reprocessed. A hard crash can
          leave the lock file behind, and the operator must verify the previous
          process stopped before removing it. Replacing content at the same
          relative path requires a new output directory or{' '}
          <code>--overwrite</code>.
        </p>
      </>
    ),
    alternative: [
      {
        stage: 'Discover and preflight',
        behavior: 'Sort supported paths and verify checkpoint identities.',
        boundary: 'No model construction after a failed preflight.',
      },
      {
        stage: 'Lock and compare',
        behavior:
          'Acquire exclusive output lock and compare complete run metadata.',
        boundary: 'Mismatch or incomplete prior state refuses resume.',
      },
      {
        stage: 'Resume and predict',
        behavior:
          'Skip valid completed paths and process the remaining batches.',
        boundary:
          'Relative path is the resume key; changed content requires a fresh run.',
      },
      {
        stage: 'Persist',
        behavior:
          'Append buffered rows, flush, fsync, and atomically place metadata.',
        boundary:
          'Fsynced rows are intended to survive; an unflushed buffer can repeat.',
      },
      {
        stage: 'Recover',
        behavior:
          'Restart with matching inputs or choose overwrite intentionally.',
        boundary: 'A stale lock requires operator verification before removal.',
      },
    ],
    alt: 'CLI state machine showing deterministic file discovery, checkpoint preflight, exclusive output locking, metadata comparison, resume calculation, batched inference, durable CSV writes, atomic metadata, and crash recovery.',
    file: '14-cli-resume.svg',
  },
];

const groupCopy = {
  System: {
    number: 'Layer 01',
    description:
      'How a person, the website, and a separate model service exchange one analysis request.',
  },
  'Runtime and model contract': {
    number: 'Layer 02',
    description:
      'How a worker loads trusted identities, manages shared model memory, and transforms typed tensors.',
  },
  'Challenge context': {
    number: 'Layer 03',
    description:
      'Where DINOv3 appears in the challenge report, which details are public, and why those methods are not the released SynthFlag model.',
  },
  'Release and operations': {
    number: 'Layer 04',
    description:
      'What the public release contains, how failures surface, and how long-running folder jobs recover.',
  },
} as const;

function EvidenceTag({
  children,
  kind,
}: {
  children: ReactNode;
  kind: EvidenceKind;
}) {
  return (
    <span className={`docs-evidence docs-evidence-${kind}`}>{children}</span>
  );
}

function SectionHeading({
  children,
  kicker,
}: {
  children: ReactNode;
  kicker: string;
}) {
  return (
    <div className="docs-section-heading">
      <p>{kicker}</p>
      <h2>{children}</h2>
    </div>
  );
}

function FigureBlock({ section }: { section: AtlasSection }) {
  return (
    <figure className="docs-figure">
      <div className="docs-figure-toolbar">
        <figcaption>
          <span>Figure {section.number}</span>
          {section.title}
        </figcaption>
        <a
          className="docs-download"
          download
          href={`/diagrams/${section.file}`}
        >
          <Download aria-hidden="true" />
          Download SVG
        </a>
      </div>
      <div className="docs-figure-frame">
        <Image
          alt={section.alt}
          height={section.height ?? 900}
          loading="lazy"
          src={`/diagrams/${section.file}`}
          unoptimized
          width={section.width ?? 1440}
        />
      </div>
      <details className="docs-text-alternative atlas-text-alternative">
        <summary>Read the structured text alternative</summary>
        <div className="atlas-alternative-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Stage</th>
                <th scope="col">What happens</th>
                <th scope="col">Important boundary</th>
              </tr>
            </thead>
            <tbody>
              {section.alternative.map((row) => (
                <tr key={row.stage}>
                  <th scope="row">{row.stage}</th>
                  <td>{row.behavior}</td>
                  <td>{row.boundary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export default function ArchitectureAtlas() {
  return (
    <main className="docs-page atlas-page">
      <HashAnchorSync />
      <a className="docs-skip-link" href="#architecture-content">
        Skip to architecture atlas
      </a>

      <header className="docs-topbar">
        <div className="docs-topbar-inner">
          <a className="docs-brand" href="/" aria-label="SynthFlag home">
            <span>
              <ScanSearch aria-hidden="true" />
            </span>
            SynthFlag
          </a>
          <nav aria-label="Architecture utilities">
            <a href="/documentation">Plain-language guide</a>
            <a href={repositoryUrl} rel="noreferrer" target="_blank">
              Repository <ArrowUpRight aria-hidden="true" />
            </a>
            <PrintButton />
            <a className="docs-try-link" href="/try">
              Try detector
            </a>
          </nav>
        </div>
      </header>

      <section className="docs-hero atlas-hero">
        <div className="docs-hero-grid" aria-hidden="true" />
        <div className="docs-hero-inner">
          <nav className="docs-breadcrumb" aria-label="Breadcrumb">
            <a href="/">SynthFlag</a>
            <span aria-hidden="true">/</span>
            <a href="/documentation">Documentation</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Engineering architecture</span>
          </nav>
          <div className="docs-hero-copy">
            <p className="docs-eyebrow">Engineering architecture atlas</p>
            <h1>See the whole system, then inspect every boundary.</h1>
            <p>
              Eleven source-checked diagrams connect the public interface to its
              service runtime, checkpoint gates, tensor contract, release
              boundaries, operational states, and resumable batch workflow.
            </p>
          </div>
          <div className="docs-hero-stats" aria-label="Atlas summary">
            <div>
              <strong>11</strong>
              <span>downloadable diagrams</span>
            </div>
            <div>
              <strong>04</strong>
              <span>architecture layers</span>
            </div>
            <div>
              <strong>00</strong>
              <span>runtime API changes</span>
            </div>
          </div>
        </div>
      </section>

      <div className="docs-shell">
        <aside className="docs-toc" aria-label="On this page">
          <p>On this page</p>
          <ol>
            {contents.map(([id, label], index) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
          <div className="docs-toc-note">
            <span aria-hidden="true" />
            Public atlas · source checked
          </div>
        </aside>

        <article id="architecture-content" className="docs-content">
          <section className="docs-section docs-overview atlas-overview">
            <SectionHeading kicker="Read this first">
              The atlas answers four different questions
            </SectionHeading>
            <p className="docs-lead">
              A website request, a model prediction, and a public release are
              related—but they are not the same system.
            </p>
            <div className="atlas-overview-grid">
              <div>
                <span>Layer 01</span>
                <h3>System</h3>
                <p>Where requests travel and which component owns each job.</p>
              </div>
              <div>
                <span>Layer 02</span>
                <h3>Runtime</h3>
                <p>
                  How the process loads weights and turns tensors into scores.
                </p>
              </div>
              <div>
                <span>Layer 03</span>
                <h3>Challenge context</h3>
                <p>Where DINOv3 belongs—and where it does not—in the report.</p>
              </div>
              <div>
                <span>Layer 04</span>
                <h3>Operations</h3>
                <p>What is released, what can fail, and how work resumes.</p>
              </div>
            </div>
            <div className="atlas-boundary-note">
              <EvidenceTag kind="guidance">How to read the atlas</EvidenceTag>
              <p>
                Solid arrows show source-supported behavior for each figure;
                evidence badges distinguish released code from challenge-report
                and external-reference facts. Dashed boundaries mark
                configuration, uncertainty, rights, or deployment
                responsibilities. They do not imply hidden services.
              </p>
            </div>
          </section>

          {sections.map((section, index) => {
            const showGroup =
              index === 0 || sections[index - 1]?.group !== section.group;
            const group = groupCopy[section.group];

            return (
              <div key={section.id}>
                {showGroup ? (
                  <div className="atlas-group-header">
                    <span>{group.number}</span>
                    <div>
                      <h2>{section.group}</h2>
                      <p>{group.description}</p>
                    </div>
                  </div>
                ) : null}
                <section
                  id={section.id}
                  className={`docs-section atlas-section${section.dense ? ' atlas-section-dense' : ''}`}
                >
                  <SectionHeading kicker={section.kicker}>
                    {section.title}
                  </SectionHeading>
                  <div className="docs-explainer-grid">
                    <div className="docs-explainer">
                      {section.evidence.map((item) => (
                        <EvidenceTag
                          key={`${section.id}-${item.label}`}
                          kind={item.kind}
                        >
                          {item.label}
                        </EvidenceTag>
                      ))}
                      <p className="docs-section-lead">{section.lead}</p>
                      <ul>
                        {section.bullets.map((bullet, index) => (
                          <li key={`${section.id}-${index}`}>{bullet}</li>
                        ))}
                      </ul>
                      <details className="docs-technical">
                        <summary>Technical details · exact boundaries</summary>
                        {section.technical}
                      </details>
                    </div>
                    {section.id === 'deep-model' ? <ModelJourney /> : null}
                    <FigureBlock section={section} />
                  </div>
                </section>
              </div>
            );
          })}

          <section className="docs-section atlas-sources">
            <SectionHeading kicker="Continue the evidence trail">
              Source guide and existing model figures
            </SectionHeading>
            <div className="docs-source-list">
              <a href="/documentation">
                <span>Plain-language guide</span>
                <strong>
                  Image processing, model, ensemble, training, and results
                </strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a href={paperUrl} rel="noreferrer" target="_blank">
                <span>Primary paper</span>
                <strong>NTIRE 2026 challenge report</strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a href={repositoryUrl} rel="noreferrer" target="_blank">
                <span>Released implementation · team access</span>
                <strong>TikTok-TechJam-2026 repository</strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a href={dinoModelCardUrl} rel="noreferrer" target="_blank">
                <span>External backbone reference</span>
                <strong>Official Meta DINOv3 model card</strong>
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a href="/diagrams/07-overall-system.svg" download>
                <span>Architecture assets</span>
                <strong>
                  Download Figure 07, then use each figure toolbar for the full
                  set
                </strong>
                <Download aria-hidden="true" />
              </a>
            </div>
            <p className="docs-source-note">
              Architecture labels were checked against the released web client,
              edge proxy, Python service, model and CLI implementations,
              checkpoint manifest, reproduction guide, release audit, and paper
              Sections 3.1, 3.2, and 8.2. DINOv3 backbone details use
              Meta&apos;s official model card and reference factory. No model or
              service behavior was changed to create this atlas.
            </p>
          </section>
        </article>
      </div>

      <footer className="docs-footer">
        <div>
          <a className="docs-brand" href="/">
            <span>
              <ScanSearch aria-hidden="true" />
            </span>
            SynthFlag
          </a>
          <p>From pixels to evidence.</p>
        </div>
        <div>
          <a href="/documentation">Documentation</a>
          <a href="#overall">Back to top</a>
        </div>
      </footer>
    </main>
  );
}
