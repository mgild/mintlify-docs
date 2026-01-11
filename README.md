# Braid Protocol Documentation

Official documentation for [Braid Protocol](https://github.com/braid-protocol/braid) - a next-generation DeFi primitive bringing **density orders** and **unified liquidity** to Solana.

## What is Braid?

Braid introduces **density orders** - limit orders that act across a price range, not just a single price point. Instead of placing dozens of orders to express your trading intent, you define a price range and distribution curve in a single transaction.

**Key Features:**
- **Density Orders**: Express complex trading strategies (DCA, graduated profit-taking, range trading) in one order
- **Unified Liquidity**: Combines CP-AMM, concentrated liquidity (CLMM), limit orders, and PropAMM in a single matching engine
- **Sharded Orderbooks**: Unlimited scalability via price-range sharding
- **Zero-Fee PropAMM**: Slot-scoped orders (~400ms validity) with no fees for competitive spreads

## Documentation Site

This repository contains the Mintlify-powered documentation site. The live documentation is available at [docs.braidprotocol.com](https://docs.braidprotocol.com).

### Running Locally

1. **Install Mintlify CLI**:
   ```bash
   npm install -g mintlify
   ```

2. **Start the development server**:
   ```bash
   mintlify dev
   ```

3. **Open in browser**: Navigate to `http://localhost:3000`

### Deployment

Documentation is automatically deployed when changes are pushed to the main branch. Mintlify handles hosting and CDN distribution.

## Repository Structure

```
braid-docs/
├── docs.json              # Mintlify configuration (navigation, theme, socials)
├── introduction.mdx       # Landing page - overview of Braid
├── quickstart.mdx         # Getting started guide
├── architecture.mdx       # Technical architecture deep dive
├── glossary.mdx           # Terminology reference
├── curve-playground.mdx   # Interactive density curve explorer
│
├── concepts/              # Core concepts
│   ├── orderbook.mdx      # How the orderbook works
│   ├── order-types.mdx    # CLMM, Limit, and PropAMM explained
│   ├── sharding.mdx       # Scalability via sharding
│   └── matching-engine.mdx # Trade matching algorithm
│
├── orders/                # Order type details
│   ├── limit-orders.mdx   # Simple limit orders
│   ├── clmm-orders.mdx    # Concentrated liquidity positions
│   └── prop-amm-orders.mdx # Zero-fee slot-scoped orders
│
├── liquidity/             # Liquidity provision
│   ├── cp-amm.mdx         # Constant product AMM
│   └── concentrated-liquidity.mdx
│
├── sdk/                   # SDK documentation
│   ├── typescript/        # TypeScript SDK
│   │   ├── installation.mdx
│   │   ├── market.mdx
│   │   ├── orders.mdx
│   │   └── take.mdx
│   └── rust/              # Rust SDK
│       ├── installation.mdx
│       ├── accounts.mdx
│       └── orderbook.mdx
│
├── api/                   # API reference
│   ├── instructions/      # Program instructions
│   │   ├── market-init.mdx
│   │   ├── place-order.mdx
│   │   ├── cancel-order.mdx
│   │   └── take.mdx
│   └── accounts/          # On-chain accounts
│       ├── market.mdx
│       ├── orderbook.mdx
│       └── user.mdx
│
├── strategies/            # Trading strategies
│   └── index.mdx
│
├── logo/                  # Brand assets
│   ├── dark.svg
│   └── light.svg
│
├── custom.css             # Custom styling
├── curve-playground.js    # Interactive curve visualization
├── hero-logo.js           # Animated hero logo
├── mermaid-modal.js       # Clickable mermaid diagrams
└── pdf-download.js        # PDF export functionality
```

## Documentation Sections

### Getting Started
- **Introduction**: Overview of density orders, unified liquidity, and why Braid matters
- **Quickstart**: Step-by-step guide to your first Braid integration
- **Architecture**: System design, sharding strategy, and account structure
- **Curve Playground**: Interactive tool for exploring density curves

### Core Concepts
- **Orderbook**: How Braid's sharded orderbook works
- **Order Types**: Comparison of CLMM, Limit, and PropAMM orders
- **Sharding**: Scalability through price-range sharding
- **Matching Engine**: Greedy multi-source routing algorithm

### Order Types
| Type | Use Case | Fees | Lifetime |
|------|----------|------|----------|
| **Limit** | Simple buy/sell at price range | Yes | Until filled/cancelled |
| **CLMM** | Provide liquidity in range | Yes | Until filled/cancelled |
| **PropAMM** | Competitive spreads, HFT | Zero | ~400ms (one slot) |

### SDKs

**TypeScript** (`@braid/client`):
```bash
npm install @braid/client @solana/web3.js@2
```

**Rust** (`braid-client`):
```toml
[dependencies]
braid-client = { version = "0.1", features = ["fetch"] }
```

## Technology Stack

- **[Mintlify](https://mintlify.com)**: Documentation framework
- **MDX**: Markdown with JSX components
- **Mermaid**: Diagram generation
- **Custom JS**: Interactive visualizations (curve playground, hero animation)

## Contributing

We welcome contributions to improve the documentation!

### Guidelines

1. **Fork and clone** this repository
2. **Create a branch** for your changes: `git checkout -b docs/improve-quickstart`
3. **Make your changes** - ensure MDX syntax is valid
4. **Test locally** with `mintlify dev`
5. **Submit a PR** with a clear description

### Style Guide

- Use clear, concise language
- Include code examples for all SDK methods
- Add diagrams (Mermaid) for complex concepts
- Link related pages with `<Card>` components
- Use `<Note>`, `<Warning>`, and `<Tip>` for callouts
- Keep paragraphs short for readability

### Adding New Pages

1. Create the `.mdx` file in the appropriate directory
2. Add frontmatter with `title` and `description`
3. Add the page path to `docs.json` in the correct navigation group
4. Include in relevant `<CardGroup>` links on related pages

## Resources

- **Website**: [braidprotocol.com](https://braidprotocol.com)
- **GitHub**: [github.com/braid-protocol/braid](https://github.com/braid-protocol/braid)
- **Twitter**: [@braidprotocol](https://twitter.com/braidprotocol)
- **TypeScript SDK**: `@braid/client` on npm
- **Rust SDK**: `braid-client` on crates.io

## License

This documentation is licensed under [MIT License](LICENSE).

---

**Don't just trade. Braid.**
