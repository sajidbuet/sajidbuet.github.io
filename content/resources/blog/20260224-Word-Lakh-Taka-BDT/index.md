---
title: "Bangladeshi Currency Formatting and Amount-in-Words in Microsoft Excel"

summary: "Format numbers in the Bangladeshi crore-lakh style, display BDT or the ৳ symbol, and convert Taka and Paisa into words in English or Bangla using formula-only Excel solutions."

date: '2026-02-24'

icon: file-text

aliases:
  - /outreach/blog/20260224-word-lakh-taka-bdt/
---

*Bangladesh Crore–Lakh format · ৳ / BDT currency display · English and Bangla amount in words · No VBA*

Microsoft Excel normally uses the international thousands–millions grouping system. It also does not provide a built-in function for converting a monetary amount into words.

For financial documents in Bangladesh, however, we often need numbers in forms such as:

```text
৳ 1,99,66,612.24
```

and, in words:

```text
One Crore Ninety-Nine Lakh Sixty-Six Thousand
Six Hundred and Twelve Taka and Twenty-Four Paisa Only
```

or in Bangla:

```text
এক কোটি নিরানব্বই লাখ ছেষট্টি হাজার
ছয়শ বারো টাকা এবং চব্বিশ পয়সা মাত্র
```

This guide shows how to do all three in Excel:

1. Format numbers using the Bangladeshi **Crore–Lakh–Thousand** grouping.
2. Add **BDT** or the **৳ Taka symbol** without turning the number into text.
3. Convert an amount into words in **English**.
4. Convert an amount into words in **Bangla**.

Everything is done using Excel's built-in formatting and worksheet formulas. No VBA, macros, or add-ins are required.

---

# 1. Format Numbers in Bangladeshi Crore–Lakh Style

Excel normally displays a large number using the international grouping convention:

```text
99,999,999.99
```

In Bangladesh, the same number is normally written as:

```text
9,99,99,999.99
```

The grouping is:

```text
Crore | Lakh | Thousand | Units
   9  |  99  |    99    | 999.99
```

Excel can display this format while keeping the underlying cell as a normal numeric value.

## Where to Paste the Custom Number Format

1. Select the cells containing the numbers.
2. Press **Ctrl + 1**.
3. Select the **Number** tab.
4. Select **Custom** from the Category list.
5. Click inside the **Type** box.
6. Delete the existing format shown there.
7. Paste the custom format given below.
8. Click **OK**.

For numbers with two decimal places, paste:

```text
[>9999999]0","00","00","000.00;[>99999]#0","00","000.00;#,##0.00
```

For example:

```text
99999999.99
```

will be displayed as:

```text
9,99,99,999.99
```

Similarly:

```text
12500000.50
```

will appear as:

```text
1,25,00,000.50
```

and:

```text
125000.75
```

will appear as:

```text
1,25,000.75
```

The value stored in the cell is unchanged. Therefore, functions such as `SUM`, multiplication, division, sorting, filtering, and references to the cell continue to work normally.

---

## Bangladeshi Number Format Without Decimal Places

If Paisa or decimal values are not required, use:

```text
[>9999999]0","00","00","000;[>99999]#0","00","000;#,##0
```

For example:

```text
99999999
```

will be displayed as:

```text
9,99,99,999
```

---

# 2. Add the ৳ Taka Symbol or BDT

The same custom formatting technique can be used to add a currency identifier.

This allows Excel to display:

```text
৳ 9,99,99,999.99
```

or:

```text
BDT 9,99,99,999.99
```

while keeping the actual cell contents numeric.

Again, go to:

**Ctrl + 1 → Number → Custom → Type**

---

## Display the ৳ Taka Symbol

Paste:

```text
[>9999999]"৳ "0","00","00","000.00;[>99999]"৳ "#0","00","000.00;"৳ "#,##0.00
```

For example:

```text
99999999.99
```

will display as:

```text
৳ 9,99,99,999.99
```

The Bangladeshi Taka symbol is:

```text
৳
```

You can copy the symbol directly from this page and paste it into Excel's Custom Format box.

---

## Display BDT Instead

If you prefer the currency abbreviation, use:

```text
[>9999999]"BDT "0","00","00","000.00;[>99999]"BDT "#0","00","000.00;"BDT "#,##0.00
```

The same number will then appear as:

```text
BDT 9,99,99,999.99
```

---

## Taka Symbol Without Decimal Places

For whole-Taka values:

```text
[>9999999]"৳ "0","00","00","000;[>99999]"৳ "#0","00","000;"৳ "#,##0
```

For example:

```text
12500000
```

will display as:

```text
৳ 1,25,00,000
```

---

## BDT Without Decimal Places

Use:

```text
[>9999999]"BDT "0","00","00","000;[>99999]"BDT "#0","00","000;"BDT "#,##0
```

which displays:

```text
BDT 1,25,00,000
```

These formatting codes affect only how the value is **displayed**. They do not add text to the actual cell value.

---

# 3. Convert Taka and Paisa into Words in English

Excel does not have a built-in `NUMBERTOWORDS()` or equivalent currency function.

Modern versions of Excel, however, support `LET` and `LAMBDA`, which allow the entire conversion routine to be contained inside a single formula.

No Name Manager configuration or VBA code is required.

## Requirements

You need a version of Excel that supports both:

- `LET`
- `LAMBDA`

A simple test for `LAMBDA` support is:

```excel
=LAMBDA(x,x)(1)
```

If Excel returns:

```text
1
```

then `LAMBDA` is available.

---

## English Amount-in-Words Formula

Suppose the amount is stored in cell:

```text
A1
```

Paste the following formula into another cell:

```excel
=LET(
amount,A1,
wordTwo,LAMBDA(n,
    LET(
        x,INT(n),
        u,LAMBDA(k,CHOOSE(k+1,
            "Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
            "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
            "Seventeen","Eighteen","Nineteen")),
        tens,INT(x/10),
        ones,MOD(x,10),
        tt,IF(tens=2,"Twenty",
           IF(tens=3,"Thirty",
           IF(tens=4,"Forty",
           IF(tens=5,"Fifty",
           IF(tens=6,"Sixty",
           IF(tens=7,"Seventy",
           IF(tens=8,"Eighty",
           IF(tens=9,"Ninety","")))))))),
        IF(x<20,
            u(x),
            IF(ones=0,
                tt,
                tt&"-"&u(ones)
            )
        )
    )
),
wordThree,LAMBDA(n,
    LET(
        x,INT(n),
        h,INT(x/100),
        remainder,MOD(x,100),
        TRIM(
            IF(h=0,"",wordTwo(h)&" Hundred")&
            IF(AND(h>0,remainder>0)," and ","")&
            IF(remainder=0,"",wordTwo(remainder))
        )
    )
),
negativeAmount,amount<0,
totalPaisa,ROUND(ABS(amount)*100,0),
takaAmount,QUOTIENT(totalPaisa,100),
paisaAmount,MOD(totalPaisa,100),
croreAmount,INT(takaAmount/10000000),
remainderCrore,MOD(takaAmount,10000000),
lakhAmount,INT(remainderCrore/100000),
remainderLakh,MOD(remainderCrore,100000),
thousandAmount,INT(remainderLakh/1000),
balanceAmount,MOD(remainderLakh,1000),
takaText,TRIM(
    IF(croreAmount>0,wordThree(croreAmount)&" Crore ","")&
    IF(lakhAmount>0,wordThree(lakhAmount)&" Lakh ","")&
    IF(thousandAmount>0,wordThree(thousandAmount)&" Thousand ","")&
    IF(balanceAmount>0,wordThree(balanceAmount),"")
),
paisaText,IF(paisaAmount=0,""," and "&wordTwo(paisaAmount)&" Paisa"),
signText,IF(negativeAmount,"Minus ",""),
IF(
    takaAmount=0,
    signText&"Zero Taka"&IF(paisaAmount=0," Only",paisaText&" Only"),
    signText&takaText&" Taka"&IF(paisaAmount=0," Only",paisaText&" Only")
)
)
```

If your amount is stored somewhere else, simply change:

```excel
amount,A1,
```

For example, if the amount is in `G13`, use:

```excel
amount,G13,
```

The rest of the formula can remain unchanged.

---

## English Examples

If `A1` contains:

```text
19966612.24
```

the formula returns:

```text
One Crore Ninety-Nine Lakh Sixty-Six Thousand Six Hundred and Twelve Taka and Twenty-Four Paisa Only
```

Some additional examples:

| Amount | Output |
|---:|---|
| `100.00` | One Hundred Taka Only |
| `1250.00` | One Thousand Two Hundred and Fifty Taka Only |
| `55000.00` | Fifty-Five Thousand Taka Only |
| `125000.75` | One Lakh Twenty-Five Thousand Taka and Seventy-Five Paisa Only |
| `10000000` | One Crore Taka Only |
| `0.75` | Zero Taka and Seventy-Five Paisa Only |
| `-12.50` | Minus Twelve Taka and Fifty Paisa Only |

---

## Why `totalPaisa` Is Calculated First

The formula first converts the complete amount into Paisa:

```excel
totalPaisa,ROUND(ABS(amount)*100,0)
```

It then separates Taka and Paisa using:

```excel
takaAmount,QUOTIENT(totalPaisa,100)
```

and:

```excel
paisaAmount,MOD(totalPaisa,100)
```

This avoids floating-point rounding situations in which a value close to the next Taka could otherwise produce an invalid result such as:

```text
100 Paisa
```

---

# 4. Convert Taka and Paisa into Words in Bangla

The same approach can be used to produce the complete amount in Bangla.

For example:

```text
55000
```

becomes:

```text
পঞ্চান্ন হাজার টাকা মাত্র
```

and:

```text
19966612.24
```

becomes:

```text
এক কোটি নিরানব্বই লাখ ছেষট্টি হাজার ছয়শ বারো টাকা এবং চব্বিশ পয়সা মাত্র
```

The formula below contains the Bangla words for the numbers from 0 to 99 and then constructs hundreds, thousands, lakhs, and crores from them.

---

## Bangla Amount-in-Words Formula

If the amount is stored in `A1`, paste:

```excel
=LET(
amount,A1,

wordTwo,LAMBDA(n,
    CHOOSE(INT(n)+1,
        "শূন্য",
        "এক",
        "দুই",
        "তিন",
        "চার",
        "পাঁচ",
        "ছয়",
        "সাত",
        "আট",
        "নয়",
        "দশ",
        "এগারো",
        "বারো",
        "তেরো",
        "চৌদ্দ",
        "পনেরো",
        "ষোল",
        "সতেরো",
        "আঠারো",
        "উনিশ",
        "বিশ",
        "একুশ",
        "বাইশ",
        "তেইশ",
        "চব্বিশ",
        "পঁচিশ",
        "ছাব্বিশ",
        "সাতাশ",
        "আটাশ",
        "ঊনত্রিশ",
        "ত্রিশ",
        "একত্রিশ",
        "বত্রিশ",
        "তেত্রিশ",
        "চৌত্রিশ",
        "পঁয়ত্রিশ",
        "ছত্রিশ",
        "সাঁইত্রিশ",
        "আটত্রিশ",
        "ঊনচল্লিশ",
        "চল্লিশ",
        "একচল্লিশ",
        "বিয়াল্লিশ",
        "তেতাল্লিশ",
        "চুয়াল্লিশ",
        "পঁয়তাল্লিশ",
        "ছেচল্লিশ",
        "সাতচল্লিশ",
        "আটচল্লিশ",
        "ঊনপঞ্চাশ",
        "পঞ্চাশ",
        "একান্ন",
        "বাহান্ন",
        "তিপ্পান্ন",
        "চুয়ান্ন",
        "পঞ্চান্ন",
        "ছাপ্পান্ন",
        "সাতান্ন",
        "আটান্ন",
        "ঊনষাট",
        "ষাট",
        "একষট্টি",
        "বাষট্টি",
        "তেষট্টি",
        "চৌষট্টি",
        "পঁয়ষট্টি",
        "ছেষট্টি",
        "সাতষট্টি",
        "আটষট্টি",
        "ঊনসত্তর",
        "সত্তর",
        "একাত্তর",
        "বাহাত্তর",
        "তিয়াত্তর",
        "চুয়াত্তর",
        "পঁচাত্তর",
        "ছিয়াত্তর",
        "সাতাত্তর",
        "আটাত্তর",
        "ঊনআশি",
        "আশি",
        "একাশি",
        "বিরাশি",
        "তিরাশি",
        "চুরাশি",
        "পঁচাশি",
        "ছিয়াশি",
        "সাতাশি",
        "আটাশি",
        "ঊননব্বই",
        "নব্বই",
        "একানব্বই",
        "বিরানব্বই",
        "তিরানব্বই",
        "চুরানব্বই",
        "পঁচানব্বই",
        "ছিয়ানব্বই",
        "সাতানব্বই",
        "আটানব্বই",
        "নিরানব্বই"
    )
),

wordThree,LAMBDA(n,
    LET(
        x,INT(n),
        hundreds,INT(x/100),
        remainder,MOD(x,100),

        hundredText,
        CHOOSE(hundreds+1,
            "",
            "একশ",
            "দুইশ",
            "তিনশ",
            "চারশ",
            "পাঁচশ",
            "ছয়শ",
            "সাতশ",
            "আটশ",
            "নয়শ"
        ),

        TRIM(
            hundredText&
            IF(AND(hundreds>0,remainder>0)," ","")&
            IF(remainder=0,"",wordTwo(remainder))
        )
    )
),

negativeAmount,amount<0,
totalPaisa,ROUND(ABS(amount)*100,0),

takaAmount,QUOTIENT(totalPaisa,100),
paisaAmount,MOD(totalPaisa,100),

croreAmount,INT(takaAmount/10000000),
remainderCrore,MOD(takaAmount,10000000),

lakhAmount,INT(remainderCrore/100000),
remainderLakh,MOD(remainderCrore,100000),

thousandAmount,INT(remainderLakh/1000),
balanceAmount,MOD(remainderLakh,1000),

takaText,TRIM(
    IF(croreAmount>0,wordThree(croreAmount)&" কোটি ","")&
    IF(lakhAmount>0,wordThree(lakhAmount)&" লাখ ","")&
    IF(thousandAmount>0,wordThree(thousandAmount)&" হাজার ","")&
    IF(balanceAmount>0,wordThree(balanceAmount),"")
),

paisaText,
IF(
    paisaAmount=0,
    "",
    " এবং "&wordTwo(paisaAmount)&" পয়সা"
),

signText,
IF(negativeAmount,"ঋণাত্মক ",""),

IF(
    takaAmount=0,
    signText&
    "শূন্য টাকা"&
    IF(
        paisaAmount=0,
        " মাত্র",
        paisaText&" মাত্র"
    ),

    signText&
    takaText&
    " টাকা"&
    IF(
        paisaAmount=0,
        " মাত্র",
        paisaText&" মাত্র"
    )
)
)
```

As with the English version, change:

```excel
amount,A1,
```

to the appropriate cell reference if necessary.

For example:

```excel
amount,G13,
```

---

## Bangla Examples

| Amount | Output |
|---:|---|
| `100` | একশ টাকা মাত্র |
| `1250` | এক হাজার দুইশ পঞ্চাশ টাকা মাত্র |
| `55000` | পঞ্চান্ন হাজার টাকা মাত্র |
| `125000` | এক লাখ পঁচিশ হাজার টাকা মাত্র |
| `10000000` | এক কোটি টাকা মাত্র |
| `19966612.24` | এক কোটি নিরানব্বই লাখ ছেষট্টি হাজার ছয়শ বারো টাকা এবং চব্বিশ পয়সা মাত্র |
| `0.75` | শূন্য টাকা এবং পঁচাত্তর পয়সা মাত্র |
| `-1250.50` | ঋণাত্মক এক হাজার দুইশ পঞ্চাশ টাকা এবং পঞ্চাশ পয়সা মাত্র |

The Bangla formula intentionally uses natural Bangla constructions.

For example:

```text
612
```

is written as:

```text
ছয়শ বারো
```

rather than attempting to translate the English phrase "Six Hundred and Twelve" literally.

Similarly:

```text
55,000
```

becomes:

```text
পঞ্চান্ন হাজার
```

---

# 5. Putting Everything Together

Suppose `A1` contains:

```text
19966612.24
```

Using the custom number format:

```text
[>9999999]"৳ "0","00","00","000.00;[>99999]"৳ "#0","00","000.00;"৳ "#,##0.00
```

Excel displays the amount as:

```text
৳ 1,99,66,612.24
```

The English formula can display:

```text
One Crore Ninety-Nine Lakh Sixty-Six Thousand Six Hundred and Twelve Taka and Twenty-Four Paisa Only
```

while the Bangla formula can display:

```text
এক কোটি নিরানব্বই লাখ ছেষট্টি হাজার ছয়শ বারো টাকা এবং চব্বিশ পয়সা মাত্র
```

A worksheet could therefore contain:

```text
Amount:
৳ 1,99,66,612.24

Amount in Words:
One Crore Ninety-Nine Lakh Sixty-Six Thousand
Six Hundred and Twelve Taka and Twenty-Four Paisa Only

কথায়:
এক কোটি নিরানব্বই লাখ ছেষট্টি হাজার
ছয়শ বারো টাকা এবং চব্বিশ পয়সা মাত্র
```

This is particularly useful for:

- invoices,
- bills,
- payment certificates,
- purchase orders,
- budgets,
- financial statements,
- audit documents,
- vouchers, and
- other official financial records.

---

# Formula Limits

The formulas in this post use the following Bangladeshi units:

- Crore
- Lakh
- Thousand
- Hundred
- Taka
- Paisa

The Crore component is handled as a value from 1 to 999. Therefore, the formulas are intended for amounts below:

```text
1,000 Crore
```

or:

```text
10,00,00,00,000 Taka
```

For typical invoices, budgets, accounting documents, and institutional financial records, this range is generally more than sufficient.

If still larger values are required, the formulas can be extended with units such as **Arab** and **Kharab**.

---

# A Note on Bangla Number Spellings

Some Bangla number words have more than one spelling in common usage.

The Bangla formula above uses one consistent set of spellings. Because all words from 0 to 99 appear explicitly inside the `CHOOSE()` function, individual spellings can easily be changed if a particular institutional or editorial convention is preferred.

For example, changing one entry in the list changes that spelling everywhere the formula is used.

---

# Conclusion

Excel can be adapted quite effectively for Bangladeshi financial documents without using VBA.

With Custom Number Formats, a value such as:

```text
19966612.24
```

can be displayed as:

```text
৳ 1,99,66,612.24
```

while remaining a normal numeric value that can still be used in calculations.

Using `LET` and `LAMBDA`, the same value can also be converted directly into English:

```text
One Crore Ninety-Nine Lakh Sixty-Six Thousand Six Hundred and Twelve Taka and Twenty-Four Paisa Only
```

or Bangla:

```text
এক কোটি নিরানব্বই লাখ ছেষট্টি হাজার ছয়শ বারো টাকা এবং চব্বিশ পয়সা মাত্র
```

The entire solution is formula-based and requires no VBA, macros, or external add-ins.

*This post was written with assistance from ChatGPT.*
