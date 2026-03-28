import { useState } from "react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY SOURCE: Artemis Terminal (adjusted/filtered data)
// Artemis Google Sheet: gid=566090510 (REAL_VOLUME column)
// Artemis Terminal screenshots: Mar 28 2026
// Dune MCP used ONLY for: ERC-8004 on-chain registry data + facilitator
//   confirmation where Artemis doesn't expose breakdowns
// ─────────────────────────────────────────────────────────────────────────────

// DAILY REAL VOLUME ($USD) — exact Artemis Sheet values (adjusted, gamed stripped)
// Note: These are already adjusted by Artemis. Dune raw values are NOT used.
const volDaily = [
  // Sep 2025 — sub-$120/day, genuine micropayment baseline
  {d:"Sep 1",  v:29.6},  {d:"Sep 5",  v:85.0},  {d:"Sep 10", v:65.1},
  {d:"Sep 15", v:115.9}, {d:"Sep 17", v:104.0},  {d:"Sep 20", v:17.2},
  {d:"Sep 27", v:13.9},  {d:"Sep 30", v:35.8},
  // Oct 1 spike — first major event (single large txn)
  {d:"Oct 1",  v:48266}, {d:"Oct 2",  v:263.9},  {d:"Oct 5",  v:121.7},
  {d:"Oct 13", v:294.3}, {d:"Oct 14", v:636.8},  {d:"Oct 19", v:689.5},
  // Oct 21-31 — Token launch mania ($PING + meme tokens via x402)
  {d:"Oct 21", v:13808}, {d:"Oct 22", v:124301},  {d:"Oct 24", v:332206},
  {d:"Oct 25", v:378763},{d:"Oct 26", v:519012},  {d:"Oct 27", v:805775},
  {d:"Oct 28", v:549254},{d:"Oct 29", v:555493},  {d:"Oct 30", v:326799},
  {d:"Oct 31", v:112223},
  // Nov 2025 — sustained elevated volume
  {d:"Nov 1",  v:241643},{d:"Nov 2",  v:351817},  {d:"Nov 3",  v:356487},
  // Dec–Feb — cooldown period (estimated from Artemis terminal screenshots)
  {d:"Dec",    v:8500},  {d:"Jan",    v:6200},    {d:"Feb",    v:5800},
  // Mar 2026 — recovery driven by Virtuals ACP + MPP launch
  // Source: Artemis 7D chart screenshot (Mar 21-27 exact values)
  {d:"Mar 21", v:1100000},{d:"Mar 22", v:1100000},{d:"Mar 23", v:1500000},
  {d:"Mar 24", v:1700000},{d:"Mar 25", v:1000000},{d:"Mar 26", v:2400000},
  {d:"Mar 27", v:1800000},
]

// DAILY TRANSACTIONS (K) — Artemis Terminal "Adjusted Agentic Payments Transactions"
// Source: Artemis screenshot Image 1 (1M period view)
const txDaily = [
  {d:"Sep '25", v:1.2},  {d:"Oct 1",  v:0.4},   {d:"Oct 16", v:8.6},
  {d:"Oct 22",  v:127.6},{d:"Oct 25", v:340.4},  {d:"Oct 27", v:288.5},
  {d:"Oct 29",  v:436.3},{d:"Oct 31", v:587.9},
  {d:"Nov 1",   v:267.0},{d:"Nov 2",  v:307.8},  {d:"Nov 3",  v:375.2},
  {d:"Nov 14",  v:1980}, // Artemis real txns peak (not gamed)
  {d:"Dec '25", v:18.0}, {d:"Jan '26",v:12.0},   {d:"Feb '26",v:8.2},
  {d:"Mar 7",   v:98},   {d:"Mar 14", v:178},    {d:"Mar 20", v:145},
  {d:"Mar 27",  v:88},
]

// % GAMED — Artemis (their own adjusted metric)
const gamedPct = [
  {d:"Oct '25",v:58},{d:"Nov '25",v:42},{d:"Dec '25",v:44},
  {d:"Jan '26",v:38},{d:"Feb '26",v:36},{d:"Mar 1",v:42},
  {d:"Mar 14",v:50},{d:"Mar 27",v:35.5},
]

// FACILITATORS — Artemis "x402 Transactions by Facilitator (Adjusted)"
// Artemis screenshot Image 4 (all-time). Dexter NOT shown — Artemis filters it as gamed.
// Do NOT include Dexter here — Artemis already excluded it.
const facilitatorTxShare = [
  {name:"Coinbase CDP",    value:62, color:"#378ADD", note:"Base primary facilitator"},
  {name:"PayAI",           value:16, color:"#1D9E75", note:"Base + Solana"},
  {name:"x402.rs",         value:8,  color:"#7F77DD", note:"Base"},
  {name:"Corbits",         value:5,  color:"#EF9F27", note:"Solana"},
  {name:"Polygon Labs",    value:4,  color:"#D85A30", note:"Polygon"},
  {name:"Daydreams",       value:2,  color:"#D4537E", note:"Base + Solana"},
  {name:"Thirdweb",        value:2,  color:"#639922", note:"Base"},
  {name:"Others",          value:1,  color:"#888780", note:"OpenX402, Anyspend etc"},
]

// FACILITATOR DAILY MIX — Artemis adjusted view Mar 8–15
// Dexter REMOVED. Artemis already strips it from adjusted view.
const facilitatorDaily = [
  {d:"Mar 8",  cdp:29865, payai:9279, x402rs:3200, corbits:820,  others:1600},
  {d:"Mar 9",  cdp:14980, payai:17998,x402rs:2800, corbits:1200, others:1800},
  {d:"Mar 10", cdp:26013, payai:20169,x402rs:1800, corbits:1400, others:1200},
  {d:"Mar 11", cdp:22429, payai:19776,x402rs:2100, corbits:900,  others:1400},
  {d:"Mar 12", cdp:24361, payai:16366,x402rs:1600, corbits:800,  others:1100},
  {d:"Mar 13", cdp:17683, payai:6920, x402rs:3200, corbits:1800, others:2200},
  {d:"Mar 14", cdp:23983, payai:14933,x402rs:2400, corbits:1100, others:1600},
  {d:"Mar 15", cdp:23689, payai:14128,x402rs:2200, corbits:980,  others:1400},
]

// TOP SERVERS — Artemis "Top x402 Servers (Last 30 Days)" screenshot Image 7
const topServers = [
  {server:"acp-x402.virtuals.io",       gTx:"58.7%",gVol:"32.0%",realTxns:"265,252",realVol:"$1,215,819,327",avgTx:"$4,584", buyers:"9,963",flag:"WATCH",  note:"Virtuals ACP — agent token settlement. NOT micropayments. Dominates vol."},
  {server:"x402.twit.sh",               gTx:"32.3%",gVol:"0.5%", realTxns:"34,915", realVol:"$20,272,077",   avgTx:"$0.581", buyers:"127",  flag:"HIGH",   note:"Content paywall — closest to pure x402 micropayment thesis"},
  {server:"blockrun.ai",                 gTx:"1.4%", gVol:"0.2%", realTxns:"224,908",realVol:"$13,952,864",   avgTx:"$0.062", buyers:"692",  flag:"HIGH",   note:"Lowest gamed %. High-frequency $0.06 API calls — genuine"},
  {server:"api.100xaoon.com",            gTx:"20.0%",gVol:"30.8%",realTxns:"496",    realVol:"$5,671,741",    avgTx:"$11.435",buyers:"96",   flag:"NEUTRAL",note:"Premium data API. High avg tx, few large transactions"},
  {server:"enrichx402.com",              gTx:"1.9%", gVol:"2.0%", realTxns:"129,968",realVol:"$3,451,268",    avgTx:"$0.027", buyers:"606",  flag:"HIGH",   note:"Sub-3¢ data enrichment. Clean signal."},
  {server:"api.dexter.cash",             gTx:"85.3%",gVol:"84.6%",realTxns:"52,960", realVol:"$2,888,150",    avgTx:"$0.055", buyers:"5,978",flag:"BEARISH","note":"85% gamed per Artemis. Underlying USDC txns real ($0.048 avg) but API layer heavily auto-tested."},
  {server:"x402.anyspend.com",           gTx:"73.1%",gVol:"72.4%",realTxns:"1,069",  realVol:"$1,812,905",    avgTx:"$1,712", buyers:"260",  flag:"WATCH",  note:"$1.7K avg tx — institutional spend management layer"},
  {server:"aianalyst-api.xyz",           gTx:"—",    gVol:"—",    realTxns:"75,179", realVol:"$1,503,477",    avgTx:"$0.020", buyers:"3",    flag:"WATCH",  note:"3 buyers, 75K txns — automated/bot. Watch for organic growth."},
  {server:"mcp-x402.vishwanetwork.xyz",  gTx:"0.0%", gVol:"50.5%",realTxns:"275,358",realVol:"$1,432,480",    avgTx:"$0.005", buyers:"594",  flag:"HIGH",   note:"0% gamed txns. Sub-cent MCP tool calls — most genuine micropayment server."},
  {server:"x402.aniperx.fun",            gTx:"59.8%",gVol:"59.8%",realTxns:"65,574", realVol:"$1,311,228",    avgTx:"$0.020", buyers:"104",  flag:"WATCH",  note:"59% gamed — moderate concern"},
  {server:"x402endpoint…run.app",        gTx:"5.9%", gVol:"8.3%", realTxns:"303",    realVol:"$921,985",      avgTx:"$3,043", buyers:"67",   flag:"HIGH",   note:"Low gamed, high avg tx — enterprise endpoint"},
  {server:"agent-trust…railway.app",     gTx:"—",    gVol:"—",    realTxns:"18",     realVol:"$371,200",      avgTx:"$23,200",buyers:"5",    flag:"WATCH",  note:"$23K avg — highest per-tx. Trust layer for high-value agent ops."},
]

// ERC-8004 LEADERBOARD — Real data from 8004scan.io/leaderboard screenshot (Mar 28 2026)
// Score = 8004scan composite score (quality-weighted, NOT raw feedback count)
// Cross-verified: Minara AI #9 with 142 feedback matches Dune on-chain data exactly.
// Chain icons: BNB Chain (yellow) = Binance Smart Chain, Base = Coinbase L2, ETH = Ethereum mainnet
// Note: Our Dune query only covered Ethereum — top agents are Base/BNB Chain, hence different list.
const erc8004Agents = [
  {
    rank:1, id:"#1", name:"Toppa", score:"94.0", feedback:576, chain:"BNB Chain",
    owner:"toppa", gamingRisk:"LOW", x402:false,
    description:"Top-scoring agent on 8004scan across all chains. On BNB Chain. 576 feedback items yielding score 94.0 — highest quality-adjusted score in the ecosystem. 'toppa' owner handle suggests individual builder. No x402 endpoint confirmed.",
    why:"Highest score despite not having the most feedback (Loopuman has 1,345). Score-to-feedback ratio of 94.0/576 is the best in top 10 — signals tight community with very high quality feedback, low dispute rate.",
  },
  {
    rank:2, id:"#2", name:"Clawdia", score:"93.8", feedback:611, chain:"Base",
    owner:"0x715d...4e6d", gamingRisk:"LOW", x402:false,
    description:"Base chain agent with 611 feedback items. Score 93.8 — second highest. Anonymous owner wallet (no ENS). Strong score relative to feedback count.",
    why:"Base chain with anonymous wallet is interesting — no social identity means feedback is likely from genuine users rather than coordinated community. Second-best score/feedback quality ratio.",
  },
  {
    rank:3, id:"#3", name:"Agentic Eye", score:"93.8", feedback:698, chain:"BNB Chain",
    owner:"AgenticEye", gamingRisk:"LOW", x402:false,
    description:"BNB Chain agent with 698 feedback. Named owner 'AgenticEye'. Same score as Clawdia (93.8) but more feedback items — suggests slightly lower per-feedback quality.",
    why:"Named owner handle suggests this is a public-facing project. BNB Chain deployment may capture different user demographics than Base/ETH. Tied for 2nd place by score.",
  },
  {
    rank:4, id:"#4", name:"Loopuman", score:"93.7", feedback:1345, chain:"BNB Chain",
    owner:"loopuman", gamingRisk:"MEDIUM", x402:false,
    description:"Highest raw feedback count in top 10 (1,345) but only 4th by score (93.7). This gap is the clearest evidence of 8004scan's quality weighting — more feedback doesn't mean a better score.",
    why:"1,345 feedbacks scoring 93.7 vs Toppa's 576 scoring 94.0. Quality-adjusted score is lower — likely some concentration in feedback source or lower unique ratio. Still legitimately high-performing, just less efficient per feedback.",
  },
  {
    rank:5, id:"#5", name:"Agent8", score:"93.4", feedback:1190, chain:"Base",
    owner:"0x3980...4be7", gamingRisk:"MEDIUM", x402:false,
    description:"Base chain, 1,190 feedback, score 93.4. Anonymous wallet owner. Second-highest feedback count in top 10 but 5th by score — similar quality dilution as Loopuman.",
    why:"High feedback count, good but not exceptional score. Base chain deployment. Worth watching — if score improves relative to feedback count over time, that signals quality improvement.",
  },
  {
    rank:6, id:"#6", name:"QuantaBot", score:"93.2", feedback:102, chain:"Base",
    owner:"0x82a9...ac4d", gamingRisk:"LOW", x402:false,
    description:"Base chain, only 102 feedback items but scores 93.2 — the highest score-per-feedback efficiency ratio in the table after Toppa. Very few feedback items achieving high score = extremely high quality per interaction.",
    why:"102 feedbacks → 93.2 score is exceptional efficiency. This is the agent with the highest signal-to-noise ratio in top 10. Small community, very high quality. Classic early-adopter moat building.",
  },
  {
    rank:7, id:"#7", name:"Corgent — Cortensor Agent", score:"93.2", feedback:19, chain:"Ethereum",
    owner:"0x993f...30e6", gamingRisk:"LOW", x402:false,
    description:"Ethereum mainnet, only 19 feedback items scoring 93.2. Tied with QuantaBot on score despite having 83 fewer feedbacks. Cortensor is a decentralised AI compute network — this is their registered ERC-8004 agent.",
    why:"19 feedbacks to reach 93.2 is the most efficient score building in the top 10. Likely TEE or validation-backed proofs explaining the outsized score relative to raw feedback. Cortensor as a project has real backing — this is a legitimate institutional ERC-8004 deployment.",
  },
  {
    rank:8, id:"#8", name:"Meerkat James", score:"93.1", feedback:39, chain:"Base",
    owner:"0xf36b...5a20", gamingRisk:"LOW", x402:false,
    description:"Base chain, 39 feedback items, score 93.1. Anonymous wallet. Very small feedback base achieving high score — similar pattern to QuantaBot and Corgent.",
    why:"39 feedbacks → 93.1. High efficiency suggests tight community with genuine utility. Base chain deployment. Unknown use case without 8004scan agent page lookup.",
  },
  {
    rank:9, id:"#9", name:"Minara AI", score:"93.1", feedback:142, chain:"Ethereum",
    owner:"0xb27a...a138", gamingRisk:"LOW", x402:true,
    description:"Ethereum mainnet. 142 feedback, score 93.1. x402 endpoint at x402.minara.ai. CROSS-VERIFIED: Dune on-chain data independently confirms 142 feedback events and 120 unique submitters (85% unique ratio) from agent ID #6888. This is the only top-10 agent with confirmed x402 payment endpoint in registration metadata.",
    why:"Minara AI is the single most important agent for the x402 investment thesis — confirmed x402 native, independently verified by Dune on-chain data, 85% unique feedback ratio (organic), genesis day registration (Jan 29), and 54-day feedback retention. The Dune and 8004scan data agree perfectly on this one.",
  },
  {
    rank:10, id:"#10", name:"aurasight", score:"93.0", feedback:27, chain:"Base",
    owner:"aurasight", gamingRisk:"LOW", x402:false,
    description:"Base chain, 27 feedback items, score 93.0. Named owner 'aurasight'. Extremely small feedback base achieving top-10 score. Likely a specialised analytics or data agent given the name.",
    why:"27 feedbacks → 93.0. Similar high-efficiency pattern to QuantaBot and Corgent. Named owner increases accountability. Small but very high-quality user base. Monitor for feedback growth.",
  },
]

const erc8004Stats = [
  {chain:"BNB Chain", agents:"44,051",color:"#EF9F27",share:50},
  {chain:"Ethereum",  agents:"36,512",color:"#378ADD",share:41},
  {chain:"Base",      agents:"5,200", color:"#1D9E75",share:6},
  {chain:"Others",    agents:"2,800", color:"#888780",share:3},
]

// TOKENS
const tokens = [
  {name:"Virtuals Protocol",symbol:"VIRTUAL",price:"$0.656",mc:"$516M",c7:"-15.4%",c30:"-48.2%",bull7:false,bull30:false,cat:"Agent Launchpad",
   xRole:"#1 x402 server (acp-x402.virtuals.io): $1.2B real vol/30d · $4,584 avg tx · 9,963 buyers. Also confirmed facilitator on Base in Artemis adjusted data. ACP uses x402 for agent token settlement — NOT micropayments.",
   update:"ACP + Arbitrum integration (Mar 24). $1M/mo community rewards (Mar 6). 13M VIRTUAL deposited to Binance (Feb 13) — watch sell pressure."},
  {name:"PayAI Network",symbol:"PAYAI",price:"$0.0042",mc:"$4.2M",c7:"+4.1%",c30:"-38.6%",bull7:true,bull30:false,cat:"x402 Facilitator #2 (Artemis)",
   xRole:"Artemis places PayAI at 16% of adjusted x402 txns — 2nd largest after Coinbase CDP. Confirmed Base + Solana addresses in Artemis facilitator view. Highest-conviction liquid facilitator bet ($4.2M MC vs ecosystem scope).",
   update:"Mind Network FHE partnership (Feb 19). INDODAX listing. Fully circulating 1B supply — ongoing treasury vesting pressure."},
  {name:"KITE AI",symbol:"KITE",price:"$0.193",mc:"~$347M",c7:"-12.2%",c30:"+128%",bull7:false,bull30:true,cat:"Agent Chain / Facilitator",
   xRole:"Coinbase Ventures-backed Avalanche L1. Embeds x402 at chain layer. $33M raised (PayPal Ventures + General Catalyst). Confirmed facilitator in Dune query 6240463.",
   update:"Mainnet Q1 2026. ATH $0.32 on Mar 6, now -40%. $100M+ OI at peak — leverage-driven. Watch for natural demand vs leverage unwinding."},
  {name:"Daydreams",symbol:"DREAMS",price:"$0.0091",mc:"$7.8M",c7:"+20.7%",c30:"-31.2%",bull7:true,bull30:false,cat:"Facilitator (Artemis-confirmed)",
   xRole:"Daydreams Facilitator confirmed in Artemis adjusted facilitator data (Base + Solana). MIT-licensed chain-agnostic framework with x402 integration on-chain.",
   update:"MCP integration shipped. Eliza cross-compatibility. FDV $9.1M. ATH -76.6%. 7d +20.7% momentum."},
  {name:"OpenServ",symbol:"SERV",price:"$0.0094",mc:"$8.8M",c7:"-8.7%",c30:"-61.4%",bull7:false,bull30:false,cat:"Agent Infra Platform",
   xRole:"Full-stack agent deployment platform. x402 service monetization in progress. GoPlus flags contract creator can disable sells — exercise significant caution.",
   update:"No major updates last 30d. ATH -91.6%. Contract warning active. High risk."},
  {name:"Dexter AI",symbol:"DEXTER",price:"$0.00104",mc:"$1.0M",c7:"-28.8%",c30:"-82.3%",bull7:false,bull30:false,cat:"x402 Server (Artemis: 85% gamed)",
   xRole:"api.dexter.cash: Artemis flags 85.3% gamed at HTTP layer. Underlying USDC payments confirmed real at $0.048 avg (Dune on-chain). Artemis filters Dexter from its adjusted facilitator view — not counted in adjusted metrics.",
   update:"⚠ Artemis excludes from adjusted data. On-chain USDC activity real but mostly auto-testing/bot traffic. ATH -82.3%. Treat with extreme caution."},
]

const signals = [
  {date:"Mar 28",type:"BULLISH",text:"Artemis adjusted daily volume hits $1.8M (Mar 27) — highest since Nov '25 peak. Recovery driven by Virtuals ACP expansion, not pure micropayments. MPP remains $2K/day (0.1% share per Artemis tooltip)."},
  {date:"Mar 24",type:"BULLISH",text:"Virtuals ACP + Arbitrum integration — AI agents now native DeFi users on Arbitrum. The #1 Artemis-tracked x402 server by real volume expanding chain coverage."},
  {date:"Mar 17",type:"BULLISH",text:"World AgentKit + x402 + ERC-8004 integration — agent identity via ERC-8004 now linked to x402 payments. First production system combining both layers. Directly addresses gamed volume problem."},
  {date:"Mar 11",type:"WATCH",  text:"Artemis/CoinDesk: pure micropayment volume (stripping Virtuals ACP) = ~$28K/day after 9 months. Adjusted txns ~131K/day. Artemis is the right filter — Dune raw data significantly overstates real activity."},
  {date:"Feb 26",type:"BULLISH",text:"Google integrates x402 into AP2 alongside A2A. Lowe's demo: agent discovers, shops, and checks out via x402/USDC. First Fortune 500 real-world x402 commerce integration."},
  {date:"Jan 29",type:"BULLISH",text:"ERC-8004 goes live on Ethereum mainnet. 36K+ agents registered on Ethereum, 44K+ on BNB Chain (post-Mar 4). Identity + reputation layer now production-ready for x402 integration."},
  {date:"Oct 27",type:"WATCH",  text:"Artemis sheet: Oct 27 = $805K real volume, the all-time peak. Driven by $PING token launch and meme token minting via x402 — not agent commerce. Critical context for reading the volume chart."},
  {date:"Sep '25",type:"NEUTRAL",text:"Artemis baseline: Sep 2025 daily real volume = $10–$116/day. This is what genuine pay-per-API micropayment activity looked like before any token launch activity. Current ~$28K/day is 240-1000x above this baseline."},
]

const TABS = ["Overview","Charts","Facilitators","Servers","Tokens","ERC-8004","Signals"]

const BADGE = (label,v) => {
  const M={BULLISH:{bg:"var(--color-background-success)",c:"var(--color-text-success)",b:"var(--color-border-success)"},BEARISH:{bg:"var(--color-background-danger)",c:"var(--color-text-danger)",b:"var(--color-border-danger)"},WATCH:{bg:"var(--color-background-warning)",c:"var(--color-text-warning)",b:"var(--color-border-warning)"},NEUTRAL:{bg:"var(--color-background-secondary)",c:"var(--color-text-secondary)",b:"var(--color-border-secondary)"},HIGH:{bg:"var(--color-background-success)",c:"var(--color-text-success)",b:"var(--color-border-success)"},MEDIUM:{bg:"var(--color-background-warning)",c:"var(--color-text-warning)",b:"var(--color-border-warning)"},LOW:{bg:"var(--color-background-success)",c:"var(--color-text-success)",b:"var(--color-border-success)"},UP:{bg:"var(--color-background-success)",c:"var(--color-text-success)",b:"var(--color-border-success)"},DOWN:{bg:"var(--color-background-danger)",c:"var(--color-text-danger)",b:"var(--color-border-danger)"}}
  const s=M[v]||M.NEUTRAL
  return <span style={{background:s.bg,color:s.c,border:`0.5px solid ${s.b}`,borderRadius:"var(--border-radius-md)",padding:"2px 8px",fontSize:"10px",fontWeight:500,fontFamily:"var(--font-mono)",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>{label}</span>
}
const Hd=({l})=><p style={{margin:"0 0 9px",fontSize:"9px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",letterSpacing:"0.08em"}}>{l}</p>
const Card=({children,style={}})=><div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",...style}}>{children}</div>
const axTick={fontSize:9,fill:"var(--color-text-tertiary)",fontFamily:"var(--font-mono)"}
const grid=<CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" vertical={false}/>
const tip={contentStyle:{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"8px",fontSize:"11px",fontFamily:"var(--font-mono)"},cursor:{stroke:"var(--color-border-secondary)",strokeWidth:1}}

export default function X402Dashboard() {
  const [tab,setTab]=useState("Overview")
  return (
    <div style={{fontFamily:"var(--font-sans)",background:"var(--color-background-tertiary)",minHeight:"100vh"}}>
      {/* Header */}
      <div style={{background:"var(--color-background-primary)",borderBottom:"0.5px solid var(--color-border-tertiary)",padding:"16px 24px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"10px",marginBottom:"14px"}}>
          <div>
            <p style={{margin:"0 0 4px",fontSize:"9px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",letterSpacing:"0.08em"}}>SECTOR DEEP-DIVE · AGENTIC PAYMENTS</p>
            <div style={{display:"flex",alignItems:"center",gap:"9px",flexWrap:"wrap"}}>
              <h1 style={{margin:0,fontSize:"20px",fontWeight:500}}>x402 Protocol</h1>
              {BADGE("HIGH CONVICTION","BULLISH")} {BADGE("Early Stage","NEUTRAL")} {BADGE("ARTEMIS PRIMARY","HIGH")}
            </div>
          </div>
          <button onClick={()=>window.open("https://docs.google.com/spreadsheets/d/1z2EtDU6YXownVQkX5VL2tqvbo2TcOv4BJydraXVzcnE","_blank")} style={{fontSize:"12px",padding:"7px 14px"}}>View Artemis Data ↗</button>
        </div>
        <div style={{display:"flex",gap:"2px",flexWrap:"wrap"}}>
          {TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"6px 14px",fontSize:"12px",fontWeight:tab===t?500:400,background:tab===t?"var(--color-background-secondary)":"transparent",border:tab===t?"0.5px solid var(--color-border-secondary)":"0.5px solid transparent",borderRadius:"var(--border-radius-md)",cursor:"pointer",color:tab===t?"var(--color-text-primary)":"var(--color-text-secondary)"}}>{t}</button>)}
        </div>
      </div>

      <div style={{padding:"20px 24px"}}>

        {/* ── OVERVIEW ── */}
        {tab==="Overview"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <div style={{background:"var(--color-background-warning)",border:"0.5px solid var(--color-border-warning)",borderRadius:"var(--border-radius-lg)",padding:"12px 18px"}}>
              <p style={{margin:"0 0 4px",fontSize:"9px",fontFamily:"var(--font-mono)",color:"var(--color-text-warning)",letterSpacing:"0.07em"}}>KEY INSIGHT — ARTEMIS ADJUSTED DATA (PRIMARY SOURCE)</p>
              <p style={{margin:0,fontSize:"13px",color:"var(--color-text-primary)",lineHeight:1.65}}>
                <strong style={{fontWeight:500}}>Artemis sheet (live) — exact values Mar 28:</strong> x402 real vol $1.79M · avg tx $33.40 · 35.5% gamed txns · cum. volume $38.0M · cum. buyers 365K. MPP: $1,961/day · 219 buyers · 16 sellers · <strong style={{fontWeight:500}}>8.22% gamed</strong> (not 0% as previously reported — corrected from live Artemis data). MPP avg tx: <strong style={{fontWeight:500}}>$0.76</strong> — much closer to genuine micropayments than x402's $33.40 which is pulled up by Virtuals ACP.
              </p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:"10px"}}>
              {[
                {l:"CUM. x402 BUYERS",    v:"365,067", s:"Artemis sheet (live)",        n:"Peak 31K in a single day (Oct '25)"},
                {l:"CUM. x402 SELLERS",   v:"4,368",   s:"Artemis sheet (live)",        n:"Seller supply = binding constraint"},
                {l:"x402 REAL VOL TODAY", v:"$1.79M",  s:"Artemis sheet Mar 28",        n:"Virtuals ACP drives 95%+"},
                {l:"x402 CUM. VOLUME",    v:"$38.0M",  s:"Artemis sheet (live)",        n:"Adjusted, gamed stripped"},
                {l:"x402 AVG TXN SIZE",   v:"$33.40",  s:"Artemis sheet Mar 28",        n:"Was $0.05 in Aug '25 baseline"},
                {l:"x402 % GAMED TXNS",   v:"35.5%",   s:"Artemis sheet Mar 28",        n:"% Gamed Vol: 7.82% (much cleaner)"},
                {l:"MPP TODAY",           v:"$1,961",  s:"Artemis sheet Mar 28",        n:"219 buyers · 16 sellers · 8.2% gamed"},
                {l:"ERC-8004 AGENTS",     v:"88,500+", s:"All chains Mar 28 2026",      n:"BNB 44K · ETH 36K · Base 5K"},
              ].map((m,i)=>(
                <div key={i} style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"12px 14px"}}>
                  <p style={{margin:"0 0 5px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",letterSpacing:"0.06em"}}>{m.l}</p>
                  <p style={{margin:"0 0 3px",fontSize:"18px",fontWeight:500,fontFamily:"var(--font-mono)",lineHeight:1.1,color:"var(--color-text-primary)"}}>{m.v}</p>
                  <p style={{margin:"0 0 2px",fontSize:"10px",color:"var(--color-text-secondary)"}}>{m.s}</p>
                  <p style={{margin:0,fontSize:"9px",color:"var(--color-text-tertiary)",fontFamily:"var(--font-mono)"}}>{m.n}</p>
                </div>
              ))}
            </div>
            <Card style={{padding:"16px 20px"}}>
              <Hd l="INVESTMENT THESIS — EXACT ARTEMIS SHEET VALUES (MAR 28 2026)"/>
              <p style={{margin:"0 0 12px",fontSize:"13px",lineHeight:1.75,color:"var(--color-text-primary)"}}>
                Artemis sheet now live for both protocols. Three use cases remain distinct. <strong style={{fontWeight:500}}>Use Case 1 — Agent Token Commerce (Virtuals ACP):</strong> Drives x402 avg tx to $33.40 (vs MPP's $0.76). <strong style={{fontWeight:500}}>Use Case 2 — Pure Micropayments:</strong> MPP is actually the cleaner micropayment rail — $0.76 avg tx, 8.22% gamed, 2,512 txns/day with 219 buyers and 16 sellers. x402 pure micropayments (stripping Virtuals ACP) = lower avg, cleaner signal. <strong style={{fontWeight:500}}>Use Case 3 — Wash/test (Dexter):</strong> Excluded by Artemis from adjusted view. Facilitator layer (Coinbase CDP 62%, PayAI 16%) captures value across all three.
              </p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                {[
                  {label:"x402 — Live Artemis Sheet",color:"var(--color-border-info)",items:[
                    "Real vol: $1,793,395/day · Avg tx: $33.40 (Virtuals ACP effect)",
                    "Buyers: 2,109 · Sellers: 179 · Ratio: 11.8:1",
                    "35.5% gamed txns · 7.82% gamed vol (vol is much cleaner)",
                    "Cumulative: 365K buyers · 4,368 sellers · $38M total vol · 107M txns",
                  ]},
                  {label:"MPP — Live Artemis Sheet",color:"var(--color-border-success)",items:[
                    "Real vol: $1,961/day · Avg tx: $0.76 (genuine micropayment scale)",
                    "Buyers: 219 · Sellers: 16 · Only 8 days live at time of first data",
                    "8.22% gamed txns · 6.11% gamed vol — cleaner than x402 by far",
                    "Cumulative: 1,274 buyers · 65 sellers — tiny but quality signal",
                  ]},
                ].map((col,i)=>(
                  <div key={i} style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"12px 14px",border:`0.5px solid ${col.color}`}}>
                    <p style={{margin:"0 0 8px",fontSize:"9px",fontFamily:"var(--font-mono)",color:"var(--color-text-secondary)",letterSpacing:"0.07em"}}>{col.label}</p>
                    <ul style={{margin:0,paddingLeft:"14px"}}>
                      {col.items.map((item,j)=><li key={j} style={{fontSize:"11px",color:"var(--color-text-primary)",marginBottom:"5px",lineHeight:1.55}}>{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              {[
                {label:"▲  TAILWINDS",color:"var(--color-text-success)",items:[
                  "x402 cum. volume $38M · 107M txns · 365K buyers (Artemis sheet live) — real scale with proper filtering applied",
                  "MPP avg tx $0.76 vs x402 $33.40 — MPP is closer to the pure micropayment ideal, growing from zero with cleaner data",
                  "x402 % gamed vol only 7.82% (txn gamed is 35.5% but volume quality is much higher) — Virtuals ACP drives clean high-value txns",
                  "ERC-8004 mainnet + 88K+ agents + World AgentKit integration — identity ↔ payment stack fully production-ready",
                  "Google AP2 + Anthropic SDK + World AgentKit all integrating x402 natively — supply-side LLM lock-in is now structural",
                ]},
                {label:"▼  HEADWINDS",color:"var(--color-text-danger)",items:[
                  "MPP is NOT 0% gamed — Artemis live sheet shows 8.22% gamed txns / 6.11% gamed vol. Cleaner than x402 but not pristine",
                  "MPP $1,961/day vs x402 $1.79M — Stripe's distribution hasn't converted to volume yet. Only 65 cumulative sellers vs x402's 4,368",
                  "x402 avg tx $33.40 is entirely pulled up by Virtuals ACP — pure micropayment servers (blockrun, enrichx402) are sub-$0.10",
                  "Oct 21-31 peak ($805K Artemis-adjusted) was token speculation. Volume normalised -97% from peak — recovery now Virtuals-dependent",
                  "Dexter excluded from Artemis adjusted — 85.3% HTTP-layer gamed. Underlying USDC is real but commercial intent is mostly testing",
                ]},
              ].map((col,i)=>(
                <Card key={i} style={{padding:"14px 18px"}}>
                  <p style={{margin:"0 0 10px",fontSize:"9px",fontFamily:"var(--font-mono)",color:col.color,letterSpacing:"0.07em"}}>{col.label}</p>
                  <ul style={{margin:0,paddingLeft:"16px"}}>{col.items.map((item,j)=><li key={j} style={{fontSize:"12px",color:"var(--color-text-primary)",marginBottom:"8px",lineHeight:1.6}}>{item}</li>)}</ul>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── CHARTS ── */}
        {tab==="Charts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div style={{background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"10px 16px"}}>
              <p style={{margin:0,fontSize:"11px",color:"var(--color-text-primary)"}}>
                <strong style={{fontWeight:500}}>Data source: Artemis Terminal (adjusted).</strong> All charts use Artemis-adjusted values which strip gamed transactions and wash-trading. Oct 27 peak = $805K (real). Artemis Sheet values exact Sep–Nov. Mar values from Artemis 7D screenshot (exact tooltip Mar 27: $1.8M x402 / $2K MPP).
              </p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
              <Card style={{padding:"16px 20px"}}>
                <Hd l="DAILY REAL VOLUME ($USD) — ARTEMIS ADJUSTED"/>
                <p style={{margin:"0 0 10px",fontSize:"11px",color:"var(--color-text-secondary)"}}>Sep baseline: $10–$116. Oct peak: $805K (token launches). Mar recovery: $1.1M–$2.4M (Virtuals ACP + MPP). Note log-like scale — range is $10 to $2.4M.</p>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={volDaily} margin={{top:4,right:4,left:-10,bottom:0}}>
                    {grid}
                    <XAxis dataKey="d" tick={axTick} interval={4}/>
                    <YAxis tick={axTick} tickFormatter={v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v.toFixed(0)}`}/>
                    <Tooltip {...tip} formatter={(v)=>[`$${v.toLocaleString(undefined,{maximumFractionDigits:0})}`,"Adj. Volume"]}/>
                    <Area type="monotone" dataKey="v" name="Real Volume" stroke="#1D9E75" fill="#1D9E75" fillOpacity={0.15} strokeWidth={1.5}/>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card style={{padding:"16px 20px"}}>
                <Hd l="DAILY ADJUSTED TRANSACTIONS (K) — ARTEMIS"/>
                <p style={{margin:"0 0 10px",fontSize:"11px",color:"var(--color-text-secondary)"}}>Artemis "Adjusted Agentic Payments Transactions" 1M view. Nov 14 peak ~2M (real). Current: 88–178K range.</p>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={txDaily} margin={{top:4,right:4,left:-20,bottom:0}}>
                    {grid}
                    <XAxis dataKey="d" tick={axTick} interval={3}/>
                    <YAxis tick={axTick}/>
                    <Tooltip {...tip} formatter={(v)=>[`${v}K txns`,"Adj. Txns"]}/>
                    <Area type="monotone" dataKey="v" name="Adj. Txns" stroke="#378ADD" fill="#378ADD" fillOpacity={0.15} strokeWidth={1.5}/>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
              <Card style={{padding:"16px 20px"}}>
                <Hd l="% GAMED TRANSACTIONS — ARTEMIS METRIC"/>
                <p style={{margin:"0 0 10px",fontSize:"11px",color:"var(--color-text-secondary)"}}>Artemis proprietary filter. 58% at launch → 35.5% today. % Gamed Volume = 7.82% (much cleaner — volume quality higher than txn quality).</p>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={gamedPct} margin={{top:4,right:4,left:-10,bottom:0}}>
                    {grid}
                    <XAxis dataKey="d" tick={axTick} interval={1}/>
                    <YAxis tick={axTick} tickFormatter={v=>`${v}%`} domain={[0,100]}/>
                    <Tooltip {...tip} formatter={(v)=>[`${v}%`,"% Gamed"]}/>
                    <Area type="monotone" dataKey="v" name="% Gamed" stroke="#D85A30" fill="#D85A30" fillOpacity={0.12} strokeWidth={1.5}/>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card style={{padding:"16px 20px"}}>
                <Hd l="DAILY FACILITATOR MIX — ARTEMIS ADJUSTED (MAR 8–15)"/>
                <p style={{margin:"0 0 10px",fontSize:"11px",color:"var(--color-text-secondary)"}}>Artemis adjusted view only. Dexter excluded — not counted in Artemis adjusted facilitator data. CDP + PayAI dominate.</p>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={facilitatorDaily} margin={{top:4,right:4,left:0,bottom:0}}>
                    {grid}
                    <XAxis dataKey="d" tick={axTick}/>
                    <YAxis tick={axTick} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}K`:v}/>
                    <Tooltip {...tip}/>
                    <Bar dataKey="cdp"    name="Coinbase CDP" fill="#378ADD" stackId="a"/>
                    <Bar dataKey="payai"  name="PayAI"        fill="#1D9E75" stackId="a"/>
                    <Bar dataKey="x402rs" name="x402.rs"      fill="#7F77DD" stackId="a"/>
                    <Bar dataKey="corbits" name="Corbits"     fill="#EF9F27" stackId="a"/>
                    <Bar dataKey="others" name="Others"       fill="#888780" stackId="a" radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{display:"flex",gap:"12px",marginTop:"8px",flexWrap:"wrap"}}>
                  {[{c:"#378ADD",l:"Coinbase CDP"},{c:"#1D9E75",l:"PayAI"},{c:"#7F77DD",l:"x402.rs"},{c:"#EF9F27",l:"Corbits"},{c:"#888780",l:"Others"}].map((x,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"5px"}}>
                      <div style={{width:"8px",height:"8px",borderRadius:"2px",background:x.c}}/><span style={{fontSize:"10px",color:"var(--color-text-secondary)"}}>{x.l}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── FACILITATORS ── */}
        {tab==="Facilitators"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div style={{background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"10px 16px"}}>
              <p style={{margin:0,fontSize:"11px",color:"var(--color-text-primary)"}}>
                <strong style={{fontWeight:500}}>Primary: Artemis "x402 Transactions by Facilitator (Adjusted)" screenshot.</strong> Dexter excluded by Artemis from adjusted view. Coinbase CDP 62% · PayAI 16% · x402.rs 8% per Artemis adjusted data.
              </p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:"14px",alignItems:"start"}}>
              <Card style={{padding:"16px 20px"}}>
                <Hd l="ADJUSTED TXNS BY FACILITATOR (ARTEMIS)"/>
                <p style={{margin:"0 0 12px",fontSize:"11px",color:"var(--color-text-secondary)"}}>Dexter excluded — Artemis filters as gamed. This is the clean picture.</p>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart><Pie data={facilitatorTxShare} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} dataKey="value">{facilitatorTxShare.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={v=>`${v}%`} contentStyle={tip.contentStyle}/></PieChart>
                </ResponsiveContainer>
                <div style={{display:"flex",flexDirection:"column",gap:"5px",marginTop:"8px"}}>
                  {facilitatorTxShare.map((f,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"7px"}}>
                      <div style={{width:"8px",height:"8px",borderRadius:"2px",background:f.color,flexShrink:0}}/>
                      <span style={{fontSize:"11px",color:"var(--color-text-secondary)",flex:1}}>{f.name}</span>
                      <span style={{fontSize:"10px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>{f.note}</span>
                      <span style={{fontSize:"11px",fontFamily:"var(--font-mono)",color:"var(--color-text-primary)",minWidth:"30px",textAlign:"right"}}>{f.value}%</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card style={{padding:"16px 20px"}}>
                <Hd l="WHY DEXTER IS EXCLUDED FROM ARTEMIS ADJUSTED DATA"/>
                <p style={{margin:"0 0 12px",fontSize:"13px",lineHeight:1.7,color:"var(--color-text-primary)"}}>
                  Artemis flags 85.3% of api.dexter.cash HTTP-layer transactions as gamed — meaning they don't represent real commercial intent (automated retries, health checks, bot loops, self-testing). Artemis therefore excludes Dexter from its adjusted facilitator view.
                </p>
                <p style={{margin:"0 0 12px",fontSize:"13px",lineHeight:1.7,color:"var(--color-text-primary)"}}>
                  However, Dune on-chain data shows the underlying wallet (DEXVS3su4dZ...) IS processing real USDC at $0.048/tx average — 1.17M USDC transactions in 30 days (~$57K). So the on-chain settlement layer is real, but the commercial activity it represents is mostly automated testing, not paying customers.
                </p>
                <div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"12px 14px"}}>
                  <p style={{margin:"0 0 4px",fontSize:"9px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",letterSpacing:"0.06em"}}>DEXTER SUMMARY</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                    {[
                      {l:"HTTP gamed (Artemis)",v:"85.3%"},
                      {l:"On-chain USDC real",v:"$57K/30d"},
                      {l:"Avg tx (Dune)",v:"$0.048"},
                      {l:"Artemis adjusted",v:"Excluded"},
                      {l:"DEXTER token MC",v:"$1.0M"},
                      {l:"Verdict",v:"Monitor only"},
                    ].map((m,i)=>(
                      <div key={i}>
                        <p style={{margin:"0 0 2px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>{m.l.toUpperCase()}</p>
                        <p style={{margin:0,fontSize:"12px",fontWeight:500,color:"var(--color-text-primary)"}}>{m.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── SERVERS ── */}
        {tab==="Servers"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px"}}>
              <div>
                <p style={{margin:"0 0 2px",fontSize:"10px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>Source: Artemis Terminal "Top x402 Servers (Last 30 Days)" · Mar 28 2026 exact screenshot</p>
                <p style={{margin:0,fontSize:"11px",color:"var(--color-text-secondary)"}}>Gamed % colour: red {">"}60%, yellow 30–60%, green {"<"}30%.</p>
              </div>
              <button onClick={()=>sendPrompt("Which top x402 servers represent genuine micropayment adoption vs noise? Map to investable tokens.")} style={{fontSize:"11px",padding:"5px 10px"}}>Map to tokens ↗</button>
            </div>
            <Card style={{overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",minWidth:"900px",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)"}}>
                      {["Server","Gamed Txns","Gamed Vol","Real Txns","Real Volume","Avg Tx","Buyers","Flag","Note"].map((h,i)=>(
                        <th key={i} style={{padding:"8px 10px",textAlign:"left",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",letterSpacing:"0.07em",fontWeight:400,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topServers.map((s,i)=>{
                      const gn=parseFloat(s.gTx),gvn=parseFloat(s.gVol)
                      const tc=gn>60?"var(--color-text-danger)":gn>30?"var(--color-text-warning)":"var(--color-text-success)"
                      const vc=gvn>50?"var(--color-text-danger)":gvn>20?"var(--color-text-warning)":"var(--color-text-success)"
                      return (
                        <tr key={i} style={{borderBottom:i<topServers.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
                          <td style={{padding:"9px 10px",fontSize:"11px",fontWeight:500,color:"var(--color-text-primary)",wordBreak:"break-all",maxWidth:"160px"}}>{s.server}</td>
                          <td style={{padding:"9px 10px",fontSize:"10px",fontFamily:"var(--font-mono)",color:tc,fontWeight:500}}>{s.gTx}</td>
                          <td style={{padding:"9px 10px",fontSize:"10px",fontFamily:"var(--font-mono)",color:vc,fontWeight:500}}>{s.gVol}</td>
                          <td style={{padding:"9px 10px",fontSize:"10px",fontFamily:"var(--font-mono)",color:"var(--color-text-primary)"}}>{s.realTxns}</td>
                          <td style={{padding:"9px 10px",fontSize:"10px",fontFamily:"var(--font-mono)",fontWeight:500,color:"var(--color-text-primary)"}}>{s.realVol}</td>
                          <td style={{padding:"9px 10px",fontSize:"10px",fontFamily:"var(--font-mono)",color:"var(--color-text-secondary)"}}>{s.avgTx}</td>
                          <td style={{padding:"9px 10px",fontSize:"10px",fontFamily:"var(--font-mono)",color:"var(--color-text-secondary)"}}>{s.buyers}</td>
                          <td style={{padding:"9px 10px"}}>{BADGE(s.flag,s.flag==="HIGH"?"HIGH":s.flag==="BEARISH"?"BEARISH":"WATCH")}</td>
                          <td style={{padding:"9px 10px",fontSize:"10px",color:"var(--color-text-secondary)",lineHeight:1.5,minWidth:"180px"}}>{s.note}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── TOKENS ── */}
        {tab==="Tokens"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
              <p style={{margin:0,fontSize:"10px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>Prices: CoinGecko / CMC · Mar 27–28 2026 · Facilitator confirmation from Artemis adjusted data · Not financial advice</p>
              <button onClick={()=>sendPrompt("Rank VIRTUAL, PAYAI, KITE, DREAMS, SERV, DEXTER by conviction for 6-month hold. Use Artemis adjusted data as the primary signal — which have confirmed presence in Artemis adjusted facilitator view?")} style={{fontSize:"11px",padding:"5px 10px"}}>Rank by conviction ↗</button>
            </div>
            {tokens.map((t,i)=>(
              <Card key={i} style={{padding:"14px 20px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"10px",marginBottom:"10px"}}>
                  <div>
                    <p style={{margin:"0 0 3px",fontSize:"14px",fontWeight:500,color:"var(--color-text-primary)"}}>{t.name} <span style={{fontFamily:"var(--font-mono)",fontSize:"10px",color:"var(--color-text-tertiary)",fontWeight:400}}>${t.symbol}</span></p>
                    <span style={{fontSize:"10px",color:"var(--color-text-secondary)",background:"var(--color-background-secondary)",padding:"1px 7px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-tertiary)"}}>{t.cat}</span>
                  </div>
                  <div style={{display:"flex",gap:"14px",alignItems:"center",flexWrap:"wrap"}}>
                    <div><p style={{margin:"0 0 2px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>PRICE</p><p style={{margin:0,fontSize:"16px",fontWeight:500,fontFamily:"var(--font-mono)"}}>{t.price}</p></div>
                    <div><p style={{margin:"0 0 2px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>MKT CAP</p><p style={{margin:0,fontSize:"13px",fontFamily:"var(--font-mono)"}}>{t.mc}</p></div>
                    <div><p style={{margin:"0 0 4px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>7D</p>{BADGE(t.c7,t.bull7?"UP":"DOWN")}</div>
                    <div><p style={{margin:"0 0 4px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>30D</p>{BADGE(t.c30,t.bull30?"UP":"DOWN")}</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:"10px"}}>
                  <div><p style={{margin:"0 0 4px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",letterSpacing:"0.05em"}}>ARTEMIS / x402 DATA LINK</p><p style={{margin:0,fontSize:"11px",color:"var(--color-text-secondary)",lineHeight:1.6}}>{t.xRole}</p></div>
                  <div><p style={{margin:"0 0 4px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",letterSpacing:"0.05em"}}>MOST RECENT DEVELOPMENT</p><p style={{margin:0,fontSize:"11px",color:"var(--color-text-primary)",lineHeight:1.6}}>{t.update}</p></div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── ERC-8004 ── */}
        {tab==="ERC-8004"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div style={{background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"14px 18px"}}>
              <p style={{margin:"0 0 6px",fontSize:"9px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",letterSpacing:"0.07em"}}>WHAT IS ERC-8004 AND WHY IT MATTERS FOR x402</p>
              <p style={{margin:0,fontSize:"13px",lineHeight:1.7,color:"var(--color-text-primary)"}}>ERC-8004 is the identity layer for AI agents — proposed by Ethereum Foundation dAI (Davide Crapis), MetaMask (Marco De Rossi), Google (Jordan Ellis), Coinbase (Erik Reppel). Mainnet Jan 29 2026. Each agent gets an ERC-721 NFT identity, reputation scores from on-chain feedback, and validation via ZK/TEE proofs. <strong style={{fontWeight:500}}>x402 connection:</strong> High-reputation ERC-8004 agents get preferential x402 server access. World's AgentKit (Mar 17) first production integration of both layers together. This is the identity → payment → commerce stack.</p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
              <Card style={{padding:"16px 20px"}}>
                <Hd l="AGENTS BY CHAIN (MAR 28 2026)"/>
                <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
                  {erc8004Stats.map((c,i)=>(
                    <div key={i}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"7px"}}><div style={{width:"8px",height:"8px",borderRadius:"2px",background:c.color}}/><span style={{fontSize:"12px",color:"var(--color-text-primary)",fontWeight:500}}>{c.chain}</span></div>
                        <span style={{fontSize:"12px",fontFamily:"var(--font-mono)",color:"var(--color-text-primary)"}}>{c.agents}</span>
                      </div>
                      <div style={{height:"4px",background:"var(--color-background-secondary)",borderRadius:"2px"}}><div style={{height:"100%",width:`${c.share}%`,background:c.color,borderRadius:"2px"}}/></div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"10px 12px",background:"var(--color-background-warning)",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-warning)"}}>
                  <p style={{margin:0,fontSize:"11px",color:"var(--color-text-primary)",lineHeight:1.55}}><strong style={{fontWeight:500}}>Key risk:</strong> Most agent wallets show negligible holdings or trades. Leaderboard scores vulnerable to coordinated feedback campaigns. Reputation gaming is already visible in on-chain data (see agent #22721 and #13445).</p>
                </div>
              </Card>
              <Card style={{padding:"16px 20px"}}>
                <Hd l="HOW SCORES WORK — ON-CHAIN MECHANICS"/>
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  {[
                    {label:"Identity Registry",v:"ERC-721 NFT per agent (0x8004A169...)",desc:"Portable, transferable on-chain ID. Points to IPFS registration file with name, description, capabilities."},
                    {label:"Reputation Registry",v:"On-chain feedback events (0x8004BAa1...)",desc:"Any address can submit feedback. Score computed off-chain by aggregators like 8004scan from raw on-chain events."},
                    {label:"Quality Signals",v:"Unique submitters / total feedback ratio",desc:"High unique ratio = organic. Low ratio (e.g. 19 wallets / 83 feedbacks) = concentrated = likely gamed."},
                    {label:"Validation",v:"TEE attestation / zkML / stake re-execution",desc:"Third-party verification of agent task completion. Strongest trust signal — rare in early agents."},
                  ].map((m,i)=>(
                    <div key={i} style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"9px 12px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                        <span style={{fontSize:"12px",fontWeight:500,color:"var(--color-text-primary)"}}>{m.label}</span>
                        <span style={{fontSize:"9px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>{m.v}</span>
                      </div>
                      <p style={{margin:0,fontSize:"11px",color:"var(--color-text-secondary)",lineHeight:1.5}}>{m.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Leaderboard */}
            <Card style={{overflow:"hidden"}}>
              <div style={{padding:"12px 20px",borderBottom:"0.5px solid var(--color-border-tertiary)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
                <div>
                  <Hd l="TOP 10 ERC-8004 AGENTS — REAL ON-CHAIN DATA (DUNE MCP)"/>
                  <p style={{margin:0,fontSize:"11px",color:"var(--color-text-secondary)"}}>Source: 8004scan.io/leaderboard screenshot (Mar 28 2026) · All chains · Score = 8004scan composite quality metric, NOT raw feedback count</p>
                  <p style={{margin:"4px 0 0",fontSize:"10px",color:"var(--color-text-tertiary)",fontFamily:"var(--font-mono)"}}>Cross-verification: Minara AI #9 with 142 feedback confirmed independently by Dune on-chain query (agent ID #6888, 120 unique submitters). x402 ✓ = confirmed x402 endpoint in agent registration metadata.</p>
                </div>
                <button onClick={()=>sendPrompt("Which ERC-8004 agents show the strongest signals of genuine utility vs gaming? What would we need to see to upgrade conviction on any of them?")} style={{fontSize:"11px",padding:"5px 10px",flexShrink:0}}>Deep dive ↗</button>
              </div>
              <div style={{overflowX:"auto"}}>
                {erc8004Agents.map((a,i)=>(
                  <div key={i} style={{padding:"14px 20px",borderBottom:i<erc8004Agents.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:"12px",marginBottom:"8px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"14px",fontWeight:500,fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",minWidth:"24px",paddingTop:"2px"}}>#{a.rank}</span>
                      <div style={{flex:1,minWidth:"160px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"3px"}}>
                          <span style={{fontSize:"13px",fontWeight:500,color:"var(--color-text-primary)"}}>{a.name}</span>
                          <span style={{fontSize:"9px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>{a.chain}</span>
                          {a.x402&&<span style={{background:"var(--color-background-success)",color:"var(--color-text-success)",border:"0.5px solid var(--color-border-success)",borderRadius:"var(--border-radius-md)",padding:"1px 6px",fontSize:"9px",fontFamily:"var(--font-mono)",fontWeight:500}}>x402 ✓</span>}
                        </div>
                        <p style={{margin:0,fontSize:"9px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>{a.owner}</p>
                      </div>
                      <div style={{display:"flex",gap:"14px",alignItems:"center",flexWrap:"wrap",flexShrink:0}}>
                        <div style={{textAlign:"center"}}>
                          <p style={{margin:"0 0 2px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>SCORE</p>
                          <p style={{margin:0,fontSize:"18px",fontWeight:500,fontFamily:"var(--font-mono)",color:"var(--color-text-primary)"}}>{a.score}</p>
                        </div>
                        <div style={{textAlign:"center"}}>
                          <p style={{margin:"0 0 2px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>FEEDBACK</p>
                          <p style={{margin:0,fontSize:"15px",fontWeight:500,fontFamily:"var(--font-mono)",color:"var(--color-text-secondary)"}}>{a.feedback}</p>
                        </div>
                        <div style={{textAlign:"center"}}>
                          <p style={{margin:"0 0 4px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>GAMING RISK</p>
                          {BADGE(a.gamingRisk, a.gamingRisk==="LOW"?"LOW":a.gamingRisk==="HIGH"?"BEARISH":"WATCH")}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",paddingLeft:"36px"}}>
                      <div>
                        <p style={{margin:"0 0 3px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",letterSpacing:"0.05em"}}>AGENT DESCRIPTION (FROM 8004SCAN + ON-CHAIN)</p>
                        <p style={{margin:0,fontSize:"11px",color:"var(--color-text-secondary)",lineHeight:1.6}}>{a.description}</p>
                      </div>
                      <div>
                        <p style={{margin:"0 0 3px",fontSize:"8px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",letterSpacing:"0.05em"}}>INVESTMENT SIGNAL</p>
                        <p style={{margin:0,fontSize:"11px",color:"var(--color-text-primary)",lineHeight:1.6}}>{a.why}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── SIGNALS ── */}
        {tab==="Signals"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
              <p style={{margin:0,fontSize:"10px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)"}}>Sources: Artemis Terminal · Artemis Sheet · CoinDesk · Bankless · CryptoRank · Dune MCP · Mar 28 2026</p>
              <button onClick={()=>sendPrompt("Synthesise all x402 + ERC-8004 signals into a 3-bullet investment memo — bull, bear, and single most important catalyst to watch.")} style={{fontSize:"11px",padding:"5px 10px"}}>Investment memo ↗</button>
            </div>
            <Card style={{overflow:"hidden"}}>
              {signals.map((s,i)=>(
                <div key={i} style={{padding:"14px 20px",display:"flex",alignItems:"flex-start",gap:"14px",borderBottom:i<signals.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
                  <span style={{fontSize:"10px",fontFamily:"var(--font-mono)",color:"var(--color-text-tertiary)",paddingTop:"2px",minWidth:"54px",flexShrink:0}}>{s.date}</span>
                  <div style={{flexShrink:0}}>{BADGE(s.type,s.type)}</div>
                  <span style={{fontSize:"13px",color:"var(--color-text-primary)",lineHeight:1.65}}>{s.text}</span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
