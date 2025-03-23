---
Title: Paper Revision in Overleaf
Placing: 7
icon: users
description: List of tips, tricks and functions to use Excel
date: '2024-07-07'
Template: blog
---

### Intro
With microsoft word, it is extremely easy to turn on review mode and add comments, strike out letters and add text, and it is automatically colored. With LaTeX, it is somewhat difficult. My students use two different Overleaf files, one having the edits marked in red and strikeout, and one fresh archive. Doing the same work twice is a hassle, so here I describe a method of LaTeX editing, where you can simply switch between "red-lined" version that journal wants, and your final production version. 

### Method

In your main.tex file, you need to have these lines
```latex
\definecolor{omittext}{RGB}{255,0,0}  %R1: for red version
%\definecolor{omittext}{RGB}{0,0,0}  %B1: for black version

\newcommand{\strikeout}[1]{\textcolor{omittext}{\sout{#1}}\xspace} %R2
%\newcommand{\strikeout}[1]{\unskip\ignorespaces}  %B2
\newcommand{\newtext}[1]{\textcolor{omittext}{#1}} %R3 
```
During editing latex, if you want to include a new line or word, simple use the command `\newtext{}`. For omiting words, include them inside the `\strikeout{}` command For example:

```latex
Nature, through billions of years of evolution, has often provided unique but elegant designs and structures that have \strikeout{inspired} \newtext{aided} researchers and engineers to invent new technologies to enhance the capabilities of existing ones. 
```
Just do all revisions in your manuscript as before. 

For creating the red lined verson, comment the B1, B2 line, and uncomment R1, R2, R3. (Shown above).
This would render the text like this:

Nature, through billions of years of evolution, has often provided unique but elegant designs and structures that have <span style="color:red"><del>inspired</del> aided</span> researchers and engineers to invent new technologies to enhance the capabilities of existing ones. 

For creating final PDF, uncomment the B1, B2 line, and comment R1, R2, R3. (Shown above).
```latex
%\definecolor{omittext}{RGB}{255,0,0}  %R1: for red version
\definecolor{omittext}{RGB}{0,0,0}  %B1: for black version

%\newcommand{\strikeout}[1]{\textcolor{omittext}{\sout{#1}}\xspace} %R2
\newcommand{\strikeout}[1]{\unskip\ignorespaces}  %B2
%\newcommand{\newtext}[1]{\textcolor{omittext}{#1}} %R3 
```

N.B. These commands were first used in preparing revision for the paper Mehedi Hasan Himel, Bejoy Sikder, Tanvir Ahmed, **Sajid Muhaimin Choudhury**, "Biomimicry in Nanotechnology: A Comprehensive Review", [NanoScale Advances 5, 595-614, (2023)](https://doi.org/10.1039/D2NA00571A) 