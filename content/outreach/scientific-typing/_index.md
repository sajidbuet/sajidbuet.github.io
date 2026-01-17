---
Title: Unicode Scientific Symbols Cheat Sheet
Placing: 7
icon: file-text
summary: Greek letters, subscripts/superscripts, and a broad catalog of mathematical, logical, and operator symbols (Unicode).
---

# Unicode Scientific Symbols (Unicode + Subscripts)

This page lists commonly used scientific symbols you can paste directly into Markdown/HTML. Rendering depends on the font; for best coverage use modern fonts (e.g., Noto Sans/Serif).

---

## Table of Contents

- [1. Greek alphabet](#1-greek-alphabet)
  - [1.1 Full alphabet table](#11-full-alphabet-table)
  - [1.2 Variant Greek forms](#12-variant-greek-forms)
- [2. Unicode subscripts and superscripts](#2-unicode-subscripts-and-superscripts)
  - [2.1 Digits](#21-digits)
  - [2.2 Signs and parentheses](#22-signs-and-parentheses)
  - [2.3 Common superscript letters](#23-common-superscript-letters)
  - [2.4 Common subscript letters](#24-common-subscript-letters)
  - [2.5 Combining-mark tip (fallback)](#25-combining-mark-tip-fallback)
- [3. Core constants and special symbols](#3-core-constants-and-special-symbols)
- [4. Arithmetic operators and basic math](#4-arithmetic-operators-and-basic-math)
- [5. Relational operators](#5-relational-operators)
- [6. Set theory and common math objects](#6-set-theory-and-common-math-objects)
- [7. Logic symbols](#7-logic-symbols)
- [8. Calculus and analysis operators](#8-calculus-and-analysis-operators)
- [9. Linear algebra, vectors, and matrices](#9-linear-algebra-vectors-and-matrices)
- [10. Probability and statistics](#10-probability-and-statistics)
- [11. Common arrows](#11-common-arrows)
- [12. Operator catalog](#12-operator-catalog)
  - [12.1 Algebraic and binary operators](#121-algebraic-and-binary-operators)
  - [12.2 Bitwise and logic-like operators](#122-bitwise-and-logic-like-operators)
  - [12.3 Set operators](#123-set-operators)
  - [12.4 Comparison and ordering operators](#124-comparison-and-ordering-operators)
  - [12.5 Calculus operators](#125-calculus-operators)
- [13. Physics and engineering symbols](#13-physics-and-engineering-symbols)
- [14. Quantum information staples](#14-quantum-information-staples)
- [15. Quick copy block](#15-quick-copy-block)
- [16. Notes for Markdown users](#16-notes-for-markdown-users)

---

## 1. Greek alphabet

### 1.1 Full alphabet table

| Upper | Lower | English name | Notes / Common use |
|---:|---:|---|---|
| Α | α | alpha | angles, fine-structure (α), coefficients |
| Β | β | beta | coefficients, beta distribution, velocity fraction |
| Γ | γ | gamma | Euler gamma, photons (γ), Lorentz factor (γ) |
| Δ | δ | delta | change (Δ), small change (δ), Dirac delta (δ) |
| Ε | ε | epsilon | permittivity (ε), small quantity |
| Ζ | ζ | zeta | Riemann zeta (ζ) |
| Η | η | eta | efficiency (η), viscosity (η) |
| Θ | θ | theta | angles |
| Ι | ι | iota | index, small quantity |
| Κ | κ | kappa | curvature (κ), dielectric constant, kappa statistic |
| Λ | λ | lambda | wavelength (λ), eigenvalues, rate parameter |
| Μ | μ | mu | micro (µ in SI contexts), mean (μ), reduced mass |
| Ν | ν | nu | frequency (ν), degrees of freedom |
| Ξ | ξ | xi | random variable, correlation length |
| Ο | ο | omicron | rarely used as a symbol |
| Π | π | pi | circle constant (π) |
| Ρ | ρ | rho | density (ρ), correlation coefficient |
| Σ | σ | sigma | summation (Σ), std dev (σ), conductivity (σ) |
| Τ | τ | tau | time constant (τ), torque, optical depth |
| Υ | υ | upsilon | rarely used; sometimes fluid velocity |
| Φ | φ | phi | phase (φ) |
| Χ | χ | chi | chi-square (χ²) |
| Ψ | ψ | psi | wavefunction (ψ) |
| Ω | ω | omega | angular frequency (ω), ohm (Ω) |

### 1.2 Variant Greek forms

- epsilon: **ε** and **ϵ**
- theta: **θ** and **ϑ**
- phi: **φ** and **ϕ**
- rho: **ρ** and **ϱ**
- pi: **π** and **ϖ**
- sigma (final form): **σ** and **ς**

---

## 2. Unicode subscripts and superscripts

### 2.1 Digits

- Subscripts: ₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉  
- Superscripts: ⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹  

Examples: **x₀**, **a₁**, **r²**, **10⁻³**

### 2.2 Signs and parentheses

- Subscript: ₊ ₋ ₌ ₍ ₎  
- Superscript: ⁺ ⁻ ⁼ ⁽ ⁾  

Examples: **x₍ₙ₊₁₎**, **(n+1)⁻¹**

### 2.3 Common superscript letters

ᵃ ᵇ ᶜ ᵈ ᵉ ᶠ ᵍ ʰ ⁱ ʲ ᵏ ˡ ᵐ ⁿ ᵒ ᵖ ʳ ˢ ᵗ ᵘ ᵛ ʷ ˣ ʸ ᶻ

### 2.4 Common subscript letters

- ₐ ₑ ₕ ₖ ₗ ₘ ₙ ₒ ₚ ₛ ₜ ₓ  
- (Coverage varies by font; Unicode has fewer subscript letters than superscripts.)

Examples: **Vₛ**, **Iₓ**, **kₙ**

### 2.5 Combining-mark tip (fallback)

Not true subscripts, but can help for emphasis when you cannot use LaTeX/MathJax:
- combining low line: ̲  (U+0332)
- combining dot below: ̣ (U+0323)

If you need full math-quality subscripts for arbitrary text, prefer LaTeX/MathJax (e.g., `x_{n+1}`).

---

## 3. Core constants and special symbols

| Symbol | Name | Meaning / Typical use |
|---:|---|---|
| ∞ | infinity | unbounded limit |
| π | pi | circle constant |
| ℯ | Euler’s number (alt) | sometimes used for *e* |
| ℏ | h-bar | reduced Planck constant |
| ° | degree | angles, temperature |
| ′ ″ | prime, double prime | derivatives, arcminutes/arcseconds |
| Å | ångström | 10⁻¹⁰ m (materials/optics) |
| µ | micro sign | 10⁻⁶ (SI prefix) |
| Ω | ohm | electrical resistance unit |

---

## 4. Arithmetic operators and basic math

| Symbol | Name | Meaning |
|---:|---|---|
| + | plus | addition |
| − | minus (true minus) | subtraction (prefer over hyphen `-`) |
| ± | plus–minus | two possible signs |
| ∓ | minus–plus | paired with ± |
| × | multiplication | scalar multiply (often) |
| · | dot | multiplication, dot product context |
| ÷ | division | division (often avoided in formal math) |
| / | solidus | division / ratio |
| √ | square root | principal root |
| ∛ ∜ | cube/fourth root | roots |
| ! | factorial | n! |
| ‖x‖ | norm bars | norm / magnitude |
| |x| | absolute value | magnitude |

---

## 5. Relational operators

| Symbol | Name | Meaning |
|---:|---|---|
| = | equals | equality |
| ≠ | not equal | inequality |
| <, > | less/greater | ordering |
| ≤, ≥ | less/greater or equal | ordering with equality |
| ≪, ≫ | much less/greater | asymptotic comparisons |
| ≈ | approximately equal | approximation |
| ≃ | asymptotically equal | used in analysis/physics |
| ≅ | congruent / approximately equal | context dependent |
| ∼ | similarity / distributed as | “similar”, or “X ∼ …” |
| ≡ | identically equal / congruent | equivalence, modular equality |
| ∝ | proportional to | proportionality |
| ≲, ≳ | less/greater or approx | approximate inequalities |

---

## 6. Set theory and common math objects

| Symbol | Name | Meaning |
|---:|---|---|
| ∈ | element of | membership |
| ∉ | not element of | non-membership |
| ⊂, ⊃ | subset/superset (strict) | proper inclusion |
| ⊆, ⊇ | subset/superset | inclusion allowing equality |
| ∪ | union | set union |
| ∩ | intersection | set intersection |
| \ | set difference | A \ B |
| ∅ | empty set | no elements |
| ℕ ℤ ℚ ℝ ℂ | number sets | naturals, integers, rationals, reals, complex |

---

## 7. Logic symbols

| Symbol | Name | Meaning |
|---:|---|---|
| ¬ | not | logical negation |
| ∧ | and | conjunction |
| ∨ | or | disjunction |
| ⊕ | xor | exclusive OR (also “direct sum” in algebra) |
| ⊼ | nand | Sheffer stroke variant |
| ⊽ | nor | Peirce arrow variant |
| → | implies | implication |
| ↔ | iff | biconditional |
| ⇒ | implies (double) | often used in proofs |
| ⇔ | iff (double) | equivalence |
| ∀ | for all | universal quantifier |
| ∃ | there exists | existential quantifier |
| ∄ | there does not exist | negated existential |
| ⊤ | true | truth constant |
| ⊥ | false | falsity / contradiction |
| ⊢ | proves | syntactic entailment |
| ⊨ | models | semantic entailment |
| ∴ | therefore | conclusion marker |
| ∵ | because | reason marker |

---

## 8. Calculus and analysis operators

| Symbol | Name | Meaning |
|---:|---|---|
| d/dx | derivative | ordinary derivative |
| ∂ | partial derivative | multivariate derivative |
| ∇ | nabla / del | gradient operator |
| ∇· | divergence | divergence |
| ∇× | curl | curl |
| ∇² | Laplacian | Laplace operator |
| ∫ | integral | integration |
| ∬ ∬ ∬ | multiple integrals | double/triple (font support varies) |
| ∮ | contour integral | closed-path integral |
| ∑ | summation | sum over index |
| ∏ | product | product over index |
| lim | limit | limiting process |
| sup / inf | supremum / infimum | bounds |
| ∘ | composition | function composition |

---

## 9. Linear algebra, vectors, and matrices

| Symbol | Name | Meaning |
|---:|---|---|
| 𝟙 or I | identity | identity matrix/operator |
| Aᵀ | transpose | transpose |
| Aᴴ | Hermitian transpose | conjugate transpose (often `†`) |
| A† | dagger | adjoint operator |
| det(A) | determinant | determinant |
| tr(A) | trace | trace |
| ⟨x, y⟩ | inner product | dot/inner product |
| x·y | dot product | Euclidean inner product |
| x×y | cross product | 3D cross product |
| ⊗ | tensor (Kronecker) product | tensor product |
| ⊕ | direct sum | block sum (also XOR in logic) |
| ≽, ≼ | semidefinite ordering | A ≽ 0 |

---

## 10. Probability and statistics

| Symbol | Name | Meaning |
|---:|---|---|
| P(A) | probability | probability of event A |
| 𝔼[X] | expectation | mean value |
| Var(X) | variance | dispersion |
| Cov(X,Y) | covariance | joint variability |
| σ | standard deviation | spread |
| μ | mean | average |
| ⊥⊥ | independent | statistical independence |
| ~ | distributed as | X ~ Normal(0,1) |

---

## 11. Common arrows

| Symbol | Name | Meaning |
|---:|---|---|
| ← → ↔ | arrows | direction / relation |
| ↑ ↓ | up/down | limits, monotonicity |
| ⇐ ⇒ ⇔ | double arrows | implication/equivalence |
| ↦ | maps to | function mapping |
| ⟶ | long right arrow | transformations |
| ⟵ | long left arrow | reverse mapping |
| ↪ | hook arrow | injection / embedding |
| ↠ | twohead arrow | surjection |

---

## 12. Operator catalog

### 12.1 Algebraic and binary operators

- addition/subtraction: **+ − ± ∓**
- multiplication forms: **× · ∗**
- division forms: **÷ /**
- composition: **∘**
- convolution (common notation): **∗**
- direct sum: **⊕**
- tensor product: **⊗**
- wedge / exterior: **∧**

### 12.2 Bitwise and logic-like operators

- AND: **∧** (or `&` in code)
- OR: **∨** (or `|` in code)
- XOR: **⊕** (or `^` in code)
- NOT: **¬** (or `~` / `!` in code)
- NAND/NOR: **⊼ ⊽**

### 12.3 Set operators

- union/intersection: **∪ ∩**
- set difference: **\\**
- Cartesian product: **×**
- membership: **∈ ∉**

### 12.4 Comparison and ordering operators

- equal/unequal: **= ≠**
- approximate: **≈ ≃ ≅**
- inequalities: **< > ≤ ≥**
- much less/greater: **≪ ≫**
- proportional: **∝**
- equivalence: **≡**

### 12.5 Calculus operators

- derivative/partial: **d/dx, ∂**
- gradient/div/curl: **∇, ∇·, ∇×**
- integral/sum/product: **∫ ∮ ∑ ∏**
- Laplacian: **∇²**

---

## 13. Physics and engineering symbols

| Symbol | Typical meaning |
|---:|---|
| ℏ | reduced Planck constant |
| λ | wavelength |
| ω | angular frequency |
| k | wavenumber / spring constant |
| ε, ε₀ | permittivity, vacuum permittivity |
| μ, μ₀ | permeability (or mean), vacuum permeability |
| σ | conductivity / standard deviation |
| ρ | density |
| Φ, φ | flux / phase |
| Δ | change (finite) |
| δ | small change / variation |
| ∇ | spatial differential operator |
| ⟂ ∥ | perpendicular / parallel |

---

## 14. Quantum information staples

| Symbol | Name | Meaning |
|---:|---|---|
| \|ψ⟩ | ket | quantum state vector |
| ⟨ψ\| | bra | dual vector |
| ⟨ψ\|φ⟩ | inner product | amplitude / overlap |
| ρ | density matrix | mixed state |
| Tr(ρ) | trace | normalization and expectation |
| ⊗ | tensor product | composite systems |
| 𝟙 | identity | identity operator |
| σₓ σᵧ σ_z | Pauli operators | X, Y, Z |

---

## 15. Quick copy block

Greek: **α β γ δ ε θ λ μ ν π ρ σ τ φ χ ψ ω**  
Logic: **¬ ∧ ∨ ⊕ → ↔ ∀ ∃ ⊤ ⊥**  
Calc: **∂ ∇ ∫ ∮ ∑ ∏ √ ∞**  
Linear algebra: **⟨ ⟩ ‖ ⊗ ⊕ †**  
Relations: **≤ ≥ ≠ ≈ ∝ ≡**

---

## 16. Notes for Markdown users

- Prefer the true minus **−** over hyphen **-** in equations.
- Some symbols (blackboard-bold sets, multiple integrals) depend heavily on font support.
- If you need exact spacing and typography, use LaTeX/MathJax instead of raw Unicode.
```
