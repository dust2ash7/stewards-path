import{S as e,T as t,bt as n,o as r,q as i,t as a,u as o,vt as s,w as c}from"./ui-CA0vIfNn.js";var l=n(s()),u=i(),d={id:`footing-you-can-explain`,category:`Civil & Structural Basics`,title:`A Footing You Can Explain`,level:`beginner`,estimatedMinutes:8,content:`Before you set a post, a short pier, or the start of a boardwalk, you should be able to say what the ground is doing.

Dig past duff and loose topsoil until the material feels firm and stays firm when you tamp it. A hole full of leaves and soft fill is not a footing. The hole needs to be wider than the post so you can compact around it, not just drop it in.

Depth is not a vibe. If you can rock the post by hand, people will rock it with their weight. In coastal southern California the frost line is not your main enemy. Loose fill, a sloping hole, and water that scours the toe are.

Stop and ask for help when the span crosses water, carries a roof, or will be used by the public. This lesson is a habit of mind, not a stamped design.

## Field check

- Can you name the material at the bottom of the hole?
- Does the post stand without you holding it, before you backfill?
- Will water sit against the post, or run off?
- Can you explain the footing in two sentences to another person?`,keyPoints:[`Bottom the hole on firm material, not duff.`,`If it rocks by hand, it is not done.`,`Water, spans, and the public are reasons to stop and get a real design.`],quiz:[{question:`What should be at the bottom of a footing hole?`,options:[`Loose duff and leaves`,`Firm material you can name`,`Whatever the auger stopped on`,`Mulch, so the post stays moist`],answer:1},{question:`When should you stop and get a qualified design?`,options:[`When the hole is slightly wider than the post`,`When the work spans water, carries a roof, or the public will rely on it`,`Only if the post is wood`,`Never, if you have built a fence before`],answer:1}],resources:[{title:`Say the footing out loud`,note:`If you cannot explain depth, material, and how water leaves, do not build it.`}],addedBy:`bot`,dateAdded:`2026-10-23`},f=`{
  "id": "reading-slope-before-you-cut",
  "category": "Trails, Fences & Bridges",
  "title": "Reading Slope Before You Cut",
  "level": "beginner",
  "estimatedMinutes": 12,
  "content": "Start with what to do on the ground. Markdown. ## headings, lists, **bold**. No raw HTML.",
  "keyPoints": ["One short line you can remember in the field."],
  "illustrations": [
    {
      "type": "trail-cross-section",
      "description": "What the plate shows, in one or two sentences.",
      "alt": "Describe the image for someone who cannot see it.",
      "caption": "What to look for in the picture."
    }
  ],
  "videos": [
    {
      "title": "Short clip title",
      "duration": "2 min",
      "watchFor": "The one thing to notice.",
      "url": "https://www.youtube.com/watch?v=xxxxxxxxxxx"
    }
  ],
  "interactiveElements": [
    { "id": "outslope", "kind": "outslope-visual" }
  ],
  "howWeKnow": {
    "discovered": "How people first figured this out. A concrete story or method.",
    "verified": "How it has been checked since: measurements, standards, repeated field practice.",
    "wrong": "The usual mistake, and how to check.",
    "decision": "A real choice this knowledge changes on a reserve."
  },
  "fieldChecks": [
    { "id": "slope-named", "label": "I can point to where water leaves this tread." }
  ],
  "tryThis": {
    "title": "Read one grade before you cut",
    "minutes": 8,
    "steps": ["Pick a 20-step stretch.", "Say where the water goes.", "Write one sentence."]
  },
  "quiz": [
    {
      "kind": "choice",
      "question": "Question text?",
      "options": ["First", "Second", "Third"],
      "answer": 0,
      "explanation": "Why that answer is the one you can use outside."
    }
  ],
  "resources": [{ "title": "A field note", "note": "Or use a url instead of a note." }],
  "addedBy": "bot",
  "dateAdded": "2026-10-23"
}`;function p(){let{ready:n,lessons:i}=e(),[s,p]=(0,l.useState)(``),[m,h]=(0,l.useState)([]),[g,_]=(0,l.useState)(null);function v(){_(null);let e=c(s);if(!e.ok){h(e.errors);return}if(!n){h([`Still opening notes on this phone. Try again in a moment.`]);return}let t=e.lessons.filter(e=>i.some(t=>t.id===e.id)).length,r=e.lessons.length-t;o(e.lessons),h([]),p(``);let a=[];r>0&&a.push(r===1?`Added 1 lesson`:`Added ${r} lessons`),t>0&&a.push(t===1?`updated 1 that was already here`:`updated ${t} that were already here`),_(`${a.join(`, `)}. They are on the shelves now.`)}return(0,u.jsxs)(`div`,{children:[(0,u.jsx)(r,{kicker:`Import`,title:`Add a lesson`,lede:`Paste JSON from a Grok bot. It is checked, then saved on this phone. You do not need a new build of the app.`}),(0,u.jsxs)(`label`,{className:`block`,htmlFor:`lesson-json`,children:[(0,u.jsx)(`span`,{className:`text-base font-semibold text-ink`,children:`Lesson JSON`}),(0,u.jsx)(`textarea`,{id:`lesson-json`,value:s,onChange:e=>p(e.target.value),spellCheck:!1,rows:12,placeholder:`Paste one lesson { } or a list [ ].`,className:`mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-ink placeholder:text-muted`})]}),(0,u.jsxs)(`div`,{className:`mt-3 flex flex-col gap-2 sm:flex-row`,children:[(0,u.jsx)(a,{onClick:v,disabled:!n,children:`Add to library`}),(0,u.jsx)(a,{variant:`ghost`,onClick:()=>{p(JSON.stringify(d,null,2)),h([]),_(`Example loaded. Add it to put a footing lesson on the Civil shelf.`)},children:`Load example`}),(0,u.jsx)(a,{variant:`quiet`,onClick:()=>{p(``),h([]),_(null)},children:`Clear`})]}),g?(0,u.jsx)(`p`,{className:`mt-4 rounded-xl border border-brass bg-surface px-4 py-3 text-base text-ink`,role:`status`,children:g}):null,m.length>0?(0,u.jsxs)(`div`,{className:`mt-4 rounded-xl border border-line bg-elevated px-4 py-3`,role:`alert`,children:[(0,u.jsx)(`p`,{className:`font-semibold text-ink`,children:`Fix this before it can be added`}),(0,u.jsx)(`ul`,{className:`mt-2 list-disc space-y-1 pl-5 text-base text-ink`,children:m.map(e=>(0,u.jsx)(`li`,{children:e},e))})]}):null,(0,u.jsxs)(`section`,{className:`mt-10`,children:[(0,u.jsx)(`h2`,{className:`font-display text-2xl text-ink`,children:`How to add lessons with Grok bots`}),(0,u.jsxs)(`div`,{className:`mt-3 space-y-3 text-base leading-relaxed text-pretty text-ink`,children:[(0,u.jsx)(`p`,{children:`Ask for one lesson as JSON in the shape below. Practical how-to first, then how we know it is true, then something the steward can check on the ground. Paste the result here. One object, or a list in square brackets. No comments, no trailing commas.`}),(0,u.jsxs)(`p`,{children:[`The same shape lives in the project file `,(0,u.jsx)(`span`,{className:`font-semibold`,children:`src/data/lessons.json`}),` for a bot that is editing the app itself. Do not rename fields. Lessons that only have the old fields still import.`]}),(0,u.jsx)(`p`,{children:`Category must be one of these, unless you mean to start a new shelf:`}),(0,u.jsx)(`ul`,{className:`list-disc space-y-1 pl-5 marker:text-brass`,children:t.map(e=>(0,u.jsx)(`li`,{children:e.name},e.name))}),(0,u.jsx)(`h3`,{className:`font-display text-xl text-ink`,children:`Preferred lesson shape`}),(0,u.jsxs)(`ul`,{className:`list-disc space-y-2 pl-5 marker:text-brass`,children:[(0,u.jsx)(`li`,{children:`id: lowercase words with hyphens, unique. Example: reading-slope-before-you-cut`}),(0,u.jsx)(`li`,{children:`level: beginner, intermediate, or advanced. estimatedMinutes: 1 to 240`}),(0,u.jsx)(`li`,{children:`content: markdown for the on-the-ground how. Headings, lists, bold. No raw HTML.`}),(0,u.jsx)(`li`,{children:`keyPoints: at least one short line that fits in a pocket.`}),(0,u.jsx)(`li`,{children:`illustrations: type, description, alt, caption, and an optional src. Known types the app can draw: trail-cross-section, waterbar-plan, fence-brace, stream-channel, solar-flow, span-load, root-zone. Use type photo plus a src for a picture.`}),(0,u.jsx)(`li`,{children:`videos: title, watchFor, optional duration and url. Prefer a 1–3 minute clip. Say what to look for. A missing url shows a placeholder instead of breaking the lesson.`}),(0,u.jsx)(`li`,{children:`interactiveElements: id and kind. Kinds the app runs: trail-section, waterbar-plan, fence-system, stream-channel, solar-flow, span-load, root-zone, outslope-visual, fence-helper, waterbar-spacing, solar-decision, offer-check, trail-log, sequence, before-after. sequence and before-after take steps with a title and a body. An unknown kind still imports and shows your note.`}),(0,u.jsx)(`li`,{children:`howWeKnow: discovered, verified, wrong, and decision. All four, or omit the whole object.`}),(0,u.jsx)(`li`,{children:`fieldChecks: id and label. The steward can tick these. They save on the phone.`}),(0,u.jsx)(`li`,{children:`tryThis: title, minutes (1–60), and steps. A short observation they can do on the next work day.`}),(0,u.jsx)(`li`,{children:`quiz: choice is the default. Also truefalse, order (list the options in the correct order), and spot. Add explanation. spot may set figure to trail-berm, waterbar-square, fence-lean, stream-cut, solar-short, or root-packed.`}),(0,u.jsx)(`li`,{children:`resources: title, plus a url or a note. addedBy and dateAdded can be omitted.`})]})]}),(0,u.jsx)(`pre`,{className:`mt-4 overflow-x-auto rounded-xl bg-elevated p-4 font-mono text-sm leading-relaxed text-ink`,children:f})]})]})}export{p as component};