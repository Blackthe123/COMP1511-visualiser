# Memstack — a COMP1511 memory visualiser

A click-and-drag tool for building up a picture of the C stack and heap by
hand: declare variables, malloc blocks, wire up pointers, push and pop
stack frames, and watch it all laid out with hoverable, colour-coded
memory cells.

## Running it locally

```bash
npm install
npm run dev
```

Opens on http://localhost:5173 by default.

## Building for deployment

```bash
npm run build
```

Produces a static site in `dist/` — drag that folder onto Netlify/Vercel,
or push it to a `gh-pages` branch for GitHub Pages, or serve it from
literally any static host. No backend, no server, nothing to configure.

## How it's put together

```
src/
  model/types.ts        — the data model: MemCell, StackFrame, MemoryState
  state/reducer.ts       — every action that can happen to memory
                            (declare, malloc, free, connect pointers,
                            push/pop frames, "upgrade RAM")
  state/MemoryContext.tsx — React context wiring the reducer to the UI,
                            plus a registry of each cell's DOM node
                            (used to draw pointer wires)
  components/
    Toolbox.tsx          — the palette of actions (buttons + small forms)
    ScenarioBar.tsx       — guided walkthroughs, built from the SAME
                            reducer actions as the free-form sandbox
    StackPanel.tsx / HeapPanel.tsx — the two main panels
    MemoryCell.tsx        — a single hoverable, colour-coded memory chip
    PointerArrows.tsx     — SVG overlay that draws the glowing wires
                            between pointers/nodes and what they point to
    InfoDrawer.tsx        — the "stack vs heap" explainer panel
    ActionLog.tsx         — running history, phrased as C statements
  scenarios/scenarios.ts — guided scenario scripts (name-based, so they
                            don't need to know runtime-generated ids)
```

### Extending it

- **New palette action**: add a case to the `Action` union and `reducer`
  in `state/reducer.ts`, then wire a button + small form into
  `Toolbox.tsx`.
- **New guided scenario**: add an entry to `scenarios/scenarios.ts`. Steps
  are either a raw reducer `action`, or one of `connectPointer` /
  `connectNodeNext` / `freePointerName`, which resolve by variable name
  against whatever's currently on screen.
- **A future "type real C code" mode**: the reducer already models
  everything by explicit action (declare, malloc, connect, free, push/pop
  frame) — a parser for a small C subset would just need to emit the same
  actions instead of a human clicking buttons. The visual layer wouldn't
  need to change.

## Known simplifications (intentional, for teaching clarity)

- Addresses are fake, sequential, and reset every session — real
  addresses are neither predictable nor meaningful to reason about, and
  showing tidy incrementing hex values keeps attention on relative
  layout (stack down, heap up) rather than literal numbers.
- Struct support is limited to a single linked-list node shape
  (`{ data, next }`) since that's what COMP1511 needs; general structs
  aren't modelled.
- `malloc` failures are simulated by capping the heap size (see the RAM
  upgrade button) rather than modelling real system memory limits.
