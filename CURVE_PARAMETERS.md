# Curve Parameters: Exponent and Curve Shift

Braid's order curves provide two powerful parameters for controlling liquidity distribution:
- **Exponent (`n`)**: Controls the *shape* of the density curve
- **Curve Shift (`c`)**: Controls *where* you start on the curve

Both parameters are stored as signed 32-bit integers scaled by 1000 (so `exponent = 2000` means n=2).

## Exponent: Density Shape

The exponent controls how liquidity is distributed across the price range.

### Positive Exponents (n > 0)

Concentrate liquidity toward the **end** of the price range (toward p_max for asks, toward p_min for bids).

| Exponent | Behavior | Strategy |
|----------|----------|----------|
| n = 0 | Uniform distribution | Classic DCA |
| n = 1 | Linear ramp | Patient accumulation |
| n = 2 | Quadratic ramp | "Back up the truck on deep dips" |
| n = 3+ | Aggressive concentration | Extreme conviction plays |

**Mathematical form:**
```
t = f^(1/(n+1))
marginal_price = p_min + (p_max - p_min) * t
```

### Negative Exponents (n < 0)

Concentrate liquidity toward the **start** of the price range. This is the inverse of positive exponents.

| Exponent | Behavior | Strategy |
|----------|----------|----------|
| n = -1 | Inverse linear | Front-run entry aggressively |
| n = -2 | Inverse quadratic | "All-in immediately" |

**Mathematical form:**
```
t = 1 - (1-f)^(1/|n|)
marginal_price = p_min + (p_max - p_min) * t
```

### Visual Comparison

```
Positive exponents (back-loaded):     Negative exponents (front-loaded):

Density                               Density
  ^                                     ^
  |          ****                       |  ****
  |       ***                           |     ***
  |    ***                              |        ***
  |  **                                 |           **
  | *                                   |             *
  +---------------> Price               +---------------> Price
       n=2                                   n=-2
```

## Curve Shift: Position Translation

The curve shift parameter translates your position along the density curve by a percentage.

### How It Works

```
effective_t = clamp(t + c, 0, 1)
```

Where:
- `t` is the computed curve position from fill fraction
- `c` is the curve shift (scaled by 1000, so `curve_shift = 300` means 30%)
- Result is clamped to [0, 1]

### Positive Shift (c > 0): Head Start

Start further along the curve, meaning higher density from the beginning.

**Example:** With `curve_shift = +500` (50%):
- At 0% filled, you're at 50% density instead of 0%
- Fills are immediately aggressive
- Reaches maximum density earlier

```
Without shift:              With +50% shift:

Density                     Density
  ^                           ^
  |       **                  | *******
  |     **                    |        **
  |   **                      |          **
  | **                        |            *
  |*                          |
  +-------> Price             +-------> Price
```

### Negative Shift (c < 0): Dead Zone

Creates a "dead zone" at the start of the range where no liquidity is provided.

**Example:** With `curve_shift = -300` (-30%):
- No liquidity in the first 30% of the price range
- Effective price starts 30% into the range
- Useful for "skip the noise" strategies

```
Without shift:              With -30% shift:

Density                     Density
  ^                           ^
  |       **                  |         **
  |     **                    |       **
  |   **                      |     **
  | **                        |   **
  |*                          |░░░|*
  +-------> Price             +-------> Price
                              ^^^^ Dead Zone (no liquidity)
```

### Effective Price with Dead Zone

When `curve_shift < 0`, the order's **effective price** shifts:

```
effective_price = p_min + |c| * (p_max - p_min)
```

**Example:** Range [$90, $100] with `curve_shift = -300` (-30%):
- Effective price = $90 + 0.3 * $10 = $93
- No liquidity available above $93
- The order "starts" at $93 for routing purposes

## Combining Parameters

The exponent and curve shift can be combined for fine-grained control:

| Exponent | Shift | Strategy |
|----------|-------|----------|
| n = 2 | c = 0 | Standard aggressive dip buying |
| n = 2 | c = -0.3 | Aggressive dip buying, but only after 30% drop |
| n = -1 | c = +0.3 | Front-loaded selling with 30% head start |
| n = 0 | c = -0.5 | Uniform DCA in bottom half of range only |
| n = 1 | c = +0.2 | Linear ramp with 20% head start |

## Implementation Details

### Storage Format

Both parameters are stored as `i32` scaled by 1000:

```rust
pub struct BaseOrder {
    // ... other fields ...
    pub exponent: i32,      // scaled by 1000 (e.g., 2000 = n=2)
    pub curve_shift: i32,   // scaled by 1000 (e.g., -300 = -30%)
    // ...
}
```

### TypeScript Usage

```typescript
// Create an order with n=2 exponent and -30% curve shift
const params = {
    amount: 1_000_000n,
    p_min: 90_000_000n,   // $0.09 (scaled by 1e9)
    p_max: 100_000_000n,  // $0.10 (scaled by 1e9)
    exponent: 2000,       // n = 2 (aggressive)
    curve_shift: -300,    // -30% dead zone
    side: 0,              // Bid
};
```

### Rust Usage

```rust
let params = PlaceLimitOrderParams {
    amount: 1_000_000,
    p_min: 90_000_000,
    p_max: 100_000_000,
    exponent: 2000,      // n = 2
    curve_shift: -300,   // -30% dead zone
    side: 0,             // Bid
    ..Default::default()
};
```

## Matching Engine Compatibility

Both negative exponents and curve shift are fully compatible with the Braid matching engine:

1. **Monotonicity preserved**: Marginal prices still move in a consistent direction as orders fill
2. **Invertible**: Given a target price P*, we can compute the required fill amount
3. **Greedy optimality**: The exchange argument proof still holds

The curve inversion for price solving with negative exponents:

```
For target price P*:
  t* = (P* - p_min) / (p_max - p_min)

For negative exponent:
  f = 1 - (1 - t*)^|n|

For positive exponent:
  f = t*^(n+1)
```

## Common Use Cases

### DCA with Conviction Layers

```
Base layer (n=0, c=0):        Fills uniformly across range
Conviction layer (n=2, c=-0.3): Only fills aggressively in bottom 70%
```

### Range-Limited Market Making

```
Ask side (n=1, c=-0.2): No inventory sold in first 20% of range
Bid side (n=1, c=-0.2): No inventory bought in first 20% of range
Result: Only provide liquidity when price moves significantly
```

### Aggressive Entry with Fallback

```
First order (n=-2, c=0): Very aggressive at start
Second order (n=2, c=-0.5): Aggressive only if it drops further
Result: Initial aggression with backup for deeper dips
```
