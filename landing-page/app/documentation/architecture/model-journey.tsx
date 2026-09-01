'use client';

// Historical four-expert walkthrough retained for source history. It is not
// imported by the selected-runtime documentation page.

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const stages = [
  {
    label: 'Decode once',
    title: 'Validate the file and convert it to RGB',
    detail:
      'The service checks the upload boundary, decodes one image, and produces the shared RGB source used by both model families.',
  },
  {
    label: 'CLIP view',
    title: 'Create the 224 px CLIP view',
    detail:
      'Bicubic resize, center crop, and CLIP normalization turn the shared RGB image into the native 224 × 224 input.',
  },
  {
    label: 'CLIP patches',
    title: 'Route a 16 × 16 image grid into CLIP tokens',
    detail:
      'A 14 px patch embedding creates 256 patch positions. The sample routes connect grid cells to matching token slots; CLIP adds its CLS token separately.',
  },
  {
    label: 'SigLIP view',
    title: 'Create the 384 px SigLIP view',
    detail:
      'A separate bicubic resize, center crop, and SigLIP normalization create the native 384 × 384 input from the same RGB source.',
  },
  {
    label: 'SigLIP patches',
    title: 'Route a 27 × 27 valid-convolution grid',
    detail:
      'The 14 px valid patch embedding creates 729 positions across 378 × 378 pixels. Six input pixels remain unused at the bottom and right edges.',
  },
  {
    label: 'Mix tokens',
    title: 'Mix the complete token fields through both backbones',
    detail:
      'All CLIP tokens pass through 24 transformer blocks at width 1,024; all SigLIP tokens pass through 27 blocks at width 1,152.',
  },
  {
    label: 'Pool and score',
    title: 'Pool features and run four experts serially',
    detail:
      'CLIP produces 768 features and SigLIP 1,152. The released call order is CLIP 1, CLIP 2, SigLIP 3, then SigLIP 4.',
  },
  {
    label: 'Fuse',
    title: 'Average P1–P4 into one score signal',
    detail:
      'The exact released arithmetic is (P3 + P4 + P1 + P2) / 4. The result is a score signal—not proof, attribution, or localization.',
  },
] as const;

type Route = {
  id: string;
  row: number;
  column: number;
  sourceX: number;
  sourceY: number;
  sourceSize: number;
};

const clipRoutes: Route[] = [
  {
    id: 'clip-a',
    row: 4,
    column: 6,
    sourceX: 360,
    sourceY: 240,
    sourceSize: 60,
  },
  {
    id: 'clip-b',
    row: 8,
    column: 10,
    sourceX: 600,
    sourceY: 480,
    sourceSize: 60,
  },
  {
    id: 'clip-c',
    row: 12,
    column: 5,
    sourceX: 300,
    sourceY: 720,
    sourceSize: 60,
  },
];

const siglipRoutes: Route[] = [
  {
    id: 'siglip-a',
    row: 6,
    column: 10,
    sourceX: 350,
    sourceY: 210,
    sourceSize: 35,
  },
  {
    id: 'siglip-b',
    row: 13,
    column: 17,
    sourceX: 595,
    sourceY: 455,
    sourceSize: 35,
  },
  {
    id: 'siglip-c',
    row: 21,
    column: 8,
    sourceX: 280,
    sourceY: 735,
    sourceSize: 35,
  },
];

const dogAsset = '/architecture/dog-input.jpg';
const lastStage = stages.length - 1;

function SvgTokenField({
  columns,
  rows,
  routes,
  cell,
  gap,
}: {
  columns: number;
  rows: number;
  routes: Route[];
  cell: number;
  gap: number;
}) {
  const highlighted = new Map(
    routes.map((route) => [`${route.row}-${route.column}`, route.id]),
  );

  return Array.from({ length: columns * rows }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const routeId = highlighted.get(`${row}-${column}`);

    return (
      <rect
        className={
          routeId ? `token-slot token-slot-route ${routeId}` : 'token-slot'
        }
        data-route-target={routeId}
        height={cell}
        key={`${row}-${column}`}
        rx={Math.min(2.2, cell / 3)}
        width={cell}
        x={column * (cell + gap)}
        y={row * (cell + gap)}
      />
    );
  });
}

function SvgPatchCrop({
  route,
  size,
  x,
  y,
}: {
  route: Route;
  size: number;
  x: number;
  y: number;
}) {
  return (
    <g
      className={`journey-patch-crop ${route.id}`}
      data-route-source={route.id}
    >
      <svg
        height={size}
        viewBox={`${route.sourceX} ${route.sourceY} ${route.sourceSize} ${route.sourceSize}`}
        width={size}
        x={x}
        y={y}
      >
        <image height="960" href={dogAsset} width="960" x="0" y="0" />
      </svg>
      <rect height={size} rx="10" width={size} x={x} y={y} />
      <text
        className="patch-coordinate"
        textAnchor="middle"
        x={x + size / 2}
        y={y + size + 17}
      >
        r{route.row + 1} · c{route.column + 1}
      </text>
    </g>
  );
}

function HtmlPatchCrop({ route }: { route: Route }) {
  return (
    <figure
      className={`mobile-patch-crop ${route.id}`}
      data-route-source={route.id}
    >
      <svg
        viewBox={`${route.sourceX} ${route.sourceY} ${route.sourceSize} ${route.sourceSize}`}
      >
        <image height="960" href={dogAsset} width="960" x="0" y="0" />
      </svg>
      <figcaption>
        row {route.row + 1}, column {route.column + 1}
      </figcaption>
    </figure>
  );
}

function HtmlTokenField({
  columns,
  rows,
  routes,
}: {
  columns: number;
  rows: number;
  routes: Route[];
}) {
  const cell = columns === 16 ? 7 : 4;
  const gap = columns === 16 ? 2 : 1.5;
  const width = columns * cell + (columns - 1) * gap;
  const height = rows * cell + (rows - 1) * gap;

  return (
    <svg
      aria-hidden="true"
      className="mobile-token-field"
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${width} ${height}`}
    >
      <SvgTokenField
        cell={cell}
        columns={columns}
        gap={gap}
        routes={routes}
        rows={rows}
      />
    </svg>
  );
}

function DesktopJourneyCanvas() {
  const expertHeads = [
    { label: 'CLIP 1', particle: 'P1', x: 860, y: 122, className: 'clip-head' },
    { label: 'CLIP 2', particle: 'P2', x: 960, y: 220, className: 'clip-head' },
    {
      label: 'SIGLIP 3',
      particle: 'P3',
      x: 1048,
      y: 284,
      className: 'siglip-head',
    },
    {
      label: 'SIGLIP 4',
      particle: 'P4',
      x: 1136,
      y: 348,
      className: 'siglip-head',
    },
  ];

  const fusionOutputs = [
    { label: 'P3', x: 672, className: 'siglip-output' },
    { label: 'P4', x: 790, className: 'siglip-output' },
    { label: 'P1', x: 908, className: 'clip-output' },
    { label: 'P2', x: 1026, className: 'clip-output' },
  ];

  return (
    <div className="journey-desktop-canvas" aria-hidden="true">
      <svg viewBox="0 0 1240 660" role="presentation">
        <defs>
          <clipPath id="journey-dog-clip">
            <rect height="480" rx="28" width="480" x="40" y="96" />
          </clipPath>
          <pattern
            id="journey-grid-clip"
            height="30"
            patternUnits="userSpaceOnUse"
            width="30"
          >
            <path d="M30 0H0V30" fill="none" stroke="#8fb7ff" strokeWidth="1" />
          </pattern>
          <pattern
            id="journey-grid-siglip"
            height="17.5"
            patternUnits="userSpaceOnUse"
            width="17.5"
          >
            <path
              d="M17.5 0H0V17.5"
              fill="none"
              stroke="#ffd270"
              strokeWidth="0.85"
            />
          </pattern>
          <filter
            id="journey-route-glow"
            height="240%"
            width="240%"
            x="-70%"
            y="-70%"
          >
            <feGaussianBlur result="blur" stdDeviation="4" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker
            id="journey-arrow-blue"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
          >
            <path d="M0 0L8 4L0 8Z" fill="#70a4ff" />
          </marker>
          <marker
            id="journey-arrow-gold"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
          >
            <path d="M0 0L8 4L0 8Z" fill="#ffd270" />
          </marker>
        </defs>

        <g className="journey-dog-base">
          <rect
            className="journey-dog-shell"
            height="524"
            rx="32"
            width="516"
            x="22"
            y="70"
          />
          <image
            clipPath="url(#journey-dog-clip)"
            height="480"
            href={dogAsset}
            preserveAspectRatio="xMidYMid slice"
            width="480"
            x="40"
            y="96"
          />
          <text className="node-kicker" x="44" y="55">
            ONE SHARED RGB IMAGE
          </text>
          <text className="node-caption" x="44" y="620">
            Original illustrative input · decoded once
          </text>
          <circle className="journey-scan-dot" cx="510" cy="55" r="5" />
        </g>

        <g className="journey-scene journey-scene-0">
          <rect
            className="scene-card scene-card-integrity"
            height="170"
            rx="24"
            width="580"
            x="600"
            y="218"
          />
          <text className="node-kicker" x="634" y="258">
            UPLOAD BOUNDARY
          </text>
          <text className="scene-title" x="634" y="307">
            validate → decode once → RGB
          </text>
          <text className="scene-copy" x="634" y="346">
            One source image feeds both released model families.
          </text>
        </g>

        <g className="journey-scene journey-scene-1">
          <rect
            className="scene-card scene-card-clip"
            height="216"
            rx="24"
            width="590"
            x="590"
            y="176"
          />
          <text className="node-kicker" x="626" y="218">
            CLIP INPUT VIEW
          </text>
          <text className="scene-metric" x="626" y="282">
            224 × 224
          </text>
          <text className="scene-title" x="626" y="324">
            Bicubic resize · center crop
          </text>
          <text className="scene-copy" x="626" y="356">
            Then normalize with the released CLIP preprocessing.
          </text>
          <path
            className="view-arrow rail-clip"
            d="M540 336C566 336 562 282 590 282"
            markerEnd="url(#journey-arrow-blue)"
          />
        </g>

        <g className="journey-scene journey-scene-2">
          <rect
            className="scene-card scene-card-clip"
            height="520"
            rx="26"
            width="620"
            x="570"
            y="66"
          />
          <text className="node-kicker" x="598" y="101">
            CLIP PATCH ROUTES
          </text>
          <text className="scene-copy" x="598" y="128">
            Example patch routes—not importance or attribution.
          </text>

          <rect
            className="journey-grid-surface clip-surface"
            height="480"
            width="480"
            x="40"
            y="96"
          />
          {clipRoutes.map((route) => (
            <rect
              className={`route-cell ${route.id}`}
              data-route-source-cell={route.id}
              height="30"
              key={route.id}
              width="30"
              x={40 + route.column * 30}
              y={96 + route.row * 30}
            />
          ))}

          {clipRoutes.map((route, index) => {
            const sourceX = 40 + route.column * 30 + 15;
            const sourceY = 96 + route.row * 30 + 15;
            const cropY = 176 + index * 130;
            const targetX = 907 + route.column * 11;
            const targetY = 174 + route.row * 11;
            const path =
              `M${sourceX} ${sourceY} C548 ${sourceY} 548 ${cropY + 36} 602 ${cropY + 36} ` +
              `M674 ${cropY + 36} C760 ${cropY + 36} 800 ${targetY} ${targetX} ${targetY}`;
            return (
              <path
                className={`patch-route rail-clip ${route.id}`}
                d={path}
                key={route.id}
              />
            );
          })}

          {clipRoutes.map((route, index) => (
            <SvgPatchCrop
              key={route.id}
              route={route}
              size={72}
              x={602}
              y={176 + index * 130}
            />
          ))}

          <g
            className="token-bank token-bank-clip"
            transform="translate(907 174)"
          >
            <SvgTokenField
              cell={8}
              columns={16}
              gap={3}
              routes={clipRoutes}
              rows={16}
            />
          </g>
          <rect
            className="cls-token"
            height="34"
            rx="10"
            width="82"
            x="1050"
            y="475"
          />
          <text className="node-kicker" textAnchor="middle" x="1091" y="497">
            CLS · ADDED
          </text>
          <text className="node-number" textAnchor="middle" x="1000" y="543">
            256 + CLS
          </text>
          <text className="node-caption" textAnchor="middle" x="1000" y="567">
            [B, 257, 1,024]
          </text>

          {clipRoutes.map((route, index) => (
            <circle
              className={`route-particle rail-clip ${route.id}`}
              filter="url(#journey-route-glow)"
              key={route.id}
              r="4"
            >
              <animateMotion
                begin={`${index * 0.28}s`}
                dur="2.2s"
                path={`M674 ${212 + index * 130} C760 ${212 + index * 130} 800 ${174 + route.row * 11} ${907 + route.column * 11} ${174 + route.row * 11}`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        <g className="journey-scene journey-scene-3">
          <rect
            className="scene-card scene-card-siglip"
            height="216"
            rx="24"
            width="590"
            x="590"
            y="176"
          />
          <text className="node-kicker" x="626" y="218">
            SIGLIP INPUT VIEW
          </text>
          <text className="scene-metric" x="626" y="282">
            384 × 384
          </text>
          <text className="scene-title" x="626" y="324">
            Bicubic resize · center crop
          </text>
          <text className="scene-copy" x="626" y="356">
            Then normalize with the released SigLIP preprocessing.
          </text>
          <path
            className="view-arrow rail-siglip"
            d="M540 336C566 336 562 282 590 282"
            markerEnd="url(#journey-arrow-gold)"
          />
        </g>

        <g className="journey-scene journey-scene-4">
          <rect
            className="scene-card scene-card-siglip"
            height="520"
            rx="26"
            width="620"
            x="570"
            y="66"
          />
          <text className="node-kicker" x="598" y="101">
            SIGLIP PATCH ROUTES
          </text>
          <text className="scene-copy" x="598" y="128">
            Example patch routes—not importance or attribution.
          </text>

          <rect
            className="journey-grid-surface siglip-surface"
            height="472.5"
            width="472.5"
            x="40"
            y="96"
          />
          <rect
            className="siglip-remainder remainder-right"
            height="480"
            width="7.5"
            x="512.5"
            y="96"
          />
          <rect
            className="siglip-remainder remainder-bottom"
            height="7.5"
            width="480"
            x="40"
            y="568.5"
          />
          <text className="remainder-label" textAnchor="end" x="516" y="591">
            6 px unused bottom + right
          </text>
          {siglipRoutes.map((route) => (
            <rect
              className={`route-cell siglip-cell ${route.id}`}
              data-route-source-cell={route.id}
              height="17.5"
              key={route.id}
              width="17.5"
              x={40 + route.column * 17.5}
              y={96 + route.row * 17.5}
            />
          ))}

          {siglipRoutes.map((route, index) => {
            const sourceX = 40 + route.column * 17.5 + 8.75;
            const sourceY = 96 + route.row * 17.5 + 8.75;
            const cropY = 176 + index * 130;
            const targetX = 922 + route.column * 6.25;
            const targetY = 176 + route.row * 6.25;
            const path =
              `M${sourceX} ${sourceY} C548 ${sourceY} 548 ${cropY + 36} 602 ${cropY + 36} ` +
              `M674 ${cropY + 36} C760 ${cropY + 36} 820 ${targetY} ${targetX} ${targetY}`;
            return (
              <path
                className={`patch-route rail-siglip ${route.id}`}
                d={path}
                key={route.id}
              />
            );
          })}

          {siglipRoutes.map((route, index) => (
            <SvgPatchCrop
              key={route.id}
              route={route}
              size={72}
              x={602}
              y={176 + index * 130}
            />
          ))}

          <g
            className="token-bank token-bank-siglip"
            transform="translate(922 176)"
          >
            <SvgTokenField
              cell={4.5}
              columns={27}
              gap={1.75}
              routes={siglipRoutes}
              rows={27}
            />
          </g>
          <text className="node-number" textAnchor="middle" x="1004" y="543">
            729 tokens
          </text>
          <text className="node-caption" textAnchor="middle" x="1004" y="567">
            [B, 729, 1,152]
          </text>

          {siglipRoutes.map((route, index) => (
            <circle
              className={`route-particle rail-siglip ${route.id}`}
              filter="url(#journey-route-glow)"
              key={route.id}
              r="4"
            >
              <animateMotion
                begin={`${index * 0.28}s`}
                dur="2.2s"
                path={`M674 ${212 + index * 130} C760 ${212 + index * 130} 820 ${176 + route.row * 6.25} ${922 + route.column * 6.25} ${176 + route.row * 6.25}`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        <g className="journey-scene journey-scene-5">
          <text className="node-kicker" x="600" y="88">
            COMPLETE TOKEN FIELDS
          </text>
          <g className="mix-lane mix-lane-clip">
            <rect
              className="scene-card scene-card-clip"
              height="218"
              rx="24"
              width="580"
              x="590"
              y="108"
            />
            <g
              className="token-bank token-bank-small"
              transform="translate(626 147)"
            >
              <SvgTokenField
                cell={6.5}
                columns={16}
                gap={2.4}
                routes={clipRoutes}
                rows={16}
              />
            </g>
            <path
              className="mix-stream rail-clip"
              d="M770 217C820 178 850 256 900 217S980 178 1025 217"
            />
            <g className="transformer-stack transformer-stack-clip">
              <rect height="104" rx="15" width="112" x="1016" y="178" />
              <rect height="104" rx="15" width="112" x="1005" y="167" />
              <rect height="104" rx="15" width="112" x="994" y="156" />
              <text
                className="node-kicker"
                textAnchor="middle"
                x="1050"
                y="190"
              >
                CLIP
              </text>
              <text
                className="scene-metric"
                textAnchor="middle"
                x="1050"
                y="236"
              >
                ×24
              </text>
              <text
                className="node-caption"
                textAnchor="middle"
                x="1050"
                y="262"
              >
                width 1,024
              </text>
            </g>
          </g>
          <g className="mix-lane mix-lane-siglip">
            <rect
              className="scene-card scene-card-siglip"
              height="218"
              rx="24"
              width="580"
              x="590"
              y="350"
            />
            <g
              className="token-bank token-bank-small token-bank-small-siglip"
              transform="translate(625 389)"
            >
              <SvgTokenField
                cell={3.4}
                columns={27}
                gap={1.15}
                routes={siglipRoutes}
                rows={27}
              />
            </g>
            <path
              className="mix-stream rail-siglip"
              d="M770 459C820 420 850 498 900 459S980 420 1025 459"
            />
            <g className="transformer-stack transformer-stack-siglip">
              <rect height="104" rx="15" width="112" x="1016" y="420" />
              <rect height="104" rx="15" width="112" x="1005" y="409" />
              <rect height="104" rx="15" width="112" x="994" y="398" />
              <text
                className="node-kicker"
                textAnchor="middle"
                x="1050"
                y="432"
              >
                SIGLIP
              </text>
              <text
                className="scene-metric"
                textAnchor="middle"
                x="1050"
                y="478"
              >
                ×27
              </text>
              <text
                className="node-caption"
                textAnchor="middle"
                x="1050"
                y="504"
              >
                width 1,152
              </text>
            </g>
          </g>
          <circle className="mix-particle clip-particle" r="5">
            <animateMotion
              dur="1.9s"
              path="M770 217C820 178 850 256 900 217S980 178 1025 217"
              repeatCount="indefinite"
            />
          </circle>
          <circle className="mix-particle siglip-particle" r="5">
            <animateMotion
              begin="0.35s"
              dur="1.9s"
              path="M770 459C820 420 850 498 900 459S980 420 1025 459"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        <g className="journey-scene journey-scene-6">
          <rect
            className="scene-card scene-card-clip"
            height="174"
            rx="24"
            width="254"
            x="580"
            y="94"
          />
          <text className="node-kicker" x="610" y="130">
            CLIP · CLS + PROJECTION
          </text>
          <text className="scene-metric" x="610" y="184">
            768
          </text>
          <text className="scene-copy" x="610" y="218">
            pooled features
          </text>
          <rect
            className="scene-card scene-card-siglip"
            height="174"
            rx="24"
            width="254"
            x="580"
            y="302"
          />
          <text className="node-kicker" x="610" y="338">
            SIGLIP · PROBE POOL
          </text>
          <text className="scene-metric" x="610" y="392">
            1,152
          </text>
          <text className="scene-copy" x="610" y="426">
            pooled features
          </text>

          <path
            className="serial-rail"
            d="M854 181H902V245H1002V309H1090V373H1180"
          />
          {expertHeads.map((head, index) => (
            <g
              className={`serial-head serial-head-${index + 1} ${head.className}`}
              key={head.label}
            >
              <rect height="88" rx="16" width="88" x={head.x} y={head.y} />
              <text
                className="node-kicker"
                textAnchor="middle"
                x={head.x + 44}
                y={head.y + 35}
              >
                {head.label}
              </text>
              <text
                className="node-number"
                textAnchor="middle"
                x={head.x + 44}
                y={head.y + 65}
              >
                {head.particle}
              </text>
            </g>
          ))}
          <text className="execution-label" x="860" y="515">
            Released serial order
          </text>
          <text className="scene-title" x="860" y="548">
            CLIP 1 → CLIP 2 → SigLIP 3 → SigLIP 4
          </text>
        </g>

        <g className="journey-scene journey-scene-7">
          <rect
            className="fusion-card"
            height="408"
            rx="30"
            width="590"
            x="590"
            y="104"
          />
          <text className="node-kicker" textAnchor="middle" x="885" y="151">
            RELEASED FUSION
          </text>
          {fusionOutputs.map((output) => (
            <g
              className={`fusion-particle ${output.className}`}
              key={output.label}
            >
              <circle cx={output.x} cy="212" r="30" />
              <text
                className="node-number"
                textAnchor="middle"
                x={output.x}
                y="220"
              >
                {output.label}
              </text>
              <path d={`M${output.x} 246C${output.x} 290 885 282 885 328`} />
            </g>
          ))}
          <rect
            className="fusion-formula"
            height="88"
            rx="22"
            width="380"
            x="695"
            y="323"
          />
          <text className="formula-text" textAnchor="middle" x="885" y="378">
            (P3 + P4 + P1 + P2) / 4
          </text>
          <text className="score-warning" textAnchor="middle" x="885" y="466">
            Score signal—not proof.
          </text>
        </g>
      </svg>
    </div>
  );
}

function MobileJourneyCanvas({ activeStage }: { activeStage: number }) {
  const patchStage =
    activeStage === 2 ? 'clip' : activeStage === 4 ? 'siglip' : null;
  const routes = patchStage === 'clip' ? clipRoutes : siglipRoutes;

  return (
    <div className="journey-mobile-canvas" aria-hidden="true">
      <div
        className={`mobile-dog-frame ${patchStage ? `mobile-grid-${patchStage}` : ''}`}
      >
        <Image
          alt=""
          height={960}
          sizes="(max-width: 899px) 100vw, 0px"
          src={dogAsset}
          width={960}
        />
        {patchStage === 'clip' && (
          <div className="mobile-grid-overlay mobile-clip-grid" />
        )}
        {patchStage === 'siglip' && (
          <>
            <div className="mobile-grid-overlay mobile-siglip-grid" />
            <div className="mobile-siglip-remainder mobile-remainder-right" />
            <div className="mobile-siglip-remainder mobile-remainder-bottom" />
          </>
        )}
        {patchStage &&
          routes.map((route) => {
            const isClip = patchStage === 'clip';
            const left = isClip
              ? (route.column / 16) * 100
              : ((route.column * 14) / 384) * 100;
            const top = isClip
              ? (route.row / 16) * 100
              : ((route.row * 14) / 384) * 100;
            const size = isClip ? 100 / 16 : (14 / 384) * 100;

            return (
              <span
                className={`mobile-route-cell ${route.id}`}
                data-route-source-cell={route.id}
                key={route.id}
                style={{
                  height: `${size}%`,
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${size}%`,
                }}
              />
            );
          })}
        <span className="mobile-dog-label">shared RGB image</span>
      </div>

      {activeStage === 0 && (
        <div className="mobile-stage-card integrity-card">
          <strong>Validate → decode once → RGB</strong>
          <span>One source image feeds both model families.</span>
        </div>
      )}
      {activeStage === 1 && (
        <div className="mobile-stage-card clip-card">
          <span>CLIP input view</span>
          <strong>224 × 224</strong>
          <small>Bicubic resize · center crop · CLIP normalization</small>
        </div>
      )}
      {activeStage === 3 && (
        <div className="mobile-stage-card siglip-card">
          <span>SigLIP input view</span>
          <strong>384 × 384</strong>
          <small>Bicubic resize · center crop · SigLIP normalization</small>
        </div>
      )}

      {patchStage && (
        <div className={`mobile-patch-route mobile-patch-route-${patchStage}`}>
          <p>Example patch routes—not importance or attribution.</p>
          {patchStage === 'siglip' && (
            <small>27 × 14 px = 378 px · 6 px unused bottom + right</small>
          )}
          <ArrowDown aria-hidden="true" className="mobile-route-arrow" />
          <div className="mobile-patch-tray">
            {routes.map((route) => (
              <HtmlPatchCrop key={route.id} route={route} />
            ))}
          </div>
          <ArrowDown aria-hidden="true" className="mobile-route-arrow" />
          <div className="mobile-token-bank">
            <div>
              <span>
                {patchStage === 'clip'
                  ? '16 × 16 token field'
                  : '27 × 27 token field'}
              </span>
              <strong>
                {patchStage === 'clip'
                  ? '256 patches + CLS'
                  : '729 patch tokens'}
              </strong>
            </div>
            <HtmlTokenField
              columns={patchStage === 'clip' ? 16 : 27}
              routes={routes}
              rows={patchStage === 'clip' ? 16 : 27}
            />
          </div>
        </div>
      )}

      {activeStage === 5 && (
        <div className="mobile-mix-stack">
          <div className="mobile-stage-card clip-card">
            <span>Complete CLIP field</span>
            <strong>256 + CLS → ×24</strong>
            <small>Transformer width 1,024</small>
          </div>
          <ArrowDown aria-hidden="true" className="mobile-route-arrow" />
          <div className="mobile-stage-card siglip-card">
            <span>Complete SigLIP field</span>
            <strong>729 → ×27</strong>
            <small>Transformer width 1,152</small>
          </div>
        </div>
      )}

      {activeStage === 6 && (
        <div className="mobile-expert-stack">
          <div className="mobile-feature-row">
            <span>CLIP pool</span>
            <strong>768 features</strong>
          </div>
          <div className="mobile-feature-row">
            <span>SigLIP probe pool</span>
            <strong>1,152 features</strong>
          </div>
          <p>Released serial order</p>
          <ol>
            <li>
              CLIP 1 <span>P1</span>
            </li>
            <li>
              CLIP 2 <span>P2</span>
            </li>
            <li>
              SigLIP 3 <span>P3</span>
            </li>
            <li>
              SigLIP 4 <span>P4</span>
            </li>
          </ol>
        </div>
      )}

      {activeStage === 7 && (
        <div className="mobile-fusion-card">
          <div>
            <span>P3</span>
            <span>P4</span>
            <span>P1</span>
            <span>P2</span>
          </div>
          <strong>(P3 + P4 + P1 + P2) / 4</strong>
          <p>Score signal—not proof.</p>
        </div>
      )}
    </div>
  );
}

function ReducedMotionMap() {
  return (
    <div className="journey-reduced-map">
      <div className="reduced-dog-pair">
        <figure className="reduced-dog reduced-dog-clip">
          <div>
            <Image
              alt="Illustrative dog input with a 16 by 16 CLIP patch grid"
              height={960}
              sizes="(prefers-reduced-motion: reduce) 50vw, 0px"
              src={dogAsset}
              width={960}
            />
          </div>
          <figcaption>
            <strong>CLIP · 16 × 16</strong>
            <span>256 patches + separate CLS</span>
          </figcaption>
        </figure>
        <figure className="reduced-dog reduced-dog-siglip">
          <div>
            <Image
              alt="Illustrative dog input with a 27 by 27 SigLIP patch grid and unused edge remainder"
              height={960}
              sizes="(prefers-reduced-motion: reduce) 50vw, 0px"
              src={dogAsset}
              width={960}
            />
          </div>
          <figcaption>
            <strong>SigLIP · 27 × 27</strong>
            <span>729 patches · 6 px remainder</span>
          </figcaption>
        </figure>
      </div>
      <p>
        Representative source crops route to matching token positions. Example
        patch routes—not importance or attribution.
      </p>
      <div className="reduced-route-crops">
        {[clipRoutes[0], clipRoutes[1], siglipRoutes[0], siglipRoutes[1]].map(
          (route) => (
            <HtmlPatchCrop key={route.id} route={route} />
          ),
        )}
      </div>
    </div>
  );
}

export function ModelJourney() {
  const root = useRef<HTMLDivElement>(null);
  const replayTween = useRef<gsap.core.Tween | null>(null);
  const replaying = useRef(false);
  const [activeStage, setActiveStage] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const media = gsap.matchMedia();
    media.add(
      '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
      () => {
        const trigger = ScrollTrigger.create({
          trigger: element,
          start: 'top 18%',
          end: 'bottom 82%',
          scrub: 0.65,
          onUpdate: (self) => {
            if (replaying.current) return;
            setActiveStage(
              Math.min(lastStage, Math.floor(self.progress * stages.length)),
            );
          },
        });

        return () => trigger.kill();
      },
    );

    return () => {
      replayTween.current?.kill();
      media.revert();
    };
  }, []);

  const selectStage = useCallback((stage: number) => {
    replayTween.current?.kill();
    replaying.current = false;
    setIsReplaying(false);
    setActiveStage(Math.max(0, Math.min(lastStage, stage)));
  }, []);

  const replay = useCallback(() => {
    replayTween.current?.kill();
    const playhead = { stage: 0 };
    replaying.current = true;
    setIsReplaying(true);
    setActiveStage(0);
    replayTween.current = gsap.to(playhead, {
      stage: lastStage,
      duration: 8.4,
      ease: 'none',
      snap: { stage: 1 },
      onUpdate: () => setActiveStage(Math.round(playhead.stage)),
      onComplete: () => {
        replaying.current = false;
        setIsReplaying(false);
      },
    });
  }, []);

  const stage = stages[activeStage];

  return (
    <>
      <noscript>
        <style>{'.model-journey{display:none!important}'}</style>
      </noscript>
      <div
        className="model-journey"
        data-stage={activeStage}
        ref={root}
        tabIndex={-1}
      >
        <div className="model-journey-sticky">
          <div className="journey-heading">
            <div>
              <p>Interactive execution trace</p>
              <h3>See image patches become model tokens</h3>
            </div>
            <span>Illustrative execution trace—not a model prediction</span>
          </div>

          <div className="journey-stage">
            <DesktopJourneyCanvas />
            <MobileJourneyCanvas activeStage={activeStage} />
          </div>

          <div className="journey-caption">
            <div className="journey-progress" aria-hidden="true">
              <span
                style={{
                  width: `${((activeStage + 1) / stages.length) * 100}%`,
                }}
              />
            </div>
            <div
              className="journey-caption-copy"
              aria-atomic="true"
              aria-live="polite"
            >
              <span>
                {String(activeStage + 1).padStart(2, '0')} /{' '}
                {String(stages.length).padStart(2, '0')} · {stage.label}
              </span>
              <h4>{stage.title}</h4>
              <p>{stage.detail}</p>
            </div>
            <div
              className="journey-controls"
              aria-label="Execution trace controls"
            >
              <Button
                aria-label="Previous execution stage"
                className="journey-control"
                disabled={activeStage === 0}
                onClick={() => selectStage(activeStage - 1)}
                size="icon"
                variant="outline"
              >
                <ArrowLeft aria-hidden="true" />
              </Button>
              <Button
                className="journey-replay"
                disabled={isReplaying}
                onClick={replay}
                variant="outline"
              >
                <RotateCcw aria-hidden="true" />
                {isReplaying ? 'Playing' : 'Replay'}
              </Button>
              <Button
                aria-label="Next execution stage"
                className="journey-control"
                disabled={activeStage === lastStage}
                onClick={() => selectStage(activeStage + 1)}
                size="icon"
                variant="outline"
              >
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </div>

          <p className="journey-boundary-note">
            The branches describe logical data flow, not concurrent execution.
            Highlighted cells are example patch routes—not importance,
            attention, attribution, or localization.
          </p>

          <ReducedMotionMap />
          <ol
            className="journey-static-steps"
            aria-label="Static execution trace"
          >
            {stages.map((item, index) => (
              <li key={item.label}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
