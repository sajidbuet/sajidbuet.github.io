# How to Enable Amount-in-Words (Taka & Paisa) in Microsoft Excel

### (Bangladesh Crore--Lakh Format \| No VBA \| Formula-Only Solution)

Microsoft Excel does not natively provide a built-in **"Amount in
Words"** function for currency. However, using modern Excel functions
like `LAMBDA` and `LET`, we can create a reusable formula that converts
numbers into words in **Bangladeshi number format
(Crore--Lakh--Thousand)** --- including **Taka and Paisa**.

This guide shows how to enable it step-by-step using **only worksheet
formulas** (no VBA, no macros).

------------------------------------------------------------------------

## Requirements

-   Excel 365 / Excel 2021 or later\
-   `LAMBDA` function support

Test LAMBDA support:

``` excel
=LAMBDA(x,x)(1)
```

If it returns `1`, your Excel supports LAMBDA.

------------------------------------------------------------------------

# Step 1 --- Create the Word2 Function (0--99)

Go to:

**Formulas → Name Manager → New**

-   **Name:** `Word2`
-   **Scope:** Workbook
-   **Refers to:**

``` excel
=LAMBDA(n,
LET(
x,INT(n),
u,LAMBDA(k,CHOOSE(k+1,"Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen")),
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
)
```

------------------------------------------------------------------------

# Step 2 --- Create the Word3 Function (0--999)

-   **Name:** `Word3`
-   **Scope:** Workbook
-   **Refers to:**

``` excel
=LAMBDA(n,
LET(
x,INT(n),
h,INT(x/100),
r,MOD(x,100),
TRIM(
IF(h=0,"",Word2(h)&" Hundred")&
IF(AND(h>0,r>0)," and ","")&
IF(r=0,"",Word2(r))
)
)
)
```

------------------------------------------------------------------------

# Step 3 --- Create the Main Function: BDTWORDS (Taka + Paisa)

-   **Name:** `BDTWORDS`
-   **Scope:** Workbook
-   **Refers to:**

``` excel
=LAMBDA(amount,
LET(
neg,amount<0,
a,ABS(amount),
tk,INT(a),
ps,ROUND(MOD(a,1)*100,0),

cro,INT(tk/10000000),
rem,MOD(tk,10000000),
lak,INT(rem/100000),
remb,MOD(rem,100000),
tho,INT(remb/1000),
bal,MOD(remb,1000),

takaTxt,TRIM(
IF(cro>0,Word3(cro)&" Crore ","")&
IF(lak>0,Word3(lak)&" Lakh ","")&
IF(tho>0,Word3(tho)&" Thousand ","")&
IF(bal>0,Word3(bal),"")
),

paisaTxt,IF(ps=0,""," and "&Word2(ps)&" Paisa"),
sign,IF(neg,"Minus ",""),

IF(tk=0,
sign&"Zero Taka"&IF(ps=0," Only",paisaTxt&" Only"),
sign&takaTxt&" Taka"&IF(ps=0," Only",paisaTxt&" Only")
)
)
)
```

------------------------------------------------------------------------

# How to Use

If the amount is in cell `A1`:

``` excel
=BDTWORDS(A1)
```

------------------------------------------------------------------------

# Example Outputs

-   `19966612.24` → One Crore Ninety-Nine Lakh Sixty-Six Thousand Six
    Hundred and Twelve Taka and Twenty-Four Paisa Only\
-   `100.00` → One Hundred Taka Only\
-   `0.75` → Zero Taka and Seventy-Five Paisa Only\
-   `-12.50` → Minus Twelve Taka and Fifty Paisa Only

------------------------------------------------------------------------

# Conclusion

You now have a reusable, macro-free **Amount in Words feature** inside
Excel using only modern formulas.\
This is ideal for financial documents, invoices, budgets, audit sheets,
and reporting.

*This post was written using Chatgpt*